import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import crypto from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { sha256 } from '../api/_workspace.mjs';

function snapshot(overrides = {}) {
  const first = {
    analysis_id: 'fuECuGW_Eeo:aaaaaaaaaaaa',
    video_id: 'fuECuGW_Eeo',
    video_url: 'https://www.youtube.com/watch?v=fuECuGW_Eeo',
    title: 'Evidence-backed video',
    channel: 'Example channel',
    duration_seconds: 3318,
    evidence_sha256: 'a'.repeat(64),
    coverage: 'HIGH',
    visual_pending: false,
    analyzed_at: '2026-10-12T12:00:00.000Z',
    summary: 'A bounded summary of the video evidence.',
    findings: [{ id: 'fuECuGW_Eeo:aaaaaaaaaaaa:f1', text: 'The source supports the claim.', evidence_basis: 'Timestamped transcript segment.', confidence: 0.9 }],
    ecosystem_relevance: [{ workstream: 'ASHWOOD', rationale: 'Useful editorial signal.', risk: 'Needs current verification.' }],
    candidate_actions: [{ id: 'fuECuGW_Eeo:aaaaaaaaaaaa:a1', action: 'Review the current company source.', why: 'The video may be stale.' }],
    limitations: ['The analysis does not establish live product behavior.'],
  };
  const items = overrides.items || [first];
  return {
    schema_version: 1,
    source_system: 'agent-os',
    kind: 'youtube-analyses',
    snapshot_id: 'youtube-analyses:abc123def4567890',
    generated_at: '2026-10-12T12:01:00.000Z',
    item_count: items.length,
    items,
    ...overrides,
  };
}

async function fixture() {
  const db = new PGlite();
  const sql = async (strings, ...values) => (await db.query(
    strings.reduce((query, part, index) => query + (index ? `$${index}` : '') + part, ''), values,
  )).rows;
  const dependencies = {
    crypto,
    getSql: () => sql,
    json: (res, status, body) => { res.statusCode = status; res.body = body; },
    parseBody: req => typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}),
    requireSession: async req => req.owner ? { token: 'owner-session' } : null,
    sha256,
  };
  const source = (await readFile(new URL('../api/workspace-analyses.mjs', import.meta.url), 'utf8'))
    .replace(/^import .*;\n/gm, '')
    .replace('export default async function handler', 'async function handler');
  const handler = Function(...Object.keys(dependencies), `${source}\nreturn handler;`)(...Object.values(dependencies));
  async function call(req = {}) {
    const res = { headers: {}, setHeader(key, value) { this.headers[key] = value; }, end() {} };
    await handler({ method: 'GET', headers: {}, ...req }, res);
    return res;
  }
  return { db, call };
}

test('YouTube analysis snapshots require the board token and owner session', async t => {
  const f = await fixture(); t.after(() => f.db.close());
  const previous = process.env.WORKSPACE_BOARD_SYNC_TOKEN;
  process.env.WORKSPACE_BOARD_SYNC_TOKEN = 'board-secret';
  t.after(() => {
    if (previous === undefined) delete process.env.WORKSPACE_BOARD_SYNC_TOKEN;
    else process.env.WORKSPACE_BOARD_SYNC_TOKEN = previous;
  });

  const readDenied = await f.call({ owner: false });
  assert.equal(readDenied.statusCode, 401);
  const writeDenied = await f.call({ method: 'POST', body: snapshot() });
  assert.equal(writeDenied.statusCode, 401);
});

test('foreign and mismatched YouTube snapshots are rejected', async t => {
  const f = await fixture(); t.after(() => f.db.close());
  const previous = process.env.WORKSPACE_BOARD_SYNC_TOKEN;
  process.env.WORKSPACE_BOARD_SYNC_TOKEN = 'board-secret';
  t.after(() => {
    if (previous === undefined) delete process.env.WORKSPACE_BOARD_SYNC_TOKEN;
    else process.env.WORKSPACE_BOARD_SYNC_TOKEN = previous;
  });
  const headers = { authorization: 'Bearer board-secret' };
  const foreign = await f.call({ method: 'POST', headers, body: snapshot({ source_system: 'another-system' }) });
  assert.equal(foreign.statusCode, 400);
  const mismatched = await f.call({ method: 'POST', headers, body: snapshot({ item_count: 2 }) });
  assert.equal(mismatched.statusCode, 400);
  const malformed = await f.call({ method: 'POST', headers, body: '{not-json' });
  assert.equal(malformed.statusCode, 400);
});

test('the latest YouTube snapshot replaces the prior complete set', async t => {
  const f = await fixture(); t.after(() => f.db.close());
  const previous = process.env.WORKSPACE_BOARD_SYNC_TOKEN;
  process.env.WORKSPACE_BOARD_SYNC_TOKEN = 'board-secret';
  t.after(() => {
    if (previous === undefined) delete process.env.WORKSPACE_BOARD_SYNC_TOKEN;
    else process.env.WORKSPACE_BOARD_SYNC_TOKEN = previous;
  });
  const headers = { authorization: 'Bearer board-secret' };
  const first = await f.call({ method: 'POST', headers, body: snapshot() });
  assert.equal(first.statusCode, 200);

  const replacementItem = {
    ...snapshot().items[0],
    analysis_id: 'dQw4w9WgXcQ:def456abc123',
    video_id: 'dQw4w9WgXcQ',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    title: 'Replacement video',
    evidence_sha256: `def456abc123${'a'.repeat(52)}`,
    findings: [{ id: 'dQw4w9WgXcQ:def456abc123:f1', text: 'Replacement finding.', evidence_basis: 'Replacement evidence.', confidence: 0.8 }],
    candidate_actions: [{ id: 'dQw4w9WgXcQ:def456abc123:a1', action: 'Review the replacement source.', why: 'It is newer.' }],
  };
  const replacement = await f.call({
    method: 'POST', headers,
    body: snapshot({ snapshot_id: 'youtube-analyses:def456abc1237890', items: [replacementItem] }),
  });
  assert.equal(replacement.statusCode, 200);
  const read = await f.call({ owner: true });
  assert.equal(read.statusCode, 200);
  assert.equal(read.body.item_count, 1);
  assert.equal(read.body.snapshot_id, 'youtube-analyses:def456abc1237890');
  assert.equal(read.body.items[0].title, 'Replacement video');
});
