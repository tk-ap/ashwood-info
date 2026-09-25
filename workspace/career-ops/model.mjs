export const ACTIVE_STATUSES = new Set(['TARGET','APPLIED','SCREENING','RECRUITER','ASSESSMENT','INTERVIEW','OFFER','DEFERRED']);
export const TERMINAL_STATUSES = new Set(['REJECTED','ASSUMED_REJECTED','DECLINED','CLOSED']);

export function normaliseStatus(value='TARGET') {
  const status = String(value || 'TARGET').trim().toUpperCase();
  return [...ACTIVE_STATUSES, ...TERMINAL_STATUSES].includes(status) ? status : 'TARGET';
}

export function salaryLabel(application={}) {
  const currency = application.salary_currency || 'USD';
  const fmt = value => Number(value).toLocaleString(undefined, { style:'currency', currency, maximumFractionDigits:0 });
  if (application.salary_min && application.salary_max) return `${fmt(application.salary_min)}–${fmt(application.salary_max)}`;
  if (application.salary_min) return `${fmt(application.salary_min)}+`;
  if (application.salary_max) return `Up to ${fmt(application.salary_max)}`;
  return 'Not listed';
}

export function requestedSalaryLabel(application={}) {
  if (!application.requested_salary) return null;
  const currency = application.salary_currency || 'USD';
  return Number(application.requested_salary).toLocaleString(undefined, { style:'currency', currency, maximumFractionDigits:0 });
}

export function ageInDays(value, now=Date.now()) {
  const time = new Date(value || 0).getTime();
  if (!Number.isFinite(time)) return Infinity;
  return Math.max(0, Math.floor((now - time) / 86400000));
}

export function needsAttention(application={}, now=Date.now()) {
  const status = normaliseStatus(application.status);
  if (TERMINAL_STATUSES.has(status) || status === 'OFFER') return false;
  if (application.next_action_at) return new Date(application.next_action_at).getTime() <= now + 86400000;
  const anchor = application.updated_at || application.submitted_at || application.created_at;
  if (status === 'APPLIED' || status === 'SCREENING') return ageInDays(anchor, now) >= 7;
  if (status === 'RECRUITER' || status === 'ASSESSMENT' || status === 'INTERVIEW') return ageInDays(anchor, now) >= 2;
  return false;
}

const SUBMITTED_STATUSES = new Set(['APPLIED','SCREENING','RECRUITER','ASSESSMENT','INTERVIEW','OFFER','REJECTED','ASSUMED_REJECTED']);
const INTERVIEW_EVENTS = new Set(['INTERVIEW','OFFER']);
const RESPONSE_EVENTS = new Set(['SCREENING','RECRUITER','ASSESSMENT','INTERVIEW','OFFER','REJECTION']);

/**
 * Funnel counts derived only from the canonical tracker (applications plus their
 * event history), so Gmail reconciliation moves them without separate counters.
 * A rejected application was still submitted, and an application that reached
 * interview keeps that conversion after a later decision. No-response means a
 * submitted application remains APPLIED with no meaningful employer-response event.
 */
export function summaryCounts(applications=[], events=[]) {
  const relevantEvents = events.filter(event => event.payload?.relevance !== 'ignored');
  const interviewed = new Set(relevantEvents
    .filter(event => INTERVIEW_EVENTS.has(String(event.event_type || '').toUpperCase()))
    .map(event => event.application_id));
  const responded = new Set(relevantEvents
    .filter(event => RESPONSE_EVENTS.has(String(event.event_type || '').toUpperCase()))
    .map(event => event.application_id));
  return applications.reduce((acc, app) => {
    const status = normaliseStatus(app.status);
    const submitted = SUBMITTED_STATUSES.has(status) || (app.submitted_at && status !== 'TARGET' && status !== 'DECLINED');
    if (submitted) acc.submitted += 1;
    if (status === 'REJECTED' || status === 'ASSUMED_REJECTED') acc.denied += 1;
    if (status === 'INTERVIEW' || status === 'OFFER' || interviewed.has(app.id)) acc.interviews += 1;
    if (submitted && status === 'APPLIED' && !responded.has(app.id)) acc.noResponse += 1;
    return acc;
  }, { submitted:0, denied:0, noResponse:0, interviews:0 });
}

export function sortApplications(applications=[]) {
  const order = { INTERVIEW:1, RECRUITER:2, ASSESSMENT:3, OFFER:4, SCREENING:5, APPLIED:6, TARGET:7, DEFERRED:8, ASSUMED_REJECTED:9, REJECTED:10, DECLINED:11, CLOSED:12 };
  return [...applications].sort((a,b) => {
    const sa = order[normaliseStatus(a.status)] || 99;
    const sb = order[normaliseStatus(b.status)] || 99;
    if (sa !== sb) return sa - sb;
    return new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0);
  });
}

const OUTCOME_LABELS = {
  REJECTION:'Rejection received',
  ASSUMED_REJECTION:'Assumed rejection after silent-close window',
  OFFER:'Offer received',
  INTERVIEW:'Interview requested',
  ASSESSMENT:'Assessment requested',
  RECRUITER:'Recruiter contact',
  SCREENING:'Application under review',
  CONFIRMATION:'Application confirmed'
};

/**
 * User-facing inbox sync summary. Only verified tracker writes count as
 * updates, one per application; "No new application updates" is used only
 * when there are none.
 */
export function syncSummary({ outcomes=[], reviewOpen=0 }={}) {
  const seen = new Set();
  const items = outcomes.filter(item => item.verified && !seen.has(item.application_id) && seen.add(item.application_id)).map(item => ({
    title:`${item.company} — ${item.role}`,
    outcome:item.correction ? 'Status corrected from application history' : OUTCOME_LABELS[item.evidence_event_type] || 'Application update',
    status:item.to
  }));
  const reviewText = `${reviewOpen} application email${reviewOpen === 1 ? '' : 's'} require${reviewOpen === 1 ? 's' : ''} review.`;
  if (!items.length) {
    return { headline:'No new application updates. Your tracker is current.', items, review:reviewOpen ? reviewText : null };
  }
  return { headline:`Located ${items.length} application update${items.length === 1 ? '' : 's'}.`, items, review:reviewText };
}
