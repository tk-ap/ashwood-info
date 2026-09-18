import crypto from 'node:crypto';
import { getSql, json, parseBody, requireSession, sameOrigin, sha256 } from './_workspace.mjs';


const OPEN_COMMANDS = ['queued', 'claimed'];

function fleetTokenValid(req) {
  const expected = process.env.ASHWOOD_AGENTOS_SYNC_TOKEN || process.env.WORKSPACE_BOARD_SYNC_TOKEN;
  if (!expected) return false;
  const header = String(req.headers?.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return false;
  const actual = Buffer.from(sha256(token), 'hex');
  const configured = Buffer.from(sha256(expected), 'hex');
  return actual.length === configured.length && crypto.timingSafeEqual(actual, configured);
}

async function ensureSchema(sql) {
  await sql`CREATE TABLE IF NOT EXISTS workspace_agentos_commands (
    command_id TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    claimed_at TIMESTAMPTZ,
    claimed_by TEXT,
    accepted_at TIMESTAMPTZ,
    run_id TEXT,
    error TEXT
  )`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS workspace_agentos_one_open_kind
    ON workspace_agentos_commands (kind) WHERE status IN ('queued', 'claimed')`;
  await sql`CREATE TABLE IF NOT EXISTS workspace_agentos_projection (
    scenario_id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    payload JSONB NOT NULL,
    observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
}

function publicCommand(row) {
  if (!row) return null;
  return {
    command_id: row.command_id,
    kind: row.kind,
    status: row.status,
    created_at: row.created_at,
    claimed_at: row.claimed_at,
    accepted_at: row.accepted_at,
    run_id: row.run_id,
    error: row.error,
  };
}

function sanitizeProjection(input) {
  const text = (key, limit = 200) => String(input?.[key] ?? '').slice(0, limit);
  const number = key => Number.isFinite(Number(input?.[key])) ? Number(input[key]) : null;
  if (text('scenario_id', 80) !== 'long-weekend-001' || !text('run_id', 160)) {
    throw new Error('Invalid AgentOS projection identity');
  }
  return {
    scenario_id: 'long-weekend-001',
    run_id: text('run_id', 160),
    work_id: text('work_id', 160),
    directive_id: number('directive_id'),
    task_id: text('task_id', 200) || null,
    phase: text('phase', 80) || 'unknown',
    task_status: text('task_status', 80) || null,
    milchik: text('milchik', 200),
    specialist: text('specialist', 120),
    harness: text('harness', 160),
    event_count: number('event_count') ?? 0,
    latest_event: text('latest_event', 120) || null,
    latest_event_at: number('latest_event_at'),
    next_gate: text('next_gate', 240),
    production_authority: 'none',
  };
}

export function projectionFreshness(observedAt, now = Date.now()) {
  if (!observedAt) return 'unconfirmed';
  const age = now - new Date(observedAt).getTime();
  if (!Number.isFinite(age)) return 'unconfirmed';
  if (age <= 10 * 60 * 1000) return 'current';
  if (age <= 60 * 60 * 1000) return 'watch';
  return 'offline';
}

export default async function handler(req, res) {
  try {
    const sql = getSql();
    await ensureSchema(sql);

    if (req.method === 'GET') {
      const session = await requireSession(req);
      if (!session) return json(res, 401, { ok: false, error: 'Unauthorized' });
      const commands = await sql`SELECT * FROM workspace_agentos_commands ORDER BY created_at DESC LIMIT 1`;
      const projections = await sql`SELECT scenario_id, run_id, payload, observed_at FROM workspace_agentos_projection WHERE scenario_id = 'long-weekend-001' LIMIT 1`;
      const projection = projections[0] || null;
      return json(res, 200, {
        ok: true,
        command: publicCommand(commands[0]),
        projection: projection?.payload || null,
        observed_at: projection?.observed_at || null,
        freshness: projectionFreshness(projection?.observed_at),
      });
    }

    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });
    const body = parseBody(req);
    const action = String(body.action || '');

    if (action === 'start_long_weekend') {
      const session = await requireSession(req);
      if (!session) return json(res, 401, { ok: false, error: 'Unauthorized' });
      if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'Origin not allowed' });
      const prior = await sql`SELECT * FROM workspace_agentos_commands
        WHERE kind = 'long_weekend_001' AND status <> 'failed'
        ORDER BY created_at DESC LIMIT 1`;
      if (prior[0]) return json(res, 200, { ok: true, created: false, command: publicCommand(prior[0]) });
      const id = `ashwood:${crypto.randomUUID()}`;
      const inserted = await sql`INSERT INTO workspace_agentos_commands (command_id, kind)
        VALUES (${id}, 'long_weekend_001')
        ON CONFLICT DO NOTHING
        RETURNING *`;
      const existing = inserted[0] ? inserted : await sql`SELECT * FROM workspace_agentos_commands
        WHERE kind = 'long_weekend_001' AND status IN ('queued', 'claimed')
        ORDER BY created_at DESC LIMIT 1`;
      return json(res, inserted[0] ? 202 : 200, {
        ok: true,
        created: Boolean(inserted[0]),
        command: publicCommand(existing[0]),
      });
    }

    if (!fleetTokenValid(req)) return json(res, 403, { ok: false, error: 'Invalid fleet token' });

    if (action === 'claim') {
      const consumer = String(body.consumer || 'agentos').slice(0, 120);
      const rows = await sql`WITH candidate AS (
          SELECT command_id FROM workspace_agentos_commands
          WHERE status = 'queued' OR (status = 'claimed' AND claimed_at < NOW() - INTERVAL '10 minutes')
          ORDER BY created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED
        )
        UPDATE workspace_agentos_commands
        SET status = 'claimed', claimed_at = NOW(), claimed_by = ${consumer}, error = NULL
        WHERE command_id IN (SELECT command_id FROM candidate)
        RETURNING command_id, kind, status, created_at, claimed_at`;
      return json(res, 200, { ok: true, command: rows[0] || null });
    }

    if (action === 'project') {
      const projection = sanitizeProjection(body.projection);
      await sql`INSERT INTO workspace_agentos_projection (scenario_id, run_id, payload, observed_at)
        VALUES (${projection.scenario_id}, ${projection.run_id}, ${JSON.stringify(projection)}::jsonb, NOW())
        ON CONFLICT (scenario_id) DO UPDATE SET run_id = EXCLUDED.run_id, payload = EXCLUDED.payload, observed_at = NOW()`;
      await sql`UPDATE workspace_agentos_commands
        SET status = 'accepted', accepted_at = COALESCE(accepted_at, NOW()), run_id = ${projection.run_id}
        WHERE kind = 'long_weekend_001' AND status IN ('queued', 'claimed')`;
      return json(res, 200, { ok: true });
    }

    if (action === 'fail') {
      const commandId = String(body.command_id || '').slice(0, 200);
      const error = String(body.error || 'AgentOS could not accept the command').slice(0, 500);
      await sql`UPDATE workspace_agentos_commands SET status = 'failed', error = ${error}
        WHERE command_id = ${commandId} AND status = 'claimed'`;
      return json(res, 200, { ok: true });
    }

    return json(res, 400, { ok: false, error: 'Unknown action' });
  } catch (error) {
    console.error('workspace AgentOS bridge failed', error);
    return json(res, 500, { ok: false, error: 'Workspace AgentOS bridge failed' });
  }
}

export { OPEN_COMMANDS, sanitizeProjection };
