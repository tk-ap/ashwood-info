import test from 'node:test';
import assert from 'node:assert/strict';
import { isUsCompatible, locationPreference, rankOpportunities, resumeRecommendation, rotateOpportunities, scoreOpportunity, stripHtml, workArrangementPreference } from '../api/_career-opportunities.mjs';

test('stripHtml creates a compact readable summary', () => {
  assert.equal(stripHtml('<p>Risk &amp; controls</p><ul><li>PMO</li></ul>'), 'Risk & controls PMO');
});

test('US-compatible remote locations pass while Europe-only roles do not', () => {
  assert.equal(isUsCompatible('USA Only'), true);
  assert.equal(isUsCompatible('Worldwide'), true);
  assert.equal(isUsCompatible('Europe'), false);
});

test('relevant business execution roles outrank unrelated engineering roles', () => {
  const relevant = scoreOpportunity({
    title:'Senior Operational Risk Program Manager',
    candidate_required_location:'USA',
    publication_date:new Date().toISOString(),
    description:'Own controls, governance, cross-functional process improvement and compliance.'
  });
  const irrelevant = scoreOpportunity({
    title:'Senior Software Engineer',
    candidate_required_location:'USA',
    publication_date:new Date().toISOString(),
    description:'Build backend services.'
  });
  assert.ok(relevant.score > 20);
  assert.equal(irrelevant.score, -100);
});

test('rankOpportunities excludes already tracked postings', () => {
  const jobs = [
    { id:1, url:'https://example.com/a', title:'Business Analyst', company_name:'A Co', candidate_required_location:'USA', publication_date:new Date().toISOString(), description:'Business analysis and process improvement.' },
    { id:2, url:'https://example.com/b', title:'Compliance Program Manager', company_name:'B Co', candidate_required_location:'USA', publication_date:new Date().toISOString(), description:'Compliance governance and controls.' }
  ];
  const ranked = rankOpportunities(jobs, [{ company:'A Co', role:'Business Analyst', posting_url:'https://example.com/a' }]);
  assert.equal(ranked.length, 1);
  assert.equal(ranked[0].company, 'B Co');
});

test('rotation returns a new page of up to eight opportunities', () => {
  const items = Array.from({ length:20 }, (_, i) => ({ id:String(i) }));
  const first = rotateOpportunities(items, 0, 8);
  const second = rotateOpportunities(items, 1, 8);
  assert.equal(first.length, 8);
  assert.equal(second.length, 8);
  assert.notDeepEqual(first.map(x => x.id), second.map(x => x.id));
});


test('body keywords cannot promote a title outside the target lanes', () => {
  const unrelated = scoreOpportunity({
    title:'Executive Assistant',
    candidate_required_location:'USA',
    publication_date:new Date().toISOString(),
    description:'Own governance, controls, business analysis, PMO, finance and process improvement.'
  });
  assert.equal(unrelated.score, -100);
  assert.equal(unrelated.gate, 'title_outside_target_lanes');
});

test('transferable product roles pass unless technical requirements dominate', () => {
  const businessProduct = scoreOpportunity({
    title:'Product Operations Manager',
    candidate_required_location:'USA',
    publication_date:new Date().toISOString(),
    description:'Own cross-functional workflows, business process improvement, stakeholder management and operational planning.'
  });
  const technicalProduct = scoreOpportunity({
    title:'Product Manager',
    candidate_required_location:'USA',
    publication_date:new Date().toISOString(),
    description:'5 years Python required. Degree in computer science required. Own developer platform APIs.'
  });
  assert.ok(businessProduct.score >= 8);
  assert.equal(technicalProduct.score, -100);
});


test('resume recommendation selects a lane without rewriting factual history', () => {
  const risk = resumeRecommendation({
    title:'Operational Risk Manager',
    description:'Own governance, controls, audit and resiliency.'
  }, ['operational risk', 'governance / controls']);
  assert.equal(risk.variant, 'Risk, Controls & Governance');
  assert.match(risk.summary, /regulated financial services/i);
  assert.match(risk.guardrail, /do not invent experience/i);

  const strategy = resumeRecommendation({
    title:'AI Strategy Consultant',
    description:'Lead strategy, stakeholder discovery and operating transformation.'
  }, ['strategy', 'stakeholder management']);
  assert.equal(strategy.variant, 'Strategy, Product & Operations');
});

test('ranked opportunities carry a suggested resume version', () => {
  const ranked = rankOpportunities([{
    id:9,
    url:'https://example.com/risk',
    title:'Senior Operational Risk Manager',
    company_name:'Risk Co',
    candidate_required_location:'USA',
    publication_date:new Date().toISOString(),
    description:'Own controls, governance, audit, resiliency and cross-functional process improvement.'
  }], []);
  assert.equal(ranked.length, 1);
  assert.equal(ranked[0].resume_recommendation.variant, 'Risk, Controls & Governance');
});


