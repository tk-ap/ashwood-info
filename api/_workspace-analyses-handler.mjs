import crypto from 'node:crypto';
import { getSql, json, parseBody, requireSession, sha256 } from './_workspace.mjs';

const MAX_BODY_BYTES = 1024 * 1024;
const MAX_ITEMS = 200;
const MAX_LIST = 20;
const MAX_TEXT = 600;
const MAX_SUMMARY = 1500;
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const SHA256 = /^[a-f0-9]{64}$/;

function text(value, max = MAX_TEXT) {
  return typeof value === 'string' && value.length <= max ? value : null;
}

function optionalText(value, max = MAX_TEXT) {
  return value === null ? null : text(value, max);
}

function iso(value) {
  if (value === null) return null;
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function boundedArray(value, mapper) {
  if (!Array.isArray(value) || value.length > MAX_LIST) return null;
  const items = value.map(mapper);
  return items.every(Boolean) ? items : null;
}

function cleanFinding(value) {
  if (!isObject(value)) return null;
  const confidence = value.confidence === null ? null : value.confidence;
  if (confidence !== null && (typeof confidence !== 'number' || !Number.isFinite(confidence) || confidence < 0 || confidence > 1)) return null;
  const id = text(value.id, 300);
  const finding = text(value.text);
  const evidenceBasis = text(value.evidence_basis);
  return id && finding && evidenceBasis
    ? { id, text: finding, evidence_basis: evidenceBasis, confidence }
    : null;
}

function cleanRelevance(value) {
  if (!isObject(value)) return null;
  const workstream = text(value.workstream, 200);
  const rationale = text(value.rationale);
  const risk = text(value.risk);
  return workstream && rationale && risk ? { workstream, rationale, risk } : null;
}

function cleanCandidateAction(value) {
  if (!isObject(value)) return null;
  const id = text(value.id, 300);
  const action = text(value.action);
  const why = text(value.why);
  return id && action && why ? { id, action, why } : null;
}

function cleanItem(value) {
  if (!isObject(value)) return null;
  if (!Object.hasOwn(value, 'title') || !Object.hasOwn(value, 'channel')
    || !Object.hasOwn(value, 'duration_seconds') || !Object.hasOwn(value, 'analyzed_at')) return null;
  const analysisId = text(value.analysis_id, 300);
  const videoId = text(value.video_id, 11);
  const expectedUrl = videoId && VIDEO_ID.test(videoId) ? `https://www.youtube.com/watch?v=${videoId}` : null;
  const duration = value.duration_seconds;
  const analyzedAt = iso(value.analyzed_at);
  const findings = boundedArray(value.findings, cleanFinding);
  const relevance = boundedArray(value.ecosystem_relevance, cleanRelevance);
  const actions = boundedArray(value.candidate_actions, cleanCandidateAction);
  const limitations = boundedArray(value.limitations, entry => text(entry));
  const title = optionalText(value.title, 200);
  const channel = optionalText(value.channel, 120);
  const coverage = text(value.coverage, 20);
  const summary = text(value.summary, MAX_SUMMARY);
  if (!analysisId || !expectedUrl || analysisId !== `${videoId}:${String(value.evidence_sha256 || '').slice(0, 12)}`
    || value.video_url !== expectedUrl || !SHA256.test(String(value.evidence_sha256 || ''))
    || !['HIGH', 'PARTIAL'].includes(coverage) || typeof value.visual_pending !== 'boolean'
    || (duration !== null && (!Number.isInteger(duration) || duration < 0)) || analyzedAt === undefined
    || !summary || !findings || !relevance || !actions || !limitations || title === undefined || channel === undefined) return null;
  return {
    analysis_id: analysisId,
    video_id: videoId,
    video_url: expectedUrl,
    title,
    channel,
    duration_seconds: duration,
    evidence_sha256: String(value.evidence_sha256),
    coverage,
    visual_pending: value.visual_pending,
    analyzed_at: analyzedAt,
    summary,
    findings,
    ecosystem_relevance: relevance,
    candidate_actions: actions,
    limitations,
  };
}

function byteLength(value) {
  try {
    return Buffer.byteLength(JSON.stringify(value), 'utf8');
  } catch {
    return Infinity;
  }
}

function cleanSnapshot(body) {
  if (!isObject(body) || byteLength(body) > MAX_BODY_BYTES) return null;
  if (body.schema_version !== 1 || body.source_system !== 'agent-os' || body.kind !== 'youtube-analyses') return null;
  if (!Array.isArray(body.items) || body.items.length > MAX_ITEMS || body.item_count !== body.items.length) return null;
  const snapshotId = text(body.snapshot_id, 128);
  const generatedAt = iso(body.generated_at);
  const items = body.items.map(cleanItem);
  if (!/^youtube-analyses:[a-f0-9]{16}$/.test(snapshotId || '') || generatedAt === undefined || !items.every(Boolean)) return null;
  return {
    schema_version: 1,
    source_system: 'agent-os',
    kind: 'youtube-analyses',
    snapshot_id: snapshotId,
    generated_at: generatedAt,
    item_count: items.length,
    items,
  };
}

function syncTokenValid(req) {
  const expected = process.env.WORKSPACE_BOARD_SYNC_TOKEN;
  if (!expected) return false;
  const header = String(req.headers?.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return false;
  const presented = Buffer.from(sha256(token), 'hex');
  const expectedHash = Buffer.from(sha256(expected), 'hex');
  return presented.length === expectedHash.length && crypto.timingSafeEqual(presented, expectedHash);
}

async function ensureTable(sql) {
  await sql`CREATE TABLE IF NOT EXISTS workspace_youtube_analyses (
    source_system TEXT PRIMARY KEY,
    schema_version INTEGER NOT NULL,
    kind TEXT NOT NULL,
    snapshot_id TEXT NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL,
    item_count INTEGER NOT NULL,
    items JSONB NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
}

function storedItems(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default async function handler(req, res) {
  try {
    const sql = getSql();
    await ensureTable(sql);

    if (req.method === 'GET') {
      const session = await requireSession(req);
      if (!session) return json(res, 401, { ok: false, error: 'Unauthorized' });
      const rows = await sql`SELECT snapshot_id, generated_at, item_count, items
        FROM workspace_youtube_analyses
        WHERE source_system = 'agent-os' AND kind = 'youtube-analyses'
        LIMIT 1`;
      const snapshot = rows[0];
      return json(res, 200, {
        ok: true,
        snapshot_id: snapshot?.snapshot_id || null,
        generated_at: snapshot?.generated_at || null,
        item_count: snapshot?.item_count || 0,
        items: storedItems(snapshot?.items),
      });
    }

    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });
    if (!syncTokenValid(req)) return json(res, 401, { ok: false, error: 'Unauthorized' });

    let body;
    try {
      body = parseBody(req);
    } catch {
      return json(res, 400, { ok: false, error: 'Invalid YouTube analyses snapshot' });
    }
    const snapshot = cleanSnapshot(body);
    if (!snapshot) return json(res, 400, { ok: false, error: 'Invalid YouTube analyses snapshot' });

    await sql`INSERT INTO workspace_youtube_analyses (
      source_system, schema_version, kind, snapshot_id, generated_at, item_count, items
    ) VALUES (
      ${snapshot.source_system}, ${snapshot.schema_version}, ${snapshot.kind},
      ${snapshot.snapshot_id}, ${snapshot.generated_at}, ${snapshot.item_count},
      ${JSON.stringify(snapshot.items)}::jsonb
    ) ON CONFLICT (source_system) DO UPDATE SET
      schema_version = EXCLUDED.schema_version,
      kind = EXCLUDED.kind,
      snapshot_id = EXCLUDED.snapshot_id,
      generated_at = EXCLUDED.generated_at,
      item_count = EXCLUDED.item_count,
      items = EXCLUDED.items,
      received_at = NOW()`;
    return json(res, 200, { ok: true, snapshot_id: snapshot.snapshot_id, item_count: snapshot.item_count });
  } catch {
    return json(res, 500, { ok: false, error: 'Workspace analyses unavailable' });
  }
}
