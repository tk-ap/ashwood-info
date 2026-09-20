export const SIGNAL_ACTIVE_DAYS = 7;
export const REVIEW_ACTIVE_DAYS = 14;
export const MONITORING_WINDOW_DAYS = 90;

const DAY_MS = 24 * 60 * 60 * 1000;
const ARCHIVE_SIGNAL_STATUSES = new Set(['DISMISSED', 'COMPLETED', 'DONE', 'RESOLVED', 'CANCELLED']);
const STICKY_SIGNAL_STATUSES = new Set(['ACCEPTED', 'BLOCKED', 'APPROVAL_REQUIRED', 'REQUIRES_APPROVAL', 'AWAITING_APPROVAL', 'REVIEW_REQUIRED']);

function timestamp(value) {
  const ms = new Date(value || 0).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

export function ageDays(value, now = Date.now()) {
  const then = timestamp(value);
  if (!then) return Number.POSITIVE_INFINITY;
  return Math.max(0, (now - then) / DAY_MS);
}

export function signalNeedsPersistentAttention(item = {}) {
  const status = String(item.status || '').toUpperCase();
  if (STICKY_SIGNAL_STATUSES.has(status)) return true;
  const text = `${item.title || ''} ${item.notes || ''}`.toLowerCase();
  return /\bblock(?:ed|er|ing)?\b/.test(text) ||
    /\b(?:needs?|requires?|awaiting) approval\b/.test(text) ||
    /\bapproval required\b/.test(text);
}

export function classifySignal(item = {}, now = Date.now()) {
  const status = String(item.status || 'SIGNAL').toUpperCase();
  if (ARCHIVE_SIGNAL_STATUSES.has(status)) return 'archive';
  if (signalNeedsPersistentAttention(item)) return 'active';
  return ageDays(item.occurred_at, now) > SIGNAL_ACTIVE_DAYS ? 'ignored' : 'active';
}

export function splitSignalAttention(items = [], now = Date.now()) {
  const result = { active: [], ignored: [], archive: [] };
  for (const item of items) result[classifySignal(item, now)].push(item);
  return result;
}

export function classifyReviewItem(item = {}, completed = new Set(), now = Date.now()) {
  if (completed.has(item.id)) return 'archive';
  const occurred = item.deployed_at || item.occurred_at || item.created_at;
  return ageDays(occurred, now) > REVIEW_ACTIVE_DAYS ? 'ignored' : 'active';
}

export function splitReviewAttention(items = [], completed = new Set(), now = Date.now()) {
  const result = { active: [], ignored: [], archive: [] };
  for (const item of items) result[classifyReviewItem(item, completed, now)].push(item);
  return result;
}

export function monitoringSummary(items = [], now = Date.now(), windowDays = MONITORING_WINDOW_DAYS) {
  const groups = new Map();
  for (const item of items) {
    if (String(item.source || '').toLowerCase() === 'manual') continue;
    if (ageDays(item.occurred_at, now) > windowDays) continue;
    const key = String(item.source_label || item.source || 'Ecosystem').trim() || 'Ecosystem';
    const bucket = classifySignal(item, now);
    const current = groups.get(key) || {
      source: key,
      total: 0,
      active: 0,
      ignored: 0,
      archive: 0,
      kept_in_focus: 0,
      dismissed: 0,
    };
    current.total += 1;
    current[bucket] += 1;
    const status = String(item.status || '').toUpperCase();
    if (status === 'ACCEPTED') current.kept_in_focus += 1;
    if (status === 'DISMISSED') current.dismissed += 1;
    groups.set(key, current);
  }

  return [...groups.values()]
    .map(group => ({
      ...group,
      ignored_rate: group.total ? group.ignored / group.total : 0,
      needs_review: group.total >= 3 && group.ignored >= 2 && (group.ignored / group.total) >= 0.5,
    }))
    .sort((a, b) => Number(b.needs_review) - Number(a.needs_review) || b.ignored_rate - a.ignored_rate || b.total - a.total);
}
