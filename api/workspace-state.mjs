import crypto from 'node:crypto';
import { getSql, json, parseBody, requireSession, sameOrigin, sha256 } from './_workspace.mjs';
import { SIGNAL_ACTIVE_DAYS, monitoringSummary, splitSignalAttention } from './_attention.mjs';


function commandSyncTokenValid(req) {
  const expected = process.env.WORKSPACE_COMMAND_SYNC_TOKEN || process.env.WORKSPACE_BOARD_SYNC_TOKEN;
  if (!expected) return false;
  const header = String(req.headers?.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return false;
  const left = Buffer.from(sha256(token), 'hex');
  const right = Buffer.from(sha256(expected), 'hex');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

async function ensureCommandTable(sql) {
  await sql`CREATE TABLE IF NOT EXISTS workspace_commands (
    id TEXT PRIMARY KEY,
    command_text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    source TEXT NOT NULL DEFAULT 'workspace',
    claim_id TEXT,
    claimed_at TIMESTAMPTZ,
    lease_expires_at TIMESTAMPTZ,
    runtime_directive_id TEXT,
    runtime_task_id TEXT,
    governance JSONB,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
}

const NETWORK_TYPES = new Set(['SPONSOR','INVITE','REFERRAL','COLLABORATOR','INTRODUCTION','DESIGN_PARTNER','OTHER']);
const NETWORK_STATUSES = new Set(['RESEARCH','READY','CONTACTED','REPLIED','MEETING','PROPOSAL','WON','LOST','INVITED','ACCEPTED','ACTIVE','PAUSED']);
const trimNetwork = (value, max = 500) => {
  const text = String(value ?? '').trim();
  return text ? text.slice(0, max) : null;
};

async function ensureNetworkTable(sql) {
  await sql`CREATE TABLE IF NOT EXISTS workspace_network_relationships (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    organization TEXT,
    relationship_type TEXT NOT NULL DEFAULT 'OTHER',
    status TEXT NOT NULL DEFAULT 'RESEARCH',
    project_fit TEXT,
    why_care TEXT,
    contact TEXT,
    channel TEXT,
    support_level TEXT,
    source TEXT,
    referral_url TEXT,
    next_action TEXT,
    next_action_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS workspace_network_relationships_status_idx ON workspace_network_relationships(status, updated_at DESC)`;
}

const COMMAND_RUNTIME_STATES = new Set([
  'routing',
  'governance_unavailable',
  'governance_denied',
  'governance_approval_required',
  'route_failed',
  'dispatched',
  'completed',
  'cancelled',
]);

export default async function handler(req, res) {
  try {
    const sql = getSql();
    const machineAuthorized = commandSyncTokenValid(req);

    if (req.method === 'GET' && req.query?.view === 'command-next' && machineAuthorized) {
      await ensureCommandTable(sql);
      const claimId = crypto.randomUUID();
      const rows = await sql`UPDATE workspace_commands
        SET status = 'claimed', claim_id = ${claimId}, claimed_at = NOW(),
            lease_expires_at = NOW() + INTERVAL '5 minutes', updated_at = NOW()
        WHERE id = (
          SELECT id FROM workspace_commands
          WHERE status = 'queued'
             OR (status = 'claimed' AND lease_expires_at IS NOT NULL AND lease_expires_at <= NOW())
          ORDER BY created_at ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        )
        RETURNING id, command_text, status, claim_id, created_at`;
      return json(res, 200, { ok: true, command: rows[0] || null });
    }

    let body = null;
    let action = null;
    if (req.method === 'POST') {
      body = parseBody(req);
      action = String(body.action || 'add_evidence');
      if (action === 'command_runtime_update') {
        if (!machineAuthorized) return json(res, 403, { ok: false, error: 'Invalid command sync token' });
        await ensureCommandTable(sql);
        const id = String(body.id || '').trim().slice(0, 250);
        const status = String(body.status || '').trim().toLowerCase();
        if (!id || !COMMAND_RUNTIME_STATES.has(status)) return json(res, 400, { ok: false, error: 'Invalid command runtime update' });
        const directiveId = String(body.runtime_directive_id || '').trim().slice(0, 120) || null;
        const taskId = String(body.runtime_task_id || '').trim().slice(0, 250) || null;
        const error = String(body.error || '').trim().slice(0, 1200) || null;
        const governance = body.governance && typeof body.governance === 'object' && !Array.isArray(body.governance)
          ? body.governance
          : null;
        const rows = await sql`UPDATE workspace_commands SET
          status = ${status},
          runtime_directive_id = COALESCE(${directiveId}, runtime_directive_id),
          runtime_task_id = COALESCE(${taskId}, runtime_task_id),
          governance = COALESCE(${governance ? JSON.stringify(governance) : null}::jsonb, governance),
          error = ${error},
          claim_id = NULL,
          lease_expires_at = NULL,
          updated_at = NOW()
          WHERE id = ${id}
          RETURNING id, status`;
        if (!rows[0]) return json(res, 404, { ok: false, error: 'Command not found' });
        return json(res, 200, { ok: true, id, status });
      }
    }

    const session = await requireSession(req);
    if (!session) return json(res, 401, { ok: false, error: 'Unauthorized' });

    if (req.method === 'GET') {
      if (req.query?.view === 'feed') {
        const feed = await sql`SELECT id, source, source_label, title, occurred_at, status, goal_id, confidence, url, notes FROM workspace_evidence WHERE source IN ('ailhat', 'agent-os', 'board', 'github', 'ledgato', 'alvira') ORDER BY occurred_at DESC LIMIT 250`;
        const attention = splitSignalAttention(feed);
        return json(res, 200, {
          ok: true,
          feed: attention.active,
          attention,
          monitoring: monitoringSummary(feed),
          attention_policy: { ordinary_signal_days: SIGNAL_ACTIVE_DAYS },
        });
      }
      if (req.query?.view === 'build_logs') {
        const logs = await sql`SELECT id, title, occurred_at, status, notes FROM workspace_evidence WHERE source = 'build_log' ORDER BY occurred_at DESC LIMIT 500`;
        return json(res, 200, { ok: true, logs });
      }
      if (req.query?.view === 'commands') {
        await ensureCommandTable(sql);
        const commands = await sql`SELECT id, command_text, status, runtime_directive_id, runtime_task_id, governance, error, created_at, updated_at FROM workspace_commands ORDER BY created_at DESC LIMIT 30`;
        return json(res, 200, { ok: true, commands });
      }
      if (req.query?.view === 'network') {
        await ensureNetworkTable(sql);
        const relationships = await sql`
          SELECT id,name,organization,relationship_type,status,project_fit,why_care,contact,channel,
            support_level,source,referral_url,next_action,next_action_at,notes,created_at,updated_at
          FROM workspace_network_relationships
          ORDER BY
            CASE status
              WHEN 'REPLIED' THEN 1 WHEN 'MEETING' THEN 2 WHEN 'PROPOSAL' THEN 3
              WHEN 'CONTACTED' THEN 4 WHEN 'READY' THEN 5 WHEN 'INVITED' THEN 6
              WHEN 'ACCEPTED' THEN 7 WHEN 'ACTIVE' THEN 8 WHEN 'RESEARCH' THEN 9
              WHEN 'PAUSED' THEN 10 WHEN 'WON' THEN 11 WHEN 'LOST' THEN 12 ELSE 13 END,
            COALESCE(next_action_at,updated_at) ASC
        `;
        return json(res, 200, { ok: true, relationships });
      }
      const evidence = await sql`SELECT id, source, source_label, title, occurred_at, status, goal_id, secondary_goals, confidence, url, notes FROM workspace_evidence ORDER BY occurred_at DESC LIMIT 500`;
      const overrides = await sql`SELECT evidence_id, goal_id FROM workspace_goal_overrides`;
      return json(res, 200, { ok: true, evidence, overrides: Object.fromEntries(overrides.map(row => [row.evidence_id, row.goal_id])) });
    }

    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });
    if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'Origin not allowed' });

    if (action === 'network_upsert') {
      await ensureNetworkTable(sql);
      const name = trimNetwork(body.name, 220);
      if (!name) return json(res, 400, { ok: false, error: 'Name is required' });
      const id = trimNetwork(body.id, 250) || `network:${crypto.randomUUID()}`;
      const type = String(body.relationship_type || 'OTHER').toUpperCase();
      const status = String(body.status || 'RESEARCH').toUpperCase();
      const nextActionAt = body.next_action_at ? new Date(body.next_action_at) : null;
      await sql`
        INSERT INTO workspace_network_relationships(
          id,name,organization,relationship_type,status,project_fit,why_care,contact,channel,
          support_level,source,referral_url,next_action,next_action_at,notes,updated_at
        ) VALUES (
          ${id},${name},${trimNetwork(body.organization,220)},${NETWORK_TYPES.has(type)?type:'OTHER'},
          ${NETWORK_STATUSES.has(status)?status:'RESEARCH'},${trimNetwork(body.project_fit,700)},${trimNetwork(body.why_care,1200)},
          ${trimNetwork(body.contact,500)},${trimNetwork(body.channel,120)},${trimNetwork(body.support_level,250)},
          ${trimNetwork(body.source,250)},${trimNetwork(body.referral_url,1000)},${trimNetwork(body.next_action,1000)},
          ${nextActionAt && !Number.isNaN(nextActionAt.getTime()) ? nextActionAt.toISOString() : null},${trimNetwork(body.notes,4000)},NOW()
        )
        ON CONFLICT(id) DO UPDATE SET
          name=EXCLUDED.name,organization=EXCLUDED.organization,relationship_type=EXCLUDED.relationship_type,
          status=EXCLUDED.status,project_fit=EXCLUDED.project_fit,why_care=EXCLUDED.why_care,
          contact=EXCLUDED.contact,channel=EXCLUDED.channel,support_level=EXCLUDED.support_level,
          source=EXCLUDED.source,referral_url=EXCLUDED.referral_url,next_action=EXCLUDED.next_action,
          next_action_at=EXCLUDED.next_action_at,notes=EXCLUDED.notes,updated_at=NOW()
      `;
      return json(res, 200, { ok: true, id });
    }

    if (action === 'submit_command') {
      await ensureCommandTable(sql);
      const text = String(body.command || '').trim().slice(0, 2000);
      if (!text) return json(res, 400, { ok: false, error: 'Command cannot be empty' });
      const id = `workspace-command:${crypto.randomUUID()}`;
      await sql`INSERT INTO workspace_commands (id, command_text, status, source) VALUES (${id}, ${text}, 'queued', 'workspace')`;
      return json(res, 201, { ok: true, id, status: 'queued' });
    }

    if (action === 'ingest_external_signal') {
      const id = String(body.id || '').trim().slice(0, 250);
      const source = String(body.source || '').trim().slice(0, 40);
      const sourceLabel = String(body.source_label || source).trim().slice(0, 120);
      const title = String(body.title || '').trim().slice(0, 500);
      const goalId = String(body.goal_id || 'ownership').trim().slice(0, 80);
      const status = String(body.status || 'SIGNAL').trim().slice(0, 40);
      const occurredAt = new Date(body.occurred_at || Date.now());
      const confidence = Math.max(0, Math.min(1, Number(body.confidence ?? .5)));
      const notes = String(body.notes || '').trim().slice(0, 2000) || null;
      const url = String(body.url || '').trim().slice(0, 1000) || null;
      if (!id || !source || !title || Number.isNaN(occurredAt.getTime())) return json(res, 400, { ok: false, error: 'Missing signal fields' });
      await sql`INSERT INTO workspace_evidence (id, source, source_label, title, occurred_at, status, goal_id, secondary_goals, confidence, url, notes) VALUES (${id}, ${source}, ${sourceLabel}, ${title}, ${occurredAt.toISOString()}, ${status}, ${goalId}, '[]'::jsonb, ${confidence}, ${url}, ${notes}) ON CONFLICT (id) DO UPDATE SET source_label = EXCLUDED.source_label, title = EXCLUDED.title, occurred_at = EXCLUDED.occurred_at, goal_id = EXCLUDED.goal_id, confidence = EXCLUDED.confidence, url = EXCLUDED.url, notes = EXCLUDED.notes, updated_at = NOW(), status = CASE WHEN workspace_evidence.status IN ('ACCEPTED', 'DISMISSED') THEN workspace_evidence.status ELSE EXCLUDED.status END`;
      return json(res, 200, { ok: true, id });
    }

    if (action === 'record_feed_decision') {
      const id = String(body.id || '').trim().slice(0, 250);
      const status = String(body.status || '').trim().toUpperCase();
      if (!id || !['ACCEPTED', 'DISMISSED'].includes(status)) return json(res, 400, { ok: false, error: 'Invalid feed decision' });
      const updated = await sql`UPDATE workspace_evidence SET status = ${status}, updated_at = NOW() WHERE id = ${id} AND source IN ('ailhat', 'agent-os', 'board', 'github', 'ledgato', 'alvira') RETURNING id`;
      if (!updated[0]) return json(res, 404, { ok: false, error: 'Feed item not found' });
      return json(res, 200, { ok: true, id, status });
    }

    if (action === 'add_evidence') {
      const title = String(body.title || '').trim().slice(0, 500);
      const goalId = String(body.goal_id || '').trim().slice(0, 80);
      const status = String(body.status || 'IN_PROGRESS').trim().slice(0, 40);
      const occurredAt = new Date(body.occurred_at || Date.now());
      const notes = String(body.notes || '').trim().slice(0, 2000) || null;
      if (!title || !goalId || Number.isNaN(occurredAt.getTime())) return json(res, 400, { ok: false, error: 'Missing required evidence fields' });
      const id = `manual:${crypto.randomUUID()}`;
      await sql`INSERT INTO workspace_evidence (id, source, source_label, title, occurred_at, status, goal_id, secondary_goals, confidence, notes) VALUES (${id}, 'manual', 'workspace', ${title}, ${occurredAt.toISOString()}, ${status}, ${goalId}, '[]'::jsonb, 1, ${notes})`;
      return json(res, 201, { ok: true, id });
    }

    if (action === 'set_override') {
      const evidenceId = String(body.evidence_id || '').trim().slice(0, 250);
      const goalId = String(body.goal_id || '').trim().slice(0, 80);
      if (!evidenceId || !goalId) return json(res, 400, { ok: false, error: 'Missing override fields' });
      await sql`INSERT INTO workspace_goal_overrides (evidence_id, goal_id, updated_at) VALUES (${evidenceId}, ${goalId}, NOW()) ON CONFLICT (evidence_id) DO UPDATE SET goal_id = EXCLUDED.goal_id, updated_at = NOW()`;
      return json(res, 200, { ok: true });
    }

    return json(res, 400, { ok: false, error: 'Unknown action' });
  } catch (error) {
    console.error('workspace state failed', error);
    return json(res, 500, { ok: false, error: 'Workspace state failed' });
  }
}
