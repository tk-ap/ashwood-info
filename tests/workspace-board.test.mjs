import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import crypto from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { sha256 } from '../api/_workspace.mjs';

async function fixture() {
  const db = new PGlite();
  const sql = async (strings, ...values) => (await db.query(
    strings.reduce((query, part, index) => query + (index ? '$' + index : '') + part, ''), values,
  )).rows;

  const dependencies = {
    crypto,
    getSql: () => sql,
    json: (res, status, body) => { res.statusCode = status; res.body = body; },
    parseBody: req => req.body || {},
    requireSession: async req => req.owner ? { token: 'owner-session' } : null,
    sha256,
  };

  const source = (await readFile(new URL('../api/workspace-board.mjs', import.meta.url), 'utf8'))
    .replace(/^import .*;\n/gm, '')
    .replace('export default async function handler', 'async function handler');
  const handler = Function(...Object.keys(dependencies), source + '\nreturn handler;')(...Object.values(dependencies));

  async function call(req = {}) {
    const res = { headers: {}, setHeader(key, value) { this.headers[key] = value; }, end() {} };
    await handler({ method: 'GET', headers: {}, ...req }, res);
    return res;
  }
  return { db, call };
}

test('AgentOS snapshot is private, replaceable, and preserves lifecycle fields', async t => {
  const f = await fixture(); t.after(() => f.db.close());
  const previous = process.env.WORKSPACE_BOARD_SYNC_TOKEN;
  process.env.WORKSPACE_BOARD_SYNC_TOKEN = 'board-secret';
  t.after(() => {
    if (previous === undefined) delete process.env.WORKSPACE_BOARD_SYNC_TOKEN;
    else process.env.WORKSPACE_BOARD_SYNC_TOKEN = previous;
  });

  const denied = await f.call({ owner:false });
  assert.equal(denied.statusCode, 401);

  const pushed = await f.call({
    method:'POST',
    headers:{ authorization:'Bearer board-secret' },
    body:{
      source_system:'agent-os',
      replace:true,
      observed_at:'2026-09-20T20:00:00Z',
      snapshot_id:'snapshot-abc123',
      rows:[
        {
          board_key:'fleet:t1',
          source_system:'agent-os',
          kind:'execution',
          lane:'stuck',
          title:'Repair lifecycle',
          status:'revoked',
          phase:'revoked',
          assignee:'eugene',
          product:'AgentOS',
          work_id:'directive-4-routing',
          task_id:'t1',
          blocker:'Authority expired.',
          attempts:2,
          updated_at:'2026-09-20T19:55:00Z',
          observed_at:'2026-09-20T20:00:00Z'
        },
        {
          board_key:'backlog:idea-1',
          source_system:'agent-os',
          kind:'backlog',
          lane:'backlog',
          title:'Idea mentioned once',
          status:'proposed',
          product:'ALVIRA',
          priority:'p2',
          source:'human',
          updated_at:'2026-09-20T20:00:00Z',
          observed_at:'2026-09-20T20:00:00Z'
        }
      ]
    }
  });
  assert.equal(pushed.statusCode, 200);
  assert.equal(pushed.body.upserted, 2);

  const visible = await f.call({ owner:true });
  assert.equal(visible.statusCode, 200);
  assert.equal(visible.body.rows.length, 2);
  assert.equal(visible.body.snapshot_id, 'snapshot-abc123');
  assert.equal(visible.body.rows[0].snapshot_id, 'snapshot-abc123');
  assert.equal(visible.body.rows[0].lane, 'stuck');
  assert.equal(visible.body.rows[0].blocker, 'Authority expired.');
  assert.equal(visible.body.rows[1].kind, 'backlog');

  const replacement = await f.call({
    method:'POST',
    headers:{ authorization:'Bearer board-secret' },
    body:{
      source_system:'agent-os',
      replace:true,
      rows:[{
        board_key:'backlog:idea-1',
        source_system:'agent-os',
        kind:'backlog',
        lane:'backlog',
        title:'Idea mentioned once',
        status:'proposed',
        updated_at:'2026-09-20T20:05:00Z'
      }]
    }
  });
  assert.equal(replacement.statusCode, 200);
  const after = await f.call({ owner:true });
  assert.equal(after.body.rows.length, 1);
  assert.equal(after.body.rows[0].board_key, 'backlog:idea-1');
});

test('bad sync token cannot overwrite the board', async t => {
  const f = await fixture(); t.after(() => f.db.close());
  const previous = process.env.WORKSPACE_BOARD_SYNC_TOKEN;
  process.env.WORKSPACE_BOARD_SYNC_TOKEN = 'board-secret';
  t.after(() => {
    if (previous === undefined) delete process.env.WORKSPACE_BOARD_SYNC_TOKEN;
    else process.env.WORKSPACE_BOARD_SYNC_TOKEN = previous;
  });

  const res = await f.call({
    method:'POST',
    headers:{ authorization:'Bearer wrong' },
    body:{ rows:[{board_key:'x',title:'Nope'}] }
  });
  assert.equal(res.statusCode, 403);
});
