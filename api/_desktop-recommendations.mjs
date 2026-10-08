// Projection only. Inputs are the already-ranked canonical Career queues.
// Funding requires the unified registry evaluator AND canonical owner action state.
const ORIGIN = 'https://ashwood-info.vercel.app';
const label = value => typeof value === 'string' ? value.replace(/[\u0000-\u001f]/g, ' ').slice(0, 240) : '';
export function recommendationId(item) {
  return `${String(item.source || '').trim().toLowerCase().replace(/\s+/g,'-')}:${String(item.id)}`;
}
export function desktopRecommendations(ranked = [], { now = Date.now(), freshAt = null, sourceFreshness = null } = {}) {
  const generated_at = new Date(now).toISOString();
  const observed = item => Date.parse(sourceFreshness === null ? freshAt : sourceFreshness[item.source]);
  const valid = item => { const fresh = observed(item); return Number.isFinite(fresh) && fresh <= now && fresh >= now - 6*3600000; };
  const seen = new Set();
  const jobs = ranked.filter(item => {
    const id = recommendationId(item);
    if (!valid(item) || seen.has(id) || item.recommendation_bucket !== 'recommended' || item.eligibility_status !== 'eligible') return false;
    seen.add(id); return true;
  }).map(item => ({
    id:recommendationId(item), company:label(item.company), role:label(item.role),
    compensation_label:label(item.salary), location_label:label([item.work_arrangement_preference, item.location].filter(Boolean).join(' · ')),
    bucket:'RECOMMENDED', reason:label(item.fit_summary), fresh_at:new Date(observed(item)).toISOString(),
    canonical_url:`${ORIGIN}/workspace/career-ops/?opportunity=${encodeURIComponent(recommendationId(item))}`
  })).filter(item => item.company && item.role && item.reason).slice(0,60);
  const expires = Math.min(now + 6*3600000, ...jobs.map(item => Date.parse(item.fresh_at) + 6*3600000));
  return { schema_version:1, source:'ashwood-canonical-recommendations', generated_at,
    expires_at:new Date(expires).toISOString(), jobs, funding:[],
    funding_state:'UNAVAILABLE_CANONICAL_OWNER_STATE' };
}

// Call only after the canonical Funding `ranked()` evaluation, with owner state.
// The producer must supply that context; the public static seed is never enough.
export function projectFunding(evaluations = [], { ownerStateAvailable = false } = {}) {
  if (!ownerStateAvailable) return [];
  const seen = new Set();
  return evaluations.filter(e => {
    if (!e.fresh || !['APPLY','CONSULT'].includes(e.disposition) ||
      !['CANDIDATE','POSSIBLE_FIT','NEEDS_FACT','VERIFIED_FIT','READY_TO_APPLY'].includes(e.action.status) || seen.has(e.item.id)) return false;
    seen.add(e.item.id); return true;
  }).map(e => ({ id:e.item.id, program:label(e.item.name), provider:label(e.item.funder),
    value_label:label(e.item.value), disposition:e.disposition,
    reason:label(e.reason), deadline:e.action_deadline || null, last_verified_at:e.item.last_verified_at,
    canonical_url:`${ORIGIN}/workspace/funding/?opportunity=${encodeURIComponent(e.item.id)}`
  }));
}
