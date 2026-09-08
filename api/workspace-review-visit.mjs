import { getSql, json, requireSession } from './_workspace.mjs';

const CHECKLIST_ID = 'v3-playtest-2026-09-08';
const TARGETS = {
  'home-wordmark': '/',
  'home-nav': '/',
  'home-workspace-link': '/',
  'home-provenance': '/',
  'home-manifestations': '/',
  'home-wherever': '/',
  'home-in-me': '/',
  'home-audio': '/',
  'home-themes': '/',
  'home-motion': '/',
  'instinct-six': '/',
  'instinct-explain': '/',
  'instinct-progress': '/',
  'instinct-persist': '/',
  'instinct-doc': '/',
  'instinct-instrument': '/',
  'work-modeling': '/',
  'work-music': '/',
  'work-products': '/',
  'work-thesis': '/',
  'work-notes': '/',
  'depth-thread': '/',
  'depth-direct': '/',
  'depth-cta': '/',
  'ws-workstreams': '/workspace/#workstreams-title',
  'ws-drop': '/workspace/#ashwood-drop',
  'ws-meta': '/workspace/#ashwood-drop',
  'ws-review': '/workspace/',
  'ws-modes': '/workspace/',
  'ws-judgments': '/workspace/',
  'ws-no-fake': '/workspace/',
  'ws-catalog': '/workspace/',
  'ws-rights': '/workspace/',
  'ws-rights-fields': '/workspace/',
  'ws-edition': '/workspace/',
  'ws-legal-copy': '/workspace/',
  'music-runtime': '/music/',
  'music-rotation': '/music/',
  'music-special': '/music/',
  'music-private': '/music/',
  'music-mobile': '/music/',
  'gate-open': '/ai-from-zero/build-gate/',
};

// These are the only checklist entries where reaching the destination itself is
// sufficient evidence. Other entries remain manual because they require a
// judgment, a multi-step action, or verification of behavior.
const AUTO_COMPLETE_ON_VISIT = new Set([
  'ws-workstreams',
  'ws-drop',
  'ws-review',
  'ws-rights',
  'music-runtime',
  'gate-open',
]);

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
    const target = TARGETS[itemId] || '/workspace/v3-playtest/';
    if (!session) return redirect(res, `/workspace/?review_return=${encodeURIComponent(itemId)}`);
    if (!TARGETS[itemId]) return redirect(res, '/workspace/v3-playtest/');

    if (AUTO_COMPLETE_ON_VISIT.has(itemId)) {
      const sql = getSql();
      await ensureTable(sql);
      const rows = await sql`SELECT completed_items FROM workspace_checklists WHERE checklist_id = ${CHECKLIST_ID} LIMIT 1`;
      const completed = Array.isArray(rows[0]?.completed_items) ? rows[0].completed_items : [];
      if (!completed.includes(itemId)) {
        const next = [...completed, itemId].slice(0, 1000);
        await sql`
          INSERT INTO workspace_checklists (checklist_id, completed_items, updated_at)
          VALUES (${CHECKLIST_ID}, ${JSON.stringify(next)}::jsonb, NOW())
          ON CONFLICT (checklist_id) DO UPDATE SET completed_items = EXCLUDED.completed_items, updated_at = NOW()
        `;
      }
    }

    return redirect(res, target);
  } catch (error) {
    console.error('workspace review visit failed', error);
    return redirect(res, '/workspace/v3-playtest/');
  }
}
