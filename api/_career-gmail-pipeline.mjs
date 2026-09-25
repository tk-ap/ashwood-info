import { gmailEventId, reconcileCareerEmail } from './_career-reconciliation.mjs';

// Gmail message → relevance → lifecycle → reconciliation → transition decision →
// idempotent event → tracker mutation → post-write verification → summary.

export const OWNER_CONTROLLED_STATUSES = new Set(['DECLINED', 'CLOSED', 'DEFERRED']);
const PIPELINE_RANK = { TARGET:0, APPLIED:1, SCREENING:2, RECRUITER:3, ASSESSMENT:4, INTERVIEW:5, OFFER:6 };
export const EVENT_STATUS = {
  CONFIRMATION:'APPLIED',
  SCREENING:'SCREENING',
  RECRUITER:'RECRUITER',
  ASSESSMENT:'ASSESSMENT',
  INTERVIEW:'INTERVIEW',
  OFFER:'OFFER',
  REJECTION:'REJECTED',
  ASSUMED_REJECTION:'ASSUMED_REJECTED'
};
const RECONCILIATION_SOURCE = 'gmail-reconciliation';
const POLICY_SOURCE = 'career-policy';
export const DEFAULT_SILENT_REJECTION_DAYS = 30;

const trim = (value, max = 1000) => {
  const text = String(value ?? '').trim();
  return text ? text.slice(0, max) : null;
};

