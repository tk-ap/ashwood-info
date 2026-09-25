import crypto from 'node:crypto';
import { getSql, isPreviewReadOnly, json, parseBody, rejectPreviewMutation, requireSession, sha256 } from './_workspace.mjs';

// This is the owner-facing projection of environment facts. AgentOS/provider
// collectors write observations; ASHWOOD only renders their latest evidence.
const CATALOG = [
  ['ashwood', 'ASHWOOD', 'tk-ap/ashwood-info', 'https://ashwood-info.vercel.app/'],
  ['alvira-meos', 'ALVIRA', 'tk-ap/ALVIRA', 'https://alviratech.vercel.app/'],
  ['ailhat', 'ailhat', 'tk-ap/ailhat', 'https://ailhat.vercel.app/'],
  ['ledgato', 'ledgato', 'tk-ap/ledgato', 'https://ledgato.vercel.app/'],
  ['agent-control', 'Agent Control', null, 'https://agent-availability.vercel.app/'],
];

// One-time recovery of already-created sandboxes. These records establish an
// association only; their intentionally old observation times resolve STALE,
// never LIVE, until the normal machine sync observes the provider again.
const BOOTSTRAP = [
  ['ashwood', 'https://mighty-yoga-pgph.here.now/', 'mighty-yoga-pgph', '01M37NKCHHN0CTJWC77WKBHFVB', '1117150b07b66269a47e59edfe277a22be674b8e'],
  ['alvira-meos', 'https://mighty-ether-p6cn.here.now/', 'mighty-ether-p6cn', '01M37SP3A2PB1NY2A43FJFG577', '0b719f4ee2acad86a12f9138dbd61784f7d902e2'],
  ['ailhat', 'https://wintry-truffle-pf6f.here.now/', 'wintry-truffle-pf6f', '01M37Q51N93Z6E4Z95C4A8BNMF', '710f523dc48381b1a33312ae5232aa0c4e8fbb09'],
  ['ledgato', 'https://karma-plover-ntkb.here.now/', 'karma-plover-ntkb', '01M37P6JRW4708PCFPGP0GZ25A', '43ede56446b09c5de95fe068d195951be95343f0'],
];
const STALE_MS = 45 * 60 * 1000;
const ALLOWED = new Set(['live', 'ready', 'building', 'blocked', 'failed', 'unknown']);

