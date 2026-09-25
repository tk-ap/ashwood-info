import { getSql, json, requireSession } from './_workspace.mjs';
import { rankOpportunities, rotateOpportunities } from './_career-opportunities.mjs';

const CACHE_HOURS = 6;
const SOURCES = [
  { id:'remotejobs', name:'RemoteJobs.io', url:'https://www.remotejobs.io/search?joblocations=Work+from+Anywhere+in+US&searchtype=basic', mode:'browser_required', enabled:true, reason:'Terms prohibit automated scraping/data-mining; ingest only through approved user/browser evidence.' },
  { id:'80000hours', name:'80,000 Hours', url:'https://jobs.80000hours.org/', mode:'browser_required', enabled:true, reason:'No supported public machine-readable feed verified; ingest through approved browser evidence.' },
  { id:'mentra', name:'Mentra', url:'https://www.mentra.com/', mode:'account_or_browser_required', enabled:true, reason:'Job matching is account-oriented; no supported public machine-readable feed verified.' },
  { id:'remotive', name:'Remotive', url:'https://remotive.com/', mode:'fallback', enabled:false, reason:'Retired from default Apply Next sourcing.' }
];
const SOURCE = 'career-source-registry';

async function ensureSchema(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS workspace_career_opportunity_cache (
      source TEXT PRIMARY KEY,
      payload JSONB NOT NULL DEFAULT '[]'::jsonb,
      fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

async function getCache(sql) {
  const rows = await sql`
    SELECT source, payload, fetched_at
    FROM workspace_career_opportunity_cache
    WHERE source = ${SOURCE}
    LIMIT 1
  `;
  return rows[0] || null;
}

function cacheFresh(cache) {
  if (!cache?.fetched_at) return false;
  const age = Date.now() - new Date(cache.fetched_at).getTime();
  return Number.isFinite(age) && age < CACHE_HOURS * 60 * 60 * 1000;
}

async function fetchSource() {
  /* Source policy is intentionally fail-closed. These providers are not scraped from
     the server without a verified supported feed/API. Browser/agent ingestion writes
     normalized evidence into the cache; until then Apply Next must not silently fall
     back to unrelated Remotive inventory. */
  return [];
}

async function trackedApplications(sql) {
  return sql`
    SELECT company, role, posting_url
    FROM workspace_career_applications
  `;
}

export default async function handler(req, res) {
  try {
    const session = await requireSession(req);
    if (!session) return json(res, 401, { ok:false, error:'Unauthorized' });
    if (req.method !== 'GET') return json(res, 405, { ok:false, error:'Method not allowed' });

    const sql = getSql();
    await ensureSchema(sql);

    const url = new URL(req.url || '/api/workspace-career-opportunities', `https://${req.headers.host || 'localhost'}`);
    const cursor = Math.max(0, Number(url.searchParams.get('cursor') || 0));
    const forceRefresh = url.searchParams.get('refresh') === '1';
    const tracked = await trackedApplications(sql);

    let cache = await getCache(sql);
    let sourceJobs = Array.isArray(cache?.payload) ? cache.payload : [];
    let sourceRefreshed = false;
    let warning = null;

    if (!cache || !cacheFresh(cache) || (forceRefresh && !cacheFresh(cache))) {
      try {
        sourceJobs = await fetchSource();
        await sql`
          INSERT INTO workspace_career_opportunity_cache (source, payload, fetched_at, updated_at)
          VALUES (${SOURCE}, ${JSON.stringify(sourceJobs)}::jsonb, NOW(), NOW())
          ON CONFLICT (source) DO UPDATE SET
            payload = EXCLUDED.payload,
            fetched_at = NOW(),
            updated_at = NOW()
        `;
        cache = { source:SOURCE, payload:sourceJobs, fetched_at:new Date().toISOString() };
        sourceRefreshed = true;
      } catch (error) {
        if (!sourceJobs.length) throw error;
        warning = 'Using the last successful opportunity feed because the live source could not be refreshed.';
      }
    }

    const ranked = rankOpportunities(sourceJobs, tracked);
    const opportunities = rotateOpportunities(ranked, cursor, 8);

    return json(res, 200, {
      ok:true,
      opportunities,
      count:opportunities.length,
      pool_count:ranked.length,
      source:'Career source registry',
      source_url:null,
      sources:SOURCES,
      source_fetched_at:cache?.fetched_at || null,
      source_refreshed:sourceRefreshed,
      cache_hours:CACHE_HOURS,
      cursor,
      next_cursor:cursor + 1,
      warning
    });
  } catch (error) {
    console.error('career opportunity discovery failed', error);
    return json(res, 500, { ok:false, error:'Opportunity discovery failed' });
  }
}
