import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { ensureCareerSchema } from '../api/_career-ops-handler.mjs';
import { classifyCareerEmail, deriveCanonicalStatus, syncCareerGmail } from '../api/_career-gmail-pipeline.mjs';
import { summaryCounts, syncSummary } from '../workspace/career-ops/model.mjs';

const TIKTOK = 'career:tiktok:A115985';
const TIKTOK_LIVE = 'career:tiktok:A14462';
const CORE = 'career:core-spaces:2026-2620';

const b64 = text => Buffer.from(text, 'utf8').toString('base64url');

function gmailMessage({ id, threadId = `thread-${id}`, subject, from, body, at, html = false }) {
  return {
    id,
    threadId,
    internalDate: String(Date.parse(at)),
    snippet: body.slice(0, 200),
    payload: {
      mimeType: 'multipart/alternative',
      headers: [{ name:'Subject', value:subject }, { name:'From', value:from }],
      parts: [{ mimeType: html ? 'text/html' : 'text/plain', body:{ data:b64(html ? `<p>${body}</p>` : body) } }]
    }
  };
}

// Production-shaped messages (subjects and openings taken from the stored events).
const MAIL = {
  tiktokRejection: gmailMessage({
    id:'1a0d401828f783ad', at:'2026-09-24T15:21:03Z', from:'TikTok <no-reply@us.greenhouse-mail.io>',
    subject:'TikTok USDS JV: Application Update | Project Manager, PMO- USDS',
    body:'Hi Tahlia Ashwood-Peart,​ We genuinely appreciate your interest in TikTok USDS JV and thanks for giving us the time to review your application.​ We&#39;re letting you know that Project Manager, PMO-USDS is no longer under consideration for you, and we have decided to move forward with other candidates at this time.'
  }),
  tiktokConfirmation: gmailMessage({
    id:'1a0ad638fa12f766', at:'2026-09-17T03:22:56Z', from:'TikTok USDS Joint Venture <no-reply@us.greenhouse-mail.io>',
    subject:'Thank you for applying to TikTok USDS JV!',
    body:'Hi Tahlia Ashwood-Peart, You did it! Great job! We have received your application for the Project Manager, PMO - USDS role within TikTok USDS JV. Our talent acquisition team is currently reviewing all applications. If your qualifications match, a recruiter will reach out to schedule an interview.'
  }),
  tiktokLiveConfirmation: gmailMessage({
    id:'1a0ad36711353ac8', at:'2026-09-17T02:33:39Z', from:'TikTok USDS Joint Venture <no-reply@us.greenhouse-mail.io>',
    subject:'Thank you for applying to TikTok USDS JV!',
    body:'Hi Tahlia Ashwood-Peart, You did it! Great job! We have received your application for the TikTok Live Operational Risk Control Program Manager - USDS role within TikTok USDS JV. Our talent acquisition team is currently reviewing all applications.'
  }),
  coreRejection: gmailMessage({
    id:'1a0d0283f4650a7c', at:'2026-09-23T21:24:52Z', from:'Hannah Coleman <hcoleman@corespaces.com>',
    subject:'Thank You for Application - Core Spaces', html:true,
    body:'Dear Tahlia, Thank you for your interest in the Senior Business Analyst position here at Core Spaces, we truly appreciate your time and consideration. While we&#39;re moving forward with other candidates whose experience more closely matches our needs, we wish you the best.'
  }),
  coreConfirmation: gmailMessage({
    id:'1a0ad5362c791c81', at:'2026-09-17T03:05:17Z', from:'Core Spaces <no-reply@applytojob.com>',
    subject:'Thank You for Your Application - Senior Business Analyst at Core Spaces',
    body:'Thank you for taking the time to apply for the Senior Business Analyst role—we&#39;re excited to learn more about you. Your application has been received and will be reviewed by our Hiring Team.'
  }),
  neon: gmailMessage({
    id:'neon-1', at:'2026-09-20T10:00:00Z', from:'Neon <no-reply@neon.tech>',
    subject:'Your Neon project is approaching its compute limit',
    body:'Your project ashwood used 90% of its monthly compute. Unfortunately, once the limit is reached the endpoint will be suspended. Review your plan to keep the role of your primary branch.'
  }),
  googleSecurity: gmailMessage({
    id:'google-1', at:'2026-09-21T10:00:00Z', from:'Google <no-reply@accounts.google.com>',
    subject:'Security alert',
    body:'A new sign-in on Linux. We noticed a new sign-in to your Google Account. If this was you, you don’t need to do anything.'
  }),
  generic: gmailMessage({
    id:'generic-1', at:'2026-09-22T10:00:00Z', from:'Weekly Digest <digest@example-news.com>',
    subject:'This week in design',
    body:'Five essays about typography, a podcast about product teams, and our favourite links of the week.'
  }),
  ambiguousRecruiter: gmailMessage({
    id:'recruiter-1', at:'2026-09-22T12:00:00Z', from:'Jordan Blake <jordan@talentbridge-partners.com>',
    subject:'Program Manager opportunity',
    body:'Hi Tahlia, I came across your profile and would love to chat about a Program Manager role with one of our clients. Are you free for a quick call this week?'
  })
};

