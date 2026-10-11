import { isApplicationDestinationUrl } from './_career-opportunities.mjs';

const MAX_RESPONSE_BYTES = 500_000;
const MAX_CANDIDATES = 2;
const REQUEST_TIMEOUT_MS = 4_000;
const COMMON_ROLE_WORDS = new Set([
  'senior', 'junior', 'principal', 'manager', 'director', 'lead', 'remote',
  'full', 'time', 'the', 'and', 'for', 'with', 'from'
]);
const ATS_HOSTS = [
  'greenhouse.io', 'lever.co', 'ashbyhq.com', 'myworkdayjobs.com',
  'workday.com', 'workable.com', 'smartrecruiters.com', 'icims.com',
  'jobvite.com', 'oraclecloud.com', 'successfactors.com'
];

function normalizedText(value='') {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:amp|#38);/gi, '&')
    .replace(/&nbsp;/gi, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function words(value='', { includeCommon=false }={}) {
  return [...new Set(normalizedText(value).split(' ').filter(word =>
    word.length >= 3 && (includeCommon || !COMMON_ROLE_WORDS.has(word))
  ))];
}

function decodeUrl(value='') {
  return String(value || '')
    .replace(/&amp;/gi, '&')
    .replace(/\\u002f/gi, '/')
    .replace(/\\\//g, '/');
}

export function isSafeExternalUrl(value='') {
  try {
    const url = new URL(String(value || '').trim());
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    const privateIpv4 = /^(?:0|10|127)\.|^169\.254\.|^172\.(?:1[6-9]|2\d|3[0-1])\.|^192\.168\./.test(host);
    const privateIpv6 = host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80:') || host.startsWith('::ffff:');
    return url.protocol === 'https:' && !url.username && !url.password &&
      (!url.port || url.port === '443') && host !== 'localhost' && !privateIpv4 && !privateIpv6;
  } catch {
    return false;
  }
}

function hostname(value='') {
  try {
    const text = String(value || '').trim();
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
    return url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  } catch {
    return '';
  }
}

function isAtHost(host='', domain='') {
  return host === domain || host.endsWith(`.${domain}`);
}

// A page mentioning a company and role is not itself enough: job boards do that
// too. An accepted destination must be a known ATS or a hostname explicitly
// recorded as the employer's. This intentionally favors holding a role in the
// inbox over guessing that an unfamiliar host belongs to the company.
export function isLikelyEmployerOrAtsUrl(value='', job={}) {
  if (!isSafeExternalUrl(value) || !isApplicationDestinationUrl(value)) return false;
  const host = hostname(value);
  if (ATS_HOSTS.some(domain => isAtHost(host, domain))) return true;
  const declaredHost = hostname(job.employer_host || job.employer_origin || '');
  return Boolean(declaredHost) && (host === declaredHost || host.endsWith(`.${declaredHost}`));
}

export function extractEmployerCandidates(html='', sourceUrl='', job={}) {
  const candidates = new Map();
  const add = (raw, score=0) => {
    try {
      const url = new URL(decodeUrl(raw), sourceUrl);
      const normalized = url.toString();
      // Discovery pages are never their own verification. A board's internal
      // "apply" route must lead to a separately identifiable company/ATS host.
      if (!isLikelyEmployerOrAtsUrl(normalized, job) || hostname(normalized) === hostname(sourceUrl)) return;
      const existing = candidates.get(normalized) || 0;
      candidates.set(normalized, Math.max(existing, score));
    } catch {
      // An invalid source-page link is not evidence of a company listing.
    }
  };

  for (const match of String(html).matchAll(/\bhref\s*=\s*["']([^"']+)["']/gi)) {
    const context = String(html).slice(Math.max(0, match.index - 180), match.index + match[0].length + 180).toLowerCase();
    const value = decodeUrl(match[1]);
    const score = (/apply|career|job|opening|position/.test(context) ? 4 : 0) +
      (/greenhouse|lever|ashby|workday|workable|smartrecruiters|icims|jobvite|career|jobs/.test(value) ? 3 : 0);
    add(value, score);
  }
  for (const match of String(html).matchAll(/https?:\\?\/\\?\/[^"'\s<>\\]+/gi)) {
    const value = decodeUrl(match[0]);
    const score = /greenhouse|lever|ashby|workday|workable|smartrecruiters|icims|jobvite|career|jobs/i.test(value) ? 2 : 0;
    add(value, score);
  }
  return [...candidates.entries()]
    .sort(([, left], [, right]) => right - left)
    .map(([url]) => url)
    .slice(0, MAX_CANDIDATES);
}

export function employerPageEvidence(html='', job={}) {
  const text = normalizedText(html);
  const companyTerms = words(job.company_name || job.company, { includeCommon:true });
  const roleTerms = words(job.title || job.role).filter(term => term.length >= 4);
  const matchedCompanyTerms = companyTerms.filter(term => text.includes(term));
  const matchedRoleTerms = roleTerms.filter(term => text.includes(term));
  const companyMatches = companyTerms.length ? matchedCompanyTerms.length === companyTerms.length : false;
  const neededRoleTerms = Math.min(2, Math.max(1, roleTerms.length));
  return {
    company_matches:companyMatches,
    matched_company_terms:matchedCompanyTerms,
    matched_role_terms:matchedRoleTerms,
    role_matches:matchedRoleTerms.length >= neededRoleTerms,
    verified:companyMatches && matchedRoleTerms.length >= neededRoleTerms
  };
}

async function responseText(response) {
  const reader = response.body?.getReader?.();
  if (!reader) return (await response.text()).slice(0, MAX_RESPONSE_BYTES);
  const decoder = new TextDecoder();
  let text = '';
  while (text.length < MAX_RESPONSE_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream:true });
  }
  if (text.length >= MAX_RESPONSE_BYTES) await reader.cancel().catch(() => {});
  return text.slice(0, MAX_RESPONSE_BYTES);
}

async function fetchHtml(url, fetchImpl) {
  if (!isSafeExternalUrl(url)) return { ok:false, reason:'unsafe_url' };
  try {
    const response = await fetchImpl(url, {
      redirect:'follow',
      headers:{ 'Accept':'text/html,application/xhtml+xml', 'User-Agent':'ASHWOOD-Career-Listing-Verifier/1.0' },
      signal:AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
    if (!response.ok) return { ok:false, reason:`http_${response.status}` };
    if (!isSafeExternalUrl(response.url || url)) return { ok:false, reason:'unsafe_redirect' };
    return { ok:true, url:response.url || url, html:await responseText(response) };
  } catch {
    return { ok:false, reason:'unavailable' };
  }
}

export async function verifyEmployerListing(job={}, { fetchImpl=fetch, checkedAt=new Date().toISOString() }={}) {
  const sourceUrl = String(job.source_url || job.url || '').trim();
  if (!isSafeExternalUrl(sourceUrl)) return { status:'unverified', reason:'unsafe_source_url', checked_at:checkedAt };

  // Feed entries and board pages must yield a separate destination. Only a
  // curator can explicitly label a URL as an employer listing; that listing is
  // still fetched and matched below, rather than being trusted from the label.
  let candidates = job.discovery_kind === 'employer_listing' && isLikelyEmployerOrAtsUrl(sourceUrl, job)
    ? [sourceUrl]
    : [];
  if (!candidates.length) {
    const source = await fetchHtml(sourceUrl, fetchImpl);
    if (!source.ok) return { status:'unverified', reason:source.reason, checked_at:checkedAt };
    candidates = extractEmployerCandidates(source.html, source.url, job);
  }
  if (!candidates.length) return { status:'unverified', reason:'no_employer_listing_link_found', checked_at:checkedAt };

  const listings = await Promise.all(candidates.map(candidate => fetchHtml(candidate, fetchImpl)));
  for (const listing of listings) {
    if (!listing.ok || !isLikelyEmployerOrAtsUrl(listing.url, job)) continue;
    const evidence = employerPageEvidence(listing.html, job);
    if (!evidence.verified) continue;
    return {
      status:'verified',
      employer_url:listing.url,
      source_url:sourceUrl,
      verified_at:checkedAt,
      checked_at:checkedAt,
      evidence
    };
  }
  return { status:'unverified', reason:'employer_page_did_not_match_role', checked_at:checkedAt };
}
