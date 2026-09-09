import { deploymentReviewTarget } from './_review-targets.mjs';
import { getSql, json, requireSession } from './_workspace.mjs';

const CHECKLIST_ID = 'v3-playtest-2026-09-08';
const TARGETS = {
  'ws-workstreams': '/workspace/#workstreams-title',
  'ws-drop': '/workspace/#ashwood-drop',
  'ws-review': '/workspace/#music-intelligence',
  'ws-rights': '/workspace/#music-rights-ledger',
  'music-runtime': '/music/#ashwood-drop-music',
  'gate-open': '/ai-from-zero/build-gate/',
};

// These are the only checklist entries where reaching the destination itself is
// sufficient evidence. Other entries remain manual because they require a
// judgment, a multi-step action, or verification of behavior.
const AUTO_COMPLETE_ON_VISIT = new Set(Object.keys(TARGETS));

async function ensureTable(sql) {
  await sql`CREATE TABLE IF NOT EXISTS workspace_checklists (
    checklist_id TEXT PRIMARY KEY,
    completed_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes JSONB NOT NULL DEFAULT '{}'::jsonb,
    auto_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    deployment_completed_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    deployment_notes JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`ALTER TABLE workspace_checklists ADD COLUMN IF NOT EXISTS review_started JSONB NOT NULL DEFAULT '{}'::jsonb`;
}

function redirect(res, location) {
  res.statusCode = 302;
  res.setHeader('Location', location);
  res.setHeader('Cache-Control', 'no-store');
  res.end();
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'Method not allowed' });
    const session = await requireSession(req);
    const rawUrl = new URL(req.url, 'https://ashwood.local');
    const itemId = String(rawUrl.searchParams.get('item') || '').trim();
    if (!session) return redirect(res, `/workspace/?review_return=${encodeURIComponent(itemId)}`);
    const sql = getSql();
    await ensureTable(sql);
    let target = Object.hasOwn(TARGETS, itemId) ? TARGETS[itemId] : null;
    if (!target) {
      const rows = await sql`SELECT auto_items FROM workspace_checklists WHERE checklist_id = ${CHECKLIST_ID} LIMIT 1`;
      const items = Array.isArray(rows[0]?.auto_items) ? rows[0].auto_items : [];
      target = deploymentReviewTarget(items.find(item => item.id === itemId));
    }
    if (!target) return redirect(res, '/workspace/v3-playtest/');

    // Record arrival separately from approval. Merge in SQL to preserve concurrent visits.
    const started = JSON.stringify({ [itemId]: new Date().toISOString() });
    const completed = JSON.stringify(AUTO_COMPLETE_ON_VISIT.has(itemId) ? [itemId] : []);
    await sql`
      INSERT INTO workspace_checklists (checklist_id, review_started, completed_items, updated_at)
      VALUES (${CHECKLIST_ID}, ${started}::jsonb, ${completed}::jsonb, NOW())
      ON CONFLICT (checklist_id) DO UPDATE SET
        review_started = EXCLUDED.review_started || workspace_checklists.review_started,
        completed_items = CASE WHEN ${AUTO_COMPLETE_ON_VISIT.has(itemId)}
          AND NOT workspace_checklists.completed_items @> ${completed}::jsonb
          THEN workspace_checklists.completed_items || ${completed}::jsonb
          ELSE workspace_checklists.completed_items END,
        updated_at = NOW()
    `;

    return redirect(res, target);
  } catch (error) {
    console.error('workspace review visit failed', error);
    return redirect(res, '/workspace/v3-playtest/');
  }
}