async function fixture({ mailbox, extraApplications = [] }) {
  const db = new PGlite();
  const sql = async (strings, ...values) => (await db.query(
    strings.reduce((query, part, index) => query + (index ? '$' + index : '') + part, ''), values
  )).rows;
  await ensureCareerSchema(sql);

  const applications = [
    // Stale production state: RECRUITER / APPLIED despite rejections in Gmail.
    { id:TIKTOK, company:'TikTok USDS JV', role:'Project Manager, PMO - USDS', job_id:'A115985', status:'RECRUITER' },
    { id:TIKTOK_LIVE, company:'TikTok USDS JV', role:'TikTok LIVE Operational Risk Control Program Manager - USDS', job_id:'A14462', status:'RECRUITER' },
    { id:CORE, company:'Core Spaces', role:'Senior Business Analyst', job_id:'2026-2620', status:'APPLIED' },
    { id:'career:declined:1', company:'Acme Analytics', role:'Business Analyst', job_id:'ACME-77', status:'DECLINED' },
    ...extraApplications
  ];
  for (const app of applications) {
    await sql`INSERT INTO workspace_career_applications (id, company, role, job_id, status, submitted_at)
      VALUES (${app.id}, ${app.company}, ${app.role}, ${app.job_id}, ${app.status}, ${app.status === 'DECLINED' ? null : '2026-09-17T02:00:00Z'})`;
  }
  // Owner-recorded history from the application sessions.
  const manual = [
    [TIKTOK, 'STATUS_CHANGE', '2026-09-17T03:22:00Z', { to:'SCREENING' }],
    [TIKTOK_LIVE, 'STATUS_CHANGE', '2026-09-17T02:33:00Z', { to:'SCREENING' }],
    [CORE, 'SUBMITTED', '2026-09-17T03:05:00Z', { requested_salary:95000 }]
  ];
  for (const [applicationId, type, at, payload] of manual) {
    await sql`INSERT INTO workspace_career_events (id, application_id, event_type, occurred_at, source, summary, payload)
      VALUES (${`seed:${applicationId}`}, ${applicationId}, ${type}, ${at}, 'chat-session-seed', 'Application submitted', ${JSON.stringify(payload)}::jsonb)`;
  }

  const messages = new Map(mailbox.map(message => [message.id, message]));
  const gmail = {
    listMessageIds: async () => [...messages.keys()],
    getMessage: async id => messages.get(id)
  };
  const run = () => syncCareerGmail({ sql, gmail });
  const app = async id => (await sql`SELECT * FROM workspace_career_applications WHERE id = ${id}`)[0];
  return { db, sql, run, app, gmail, messages };
}

