import { json, parseBody, requireSession, sameOrigin } from './_workspace.mjs';

const CONTEXT_SCHEMA = 'ashwood.workspace/self-context/v1';

async function ensureTable(sql) {
  await sql`CREATE TABLE IF NOT EXISTS workspace_self_context (
    id TEXT PRIMARY KEY,
    schema_name TEXT NOT NULL,
    source_profile_id TEXT NOT NULL,
    source_updated_at TEXT NOT NULL,
    source_version TEXT NOT NULL,
    payload JSONB NOT NULL,
    corrections JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
}

function agentAuthorized(req) {
  const expected = String(process.env.WORKSPACE_SELF_CONTEXT_TOKEN || '');
  const header = String(req.headers?.authorization || '');
  return Boolean(expected && header === `Bearer ${expected}`);
}

function validPayload(payload) {
  return payload && payload.schema === CONTEXT_SCHEMA && typeof payload.sourceProfileId === 'string' && payload.sourceProfileId.trim()
    && Array.isArray(payload.rawAreas) && payload.normalized && typeof payload.normalized === 'object';
}

export default async function handler(req, res) {
  try {
    const sql = (await import('./_workspace.mjs')).getSql();
    await ensureTable(sql);
    const isAgent = req.query?.consumer === 'agentos';
    const session = await requireSession(req);
    if (!session && !(isAgent && agentAuthorized(req))) return json(res, 401, { ok: false, error: 'Unauthorized' });

    if (req.method === 'GET') {
      const rows = await sql`SELECT schema_name, source_profile_id, source_updated_at, source_version, payload, corrections, updated_at FROM workspace_self_context WHERE id = 'tk' LIMIT 1`;
      if (!rows[0]) return json(res, 404, { ok: false, error: 'Self context has not been seeded' });
      return json(res, 200, {
        ok: true,
        authority: 'workspace_self_context',
        schema: rows[0].schema_name,
        sourceProfileId: rows[0].source_profile_id,
        sourceUpdatedAt: rows[0].source_updated_at,
        sourceVersion: rows[0].source_version,
        updatedAt: rows[0].updated_at,
        context: rows[0].payload,
        corrections: rows[0].corrections || []
      });
    }

    if (req.method !== 'POST' || !sameOrigin(req) || isAgent) return json(res, req.method === 'POST' ? 403 : 405, { ok: false, error: 'Owner seed/correction required' });
    const body = parseBody(req);
    if (!validPayload(body.context)) return json(res, 400, { ok: false, error: 'Invalid normalized ALVIRA context payload' });
    const correction = body.correction && typeof body.correction === 'object' ? body.correction : null;
    const existing = await sql`SELECT corrections FROM workspace_self_context WHERE id = 'tk' LIMIT 1`;
    const corrections = [...(existing[0]?.corrections || []), ...(correction ? [correction] : [])].slice(-100);
    await sql`INSERT INTO workspace_self_context (id, schema_name, source_profile_id, source_updated_at, source_version, payload, corrections)
      VALUES ('tk', ${CONTEXT_SCHEMA}, ${body.context.sourceProfileId}, ${body.context.sourceUpdatedAt}, ${body.context.sourceVersion}, ${JSON.stringify(body.context)}::jsonb, ${JSON.stringify(corrections)}::jsonb)
      ON CONFLICT (id) DO UPDATE SET schema_name=EXCLUDED.schema_name, source_profile_id=EXCLUDED.source_profile_id, source_updated_at=EXCLUDED.source_updated_at, source_version=EXCLUDED.source_version, payload=EXCLUDED.payload, corrections=EXCLUDED.corrections, updated_at=NOW()`;
    return json(res, 200, { ok: true, authority: 'workspace_self_context', updated: true });
  } catch (error) {
    console.error('workspace self context failed', error);
    return json(res, 500, { ok: false, error: 'Workspace self context unavailable' });
  }
}
