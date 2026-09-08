import { getSql, json, parseBody, requireSession, sameOrigin } from './_workspace.mjs';

const CHECKLIST_ID = 'v3-playtest-2026-09-08';

async function ensureTable(sql) {
  await sql`CREATE TABLE IF NOT EXISTS workspace_checklists (
    checklist_id TEXT PRIMARY KEY,
    completed_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
}

function cleanCompleted(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(item => String(item || '').trim().slice(0, 120)).filter(Boolean))].slice(0, 300);
}

function cleanNotes(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).slice(0, 300).map(([key, note]) => [
    String(key || '').trim().slice(0, 120),
    String(note || '').trim().slice(0, 1000),
  ]).filter(([key]) => key));
}

export default async function handler(req, res) {
  try {
    const session = await requireSession(req);
    if (!session) return json(res, 401, { ok: false, error: 'Unauthorized' });
    const sql = getSql();
    await ensureTable(sql);

    if (req.method === 'GET') {
      const rows = await sql`SELECT checklist_id, completed_items, notes, updated_at FROM workspace_checklists WHERE checklist_id = ${CHECKLIST_ID} LIMIT 1`;
      const row = rows[0];
      return json(res, 200, {
        ok: true,
        checklist_id: CHECKLIST_ID,
        completed_items: Array.isArray(row?.completed_items) ? row.completed_items : [],
        notes: row?.notes && typeof row.notes === 'object' ? row.notes : {},
        updated_at: row?.updated_at || null,
      });
    }

    if (req.method !== 'PATCH') return json(res, 405, { ok: false, error: 'Method not allowed' });
    if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'Origin not allowed' });

    const body = parseBody(req);
    const completed = cleanCompleted(body.completed_items);
    const notes = cleanNotes(body.notes);
    const rows = await sql`
      INSERT INTO workspace_checklists (checklist_id, completed_items, notes, updated_at)
      VALUES (${CHECKLIST_ID}, ${JSON.stringify(completed)}::jsonb, ${JSON.stringify(notes)}::jsonb, NOW())
      ON CONFLICT (checklist_id) DO UPDATE SET
        completed_items = EXCLUDED.completed_items,
        notes = EXCLUDED.notes,
        updated_at = NOW()
      RETURNING checklist_id, completed_items, notes, updated_at
    `;
    return json(res, 200, { ok: true, ...rows[0] });
  } catch (error) {
    console.error('workspace checklist failed', error);
    return json(res, 500, { ok: false, error: 'Workspace checklist failed' });
  }
}
