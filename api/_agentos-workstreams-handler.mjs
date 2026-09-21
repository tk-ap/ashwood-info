import crypto from 'node:crypto';
import { getSql, json, parseBody, requireSession, sha256 } from './_workspace.mjs';

// Human-facing workstream projection for ASHWOOD /workspace.
// Canonical execution state stays in the owning system (AgentOS, product repo,
// ailhat, etc.). This table stores only a projection plus provenance.

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

async function ensureTable(sql) {
  await sql`CREATE TABLE IF NOT EXISTS workspace_workstreams (
    source_id TEXT PRIMARY KEY,
    source_system TEXT NOT NULL,
    canonical_url TEXT,
    title TEXT NOT NULL,
    summary TEXT,
    product TEXT,
    owner TEXT,
    status TEXT,
    stage TEXT,
    next_gate TEXT,
    goal_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    confidence DOUBLE PRECISION NOT NULL DEFAULT 1,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    observed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
}

function cleanRow(row) {
  const sourceId = String(row?.source_id || '').trim().slice(0, 250);
  const sourceSystem = String(row?.source_system || 'agent-os').trim().slice(0, 80);
  const title = String(row?.title || '').trim().slice(0, 500);
  if (!sourceId || !title) return null;

  const goals = Array.isArray(row.goal_ids)
    ? row.goal_ids.map(x => String(x).trim().slice(0, 80)).filter(Boolean).slice(0, 12)
    : [];
  const observedAt = row.observed_at ? new Date(row.observed_at) : new Date();
  if (Number.isNaN(observedAt.getTime())) return null;

  return {
    sourceId,
    sourceSystem,
    canonicalUrl: String(row.canonical_url || '').trim().slice(0, 1200) || null,
    title,
    summary: String(row.summary || '').trim().slice(0, 3000) || null,
    product: String(row.product || '').trim().slice(0, 120) || null,
    owner: String(row.owner || '').trim().slice(0, 120) || null,
    status: String(row.status || 'ACTIVE').trim().slice(0, 40),
    stage: String(row.stage || '').trim().slice(0, 80) || null,
    nextGate: String(row.next_gate || '').trim().slice(0, 1000) || null,
    goals,
    confidence: Math.max(0, Math.min(1, Number(row.confidence ?? 1) || 0)),
    metadata: row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata) ? row.metadata : {},
    observedAt: observedAt.toISOString(),
  };
}

export default async function handler(req, res) {
  try {
    const sql = getSql();
    await ensureTable(sql);

    if (req.method === 'GET') {
      const session = await requireSession(req);
      if (!session) return json(res, 401, { ok: false, error: 'Unauthorized' });
      const rows = await sql`SELECT source_id, source_system, canonical_url, title, summary, product, owner, status, stage, next_gate, goal_ids, confidence, metadata, observed_at, updated_at FROM workspace_workstreams ORDER BY updated_at DESC LIMIT 300`;
      return json(res, 200, { ok: true, rows });
    }

    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });
    if (!syncTokenValid(req)) return json(res, 403, { ok: false, error: 'Invalid sync token' });

    const body = parseBody(req);
    const rows = (Array.isArray(body.rows) ? body.rows : []).map(cleanRow).filter(Boolean).slice(0, 300);
    if (!rows.length) return json(res, 400, { ok: false, error: 'Empty workstream snapshot' });

    const sourceSystem = String(body.source_system || rows[0].sourceSystem || 'agent-os').trim().slice(0, 80);
    if (body.replace === true) {
      const keep = rows.map(r => r.sourceId);
      await sql`DELETE FROM workspace_workstreams WHERE source_system = ${sourceSystem} AND NOT (source_id = ANY(${keep}))`;
    }

    for (const row of rows) {
      await sql`INSERT INTO workspace_workstreams (
        source_id, source_system, canonical_url, title, summary, product, owner,
        status, stage, next_gate, goal_ids, confidence, metadata, observed_at, updated_at
      ) VALUES (
        ${row.sourceId}, ${row.sourceSystem}, ${row.canonicalUrl}, ${row.title}, ${row.summary},
        ${row.product}, ${row.owner}, ${row.status}, ${row.stage}, ${row.nextGate},
        ${JSON.stringify(row.goals)}::jsonb, ${row.confidence}, ${JSON.stringify(row.metadata)}::jsonb,
        ${row.observedAt}, NOW()
      ) ON CONFLICT (source_id) DO UPDATE SET
        source_system = EXCLUDED.source_system,
        canonical_url = EXCLUDED.canonical_url,
        title = EXCLUDED.title,
        summary = EXCLUDED.summary,
        product = EXCLUDED.product,
        owner = EXCLUDED.owner,
        status = EXCLUDED.status,
        stage = EXCLUDED.stage,
        next_gate = EXCLUDED.next_gate,
        goal_ids = EXCLUDED.goal_ids,
        confidence = EXCLUDED.confidence,
        metadata = EXCLUDED.metadata,
        observed_at = EXCLUDED.observed_at,
        updated_at = NOW()`;
    }

    return json(res, 200, { ok: true, upserted: rows.length, source_system: sourceSystem });
  } catch (error) {
    console.error('workspace workstreams failed', error);
    return json(res, 500, { ok: false, error: 'Workspace workstreams failed' });
  }
}
