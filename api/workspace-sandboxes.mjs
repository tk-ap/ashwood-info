import crypto from 'node:crypto';
import { getSql, json, parseBody, requireSession, sameOrigin, sha256 } from './_workspace.mjs';

const INITIAL_ENVIRONMENTS = [
  {
    id: 'herenow:mighty-yoga-pgph',
    product_key: 'ashwood',
    provider: 'here.now',
    purpose: 'ASHWOOD / GRAVITY public-home parity sandbox',
    environment_kind: 'sandbox',
    url: 'https://mighty-yoga-pgph.here.now/',
    provider_site_id: 'mighty-yoga-pgph',
    provider_version_id: '01M34Z9SBZS6MN1TGMZFT2KR7Y',
    source_repo: 'tk-ap/ashwood-info',
    source_ref: '0065f2aae3e8fecf11b833846ce7653885ef4335',
    access_mode: 'anyone_with_link',
    ownership: 'anonymous',
    persistence: 'expiring',
    status: 'live',
    expires_at: '2026-09-23T16:31:05.087Z',
    metadata: {
      issue: 155,
      parity_verified: true,
      files: 184,
      bytes: 68320392,
      note: 'Initial anonymous here.now parity publish. Claim token is intentionally not stored here.'
    }
  }
];

function syncTokenValid(req) {
  const expected = process.env.WORKSPACE_SANDBOX_SYNC_TOKEN;
  if (!expected) return false;
  const header = String(req.headers?.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return false;
  const left = Buffer.from(sha256(token), 'hex');
  const right = Buffer.from(sha256(expected), 'hex');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

async function ensureTable(sql) {
  await sql`CREATE TABLE IF NOT EXISTS workspace_sandbox_environments (
    id TEXT PRIMARY KEY,
    product_key TEXT NOT NULL,
    provider TEXT NOT NULL,
    purpose TEXT NOT NULL,
    environment_kind TEXT NOT NULL DEFAULT 'sandbox',
    url TEXT NOT NULL,
    provider_site_id TEXT,
    provider_version_id TEXT,
    source_repo TEXT,
    source_ref TEXT,
    access_mode TEXT NOT NULL DEFAULT 'unknown',
    ownership TEXT NOT NULL DEFAULT 'unknown',
    persistence TEXT NOT NULL DEFAULT 'unknown',
    status TEXT NOT NULL DEFAULT 'unknown',
    expires_at TIMESTAMPTZ,
    last_observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS workspace_sandbox_environments_product_idx
    ON workspace_sandbox_environments(product_key, updated_at DESC)`;

  for (const env of INITIAL_ENVIRONMENTS) {
    await sql`INSERT INTO workspace_sandbox_environments (
      id, product_key, provider, purpose, environment_kind, url,
      provider_site_id, provider_version_id, source_repo, source_ref,
      access_mode, ownership, persistence, status, expires_at, metadata
    ) VALUES (
      ${env.id}, ${env.product_key}, ${env.provider}, ${env.purpose},
      ${env.environment_kind}, ${env.url}, ${env.provider_site_id},
      ${env.provider_version_id}, ${env.source_repo}, ${env.source_ref},
      ${env.access_mode}, ${env.ownership}, ${env.persistence},
      ${env.status}, ${env.expires_at}, ${JSON.stringify(env.metadata)}::jsonb
    )
    ON CONFLICT (id) DO NOTHING`;
  }
}

const text = (value, max = 1000) => {
  const out = String(value ?? '').trim();
  return out ? out.slice(0, max) : null;
};

const allowedStatus = new Set(['live', 'building', 'failed', 'expired', 'retired', 'unknown']);
const allowedAccess = new Set(['anyone_with_link', 'password', 'restricted', 'account_members', 'workspace_gateway', 'unknown']);
const allowedOwnership = new Set(['anonymous', 'personal', 'workspace', 'unknown']);
const allowedPersistence = new Set(['expiring', 'permanent', 'unknown']);

function normalizeUrl(value) {
  let url;
  try { url = new URL(String(value || '').trim()); } catch { throw new Error('invalid_url'); }
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('invalid_url');
  url.hash = '';
  return url.toString();
}

function normalizeDate(value) {
  if (!value) return null;
  const date = new Date(String(value));
  if (!Number.isFinite(date.getTime())) throw new Error('invalid_expires_at');
  return date.toISOString();
}

async function list(sql) {
  const rows = await sql`SELECT
    id, product_key, provider, purpose, environment_kind, url,
    provider_site_id, provider_version_id, source_repo, source_ref,
    access_mode, ownership, persistence, status, expires_at,
    last_observed_at, metadata, created_at, updated_at
    FROM workspace_sandbox_environments
    ORDER BY
      CASE status WHEN 'live' THEN 1 WHEN 'building' THEN 2 WHEN 'failed' THEN 3
        WHEN 'expired' THEN 4 WHEN 'retired' THEN 5 ELSE 6 END,
      updated_at DESC`;
  return rows;
}

export default async function handler(req, res) {
  try {
    const sql = getSql();
    const machineAuthorized = syncTokenValid(req);
    const session = machineAuthorized ? null : await requireSession(req);
    if (!machineAuthorized && !session) return json(res, 401, { ok: false, error: 'Unauthorized' });

    await ensureTable(sql);

    if (req.method === 'GET') {
      return json(res, 200, {
        ok: true,
        observed_at: new Date().toISOString(),
        authority: 'workspace_sandbox_environments',
        environments: await list(sql)
      });
    }

    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });
    if (!machineAuthorized && !sameOrigin(req)) return json(res, 403, { ok: false, error: 'Origin not allowed' });

    const body = parseBody(req);
    const action = String(body.action || 'upsert');

    if (action === 'retire') {
      const id = text(body.id, 250);
      if (!id) return json(res, 400, { ok: false, error: 'Environment id is required' });
      const rows = await sql`UPDATE workspace_sandbox_environments
        SET status = 'retired', updated_at = NOW(), last_observed_at = NOW()
        WHERE id = ${id}
        RETURNING id`;
      if (!rows[0]) return json(res, 404, { ok: false, error: 'Environment not found' });
      return json(res, 200, { ok: true, environments: await list(sql) });
    }

    if (action !== 'upsert') return json(res, 400, { ok: false, error: 'Unknown action' });

    const id = text(body.id, 250);
    const productKey = text(body.product_key, 128);
    const provider = text(body.provider, 80);
    const purpose = text(body.purpose, 500);
    if (!id || !productKey || !provider || !purpose) {
      return json(res, 400, { ok: false, error: 'id, product_key, provider, and purpose are required' });
    }

    const url = normalizeUrl(body.url);
    const status = String(body.status || 'unknown').toLowerCase();
    const accessMode = String(body.access_mode || 'unknown').toLowerCase();
    const ownership = String(body.ownership || 'unknown').toLowerCase();
    const persistence = String(body.persistence || 'unknown').toLowerCase();
    if (!allowedStatus.has(status) || !allowedAccess.has(accessMode) ||
        !allowedOwnership.has(ownership) || !allowedPersistence.has(persistence)) {
      return json(res, 400, { ok: false, error: 'Invalid environment state' });
    }

    const expiresAt = normalizeDate(body.expires_at);
    const metadata = body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
      ? body.metadata : {};

    await sql`INSERT INTO workspace_sandbox_environments (
      id, product_key, provider, purpose, environment_kind, url,
      provider_site_id, provider_version_id, source_repo, source_ref,
      access_mode, ownership, persistence, status, expires_at,
      last_observed_at, metadata, updated_at
    ) VALUES (
      ${id}, ${productKey}, ${provider}, ${purpose},
      ${text(body.environment_kind, 80) || 'sandbox'}, ${url},
      ${text(body.provider_site_id, 250)}, ${text(body.provider_version_id, 250)},
      ${text(body.source_repo, 250)}, ${text(body.source_ref, 250)},
      ${accessMode}, ${ownership}, ${persistence}, ${status},
      ${expiresAt}, NOW(), ${JSON.stringify(metadata)}::jsonb, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      product_key = EXCLUDED.product_key,
      provider = EXCLUDED.provider,
      purpose = EXCLUDED.purpose,
      environment_kind = EXCLUDED.environment_kind,
      url = EXCLUDED.url,
      provider_site_id = EXCLUDED.provider_site_id,
      provider_version_id = EXCLUDED.provider_version_id,
      source_repo = EXCLUDED.source_repo,
      source_ref = EXCLUDED.source_ref,
      access_mode = EXCLUDED.access_mode,
      ownership = EXCLUDED.ownership,
      persistence = EXCLUDED.persistence,
      status = EXCLUDED.status,
      expires_at = EXCLUDED.expires_at,
      last_observed_at = NOW(),
      metadata = EXCLUDED.metadata,
      updated_at = NOW()`;

    return json(res, 200, { ok: true, environments: await list(sql) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message === 'invalid_url' || message === 'invalid_expires_at' ? 400 : 500;
    console.error('workspace sandbox environments failed', error);
    return json(res, status, { ok: false, error: status === 400 ? message : 'Sandbox environment registry failed' });
  }
}