// Existing production Gmail events, with the stale classifications they carry today.
async function seedExistingProductionEvents(sql) {
  const rows = [
    [TIKTOK, '1a0d401828f783ad', 'EMAIL', '2026-09-24T15:21:03Z', 'thread-1a0d401828f783ad'],
    [CORE, '1a0d0283f4650a7c', 'EMAIL', '2026-09-23T21:24:52Z', 'thread-1a0d0283f4650a7c'],
    [TIKTOK, '1a0ad638fa12f766', 'RECRUITER', '2026-09-17T03:22:56Z', 'thread-1a0ad638fa12f766'],
    [CORE, '1a0ad5362c791c81', 'EMAIL', '2026-09-17T03:05:17Z', 'thread-1a0ad5362c791c81'],
    [TIKTOK_LIVE, '1a0ad36711353ac8', 'RECRUITER', '2026-09-17T02:33:39Z', 'thread-1a0ad36711353ac8']
  ];
  for (const [applicationId, ref, type, at, threadId] of rows) {
    await sql`INSERT INTO workspace_career_events (id, application_id, event_type, occurred_at, source, source_ref, summary, payload)
      VALUES (${`career-event:gmail:${ref}`}, ${applicationId}, ${type}, ${at}, 'gmail', ${ref}, 'stored', ${JSON.stringify({ thread_id:threadId })}::jsonb)`;
  }
}

const fullMailbox = () => [
  MAIL.tiktokRejection, MAIL.coreRejection, MAIL.tiktokConfirmation, MAIL.coreConfirmation, MAIL.tiktokLiveConfirmation,
  MAIL.neon, MAIL.googleSecurity, MAIL.generic
];

const gmailEventCount = async (sql, ref) => Number((await sql`SELECT COUNT(*)::int AS n FROM workspace_career_events WHERE source = 'gmail' AND source_ref = ${ref}`)[0].n);

test('1. TikTok rejection moves the canonical Project Manager application to REJECTED', async t => {
  const f = await fixture({ mailbox:[MAIL.tiktokConfirmation, MAIL.tiktokRejection] }); t.after(() => f.db.close());
  const result = await f.run();
  assert.equal((await f.app(TIKTOK)).status, 'REJECTED');
  const outcome = result.outcomes.find(item => item.application_id === TIKTOK);
  assert.deepEqual([outcome.to, outcome.evidence_event_type, outcome.evidence_message_id, outcome.verified], ['REJECTED', 'REJECTION', '1a0d401828f783ad', true]);
});

test('2. Core Spaces rejection moves the canonical Senior Business Analyst application to REJECTED', async t => {
  const f = await fixture({ mailbox:[MAIL.coreConfirmation, MAIL.coreRejection] }); t.after(() => f.db.close());
  const result = await f.run();
  assert.equal((await f.app(CORE)).status, 'REJECTED');
  assert.equal(result.outcomes.find(item => item.application_id === CORE).evidence_message_id, '1a0d0283f4650a7c');
});

test('3. RECRUITER converges to REJECTED on later employer rejection', () => {
  const decision = deriveCanonicalStatus({ status:'RECRUITER' }, [
    { source:'gmail', event_type:'RECRUITER', occurred_at:'2026-09-18T00:00:00Z', source_ref:'a', payload:{} },
    { source:'gmail', event_type:'REJECTION', occurred_at:'2026-09-24T00:00:00Z', source_ref:'b', payload:{} }
  ]);
  assert.equal(decision.status, 'REJECTED');
  assert.equal(decision.evidence.source_ref, 'b');
});

test('4. existing Gmail events with a stale application status still converge without a duplicate event', async t => {
  const f = await fixture({ mailbox:fullMailbox() }); t.after(() => f.db.close());
  await seedExistingProductionEvents(f.sql);
  const result = await f.run();
  assert.equal((await f.app(TIKTOK)).status, 'REJECTED');
  assert.equal((await f.app(CORE)).status, 'REJECTED');
  assert.equal(result.counts.new_events, 0);
  for (const ref of ['1a0d401828f783ad', '1a0d0283f4650a7c']) assert.equal(await gmailEventCount(f.sql, ref), 1);
  const stored = (await f.sql`SELECT event_type FROM workspace_career_events WHERE source_ref = '1a0d401828f783ad'`)[0];
  assert.equal(stored.event_type, 'REJECTION', 'stale classification is corrected in place');
  // The confirmation that was mislabelled RECRUITER no longer props up a false stage.
  assert.equal((await f.app(TIKTOK_LIVE)).status, 'SCREENING');
});

