import crypto from 'node:crypto';
import { getSql, json, parseBody, requireSession, sha256 } from './_workspace.mjs';

// Milchik fleet board feed. GET is owner-session gated; POST is the fleet's
// snapshot sync, gated by a shared token (WORKSPACE_BOARD_SYNC_TOKEN) so the
// workstation can push without a session cookie.

function syncTokenValid(req) {
  const expected = process.env.WORKSPACE_BOARD_SYNC_TOKEN;
  if (!expected) return false;
  const header = String(req.headers?.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return false;
  const a = Buffer.from(sha256(token), 'hex');
  const b = Buffer.from(sha256(expected), 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const DDL = `CREATE TABLE IF NOT EXISTS workspace_board (
  board_key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT,
  assignee TEXT,
  product TEXT,
  workspace TEXT,
  updated_at TIMESTAMPTZ NOT NULL
)`;

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const session = await requireSession(req);
      if (!session) return json(res, 401, { ok: false, error: 'Unauthorized' });
      const sql = getSql();
      await sql`CREATE TABLE IF NOT EXISTS workspace_board (board_key TEXT PRIMARY KEY, title TEXT NOT NULL, status TEXT, assignee TEXT, product TEXT, workspace TEXT, updated_at TIMESTAMPTZ NOT NULL)`;
      const rows = await sql`SELECT board_key, title, status, assignee, product, workspace, updated_at FROM workspace_board ORDER BY updated_at DESC LIMIT 300`;
      return json(res, 200, { ok: true, rows });
    }

    if (req.method === 'POST') {
      if (!syncTokenValid(req)) return json(res, 403, { ok: false, error: 'Invalid sync token' });
      const body = parseBody(req);
      const rows = Array.isArray(body.rows) ? body.rows : [];
      if (!rows.length) return json(res, 400, { ok: false, error: 'Empty snapshot' });
      const sql = getSql();
      await sql`CREATE TABLE IF NOT EXISTS workspace_board (board_key TEXT PRIMARY KEY, title TEXT NOT NULL, status TEXT, assignee TEXT, product TEXT, workspace TEXT, updated_at TIMESTAMPTZ NOT NULL)`;
      for (const b of rows.slice(0, 500)) {
        const key = String(b.board_key || '').slice(0, 250);
        if (!key) continue;
        const ts = b.updated_at ? new Date(b.updated_at) : new Date();
        if (Number.isNaN(ts.getTime())) continue;
        await sql`INSERT INTO workspace_board (board_key, title, status, assignee, product, workspace, updated_at)
          VALUES (${key}, ${String(b.title || '').slice(0, 300)}, ${String(b.status || '').slice(0, 40)}, ${String(b.assignee || '').slice(0, 120)}, ${String(b.product || '').slice(0, 120)}, ${String(b.workspace || '').slice(0, 500)}, ${ts.toISOString()})
          ON CONFLICT (board_key) DO UPDATE SET title=EXCLUDED.title, status=EXCLUDED.status, assignee=EXCLUDED.assignee, product=EXCLUDED.product, workspace=EXCLUDED.workspace, updated_at=EXCLUDED.updated_at`;
      }
      return json(res, 200, { ok: true, upserted: rows.length });
    }

    return json(res, 405, { ok: false, error: 'Method not allowed' });
  } catch (e) {
    return json(res, 500, { ok: false, error: e.message });
  }
}
