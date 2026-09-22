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
