import crypto from 'node:crypto';
import { neon } from '@neondatabase/serverless';

export function getSql() {
  const connectionString = process.env.ASHWOOD_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error('ASHWOOD_DATABASE_URL is not configured');
  return neon(connectionString);
}

export function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

export function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const raw = String(req.body || '');
  return raw ? JSON.parse(raw) : {};
}

export function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

export function hashPassphrase(passphrase, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(passphrase), salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPassphrase(passphrase, salt, expectedHex) {
  if (!salt || !expectedHex) return false;
  const actual = crypto.scryptSync(String(passphrase), salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export function timingSafeEqualHex(a, b) {
  const left = Buffer.from(String(a), 'hex');
  const right = Buffer.from(String(b || ''), 'hex');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function cookieMap(req) {
  return Object.fromEntries(String(req.headers?.cookie || '').split(';').map(x => x.trim()).filter(Boolean).map(part => {
    const i = part.indexOf('=');
    return [decodeURIComponent(i >= 0 ? part.slice(0, i) : part), decodeURIComponent(i >= 0 ? part.slice(i + 1) : '')];
  }));
}

export async function requireSession(req) {
  const token = cookieMap(req).ashwood_workspace_session;
  if (!token) return null;
  const sql = getSql();
  const rows = await sql`SELECT token_hash, expires_at FROM workspace_sessions WHERE token_hash = ${sha256(token)} AND expires_at > NOW() LIMIT 1`;
  if (!rows[0]) return null;
  await sql`UPDATE workspace_sessions SET last_seen_at = NOW() WHERE token_hash = ${sha256(token)}`;
  return { token };
}

export async function issueSession(res) {
  const sql = getSql();
  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = sha256(token);
  await sql`INSERT INTO workspace_sessions (token_hash, auth_id, expires_at) VALUES (${tokenHash}, 'owner', NOW() + INTERVAL '30 days')`;
  res.setHeader('Set-Cookie', `ashwood_workspace_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`);
}

export function clearSession(res) {
  res.setHeader('Set-Cookie', 'ashwood_workspace_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
}

// Compare the browser's Origin against the host this request actually arrived on,
// rather than an allowlist of known domains. An allowlist has to be maintained and
// silently locks the workspace out whenever a domain changes; this cannot, because
// whatever host serves the page is the host the browser reports. It still rejects a
// third-party origin, which is the actual hole being closed: the previous check
// accepted any *.vercel.app, a public suffix anyone can deploy to.
export function sameOrigin(req) {
  const origin = String(req.headers?.origin || '');
  if (!origin) return true;
  const host = String(req.headers?.['x-forwarded-host'] || req.headers?.host || '');
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
