import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { cleanContextSnapshot, cleanText } from '../api/_workspace-context-clean.mjs';
import { profileFrom, snapshotBody } from '../scripts/sync-alvira-context.mjs';

const body = {
  source: 'alvira',
  context_id: 'alvira:fixture-profile',
  topic: 'TK — Ashwood second brain',
  domains: [
    { id: 'goals', label: 'Goals', answers: ['One central Context record.', '[SENSITIVE — money] Savings run out in March.'] },
    { id: 'constraints', label: 'Constraints', answers: ['[withheld: sensitive — ask with include_sensitive only when the task needs it]', 'Export at https://files.example.com/x?access_token=SECRET9 weekly.'] },
    { id: 'empty', label: 'Empty', answers: [] },
  ],
  goal_spec: { fields: { goal: { value: 'One central Context record.', basis: 'interview' }, people: { value: null, basis: 'interview' }, bogus: { value: 'x' }, done: { value: '[SENSITIVE] hidden' } } },
  sources: [
    { type: 'website', label: 'ALVIRA', locator: 'https://alviratech.vercel.app', status: 'ready' },
    { type: 'website', label: 'Signed', locator: 'https://files.example.com/a?sig=ABC' },
    { type: 'website', label: 'Plain http', locator: 'http://example.com' },
  ],
  provenance: { actor_type: 'agent', actor_id: 'claude-code-opus-5.5', delegated: true },
};

test('a released snapshot keeps owner-released content and drops sensitive items and credentials', () => {
  const snap = cleanContextSnapshot(body);
  const text = JSON.stringify(snap);
  assert.equal(snap.context_id, 'alvira:fixture-profile');
  assert.deepEqual(snap.domains.map(d => [d.id, d.answers.length]), [['goals', 1], ['constraints', 1]]);
  assert.ok(!text.includes('Savings'));
  assert.ok(!text.includes('SECRET9'));
  assert.ok(text.includes('[link removed: it carried a credential]'));
  assert.deepEqual(Object.keys(snap.goal_spec.fields), ['goal', 'people']);
  assert.equal(snap.goal_spec.fields.people.value, null);
  assert.deepEqual(snap.sources.map(s => s.label), ['ALVIRA']);
  assert.deepEqual(snap.provenance, { actor_type: 'agent', actor_id: 'claude-code-opus-5.5', delegated: true });
  assert.equal(snap.environment, 'test');
  assert.match(snap.content_hash, /^[0-9a-f]{64}$/);
});

test('unusable or foreign snapshots are refused', () => {
  assert.equal(cleanContextSnapshot({ ...body, source: 'other' }), null);
  assert.equal(cleanContextSnapshot({ ...body, context_id: 'has spaces' }), null);
  assert.equal(cleanContextSnapshot({ ...body, domains: [{ id: 'x', answers: ['[SENSITIVE] only'] }], goal_spec: null }), null);
  assert.equal(cleanText('[SENSITIVE] a', 100), '');
});

test('a sensitive topic is replaced', () => {
  assert.equal(cleanContextSnapshot({ ...body, topic: '[SENSITIVE] private' }).topic, 'ALVIRA Context');
});

test('the sync script leaves out raw Links & sources answers and unconfirmed links', () => {
  const profile = profileFrom({ result: { structuredContent: { profile: {
    id: 'fixture-profile', topic: 'T', updated_at: '2026-10-15T23:35:55Z',
    state: {
      domains: { goals: { answers: ['G'] }, sources: { answers: ['Provided: [link held for owner review]'] } },
      contextSources: [
        { status: 'ready', type: 'website', label: 'A', locator: 'https://alviratech.vercel.app' },
        { status: 'needs-review', type: 'website', label: 'P', locator: 'https://docs.google.com/document/d/PRIV1/edit' },
      ],
    },
  } } } });
  const out = snapshotBody(profile);
  assert.deepEqual(out.domains.map(d => d.id), ['goals']);
  assert.deepEqual(out.sources.map(s => s.label), ['A']);
  assert.equal(out.context_id, 'alvira:fixture-profile');
  assert.ok(!JSON.stringify(cleanContextSnapshot(out)).includes('PRIV1'));
});

