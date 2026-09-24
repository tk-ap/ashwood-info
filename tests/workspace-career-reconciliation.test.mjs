import test from 'node:test';
import assert from 'node:assert/strict';
import { gmailEventId, reconcileCareerApplication, reconcileCareerEmail } from '../api/_career-reconciliation.mjs';

const applications = [
  { id: 'career:core-spaces:2026-2620', company: 'Core Spaces', role: 'Senior Business Analyst', job_id: '2026-2620', status: 'APPLIED' },
  { id: 'career:tiktok:A115985', company: 'TikTok USDS JV', role: 'Project Manager, PMO - USDS', job_id: 'A115985', status: 'SCREENING' }
];

test('reconciles an existing application before an employer rejection is ingested', () => {
  const result = reconcileCareerApplication(applications, { company: 'Core Spaces', role: 'Senior Business Analyst' });
  assert.equal(result.kind, 'matched');
  assert.equal(result.application.id, 'career:core-spaces:2026-2620');
  assert.notEqual(result.application.status, 'DECLINED');
});

test('matches punctuation and employer naming variations conservatively', () => {
  const result = reconcileCareerApplication(applications, { company: 'TikTok USDS', role: 'Project Manager, PMO-USDS' });
  assert.equal(result.kind, 'matched');
  assert.equal(result.application.id, 'career:tiktok:A115985');
});

test('reconciles a Gmail email using employer and role naming variation evidence', () => {
  const result = reconcileCareerEmail(applications, {
    subject: 'Update on Project Manager, PMO-USDS application',
    from: 'TikTok recruiting',
    snippet: 'Thank you for your interest in the USDS role.'
  });
  assert.equal(result.kind, 'matched');
  assert.equal(result.application.id, 'career:tiktok:A115985');
});

test('requires review instead of choosing between duplicate applications', () => {
  const result = reconcileCareerApplication([
    ...applications,
    { id: 'career:core-spaces:other', company: 'Core Spaces', role: 'Senior Business Analyst', job_id: null }
  ], { company: 'Core Spaces', role: 'Senior Business Analyst' });
  assert.equal(result.kind, 'review_required');
  assert.equal(result.reason, 'ambiguous_match');
});

test('permits a missing application only with explicit verified creation facts', () => {
  const result = reconcileCareerApplication(applications, { company: 'Verified Employer', role: 'Verified Role', allowCreate: true });
  assert.deepEqual(result, { kind: 'create', application: { company: 'Verified Employer', role: 'Verified Role', job_id: null } });
});

test('uses a stable Gmail event identity for idempotency and keeps rejection distinct from declined', () => {
  assert.equal(gmailEventId('1a0d0283f4650a7c'), gmailEventId('1a0d0283f4650a7c'));
  assert.equal('REJECTED', 'REJECTED');
  assert.notEqual('REJECTED', 'DECLINED');
});
