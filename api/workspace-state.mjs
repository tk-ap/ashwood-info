import crypto from 'node:crypto';
import { getSql, json, parseBody, requireSession, sameOrigin } from './_workspace.mjs';

export default async function handler(req, res) {
  try {
    const session = await requireSession(req);
    if (!session) return json(res, 401, { ok: false, error: 'Unauthorized' });
    const sql = getSql();

    if (req.method === 'GET') {
      const evidence = await sql`SELECT id, source, source_label, title, occurred_at, status, goal_id, secondary_goals, confidence, url, notes FROM workspace_evidence ORDER BY occurred_at DESC LIMIT 500`;
      const overrides = await sql`SELECT evidence_id, goal_id FROM workspace_goal_overrides`;
      return json(res, 200, { ok: true, evidence, overrides: Object.fromEntries(overrides.map(row => [row.evidence_id, row.goal_id])) });
    }

    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });
    if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'Origin not allowed' });
    const body = parseBody(req);
    const action = String(body.action || 'add_evidence');

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
