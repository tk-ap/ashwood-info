// Pure sanitizing for released ALVIRA Context snapshots (no database or network imports), shared by
// the /workspace context endpoint, scripts/sync-alvira-context.mjs and the tests.

import crypto from 'node:crypto';

const sha256 = value => crypto.createHash('sha256').update(String(value)).digest('hex');

const MAX_DOMAINS = 40;
const MAX_ANSWERS = 20;
const MAX_ANSWER_CHARS = 2000;
const MAX_FIELD_CHARS = 1200;
const MAX_SOURCES = 50;
const SENSITIVE = /\[SENSITIVE\b|\[withheld: sensitive/i;
const URL_RE = /https?:\/\/[^\s<>()"'`]+/gi;
const CREDENTIAL_PARAM = /(?:^|[?&#])(?:x-amz-[a-z-]+|x-goog-[a-z-]+|token|access_token|id_token|auth|authorization|sig|signature|key|api_?key|secret|password|pwd|code|session|sessionid|jwt|se|sp|sv|st)=/i;
const GOAL_FIELDS = ['goal', 'done', 'successMeasures', 'constraints', 'priorities', 'decisions', 'currentState', 'people', 'openQuestions', 'nextSteps'];

function credentialUrl(url) {
  const authority = url.split('//')[1]?.split('/')[0] || '';
  return authority.includes('@') || CREDENTIAL_PARAM.test(url);
}

/** Plain text that may be stored: no sensitive item, no credential-bearing link, capped. */
export function cleanText(value, max) {
  if (typeof value !== 'string') return '';
  const text = value.trim();
  if (!text || SENSITIVE.test(text)) return '';
  return text.replace(URL_RE, url => (credentialUrl(url) ? '[link removed: it carried a credential]' : url)).slice(0, max);
}

function markedSensitive(text) {
  let decoded = text;
  try { decoded = decodeURIComponent(text); } catch { /* keep raw */ }
  return SENSITIVE.test(text) || SENSITIVE.test(decoded);
}

export function safeId(value) {
  const id = String(value || '').trim();
  return /^[A-Za-z0-9._:@-]{1,120}$/.test(id) ? id : '';
}

function safeDate(value) {
  const date = new Date(value || '');
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * A released ALVIRA Context snapshot as the workspace stores it, or null when it is unusable.
 * Input: { source: 'alvira', context_id, topic, observed_at, domains:[{id,label,answers}], goal_spec, sources, provenance }.
 */
export function cleanContextSnapshot(body) {
  if (!body || typeof body !== 'object' || body.source !== 'alvira') return null;
  const contextId = safeId(body.context_id);
  if (!contextId) return null;
  const domains = (Array.isArray(body.domains) ? body.domains : []).slice(0, MAX_DOMAINS).map(domain => {
    const answers = (Array.isArray(domain?.answers) ? domain.answers : []).map(a => cleanText(a, MAX_ANSWER_CHARS)).filter(Boolean).slice(0, MAX_ANSWERS);
    const id = safeId(domain?.id);
    return id && answers.length ? { id, label: cleanText(domain?.label, 120) || id, answers } : null;
  }).filter(Boolean);
  const specFields = {};
  const rawFields = body.goal_spec && typeof body.goal_spec === 'object' ? body.goal_spec.fields || {} : {};
  for (const key of GOAL_FIELDS) {
    const field = rawFields[key];
    if (!field || typeof field !== 'object') continue;
    const value = field.value === null ? null : cleanText(field.value, MAX_FIELD_CHARS);
    if (value === '') continue;
    specFields[key] = { value, basis: field.basis === 'owner' ? 'owner' : 'interview' };
  }
  // Only owner-confirmed ("ready") https sources; a link awaiting review, a credential link, or a
  // locator/label carrying a sensitive or withheld marker (also URL-encoded) is never stored
  // (Codex review of 1992f9f: the server must enforce confirmation, not trust the sender).
  const sources = (Array.isArray(body.sources) ? body.sources : []).map(source => {
    if (source?.status !== 'ready') return null;
    const locator = String(source?.locator || '').trim();
    if (!/^https:\/\//i.test(locator) || credentialUrl(locator) || markedSensitive(locator)) return null;
    if (markedSensitive(String(source?.label || ''))) return null;
    return { type: cleanText(source?.type, 40) || 'website', label: cleanText(source?.label, 200) || locator, locator };
  }).filter(Boolean).slice(0, MAX_SOURCES);
  const provenance = body.provenance && typeof body.provenance === 'object' ? {
    actor_type: body.provenance.actor_type === 'agent' ? 'agent' : 'human',
    ...(safeId(body.provenance.actor_id) ? { actor_id: safeId(body.provenance.actor_id) } : {}),
    ...(body.provenance.delegated ? { delegated: true } : {}),
  } : null;
  if (!domains.length && !Object.keys(specFields).length) return null;
  const snapshot = {
    source: 'alvira',
    context_id: contextId,
    topic: cleanText(body.topic, 300) || 'ALVIRA Context',
    context_updated_at: safeDate(body.context_updated_at),
    domains,
    goal_spec: Object.keys(specFields).length ? { fields: specFields } : null,
    sources,
    provenance,
    environment: body.environment === 'production' ? 'production' : 'test',
  };
  return { ...snapshot, content_hash: sha256(JSON.stringify(snapshot)) };
}

