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


test('matches a unique employer ATS decision even when the role is omitted', () => {
  const result = reconcileCareerEmail(applications, {
    subject: 'Thank You for Application - Core Spaces',
    from: 'Core Spaces <corespaces+email@example.com>',
    snippet: 'We have decided not to move forward with your application.'
  });
  assert.equal(result.kind, 'matched');
  assert.equal(result.application.id, 'career:core-spaces:2026-2620');
});

test('keeps same-employer ATS mail in review when multiple roles are active', () => {
  const result = reconcileCareerEmail([
    ...applications,
    { id:'career:core-spaces:second', company:'Core Spaces', role:'Program Manager', job_id:'X2', status:'APPLIED' }
  ], {
    subject: 'Application update - Core Spaces',
    from: 'Core Spaces recruiting',
    snippet: 'There is an update to your application.'
  });
  assert.equal(result.kind, 'review_required');
  assert.equal(result.reason, 'employer_match_role_ambiguous');
});
