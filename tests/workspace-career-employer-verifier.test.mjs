import test from 'node:test';
import assert from 'node:assert/strict';
import { employerPageEvidence, extractEmployerCandidates, isLikelyEmployerOrAtsUrl, isSafeExternalUrl, verifyEmployerListing } from '../api/_career-employer-verifier.mjs';

const job = {
  id:'example-role',
  source_url:'https://jobicy.com/jobs/example-role',
  title:'Senior Business Analyst',
  company_name:'Example Co',
  employer_host:'jobs.example.co'
};

test('verifier only keeps safe, non-board employer candidates', () => {
  const html = [
    '<a href="https://jobicy.com/jobs/other">Other board role</a>',
    '<a href="https://jobs.example.co/openings/business-analyst">Apply on Example Co careers</a>',
    '<a href="http://127.0.0.1/private">Unsafe</a>'
  ].join('');
  assert.deepEqual(extractEmployerCandidates(html, job.source_url, job), ['https://jobs.example.co/openings/business-analyst']);
  assert.equal(isSafeExternalUrl('https://jobs.example.co/openings/business-analyst'), true);
  assert.equal(isSafeExternalUrl('http://127.0.0.1/private'), false);
  assert.equal(isSafeExternalUrl('https://[::1]/private'), false);
  assert.equal(isLikelyEmployerOrAtsUrl('https://jobs.example.co/openings/business-analyst', job), true);
  assert.equal(isLikelyEmployerOrAtsUrl('https://not-a-board-we-know.example/jobs/example-role', job), false);
});

test('verifier requires evidence of both the company and role on the employer page', () => {
  const evidence = employerPageEvidence('<title>Senior Business Analyst | Example Co Careers</title>', job);
  assert.equal(evidence.verified, true);
  assert.equal(employerPageEvidence('<title>Senior Business Analyst | Another Co Careers</title>', job).verified, false);
});

test('verifier follows a board discovery page only after confirming an employer page', async () => {
  const pages = new Map([
    [job.source_url, '<a href="https://jobs.example.co/openings/business-analyst">Apply at Example Co</a>'],
    ['https://jobs.example.co/openings/business-analyst', '<title>Senior Business Analyst | Example Co Careers</title><main>Senior Business Analyst at Example Co</main>']
  ]);
  const result = await verifyEmployerListing(job, {
    checkedAt:'2026-10-10T12:00:00.000Z',
    fetchImpl:async url => new Response(pages.get(url) || '', { status:pages.has(url) ? 200 : 404 })
  });
  assert.equal(result.status, 'verified');
  assert.equal(result.employer_url, 'https://jobs.example.co/openings/business-analyst');
  assert.equal(result.evidence.company_matches, true);
  assert.equal(result.evidence.role_matches, true);
});

test('verifier fails closed when a board page has no independently matching employer page', async () => {
  const result = await verifyEmployerListing(job, {
    checkedAt:'2026-10-10T12:00:00.000Z',
    fetchImpl:async url => new Response(url === job.source_url ? '<a href="https://jobs.example.co/openings/other">Apply</a>' : '<title>Other Role | Example Co</title>', { status:200 })
  });
  assert.equal(result.status, 'unverified');
  assert.equal(result.reason, 'employer_page_did_not_match_role');
});

test('verifier does not treat an unfamiliar board as its own employer listing', async () => {
  const unfamiliarBoard = {
    ...job,
    source_url:'https://unlisted-board.example/jobs/example-role'
  };
  const result = await verifyEmployerListing(unfamiliarBoard, {
    checkedAt:'2026-10-10T12:00:00.000Z',
    fetchImpl:async url => new Response(
      url === unfamiliarBoard.source_url
        ? '<a href="/jobs/example-role">Apply on this board</a>'
        : '',
      { status:200 }
    )
  });
  assert.equal(result.status, 'unverified');
  assert.equal(result.reason, 'no_employer_listing_link_found');
});
