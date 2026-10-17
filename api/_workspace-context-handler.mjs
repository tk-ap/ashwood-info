// Private ALVIRA Context for /workspace ("ALVIRA / ALVIRA Context" in WORKSPACE_GOAL_EVIDENCE_SYSTEM.md).
//
// The owner's ALVIRA Context reaches the workspace as a released snapshot: what ALVIRA's Bridge
// releases (no sensitive answers, only owner-confirmed links, only owner-approved goal-spec fields).
// It is interpretation input for the owner's workspace, never public copy: reads need the owner's
// workspace session, writes need a machine sync token, and every write is sanitized again here.

import crypto from 'node:crypto';
import { getSql, json, parseBody, requireSession, sameOrigin, sha256 } from './_workspace.mjs';
import { cleanContextSnapshot, cleanText, safeId } from './_workspace-context-clean.mjs';

export function contextSyncAuthorized(req) {
  const expected = process.env.WORKSPACE_CONTEXT_SYNC_TOKEN || process.env.WORKSPACE_SOURCE_SYNC_TOKEN;
  if (!expected) return false;
  const header = String(req.headers?.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return false;
  const a = Buffer.from(sha256(token), 'hex');
  const b = Buffer.from(sha256(expected), 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function ensureContextTable(sql) {
  await sql`CREATE TABLE IF NOT EXISTS workspace_context_snapshots (
    context_id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    topic TEXT NOT NULL,
    environment TEXT NOT NULL,
    payload JSONB NOT NULL,
    content_hash TEXT NOT NULL,
    source_system TEXT NOT NULL,
    observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
}

export async function contextHandler(req, res) {
  try {
    if (req.method === 'POST') {
      if (!contextSyncAuthorized(req)) return json(res, 401, { ok: false, error: 'Context sync is not authorized' });
      const snapshot = cleanContextSnapshot(parseBody(req));
      if (!snapshot) return json(res, 400, { ok: false, error: 'Not a usable ALVIRA Context snapshot' });
      const sourceSystem = cleanText(parseBody(req).source_system, 120) || 'alvira-bridge';
      const sql = getSql();
      await ensureContextTable(sql);
      await sql`INSERT INTO workspace_context_snapshots (context_id, source, topic, environment, payload, content_hash, source_system, observed_at, updated_at)
        VALUES (${snapshot.context_id}, ${snapshot.source}, ${snapshot.topic}, ${snapshot.environment}, ${JSON.stringify(snapshot)}::jsonb, ${snapshot.content_hash}, ${sourceSystem}, NOW(), NOW())
        ON CONFLICT (context_id) DO UPDATE SET topic=EXCLUDED.topic, environment=EXCLUDED.environment, payload=EXCLUDED.payload,
          content_hash=EXCLUDED.content_hash, source_system=EXCLUDED.source_system, observed_at=NOW(), updated_at=NOW()`;
      return json(res, 200, { ok: true, context_id: snapshot.context_id, content_hash: snapshot.content_hash, domains: snapshot.domains.length, goal_spec_fields: Object.keys(snapshot.goal_spec?.fields || {}).length });
    }
    if (!(await requireSession(req))) return json(res, 401, { ok: false, error: 'Workspace session required' });
    const sql = getSql();
    await ensureContextTable(sql);
    if (req.method === 'GET') {
      const rows = await sql`SELECT context_id, topic, environment, payload, content_hash, source_system, observed_at FROM workspace_context_snapshots ORDER BY observed_at DESC`;
      return json(res, 200, { ok: true, contexts: rows.map(row => ({ ...row.payload, content_hash: row.content_hash, source_system: row.source_system, observed_at: row.observed_at })) });
    }
    if (req.method === 'DELETE') {
      if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'Cross-origin request refused' });
      const contextId = safeId(parseBody(req).context_id);
      if (!contextId) return json(res, 400, { ok: false, error: 'context_id is required' });
      await sql`DELETE FROM workspace_context_snapshots WHERE context_id = ${contextId}`;
      return json(res, 200, { ok: true, removed: contextId });
    }
    return json(res, 405, { ok: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('workspace context failed', error);
    return json(res, 500, { ok: false, error: 'Workspace context failed' });
  }
}