test('ranked opportunities preserve source identity and dedupe the same role across feeds', () => {
  const now = new Date().toISOString();
  const jobs = [
    {
      id:101,
      url:'https://jobicy.com/jobs/example-business-analyst',
      title:'Senior Business Analyst',
      company_name:'Example Co',
      candidate_required_location:'USA',
      publication_date:now,
      description:'Business analysis, stakeholder management, controls and process improvement.',
      source_name:'Jobicy',
      source_url:'https://jobicy.com/jobs/example-business-analyst'
    },
    {
      id:202,
      url:'https://remotive.com/remote-jobs/example-business-analyst',
      title:'Senior Business Analyst',
      company_name:'Example Co',
      candidate_required_location:'USA',
      publication_date:now,
      description:'Business analysis, stakeholder management, controls and process improvement.',
      source_name:'Remotive',
      source_url:'https://remotive.com/remote-jobs/example-business-analyst'
    }
  ];
  const ranked = rankOpportunities(jobs, []);
  assert.equal(ranked.length, 1);
  assert.equal(ranked[0].source, 'Jobicy');
  assert.equal(ranked[0].source_url, jobs[0].url);
});


test('walkable central DTLA receives a stronger location preference than general Los Angeles', () => {
  for (const location of [
    'Financial District, Los Angeles, CA 90071',
    'Jewelry District, Downtown Los Angeles',
    'Fashion District, Los Angeles',
    'South Park, Los Angeles, CA 90015',
    'Historic Core, Los Angeles, CA 90014',
    'Bunker Hill, Los Angeles',
    'Downtown Los Angeles, CA 90017'
  ]) {
    assert.deepEqual(locationPreference(location), {
      points:6,
      label:'walkable DTLA',
      tier:'walkable-dtla'
    });
  }
  assert.deepEqual(locationPreference('Los Angeles, CA'), {
    points:3,
    label:'Los Angeles',
    tier:'los-angeles'
  });
  assert.equal(locationPreference('USA').points, 0);
});

test('remote ranks ahead of hybrid, and hybrid ahead of onsite even when onsite is walkable', () => {
  const now = new Date().toISOString();
  const base = {
    title:'Senior Business Analyst',
    publication_date:now,
    description:'Business analysis, controls, stakeholder management, financial services and process improvement.'
  };
  const ranked = rankOpportunities([
    {
      ...base,
      id:'onsite',
      url:'https://example.com/onsite',
      company_name:'Onsite Co',
      candidate_required_location:'Financial District, Los Angeles, CA 90071',
      description:base.description + ' On-site five days per week.'
    },
    {
      ...base,
      id:'hybrid',
      url:'https://example.com/hybrid',
      company_name:'Hybrid Co',
      candidate_required_location:'Downtown Los Angeles, CA 90017',
      description:base.description + ' Hybrid schedule with three days in office and two days remote.'
    },
    {
      ...base,
      id:'remote',
      url:'https://example.com/remote',
      company_name:'Remote Co',
      candidate_required_location:'USA',
      description:base.description + ' Fully remote.'
    }
  ], []);
  assert.deepEqual(ranked.map(item => item.company), ['Remote Co','Hybrid Co','Onsite Co']);
  assert.equal(ranked[0].work_arrangement_preference, 'remote');
  assert.equal(ranked[1].work_arrangement_preference, 'hybrid');
  assert.equal(ranked[2].work_arrangement_preference, 'onsite');
});

test('onsite roles are hidden unless core fit is unusually strong', () => {
  const weakOnsite = scoreOpportunity({
    title:'Change Management Manager',
    candidate_required_location:'Downtown Los Angeles, CA',
    publication_date:new Date().toISOString(),
    description:'On-site five days per week. Change management and stakeholder coordination.'
  });
  assert.equal(weakOnsite.score, -100);
  assert.equal(weakOnsite.gate, 'onsite_requires_great_fit');

  const strongOnsite = scoreOpportunity({
    title:'Senior Operational Risk Program Manager',
    candidate_required_location:'Financial District, Los Angeles, CA 90071',
    publication_date:new Date().toISOString(),
    description:'On-site five days per week. Own operational risk, controls, governance, compliance, process improvement and cross-functional stakeholder management.'
  });
  assert.ok(strongOnsite.score > 0);
  assert.equal(strongOnsite.gate, 'qualified');
  assert.equal(strongOnsite.work_arrangement_preference, 'onsite');
});

test('work arrangement classifier recognizes remote and hybrid evidence', () => {
  assert.equal(workArrangementPreference({
    source_name:'Remotive',
    candidate_required_location:'USA',
    description:'Business analysis role.'
  }).tier, 'remote');
  assert.equal(workArrangementPreference({
    candidate_required_location:'Los Angeles, CA',
    description:'Hybrid schedule with three days in office and two days remote.'
  }).tier, 'hybrid');
});
