import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import crypto from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { sha256 } from '../api/_workspace.mjs';

async function fixture() {
  const db = new PGlite();
  const sql = async (strings, ...values) => (await db.query(strings.reduce((query, part, index) => query + (index ? `$${index}` : '') + part, ''), values)).rows;
  const dependencies = { crypto, getSql: () => sql, json: (res, status, body) => { res.statusCode = status; res.body = body; }, parseBody: req => req.body || {}, requireSession: async req => req.owner ? { token: 'owner' } : null, sha256 };
  const source = (await readFile(new URL('../api/workspace-environments.mjs', import.meta.url), 'utf8')).replace(/^import .*;\n/gm, '').replace('export default async function handler', 'async function handler');
  const handler = Function(...Object.keys(dependencies), `${source}\nreturn handler;`)(...Object.values(dependencies));
  async function call(req = {}) { const res = {}; await handler({ method:'GET', headers:{}, ...req }, res); return res; }
  return { db, call };
}

test('known sandbox associations are stale, never unassigned, until a fresh machine observation arrives', async t => {
  const f = await fixture(); t.after(() => f.db.close());
  const before = await f.call({ owner:true });
  assert.equal(before.statusCode, 200);
  for (const key of ['ashwood', 'alvira-meos', 'ailhat', 'ledgato']) assert.equal(before.body.environments.find(row => row.product_key === key).status, 'STALE');
  assert.equal(before.body.environments.find(row => row.product_key === 'agent-control').status, 'UNASSIGNED');
});

test('only the machine sync token can refresh an associated environment to live', async t => {
  const f = await fixture(); t.after(() => f.db.close());
  const old = process.env.WORKSPACE_ENVIRONMENT_SYNC_TOKEN; process.env.WORKSPACE_ENVIRONMENT_SYNC_TOKEN = 'environment-secret';
  t.after(() => old === undefined ? delete process.env.WORKSPACE_ENVIRONMENT_SYNC_TOKEN : process.env.WORKSPACE_ENVIRONMENT_SYNC_TOKEN = old);
  const denied = await f.call({ method:'POST', headers:{authorization:'Bearer wrong'}, body:{ environments:[] } }); assert.equal(denied.statusCode, 403);
  const stored = await f.call({ method:'POST', headers:{authorization:'Bearer environment-secret'}, body:{ environments:[{ product_key:'alvira-meos', kind:'sandbox', provider:'here-now', provider_status:'live', url:'https://mighty-ether-p6cn.here.now/', provider_identity:'mighty-ether-p6cn', observed_at:new Date().toISOString(), source_system:'agent-os' }] } }); assert.equal(stored.statusCode, 200);
  const visible = await f.call({ owner:true }); assert.equal(visible.body.environments.find(row => row.product_key === 'alvira-meos').status, 'LIVE');
});
