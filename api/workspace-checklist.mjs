import { getSql, json, parseBody, requireSession, sameOrigin } from './_workspace.mjs';

const CHECKLIST_ID = 'v3-playtest-2026-09-08';
const REPO = 'tk-ap/ashwood-info';
const REVIEW_SYSTEM_PATHS = [
  'api/workspace-checklist.mjs',
  'workspace/v3-playtest.js',
  'workspace/v3-playtest.css',
  'workspace/v3-playtest/index.html',
  'workspace/V3_PLAYTEST_2026-09-08.md',
  'workspace/DEPLOYMENT_REVIEW_CONTRACT.md',
];

async function ensureTable(sql) {
  await sql`CREATE TABLE IF NOT EXISTS workspace_checklists (
    checklist_id TEXT PRIMARY KEY,
    completed_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes JSONB NOT NULL DEFAULT '{}'::jsonb,
    auto_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`ALTER TABLE workspace_checklists ADD COLUMN IF NOT EXISTS auto_items JSONB NOT NULL DEFAULT '[]'::jsonb`;
}

function cleanCompleted(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(item => String(item || '').trim().slice(0, 160)).filter(Boolean))].slice(0, 1000);
}

function cleanNotes(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).slice(0, 1000).map(([key, note]) => [
    String(key || '').trim().slice(0, 160),
    String(note || '').trim().slice(0, 1000),
  ]).filter(([key]) => key));
}

function isReviewSystemFile(filename) {
  return REVIEW_SYSTEM_PATHS.includes(filename) || filename.startsWith('.github/') || filename.startsWith('docs/');
}

function isPotentialUserFacingFile(filename) {
  if (!filename || isReviewSystemFile(filename)) return false;
  if (/\.(md|txt|lock|map)$/i.test(filename)) return false;
  if (filename.startsWith('scripts/') || filename.startsWith('tests/') || filename.startsWith('test/')) return false;
  return /\.(html|css|js|mjs|json|svg|png|jpe?g|webp|gif|mp3|m4a|aac|wav|flac)$/i.test(filename) || filename.startsWith('api/');
}

function areaFor(filename) {
  const first = String(filename || '').split('/')[0];
  if (filename === 'index.html' || !filename.includes('/')) return 'Homepage / global';
  const labels = {
    workspace: 'Workspace', music: 'Music', modeling: 'Modeling', 'build-journal': 'Build Journal',
    dispatch: 'Dispatch', 'ai-from-zero': 'AI from Zero', 'creative-direction': 'Creative Direction',
    about: 'About', api: 'Behavior / API', assets: 'Site media', portfolio: 'Portfolio',
  };
  return labels[first] || first.replace(/[-_]/g, ' ');
}

async function syncProductionDeployment(sql, row) {
  if (process.env.VERCEL_ENV !== 'production') return row;
  const sha = String(process.env.VERCEL_GIT_COMMIT_SHA || '').trim();
  if (!/^[a-f0-9]{40}$/i.test(sha)) return row;

  const existing = Array.isArray(row?.auto_items) ? row.auto_items : [];
  const itemId = `deploy:${sha}`;
  if (existing.some(item => item?.id === itemId)) return row;

  try {
    const response = await fetch(`https://api.github.com/repos/${REPO}/commits/${sha}`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'ashwood-workspace-review' },
    });
    if (!response.ok) return row;
    const commit = await response.json();
    const files = (commit.files || []).map(file => file.filename).filter(isPotentialUserFacingFile);
    if (!files.length) return row;

    const areas = [...new Set(files.map(areaFor))].slice(0, 8);
    const subject = String(commit.commit?.message || 'Production update').split('\n')[0].trim().slice(0, 180);
    const nextItem = {
      id: itemId,
      deployment_sha: sha,
      deployed_at: commit.commit?.committer?.date || new Date().toISOString(),
      label: `Review live deployment: ${subject}`,
      detail: `${areas.join(' · ')} changed. Confirm the new feature, section, or behavior works as intended on production.`,
      areas,
      files: files.slice(0, 40),
    };
    const autoItems = [nextItem, ...existing].slice(0, 200);
    const rows = await sql`
      INSERT INTO workspace_checklists (checklist_id, completed_items, notes, auto_items, updated_at)
      VALUES (${CHECKLIST_ID}, '[]'::jsonb, '{}'::jsonb, ${JSON.stringify(autoItems)}::jsonb, NOW())
      ON CONFLICT (checklist_id) DO UPDATE SET auto_items = EXCLUDED.auto_items, updated_at = NOW()
      RETURNING checklist_id, completed_items, notes, auto_items, updated_at
    `;
    return rows[0] || { ...row, auto_items: autoItems };
  } catch (error) {
    console.warn('deployment review sync skipped', error?.message || error);
    return row;
  }
}

export default async function handler(req, res) {
  try {
    const session = await requireSession(req);
    if (!session) return json(res, 401, { ok: false, error: 'Unauthorized' });
    const sql = getSql();
    await ensureTable(sql);

    if (req.method === 'GET') {
      const rows = await sql`SELECT checklist_id, completed_items, notes, auto_items, updated_at FROM workspace_checklists WHERE checklist_id = ${CHECKLIST_ID} LIMIT 1`;
      let row = rows[0] || { completed_items: [], notes: {}, auto_items: [], updated_at: null };
      row = await syncProductionDeployment(sql, row);
      return json(res, 200, {
        ok: true,
        checklist_id: CHECKLIST_ID,
        completed_items: Array.isArray(row?.completed_items) ? row.completed_items : [],
        notes: row?.notes && typeof row.notes === 'object' ? row.notes : {},
        auto_items: Array.isArray(row?.auto_items) ? row.auto_items : [],
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
      RETURNING checklist_id, completed_items, notes, auto_items, updated_at
    `;
    return json(res, 200, { ok: true, ...rows[0] });
  } catch (error) {
    console.error('workspace checklist failed', error);
    return json(res, 500, { ok: false, error: 'Workspace checklist failed' });
  }
}
