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

  const source = (await readFile(new URL('../api/_agentos-board-handler.mjs', import.meta.url), 'utf8'))
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
          work_domain:'agentos',
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
          work_domain:'ecosystem',
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
  assert.equal(visible.body.rows[0].work_domain, 'agentos');
  assert.equal(visible.body.rows[0].blocker, 'Authority expired.');
  assert.equal(visible.body.rows[1].kind, 'backlog');
  assert.equal(visible.body.rows[1].work_domain, 'ecosystem');

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

test('the mirror stores only what the Workspace renders, so reads stay small (Neon transfer, Oct 2026)', async t => {
  const f = await fixture(); t.after(() => f.db.close());
  const previous = process.env.WORKSPACE_BOARD_SYNC_TOKEN;
  process.env.WORKSPACE_BOARD_SYNC_TOKEN = 'board-secret';
  t.after(() => { if (previous === undefined) delete process.env.WORKSPACE_BOARD_SYNC_TOKEN; else process.env.WORKSPACE_BOARD_SYNC_TOKEN = previous; });

  const deployments = Array.from({ length: 692 }, (_, i) => ({
    id: `dpl_${i}`, project: 'ashwood-info', target: i % 2 ? 'production' : 'preview', state: 'READY',
    created_at: new Date(Date.UTC(2026, 8, 1) + i * 3600_000).toISOString(),
    summary: 'x'.repeat(300), git_sha: 'a'.repeat(40), first_observed_at: 't', last_observed_at: 't', project_id: 'prj',
  }));
  const pushed = await f.call({ method:'POST', headers:{ authorization:'Bearer board-secret' }, body:{
    source_system:'agent-os', replace:true, observed_at:'2026-10-19T00:00:00Z', snapshot_id:'s1',
    rows:[
      { board_key:'deploy:budget', source_system:'agent-os', kind:'deployment_budget', lane:'in_progress', title:'Deployment capacity', status:'NORMAL',
        metadata:{ deployment_history:{ deployments, projected:692, total:692, retention_max:5 }, deployment_budget:{ used:2 } } },
      { board_key:'fleet:t9', source_system:'agent-os', kind:'execution', lane:'done', title:'Work', status:'closed',
        metadata:{ recent_events:Array.from({ length:10 }, (_, i) => ({ kind:'event', summary:`e${i}` })), execution_evidence:{ big:'y'.repeat(5000) }, review:{ verdict:'pass' }, work_domain:'agentos' } },
    ],
  } });
  assert.equal(pushed.statusCode, 200);

  const read = await f.call({ owner:true });
  assert.equal(read.statusCode, 200);
  const budget = read.body.rows.find(row => row.kind === 'deployment_budget');
  const history = budget.metadata.deployment_history;
  assert.equal(history.deployments.length, 75);
  assert.equal(history.projected, 75);
  assert.equal(history.total, 692);
  assert.equal(history.deployments[0].id, 'dpl_691'); // newest first
  assert.ok(!('first_observed_at' in history.deployments[0]) && !('project_id' in history.deployments[0]));
  assert.ok(JSON.stringify(budget.metadata).length < 96 * 1024);
  const execution = read.body.rows.find(row => row.kind === 'execution');
  assert.equal(execution.metadata.recent_events.length, 3);
  assert.ok(!('execution_evidence' in execution.metadata));
  assert.equal(execution.metadata.review.verdict, 'pass');
  assert.equal(execution.metadata.work_domain, 'agentos');
});

