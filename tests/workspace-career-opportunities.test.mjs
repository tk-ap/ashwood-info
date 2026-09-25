import test from 'node:test';
import assert from 'node:assert/strict';
import { isUsCompatible, rankOpportunities, resumeRecommendation, rotateOpportunities, scoreOpportunity, stripHtml } from '../api/_career-opportunities.mjs';

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
