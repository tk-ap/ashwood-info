import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import crypto from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { sha256 } from '../api/_workspace.mjs';

async function fixture() {
  const db = new PGlite();
  const sql = async (strings, ...values) => (await db.query(strings.reduce((query, part, index) => query + (index ? `$${index}` : '') + part, ''), values)).rows;
  const dependencies = {
    crypto, getSql: () => sql,
    json: (res, status, body) => { res.statusCode = status; res.body = body; },
    parseBody: req => req.body || {},
    requireSession: async req => req.owner ? { token:'owner' } : null,
    sha256,
  };
  const source = (await readFile(new URL('../api/workspace-sources.mjs', import.meta.url), 'utf8'))
    .replace(/^import .*;\n/gm, '')
    .replace('export default async function handler', 'async function handler');
  const handler = Function(...Object.keys(dependencies), `${source}\nreturn handler;`)(...Object.values(dependencies));
  async function call(req = {}) { const res = {}; await handler({ method:'GET', headers:{}, ...req }, res); return res; }
  return { db, call };
}

const payload = {
  observed_at:'2026-09-25T17:00:00Z',
  source_system:'agent-os',
  sources:[{
    source_id:'tk-youtube-reference-playlist',
    source_type:'youtube_playlist',
    mode:'MONITOR_REFERENCE',
    role:'ECOSYSTEM_REFERENCE_MEDIA',
    source_url:'https://www.youtube.com/playlist?list=PLWYtMecOW_yE',
    status:'ATTENTION',
    discovery_provider:'yt-dlp',
    summary:{ known_videos:2, ingested:1, visual_pending:1, needs_review:0, errors:0 },
    items:[{
      video_id:'abc123', title:'A demo', channel:'Example',
      video_url:'https://www.youtube.com/watch?v=abc123',
      status:'VISUAL_PENDING', coverage:'PARTIAL', visual_pending:true, needs_review:false,
      transcript_chars:1200, transcript_excerpt:'As you can see on my screen',
      visual_requirement:{ required:true, approval_state:'AWAITING_USER', targets:[{start:'00:01',end:'00:03',reason:'screen demo'}] },
      routing_status:'READY_FOR_ANALYSIS', findings:[],
    }],
  }],
};

test('owner can read a machine-synced source projection', async t => {
  const f = await fixture(); t.after(() => f.db.close());
  const old = process.env.WORKSPACE_SOURCE_SYNC_TOKEN; process.env.WORKSPACE_SOURCE_SYNC_TOKEN = 'source-secret';
  t.after(() => old === undefined ? delete process.env.WORKSPACE_SOURCE_SYNC_TOKEN : process.env.WORKSPACE_SOURCE_SYNC_TOKEN = old);
  const stored = await f.call({ method:'POST', headers:{authorization:'Bearer source-secret'}, body:payload });
  assert.equal(stored.statusCode, 200);
  const visible = await f.call({ owner:true });
  assert.equal(visible.statusCode, 200);
  assert.equal(visible.body.sources[0].source_id, 'tk-youtube-reference-playlist');
  assert.equal(visible.body.sources[0].summary.visual_pending, 1);
  assert.equal(visible.body.sources[0].items[0].coverage, 'PARTIAL');
});

test('source sync strips unbounded transcript fields and rejects wrong token', async t => {
  const f = await fixture(); t.after(() => f.db.close());
  const old = process.env.WORKSPACE_SOURCE_SYNC_TOKEN; process.env.WORKSPACE_SOURCE_SYNC_TOKEN = 'source-secret';
  t.after(() => old === undefined ? delete process.env.WORKSPACE_SOURCE_SYNC_TOKEN : process.env.WORKSPACE_SOURCE_SYNC_TOKEN = old);
  const denied = await f.call({ method:'POST', headers:{authorization:'Bearer wrong'}, body:payload });
  assert.equal(denied.statusCode, 403);
  const withRaw = structuredClone(payload);
  withRaw.sources[0].items[0].transcript = 'do not persist this raw transcript in Workspace';
  await f.call({ method:'POST', headers:{authorization:'Bearer source-secret'}, body:withRaw });
  const visible = await f.call({ owner:true });
  assert.equal('transcript' in visible.body.sources[0].items[0], false);
  assert.equal(visible.body.sources[0].items[0].transcript_excerpt.length > 0, true);
});