test('5. re-running the same Gmail messages creates no duplicate events and no new outcomes', async t => {
  const f = await fixture({ mailbox:fullMailbox() }); t.after(() => f.db.close());
  const first = await f.run();
  const second = await f.run();
  assert.ok(first.outcomes.length > 0);
  assert.equal(second.outcomes.length, 0);
  assert.equal(second.counts.new_events, 0);
  const duplicates = await f.sql`SELECT source_ref FROM workspace_career_events WHERE source = 'gmail' GROUP BY source_ref HAVING COUNT(*) > 1`;
  assert.deepEqual(duplicates, []);
  const apps = await f.sql`SELECT COUNT(*)::int AS n FROM workspace_career_applications`;
  assert.equal(apps[0].n, 4, 'no replacement application records');
  assert.deepEqual(syncSummary({ outcomes:second.outcomes, reviewOpen:second.counts.review_open }).headline, 'No new application updates. Your tracker is current.');
});

test('6. multiple messages supporting one rejection produce one application-level result', async t => {
  const followUp = gmailMessage({
    id:'tiktok-followup', at:'2026-09-24T16:00:00Z', from:'TikTok <no-reply@us.greenhouse-mail.io>',
    subject:'TikTok USDS JV: Application Update | Project Manager, PMO- USDS',
    body:'Following up: we have decided to move forward with other candidates for Project Manager, PMO-USDS.'
  });
  const f = await fixture({ mailbox:[MAIL.tiktokRejection, followUp] }); t.after(() => f.db.close());
  const result = await f.run();
  assert.equal(result.outcomes.filter(item => item.application_id === TIKTOK).length, 1);
  assert.equal(await gmailEventCount(f.sql, 'tiktok-followup'), 1, 'second message kept as evidence');
  assert.equal(syncSummary({ outcomes:result.outcomes, reviewOpen:0 }).items.length, 1);
});

test('7. Neon account email is ignored before matching', async t => {
  assert.equal(classifyCareerEmail({ subject:'Your Neon project is approaching its compute limit', from:'Neon <no-reply@neon.tech>', body:'Unfortunately the endpoint will be suspended. Review the role of your branch.' }).relevant, false);
  const f = await fixture({ mailbox:[MAIL.neon] }); t.after(() => f.db.close());
  const result = await f.run();
  assert.deepEqual([result.counts.ignored, result.counts.review_open], [1, 0]);
});

test('8. Google account security email is ignored', async t => {
  const f = await fixture({ mailbox:[MAIL.googleSecurity] }); t.after(() => f.db.close());
  const result = await f.run();
  assert.deepEqual([result.counts.ignored, result.counts.review_open], [1, 0]);
});

test('9. generic unrelated inbox email is ignored', async t => {
  const f = await fixture({ mailbox:[MAIL.generic] }); t.after(() => f.db.close());
  const result = await f.run();
  assert.deepEqual([result.counts.ignored, result.counts.review_open], [1, 0]);
});

test('10. genuine ambiguous recruiting email enters review with resolvable evidence', async t => {
  const f = await fixture({ mailbox:[MAIL.ambiguousRecruiter] }); t.after(() => f.db.close());
  const result = await f.run();
  assert.equal(result.counts.review_open, 1);
  const review = (await f.sql`SELECT source_ref, reason, payload FROM workspace_career_email_reviews WHERE resolution IS NULL`)[0];
  assert.equal(review.source_ref, 'recruiter-1');
  assert.equal(review.payload.event_type, 'RECRUITER');
  assert.match(review.payload.subject, /Program Manager/);
  assert.equal((await f.sql`SELECT COUNT(*)::int AS n FROM workspace_career_applications`)[0].n, 4, 'no application created from a failed match');
});

