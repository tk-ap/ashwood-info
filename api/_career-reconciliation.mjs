const words = value => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()
  .split(/\s+/)
  .filter(word => word.length > 1);

export const normaliseCareerText = value => words(value).join(' ');

const includesAll = (needles, haystack) => needles.length > 0 && needles.every(word => haystack.includes(word));

function identityScore(value, candidate, exactPoints, subsetPoints) {
  const left = words(value);
  const right = words(candidate);
  if (!left.length || !right.length) return 0;
  if (left.join(' ') === right.join(' ')) return exactPoints;
  if (includesAll(left, right) || includesAll(right, left)) return subsetPoints;
  return 0;
}

/**
 * Reconcile only when both employer and role independently identify one record.
 * A caller may create a record only after it has separately verified the facts.
 */
export function reconcileCareerApplication(applications, { company, role, jobId, allowCreate = false } = {}) {
  const candidates = applications.map(application => {
    const jobScore = jobId && String(application.job_id || '').toLowerCase() === String(jobId).toLowerCase() ? 12 : 0;
    const companyScore = identityScore(company, application.company, 4, 3);
    const roleScore = identityScore(role, application.role, 6, 4);
    return { application, jobScore, companyScore, roleScore, score: jobScore + companyScore + roleScore };
  }).filter(candidate => candidate.jobScore || (candidate.companyScore >= 3 && candidate.roleScore >= 4))
    .sort((left, right) => right.score - left.score || String(left.application.id).localeCompare(String(right.application.id)));

  const top = candidates[0];
  if (top) {
    const tied = candidates.filter(candidate => candidate.score === top.score);
    if (tied.length === 1) return { kind: 'matched', application: top.application };
    return { kind: 'review_required', reason: 'ambiguous_match', candidates: tied.map(candidate => candidate.application) };
  }

  if (allowCreate && normaliseCareerText(company) && normaliseCareerText(role)) {
    return { kind: 'create', application: { company: String(company).trim(), role: String(role).trim(), job_id: jobId || null } };
  }
  return { kind: 'review_required', reason: 'no_safe_match', candidates: [] };
}

export function reconcileCareerEmail(applications, { subject = '', from = '', snippet = '' } = {}) {
  const messageWords = new Set(words(`${subject} ${from} ${snippet}`));
  const candidates = applications.map(application => {
    const companyWords = words(application.company);
    const roleWords = words(application.role);
    const companyHits = companyWords.filter(word => messageWords.has(word)).length;
    const roleHits = roleWords.filter(word => messageWords.has(word)).length;
    const jobMatch = application.job_id && messageWords.has(String(application.job_id).toLowerCase());
    const companyEvidence = companyHits > 0;
    const roleEvidence = roleWords.length > 0 && roleHits === roleWords.length;
    const score = (jobMatch ? 12 : 0) + (companyWords.length ? (companyHits / companyWords.length) * 4 : 0) + (roleWords.length ? (roleHits / roleWords.length) * 6 : 0);
    return { application, companyEvidence, roleEvidence, jobMatch, score };
  }).filter(candidate => candidate.jobMatch || (candidate.companyEvidence && candidate.roleEvidence))
    .sort((left, right) => right.score - left.score || String(left.application.id).localeCompare(String(right.application.id)));
  const top = candidates[0];
  if (!top) return { kind: 'review_required', reason: 'no_safe_match', candidates: [] };
  const tied = candidates.filter(candidate => candidate.score === top.score);
  if (tied.length !== 1) return { kind: 'review_required', reason: 'ambiguous_match', candidates: tied.map(candidate => candidate.application) };
  return { kind: 'matched', application: top.application };
}

export function gmailEventId(messageId) {
  return `career-event:gmail:${String(messageId)}`;
}
