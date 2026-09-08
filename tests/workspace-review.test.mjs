import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { aiZeroReviewItems, deploymentReviewTarget } from '../api/_review-targets.mjs';

// Exercise the actual handlers and SQL against PostgreSQL in memory. Only session
// lookup and the GitHub commit response are substituted; no production data is used.
async function fixture(env = 'production') {
  const db = new PGlite();
  const sql = async (strings, ...values) => (await db.query(
    strings.reduce((query, part, index) => query + (index ? `$${index}` : '') + part, ''), values,
  )).rows;
  const process = { env: { VERCEL_ENV: env, VERCEL_GIT_COMMIT_SHA: 'a'.repeat(40) } };
  let files = ['ai-from-zero/index.html'];
  const dependencies = {
    getSql: () => sql, requireSession: async req => req.auth ? { token: 'test-owner' } : null,
    json: (res, status, body) => { res.statusCode = status; res.body = body; },
    parseBody: req => req.body || {}, sameOrigin: req => req.origin !== 'foreign',
    aiZeroReviewItems, deploymentReviewTarget, process,
    fetch: async () => ({ ok: true, json: async () => ({ files: files.map(filename => ({ filename })), commit: { message: 'AI from Zero appetite pass' } }) }),
  };
  async function handler(name) {
    const source = (await readFile(new URL(`../api/${name}.mjs`, import.meta.url), 'utf8'))
      .replace(/^import .*;\n/gm, '').replace('export default async function handler', 'async function handler');
    return Function(...Object.keys(dependencies), `${source}\nreturn handler;`)(...Object.values(dependencies));
  }
  const checklist = await handler('workspace-checklist');
  const visit = await handler('workspace-review-visit');
  async function call(fn, req = {}) {
    const res = { headers: {}, setHeader(key, value) { this.headers[key] = value; }, end() {} };
    await fn({ auth: true, method: 'GET', url: '/', ...req }, res);
    return res;
  }
  return { db, process, setFiles: value => { files = value; }, get: () => call(checklist),
    patch: body => call(checklist, { method: 'PATCH', body }), call, checklist, visit };
}

test('production generates eight distinct checks, visits stay pending, approval is explicit and release-specific', async t => {
  const f = await fixture(); t.after(() => f.db.close());
  let state = (await f.get()).body;
  const checks = state.auto_items.filter(item => item.review_target);
  assert.equal(checks.length, 8);
  assert.equal(new Set(checks.map(item => item.id)).size, 8);
  assert.equal(state.deployment_completed_items.length, 0);
  assert.match(checks.find(item => item.id.endsWith('-links')).label, /Continuity \/ Reference \/ Build Gate \/ Build Journal/);
  for (const item of checks) {
    const response = await f.call(f.visit, { url: `/?item=${encodeURIComponent(item.id)}` });
    assert.equal(response.headers.Location, '/ai-from-zero/');
  }
  state = (await f.get()).body;
  assert.equal(Object.keys(state.review_started).length, 8);
  assert.deepEqual(state.completed_items, []);
  assert.deepEqual(state.deployment_completed_items, []);
  const firstVisit = state.review_started[checks[0].id];
  await f.call(f.visit, { url: `/?item=${checks[0].id}` });
  await f.patch({ scope: 'deployment', deployment_completed_items: [checks[0].id], deployment_notes: { [checks[0].id]: 'Owner checked desktop' } });
  state = (await f.get()).body;
  assert.deepEqual(state.deployment_completed_items, [checks[0].id]);
  assert.equal(state.review_started[checks[0].id], firstVisit);
  await f.patch({ completed_items: ['home-nav'], notes: { 'home-nav': 'Preserve me' }, review_started: {} });
  await f.call(f.visit, { url: `/?item=${checks[0].id}` });
  state = (await f.get()).body;
  assert.equal(state.notes['home-nav'], 'Preserve me');
  assert.equal(state.deployment_notes[checks[0].id], 'Owner checked desktop');
  assert.deepEqual(state.deployment_completed_items, [checks[0].id]);
  assert.equal(state.review_started[checks[0].id], firstVisit);
  assert.equal(state.auto_items.length, 9);
  f.process.env.VERCEL_GIT_COMMIT_SHA = 'b'.repeat(40);
  state = (await f.get()).body;
  assert.equal(state.auto_items.length, 18);
  assert.deepEqual(state.deployment_completed_items, [checks[0].id]);
});

