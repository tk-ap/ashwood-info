import { requireSession, json } from './_workspace.mjs';
import { REGISTER_REPOS, githubRecord } from './_work-register-core.mjs';

const TTL_MS = 5 * 60 * 1000;
const cache = new Map();
const MAX_PAGES = 2;

async function getPage(repo, page, token) {
  const url = 'https://api.github.com/repos/tk-ap/' + encodeURIComponent(repo)
    + '/issues?state=open&sort=updated&direction=desc&per_page=100&page=' + page;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8500);
  try {
    const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'ashwood-work-register' };
    if (token) headers.Authorization = 'Bearer ' + token;
    const response = await fetch(url, { headers, cache: 'no-store', signal: controller.signal });
    if (!response.ok) throw new Error('GitHub access unavailable (' + response.status + ')');
    const body = await response.json();
    if (!Array.isArray(body)) throw new Error('Unexpected GitHub response');
    return body;
  } finally { clearTimeout(timeout); }
}

async function readRepo(repo, token) {
  const rows = [];
  let truncated = false;
  try {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const records = await getPage(repo, page, token);
      rows.push(...records.map(row => githubRecord(row, repo)).filter(Boolean));
      if (records.length < 100) break;
      if (page === MAX_PAGES) truncated = true;
    }
    return { repo, status: truncated ? 'partial' : 'ok', rows, count: rows.length, truncated };
  } catch (error) {
    // Never expose provider response bodies, request headers, or tokens.
    return { repo, status: 'unavailable', rows: [], count: 0, truncated: false, reason: String(error.message).slice(0, 90) };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'Read-only route' });
  try {
    if (!await requireSession(req)) return json(res, 401, { ok: false, error: 'Workspace session required' });
    const url = new URL(req.url || '/', 'https://workspace.local');
    const selector = url.searchParams.get('repo') || 'all';
    if (selector !== 'all' && !REGISTER_REPOS.includes(selector)) return json(res, 400, { ok: false, error: 'Unsupported repository' });
    const token = process.env.WORK_REGISTER_GITHUB_TOKEN || process.env.GITHUB_TOKEN || '';
    const selected = selector === 'all' ? REGISTER_REPOS : [selector];
    const key = selected.join(',');
    const hit = cache.get(key);
    if (hit && Date.now() - hit.time < TTL_MS) return json(res, 200, hit.payload);
    const results = await Promise.all(selected.map(repo => readRepo(repo, token)));
    const payload = {
      ok: true, read_only: true, authority: 'github', observed_at: new Date().toISOString(),
      authenticated_upstream: Boolean(token),
      completeness: results.every(x => x.status === 'ok') ? 'bounded' : 'incomplete',
      coverage: results.map(({ repo, status, count, truncated, reason }) => ({ repo, status, count, truncated, reason })),
      rows: results.flatMap(x => x.rows),
      limits: { max_pages_per_repository: MAX_PAGES, source: 'GitHub issues API (includes PRs)' }
    };
    cache.set(key, { time: Date.now(), payload });
    return json(res, 200, payload);
  } catch (error) {
    console.error('work register request failed:', error?.name || 'unknown');
    return json(res, 503, { ok: false, error: 'Work Register cannot verify the owner session or GitHub sources' });
  }
}
