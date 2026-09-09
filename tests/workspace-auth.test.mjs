import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import crypto from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { hashPassphrase, sha256, timingSafeEqualHex, verifyPassphrase } from '../api/_workspace.mjs';

const CURRENT = 'original-workspace-passphrase';
const NEXT = 'a-different-passphrase';

// Exercise the real handler and its SQL against PostgreSQL in memory. Session
// issue and lookup are reimplemented here against the same tables rather than
// stubbed out, because rotation is defined by what it does to those rows: the
// caller keeps a session, every other browser loses one.
async function fixture() {
  const db = new PGlite();
  const sql = async (strings, ...values) => (await db.query(
    strings.reduce((query, part, index) => query + (index ? `$${index}` : '') + part, ''), values,
  )).rows;

  await sql`CREATE TABLE workspace_auth (
    id TEXT PRIMARY KEY, pass_salt TEXT, pass_hash TEXT,
    bootstrap_hash TEXT, bootstrap_used_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
  )`;
  await sql`CREATE TABLE workspace_sessions (
    token_hash TEXT PRIMARY KEY, auth_id TEXT,
    expires_at TIMESTAMPTZ NOT NULL, last_seen_at TIMESTAMPTZ
  )`;

  const seeded = hashPassphrase(CURRENT);
  await sql`INSERT INTO workspace_auth (id, pass_salt, pass_hash, bootstrap_hash, bootstrap_used_at, updated_at)
    VALUES ('owner', ${seeded.salt}, ${seeded.hash}, ${sha256('spent-setup-token')}, NOW(), NOW())`;

  async function issue() {
    const token = crypto.randomBytes(32).toString('base64url');
    await sql`INSERT INTO workspace_sessions (token_hash, auth_id, expires_at) VALUES (${sha256(token)}, 'owner', NOW() + INTERVAL '30 days')`;
    return token;
  }

  const dependencies = {
    getSql: () => sql,
    json: (res, status, body) => { res.statusCode = status; res.body = body; },
    parseBody: req => req.body || {},
    sameOrigin: req => req.origin !== 'foreign',
    sha256, hashPassphrase, verifyPassphrase, timingSafeEqualHex,
    requireSession: async req => {
      if (!req.token) return null;
      const rows = await sql`SELECT token_hash FROM workspace_sessions WHERE token_hash = ${sha256(req.token)} AND expires_at > NOW() LIMIT 1`;
      return rows[0] ? { token: req.token } : null;
    },
    issueSession: async res => { res.issued = await issue(); },
    clearSession: res => { res.cleared = true; },
  };

  const source = (await readFile(new URL('../api/workspace-auth.mjs', import.meta.url), 'utf8'))
    .replace(/^import .*;\n/gm, '').replace('export default async function handler', 'async function handler');
  const handler = Function(...Object.keys(dependencies), `${source}\nreturn handler;`)(...Object.values(dependencies));

  async function call(req = {}) {
    const res = { headers: {}, setHeader(key, value) { this.headers[key] = value; }, end() {} };
    await handler({ method: 'POST', ...req }, res);
    return res;
  }

  const sessionCount = async () => Number((await sql`SELECT COUNT(*)::int AS n FROM workspace_sessions`)[0].n);
  const login = passphrase => call({ body: { action: 'login', passphrase } });
  const rotate = (passphrase, req = {}) => call({ body: { action: 'rotate', passphrase }, ...req });
  return { db, sql, issue, call, login, rotate, sessionCount };
}

test('rotation replaces the passphrase: the old one stops working and the new one logs in', async t => {
  const f = await fixture(); t.after(() => f.db.close());
  const token = await f.issue();

  const rotated = await f.rotate(NEXT, { token });
  assert.equal(rotated.statusCode, 200);
  assert.equal(rotated.body.ok, true);
  assert.equal(rotated.body.rotated, true);

  assert.equal((await f.login(CURRENT)).statusCode, 403, 'the forgotten passphrase must stop working');
  assert.equal((await f.login(NEXT)).statusCode, 200, 'the newly chosen passphrase must work');
});

test('rotation keeps the browser that performed it and locks every other one out', async t => {
  const f = await fixture(); t.after(() => f.db.close());
  const token = await f.issue();
  const otherBrowser = await f.issue();
  assert.equal(await f.sessionCount(), 2);

  const res = await f.rotate(NEXT, { token });
  assert.ok(res.issued, 'the rotating browser is handed a fresh session');
  assert.equal(await f.sessionCount(), 1, 'exactly one session survives');

  // The surviving session is the newly issued one, not either pre-rotation token.
  assert.equal((await f.call({ method: 'GET', token: res.issued })).body.authenticated, true);
  assert.equal((await f.call({ method: 'GET', token })).body.authenticated, false);
  assert.equal((await f.call({ method: 'GET', token: otherBrowser })).body.authenticated, false);
});

test('rotation requires a live session, a same-origin request, and a genuinely new passphrase', async t => {
  const f = await fixture(); t.after(() => f.db.close());
  const token = await f.issue();

  const anonymous = await f.rotate(NEXT);
  assert.equal(anonymous.statusCode, 401, 'no session cannot rotate');

  const foreign = await f.rotate(NEXT, { token, origin: 'foreign' });
  assert.equal(foreign.statusCode, 403, 'a third-party origin cannot rotate');

  const short = await f.rotate('too-short', { token });
  assert.equal(short.statusCode, 400);
  assert.match(short.body.error, /at least 12 characters/);

  const reused = await f.rotate(CURRENT, { token });
  assert.equal(reused.statusCode, 400);
  assert.match(reused.body.error, /differ from the current/);

  // None of the rejected attempts moved the passphrase or the session table.
  assert.equal((await f.login(CURRENT)).statusCode, 200);
  assert.equal(await f.sessionCount(), 2, 'the failed attempts left the session table alone, and the login above added one');
});

test('the one-time setup token stays spent, so rotation is the only way to change the passphrase', async t => {
  const f = await fixture(); t.after(() => f.db.close());
  const setup = await f.call({ body: { action: 'setup', bootstrap: 'spent-setup-token', passphrase: NEXT } });
  assert.equal(setup.statusCode, 409, 'setup cannot be replayed to reset a forgotten passphrase');
  assert.equal((await f.login(CURRENT)).statusCode, 200, 'the passphrase is untouched by the replay attempt');
});
