import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import crypto from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { sha256 } from '../api/_workspace.mjs';
import { SIGNAL_ACTIVE_DAYS, monitoringSummary, splitSignalAttention } from '../api/_attention.mjs';

async function fixture() {
  const db = new PGlite();
  const sql = async (strings, ...values) => (await db.query(
    strings.reduce((query, part, index) => query + (index ? `$${index}` : '') + part, ''), values,
  )).rows;

  const dependencies = {
    crypto,
    getSql: () => sql,
    json: (res, status, body) => { res.statusCode = status; res.body = body; },
    parseBody: req => req.body || {},
    requireSession: async req => req.owner ? { token: 'owner-session' } : null,
    sameOrigin: req => req.origin !== 'foreign',
    sha256,
    SIGNAL_ACTIVE_DAYS,
    monitoringSummary,
    splitSignalAttention,
  };

  const source = (await readFile(new URL('../api/workspace-state.mjs', import.meta.url), 'utf8'))
    .replace(/^import .*;\n/gm, '')
    .replace('export default async function handler', 'async function handler');
  const handler = Function(...Object.keys(dependencies), `${source}\nreturn handler;`)(...Object.values(dependencies));

  async function call(req = {}) {
    const res = { headers: {}, setHeader(key, value) { this.headers[key] = value; }, end() {} };
    await handler({ method: 'GET', headers: {}, query: {}, ...req }, res);
    return res;
  }
  return { db, sql, call };
}