test('all six legacy objective visits auto-complete; judgments and unknown targets do not', async t => {
  const f = await fixture('preview'); t.after(() => f.db.close());
  const ids = ['ws-workstreams','ws-drop','ws-review','ws-rights','music-runtime','gate-open'];
  await Promise.all(ids.map(id => f.call(f.visit, { url: `/?item=${id}` })));
  await f.call(f.visit, { url: '/?item=gate-open' });
  await f.call(f.visit, { url: '/?item=home-motion' });
  for (const id of ['unknown', 'toString', 'https://example.com']) {
    assert.equal((await f.call(f.visit, { url: `/?item=${id}` })).headers.Location, '/workspace/v3-playtest/');
  }
  const state = (await f.get()).body;
  assert.deepEqual(state.completed_items.sort(), ids.sort());
  assert.equal(Object.keys(state.review_started).length, 7);
  assert.ok(state.review_started['home-motion']);
  assert.deepEqual(state.auto_items, []);
});

test('unauthenticated visits and foreign approval requests cannot write owner progress', async t => {
  const f = await fixture(); t.after(() => f.db.close());
  assert.equal((await f.call(f.checklist, { auth: false })).statusCode, 401);
  const response = await f.call(f.visit, { auth: false, url: '/?item=gate-open' });
  assert.equal(response.headers.Location, '/workspace/?review_return=gate-open');
  assert.equal((await f.call(f.visit, { method: 'POST' })).statusCode, 405);
  assert.equal((await f.call(f.checklist, { method: 'PATCH', origin: 'foreign', body: { completed_items: ['home-motion'] } })).statusCode, 403);
  const state = (await f.get()).body;
  assert.deepEqual(state.review_started, {});
  assert.deepEqual(state.completed_items, []);
});

test('existing schema and deployment records acquire visit state and missing AI checks without losing approval', async t => {
  const f = await fixture(); t.after(() => f.db.close());
  await f.db.exec(`CREATE TABLE workspace_checklists (checklist_id TEXT PRIMARY KEY, completed_items JSONB NOT NULL DEFAULT '[]', notes JSONB NOT NULL DEFAULT '{}', auto_items JSONB NOT NULL DEFAULT '[]', deployment_completed_items JSONB NOT NULL DEFAULT '[]', deployment_notes JSONB NOT NULL DEFAULT '{}', updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  const id = `deploy:${'a'.repeat(40)}`;
  await f.db.query('INSERT INTO workspace_checklists (checklist_id, auto_items, deployment_completed_items) VALUES ($1, $2, $3)', ['v3-playtest-2026-09-08', JSON.stringify([{ id, files: ['ai-from-zero/index.html'] }]), JSON.stringify([id])]);
  const state = (await f.get()).body;
  assert.equal(state.auto_items.length, 9);
  assert.deepEqual(state.deployment_completed_items, [id]);
  assert.deepEqual(state.review_started, {});
});

test('unrelated production changes do not create appetite checks; review-system changes create no queue noise', async t => {
  const f = await fixture(); t.after(() => f.db.close());
  f.setFiles(['api/_review-targets.mjs', 'workspace/review-links.js', 'workspace/deployment-review.js']);
  assert.deepEqual((await f.get()).body.auto_items, []);
  f.setFiles(['music/index.html']);
  assert.equal((await f.get()).body.auto_items.length, 1);
});
