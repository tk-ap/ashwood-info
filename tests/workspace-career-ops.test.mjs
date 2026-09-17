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

test('summaryCounts separates active pipeline and conversations', () => {
  const now = Date.parse('2026-09-17T12:00:00Z');
  const counts = summaryCounts([
    { status:'SCREENING', updated_at:'2026-09-16T12:00:00Z' },
    { status:'INTERVIEW', updated_at:'2026-09-16T12:00:00Z' },
    { status:'DECLINED', updated_at:'2026-09-16T12:00:00Z' }
  ], now);
  assert.deepEqual(counts, { active:2, submitted:1, conversations:1, needsAction:0 });
});

test('sortApplications prioritizes interviews and recruiter activity', () => {
  const rows = sortApplications([
    { id:'a', status:'APPLIED' },
    { id:'b', status:'INTERVIEW' },
    { id:'c', status:'RECRUITER' }
  ]);
  assert.deepEqual(rows.map(row => row.id), ['b','c','a']);
});