test('11. same-employer applications stay ambiguous when the role cannot be established', async t => {
  const vague = gmailMessage({
    id:'tiktok-vague', at:'2026-09-24T18:00:00Z', from:'TikTok <no-reply@us.greenhouse-mail.io>',
    subject:'TikTok USDS JV: Application Update',
    body:'Thank you for your interest in TikTok USDS JV. We have decided to move forward with other candidates.'
  });
  const f = await fixture({ mailbox:[vague] }); t.after(() => f.db.close());
  const result = await f.run();
  assert.equal(result.outcomes.length, 0);
  assert.equal((await f.app(TIKTOK)).status, 'RECRUITER');
  assert.equal((await f.app(TIKTOK_LIVE)).status, 'RECRUITER');
  const review = (await f.sql`SELECT reason, candidate_ids FROM workspace_career_email_reviews WHERE source_ref = 'tiktok-vague'`)[0];
  assert.equal(review.reason, 'employer_match_role_ambiguous');
  assert.deepEqual([...review.candidate_ids].sort(), [TIKTOK_LIVE, TIKTOK].sort());
});

test('12. older lifecycle evidence cannot regress a newer terminal decision', async t => {
  const f = await fixture({ mailbox:[MAIL.tiktokRejection] }); t.after(() => f.db.close());
  await f.run();
  // An older confirmation / interview email arrives in a later sync.
  const olderInterview = gmailMessage({
    id:'tiktok-old-interview', at:'2026-09-20T10:00:00Z', from:'TikTok <no-reply@us.greenhouse-mail.io>',
    subject:'Interview invitation | Project Manager, PMO- USDS',
    body:'We would like to invite you to a video interview for Project Manager, PMO-USDS at TikTok USDS JV.'
  });
  f.messages.set(olderInterview.id, olderInterview);
  f.messages.set(MAIL.tiktokConfirmation.id, MAIL.tiktokConfirmation);
  const result = await f.run();
  assert.equal((await f.app(TIKTOK)).status, 'REJECTED');
  assert.equal(result.outcomes.length, 0);
});

test('13. DECLINED applications remain semantically untouched by employer rejection evidence', async t => {
  const acmeRejection = gmailMessage({
    id:'acme-reject', at:'2026-09-23T10:00:00Z', from:'Acme Analytics <jobs@acme-analytics.com>',
    subject:'Your application to Acme Analytics - Business Analyst',
    body:'Thank you for applying for the Business Analyst role at Acme Analytics. Unfortunately we will not be moving forward with your application.'
  });
  const f = await fixture({ mailbox:[acmeRejection] }); t.after(() => f.db.close());
  const result = await f.run();
  assert.equal((await f.app('career:declined:1')).status, 'DECLINED');
  assert.equal(result.outcomes.length, 0);
  assert.equal(await gmailEventCount(f.sql, 'acme-reject'), 1, 'evidence is linked, status is not');
});

test('14. a tracker update is only reported after post-write verification succeeds', async t => {
  const f = await fixture({ mailbox:[MAIL.coreRejection] }); t.after(() => f.db.close());
  // A concurrent write lands between the reconciliation read and the update.
  const sql = async (strings, ...values) => {
    const query = strings.join('?');
    if (/^\s*UPDATE workspace_career_applications\s+SET status/.test(query)) {
      await f.db.query(`UPDATE workspace_career_applications SET status = 'INTERVIEW' WHERE id = $1`, [CORE]);
    }
    return f.sql(strings, ...values);
  };
  const result = await syncCareerGmail({ sql, gmail:f.gmail });
  assert.equal(result.ok, false);
  assert.equal(result.outcomes.length, 0);
  assert.deepEqual([result.failures[0].application_id, result.failures[0].to, result.failures[0].observed], [CORE, 'REJECTED', 'INTERVIEW']);
  assert.deepEqual(syncSummary({ outcomes:result.outcomes }).items, []);
});

