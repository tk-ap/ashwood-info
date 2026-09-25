const TITLE_RULES = [
  [/operational risk|risk control|risk management/i, 14, 'operational risk'],
  [/business analyst/i, 13, 'business analysis'],
  [/program manager|program management/i, 12, 'program management'],
  [/project manager|project management|\bpmo\b/i, 11, 'project / PMO'],
  [/compliance|regulatory/i, 10, 'compliance'],
  [/business operations|operations manager|operations program/i, 10, 'operations'],
  [/controls?|governance/i, 9, 'controls / governance'],
  [/vendor management|third[- ]party/i, 9, 'vendor management'],
  [/process improvement|business process|operational excellence/i, 9, 'process improvement'],
  [/business continuity|resilien(?:ce|cy)|disaster recovery/i, 9, 'resiliency'],
  [/strategy|strategic operations|special projects/i, 8, 'strategy'],
  [/financial analyst|finance operations|financial operations/i, 8, 'finance'],
  [/fraud|audit/i, 7, 'risk / audit'],
  [/implementation manager|change management/i, 6, 'implementation / change']
];

const BODY_RULES = [
  [/operational risk|risk controls?|control environment/i, 4, 'operational risk'],
  [/business analysis|business analyst|requirements gathering/i, 4, 'business analysis'],
  [/program management|project management|\bpmo\b/i, 4, 'program / project'],
  [/compliance|regulatory|regulator/i, 3, 'compliance'],
  [/process improvement|process optimization|continuous improvement/i, 3, 'process improvement'],
  [/stakeholder management|cross[- ]functional/i, 2, 'stakeholder management'],
  [/governance|controls?|audit/i, 3, 'governance / controls'],
  [/financial services|banking|finance/i, 2, 'financial services'],
  [/vendor management|third[- ]party/i, 3, 'vendor management'],
  [/business continuity|resilien(?:ce|cy)|disaster recovery/i, 3, 'resiliency'],
  [/automation|workflow/i, 2, 'workflow automation']
];

const NEGATIVE_TITLE = /software engineer|software developer|frontend|front[- ]end|backend|back[- ]end|full[- ]stack|data scientist|machine learning engineer|developer|devops|site reliability|solutions architect|cloud architect|security engineer|data engineer|engineering manager|technical lead|account executive|sales representative|nurse|physician|therapist|designer|copywriter|recruiter/i;
const TARGET_TITLE = /operational risk|risk (?:control|management|analyst)|business analyst|program manager|program management|project manager|project management|\bpmo\b|compliance|regulatory|business operations|operations (?:manager|program|analyst)|controls?|governance|vendor management|third[- ]party|process improvement|business process|operational excellence|business continuity|resilien(?:ce|cy)|strategy|strategic operations|special projects|financial analyst|finance operations|financial operations|fraud|audit|implementation manager|change management/i;
const TECHNICAL_REQUIREMENT = /(?:bachelor'?s|degree|experience).{0,45}(?:computer science|software engineering)|\b(?:python|java|javascript|typescript|c\+\+|kubernetes|terraform|aws|azure|gcp)\b.{0,35}(?:required|must have|years?)/i;

function qualificationGate(job={}) {
  const title = String(job.title || '');
  const body = stripHtml(job.description || '');
  if (!TARGET_TITLE.test(title)) return { pass:false, reason:'title_outside_target_lanes' };
  if (NEGATIVE_TITLE.test(title)) return { pass:false, reason:'technical_or_unrelated_title' };
  if (TECHNICAL_REQUIREMENT.test(body) && !/business analyst|business operations|operational risk|compliance|governance|controls?|finance|audit/i.test(title)) {
    return { pass:false, reason:'technical_requirements' };
  }
  return { pass:true, reason:'target_lane' };
}
const US_COMPATIBLE = /worldwide|anywhere|united states|\busa\b|u\.s\.|north america|northern america|americas|us time|pst|est|cst|mst/i;
const CLEARLY_NON_US = /europe|emea|united kingdom|\buk\b|germany|france|spain|italy|poland|portugal|netherlands|sweden|norway|denmark|finland|india|philippines|australia|new zealand|latam|latin america|canada only/i;

export function stripHtml(value='') {
  return String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function isUsCompatible(location='') {
  const value = String(location || '').trim();
  if (!value) return true;
  if (US_COMPATIBLE.test(value)) return true;
  return !CLEARLY_NON_US.test(value);
}

export function scoreOpportunity(job={}, now=Date.now()) {
  const title = String(job.title || '');
  const body = stripHtml(job.description || '');
  const gate = qualificationGate(job);
  if (!title || !gate.pass) return { score:-100, matches:[], gate:gate.reason };
  if (!isUsCompatible(job.candidate_required_location)) return { score:-100, matches:[], gate:'location' };

  let score = 0;
  const matches = [];
  TITLE_RULES.forEach(([pattern, points, label]) => {
    if (pattern.test(title)) { score += points; matches.push(label); }
  });
  BODY_RULES.forEach(([pattern, points, label]) => {
    if (pattern.test(body)) { score += points; matches.push(label); }
  });

  if (/senior|lead|manager|principal/i.test(title)) score += 2;
  if (/director|vice president|\bvp\b|chief/i.test(title)) score -= 2;

  const published = new Date(job.publication_date || 0).getTime();
  if (Number.isFinite(published) && published > 0) {
    const ageDays = Math.max(0, Math.floor((now - published) / 86400000));
    if (ageDays <= 3) score += 4;
    else if (ageDays <= 7) score += 3;
    else if (ageDays <= 14) score += 1;
    else if (ageDays > 45) score -= 4;
  }

  return { score, matches:[...new Set(matches)].slice(0,4), gate:'qualified' };
}

export function rankOpportunities(jobs=[], tracked=[], now=Date.now()) {
  const trackedUrls = new Set(tracked.map(item => String(item.posting_url || '').trim()).filter(Boolean));
  const trackedPairs = new Set(tracked.map(item => `${String(item.company || '').toLowerCase()}::${String(item.role || '').toLowerCase()}`));
  const seen = new Set();

  return jobs.map(job => {
    const { score, matches, gate } = scoreOpportunity(job, now);
    const url = String(job.url || '').trim();
    const pair = `${String(job.company_name || '').toLowerCase()}::${String(job.title || '').toLowerCase()}`;
    const id = String(job.id || url || pair);
    if (seen.has(id) || trackedUrls.has(url) || trackedPairs.has(pair)) return null;
    seen.add(id);
    return {
      id,
      company:String(job.company_name || '').trim(),
      role:String(job.title || '').trim(),
      url,
      location:String(job.candidate_required_location || 'Remote').trim(),
      job_type:String(job.job_type || '').trim(),
      salary:String(job.salary || '').trim(),
      published_at:job.publication_date || null,
      source:'Remotive',
      source_url:url,
      score,
      matches,
      qualification_gate:gate,
      summary:stripHtml(job.description || '').slice(0, 700)
    };
  }).filter(item => item && item.company && item.role && item.url && item.score >= 8)
    .sort((a,b) => b.score - a.score || new Date(b.published_at || 0) - new Date(a.published_at || 0))
    .slice(0, 60);
}

export function rotateOpportunities(items=[], cursor=0, size=8) {
  if (!items.length) return [];
  const count = Math.max(5, Math.min(10, Number(size) || 8));
  const offset = (Math.max(0, Number(cursor) || 0) * count) % items.length;
  const rotated = [...items.slice(offset), ...items.slice(0, offset)];
  return rotated.slice(0, Math.min(count, items.length));
}