const time = value => {
  const parsed = new Date(value ?? 0).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

// ---------------------------------------------------------------------------
// Message text
// ---------------------------------------------------------------------------

export function decodeEntities(value) {
  return String(value || '')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

const cleanText = value => decodeEntities(value)
  .replace(/[​-‍﻿]/g, '')
  .replace(/[’‘]/g, "'")
  .replace(/\s+/g, ' ')
  .trim();

const decodeBase64Url = data => Buffer.from(String(data || '').replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');

const stripHtml = html => String(html || '')
  .replace(/<(style|script|head)[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<br\s*\/?>|<\/(p|div|tr|li|h\d)>/gi, '\n')
  .replace(/<[^>]+>/g, ' ');

/** Plain text of a Gmail `format=full` payload, without quoted earlier replies. */
export function messageBodyText(payload) {
  const plain = [];
  const html = [];
  const walk = part => {
    if (!part) return;
    if (part.body?.data && part.mimeType === 'text/plain') plain.push(decodeBase64Url(part.body.data));
    else if (part.body?.data && part.mimeType === 'text/html') html.push(stripHtml(decodeBase64Url(part.body.data)));
    (part.parts || []).forEach(walk);
  };
  walk(payload);
  const raw = plain.length ? plain.join('\n') : html.join('\n');
  const unquoted = raw.split(/\n\s*On [^\n]{0,160}wrote:|\n-{2,}\s*Original Message\s*-{2,}/i)[0];
  return cleanText(unquoted).slice(0, 20000);
}

const header = (message, name) => message.payload?.headers?.find(item => item.name?.toLowerCase() === name.toLowerCase())?.value || '';

/** Normalised message used by every downstream stage. */
export function parseGmailMessage(message) {
  return {
    id: String(message.id),
    threadId: message.threadId || null,
    subject: cleanText(header(message, 'Subject')),
    from: cleanText(header(message, 'From')),
    snippet: cleanText(message.snippet || ''),
    body: messageBodyText(message.payload),
    occurredAt: message.internalDate ? new Date(Number(message.internalDate)).toISOString() : new Date().toISOString()
  };
}

// ---------------------------------------------------------------------------
// Stage 1 + 2: career relevance and lifecycle classification
// ---------------------------------------------------------------------------

const ATS_DOMAINS = [
  'greenhouse.io', 'greenhouse-mail.io', 'lever.co', 'myworkday.com', 'myworkdayjobs.com', 'workday.com',
  'icims.com', 'smartrecruiters.com', 'ashbyhq.com', 'jobvite.com', 'taleo.net', 'successfactors.com',
  'bamboohr.com', 'workable.com', 'workablemail.com', 'recruitee.com', 'breezy.hr', 'jazzhr.com',
  'applytojob.com', 'paylocity.com', 'ultipro.com', 'ukg.com', 'adp.com', 'oraclecloud.com', 'eightfold.ai',
  'gem.com', 'dayforcehcm.com', 'rippling.com', 'hire.lever.co', 'phenompeople.com', 'avature.net',
  'linkedin.com', 'indeed.com', 'indeedemail.com'
];

// Product/account notice senders. Their mail never carries an application lifecycle event.
const ACCOUNT_NOTICE_DOMAINS = ['neon.tech', 'neon.com', 'accounts.google.com'];
const ACCOUNT_NOTICE_SUBJECT = /\b(security alert|new sign-?in|sign-?in attempt|verify your (email|account)|password (reset|changed)|2-step verification|your (account|project|plan|subscription|invoice|bill|usage)|billing|receipt)\b/i;

export function senderAddress(from) {
  const match = String(from || '').match(/<([^>]+)>/) || String(from || '').match(/([^\s<>]+@[^\s<>]+)/);
  return (match?.[1] || '').toLowerCase();
}

const senderDomain = from => senderAddress(from).split('@')[1] || '';
const domainIn = (domain, list) => list.some(entry => domain === entry || domain.endsWith(`.${entry}`));

function isAccountNotice(from, subject) {
  const address = senderAddress(from);
  const domain = senderDomain(from);
  if (domainIn(domain, ACCOUNT_NOTICE_DOMAINS)) return true;
  if (domain === 'google.com' && /^(no-?reply|security|accounts?)[-.@]/.test(address)) return true;
  return ACCOUNT_NOTICE_SUBJECT.test(subject);
}

const CONDITIONAL = /\b(if|should|once|in the event|may be|might be)\b/i;
const SILENT_REJECTION_PATTERNS = [
  /\bonly (candidates|applicants|individuals) (who are )?(selected|chosen|moving forward|advanced) (will|may) be (contacted|notified)\b/i,
  /\b(we|the team) (will|may) only (contact|notify) (candidates|applicants|individuals) (who are )?(selected|chosen|moving forward|advanced)\b/i,
  /\b(if you are|if you're) not selected[^.]{0,100}\b(will not|won't|may not) (receive|be sent|get) (a |an )?(notification|notice|response|email|rejection)\b/i,
  /\b(will not|won't|cannot|can't|unable to) (contact|notify|respond to) (every|all|each) (candidate|applicant)\b/i,
  /\b(do not|don't) (send|provide) (individual )?(rejection|status) (emails?|notices?|notifications?)\b/i
];

export function silentRejectionPolicy(text, occurredAt, defaultDays=DEFAULT_SILENT_REJECTION_DAYS) {
  const clean = cleanText(text);
  const sentence = sentences(clean).find(value => SILENT_REJECTION_PATTERNS.some(pattern => pattern.test(value)));
  if (!sentence) return null;
  const explicit = sentence.match(/\bwithin\s+(\d{1,3})\s+(business\s+)?(day|week)s?\b/i);
  let days = defaultDays;
  if (explicit) {
    const amount = Number(explicit[1]);
    if (explicit[3].toLowerCase() === 'week') days = amount * 7;
    else if (explicit[2]) days = Math.ceil(amount * 7 / 5);
    else days = amount;
  }
  const start = new Date(occurredAt);
  const deadline = Number.isNaN(start.getTime()) ? null : new Date(start.getTime() + days * 86400000).toISOString();
  return {
    detected:true,
    days,
    deadline,
    basis:trim(sentence, 500),
    assumption:'ASSUMED_REJECTED'
  };
}

// Ordered by precedence. A rejection often also thanks the applicant and
// mentions interviews, so employer decisions are tested first.
const LIFECYCLE_RULES = [
  { eventType:'REJECTION', conditional:true, patterns:[
    /\bnot (be )?(moving|move|proceeding|proceed|progressing|progress|advancing|advance) (forward|further|ahead)?\b/,
    /\b(decided|chosen|elected|opted|decision) (to )?(move|moving|proceed|go|pursue|advance)( forward)? with (other|another|a different)\b/,
    /\b(moving|move|proceed|proceeding|go) forward with (other|another|a different) (candidate|applicant|individual)/,
    /\bpursue other (candidates|applicants)\b/,
    /\bother (candidates|applicants) (whose|who)\b/,
    /\bno longer (under|being) consider/,
    /\bnot (been )?selected\b/,
    /\bregret to (inform|let you know|tell you)\b/,
    /\b(decided|decision) not to (move|proceed|pursue|advance|offer)\b/,
    /\b(unable|not able) to (offer you|move forward|proceed|advance)\b/,
    /\bwill not be (moving|proceeding|advancing|offering|considering)\b/,
    /\b(position|role|requisition|job|opening|vacancy)\b[^.]{0,80}\b(has been|have been|was|is now) (filled|closed|cancell?ed|withdrawn)\b/,
    /\b(position|role|requisition|job|opening|vacancy)\b[^.]{0,80}\bis no longer (available|open|active)\b/,
    /\bnot (the right|a) (fit|match) (for|at) this time\b/,
    /\bis no longer (available|open|active|accepting applications)\b/,
    /\b(has|have) (now )?been (filled|closed)\b/
  ]},
  { eventType:'OFFER', conditional:true, patterns:[
    /\boffer letter\b/, /\boffer of employment\b/, /\b(employment|job|verbal|formal) offer\b/,
    /\b(pleased|delighted|happy|excited|thrilled) to (extend|offer you)\b/, /\bextend(ing)? (you )?(an|a|this|our) (formal |verbal |official )?offer\b/
  ]},
  { eventType:'INTERVIEW', conditional:true, patterns:[
    /\b(invite|inviting|invitation) (you )?(to|for) (an? |the |your )?([a-z-]+ ){0,2}interview/,
    /\b(schedule|scheduling|set up|arrange|book) (an? |the |your )?([a-z-]+ ){0,2}interview/,
    /\binterview (invitation|request|confirmation|confirmed|scheduled|details|availability)\b/,
    /\byour (upcoming )?interview (with|on|for|is)\b/,
    /\b(availability|available) for (an? |the )?([a-z-]+ ){0,2}interview/,
    /\bnext round\b/
  ]},
  { eventType:'ASSESSMENT', conditional:true, patterns:[
    /\b(complete|take|invited to|invitation to|link to) (an? |the |your )?([a-z-]+ ){0,2}(assessment|skills test|coding challenge|take-?home)/,
    /\b(assessment|coding challenge|take-?home( assignment| exercise)?) (invitation|link|request|is ready)\b/,
    /\b(hackerrank|codility|codesignal|testgorilla|criteria corp)\b/
  ]},
  { eventType:'RECRUITER', conditional:true, patterns:[
    /\bphone screen\b/, /\bscreening (call|interview)\b/, /\brecruiter (call|screen|conversation)\b/,
    /\b(like|love) to (chat|connect|speak|talk) (with you )?(about|regarding)\b/,
    /\b(set up|schedule|book) (a )?(quick |brief |short )?(call|chat|conversation)\b/
  ]},
  { eventType:'CONFIRMATION', patterns:[
    /\bthank(s| you) for (applying|your application|submitting)\b/,
    /\b(we('ve| have)|we) (successfully )?received your application\b/,
    /\byour application (has been |was )?(successfully )?(received|submitted)\b/,
    /\bapplication (received|submitted|confirmation|complete)\b/,
    /\byou('ve| have) (successfully )?applied\b/,
    /\byour application was sent\b/
  ]},
  { eventType:'SCREENING', patterns:[
    /\b(application|candidacy) is (currently |now )?(under review|being reviewed)\b/,
    /\bstatus[^.]{0,40}\bunder review\b/
  ]}
];

const CAREER_CONTEXT = /\b(application|applied|applying|applicant|candidacy|candidate|position|role|requisition|job|opening|hiring|recruit\w*|talent acquisition|interview)\b/;

const sentences = text => String(text || '').split(/(?<=[.!?])\s+|\n+/);

function lifecycleMatch(text) {
  const lower = text.toLowerCase();
  for (const rule of LIFECYCLE_RULES) {
    for (const pattern of rule.patterns) {
      if (!rule.conditional) {
        const match = lower.match(pattern);
        if (match) return { eventType:rule.eventType, evidence:excerpt(text, match.index) };
        continue;
      }
      // "If selected, we will reach out to schedule an interview" is not an invitation.
      for (const sentence of sentences(lower)) {
        if (pattern.test(sentence) && !CONDITIONAL.test(sentence)) {
          return { eventType:rule.eventType, evidence:excerpt(text, lower.indexOf(sentence)) };
        }
      }
    }
  }
  return null;
}

const excerpt = (text, index) => trim(String(text).slice(Math.max(0, index - 60), Math.max(0, index - 60) + 240), 240);

/**
 * Decide whether a message is Career Ops evidence at all, and which lifecycle
 * event it supports. Irrelevant mail never reaches application matching.
 */
export function classifyCareerEmail({ subject = '', from = '', snippet = '', body = '', occurredAt = null } = {}) {
  const text = cleanText(`${subject}. ${body || snippet}`);
  const silentPolicy = silentRejectionPolicy(text, occurredAt);
  const lower = text.toLowerCase();
  const ats = domainIn(senderDomain(from), ATS_DOMAINS);
  if (!ats && isAccountNotice(from, subject)) {
    return { relevant:false, reason:'account_notice', eventType:null, status:null, evidence:null, silentRejectionPolicy:null };
  }
  const lifecycle = lifecycleMatch(text);
  const context = CAREER_CONTEXT.test(lower);
  if (lifecycle && (context || ats)) {
    return { relevant:true, reason:'lifecycle_evidence', eventType:lifecycle.eventType, status:EVENT_STATUS[lifecycle.eventType], evidence:lifecycle.evidence, silentRejectionPolicy:silentPolicy };
  }
  if (ats && /\byour (application|candidacy)\b/.test(lower)) {
    return { relevant:true, reason:'ats_application_mail', eventType:'EMAIL', status:null, evidence:excerpt(text, 0), silentRejectionPolicy:silentPolicy };
  }
  return { relevant:false, reason:lifecycle ? 'no_career_context' : 'no_lifecycle_evidence', eventType:null, status:null, evidence:null, silentRejectionPolicy:null };
}

// ---------------------------------------------------------------------------
// Stage 4: state transition decision
// ---------------------------------------------------------------------------

function eventStatus(event) {
  if (event.source === RECONCILIATION_SOURCE) return null;
  const payload = event.payload || {};
  if (event.source === POLICY_SOURCE && event.event_type === 'ASSUMED_REJECTION') return 'ASSUMED_REJECTED';
  if (event.source === 'gmail') {
    if (payload.relevance === 'ignored') return null;
    return EVENT_STATUS[event.event_type] || null;
  }
  // Owner/manual history is authoritative at the moment it was recorded.
  const explicit = String(payload.to || payload.status || '').toUpperCase();
  if (explicit) return explicit;
  if (event.event_type === 'SUBMITTED') return 'APPLIED';
  return null;
}

function advance(current, evidence) {
  if (!current) return evidence;
  if (OWNER_CONTROLLED_STATUSES.has(current)) return current;
  if (evidence === 'REJECTED') return 'REJECTED';
  if (evidence === 'ASSUMED_REJECTED') return current === 'REJECTED' ? current : 'ASSUMED_REJECTED';
  // An inferred silent rejection reopens on any later substantive employer response.
  if (current === 'ASSUMED_REJECTED') return evidence !== 'APPLIED' ? evidence : current;
  // Only real re-engagement reopens an explicit employer rejection.
  if (current === 'REJECTED') return evidence === 'INTERVIEW' || evidence === 'OFFER' ? evidence : current;
  return (PIPELINE_RANK[evidence] ?? -1) > (PIPELINE_RANK[current] ?? -1) ? evidence : current;
}

/**
 * Replay an application's history in occurrence order. Owner-recorded status
 * changes set the state; Gmail evidence may only advance it, except that an
 * employer rejection supersedes any open pipeline state. Older evidence can
 * therefore never regress a newer known state.
 */
export function deriveCanonicalStatus(application, events) {
  const current = String(application.status || '').toUpperCase();
  if (OWNER_CONTROLLED_STATUSES.has(current)) return { status:current, evidence:null };
  const ordered = [...events].sort((left, right) => time(left.occurred_at) - time(right.occurred_at)
    || (left.source === 'gmail') - (right.source === 'gmail'));
  let state = null;
  let evidence = null;
  for (const event of ordered) {
    const status = eventStatus(event);
    if (!status) continue;
    if (event.source === 'gmail' || event.source === POLICY_SOURCE) {
      const next = advance(state, status);
      if (next !== state) evidence = event;
      state = next;
    } else {
      state = status;
      evidence = null;
    }
  }
  if (!state) return { status:current, evidence:null };
  if (evidence) return { status:state, evidence, correction:false };
  // History ends on an owner-recorded state that Gmail evidence did not move.
  // A different stored status was written outside the event history (the
  // previous classifier updated status without recording why), so replaying
  // the history is the canonical answer. Report it as a correction.
  const latestGmail = ordered.filter(event => event.source === 'gmail' && eventStatus(event)).pop();
  if (state === current || !latestGmail) return { status:current, evidence:null };
  return { status:state, evidence:latestGmail, correction:true };
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

export async function ensureGmailSyncSchema(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS workspace_career_gmail_sync (
      account TEXT PRIMARY KEY,
      last_history_id TEXT,
      last_synced_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS workspace_career_email_reviews (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      source_ref TEXT NOT NULL,
      occurred_at TIMESTAMPTZ NOT NULL,
      company TEXT,
      role TEXT,
      summary TEXT NOT NULL,
      reason TEXT NOT NULL,
      candidate_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(source, source_ref)
    )
  `;
  // Resolved reviews are kept as evidence; only unresolved rows are actionable.
  await sql`ALTER TABLE workspace_career_email_reviews ADD COLUMN IF NOT EXISTS resolution TEXT`;
  await sql`ALTER TABLE workspace_career_email_reviews ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ`;
}

async function openReview(sql, message, resolution) {
  const candidates = resolution.candidates || [];
  await sql`
    INSERT INTO workspace_career_email_reviews (
      id, source, source_ref, occurred_at, company, role, summary, reason, candidate_ids, payload
    ) VALUES (
      ${`career-email-review:gmail:${message.id}`}, 'gmail', ${message.id}, ${message.occurredAt},
      ${candidates.length === 1 ? candidates[0].company : null},
      ${candidates.length === 1 ? candidates[0].role : null},
      ${trim(message.subject, 1200) || 'Career email requires review'}, ${resolution.reason},
      ${JSON.stringify(candidates.map(candidate => candidate.id))}::jsonb,
      ${JSON.stringify({
        from: trim(message.from, 500),
        subject: trim(message.subject, 500),
        snippet: trim(message.snippet, 500),
        event_type: message.classification.eventType,
        evidence: message.classification.evidence
      })}::jsonb
    ) ON CONFLICT (source, source_ref) DO UPDATE SET
      updated_at = NOW(), reason = EXCLUDED.reason, candidate_ids = EXCLUDED.candidate_ids,
      payload = EXCLUDED.payload, resolution = NULL, resolved_at = NULL
  `;
}

async function resolveReview(sql, messageId, resolution, openRefs) {
  if (openRefs && !openRefs.has(messageId)) return;
  await sql`
    UPDATE workspace_career_email_reviews
    SET resolution = ${resolution}, resolved_at = NOW(), updated_at = NOW()
    WHERE source = 'gmail' AND source_ref = ${messageId} AND resolution IS NULL
  `;
}

/**
 * Historical review rows outside the scanned window only retain subject,
 * sender and snippet. Retire them only when that evidence is unmistakably not
 * career mail; anything that might be an application event stays open.
 */
async function retireHistoricalJunkReviews(sql, scannedIds) {
  const open = await sql`
    SELECT source_ref, payload FROM workspace_career_email_reviews
    WHERE source = 'gmail' AND resolution IS NULL
  `;
  let retired = 0;
  for (const review of open) {
    if (scannedIds.has(review.source_ref)) continue;
    const payload = review.payload || {};
    const from = payload.from || '';
    const subject = payload.subject || '';
    const text = `${subject} ${payload.snippet || ''}`.toLowerCase();
    const notice = !domainIn(senderDomain(from), ATS_DOMAINS) && isAccountNotice(from, subject);
    if (notice || !CAREER_CONTEXT.test(text)) {
      await resolveReview(sql, review.source_ref, notice ? 'ignored:account_notice' : 'ignored:no_career_context');
      retired += 1;
    }
  }
  return retired;
}

async function persistEvent(sql, message, application, existing) {
  const payload = {
    from: trim(message.from, 500),
    subject: trim(message.subject, 500),
    thread_id: message.threadId,
    snippet: trim(message.snippet, 500),
    evidence: message.classification.evidence,
    relevance: message.classification.relevant ? 'relevant' : 'ignored',
    classifier: message.classification.reason,
    silent_rejection_policy: message.classification.silentRejectionPolicy
  };
  const eventType = message.classification.eventType || 'EMAIL';
  if (existing) {
    // Correct a stale classification in place: the same Gmail message stays one event.
    await sql`
      UPDATE workspace_career_events
      SET event_type = ${eventType},
          payload = payload || ${JSON.stringify(payload)}::jsonb
      WHERE source = 'gmail' AND source_ref = ${message.id}
    `;
    return false;
  }
  const inserted = await sql`
    INSERT INTO workspace_career_events
      (id, application_id, event_type, occurred_at, source, source_ref, summary, payload)
    VALUES
      (${gmailEventId(message.id)}, ${application.id}, ${eventType}, ${message.occurredAt}, 'gmail', ${message.id},
       ${trim(message.subject, 1200) || 'Career email received'}, ${JSON.stringify(payload)}::jsonb)
    ON CONFLICT DO NOTHING
    RETURNING id
  `;
  return Boolean(inserted[0]);
}

async function applyTransition(sql, application, decision) {
  const from = application.status;
  const to = decision.status;
  await sql`
    UPDATE workspace_career_applications
    SET status = ${to}, updated_at = NOW()
    WHERE id = ${application.id} AND status = ${from}
  `;
  const reread = await sql`SELECT status FROM workspace_career_applications WHERE id = ${application.id} LIMIT 1`;
  const verified = reread[0]?.status === to;
  if (verified) {
    await sql`
      INSERT INTO workspace_career_events
        (id, application_id, event_type, occurred_at, source, source_ref, summary, payload)
      VALUES
        (${`career-event:reconcile:${application.id}:${decision.evidence.source_ref}:${to}`}, ${application.id}, 'STATUS_CHANGE',
         NOW(), ${RECONCILIATION_SOURCE}, ${`${application.id}:${decision.evidence.source_ref}:${to}`},
         ${`${from} → ${to} from Gmail evidence`},
         ${JSON.stringify({ from, to, evidence_message_id: decision.evidence.source_ref, evidence_event_type: decision.evidence.event_type })}::jsonb)
      ON CONFLICT DO NOTHING
    `;
  }
  return { verified, observed: reread[0]?.status ?? null };
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

function matchApplication(applications, message) {
  const text = { subject:message.subject, from:message.from, snippet:`${message.snippet} ${message.body}` };
  const open = applications.filter(application => !OWNER_CONTROLLED_STATUSES.has(application.status));
  const primary = reconcileCareerEmail(open, text);
  if (primary.kind === 'matched' || primary.reason !== 'no_safe_match') return primary;
  // Evidence for an owner-closed application is linked but never changes its status.
  const owned = reconcileCareerEmail(applications.filter(application => OWNER_CONTROLLED_STATUSES.has(application.status)), text);
  return owned.kind === 'matched' ? owned : primary;
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  }));
  return results;
}

/**
 * Run one sync. `gmail` exposes `listMessageIds()` and `getMessage(id)`
 * (Gmail API `format=full` shape). Returns an application-level summary.
 */
export async function syncCareerGmail({ sql, gmail }) {
  await ensureGmailSyncSchema(sql);
  const ids = await gmail.listMessageIds();
  const fetched = (await mapLimit(ids, 6, id => gmail.getMessage(id).catch(() => null))).filter(Boolean);
  const messages = fetched.map(parseGmailMessage)
    .sort((left, right) => time(left.occurredAt) - time(right.occurredAt));

  const applications = await sql`SELECT id, company, role, job_id, status FROM workspace_career_applications`;
  const byId = new Map(applications.map(application => [application.id, application]));
  const existingRows = await sql`SELECT source_ref, application_id, payload FROM workspace_career_events WHERE source = 'gmail'`;
  const existing = new Map(existingRows.map(row => [row.source_ref, row]));
  const threadOwner = new Map(existingRows.filter(row => row.payload?.thread_id).map(row => [row.payload.thread_id, row.application_id]));

  const openRefs = new Set((await sql`SELECT source_ref FROM workspace_career_email_reviews WHERE source = 'gmail' AND resolution IS NULL`).map(row => row.source_ref));
  const counts = { messages_examined:messages.length, relevant:0, ignored:0, new_events:0, review_required:0 };
  const diagnostics = [];

  for (const message of messages) {
    message.classification = classifyCareerEmail(message);
    const prior = existing.get(message.id);
    const diagnostic = { id:message.id, event_type:message.classification.eventType, reason:message.classification.reason };
    diagnostics.push(diagnostic);

    if (!message.classification.relevant) {
      counts.ignored += 1;
      // Keep previously linked evidence but stop it influencing status.
      if (prior) await persistEvent(sql, message, byId.get(prior.application_id), prior);
      await resolveReview(sql, message.id, `ignored:${message.classification.reason}`, openRefs);
      diagnostic.disposition = 'ignored';
      continue;
    }
    counts.relevant += 1;

    let application = prior ? byId.get(prior.application_id) : null;
    if (!application && message.threadId && threadOwner.has(message.threadId)) application = byId.get(threadOwner.get(message.threadId));
    let resolution = null;
    if (!application) {
      resolution = matchApplication(applications, message);
      if (resolution.kind === 'matched') application = resolution.application;
    }
    if (!application) {
      await openReview(sql, message, resolution);
      counts.review_required += 1;
      diagnostic.disposition = `review:${resolution.reason}`;
      continue;
    }

    if (await persistEvent(sql, message, application, prior)) counts.new_events += 1;
    if (message.threadId) threadOwner.set(message.threadId, application.id);
    await resolveReview(sql, message.id, `reconciled:${application.id}`, openRefs);
    diagnostic.disposition = 'matched';
    diagnostic.application_id = application.id;
  }

  const scanned = new Set(messages.map(message => message.id));
  const historicalRetired = await retireHistoricalJunkReviews(sql, scanned);

  // A confirmation can explicitly say unsuccessful applicants will not receive
  // another notice. Keep that as an inference policy, never as employer-supplied
  // rejection evidence. After its deadline, APPLIED becomes ASSUMED_REJECTED.
  const policyCandidates = await sql`
    SELECT application_id, source_ref, occurred_at, payload
    FROM workspace_career_events
    WHERE source = 'gmail' AND payload->'silent_rejection_policy' IS NOT NULL
    ORDER BY occurred_at DESC
  `;
  const policySeen = new Set();
  for (const candidate of policyCandidates) {
    if (policySeen.has(candidate.application_id)) continue;
    policySeen.add(candidate.application_id);
    const application = byId.get(candidate.application_id);
    const policy = candidate.payload?.silent_rejection_policy;
    if (!application || application.status !== 'APPLIED' || !policy?.deadline) continue;
    if (Date.now() < new Date(policy.deadline).getTime()) continue;
    const laterResponse = await sql`
      SELECT id FROM workspace_career_events
      WHERE application_id = ${candidate.application_id}
        AND source = 'gmail'
        AND occurred_at > ${candidate.occurred_at}
        AND event_type IN ('SCREENING','RECRUITER','ASSESSMENT','INTERVIEW','OFFER','REJECTION')
        AND COALESCE(payload->>'relevance', 'relevant') <> 'ignored'
      LIMIT 1
    `;
    if (laterResponse[0]) continue;
    await sql`
      INSERT INTO workspace_career_events
        (id, application_id, event_type, occurred_at, source, source_ref, summary, payload)
      VALUES
        (${`career-event:silent-rejection:${candidate.application_id}:${candidate.source_ref}`},
         ${candidate.application_id}, 'ASSUMED_REJECTION', ${policy.deadline}, ${POLICY_SOURCE},
         ${`${candidate.application_id}:${candidate.source_ref}:silent-rejection`},
         'Assumed rejection after employer silent-close window',
         ${JSON.stringify({
           status:'ASSUMED_REJECTED',
           inferred:true,
           basis_message_id:candidate.source_ref,
           deadline:policy.deadline,
           days:policy.days,
           reason:'Employer confirmation states unsuccessful applicants may not receive a rejection notice'
         })}::jsonb)
      ON CONFLICT DO NOTHING
    `;
  }

  // Converge every application that has Gmail evidence, not only those touched
  // by new messages, so a stored event can repair a stale tracker status.
  const events = await sql`
    SELECT application_id, event_type, occurred_at, source, source_ref, payload
    FROM workspace_career_events
    WHERE application_id IN (SELECT DISTINCT application_id FROM workspace_career_events WHERE source = 'gmail')
  `;
  const eventsByApp = new Map();
  for (const event of events) {
    if (!eventsByApp.has(event.application_id)) eventsByApp.set(event.application_id, []);
    eventsByApp.get(event.application_id).push(event);
  }

  const outcomes = [];
  const failures = [];
  let alreadyCurrent = 0;
  for (const [applicationId, history] of eventsByApp) {
    const application = byId.get(applicationId);
    if (!application) continue;
    const decision = deriveCanonicalStatus(application, history);
    if (decision.status === application.status) {
      if (decision.evidence || history.some(event => event.source === 'gmail')) alreadyCurrent += 1;
      continue;
    }
    const result = await applyTransition(sql, application, decision);
    const outcome = {
      application_id: application.id,
      company: application.company,
      role: application.role,
      from: application.status,
      to: decision.status,
      evidence_event_type: decision.evidence.event_type,
      evidence_message_id: decision.evidence.source_ref,
      evidence_occurred_at: decision.evidence.occurred_at,
      correction: Boolean(decision.correction)
    };
    if (result.verified) {
      outcomes.push({ ...outcome, verified:true });
      application.status = decision.status;
    } else {
      failures.push({ ...outcome, verified:false, observed:result.observed });
    }
  }

  const reviews = await sql`
    SELECT id, source_ref, occurred_at, company, role, summary, reason, candidate_ids
    FROM workspace_career_email_reviews
    WHERE resolution IS NULL
    ORDER BY occurred_at DESC
    LIMIT 50
  `;
  const openReviews = await sql`SELECT COUNT(*)::int AS count FROM workspace_career_email_reviews WHERE resolution IS NULL`;

  return {
    ok: failures.length === 0,
    outcomes,
    failures,
    counts: {
      ...counts,
      applications_changed: outcomes.length,
      already_current: alreadyCurrent,
      review_open: Number(openReviews[0]?.count || 0),
      historical_reviews_retired: historicalRetired
    },
    reviews,
    diagnostics
  };
}