test('15. "No new updates" never coexists with application changes', () => {
  const changed = syncSummary({ outcomes:[
    { application_id:TIKTOK, company:'TikTok USDS JV', role:'Project Manager, PMO - USDS', to:'REJECTED', evidence_event_type:'REJECTION', verified:true },
    { application_id:TIKTOK, company:'TikTok USDS JV', role:'Project Manager, PMO - USDS', to:'REJECTED', evidence_event_type:'REJECTION', verified:true },
    { application_id:CORE, company:'Core Spaces', role:'Senior Business Analyst', to:'REJECTED', evidence_event_type:'REJECTION', verified:true }
  ], reviewOpen:0 });
  assert.equal(changed.headline, 'Located 2 application updates.');
  assert.doesNotMatch(changed.headline, /No new/);
  assert.equal(changed.review, '0 application emails require review.');
  const unverified = syncSummary({ outcomes:[{ application_id:CORE, company:'Core Spaces', role:'x', to:'REJECTED', verified:false }] });
  assert.match(unverified.headline, /^No new application updates/);
  assert.equal(unverified.items.length, 0);
});

test('16. funnel counts reflect canonical post-sync state', async t => {
  const f = await fixture({ mailbox:fullMailbox() }); t.after(() => f.db.close());
  await seedExistingProductionEvents(f.sql);
  const before = summaryCounts(await f.sql`SELECT * FROM workspace_career_applications`, await f.sql`SELECT * FROM workspace_career_events`);
  await f.run();
  const after = summaryCounts(await f.sql`SELECT * FROM workspace_career_applications`, await f.sql`SELECT * FROM workspace_career_events`);
  assert.deepEqual(before, { submitted:3, denied:0, interviews:0 });
  assert.deepEqual(after, { submitted:3, denied:2, interviews:0 }, 'rejected applications stay submitted and count as denied');
});

test('historical junk review rows are retired, genuine ones stay open, nothing is deleted', async t => {
  const f = await fixture({ mailbox:[] }); t.after(() => f.db.close());
  await f.run(); // creates review schema
  const rows = [
    ['old-neon', 'Neon <no-reply@neon.tech>', 'Your Neon invoice is ready', 'Invoice for September'],
    ['old-newsletter', 'Digest <digest@example-news.com>', 'Weekend reading', 'Five links about typography'],
    ['old-recruiter', 'Sam <sam@agency.com>', 'Senior Analyst position', 'Would love to discuss a position with you']
  ];
  for (const [ref, from, subject, snippet] of rows) {
    await f.sql`INSERT INTO workspace_career_email_reviews (id, source, source_ref, occurred_at, summary, reason, payload)
      VALUES (${`career-email-review:gmail:${ref}`}, 'gmail', ${ref}, NOW(), ${subject}, 'no_safe_match', ${JSON.stringify({ from, subject, snippet })}::jsonb)`;
  }
  const result = await f.run();
  assert.equal(result.counts.historical_reviews_retired, 2);
  assert.equal(result.counts.review_open, 1);
  assert.equal((await f.sql`SELECT COUNT(*)::int AS n FROM workspace_career_email_reviews`)[0].n, 3);
});

test('conditional interview language in a confirmation is not an interview', () => {
  const result = classifyCareerEmail({
    subject:'Thank you for applying to TikTok USDS JV!', from:'TikTok <no-reply@us.greenhouse-mail.io>',
    body:'We have received your application. If your qualifications match, a recruiter will reach out to schedule an interview.'
  });
  assert.equal(result.eventType, 'CONFIRMATION');
});

test('conditional rejection language in a confirmation is not a rejection', () => {
  const result = classifyCareerEmail({
    subject:'Application received - Senior Business Analyst', from:'Core Spaces <no-reply@applytojob.com>',
    body:'Your application has been received. If you are not selected for this role, we will keep your résumé on file.'
  });
  assert.equal(result.eventType, 'CONFIRMATION');
});

test('role-named "no longer available" decision reads as an employer rejection', () => {
  const result = classifyCareerEmail({
    subject:'TikTok USDS JV: Application Update | Project Manager, PMO- USDS', from:'TikTok <no-reply@us.greenhouse-mail.io>',
    body:"Thanks for giving us the time to review your application. We're letting you know that Project Manager, PMO-USDS is no longer available."
  });
  assert.equal(result.status, 'REJECTED');
});
