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

// Source-ingestion projection shares this existing serverless function to stay within the Hobby function cap.
const SOURCE_REGISTRY_STATUS = new Set(['ACTIVE', 'ATTENTION', 'DEGRADED', 'UNKNOWN']);
const SOURCE_ITEM_STATUS = new Set(['INGESTED', 'VISUAL_PENDING', 'NEEDS_REVIEW', 'ERROR']);
const SOURCE_COVERAGE = new Set(['HIGH', 'PARTIAL', 'NEEDS_REVIEW']);

function sourceSyncAuthorized(req) {
  const expected = process.env.WORKSPACE_SOURCE_SYNC_TOKEN || process.env.WORKSPACE_BOARD_SYNC_TOKEN;
  if (!expected) return false;
  const header = String(req.headers?.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return false;
  const a = Buffer.from(sha256(token), 'hex');
  const b = Buffer.from(sha256(expected), 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function ensureSourceTable(sql) {
  await sql`CREATE TABLE IF NOT EXISTS workspace_source_registry (
    source_id TEXT PRIMARY KEY,
    source_type TEXT NOT NULL,
    mode TEXT NOT NULL,
    role TEXT,
    source_url TEXT NOT NULL,
    status TEXT NOT NULL,
    observed_at TIMESTAMPTZ NOT NULL,
    source_system TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
}

function sourceSafeUrl(value) {
  if (!value) return null;
  try {
    const parsed = new URL(String(value));
    return parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function sourceSafeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function sourceCleanVisual(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { required:false, approval_state:'NOT_REQUIRED', targets:[] };
  const targets = (Array.isArray(value.targets) ? value.targets : []).slice(0, 8).map(target => ({
    start: String(target?.start || '').slice(0, 32),
    end: String(target?.end || '').slice(0, 32),
    reason: String(target?.reason || '').slice(0, 300),
  }));
  return {
    required: Boolean(value.required),
    approval_state: String(value.approval_state || (value.required ? 'AWAITING_USER' : 'NOT_REQUIRED')).slice(0, 40),
    reason: String(value.reason || '').slice(0, 400),
    confidence: Number.isFinite(Number(value.confidence)) ? Number(value.confidence) : null,
    targets,
  };
}

function sourceCleanItem(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const videoId = String(value.video_id || '').trim().slice(0, 80);
  const videoUrl = sourceSafeUrl(value.video_url);
  const status = String(value.status || '').trim().toUpperCase();
  const coverage = String(value.coverage || '').trim().toUpperCase();
  if (!videoId || !videoUrl || !SOURCE_ITEM_STATUS.has(status) || !SOURCE_COVERAGE.has(coverage)) return null;
  return {
    video_id: videoId,
    title: String(value.title || 'Untitled video').trim().slice(0, 500),
    channel: String(value.channel || '').trim().slice(0, 300),
    video_url: videoUrl,
    published_at: sourceSafeDate(value.published_at),
    duration: value.duration === null || value.duration === undefined ? null : Number(value.duration),
    status,
    coverage,
    needs_review: Boolean(value.needs_review),
    visual_pending: Boolean(value.visual_pending),
    visual_requirement: sourceCleanVisual(value.visual_requirement),
    transcript_chars: Math.max(0, Number(value.transcript_chars) || 0),
    transcript_excerpt: String(value.transcript_excerpt || '').slice(0, 500),
    last_attempt_at: sourceSafeDate(value.last_attempt_at),
    routing_status: String(value.routing_status || '').slice(0, 80),
    findings: (Array.isArray(value.findings) ? value.findings : []).slice(0, 20),
  };
}

export function sourceCleanSource(value, observedAt, sourceSystem) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const sourceId = String(value.source_id || '').trim().slice(0, 200);
  const sourceType = String(value.source_type || '').trim().slice(0, 80);
  const mode = String(value.mode || '').trim().slice(0, 80);
  const sourceUrl = sourceSafeUrl(value.source_url);
  const status = String(value.status || 'UNKNOWN').trim().toUpperCase();
  if (!sourceId || !sourceType || !mode || !sourceUrl || !SOURCE_REGISTRY_STATUS.has(status)) return null;
  const summary = value.summary && typeof value.summary === 'object' && !Array.isArray(value.summary) ? {
    known_videos: Math.max(0, Number(value.summary.known_videos) || 0),
    ingested: Math.max(0, Number(value.summary.ingested) || 0),
    visual_pending: Math.max(0, Number(value.summary.visual_pending) || 0),
    needs_review: Math.max(0, Number(value.summary.needs_review) || 0),
    errors: Math.max(0, Number(value.summary.errors) || 0),
  } : {};
  return {
    source_id: sourceId,
    source_type: sourceType,
    mode,
    role: String(value.role || '').trim().slice(0, 120),
    source_url: sourceUrl,
    status,
    observed_at: observedAt,
    source_system: sourceSystem,
    discovery_provider: String(value.discovery_provider || '').slice(0, 120),
    summary,
    items: (Array.isArray(value.items) ? value.items : []).map(sourceCleanItem).filter(Boolean).slice(0, 250),
  };
}

export async function sourcesHandler(req, res) {
  try {
    const sql = getSql();
    await ensureSourceTable(sql);
    if (req.method === 'GET') {
      if (!(await requireSession(req))) return json(res, 401, { ok:false, error:'Unauthorized' });
      const rows = await sql`SELECT source_id, source_type, mode, role, source_url, status, observed_at, source_system, payload, updated_at FROM workspace_source_registry ORDER BY updated_at DESC`;
      return json(res, 200, {
        ok: true,
        authority: 'workspace_source_registry',
        sources: rows.map(row => ({
          ...(row.payload && typeof row.payload === 'object' ? row.payload : {}),
          source_id: row.source_id,
          source_type: row.source_type,
          mode: row.mode,
          role: row.role,
          source_url: row.source_url,
          status: row.status,
          observed_at: row.observed_at,
          source_system: row.source_system,
          updated_at: row.updated_at,
        })),
      });
    }
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
    if (!sourceSyncAuthorized(req)) return json(res, 403, { ok:false, error:'Invalid source sync token' });

    const body = parseBody(req);
    const observedAt = sourceSafeDate(body.observed_at);
    const sourceSystem = String(body.source_system || 'agent-os').trim().slice(0, 120);
    if (!observedAt) return json(res, 400, { ok:false, error:'observed_at is required' });
    const sources = (Array.isArray(body.sources) ? body.sources : []).map(value => sourceCleanSource(value, observedAt, sourceSystem)).filter(Boolean);
    if (!sources.length) return json(res, 400, { ok:false, error:'No valid source observations' });

    for (const source of sources) {
      await sql`INSERT INTO workspace_source_registry (
        source_id, source_type, mode, role, source_url, status, observed_at, source_system, payload, updated_at
      ) VALUES (
        ${source.source_id}, ${source.source_type}, ${source.mode}, ${source.role}, ${source.source_url}, ${source.status},
        ${source.observed_at}, ${source.source_system}, ${JSON.stringify(source)}::jsonb, NOW()
      )
      ON CONFLICT (source_id) DO UPDATE SET
        source_type=EXCLUDED.source_type, mode=EXCLUDED.mode, role=EXCLUDED.role, source_url=EXCLUDED.source_url,
        status=EXCLUDED.status, observed_at=EXCLUDED.observed_at, source_system=EXCLUDED.source_system,
        payload=EXCLUDED.payload, updated_at=NOW()`;
    }
    return json(res, 200, { ok:true, upserted:sources.length });
  } catch (error) {
    console.error('workspace sources failed', error);
    return json(res, 500, { ok:false, error:'Workspace source registry failed' });
  }
}
