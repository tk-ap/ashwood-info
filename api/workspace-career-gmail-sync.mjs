import { getSql, json, requireSession, sameOrigin } from './_workspace.mjs';
import { gmailEventId, reconcileCareerEmail } from './_career-reconciliation.mjs';

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

const trim = (value, max = 1000) => {
  const text = String(value ?? '').trim();
  return text ? text.slice(0, max) : null;
};

async function accessToken() {
  const clientId = process.env.CAREER_GMAIL_CLIENT_ID;
  const clientSecret = process.env.CAREER_GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.CAREER_GMAIL_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    const error = new Error('Career Gmail delegated credentials are not configured');
    error.code = 'GMAIL_NOT_CONFIGURED';
    throw error;
  }
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });
  if (!response.ok) throw new Error('Unable to refresh delegated Gmail access');
  return (await response.json()).access_token;
}

function header(message, name) {
  return message.payload?.headers?.find(item => item.name?.toLowerCase() === name.toLowerCase())?.value || '';
}

function classify(subject, snippet) {
  const text = `${subject} ${snippet}`.toLowerCase();
  if (/offer|offer letter/.test(text)) return { eventType:'OFFER', status:'OFFER' };
  if (/interview|schedule.*(call|meeting)|meet with/.test(text)) return { eventType:'INTERVIEW', status:'INTERVIEW' };
  if (/assessment|take-home|take home|coding challenge/.test(text)) return { eventType:'ASSESSMENT', status:'ASSESSMENT' };
  if (/recruiter|talent acquisition|phone screen|screening/.test(text)) return { eventType:'RECRUITER', status:'RECRUITER' };
  if (/unfortunately|not moving forward|other candidates|not selected/.test(text)) return { eventType:'REJECTION', status:'REJECTED' };
  if (/application (received|submitted)|thanks for applying|thank you for applying/.test(text)) return { eventType:'CONFIRMATION', status:'APPLIED' };
  return { eventType:'EMAIL', status:null };
}

async function ensureSyncSchema(sql) {
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
}

async function recordReview(sql, { messageId, occurredAt, subject, from, snippet, resolution }) {
  const id = `career-email-review:gmail:${messageId}`;
  const candidates = resolution.candidates || [];
  await sql`
    INSERT INTO workspace_career_email_reviews (
      id, source, source_ref, occurred_at, company, role, summary, reason, candidate_ids, payload
    ) VALUES (
      ${id}, 'gmail', ${messageId}, ${occurredAt},
      ${candidates.length === 1 ? candidates[0].company : null},
      ${candidates.length === 1 ? candidates[0].role : null},
      ${trim(subject, 1200) || 'Career email requires review'}, ${resolution.reason},
      ${JSON.stringify(candidates.map(candidate => candidate.id))}::jsonb,
      ${JSON.stringify({ from: trim(from, 500), subject: trim(subject, 500), snippet: trim(snippet, 500) })}::jsonb
    ) ON CONFLICT (source, source_ref) DO UPDATE SET
      updated_at = NOW(), reason = EXCLUDED.reason, candidate_ids = EXCLUDED.candidate_ids
  `;
}

export default async function handler(req, res) {
  try {
    const session = await requireSession(req);
    if (!session) return json(res, 401, { ok:false, error:'Unauthorized' });
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
    if (!sameOrigin(req)) return json(res, 403, { ok:false, error:'Origin not allowed' });

    const sql = getSql();
    await ensureSyncSchema(sql);
    const token = await accessToken();
    const auth = { Authorization: `Bearer ${token}` };

    const profileResponse = await fetch(`${GMAIL_API}/profile`, { headers:auth });
    if (!profileResponse.ok) throw new Error('Unable to read delegated Gmail profile');
    const profile = await profileResponse.json();
    if (String(profile.emailAddress).toLowerCase() !== 'hire.tkashwood@gmail.com') {
      return json(res, 409, { ok:false, error:'Delegated Gmail account does not match Career Ops account' });
    }

    const applications = await sql`SELECT id, company, role, job_id, status, submitted_at FROM workspace_career_applications`;

    const listResponse = await fetch(
      `${GMAIL_API}/messages?maxResults=50&q=${encodeURIComponent('newer_than:30d -category:promotions -category:social')}`,
      { headers:auth }
    );
    if (!listResponse.ok) throw new Error('Unable to list Career Gmail messages');
    const list = await listResponse.json();

    let ingested = 0;
    let reviewRequired = 0;
    for (const item of list.messages || []) {
      const duplicate = await sql`
        SELECT 1 FROM workspace_career_events
        WHERE source = 'gmail' AND source_ref = ${item.id}
        LIMIT 1
      `;
      if (duplicate[0]) continue;

      const messageResponse = await fetch(
        `${GMAIL_API}/messages/${encodeURIComponent(item.id)}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        { headers:auth }
      );
      if (!messageResponse.ok) continue;
      const message = await messageResponse.json();
      const subject = header(message, 'Subject');
      const from = header(message, 'From');
      const snippet = message.snippet || '';
      const { eventType, status } = classify(subject, snippet);
      const occurredAt = message.internalDate ? new Date(Number(message.internalDate)).toISOString() : new Date().toISOString();
      const resolution = reconcileCareerEmail(
        applications.filter(application => !['DECLINED', 'CLOSED', 'DEFERRED'].includes(application.status)),
        { subject, from, snippet }
      );
      if (resolution.kind !== 'matched') {
        await recordReview(sql, { messageId:item.id, occurredAt, subject, from, snippet, resolution });
        reviewRequired += 1;
        continue;
      }
      const app = resolution.application;
      const eventId = gmailEventId(item.id);
      const summary = trim(subject, 1200) || 'Career email received';
      const payload = JSON.stringify({
        from: trim(from, 500),
        subject: trim(subject, 500),
        thread_id: message.threadId,
        snippet: trim(snippet, 500)
      });

      await sql`
        INSERT INTO workspace_career_events
          (id, application_id, event_type, occurred_at, source, source_ref, summary, payload)
        VALUES
          (${eventId}, ${app.id}, ${eventType}, ${occurredAt}, 'gmail', ${item.id}, ${summary}, ${payload}::jsonb)
        ON CONFLICT DO NOTHING
      `;

      if (status) {
        await sql`
          UPDATE workspace_career_applications
          SET status = ${status}, updated_at = NOW()
          WHERE id = ${app.id}
        `;
      } else {
        await sql`UPDATE workspace_career_applications SET updated_at = NOW() WHERE id = ${app.id}`;
      }
      ingested += 1;
    }

    await sql`
      INSERT INTO workspace_career_gmail_sync (account, last_history_id, last_synced_at, updated_at)
      VALUES (${profile.emailAddress}, ${profile.historyId || null}, NOW(), NOW())
      ON CONFLICT (account) DO UPDATE SET
        last_history_id = EXCLUDED.last_history_id,
        last_synced_at = NOW(),
        updated_at = NOW()
    `;

    const reviews = await sql`SELECT id, source_ref, occurred_at, company, role, summary, reason, candidate_ids FROM workspace_career_email_reviews ORDER BY occurred_at DESC LIMIT 50`;

    return json(res, 200, {
      ok:true,
      account:profile.emailAddress,
      ingested,
      review_required:reviewRequired,
      checked:(list.messages || []).length,
      reviews
    });
  } catch (error) {
    console.error('workspace career gmail sync failed', error);
    if (error.code === 'GMAIL_NOT_CONFIGURED') {
      return json(res, 503, { ok:false, code:error.code, error:error.message });
    }
    return json(res, 500, { ok:false, error:'Career Gmail sync failed' });
  }
}