test('an oversized deployment row sheds the oldest deployments but keeps its history (Codex review of 508767e)', async t => {
  const f = await fixture(); t.after(() => f.db.close());
  const previous = process.env.WORKSPACE_BOARD_SYNC_TOKEN;
  process.env.WORKSPACE_BOARD_SYNC_TOKEN = 'board-secret';
  t.after(() => { if (previous === undefined) delete process.env.WORKSPACE_BOARD_SYNC_TOKEN; else process.env.WORKSPACE_BOARD_SYNC_TOKEN = previous; });

  const deployments = Array.from({ length: 692 }, (_, i) => ({
    id: `dpl_${i}`, project: 'ashwood-info', target: 'production', state: 'READY',
    created_at: new Date(Date.UTC(2026, 8, 1) + i * 3600_000).toISOString(), summary: 's'.repeat(3000),
  }));
  const attempts = Array.from({ length: 50 }, (_, i) => ({ id: `att_${i}`, state: i % 2 ? 'superseded' : 'waiting_availability', mutation_attempts: 1, note: 'n'.repeat(200) }));
  const pushed = await f.call({ method:'POST', headers:{ authorization:'Bearer board-secret' }, body:{
    source_system:'agent-os', replace:true, observed_at:'2026-10-19T00:00:00Z', snapshot_id:'s2',
    rows:[{ board_key:'deploy:budget', source_system:'agent-os', kind:'deployment_budget', lane:'in_progress', title:'Deployment capacity', status:'NORMAL',
      metadata:{ deployment_history:{ deployments, projected:692, total:692 }, deployment_attempts: attempts, deployment_budget:{ used:2 }, unrendered_blob:'z'.repeat(20000) } }],
  } });
  assert.equal(pushed.statusCode, 200);

  const read = await f.call({ owner:true });
  const meta = read.body.rows.find(row => row.kind === 'deployment_budget').metadata;
  const history = meta.deployment_history;
  assert.ok(history, 'deployment_history is kept');
  assert.ok(history.deployments.length > 0 && history.deployments.length < 75);
  assert.equal(history.projected, history.deployments.length);
  assert.equal(history.total, 692);
  assert.equal(history.deployments[0].id, 'dpl_691'); // newest kept, oldest shed
  assert.equal(meta.deployment_attempts.length, 50);  // ledger counts stay exact
  assert.equal(meta.deployment_budget.used, 2);
  assert.ok(!('unrendered_blob' in meta));
  assert.ok(JSON.stringify(meta).length <= 96 * 1024);
});

test('an oversized blob inside deployment_history cannot push the row over the cap (Codex review of 8a40706)', async t => {
  const f = await fixture(); t.after(() => f.db.close());
  const previous = process.env.WORKSPACE_BOARD_SYNC_TOKEN;
  process.env.WORKSPACE_BOARD_SYNC_TOKEN = 'board-secret';
  t.after(() => { if (previous === undefined) delete process.env.WORKSPACE_BOARD_SYNC_TOKEN; else process.env.WORKSPACE_BOARD_SYNC_TOKEN = previous; });

  const deployments = Array.from({ length: 10 }, (_, i) => ({ id: `dpl_${i}`, state: 'READY', created_at: new Date(Date.UTC(2026, 9, 1) + i * 3600_000).toISOString() }));
  const pushed = await f.call({ method:'POST', headers:{ authorization:'Bearer board-secret' }, body:{
    source_system:'agent-os', replace:true, observed_at:'2026-10-19T00:00:00Z', snapshot_id:'s3',
    rows:[
      { board_key:'deploy:budget', source_system:'agent-os', kind:'deployment_budget', lane:'in_progress', title:'Deployment capacity', status:'NORMAL',
        metadata:{ deployment_history:{ deployments, total:40, extra_blob:'x'.repeat(120 * 1024) }, deployment_budget:{ used:1 } } },
      { board_key:'deploy:odd', source_system:'agent-os', kind:'deployment_budget', lane:'in_progress', title:'Odd history', status:'NORMAL',
        metadata:{ deployment_history:{ deployments:'not-a-list', total:7, extra_blob:'y'.repeat(120 * 1024) } } },
    ],
  } });
  assert.equal(pushed.statusCode, 200);

  const read = await f.call({ owner:true });
  const meta = read.body.rows.find(row => row.board_key === 'deploy:budget').metadata;
  assert.ok(JSON.stringify(meta).length <= 96 * 1024);
  assert.deepEqual(meta.deployment_history.deployments.map(d => d.id), deployments.map(d => d.id).reverse());
  assert.equal(meta.deployment_history.projected, 10);
  assert.equal(meta.deployment_history.total, 40);
  assert.ok(!('extra_blob' in meta.deployment_history));
  assert.equal(meta.deployment_budget.used, 1);

  const odd = read.body.rows.find(row => row.board_key === 'deploy:odd').metadata;
  assert.ok(JSON.stringify(odd).length <= 96 * 1024);
  assert.deepEqual(odd.deployment_history, { deployments: [], projected: 0, total: 7 });
});