function mockRes() {
  const res = { statusCode: 0, headers: {}, body: '' };
  res.status = code => { res.statusCode = code; return res; };
  res.setHeader = (k, v) => { res.headers[k] = v; return res; };
  res.end = text => { res.body = text; };
  return res;
}

test('writes need the sync token and reads need the owner session', async () => {
  const { contextHandler } = await import('../api/_workspace-context-handler.mjs');
  const saved = process.env.WORKSPACE_CONTEXT_SYNC_TOKEN;
  process.env.WORKSPACE_CONTEXT_SYNC_TOKEN = 'right-token';
  try {
    const noToken = mockRes();
    await contextHandler({ method: 'POST', headers: {}, body }, noToken);
    assert.equal(noToken.statusCode, 401);
    const wrong = mockRes();
    await contextHandler({ method: 'POST', headers: { authorization: 'Bearer wrong-token' }, body }, wrong);
    assert.equal(wrong.statusCode, 401);
    const read = mockRes();
    await contextHandler({ method: 'GET', headers: {} }, read);
    assert.equal(read.statusCode, 401);
  } finally {
    if (saved === undefined) delete process.env.WORKSPACE_CONTEXT_SYNC_TOKEN; else process.env.WORKSPACE_CONTEXT_SYNC_TOKEN = saved;
  }
});

test('the context endpoint is routed through the shared workspace function', async () => {
  const router = await readFile(new URL('../api/workspace-agentos.mjs', import.meta.url), 'utf8');
  assert.match(router, /if\(view==='context'\) return contextHandler\(req,res\);/);
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
  assert.ok(config.rewrites.some(r => r.source === '/api/workspace-context' && r.destination.includes('view=context')));
});

test('the server stores only owner-confirmed sources, never ones awaiting review or marked sensitive (Codex review of 1992f9f)', () => {
  const snap = cleanContextSnapshot({ ...body, sources: [
    { type: 'website', label: 'Confirmed', locator: 'https://alviratech.vercel.app', status: 'ready' },
    { type: 'website', label: 'Private doc', locator: 'https://docs.google.com/document/d/PRIVATE/edit', status: 'needs-review' },
    { type: 'website', label: 'No status', locator: 'https://example.com/nostatus' },
    { type: 'website', label: 'Marked', locator: 'https://example.com/path-[SENSITIVE]-x', status: 'ready' },
    { type: 'website', label: 'Encoded', locator: 'https://example.com/%5BSENSITIVE%5D-x', status: 'ready' },
    { type: 'website', label: '[withheld: sensitive — ask]', locator: 'https://example.com/withheld-label', status: 'ready' },
  ] });
  const text = JSON.stringify(snap.sources);
  assert.deepEqual(snap.sources.map(s => s.label), ['Confirmed']);
  for (const bad of ['PRIVATE', 'nostatus', 'SENSITIVE', 'withheld-label']) assert.ok(!text.includes(bad), bad);
});

test('context sync accepts the same token chain as the source registry (context, then source, then board)', async () => {
  const { contextSyncAuthorized } = await import('../api/_workspace-context-handler.mjs');
  const keys = ['WORKSPACE_CONTEXT_SYNC_TOKEN', 'WORKSPACE_SOURCE_SYNC_TOKEN', 'WORKSPACE_BOARD_SYNC_TOKEN'];
  const saved = Object.fromEntries(keys.map(k => [k, process.env[k]]));
  try {
    for (const k of keys) delete process.env[k];
    process.env.WORKSPACE_BOARD_SYNC_TOKEN = 'board-only';
    assert.equal(contextSyncAuthorized({ headers: { authorization: 'Bearer board-only' } }), true);
    assert.equal(contextSyncAuthorized({ headers: { authorization: 'Bearer wrong' } }), false);
    process.env.WORKSPACE_SOURCE_SYNC_TOKEN = 'source';
    assert.equal(contextSyncAuthorized({ headers: { authorization: 'Bearer board-only' } }), false);
    assert.equal(contextSyncAuthorized({ headers: { authorization: 'Bearer source' } }), true);
    for (const k of keys) delete process.env[k];
    assert.equal(contextSyncAuthorized({ headers: { authorization: 'Bearer anything' } }), false);
  } finally {
    for (const k of keys) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }
  }
});
