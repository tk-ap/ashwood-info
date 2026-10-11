import { getSql, json, requireSession, sameOrigin } from './_workspace.mjs';
import { rankOpportunityQueues, rotateOpportunities } from './_career-opportunities.mjs';
import { CURATED_CAREER_OPPORTUNITIES } from './_career-curated-opportunities.mjs';
import { verifyEmployerListing } from './_career-employer-verifier.mjs';

const CACHE_HOURS = 6;
const FORCE_REFRESH_MIN_HOURS = 1;
const VERIFICATION_RECHECK_HOURS = 6;
const MAX_AUTONOMOUS_VERIFICATIONS = 1;
const SOURCES = [
  {
    key:'remotive',
    name:'Remotive',
    url:'https://remotive.com/api/remote-jobs?limit=200',
    homepage:'https://remotive.com/',
    normalize:job => ({
      ...job,
      source_name:'Remotive',
      source_url:String(job.url || '').trim(),
      discovery_kind:'job_board',
      // A feed result is discovery evidence, not independent proof that its
      // company listing is live. A verifier must add the employer fields.
      direct_employer_listing_verified:false,
      employer_listing_verified_at:null
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
      source_url:String(job.url || '').trim(),
      discovery_kind:'job_board',
      direct_employer_listing_verified:false,
      employer_listing_verified_at:null
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
  await sql`
    CREATE TABLE IF NOT EXISTS workspace_career_opportunity_verifications (
      source TEXT NOT NULL,
      opportunity_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'UNVERIFIED',
      employer_url TEXT,
      source_url TEXT,
      checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      verified_at TIMESTAMPTZ,
      failure_reason TEXT,
      evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (source, opportunity_id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS workspace_career_opportunity_verification_status_idx ON workspace_career_opportunity_verifications(status, checked_at DESC)`;
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
    SELECT company, role, posting_url, status
    FROM workspace_career_applications
  `;
}

function sourceKey(value='') {
  return String(value).trim().toLowerCase().replace(/\s+/g,'-');
}

function opportunityKey(job={}) {
  return `${sourceKey(job.source_name || job.source)}::${String(job.id || '')}`;
}

function applyVerifiedEmployerListings(jobs=[], rows=[]) {
  const verified = new Map(
    rows
      .filter(row => String(row.status || '').toUpperCase() === 'VERIFIED' && row.employer_url && row.verified_at)
      .map(row => [`${sourceKey(row.source)}::${String(row.opportunity_id)}`, row])
  );
  return jobs.map(job => {
    const row = verified.get(opportunityKey(job));
    if (!row) return job;
    return {
      ...job,
      employer_url:row.employer_url,
      direct_employer_listing_verified:true,
      employer_listing_verified_at:row.verified_at
    };
  });
}

async function currentVerifications(sql) {
  return sql`
    SELECT source, opportunity_id, status, employer_url, source_url, checked_at, verified_at, failure_reason, evidence
    FROM workspace_career_opportunity_verifications
    WHERE status = 'VERIFIED' AND verified_at >= NOW() - INTERVAL '7 days'
  `;
}

async function sourceJobsForVerification(sql) {
  const loaded = [];
  for (const source of SOURCES) loaded.push(await loadSource(sql, source, false));
  return [...CURATED_CAREER_OPPORTUNITIES, ...loaded.flatMap(item => item.jobs || [])];
}

async function storeVerification(sql, job, result) {
  const status = result.status === 'verified' ? 'VERIFIED' : 'UNVERIFIED';
  await sql`
    INSERT INTO workspace_career_opportunity_verifications (
      source, opportunity_id, status, employer_url, source_url, checked_at, verified_at, failure_reason, evidence, updated_at
    ) VALUES (
      ${sourceKey(job.source_name || job.source)}, ${String(job.id || '')}, ${status}, ${result.employer_url || null},
      ${result.source_url || job.source_url || job.url || null}, ${result.checked_at || new Date().toISOString()},
      ${result.verified_at || null}, ${result.reason || null}, ${JSON.stringify(result.evidence || {})}::jsonb, NOW()
    )
    ON CONFLICT (source, opportunity_id) DO UPDATE SET
      status = EXCLUDED.status,
      employer_url = EXCLUDED.employer_url,
      source_url = EXCLUDED.source_url,
      checked_at = EXCLUDED.checked_at,
      verified_at = EXCLUDED.verified_at,
      failure_reason = EXCLUDED.failure_reason,
      evidence = EXCLUDED.evidence,
      updated_at = NOW()
  `;
}

export async function verifyPendingOpportunities(req, res) {
  try {
    if (!(await requireSession(req))) return json(res, 401, { ok:false, error:'Unauthorized' });
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
    if (!sameOrigin(req)) return json(res, 403, { ok:false, error:'Origin not allowed' });

    const sql = getSql();
    await ensureSchema(sql);
    const [rawJobs, verifiedRows, recentRows, tracked] = await Promise.all([
      sourceJobsForVerification(sql),
      currentVerifications(sql),
      sql`
        SELECT source, opportunity_id, checked_at
        FROM workspace_career_opportunity_verifications
        WHERE checked_at >= NOW() - (${VERIFICATION_RECHECK_HOURS} * INTERVAL '1 hour')
      `,
      trackedApplications(sql)
    ]);
    const recentlyChecked = new Set(recentRows.map(row => `${sourceKey(row.source)}::${String(row.opportunity_id)}`));
    const jobs = applyVerifiedEmployerListings(rawJobs, verifiedRows);
    const jobsByKey = new Map(jobs.map(job => [opportunityKey(job), job]));
    const pending = rankOpportunityQueues(jobs, tracked).verification
      .map(opportunity => jobsByKey.get(`${sourceKey(opportunity.source)}::${String(opportunity.id)}`))
      .filter(Boolean)
      .filter(job => !recentlyChecked.has(opportunityKey(job)))
      .slice(0, MAX_AUTONOMOUS_VERIFICATIONS);

    const results = await Promise.all(pending.map(async job => {
      const result = await verifyEmployerListing(job);
      await storeVerification(sql, job, result);
      return {
        source:sourceKey(job.source_name || job.source),
        opportunity_id:String(job.id || ''),
        status:result.status,
        reason:result.reason || null
      };
    }));
    return json(res, 200, {
      ok:true,
      checked:results.length,
      verified:results.filter(item => item.status === 'verified').length,
      results
    });
  } catch (error) {
    console.error('career employer verification failed', error);
    return json(res, 500, { ok:false, error:'Employer listing verification failed' });
  }
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

    const rawSourceJobs = [...CURATED_CAREER_OPPORTUNITIES, ...loaded.flatMap(item => item.jobs || [])];
    if (!rawSourceJobs.length) {
      throw new Error('No opportunity source returned usable jobs');
    }
    const sourceJobs = applyVerifiedEmployerListings(rawSourceJobs, await currentVerifications(sql));

    const declinedRows = await sql`
      SELECT source, opportunity_id, company, role
      FROM workspace_career_opportunity_dispositions
      WHERE disposition = 'DECLINED'
    `;
    const declinedKeys = new Set(
      declinedRows.map(row => `${sourceKey(row.source)}::${String(row.opportunity_id)}`)
    );
    const declinedPairs = new Set(
      declinedRows
        .filter(row => row.company && row.role)
        .map(row => `${String(row.company).trim().toLowerCase()}::${String(row.role).trim().toLowerCase()}`)
    );
    const wasDeclined = item =>
      declinedKeys.has(`${sourceKey(item.source)}::${String(item.id)}`) ||
      declinedPairs.has(`${String(item.company).trim().toLowerCase()}::${String(item.role).trim().toLowerCase()}`);

    const queues = rankOpportunityQueues(sourceJobs, tracked);
    const ranked = queues.recommended.filter(item => !wasDeclined(item));
    const reviewRanked = queues.review.filter(item => !wasDeclined(item));
    const verificationRanked = queues.verification.filter(item => !wasDeclined(item));
    const opportunities = rotateOpportunities(ranked, cursor, 8);
    const reviewOpportunities = rotateOpportunities(reviewRanked, cursor, 4);
    const verificationOpportunities = rotateOpportunities(verificationRanked, cursor, 6);

    const fetchedTimes = loaded
      .map(item => new Date(item.fetched_at || 0).getTime())
      .filter(value => Number.isFinite(value) && value > 0);
    const oldestFetch = fetchedTimes.length ? new Date(Math.min(...fetchedTimes)).toISOString() : null;
    const warnings = loaded.map(item => item.warning).filter(Boolean);

    return json(res, 200, {
      ok:true,
      opportunities,
      review_opportunities:reviewOpportunities,
      verification_opportunities:verificationOpportunities,
      count:opportunities.length,
      review_count:reviewOpportunities.length,
      verification_count:verificationOpportunities.length,
      pool_count:ranked.length,
      review_pool_count:reviewRanked.length,
      verification_pool_count:verificationRanked.length,
      source:['Curated Career Search', ...loaded.map(item => item.name)].join(' + '),
      sources:[
        {
          key:'curated-career-search',
          name:'Curated Career Search',
          source_url:'workspace-ingest',
          fetched_at:null,
          refreshed:false,
          count:CURATED_CAREER_OPPORTUNITIES.length
        },
        ...loaded.map(item => ({
        key:item.key,
        name:item.name,
        source_url:item.homepage,
        fetched_at:item.fetched_at,
        refreshed:item.refreshed,
        count:(item.jobs || []).length
      }))
      ],
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
