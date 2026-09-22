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
  await sql`ALTER TABLE workspace_commands ADD COLUMN IF NOT EXISTS command_kind TEXT NOT NULL DEFAULT 'owner_command'`;
  await sql`ALTER TABLE workspace_commands ADD COLUMN IF NOT EXISTS payload JSONB`;
  await sql`ALTER TABLE workspace_commands ADD COLUMN IF NOT EXISTS content_hash TEXT`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS workspace_commands_content_hash_idx ON workspace_commands(content_hash) WHERE content_hash IS NOT NULL`;
}

function sprintMarkdown(directive) {
  const lines = [
    '# AILHAT SPRINT DIRECTIVE',
    '',
    `DIRECTIVE ID: ${directive.id}`,
    `SOURCE: ailhat Portfolio Intelligence`,
    `SELECTION: ${directive.selectionMode}`,
    `ITEM COUNT: ${directive.items.length}`,
    `DEFERRED AILHAT SOURCES: ${(directive.deferredSourceIds || []).join(', ') || 'none'}`,
    'AUTHORITY: accepted owner sprint intent; AgentOS governance still applies',
    '',
    '## Sprint objective',
    'Resolve the five highest-value selected portfolio outcomes and return verified evidence.',
    '',
    '## Shared constraints',
    '- preserve product and authorization boundaries',
    '- resolve dependencies before blocked downstream work',
    '- batch compatible changes where appropriate',
    '- do not infer permission from ailhat recommendation',
    '- do not mark complete until intended behavior is independently verified and evidence is recorded',
  ];
  directive.items.forEach((item, index) => {
    lines.push(
      '',
      `## ${index + 1} — ${item.title}`,
      `AILHAT RANK: ${item.sourceRank ?? 'owner-added'}`,
      `OUTCOME: ${item.outcome || item.title}`,
      `WHY NOW: ${item.whyNow || 'Owner override'}`,
      `PRODUCT / REPO: ${item.productName || 'Portfolio'}${item.repository ? ' · ' + item.repository : ''}`,
      `DEPENDENCIES: ${(item.dependencies || []).join('; ') || 'none recorded'}`,
      `BLOCKERS: ${(item.blockers || []).join('; ') || 'none recorded'}`,
      'ACCEPTANCE:',
      ...(item.acceptanceCriteria || []).map(value => '- ' + value),
      `VERIFY: ${item.verification || 'Independent verification required.'}`,
      `OVERRIDE: ${item.override ? 'owner changed ailhat recommendation/order' : 'none'}`,
      `SOURCE: ${item.sourceId || 'owner override'}`,
    );
  });
  lines.push(
    '',
    '## Completion gate',
    'Resolve every selected item to either verified complete or explicitly blocked/deferred with reason, evidence, and canonical AgentOS state updated.',
    ''
  );
  return lines.join('\n');
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
        RETURNING id, command_text, command_kind, payload, content_hash, status, claim_id, created_at`;
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
      if (req.query?.view === 'sprint-recommendation') {
        const token = process.env.AILHAT_WORKSPACE_READ_TOKEN;
        const endpoint = process.env.AILHAT_NEXT_SPRINT_URL || 'https://ailhat.vercel.app/api/next-sprint';
        if (!token) return json(res, 503, { ok:false, error:'AILHAT_WORKSPACE_READ_TOKEN is not configured' });
        const response = await fetch(endpoint, { headers:{ Authorization:'Bearer '+token, Accept:'application/json' } });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) return json(res, 502, { ok:false, error:payload.error || 'ailhat recommendation unavailable', upstream_status:response.status });
        return json(res, 200, payload);
      }
      if (req.query?.view === 'sprint-directives') {
        await ensureCommandTable(sql);
        const directives = await sql`SELECT id,status,payload,runtime_directive_id,runtime_task_id,governance,error,created_at,updated_at
          FROM workspace_commands WHERE command_kind = 'ailhat_sprint' ORDER BY created_at DESC LIMIT 20`;
        return json(res, 200, { ok:true, directives });
      }
      if (req.query?.view === 'deployments') {
        const token = process.env.VERCEL_TOKEN;
        const teamId = process.env.VERCEL_TEAM_ID || 'team_o8DEWGS5bzF8jdgWsD9IfBec';
        const projects = [
          ['prj_p0OqGFvZZU8940ePrXIoVocuTUl7','ASHWOOD'],
          ['prj_yMUW9t71FNsaFeJSNntNCV4tZZFe','ledgato'],
          ['prj_ocnKA4Xr7Jd1aTjUKcRjYgsniy5l','ALVIRA'],
          ['prj_dqOUuTJPaegWYi3l4f9Kx8vxyWOe','ailhat']
        ];
        if (!token) return json(res, 503, { ok:false, error:'VERCEL_TOKEN is not configured' });
        const since = Date.now() - 86400000;
        const deployments = [];
        await Promise.all(projects.map(async ([projectId, projectName]) => {
          const url = new URL('https://api.vercel.com/v6/deployments');
          url.searchParams.set('projectId', projectId);
          url.searchParams.set('teamId', teamId);
          url.searchParams.set('since', String(since));
          url.searchParams.set('limit', '100');
          const response = await fetch(url, { headers:{ Authorization:'Bearer '+token } });
          if (!response.ok) throw new Error('Vercel deployments '+response.status);
          const payload = await response.json();
          for (const item of payload.deployments || []) deployments.push({
            id:item.uid || item.id, projectId, projectName, created:item.created || item.createdAt,
            state:item.state || item.readyState || 'UNKNOWN', target:item.target || null
          });
        }));
        deployments.sort((a,b)=>b.created-a.created);
        return json(res, 200, { ok:true, limit:100, window_hours:24, observed_at:new Date().toISOString(), deployments });
      }
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
        const commands = await sql`SELECT id, command_text, command_kind, payload, status, runtime_directive_id, runtime_task_id, governance, error, created_at, updated_at FROM workspace_commands ORDER BY created_at DESC LIMIT 30`;
        return json(res, 200, { ok: true, commands });
      }
      if (req.query?.view === 'kanban-transition') {
        await ensureCommandTable(sql);
        const id = String(req.query?.id || '').trim().slice(0, 250);
        if (!id) return json(res, 400, { ok:false, error:'Transition id is required' });
        const rows = await sql`SELECT id,status,payload,governance,error,updated_at
          FROM workspace_commands WHERE id = ${id} AND command_kind = 'kanban_transition' LIMIT 1`;
        if (!rows[0]) return json(res, 404, { ok:false, error:'Transition not found' });
        return json(res, 200, { ok:true, transition:rows[0] });
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

    if (action === 'submit_sprint_directive') {
      await ensureCommandTable(sql);
      const selections = Array.isArray(body.selections) ? body.selections.slice(0, 5) : [];
      if (selections.length !== 5) return json(res, 400, { ok:false, error:'A sprint directive requires exactly five selected items' });
      const items = selections.map((item, index) => ({
        sourceId:String(item?.sourceId || '').slice(0,250) || null,
        sourceRank:Number(item?.sourceRank || 0) || null,
        ownerRank:index + 1,
        title:String(item?.title || '').trim().slice(0,500),
        outcome:String(item?.outcome || item?.title || '').trim().slice(0,1200),
        productId:String(item?.productId || '').slice(0,250) || null,
        productName:String(item?.productName || 'Portfolio').trim().slice(0,200),
        repository:String(item?.repository || '').trim().slice(0,500) || null,
        whyNow:String(item?.whyNow || '').trim().slice(0,2000),
        evidence:Array.isArray(item?.evidence) ? item.evidence.map(v=>String(v).slice(0,1000)).slice(0,12) : [],
        dependencies:Array.isArray(item?.dependencies) ? item.dependencies.map(v=>String(v).slice(0,500)).slice(0,12) : [],
        blockers:Array.isArray(item?.blockers) ? item.blockers.map(v=>String(v).slice(0,500)).slice(0,12) : [],
        acceptanceCriteria:Array.isArray(item?.acceptanceCriteria) ? item.acceptanceCriteria.map(v=>String(v).slice(0,1000)).slice(0,12) : [],
        verification:String(item?.verification || '').trim().slice(0,1500),
        override:Boolean(item?.override) || Number(item?.sourceRank || 0) !== index + 1,
      }));
      if (items.some(item => !item.title || !item.outcome)) return json(res, 400, { ok:false, error:'Every sprint item needs a title and outcome' });
      const sourceGeneratedAt = String(body.source_generated_at || '').slice(0,80) || null;
      const active = await sql`SELECT id,status,payload FROM workspace_commands
        WHERE command_kind = 'ailhat_sprint' AND status NOT IN ('completed','cancelled')
        ORDER BY created_at DESC LIMIT 1`;
      if (active[0]) return json(res, 409, {
        ok:false,
        error:'An accepted sprint is already active. Complete or cancel it before accepting a new recommendation.',
        active:{ id:active[0].id, status:active[0].status, payload:active[0].payload }
      });
      const deferredSourceIds = Array.isArray(body.deferred_source_ids) ? body.deferred_source_ids.map(value=>String(value).slice(0,250)).filter(Boolean).slice(0,20) : [];
      const selectionMode = items.some(item => item.override) || deferredSourceIds.length ? 'owner-overridden' : 'ailhat-default';
      const fingerprint = sha256(JSON.stringify({ sourceGeneratedAt, items, deferredSourceIds }));
      const existing = await sql`SELECT id,status,command_text FROM workspace_commands WHERE content_hash = ${fingerprint} LIMIT 1`;
      if (existing[0]) return json(res, 200, { ok:true, existing:true, id:existing[0].id, status:existing[0].status, markdown:existing[0].command_text });
      const id = 'ailhat-sprint:' + crypto.randomUUID();
      const directive = {
        schema:'workspace.ailhat-sprint/v1', id, source:'ailhat Portfolio Intelligence',
        sourceGeneratedAt, acceptedAt:new Date().toISOString(), selectionMode, deferredSourceIds, items
      };
      const markdown = sprintMarkdown(directive);
      await sql`INSERT INTO workspace_commands(id,command_text,status,source,command_kind,payload,content_hash)
        VALUES(${id},${markdown},'queued','ailhat-workspace','ailhat_sprint',${JSON.stringify(directive)}::jsonb,${fingerprint})`;
      return json(res, 201, { ok:true, existing:false, id, status:'queued', markdown, directive });
    }

    if (action === 'submit_kanban_transition') {
      await ensureCommandTable(sql);
      const taskId = String(body.task_id || '').trim().slice(0,250);
      const workId = String(body.work_id || '').trim().slice(0,250);
      const observedState = String(body.observed_state || '').trim().toUpperCase().slice(0,40);
      const targetState = String(body.target_state || '').trim().toUpperCase().slice(0,40);
      const observedGeneration = Number(body.observed_generation);
      const idempotencyKey = String(body.idempotency_key || '').trim().slice(0,250);
      if (!taskId || !workId || !observedState || !targetState || !idempotencyKey ||
          !Number.isInteger(observedGeneration) || observedGeneration < 0) {
        return json(res, 400, { ok:false, error:'Invalid Kanban transition request' });
      }
      const payload = {
        schema:'workspace.kanban-transition/v1',
        source:'ASHWOOD',
        task_id:taskId,
        work_id:workId,
        observed_state:observedState,
        observed_generation:observedGeneration,
        target_state:targetState,
        actor:'owner',
        idempotency_key:idempotencyKey,
      };
      const fingerprint = sha256(JSON.stringify(payload));
      const existing = await sql`SELECT id,status,payload,governance,error FROM workspace_commands
        WHERE content_hash = ${fingerprint} LIMIT 1`;
      if (existing[0]) return json(res, 200, { ok:true, existing:true, transition:existing[0] });
      const id = 'kanban-transition:' + crypto.randomUUID();
      await sql`INSERT INTO workspace_commands
        (id,command_text,status,source,command_kind,payload,content_hash)
        VALUES(${id},${'Governed Kanban transition '+observedState+' -> '+targetState},'queued',
          'ashwood-kanban','kanban_transition',${JSON.stringify(payload)}::jsonb,${fingerprint})`;
      return json(res, 202, { ok:true, existing:false, id, status:'queued' });
    }

    if (action === 'submit_owner_decision') {
      await ensureCommandTable(sql);
      const taskId = String(body.task_id || '').trim().slice(0, 250);
      const cardId = String(body.card_id || '').trim().slice(0, 250);
      const decision = String(body.decision || '').trim().toLowerCase();
      const observedSnapshot = body.observed_snapshot == null
        ? null
        : String(body.observed_snapshot).trim().slice(0, 250);
      const allowed = new Set(['accept','pause','approve','deny','resume']);
      if (!taskId || !cardId || !allowed.has(decision)) {
        return json(res, 400, { ok:false, error:'Invalid owner decision request' });
      }
      const payload = {
        schema:'workspace.owner-decision/v1',
        thread_id:'operator:primary',
        task_id:taskId,
        card_id:cardId,
        decision,
        observed_snapshot:observedSnapshot,
        surface:'operator',
      };
      const fingerprint = sha256(JSON.stringify(payload));
      const existing = await sql`SELECT id,status,payload,governance,error FROM workspace_commands
        WHERE content_hash = ${fingerprint} LIMIT 1`;
      if (existing[0]) return json(res, 200, { ok:true, existing:true, decision:existing[0] });
      const id = 'owner-decision:' + crypto.randomUUID();
      const commandText = `Owner ${decision} decision for AgentOS task ${taskId}`;
      await sql`INSERT INTO workspace_commands
        (id,command_text,command_kind,payload,content_hash,status,source)
        VALUES(${id},${commandText},'owner_decision',${JSON.stringify(payload)}::jsonb,${fingerprint},'queued','workspace')`;
      return json(res, 202, { ok:true, existing:false, id, status:'queued', decision:payload });
    }

    if (action === 'submit_command') {
      await ensureCommandTable(sql);
      const text = String(body.command || '').trim().slice(0, 2000);
      if (!text) return json(res, 400, { ok: false, error: 'Command cannot be empty' });
      const threadId = String(body.thread_id || 'operator:primary').trim().slice(0, 180) || 'operator:primary';
      const parentCommandId = String(body.parent_command_id || '').trim().slice(0, 250) || null;
      const id = `workspace-command:${crypto.randomUUID()}`;
      const payload = {
        schema: 'workspace.owner-command/v1',
        thread_id: threadId,
        parent_command_id: parentCommandId,
        surface: 'operator',
      };
      await sql`INSERT INTO workspace_commands (id, command_text, command_kind, payload, status, source)
        VALUES (${id}, ${text}, 'owner_command', ${JSON.stringify(payload)}::jsonb, 'queued', 'workspace')`;
      return json(res, 201, { ok: true, id, status: 'queued', thread_id: threadId });
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
