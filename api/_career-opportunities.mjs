const TITLE_RULES = [
  [/analytics consultant|business analytics|analytics manager/i, 13, 'analytics'],
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
  [/analytics|data analysis|business intelligence|data-driven insights/i, 3, 'analytics'],
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
const TARGET_TITLE = /analytics consultant|analytics manager|business analytics|operational risk|risk (?:control|management|analyst)|business analyst|program manager|program management|project manager|project management|\bpmo\b|compliance|regulatory|business operations|operations (?:manager|program|analyst)|controls?|governance|vendor management|third[- ]party|process improvement|business process|operational excellence|business continuity|resilien(?:ce|cy)|strategy|strategic operations|special projects|financial analyst|finance operations|financial operations|fraud|audit|implementation manager|change management|product operations|product strategy|product program|product manager/i;
const TECHNICAL_REQUIREMENT = /(?:bachelor'?s|degree|experience).{0,45}(?:computer science|software engineering)|\b(?:python|java|javascript|typescript|c\+\+|kubernetes|terraform|aws|azure|gcp)\b.{0,35}(?:required|must have|years?)/i;


const REQUIREMENTS_PROFILE = Object.freeze({
  highest_degree:'associate',
  degree_fields:['general studies'],
  minimum_overall_years:10,
  certifications:['securities industry essentials', 'sie', 'certified business resiliency coordinator']
});

const REQUIREMENT_STATUS = new Set(['qualified','needs_review','requirement_mismatch','unknown']);

function normalizedRequirementReview(job={}) {
  const review = job.requirements_review;
  if (!review || !REQUIREMENT_STATUS.has(String(review.status || ''))) return null;
  return {
    status:String(review.status),
    reasons:Array.isArray(review.reasons) ? review.reasons.map(String) : [],
    checks:Array.isArray(review.checks) ? review.checks.map(String) : [],
    confidence:String(review.confidence || (review.status === 'qualified' || review.status === 'requirement_mismatch' ? 'high' : 'medium')),
    source:String(review.source || job.source_url || job.url || '')
  };
}

function requirementSentences(body='') {
  return String(body)
    .split(/(?<=[.!?])\s+|\s*[•●▪]\s*|\n+/)
    .map(value => value.trim())
    .filter(Boolean);
}

export function assessRequirements(job={}) {
  const override = normalizedRequirementReview(job);
  if (override) return override;

  const body = stripHtml(job.description || '');
  if (body.length < 180) {
    return {
      status:'unknown',
      reasons:['insufficient_posting_detail'],
      checks:['Full employer requirements were not available in the ingested posting.'],
      confidence:'low',
      source:String(job.source_url || job.url || '')
    };
  }

  const sentences = requirementSentences(body);
  const checks = [];
  const mismatches = [];
  const review = [];

  const bachelorRequired = sentences.find(value =>
    /(?:required qualifications?|minimum qualifications?|requirements?|must have|minimum).{0,120}\b(?:bachelor(?:'s)?|b\.s\.|bs degree)\b/i.test(value) ||
    /\b(?:bachelor(?:'s)?|b\.s\.|bs degree)\b.{0,120}(?:required|minimum|must)/i.test(value)
  );
  const degreeRequired = sentences.find(value =>
    /\bdegree\b.{0,100}\b(?:engineering|mathematics|computer science|software engineering|finance|accounting)\b.{0,100}(?:required|minimum|must)/i.test(value) ||
    /(?:required qualifications?|minimum qualifications?).{0,120}\b(?:degree|engineering|mathematics|computer science)\b/i.test(value)
  );
  if (bachelorRequired) {
    checks.push('Bachelor’s degree requirement detected.');
    if (REQUIREMENTS_PROFILE.highest_degree !== 'bachelor' && REQUIREMENTS_PROFILE.highest_degree !== 'master' && REQUIREMENTS_PROFILE.highest_degree !== 'doctorate') {
      mismatches.push('education');
    }
  }
  if (degreeRequired && /engineering|mathematics|computer science|software engineering/i.test(degreeRequired)) {
    checks.push('Specific technical degree field requirement detected.');
    mismatches.push('education_field');
  }

  const technicalCertification = sentences.find(value =>
    /\b(?:PMP|CPA|CFA|CISA|CISM|CISSP|Series 7|Series 63|Series 66|professional engineer|PE license)\b.{0,80}(?:required|must|minimum)/i.test(value)
  );
  if (technicalCertification) {
    const required = (technicalCertification.match(/\b(PMP|CPA|CFA|CISA|CISM|CISSP|Series 7|Series 63|Series 66|professional engineer|PE license)\b/i) || [])[1] || '';
    checks.push(`Required certification/license detected: ${required || 'specialized credential'}.`);
    if (required && !REQUIREMENTS_PROFILE.certifications.some(value => value.toLowerCase().includes(required.toLowerCase()))) mismatches.push('certification');
  }

  const engineeredSystems = sentences.find(value =>
    /\b(?:\d{1,2}\+?\s*years?.{0,100})?(?:engineered systems|engineering development|electronic hardware|software development|engineering program)\b/i.test(value) &&
    /(?:required qualifications?|minimum|must|years? of experience)/i.test(value)
  );
  if (engineeredSystems) {
    checks.push('Specialized engineering/engineered-systems experience requirement detected.');
    review.push('specialized_domain_experience');
  }

  const yearMatches = [...body.matchAll(/\b(?:minimum\s+of\s+|minimum\s+)?(\d{1,2})\+?\s+years?\s+(?:of\s+)?experience\b/gi)]
    .map(match => Number(match[1]))
    .filter(Number.isFinite);
  if (yearMatches.length) {
    const maxYears = Math.max(...yearMatches);
    checks.push(`Minimum experience requirement detected: up to ${maxYears} years.`);
    if (maxYears > REQUIREMENTS_PROFILE.minimum_overall_years) review.push('experience_years');
  }

  if (/\b(?:security clearance|secret clearance|top secret|ts\/sci|u\.s\. citizen|us citizen|citizenship required)\b/i.test(body)) {
    checks.push('Citizenship or security-clearance requirement detected.');
    review.push('citizenship_or_clearance');
  }
  if (/\b(?:travel required|travel up to|up to \d{1,3}% travel|\d{1,3}% travel)\b/i.test(body)) {
    checks.push('Travel requirement detected.');
    review.push('travel');
  }
  if (/\b(?:legally authorized to work|work authorization|visa sponsorship|sponsorship is not available|no sponsorship)\b/i.test(body)) {
    checks.push('Work-authorization or sponsorship condition detected.');
    review.push('work_authorization');
  }

  if (mismatches.length) {
    return {
      status:'requirement_mismatch',
      reasons:[...new Set(mismatches)],
      checks,
      confidence:'high',
      source:String(job.source_url || job.url || '')
    };
  }
  if (review.length) {
    return {
      status:'needs_review',
      reasons:[...new Set(review)],
      checks,
      confidence:'medium',
      source:String(job.source_url || job.url || '')
    };
  }
  return {
    status:'qualified',
    reasons:[],
    checks:checks.length ? checks : ['No conflicting hard requirement was detected in the available posting text.'],
    confidence:body.length >= 500 ? 'medium' : 'low',
    source:String(job.source_url || job.url || '')
  };
}

function qualificationGate(job={}, requirements=assessRequirements(job)) {
  const title = String(job.title || '');
  const body = stripHtml(job.description || '');
  if (!TARGET_TITLE.test(title)) return { pass:false, reason:'title_outside_target_lanes' };
  if (NEGATIVE_TITLE.test(title)) return { pass:false, reason:'technical_or_unrelated_title' };
  if (requirements.status === 'requirement_mismatch') {
    return { pass:false, reason:`requirement_mismatch:${requirements.reasons[0] || 'hard_requirement'}` };
  }
  if (TECHNICAL_REQUIREMENT.test(body) && !/business analyst|business operations|operational risk|compliance|governance|controls?|finance|audit/i.test(title)) {
    return { pass:false, reason:'technical_requirements' };
  }
  return { pass:true, reason:requirements.status === 'qualified' ? 'qualified' : requirements.status };
}
const US_COMPATIBLE = /worldwide|anywhere|united states|\busa\b|u\.s\.|north america|northern america|americas|us time|pst|est|cst|mst/i;
const CLEARLY_NON_US = /europe|emea|united kingdom|\buk\b|germany|france|spain|italy|poland|portugal|netherlands|sweden|norway|denmark|finland|india|philippines|australia|new zealand|latam|latin america|canada only/i;

const DTLA_WALKABLE = /financial district|jewelry district|fashion district|historic core|south park(?:,? los angeles)?|bunker hill|broadway(?: district)?|civic center|downtown los angeles|\bdtla\b|\b90014\b|\b90015\b|\b90017\b|\b90071\b/i;
const LA_METRO = /los angeles|\b900\d{2}\b/i;

export function locationPreference(location='') {
  const value = String(location || '').trim();
  if (!value) return { points:0, label:null, tier:'unknown' };
  if (DTLA_WALKABLE.test(value)) return { points:6, label:'walkable DTLA', tier:'walkable-dtla' };
  if (LA_METRO.test(value)) return { points:3, label:'Los Angeles', tier:'los-angeles' };
  return { points:0, label:null, tier:'other' };
}

export function workArrangementPreference(job={}) {
  const location = String(job.candidate_required_location || '');
  const body = stripHtml(job.description || '');
  const explicit = [
    job.work_arrangement,
    job.workplace_type,
    job.remote,
    job.job_type
  ].filter(value => value !== undefined && value !== null).join(' ');
  const source = String(job.source_name || job.source || '');
  const evidence = `${location} ${explicit} ${body}`;

  if (/\bhybrid\b|hybrid[- ]remote|remote.{0,20}(?:days?|week).{0,20}(?:office|onsite|on-site)|(?:office|onsite|on-site).{0,20}(?:days?|week).{0,20}remote/i.test(evidence)) {
    return { tier:'hybrid', rank:1, points:4, label:'hybrid' };
  }
  if (/\bremote\b|work from home|work-from-home|distributed team|fully distributed/i.test(evidence) || /remotive/i.test(source)) {
    return { tier:'remote', rank:0, points:8, label:'remote' };
  }
  if (/on[- ]?site|onsite|in[- ]office|office[- ]based|five days? (?:a|per) week|5 days? (?:a|per) week/i.test(evidence)) {
    return { tier:'onsite', rank:3, points:0, label:'on-site' };
  }
  if (DTLA_WALKABLE.test(location) || LA_METRO.test(location)) {
    return { tier:'onsite', rank:3, points:0, label:'on-site' };
  }
  return { tier:'unknown', rank:2, points:0, label:null };
}

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


export function resumeRecommendation(job={}, matches=[]) {
  const title = String(job.title || '');
  const body = stripHtml(job.description || '');
  const evidence = `${title} ${body} ${matches.join(' ')}`;

  let variant = 'Business Analysis & Operations';
  let summary = 'Business analysis and operations professional with experience improving workflows, controls, operating processes, and cross-functional execution in regulated and service environments.';
  let emphasis = [
    'Lead with Wells Fargo workflow analysis, recurring control reporting, process optimization, and automation-opportunity work.',
    'Keep JPMorgan process-change, audit-remediation, operational analysis, and senior-stakeholder execution prominent.',
    'Use Kasa to show operating ownership, budgeting, vendor coordination, and performance improvement.'
  ];

  if (/analytics consultant|business analytics|analytics manager/i.test(title)) {
    variant = 'Analytics & Business Operations';
    summary = 'Analytics and business-operations professional with experience turning operational data, controls evidence, workflow performance, and stakeholder needs into clear decisions and process improvements.';
    emphasis = [
      'Lead with the Wells Fargo Analytics Consultant promotion, 20+ recurring control reports, exception investigation, data validation, and executive reporting.',
      'Keep JPMorgan business-process analysis, service-level analysis, reporting, and process-improvement evidence prominent.',
      'Use Charles Schwab when financial-services fluency, client discovery, or regulated-product knowledge is relevant.'
    ];
  } else if (/operational risk|risk control|controls?|governance|compliance|audit|resilien/i.test(evidence)) {
    variant = 'Risk, Controls & Governance';
    summary = 'Business execution and controls professional with experience in regulated financial services, operational risk, control design, business resiliency, process improvement, and cross-functional execution.';
    emphasis = [
      'Lead with Wells Fargo control design, 20+ recurring control reports, workflow/SLA alignment, and business-resiliency coordination.',
      'Move JPMorgan audit findings, corrective-action ownership, risk/control partnership, and process-change work directly behind it.',
      'Keep automation and process-improvement evidence visible; compress unrelated service details.'
    ];
  } else if (/financial analyst|finance operations|financial operations|financial services|banking|portfolio/i.test(evidence)) {
    variant = 'Finance & Business Analysis';
    summary = 'Finance and business-analysis professional with experience across banking, operational analysis, regulated controls, client needs discovery, and process improvement.';
    emphasis = [
      'Lead with Wells Fargo analytical control work, workflow performance, and operational improvement.',
      'Elevate JPMorgan business-process analysis, audit remediation, and change implementation.',
      'Keep Charles Schwab client discovery, financial-product knowledge, and SIE evidence visible when the role values financial-services fluency.'
    ];
  } else if (/program manager|program management|project manager|project management|\bpmo\b|implementation|change management/i.test(evidence)) {
    variant = 'Program, Project & Change';
    summary = 'Cross-functional program and business-operations professional with experience coordinating regulated initiatives, process changes, resiliency work, stakeholder alignment, and operational execution.';
    emphasis = [
      'Lead with Wells Fargo resiliency plans, cross-functional exercises, control execution, and workflow improvement.',
      'Elevate JPMorgan multi-level project and product-launch process changes plus senior-leader buy-in.',
      'Use Kasa vendor and operations coordination as additional execution evidence; reduce purely service-oriented detail.'
    ];
  } else if (/product operations|product strategy|product manager|strategy|special projects|ai strategy|consult/i.test(evidence)) {
    variant = 'Strategy, Product & Operations';
    summary = 'Strategy and operations professional focused on diagnosing complex workflows, translating business needs into practical improvements, and coordinating cross-functional execution across regulated and operating environments.';
    emphasis = [
      'Lead with Wells Fargo automation-opportunity identification, workflow/control analysis, and cross-functional resiliency work.',
      'Elevate JPMorgan process-change implementation, operational problem solving, and senior-stakeholder communication.',
      'For product or AI-strategy roles, add a compact current-projects line only when it is directly relevant; do not present product building as software-engineering experience.'
    ];
  }

  return {
    variant,
    summary,
    emphasis,
    keywords:[...new Set(matches.map(String).filter(Boolean))].slice(0,4),
    guardrail:'Keep employers, dates, titles, and factual accomplishments unchanged. Tailor emphasis and wording; do not invent experience.'
  };
}

export function scoreOpportunity(job={}, now=Date.now()) {
  const title = String(job.title || '');
  const body = stripHtml(job.description || '');
  const requirements = assessRequirements(job);
  const gate = qualificationGate(job, requirements);
  if (!title || !gate.pass) return { score:-100, matches:[], gate:gate.reason, requirements };
  if (!isUsCompatible(job.candidate_required_location)) return { score:-100, matches:[], gate:'location', requirements };

  let fitScore = job.curated && requirements.status === 'qualified' ? 8 : 0;
  const matches = [];
  if (job.curated) matches.push('curated');
  if (requirements.status === 'needs_review') fitScore -= 4;
  if (requirements.status === 'unknown') fitScore -= 7;
  TITLE_RULES.forEach(([pattern, points, label]) => {
    if (pattern.test(title)) { fitScore += points; matches.push(label); }
  });
  BODY_RULES.forEach(([pattern, points, label]) => {
    if (pattern.test(body)) { fitScore += points; matches.push(label); }
  });

  if (/senior|lead|manager|principal/i.test(title)) fitScore += 2;
  if (/director|vice president|\bvp\b|chief/i.test(title)) fitScore -= 2;

  const published = new Date(job.publication_date || 0).getTime();
  if (Number.isFinite(published) && published > 0) {
    const ageDays = Math.max(0, Math.floor((now - published) / 86400000));
    if (ageDays <= 3) fitScore += 4;
    else if (ageDays <= 7) fitScore += 3;
    else if (ageDays <= 14) fitScore += 1;
    else if (ageDays > 45) fitScore -= 4;
  }

  const arrangement = workArrangementPreference(job);
  if (arrangement.tier === 'onsite' && fitScore < 22) {
    return {
      score:-100,
      fit_score:fitScore,
      matches:[...new Set(matches)].slice(0,4),
      gate:'onsite_requires_great_fit',
      work_arrangement_preference:arrangement.tier,
      work_arrangement_rank:arrangement.rank,
      requirements
    };
  }

  const locationPref = locationPreference(job.candidate_required_location);
  const score = fitScore + arrangement.points + locationPref.points;
  if (arrangement.label) matches.push(arrangement.label);
  if (locationPref.label) matches.push(locationPref.label);

  return {
    score,
    fit_score:fitScore,
    matches:[...new Set(matches)].slice(0,4),
    gate:gate.reason,
    location_preference:locationPref.tier,
    work_arrangement_preference:arrangement.tier,
    work_arrangement_rank:arrangement.rank,
    requirements
  };
}

export function rankOpportunities(jobs=[], tracked=[], now=Date.now()) {
  const trackedUrls = new Set(tracked.map(item => String(item.posting_url || '').trim()).filter(Boolean));
  const trackedPairs = new Set(tracked.map(item => `${String(item.company || '').toLowerCase()}::${String(item.role || '').toLowerCase()}`));
  const seen = new Set();
  const seenPairs = new Set();

  return jobs.map(job => {
    const { score, fit_score, matches, gate, location_preference, work_arrangement_preference, work_arrangement_rank, requirements } = scoreOpportunity(job, now);
    if (score < 8) return null;
    const url = String(job.url || '').trim();
    const pair = `${String(job.company_name || '').toLowerCase()}::${String(job.title || '').toLowerCase()}`;
    const source = String(job.source_name || job.source || 'Remotive').trim() || 'Remotive';
    const sourceKey = source.toLowerCase().replace(/\s+/g,'-');
    const id = String(job.id || url || pair);
    const seenKey = `${sourceKey}::${id}`;
    if (seen.has(seenKey) || seenPairs.has(pair) || trackedUrls.has(url) || trackedPairs.has(pair)) return null;
    seen.add(seenKey);
    seenPairs.add(pair);
    return {
      id,
      company:String(job.company_name || '').trim(),
      role:String(job.title || '').trim(),
      url,
      location:String(job.candidate_required_location || 'Remote').trim(),
      job_type:String(job.job_type || '').trim(),
      salary:String(job.salary || '').trim(),
      published_at:job.publication_date || null,
      source,
      source_url:String(job.source_url || url).trim() || url,
      score,
      fit_score:fit_score ?? score,
      matches,
      qualification_gate:gate,
      requirements_status:requirements?.status || 'unknown',
      requirements_reasons:requirements?.reasons || [],
      requirements_checked:requirements?.checks || [],
      requirements_confidence:requirements?.confidence || 'low',
      requirements_source:requirements?.source || String(job.source_url || job.url || ''),
      why_this_is_here:[...new Set(matches.filter(value => value !== 'curated'))].slice(0,3),
      location_preference:location_preference || 'other',
      work_arrangement_preference:work_arrangement_preference || 'unknown',
      work_arrangement_rank:Number.isFinite(work_arrangement_rank) ? work_arrangement_rank : 2,
      summary:stripHtml(job.description || '').slice(0, 700),
      resume_recommendation:resumeRecommendation(job, matches)
    };
  }).filter(item => item && item.company && item.role && item.url && item.score >= 8)
    .sort((a,b) => a.work_arrangement_rank - b.work_arrangement_rank || b.score - a.score || new Date(b.published_at || 0) - new Date(a.published_at || 0))
    .slice(0, 60);
}

export function rotateOpportunities(items=[], cursor=0, size=8) {
  if (!items.length) return [];
  const count = Math.max(5, Math.min(10, Number(size) || 8));
  const offset = (Math.max(0, Number(cursor) || 0) * count) % items.length;
  const rotated = [...items.slice(offset), ...items.slice(0, offset)];
  return rotated.slice(0, Math.min(count, items.length));
}
