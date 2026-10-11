import test from 'node:test';
import assert from 'node:assert/strict';
import { needsAttention, normaliseStatus, salaryLabel, sortApplications, summaryCounts } from '../workspace/career-ops/model.mjs';
import { isApplicationDestinationUrl } from '../api/_career-opportunities.mjs';
import { applicationPersistenceContext, matchesEmployerVerification, requiresEmployerVerification } from '../api/_career-ops-handler.mjs';

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
    { id:'f', status:'TARGET' },
    { id:'g', status:'ASSUMED_REJECTED' }
  ], [
    { application_id:'d', event_type:'INTERVIEW', payload:{} },
    { application_id:'c', event_type:'INTERVIEW', payload:{ relevance:'ignored' } }
  ]);
  // Rejected applications were submitted; an interview before rejection still converted.
  assert.deepEqual(counts, { submitted:5, denied:3, noResponse:1, interviews:2 });
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
  assert.deepEqual(counts, { submitted:3, denied:0, noResponse:2, interviews:0 });
});

test('sortApplications prioritizes interviews and recruiter activity', () => {
  const rows = sortApplications([
    { id:'a', status:'APPLIED' },
    { id:'b', status:'INTERVIEW' },
    { id:'c', status:'RECRUITER' }
  ]);
  assert.deepEqual(rows.map(row => row.id), ['b','c','a']);
});

test('the canonical application API refuses job-board URLs as apply destinations', () => {
  assert.equal(isApplicationDestinationUrl('https://jobicy.com/jobs/example'), false);
  assert.equal(isApplicationDestinationUrl('https://www.linkedin.com/jobs/view/123'), false);
  assert.equal(isApplicationDestinationUrl('not a URL'), false);
  assert.equal(isApplicationDestinationUrl('https://jobs.example.co/openings/123'), true);
});

test('a discovered role can be tracked only with its current verified employer listing', () => {
  const discoveredRole = {
    source:'jobicy',
    job_id:'job-123',
    posting_snapshot:{ source_url:'https://jobicy.com/jobs/job-123' }
  };
  assert.equal(requiresEmployerVerification(discoveredRole), true);
  assert.equal(matchesEmployerVerification('https://jobs.example.co/openings/123', {
    status:'VERIFIED',
    verified_at:'2026-10-10T12:00:00.000Z',
    employer_url:'https://jobs.example.co/openings/123'
  }), true);
  assert.equal(matchesEmployerVerification('https://jobs.example.co/openings/other', {
    status:'VERIFIED',
    verified_at:'2026-10-10T12:00:00.000Z',
    employer_url:'https://jobs.example.co/openings/123'
  }), false);
  assert.equal(requiresEmployerVerification({ source:'workspace', job_id:'', posting_snapshot:{} }), false);
});

test('editing a tracked discovery keeps its verification source and snapshot', () => {
  const context = applicationPersistenceContext({
    source:'workspace',
    job_id:'job-123',
    posting_snapshot:{ summary:'Updated note' }
  }, {
    source:'jobicy',
    job_id:'job-123',
    posting_snapshot:{
      source_url:'https://jobicy.com/jobs/job-123',
      employer_url:'https://jobs.example.co/openings/123',
      employer_listing_verified_at:'2026-10-10T12:00:00.000Z'
    }
  });
  assert.equal(context.source, 'jobicy');
  assert.equal(context.jobId, 'job-123');
  assert.equal(context.postingSnapshot.source_url, 'https://jobicy.com/jobs/job-123');
  assert.equal(context.postingSnapshot.employer_url, 'https://jobs.example.co/openings/123');
  assert.equal(context.postingSnapshot.summary, 'Updated note');
});
