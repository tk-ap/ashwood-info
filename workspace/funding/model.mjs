// Shared by the Workspace and the discovery/reverification writer. No owner facts here.
export const DISPOSITIONS = ['APPLY', 'CONSULT', 'HOLD', 'SKIP'];
export const LIFECYCLE = ['CANDIDATE','POSSIBLE_FIT','NEEDS_FACT','VERIFIED_FIT','READY_TO_APPLY','APPLIED','SUBMITTED','AWAITING_RESPONSE','IN_PROGRESS','AWARDED','DENIED','DECLINED','NOT_ELIGIBLE','EXPIRED','CLOSED','COMPLETED'];
export const VIEWS = [['all','All'],['action','Action Needed'],['recommended','Recommended'],['consult','Needs Consultation'],['watching','Watching'],['progress','Submitted / In Progress'],['awarded','Awarded'],['closed','Closed / Ruled Out'],['new','Newly Discovered'],['changed','Changed since last check']];
const CLOSED = new Set(['DENIED','DECLINED','NOT_ELIGIBLE','EXPIRED','CLOSED','COMPLETED']);
const ACTIVE = new Set(['APPLIED','SUBMITTED','AWAITING_RESPONSE','IN_PROGRESS']);
const day = 86400000;
export function actionState(item, states = {}) {
  const saved = states[item.id];
  return {status:item.status || 'CANDIDATE', ...(typeof saved === 'string' ? {status:saved} : saved || {})};
}
export function normalize(item, discoveredAt) {
  return {
    categories:[], aliases:[], evidence:[], eligibility_rules:[], geography:[],
    veteran_requirements:null, income_requirements:null, employment_requirements:null,
    repayable:null, interest_percent:null, fees:null, amount:null, application_window:null,
    time_to_funding_days:null, training_weeks:null, employment_ready_at:null,
    benefit_interactions:['Confirm coordination with other assistance; no compatibility assumed.'],
    verification:'UNVERIFIED', confidence:'unknown', disposition:'HOLD',
    reason:'Authoritative verification required.', action_deadline:null, outcome:null,
    discovered_at:discoveredAt || null, ...item
  };
}
export function sourceKey(url) {
  try { const u = new URL(url); if (u.protocol !== 'https:') return ''; return u.hostname.replace(/^www\./,'') + u.pathname.replace(/\/$/,''); } catch { return ''; }
}
const nameKey = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function duplicateOf(items, incoming) {
  const names = new Set([incoming.name, ...(incoming.aliases || [])].map(nameKey));
  return items.find(item => item.id === incoming.id ||
    (incoming.program_key && item.program_key === incoming.program_key) ||
    [item.name, ...(item.aliases || [])].some(name => names.has(nameKey(name))) ||
    (sourceKey(item.source_url) && sourceKey(item.source_url) === sourceKey(incoming.source_url) &&
      nameKey(item.funder) === nameKey(incoming.funder) && incoming.program_key && item.program_key === incoming.program_key));
}
export function evidenceCurrent(item, now = Date.now()) {
  const verified = Date.parse(item.last_verified_at);
  const maxDays = item.categories?.includes('housing') ? 7 : 14;
  const facts = new Set((item.evidence || []).filter(e => e.authoritative === true && sourceKey(e.url) && e.summary &&
    Date.parse(e.checked_at) <= now && Date.parse(e.checked_at) >= now - maxDays * day).flatMap(e => e.supports || []));
  return item.verification === 'VERIFIED' && verified <= now && verified >= now - maxDays * day &&
    ['availability','criteria','value'].every(fact => facts.has(fact));
}
export function eligibility(item, profile = {}) {
  const unknown = [], failed = [], matched = [];
  for (const rule of item.eligibility_rules || []) {
    const keys = rule.any || [rule.fact];
    if (keys.some(key => profile[key] === true)) matched.push(rule.label);
    else if (keys.every(key => profile[key] === false)) failed.push(rule.label);
    else unknown.push(rule.label);
  }
  // Marketing/profile tags are affinity only, never proof of eligibility.
  if (!(item.eligibility_rules || []).length) unknown.push('Required eligibility facts have not been checked.');
  return {state:failed.length ? 'NOT_ELIGIBLE' : unknown.length ? 'UNKNOWN' : 'MATCHED', matched, failed, unknown};
}
export function evaluate(item, profile = {}, states = {}, now = Date.now()) {
  const action = actionState(item, states), fit = eligibility(item, profile);
  const fresh = evidenceCurrent(item, now);
  const overdue = item.deadline && Date.parse(item.deadline + 'T23:59:59-07:00') < now;
  let disposition = 'HOLD', reason = item.reason;
  if (CLOSED.has(action.status)) { disposition = 'SKIP'; reason = 'Recorded outcome: ' + action.status.replaceAll('_',' '); }
  else if (['closed','exhausted'].includes(item.availability) || overdue) { disposition = 'HOLD'; reason = 'Window closed or deadline elapsed; check the next cycle.'; }
  else if (!fresh) reason = 'Source verification is missing, stale, or changed. Recheck before acting.';
  else if (!['open','open_2026_cycle'].includes(item.availability)) reason = 'Current intake availability needs confirmation.';
  else if (fit.state === 'NOT_ELIGIBLE') { disposition = 'SKIP'; reason = 'Profile facts conflict with: ' + fit.failed.join('; '); }
  else if (item.disposition === 'SKIP') { disposition = 'SKIP'; }
  else if (item.disposition === 'HOLD') { reason = item.reason || 'Watching for a better fit or application window.'; }
  else if (item.training_weeks > 8 || (item.employment_ready_at && item.employment_ready_at > '2026-12-01')) {
    reason = 'Training may delay employment beyond the current December target. Confirm timing before committing.';
  } else if (item.repayable && profile.repayment_capacity !== true) {
    reason = 'Repayable assistance: confirm income, guarantors, repayment capacity, and benefit interactions first.';
  } else if (fit.state === 'UNKNOWN' || item.unknowns?.length || item.disposition !== 'APPLY') {
    disposition = 'CONSULT'; reason = item.reason || 'Provider must confirm the remaining eligibility and assistance details.';
  } else { disposition = 'APPLY'; reason = 'Current official criteria match the confirmed profile facts; provider approval remains required.'; }
  // Owner preferences may defer/skip, but cannot bypass source/eligibility gates.
  if (['HOLD','SKIP'].includes(action.disposition)) { disposition = action.disposition; reason = action.reason || 'Owner disposition.'; }
  const tags = new Set(item.categories || []);
  const affinity = (item.match_tags || []).filter(tag => profile[tag] === true).length;
  const parts = {
    housing:tags.has('housing') ? 1000 : 0,
    employment:tags.has('employment') ? 400 : 0,
    nonrepayable:item.repayable === false ? 150 : 0,
    freeCapital:item.repayable === true && item.interest_percent === 0 && item.fees === 0 ? 90 : 0,
    eligibility:fit.state === 'MATCHED' ? 80 : fit.state === 'NOT_ELIGIBLE' ? -2000 : 0,
    speed:Number.isFinite(item.time_to_funding_days) ? Math.max(0,60-item.time_to_funding_days) : 0,
    effort:{low:30,medium:10,high:-30}[item.effort] || 0,
    interactions:profile.assistance_coordination_confirmed === true ? 10 : -20,
    business:tags.has('business') || item.applicant_lane === 'business' ? 15 : 0,
    delay:item.training_weeks > 8 || (item.employment_ready_at && item.employment_ready_at > '2026-12-01') ? -800 : 0,
    affinity:Math.min(affinity,5)
  };
  return {item, action, fit, fresh, disposition, reason, parts, score:Object.values(parts).reduce((a,b)=>a+b,0),
    next_action:action.next_action || (fresh ? item.next_action : 'Reverify the official program source and current application window.'),
    action_deadline:action.action_deadline || item.action_deadline || item.deadline};
}
export function ranked(items, profile, states, now = Date.now()) {
  return items.map(item => evaluate(item,profile,states,now)).sort((a,b) => {
    const group = e => CLOSED.has(e.action.status) || e.disposition === 'SKIP' ? 4 : e.action.status === 'AWARDED' ? 3 : ACTIVE.has(e.action.status) ? 0 : 1;
    return group(a)-group(b) || b.score-a.score || String(a.action_deadline || '9999').localeCompare(String(b.action_deadline || '9999')) || a.item.id.localeCompare(b.item.id);
  });
}
export function inView(e, view, seenAt = null) {
  const working = ACTIVE.has(e.action.status), closed = CLOSED.has(e.action.status) || e.disposition === 'SKIP';
  const actionable = !working && !closed && e.action.status !== 'AWARDED';
  return view === 'all' ||
    (view === 'action' && ((actionable && ['APPLY','CONSULT'].includes(e.disposition)) || (working && e.action_deadline))) ||
    (view === 'recommended' && actionable && e.disposition === 'APPLY') ||
    (view === 'consult' && actionable && e.disposition === 'CONSULT') ||
    (view === 'watching' && actionable && e.disposition === 'HOLD') ||
    (view === 'progress' && working) || (view === 'awarded' && e.action.status === 'AWARDED') ||
    (view === 'closed' && closed) ||
    (view === 'new' && !working && !closed && (e.item.status === 'CANDIDATE' ||
      (e.item.discovered_at && (!seenAt || e.item.discovered_at > seenAt)))) ||
    (view === 'changed' && Boolean(e.item.changes?.some(c => !seenAt || c.at > seenAt)));
}
export function upsert(registry, incoming, now = new Date().toISOString()) {
  const match = duplicateOf(registry.opportunities,incoming);
  if (!incoming.name || !incoming.funder || !sourceKey(incoming.source_url)) throw new Error('Program, provider and HTTPS source required');
  if (incoming.verification === 'VERIFIED' && !evidenceCurrent(incoming, Date.parse(now))) throw new Error('Current authoritative evidence must cover availability, criteria and value');
  if (!match) {
    if (registry.opportunities.some(item => sourceKey(item.source_url) === sourceKey(incoming.source_url) &&
      (!item.program_key || !incoming.program_key))) throw new Error('Shared source needs explicit distinct program keys or an alias merge');
    if (incoming.verification === 'VERIFIED') throw new Error('New discoveries must enter as CANDIDATE / UNVERIFIED first');
    const item = normalize({...incoming,status:'CANDIDATE',verification:'UNVERIFIED',last_verified_at:null,disposition:'HOLD'},now);
    registry.opportunities.push(item); return item;
  }
  if (incoming.verification === 'UNVERIFIED' && match.verification === 'VERIFIED') {
    // Rediscovery must not erase existing reviewed program facts or lifecycle.
    match.categories = [...new Set([...(match.categories || []),...(incoming.categories || [])])];
    match.aliases = [...new Set([...(match.aliases || []),incoming.name,...(incoming.aliases || [])])];
    return match;
  }
  const changes = ['availability','deadline','application_window','value','amount','criteria','eligibility_rules','interest_percent','fees','unknowns','benefit_interactions','verification']
    .filter(key => key in incoming && JSON.stringify(match[key]) !== JSON.stringify(incoming[key]))
    .map(field => ({at:now,field,before:match[field] ?? null,after:incoming[field]}));
  const id = match.id, status = match.status, discovered = match.discovered_at;
  Object.assign(match,incoming,{id,discovered_at:discovered,categories:[...new Set([...(match.categories || []),...(incoming.categories || [])])],
    status:status === 'CANDIDATE' && incoming.verification === 'VERIFIED' ? 'NEEDS_FACT' : status,
    changes:[...(match.changes || []),...changes].slice(-50)});
  return match;
}