function syncAuthorized(req) {
  const expected = process.env.WORKSPACE_ENVIRONMENT_SYNC_TOKEN || process.env.WORKSPACE_BOARD_SYNC_TOKEN;
  if (!expected) return false;
  const header = String(req.headers?.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return false;
  const a = Buffer.from(sha256(token), 'hex');
  const b = Buffer.from(sha256(expected), 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function ensureTable(sql) {
  await sql`CREATE TABLE IF NOT EXISTS workspace_environment_registry (
    environment_id TEXT PRIMARY KEY, product_key TEXT NOT NULL, kind TEXT NOT NULL,
    provider TEXT NOT NULL, provider_status TEXT NOT NULL, url TEXT, provider_identity TEXT,
    revision TEXT, source_ref TEXT, verification_state TEXT NOT NULL DEFAULT 'unknown',
    observed_at TIMESTAMPTZ NOT NULL, source_system TEXT NOT NULL, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  for (const [productKey, url, identity, revision, sourceRef] of BOOTSTRAP) {
    await sql`INSERT INTO workspace_environment_registry (
      environment_id, product_key, kind, provider, provider_status, url, provider_identity,
      revision, source_ref, verification_state, observed_at, source_system, metadata
    ) VALUES (
      ${`sandbox:${productKey}`}, ${productKey}, 'sandbox', 'here-now', 'ready', ${url}, ${identity},
      ${revision}, ${sourceRef}, 'pending', '2026-09-23T19:45:00.000Z', 'sandbox-registry-bootstrap',
      ${JSON.stringify({ association: 'known-sandbox-inventory', static_primary: true })}::jsonb
    ) ON CONFLICT (environment_id) DO NOTHING`;
  }
}

function clean(row) {
  const productKey = String(row?.product_key || '').trim();
  if (!CATALOG.some(([key]) => key === productKey)) return null;
  const kind = String(row?.kind || 'sandbox').trim().toLowerCase();
  const provider = String(row?.provider || '').trim().toLowerCase();
  const providerStatus = String(row?.provider_status || 'unknown').trim().toLowerCase();
  const observed = new Date(row?.observed_at);
  if (!['sandbox', 'preview', 'production'].includes(kind) || !provider || !ALLOWED.has(providerStatus) || Number.isNaN(observed.getTime())) return null;
  const url = row?.url ? new URL(String(row.url)).toString() : null;
  if (url && !url.startsWith('https://')) return null;
  return {
    environmentId: String(row.environment_id || `${kind}:${productKey}`).trim().slice(0, 250), productKey, kind, provider,
    providerStatus, url, providerIdentity: String(row.provider_identity || '').trim().slice(0, 250) || null,
    revision: String(row.revision || '').trim().slice(0, 250) || null, sourceRef: String(row.source_ref || '').trim().slice(0, 250) || null,
    verificationState: String(row.verification_state || 'unknown').trim().slice(0, 80) || 'unknown', observedAt: observed.toISOString(),
    sourceSystem: String(row.source_system || 'agent-os').trim().slice(0, 120) || 'agent-os',
    metadata: row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata) ? row.metadata : {},
  };
}

function presentationStatus(row, now = Date.now()) {
  if (!row) return 'UNASSIGNED';
  const observed = new Date(row.observed_at).getTime();
  if (!Number.isFinite(observed) || now - observed > STALE_MS) return 'STALE';
  if (row.provider_status === 'live') return 'LIVE';
  if (row.provider_status === 'ready') return 'READY';
  if (row.provider_status === 'building') return 'BUILDING';
  if (row.provider_status === 'blocked' || row.provider_status === 'failed') return 'BLOCKED';
  return 'SYNCING';
}

export default async function handler(req, res) {
  try {
    if (rejectPreviewMutation(req, res)) return;
    const sql = getSql();
    if (!isPreviewReadOnly()) await ensureTable(sql);
    if (req.method === 'GET') {
      if (!(await requireSession(req))) return json(res, 401, { ok: false, error: 'Unauthorized' });
      const rows = await sql`SELECT environment_id, product_key, kind, provider, provider_status, url, provider_identity, revision, source_ref, verification_state, observed_at, source_system, metadata, updated_at FROM workspace_environment_registry ORDER BY updated_at DESC`;
      const now = Date.now();
      const environments = CATALOG.map(([product_key, label, repository, production_url]) => {
        const sandbox = rows.find(row => row.product_key === product_key && row.kind === 'sandbox') || null;
        return { product_key, label, repository, production: { provider: 'vercel', url: production_url }, sandbox,
          status: presentationStatus(sandbox, now) };
      });
      return json(res, 200, { ok: true, authority: 'workspace_environment_registry', stale_after_seconds: STALE_MS / 1000,
        observed_at: rows.reduce((latest, row) => !latest || new Date(row.observed_at) > new Date(latest) ? row.observed_at : latest, null), environments });
    }
    if (req.method !== 'POST' || !syncAuthorized(req)) return json(res, req.method === 'POST' ? 403 : 405, { ok: false, error: req.method === 'POST' ? 'Invalid environment sync token' : 'Method not allowed' });
    const body = parseBody(req);
    const rows = (Array.isArray(body.environments) ? body.environments : []).map(clean).filter(Boolean);
    if (!rows.length) return json(res, 400, { ok: false, error: 'No valid environment observations' });
    for (const row of rows) await sql`INSERT INTO workspace_environment_registry (
      environment_id, product_key, kind, provider, provider_status, url, provider_identity, revision, source_ref, verification_state, observed_at, source_system, metadata, updated_at
    ) VALUES (${row.environmentId}, ${row.productKey}, ${row.kind}, ${row.provider}, ${row.providerStatus}, ${row.url}, ${row.providerIdentity}, ${row.revision}, ${row.sourceRef}, ${row.verificationState}, ${row.observedAt}, ${row.sourceSystem}, ${JSON.stringify(row.metadata)}::jsonb, NOW())
    ON CONFLICT (environment_id) DO UPDATE SET provider=EXCLUDED.provider, provider_status=EXCLUDED.provider_status, url=EXCLUDED.url, provider_identity=EXCLUDED.provider_identity, revision=EXCLUDED.revision, source_ref=EXCLUDED.source_ref, verification_state=EXCLUDED.verification_state, observed_at=EXCLUDED.observed_at, source_system=EXCLUDED.source_system, metadata=EXCLUDED.metadata, updated_at=NOW()`;
    return json(res, 200, { ok: true, upserted: rows.length });
  } catch (error) {
    console.error('workspace environments failed', error);
    return json(res, 500, { ok: false, error: 'Workspace environment registry failed' });
  }
}