async function createEvidenceTable(sql) {
  await sql`CREATE TABLE workspace_evidence (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    source_label TEXT,
    title TEXT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL,
    goal_id TEXT,
    secondary_goals JSONB,
    confidence DOUBLE PRECISION,
    url TEXT,
    notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
}

test('owner command is durably queued and visible to the owner', async t => {
  const f = await fixture(); t.after(() => f.db.close());
  const previous = process.env.WORKSPACE_COMMAND_SYNC_TOKEN;
  process.env.WORKSPACE_COMMAND_SYNC_TOKEN = 'runtime-secret';
  t.after(() => {
    if (previous === undefined) delete process.env.WORKSPACE_COMMAND_SYNC_TOKEN;
    else process.env.WORKSPACE_COMMAND_SYNC_TOKEN = previous;
  });

  const submitted = await f.call({
    method: 'POST',
    owner: true,
    body: { action: 'submit_command', command: 'Get the ALVIRA investor page ready for outreach' },
  });
  assert.equal(submitted.statusCode, 201);
  assert.equal(submitted.body.status, 'queued');

  const visible = await f.call({ owner: true, query: { view: 'commands' } });
  assert.equal(visible.statusCode, 200);
  assert.equal(visible.body.commands.length, 1);
  assert.equal(visible.body.commands[0].command_text, 'Get the ALVIRA investor page ready for outreach');
  assert.equal(visible.body.commands[0].status, 'queued');
  assert.equal(visible.body.commands[0].command_kind, 'owner_command');
  assert.equal(visible.body.commands[0].payload.schema, 'workspace.owner-command/v1');
  assert.equal(visible.body.commands[0].payload.thread_id, 'operator:primary');
  assert.equal(visible.body.commands[0].payload.surface, 'operator');
});

test('runtime can claim a command without receiving the owner browser session', async t => {
  const f = await fixture(); t.after(() => f.db.close());
  const previous = process.env.WORKSPACE_COMMAND_SYNC_TOKEN;
  process.env.WORKSPACE_COMMAND_SYNC_TOKEN = 'runtime-secret';
  t.after(() => {
    if (previous === undefined) delete process.env.WORKSPACE_COMMAND_SYNC_TOKEN;
    else process.env.WORKSPACE_COMMAND_SYNC_TOKEN = previous;
  });

  await f.call({
    method: 'POST',
    owner: true,
    body: { action: 'submit_command', command: 'Do bounded work' },
  });
  const claimed = await f.call({
    query: { view: 'command-next' },
    headers: { authorization: 'Bearer runtime-secret' },
  });
  assert.equal(claimed.statusCode, 200);
  assert.equal(claimed.body.command.command_text, 'Do bounded work');
  assert.equal(claimed.body.command.status, 'claimed');

  const second = await f.call({
    query: { view: 'command-next' },
    headers: { authorization: 'Bearer runtime-secret' },
  });
  assert.equal(second.body.command, null, 'a live lease prevents duplicate claims');
});

test('runtime status projection is machine-authenticated and fails closed for a bad token', async t => {
  const f = await fixture(); t.after(() => f.db.close());
  const previous = process.env.WORKSPACE_COMMAND_SYNC_TOKEN;
  process.env.WORKSPACE_COMMAND_SYNC_TOKEN = 'runtime-secret';
  t.after(() => {
    if (previous === undefined) delete process.env.WORKSPACE_COMMAND_SYNC_TOKEN;
    else process.env.WORKSPACE_COMMAND_SYNC_TOKEN = previous;
  });

  const submitted = await f.call({
    method: 'POST',
    owner: true,
    body: { action: 'submit_command', command: 'Route this safely' },
  });
  const id = submitted.body.id;

  const denied = await f.call({
    method: 'POST',
    headers: { authorization: 'Bearer wrong' },
    body: { action: 'command_runtime_update', id, status: 'routing' },
  });
  assert.equal(denied.statusCode, 403);

  const updated = await f.call({
    method: 'POST',
    headers: { authorization: 'Bearer runtime-secret' },
    body: {
      action: 'command_runtime_update',
      id,
      status: 'governance_denied',
      runtime_directive_id: '9',
      governance: { outcome: 'DENY', reason: 'out of scope' },
    },
  });
  assert.equal(updated.statusCode, 200);

  const visible = await f.call({ owner: true, query: { view: 'commands' } });
  assert.equal(visible.body.commands[0].status, 'governance_denied');
  assert.equal(visible.body.commands[0].runtime_directive_id, '9');
  assert.equal(visible.body.commands[0].governance.outcome, 'DENY');
});

test('foreign-origin browser command submission is rejected', async t => {
  const f = await fixture(); t.after(() => f.db.close());
  const res = await f.call({
    method: 'POST',
    owner: true,
    origin: 'foreign',
    body: { action: 'submit_command', command: 'Do not accept this' },
  });
  assert.equal(res.statusCode, 403);
});




test('sandbox change requests enter the primary Operator thread with version lineage', async t => {
  const f = await fixture(); t.after(() => f.db.close());
  const body = {
    action:'submit_sandbox_change_request',
    product_key:'ashwood',
    sandbox_url:'https://mighty-yoga-pgph.here.now/',
    version_id:'version-1',
    source_ref:'abc123',
    change_id:'gravity-instinct',
    request_text:'Make the black hole clearer on small iPhones.',
  };
  const first = await f.call({ method:'POST', owner:true, body });
  assert.equal(first.statusCode, 202);
  assert.equal(first.body.thread_id, 'operator:primary');

  const visible = await f.call({ owner:true, query:{ view:'commands' } });
  const row = visible.body.commands.find(item => item.id === first.body.id);
  assert.equal(row.command_kind, 'owner_command');
  assert.equal(row.payload.schema, 'workspace.sandbox-change-request/v1');
  assert.equal(row.payload.thread_id, 'operator:primary');
  assert.equal(row.payload.change_id, 'gravity-instinct');
  assert.match(row.command_text, /do not infer production deployment authority/i);
});

test('owner decisions are durably queued, deduped, and bound to the observed review card', async t => {
  const f = await fixture(); t.after(() => f.db.close());
  const body = {
    action:'submit_owner_decision',
    task_id:'task-7',
    card_id:'card-7',
    decision:'approve',
    observed_snapshot:'snap-7',
  };
  const first = await f.call({ method:'POST', owner:true, body });
  assert.equal(first.statusCode, 202);
  assert.equal(first.body.status, 'queued');

  const duplicate = await f.call({ method:'POST', owner:true, body });
  assert.equal(duplicate.statusCode, 200);
  assert.equal(duplicate.body.existing, true);

  const visible = await f.call({ owner:true, query:{ view:'commands' } });
  const row = visible.body.commands.find(item => item.id === first.body.id);
  assert.equal(row.command_kind, 'owner_decision');
  assert.equal(row.payload.schema, 'workspace.owner-decision/v1');
  assert.equal(row.payload.task_id, 'task-7');
  assert.equal(row.payload.card_id, 'card-7');
  assert.equal(row.payload.observed_snapshot, 'snap-7');
});

test('Kanban transition is durably queued, deduped, and queryable after a new request', async t => {
  const f = await fixture(); t.after(() => f.db.close());
  const body = {
    action:'submit_kanban_transition',
    task_id:'task-1',
    work_id:'work-1',
    observed_state:'FAILED',
    observed_generation:2,
    target_state:'READY',
    idempotency_key:'drag-1',
  };
  const first = await f.call({ method:'POST', owner:true, body });
  assert.equal(first.statusCode, 202);
  assert.equal(first.body.status, 'queued');

  const duplicate = await f.call({ method:'POST', owner:true, body });
  assert.equal(duplicate.statusCode, 200);
  assert.equal(duplicate.body.existing, true);
  assert.equal(duplicate.body.transition.id, first.body.id);

  const visible = await f.call({
    owner:true,
    query:{ view:'kanban-transition', id:first.body.id },
  });
  assert.equal(visible.statusCode, 200);
  assert.equal(visible.body.transition.status, 'queued');
  assert.equal(visible.body.transition.payload.schema, 'workspace.kanban-transition/v1');
  assert.equal(visible.body.transition.payload.observed_generation, 2);
});

test('Kanban transition rejects incomplete or non-integer observed state', async t => {
  const f = await fixture(); t.after(() => f.db.close());
  const res = await f.call({
    method:'POST', owner:true,
    body:{
      action:'submit_kanban_transition',
      task_id:'task-1', work_id:'work-1',
      observed_state:'FAILED', observed_generation:'bad',
      target_state:'READY', idempotency_key:'drag-2',
    },
  });
  assert.equal(res.statusCode, 400);
});


test('runtime can upsert deterministic private daily and weekly build-log evidence without an owner session', async t => {
  const f = await fixture(); t.after(() => f.db.close());
  await createEvidenceTable(f.sql);
  const previous = process.env.WORKSPACE_COMMAND_SYNC_TOKEN;
  process.env.WORKSPACE_COMMAND_SYNC_TOKEN = 'runtime-secret';
  t.after(() => {
    if (previous === undefined) delete process.env.WORKSPACE_COMMAND_SYNC_TOKEN;
    else process.env.WORKSPACE_COMMAND_SYNC_TOKEN = previous;
  });

  const first = await f.call({
    method: 'POST',
    headers: { authorization: 'Bearer runtime-secret' },
    body: {
      action: 'upsert_build_log',
      entry_type: 'daily',
      date: '2026-10-08',
      notes: 'Built the narrow machine path. Evidence: https://example.com/proof',
    },
  });
  assert.equal(first.statusCode, 200);
  assert.equal(first.body.id, 'founder-log:2026-10-08');
  assert.equal(first.body.status, 'REPORTED');

  const rerun = await f.call({
    method: 'POST',
    headers: { authorization: 'Bearer runtime-secret' },
    body: {
      action: 'upsert_build_log',
      date: '2026-10-08',
      notes: 'Updated journal with preserved link: https://example.com/final',
    },
  });
  assert.equal(rerun.statusCode, 200);

  const weekly = await f.call({
    method: 'POST',
    headers: { authorization: 'Bearer runtime-secret' },
    body: {
      action: 'upsert_build_log',
      entry_type: 'weekly',
      week_ending: '2026-10-09',
      notes: 'Weekly retrospective with verified events separated from interpretation.',
    },
  });
  assert.equal(weekly.body.id, 'founder-weekly:2026-10-09');

  const rows = await f.sql`SELECT id, source, source_label, title, occurred_at, status, goal_id, confidence, url, notes
    FROM workspace_evidence ORDER BY id`;
  assert.equal(rows.length, 2, 'rerunning a date updates instead of duplicating it');
  const daily = rows.find(row => row.id === 'founder-log:2026-10-08');
  assert.equal(daily.source, 'build_log');
  assert.equal(daily.source_label, 'Founder Build Log');
  assert.equal(daily.status, 'REPORTED');
  assert.equal(daily.goal_id, 'ownership');
  assert.equal(daily.confidence, 1);
  assert.equal(daily.url, null);
  assert.equal(daily.notes, 'Updated journal with preserved link: https://example.com/final');
  assert.equal(new Date(daily.occurred_at).toISOString(), '2026-10-08T12:00:00.000Z');
});

test('build-log machine path fails closed and derives protected evidence fields server-side', async t => {
  const f = await fixture(); t.after(() => f.db.close());
  await createEvidenceTable(f.sql);
  const previous = process.env.WORKSPACE_COMMAND_SYNC_TOKEN;
  process.env.WORKSPACE_COMMAND_SYNC_TOKEN = 'runtime-secret';
  t.after(() => {
    if (previous === undefined) delete process.env.WORKSPACE_COMMAND_SYNC_TOKEN;
    else process.env.WORKSPACE_COMMAND_SYNC_TOKEN = previous;
  });

  const denied = await f.call({
    method: 'POST',
    headers: { authorization: 'Bearer wrong' },
    body: { action: 'upsert_build_log', date: '2026-10-08', notes: 'Must not write.' },
  });
  assert.equal(denied.statusCode, 403);

  const invalidDate = await f.call({
    method: 'POST',
    headers: { authorization: 'Bearer runtime-secret' },
    body: { action: 'upsert_build_log', date: '2026-02-30', notes: 'Must not write.' },
  });
  assert.equal(invalidDate.statusCode, 400);

  const invalidType = await f.call({
    method: 'POST',
    headers: { authorization: 'Bearer runtime-secret' },
    body: { action: 'upsert_build_log', entry_type: 'public', date: '2026-10-08', notes: 'Must not write.' },
  });
  assert.equal(invalidType.statusCode, 400);

  const count = await f.sql`SELECT COUNT(*)::int AS n FROM workspace_evidence`;
  assert.equal(count[0].n, 0);
});
