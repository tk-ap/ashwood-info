import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// Exercise the real handler and its SQL against PostgreSQL in memory. Only the Blob
// SDK and the session lookup are substituted; the delete path is defined by what it
// does to the row and to stored file, so both are observed rather than assumed.
async function fixture({ delFails = false } = {}) {
  const db = new PGlite();
  const sql = async (strings, ...values) => (await db.query(
    strings.reduce((query, part, index) => query + (index ? `$${index}` : '') + part, ''), values,
  )).rows;

  const deleted = [];
  const dependencies = {
    getSql: () => sql,
    json: (res, status, body) => { res.statusCode = status; res.body = body; },
    parseBody: req => req.body || {},
    sameOrigin: req => req.origin !== 'foreign',
    requireSession: async req => (req.auth ? { token: 'owner' } : null),
    handleUpload: async () => ({}),
    del: async url => {
      if (delFails) throw new Error('blob is gone');
      deleted.push(url);
    },
    ensureUploadsTable: async () => {},
    process: { env: {} },
  };

  const source = (await readFile(new URL('../api/workspace-upload.mjs', import.meta.url), 'utf8'))
    .replace(/^import .*;\n/gm, '')
    .replace(/^export async function ensureUploadsTable/m, 'async function unusedEnsure')
    .replace('export default async function handler', 'async function handler');
  const handler = Function(...Object.keys(dependencies), `${source}\nreturn handler;`)(...Object.values(dependencies));

  await sql`CREATE TABLE workspace_uploads (
    id BIGSERIAL PRIMARY KEY, pathname TEXT NOT NULL, url TEXT NOT NULL UNIQUE,
    download_url TEXT, content_type TEXT, size_bytes BIGINT, title TEXT NOT NULL,
    artist TEXT NOT NULL DEFAULT 't.kap', producer_credit TEXT, rights_note TEXT,
    source_url TEXT, publish_to_music BOOLEAN NOT NULL DEFAULT FALSE,
    rights_ledger JSONB NOT NULL DEFAULT '{}'::jsonb, rights_updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  const seed = async (title, url, live = false) => Number((await sql`
    INSERT INTO workspace_uploads (pathname, url, title, publish_to_music)
    VALUES (${`ashwood/music/${title}.mp3`}, ${url}, ${title}, ${live}) RETURNING id`)[0].id);

  async function call(req = {}) {
    const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end() {} };
    await handler({ method: 'DELETE', auth: true, url: '/api/workspace-upload', ...req }, res);
    return res;
  }
  const count = async () => Number((await sql`SELECT COUNT(*)::int AS n FROM workspace_uploads`)[0].n);
  return { db, sql, seed, call, count, deleted };
}

test('deleting an upload removes the stored file and its record', async t => {
  const f = await fixture(); t.after(() => f.db.close());
  const id = await f.seed('special', 'https://blob.example/special.mp3');
  const other = await f.seed('with-you', 'https://blob.example/with-you.mp3');

  const res = await f.call({ body: { id } });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.deleted, id);
  assert.deepEqual(f.deleted, ['https://blob.example/special.mp3'], 'the blob is removed by url');
  assert.equal(await f.count(), 1, 'only the targeted row is gone');
  assert.equal(Number((await f.sql`SELECT id FROM workspace_uploads`)[0].id), other);
});

test('a file already missing from storage still clears its record', async t => {
  const f = await fixture({ delFails: true }); t.after(() => f.db.close());
  const id = await f.seed('orphan', 'https://blob.example/orphan.mp3');

  const res = await f.call({ body: { id } });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.blob_removed, false, 'the caller is told the file was already gone');
  assert.equal(await f.count(), 0, 'the record is cleared rather than left undeletable');
});

test('delete refuses without a session, across origins, and for a bad or unknown id', async t => {
  const f = await fixture(); t.after(() => f.db.close());
  const id = await f.seed('special', 'https://blob.example/special.mp3');

  assert.equal((await f.call({ body: { id }, auth: false })).statusCode, 401);
  assert.equal((await f.call({ body: { id }, origin: 'foreign' })).statusCode, 403);
  assert.equal((await f.call({ body: {} })).statusCode, 400);
  assert.equal((await f.call({ body: { id: -1 } })).statusCode, 400);
  assert.equal((await f.call({ body: { id: id + 999 } })).statusCode, 404);

  assert.deepEqual(f.deleted, [], 'no rejected request touched storage');
  assert.equal(await f.count(), 1, 'no rejected request touched the record');
});
