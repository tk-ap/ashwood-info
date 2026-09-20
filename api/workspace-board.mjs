import crypto from 'node:crypto';
import { getSql, json, parseBody, requireSession, sha256 } from './_workspace.mjs';

// Read-only mirror of AgentOS/Hermes work state for the private ASHWOOD Workspace.
// AgentOS remains canonical. ASHWOOD never moves, approves, unblocks, or completes
// work through this endpoint.

function syncTokenValid(req) {
  const expected = process.env.WORKSPACE_BOARD_SYNC_TOKEN || process.env.WORKSPACE_COMMAND_SYNC_TOKEN;
  if (!expected) return false;
  const header = String(req.headers?.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return false;
  const a = Buffer.from(sha256(token), 'hex');
  const b = Buffer.from(sha256(expected), 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function ensureTable(sql) {
  await sql`CREATE TABLE IF NOT EXISTS workspace_board (
    board_key TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    status TEXT,
    assignee TEXT,
    product TEXT,
    workspace TEXT,
    updated_at TIMESTAMPTZ NOT NULL
  )`;
  // Additive migration for the richer AgentOS mirror. Existing rows remain
  // readable and acquire null/default values until the next snapshot.
  await sql`ALTER TABLE workspace_board ADD COLUMN IF NOT EXISTS source_system TEXT NOT NULL DEFAULT 'agent-os'`;
  await sql`ALTER TABLE workspace_board ADD COLUMN IF NOT EXISTS kind TEXT`;
  await sql`ALTER TABLE workspace_board ADD COLUMN IF NOT EXISTS lane TEXT`;
  await sql`ALTER TABLE workspace_board ADD COLUMN IF NOT EXISTS phase TEXT`;
  await sql`ALTER TABLE workspace_board ADD COLUMN IF NOT EXISTS work_id TEXT`;
  await sql`ALTER TABLE workspace_board ADD COLUMN IF NOT EXISTS task_id TEXT`;
  await sql`ALTER TABLE workspace_board ADD COLUMN IF NOT EXISTS priority TEXT`;
  await sql`ALTER TABLE workspace_board ADD COLUMN IF NOT EXISTS source TEXT`;
  await sql`ALTER TABLE workspace_board ADD COLUMN IF NOT EXISTS summary TEXT`;
  await sql`ALTER TABLE workspace_board ADD COLUMN IF NOT EXISTS blocker TEXT`;
  await sql`ALTER TABLE workspace_board ADD COLUMN IF NOT EXISTS next_gate TEXT`;
  await sql`ALTER TABLE workspace_board ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE workspace_board ADD COLUMN IF NOT EXISTS authority_expires TIMESTAMPTZ`;
  await sql`ALTER TABLE workspace_board ADD COLUMN IF NOT EXISTS canonical_url TEXT`;
  await sql`ALTER TABLE workspace_board ADD COLUMN IF NOT EXISTS observed_at TIMESTAMPTZ`;
  await sql`ALTER TABLE workspace_board ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb`;
}

function text(value, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}

function optionalText(value, max = 500) {
  const valueText = text(value, max);
  return valueText || null;
}

function cleanRow(row, fallbackObservedAt) {
  const boardKey = text(row?.board_key, 250);
  const title = text(row?.title, 500);
  if (!boardKey || !title) return null;

  const updatedAt = row?.updated_at ? new Date(row.updated_at) : new Date(fallbackObservedAt || Date.now());
  const observedAt = row?.observed_at ? new Date(row.observed_at) : new Date(fallbackObservedAt || Date.now());
  const expires = row?.authority_expires ? new Date(row.authority_expires) : null;
  if (Number.isNaN(updatedAt.getTime()) || Number.isNaN(observedAt.getTime())) return null;
  if (expires && Number.isNaN(expires.getTime())) return null;

  return {
    boardKey,
    sourceSystem: text(row?.source_system || 'agent-os', 80),
    kind: optionalText(row?.kind, 40),
    lane: optionalText(row?.lane, 40),
    title,
    status: optionalText(row?.status, 80),
    phase: optionalText(row?.phase, 80),
    assignee: optionalText(row?.assignee, 120),
    product: optionalText(row?.product, 120),
    workspace: optionalText(row?.workspace, 500),
    workId: optionalText(row?.work_id, 250),
    taskId: optionalText(row?.task_id, 250),
    priority: optionalText(row?.priority, 20),
    source: optionalText(row?.source, 80),
    summary: optionalText(row?.summary, 1500),
    blocker: optionalText(row?.blocker, 1200),
    nextGate: optionalText(row?.next_gate, 1200),
    attempts: Math.max(0, Math.min(999, Number(row?.attempts || 0) || 0)),
    authorityExpires: expires ? expires.toISOString() : null,
    canonicalUrl: optionalText(row?.canonical_url, 1200),
    updatedAt: updatedAt.toISOString(),
    observedAt: observedAt.toISOString(),
    metadata: row?.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
      ? row.metadata : {},
  };
}

export default async function handler(req, res) {
  try {
    const sql = getSql();
    await ensureTable(sql);

    if (req.method === 'GET') {
      const session = await requireSession(req);
      if (!session) return json(res, 401, { ok: false, error: 'Unauthorized' });
      const rows = await sql`SELECT
        board_key, source_system, kind, lane, title, status, phase, assignee,
        product, workspace, work_id, task_id, priority, source, summary, blocker,
        next_gate, attempts, authority_expires, canonical_url, updated_at,
        observed_at, metadata
        FROM workspace_board
        ORDER BY
          CASE lane
            WHEN 'stuck' THEN 0
            WHEN 'review' THEN 1
            WHEN 'in_progress' THEN 2
            WHEN 'backlog' THEN 3
            WHEN 'done' THEN 4
            ELSE 5
          END,
          updated_at DESC
        LIMIT 500`;
      const freshness = rows.reduce((latest, row) => {
        const value = row.observed_at ? new Date(row.observed_at).getTime() : 0;
        return Math.max(latest, Number.isFinite(value) ? value : 0);
      }, 0);
      return json(res, 200, {
        ok: true,
        rows,
        observed_at: freshness ? new Date(freshness).toISOString() : null,
      });
    }

    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });
    if (!syncTokenValid(req)) return json(res, 403, { ok: false, error: 'Invalid sync token' });

    const body = parseBody(req);
    const fallbackObservedAt = body.observed_at || new Date().toISOString();
    const rows = (Array.isArray(body.rows) ? body.rows : [])
      .map(row => cleanRow(row, fallbackObservedAt))
      .filter(Boolean)
      .slice(0, 500);
    if (!rows.length) return json(res, 400, { ok: false, error: 'Empty snapshot' });

    const sourceSystem = text(body.source_system || 'agent-os', 80);
    if (body.replace === true) {
      const keep = rows.map(row => row.boardKey);
      await sql`DELETE FROM workspace_board
        WHERE source_system = ${sourceSystem}
          AND NOT (board_key = ANY(${keep}))`;
    }

    for (const row of rows) {
      await sql`INSERT INTO workspace_board (
        board_key, source_system, kind, lane, title, status, phase, assignee,
        product, workspace, work_id, task_id, priority, source, summary, blocker,
        next_gate, attempts, authority_expires, canonical_url, updated_at,
        observed_at, metadata
      ) VALUES (
        ${row.boardKey}, ${row.sourceSystem}, ${row.kind}, ${row.lane},
        ${row.title}, ${row.status}, ${row.phase}, ${row.assignee},
        ${row.product}, ${row.workspace}, ${row.workId}, ${row.taskId},
        ${row.priority}, ${row.source}, ${row.summary}, ${row.blocker},
        ${row.nextGate}, ${row.attempts}, ${row.authorityExpires},
        ${row.canonicalUrl}, ${row.updatedAt}, ${row.observedAt},
        ${JSON.stringify(row.metadata)}::jsonb
      ) ON CONFLICT (board_key) DO UPDATE SET
        source_system = EXCLUDED.source_system,
        kind = EXCLUDED.kind,
        lane = EXCLUDED.lane,
        title = EXCLUDED.title,
        status = EXCLUDED.status,
        phase = EXCLUDED.phase,
        assignee = EXCLUDED.assignee,
        product = EXCLUDED.product,
        workspace = EXCLUDED.workspace,
        work_id = EXCLUDED.work_id,
        task_id = EXCLUDED.task_id,
        priority = EXCLUDED.priority,
        source = EXCLUDED.source,
        summary = EXCLUDED.summary,
        blocker = EXCLUDED.blocker,
        next_gate = EXCLUDED.next_gate,
        attempts = EXCLUDED.attempts,
        authority_expires = EXCLUDED.authority_expires,
        canonical_url = EXCLUDED.canonical_url,
        updated_at = EXCLUDED.updated_at,
        observed_at = EXCLUDED.observed_at,
        metadata = EXCLUDED.metadata`;
    }

    return json(res, 200, {
      ok: true,
      upserted: rows.length,
      source_system: sourceSystem,
      observed_at: fallbackObservedAt,
    });
  } catch (error) {
    console.error('workspace board failed', error);
    return json(res, 500, { ok: false, error: 'Workspace board failed' });
  }
}
