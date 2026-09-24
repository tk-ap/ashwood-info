export const ACTIVE_STATUSES = new Set(['TARGET','APPLIED','SCREENING','RECRUITER','ASSESSMENT','INTERVIEW','OFFER','DEFERRED']);
export const TERMINAL_STATUSES = new Set(['REJECTED','DECLINED','CLOSED']);

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

export function summaryCounts(applications=[], now=Date.now()) {
  return applications.reduce((acc, app) => {
    const status = normaliseStatus(app.status);
    if (['APPLIED','SCREENING','RECRUITER','ASSESSMENT','INTERVIEW','OFFER'].includes(status)) acc.submitted += 1;
    if (status === 'REJECTED') acc.denied += 1;
    if (status === 'INTERVIEW' || status === 'OFFER') acc.interviews += 1;
    return acc;
  }, { submitted:0, denied:0, interviews:0 });
}

export function sortApplications(applications=[]) {
  const order = { INTERVIEW:1, RECRUITER:2, ASSESSMENT:3, OFFER:4, SCREENING:5, APPLIED:6, TARGET:7, DEFERRED:8, REJECTED:9, DECLINED:10, CLOSED:11 };
  return [...applications].sort((a,b) => {
    const sa = order[normaliseStatus(a.status)] || 99;
    const sb = order[normaliseStatus(b.status)] || 99;
    if (sa !== sb) return sa - sb;
    return new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0);
  });
}
