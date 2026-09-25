import crypto from 'node:crypto';
import { getSql, json, parseBody, requireSession, sha256 } from './_workspace.mjs';

const SOURCE_STATUS = new Set(['ACTIVE', 'ATTENTION', 'DEGRADED', 'UNKNOWN']);
const ITEM_STATUS = new Set(['INGESTED', 'VISUAL_PENDING', 'NEEDS_REVIEW', 'ERROR']);
const COVERAGE = new Set(['HIGH', 'PARTIAL', 'NEEDS_REVIEW']);

function syncAuthorized(req) {
  const expected = process.env.WORKSPACE_SOURCE_SYNC_TOKEN || process.env.WORKSPACE_BOARD_SYNC_TOKEN;
  if (!expected) return false;
  const header = String(req.headers?.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return false;
  const a = Buffer.from(sha256(token), 'hex');
  const b = Buffer.from(sha256(expected), 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function ensureTable(sql) {
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

function safeUrl(value) {
  if (!value) return null;
  try {
    const parsed = new URL(String(value));
    return parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function safeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function cleanVisual(value) {
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

function cleanItem(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const videoId = String(value.video_id || '').trim().slice(0, 80);
  const videoUrl = safeUrl(value.video_url);
  const status = String(value.status || '').trim().toUpperCase();
  const coverage = String(value.coverage || '').trim().toUpperCase();
  if (!videoId || !videoUrl || !ITEM_STATUS.has(status) || !COVERAGE.has(coverage)) return null;
  return {
    video_id: videoId,
    title: String(value.title || 'Untitled video').trim().slice(0, 500),
    channel: String(value.channel || '').trim().slice(0, 300),
    video_url: videoUrl,
    published_at: safeDate(value.published_at),
    duration: value.duration === null || value.duration === undefined ? null : Number(value.duration),
    status,
    coverage,
    needs_review: Boolean(value.needs_review),
    visual_pending: Boolean(value.visual_pending),
    visual_requirement: cleanVisual(value.visual_requirement),
    transcript_chars: Math.max(0, Number(value.transcript_chars) || 0),
    transcript_excerpt: String(value.transcript_excerpt || '').slice(0, 500),
    last_attempt_at: safeDate(value.last_attempt_at),
    routing_status: String(value.routing_status || '').slice(0, 80),
    findings: (Array.isArray(value.findings) ? value.findings : []).slice(0, 20),
  };
}

function cleanSource(value, observedAt, sourceSystem) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const sourceId = String(value.source_id || '').trim().slice(0, 200);
  const sourceType = String(value.source_type || '').trim().slice(0, 80);
  const mode = String(value.mode || '').trim().slice(0, 80);
  const sourceUrl = safeUrl(value.source_url);
  const status = String(value.status || 'UNKNOWN').trim().toUpperCase();
  if (!sourceId || !sourceType || !mode || !sourceUrl || !SOURCE_STATUS.has(status)) return null;
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
    items: (Array.isArray(value.items) ? value.items : []).map(cleanItem).filter(Boolean).slice(0, 250),
  };
}

export default async function handler(req, res) {
  try {
    const sql = getSql();
    await ensureTable(sql);
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
    if (!syncAuthorized(req)) return json(res, 403, { ok:false, error:'Invalid source sync token' });

    const body = parseBody(req);
    const observedAt = safeDate(body.observed_at);
    const sourceSystem = String(body.source_system || 'agent-os').trim().slice(0, 120);
    if (!observedAt) return json(res, 400, { ok:false, error:'observed_at is required' });
    const sources = (Array.isArray(body.sources) ? body.sources : []).map(value => cleanSource(value, observedAt, sourceSystem)).filter(Boolean);
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
