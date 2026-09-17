import test from 'node:test';
import assert from 'node:assert/strict';
import { isUsCompatible, rankOpportunities, rotateOpportunities, scoreOpportunity, stripHtml } from '../api/_career-opportunities.mjs';

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
