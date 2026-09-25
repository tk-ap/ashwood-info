import { getSql, json, requireSession } from './_workspace.mjs';
import { rankOpportunities, rotateOpportunities } from './_career-opportunities.mjs';

const CACHE_HOURS = 6;
const FORCE_REFRESH_MIN_HOURS = 1;
const SOURCES = [
  {
    key:'remotive',
    name:'Remotive',
    url:'https://remotive.com/api/remote-jobs?limit=200',
    homepage:'https://remotive.com/',
    normalize:job => ({
      ...job,
      source_name:'Remotive',
      source_url:String(job.url || '').trim()
    })
  },
  {
    key:'jobicy',
    name:'Jobicy',
    url:'https://jobicy.com/api/v2/remote-jobs?count=200&geo=usa',
    homepage:'https://jobicy.com/',
    normalize:job => ({
      id:job.id,
      url:String(job.url || '').trim(),
      title:String(job.jobTitle || '').trim(),
      company_name:String(job.companyName || '').trim(),
      candidate_required_location:String(job.jobGeo || 'Remote').trim(),
      job_type:Array.isArray(job.jobType) ? job.jobType.join(', ') : String(job.jobType || '').trim(),
      salary:formatJobicySalary(job),
      publication_date:job.pubDate || null,
      description:job.jobDescription || job.jobExcerpt || '',
      source_name:'Jobicy',
      source_url:String(job.url || '').trim()
    })
  }
];

function formatJobicySalary(job={}) {
  const min = Number(job.salaryMin);
  const max = Number(job.salaryMax);
  if (!Number.isFinite(min) && !Number.isFinite(max)) return '';
  const currency = String(job.salaryCurrency || '').trim();
  const period = String(job.salaryPeriod || '').trim();
  const fmt = value => Number(value).toLocaleString('en-US', { maximumFractionDigits:0 });
  const amount = Number.isFinite(min) && Number.isFinite(max)
    ? `${fmt(min)}–${fmt(max)}`
    : fmt(Number.isFinite(min) ? min : max);
  return [currency, amount, period ? `/${period}` : ''].filter(Boolean).join(' ');
}

async function ensureSchema(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS workspace_career_opportunity_cache (
      source TEXT PRIMARY KEY,
      payload JSONB NOT NULL DEFAULT '[]'::jsonb,
      fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS workspace_career_opportunity_dispositions (
      source TEXT NOT NULL,
      opportunity_id TEXT NOT NULL,
      company TEXT,
      role TEXT,
      url TEXT,
      disposition TEXT NOT NULL DEFAULT 'DECLINED',
      reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (source, opportunity_id)
    )
  `;
}

async function getCache(sql, source) {
  const rows = await sql`
    SELECT source, payload, fetched_at
    FROM workspace_career_opportunity_cache
    WHERE source = ${source}
    LIMIT 1
  `;
  return rows[0] || null;
}

function cacheAgeMs(cache) {
  if (!cache?.fetched_at) return Number.POSITIVE_INFINITY;
  const age = Date.now() - new Date(cache.fetched_at).getTime();
  return Number.isFinite(age) ? Math.max(0, age) : Number.POSITIVE_INFINITY;
}

function cacheFresh(cache) {
  return cacheAgeMs(cache) < CACHE_HOURS * 60 * 60 * 1000;
}

function canForceRefresh(cache) {
  return cacheAgeMs(cache) >= FORCE_REFRESH_MIN_HOURS * 60 * 60 * 1000;
}

async function fetchSource(source) {
  const response = await fetch(source.url, {
    headers:{ 'Accept':'application/json', 'User-Agent':'ASHWOOD-Career-Ops/1.0' },
    signal:AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error(`${source.name} returned ${response.status}`);
  const body = await response.json();
  const jobs = Array.isArray(body.jobs) ? body.jobs : [];
  return jobs.map(source.normalize);
}

async function loadSource(sql, source, forceRefresh=false) {
  let cache = await getCache(sql, source.key);
  let jobs = Array.isArray(cache?.payload) ? cache.payload : [];
  let refreshed = false;
  let warning = null;
  const shouldRefresh = !cache || !cacheFresh(cache) || (forceRefresh && canForceRefresh(cache));

  if (shouldRefresh) {
    try {
      jobs = await fetchSource(source);
      await sql`
        INSERT INTO workspace_career_opportunity_cache (source, payload, fetched_at, updated_at)
        VALUES (${source.key}, ${JSON.stringify(jobs)}::jsonb, NOW(), NOW())
        ON CONFLICT (source) DO UPDATE SET
          payload = EXCLUDED.payload,
          fetched_at = NOW(),
          updated_at = NOW()
      `;
      cache = { source:source.key, payload:jobs, fetched_at:new Date().toISOString() };
      refreshed = true;
    } catch (error) {
      if (!jobs.length) {
        warning = `${source.name} unavailable: ${error.message}`;
      } else {
        warning = `Using cached ${source.name} jobs because the live source could not be refreshed.`;
      }
    }
  } else if (forceRefresh) {
    warning = `${source.name} was checked less than an hour ago; cached results were reused to respect source rate limits.`;
  }

  return {
    ...source,
    jobs,
    refreshed,
    warning,
    fetched_at:cache?.fetched_at || null
  };
}

async function trackedApplications(sql) {
  return sql`
    SELECT company, role, posting_url
    FROM workspace_career_applications
  `;
}

function sourceKey(value='') {
  return String(value).trim().toLowerCase().replace(/\s+/g,'-');
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

    const loaded = [];
    for (const source of SOURCES) {
      loaded.push(await loadSource(sql, source, forceRefresh));
    }

    const sourceJobs = loaded.flatMap(item => item.jobs || []);
    if (!sourceJobs.length) {
      throw new Error('No opportunity source returned usable jobs');
    }

    const declinedRows = await sql`
      SELECT source, opportunity_id
      FROM workspace_career_opportunity_dispositions
      WHERE disposition = 'DECLINED'
    `;
    const declinedKeys = new Set(
      declinedRows.map(row => `${sourceKey(row.source)}::${String(row.opportunity_id)}`)
    );

    const ranked = rankOpportunities(sourceJobs, tracked).filter(item =>
      !declinedKeys.has(`${sourceKey(item.source)}::${String(item.id)}`)
    );
    const opportunities = rotateOpportunities(ranked, cursor, 8);

    const fetchedTimes = loaded
      .map(item => new Date(item.fetched_at || 0).getTime())
      .filter(value => Number.isFinite(value) && value > 0);
    const oldestFetch = fetchedTimes.length ? new Date(Math.min(...fetchedTimes)).toISOString() : null;
    const warnings = loaded.map(item => item.warning).filter(Boolean);

    return json(res, 200, {
      ok:true,
      opportunities,
      count:opportunities.length,
      pool_count:ranked.length,
      source:loaded.map(item => item.name).join(' + '),
      sources:loaded.map(item => ({
        key:item.key,
        name:item.name,
        source_url:item.homepage,
        fetched_at:item.fetched_at,
        refreshed:item.refreshed,
        count:(item.jobs || []).length
      })),
      source_fetched_at:oldestFetch,
      source_refreshed:loaded.some(item => item.refreshed),
      cache_hours:CACHE_HOURS,
      force_refresh_min_hours:FORCE_REFRESH_MIN_HOURS,
      cursor,
      next_cursor:cursor + 1,
      warning:warnings.join(' ')
    });
  } catch (error) {
    console.error('career opportunity discovery failed', error);
    return json(res, 500, { ok:false, error:'Opportunity discovery failed' });
  }
}
