import { getSql, isPreviewReadOnly, json, parseBody, rejectPreviewMutation, requireSession, sameOrigin } from './_workspace.mjs';

const cleanKey = (value, max = 250) => String(value || '').trim().slice(0, max);
const cleanList = (value) => Array.isArray(value)
  ? [...new Set(value.map(item => cleanKey(item, 180)).filter(Boolean))].slice(0, 300)
  : [];
const cleanNotes = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).slice(0, 300)
      .map(([key, note]) => [cleanKey(key, 180), cleanKey(note, 1200)])
      .filter(([key]) => key)
  );
};

async function ensureTable(sql) {
  await sql`CREATE TABLE IF NOT EXISTS workspace_sandbox_reviews (
    review_key TEXT PRIMARY KEY,
    product_key TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'here-now',
    sandbox_url TEXT NOT NULL,
    version_id TEXT,
    source_ref TEXT,
    completed_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
}

export default async function handler(req, res) {
  try {
    if (rejectPreviewMutation(req, res)) return;
    const session = await requireSession(req);
    if (!session) return json(res, 401, { ok:false, error:'Unauthorized' });
    const sql = getSql();
    if (!isPreviewReadOnly()) await ensureTable(sql);

    if (req.method === 'GET') {
      const productKey = cleanKey(req.query?.product, 120);
      const versionId = cleanKey(req.query?.version, 250);
      if (!productKey) return json(res, 400, { ok:false, error:'Product is required' });
      const reviewKey = `${productKey}:${versionId || 'unversioned'}`;
      const rows = await sql`SELECT review_key,product_key,provider,sandbox_url,version_id,source_ref,
        completed_items,notes,updated_at FROM workspace_sandbox_reviews WHERE review_key=${reviewKey} LIMIT 1`;
      return json(res, 200, {
        ok:true,
        review_key:reviewKey,
        review:rows[0] || {
          review_key:reviewKey,
          product_key:productKey,
          version_id:versionId || null,
          completed_items:[],
          notes:{},
          updated_at:null,
        },
      });
    }

    if (req.method !== 'PATCH') return json(res, 405, { ok:false, error:'Method not allowed' });
    if (!sameOrigin(req)) return json(res, 403, { ok:false, error:'Origin not allowed' });
    const body = parseBody(req);
    const productKey = cleanKey(body.product_key, 120);
    const sandboxUrl = cleanKey(body.sandbox_url, 1200);
    const versionId = cleanKey(body.version_id, 250);
    const sourceRef = cleanKey(body.source_ref, 250);
    if (!productKey || !/^https:\/\//.test(sandboxUrl)) {
      return json(res, 400, { ok:false, error:'Invalid sandbox review identity' });
    }
    let parsed;
    try { parsed = new URL(sandboxUrl); } catch { return json(res, 400, { ok:false, error:'Invalid sandbox URL' }); }
    if (!parsed.hostname.endsWith('.here.now') || parsed.username || parsed.password) {
      return json(res, 400, { ok:false, error:'Sandbox review must target here.now' });
    }
    const reviewKey = `${productKey}:${versionId || 'unversioned'}`;
    const completed = cleanList(body.completed_items);
    const notes = cleanNotes(body.notes);
    const rows = await sql`INSERT INTO workspace_sandbox_reviews
      (review_key,product_key,provider,sandbox_url,version_id,source_ref,completed_items,notes,updated_at)
      VALUES(${reviewKey},${productKey},'here-now',${sandboxUrl},${versionId || null},${sourceRef || null},
        ${JSON.stringify(completed)}::jsonb,${JSON.stringify(notes)}::jsonb,NOW())
      ON CONFLICT(review_key) DO UPDATE SET
        sandbox_url=EXCLUDED.sandbox_url,
        version_id=EXCLUDED.version_id,
        source_ref=EXCLUDED.source_ref,
        completed_items=EXCLUDED.completed_items,
        notes=EXCLUDED.notes,
        updated_at=NOW()
      RETURNING review_key,product_key,provider,sandbox_url,version_id,source_ref,completed_items,notes,updated_at`;
    return json(res, 200, { ok:true, review:rows[0] });
  } catch (error) {
    console.error('workspace sandbox review failed', error);
    return json(res, 500, { ok:false, error:'Workspace sandbox review failed' });
  }
}
