import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { aiZeroReviewItems, deploymentReviewTarget, deploymentSpecificReviewItems, workspaceCohesionReviewItems } from '../api/_review-targets.mjs';
import { REVIEW_ACTIVE_DAYS, splitReviewAttention } from '../api/_attention.mjs';

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
    aiZeroReviewItems, deploymentReviewTarget, deploymentSpecificReviewItems, workspaceCohesionReviewItems,
    REVIEW_ACTIVE_DAYS, splitReviewAttention, process,
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
  const targets = {
    'ws-workstreams': '/workspace/#workstreams-title',
    'ws-drop': '/workspace/#ashwood-drop',
    'ws-review': '/workspace/#music-intelligence',
    'ws-rights': '/workspace/#music-rights-ledger',
    'music-runtime': '/music/#ashwood-drop-music',
    'gate-open': '/ai-from-zero/build-gate/',
  };
  const ids = Object.keys(targets);
  for (const [id, target] of Object.entries(targets)) {
    assert.equal((await f.call(f.visit, { url: `/?item=${id}` })).headers.Location, target);
  }
  await f.call(f.visit, { url: '/?item=gate-open' });
  for (const id of ['home-motion', 'ws-meta', 'music-mobile', 'unknown', 'toString', 'https://example.com']) {
    assert.equal((await f.call(f.visit, { url: `/?item=${id}` })).headers.Location, '/workspace/v3-playtest/');
  }
  const state = (await f.get()).body;
  assert.deepEqual(state.completed_items.sort(), ids.sort());
  assert.equal(Object.keys(state.review_started).length, 6);
  assert.deepEqual(state.auto_items, []);
});

test('checklist UI links only objective visits; subjective checks remain manual', async () => {
  const source = await readFile(new URL('../workspace/review-links.js', import.meta.url), 'utf8');
  for (const id of ['ws-workstreams','ws-drop','ws-review','ws-rights','music-runtime','gate-open']) {
    assert.match(source, new RegExp(`['"]${id}['"]`));
  }
  for (const id of ['home-motion','ws-meta','ws-modes','music-mobile']) {
    assert.doesNotMatch(source, new RegExp(`['"]${id}['"]`));
  }
});

test('dynamic Workspace review anchors scroll into view after mounting', async () => {
  const drop = await readFile(new URL('../workspace/drop.js', import.meta.url), 'utf8');
  const rights = await readFile(new URL('../workspace/rights-ledger.js', import.meta.url), 'utf8');
  assert.match(drop, /location\.hash === '#music-intelligence'[\s\S]*section\.scrollIntoView\(\)/);
  assert.match(rights, /location\.hash === '#music-rights-ledger'[\s\S]*section\.scrollIntoView\(\)/);
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
  f.setFiles(['vercel.json', 'api/_review-targets.mjs', 'workspace/review-links.js', 'workspace/deployment-review.js']);
  assert.deepEqual((await f.get()).body.auto_items, []);
  f.setFiles(['music/index.html']);
  assert.equal((await f.get()).body.auto_items.length, 1);
});


test('Workspace cohesion production changes generate seven specific manual review checks plus the deployment item', async t => {
  const f = await fixture(); t.after(() => f.db.close());
  f.setFiles(['workspace/index.html', 'workspace/cohesion.css', 'workspace/views.mjs']);
  const state = (await f.get()).body;
  const checks = state.auto_items.filter(item => item.review_target === 'workspace-cohesion');
  assert.equal(checks.length, 7);
  assert.equal(new Set(checks.map(item => item.id)).size, 7);
  assert.ok(checks.some(item => item.id.endsWith('workspace-cohesion-today')));
  assert.ok(checks.some(item => item.id.endsWith('workspace-cohesion-regression')));
  assert.equal(state.auto_items.length, 8);
  assert.deepEqual(state.deployment_completed_items, []);
});

test('cohesion review UI links the feature checks back to the live Workspace', async () => {
  const source = await readFile(new URL('../workspace/deployment-review.js', import.meta.url), 'utf8');
  assert.match(source, /workspace-cohesion/);
  assert.match(source, /href=\"\/workspace\/\"/);
});


test('production review is primary and V3 baseline is preserved as history', async () => {
  const page = await readFile(new URL('../workspace/v3-playtest/index.html', import.meta.url), 'utf8');
  assert.match(page, /<title>Production Review — ASHWOOD Workspace<\/title>/);
  assert.match(page, /Review what changed\./);
  assert.match(page, /Historical V3 baseline/);
  assert.match(page, /preserved review evidence/);
  assert.doesNotMatch(page, /<h1 id="playtest-title">Play with V3\.<\/h1>/);
});

test('production queue has a useful empty state and separates reviewed history', async () => {
  const source = await readFile(new URL('../workspace/deployment-review.js', import.meta.url), 'utf8');
  assert.match(source, /Nothing waiting\./);
  assert.match(source, /Needs review/);
  assert.match(source, /Previously reviewed/);
  assert.match(source, /Only your explicit approval counts as reviewed/);
});


test('production review API exposes active, ignored, and archived attention buckets', async t => {
  const f = await fixture(); t.after(() => f.db.close());
  const state = (await f.get()).body;
  assert.equal(state.review_policy.active_days, REVIEW_ACTIVE_DAYS);
  assert.ok(state.deployment_attention);
  assert.equal(
    state.deployment_attention.active.length + state.deployment_attention.ignored.length + state.deployment_attention.archive.length,
    state.auto_items.length,
  );
});

test('production review UI removes aged items from the primary queue without deleting them', async () => {
  const source = await readFile(new URL('../workspace/deployment-review.js', import.meta.url), 'utf8');
  assert.match(source, /Not acted on/);
  assert.match(source, /Aged out after/);
  assert.match(source, /This is not approval/);
  assert.match(source, /Archive/);
});
