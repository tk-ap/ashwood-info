import test from 'node:test';
import assert from 'node:assert/strict';
import { needsAttention, normaliseStatus, salaryLabel, sortApplications, summaryCounts } from '../workspace/career-ops/model.mjs';

test('normaliseStatus falls back safely', () => {
  assert.equal(normaliseStatus('screening'), 'SCREENING');
  assert.equal(normaliseStatus('unknown'), 'TARGET');
});

test('salaryLabel preserves a disclosed range', () => {
  assert.equal(salaryLabel({ salary_min: 90000, salary_max: 95000, salary_currency: 'USD' }), '$90,000–$95,000');
});

test('needsAttention flags stale submitted applications', () => {
  const now = Date.parse('2026-09-17T12:00:00Z');
  assert.equal(needsAttention({ status:'SCREENING', updated_at:'2026-09-08T12:00:00Z' }, now), true);
  assert.equal(needsAttention({ status:'SCREENING', updated_at:'2026-09-16T12:00:00Z' }, now), false);
  assert.equal(needsAttention({ status:'DECLINED', updated_at:'2026-08-01T12:00:00Z' }, now), false);
});

test('summaryCounts derives the funnel from canonical status and history', () => {
  const counts = summaryCounts([
    { id:'a', status:'SCREENING' },
    { id:'b', status:'INTERVIEW' },
    { id:'c', status:'REJECTED' },
    { id:'d', status:'REJECTED' },
    { id:'e', status:'DECLINED' },
    { id:'f', status:'TARGET' }
  ], [
    { application_id:'d', event_type:'INTERVIEW', payload:{} },
    { application_id:'c', event_type:'INTERVIEW', payload:{ relevance:'ignored' } }
  ]);
  // Rejected applications were submitted; an interview before rejection still converted.
  assert.deepEqual(counts, { submitted:4, denied:2, noResponse:0, interviews:2 });
});

test('summaryCounts treats submitted APPLIED records without employer response as no response', () => {
  const counts = summaryCounts([
    { id:'a', status:'APPLIED', submitted_at:'2026-09-20T00:00:00Z' },
    { id:'b', status:'APPLIED', submitted_at:'2026-09-20T00:00:00Z' },
    { id:'c', status:'SCREENING', submitted_at:'2026-09-20T00:00:00Z' }
  ], [
    { application_id:'a', event_type:'CONFIRMATION', payload:{} },
    { application_id:'b', event_type:'RECRUITER', payload:{} }
  ]);
  assert.deepEqual(counts, { submitted:3, denied:0, noResponse:1, interviews:0 });
});

test('sortApplications prioritizes interviews and recruiter activity', () => {
  const rows = sortApplications([
    { id:'a', status:'APPLIED' },
    { id:'b', status:'INTERVIEW' },
    { id:'c', status:'RECRUITER' }
  ]);
  assert.deepEqual(rows.map(row => row.id), ['b','c','a']);
});
