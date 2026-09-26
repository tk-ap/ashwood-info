import { getSql, json, requireSession, sameOrigin } from './_workspace.mjs';
import { ensureCareerSchema } from './_career-ops-handler.mjs';
import { ensureGmailSyncSchema, syncCareerGmail } from './_career-gmail-pipeline.mjs';

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

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

export function gmailClient(auth, startHistoryId=null) {
  async function recentMessageIds() {
    const response = await fetch(
      `${GMAIL_API}/messages?maxResults=50&q=${encodeURIComponent('newer_than:30d -category:promotions -category:social')}`,
      { headers:auth }
    );
    if (!response.ok) throw new Error('Unable to list Career Gmail messages');
    return ((await response.json()).messages || []).map(item => item.id);
  }

  async function historyMessageIds() {
    if (!startHistoryId) return null;
    const ids = new Set();
    let pageToken = null;
    for (let page = 0; page < 5; page += 1) {
      const query = new URLSearchParams({
        startHistoryId:String(startHistoryId),
        historyTypes:'messageAdded',
        maxResults:'100'
      });
      if (pageToken) query.set('pageToken', pageToken);
      const response = await fetch(`${GMAIL_API}/history?${query.toString()}`, { headers:auth });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Unable to read Career Gmail history');
      const body = await response.json();
      for (const entry of body.history || []) {
        for (const added of entry.messagesAdded || []) {
          if (added.message?.id) ids.add(String(added.message.id));
        }
      }
      pageToken = body.nextPageToken || null;
      if (!pageToken) break;
    }
    return [...ids];
  }

  return {
    async listMessageIds() {
      const incremental = await historyMessageIds();
      return incremental === null ? recentMessageIds() : incremental;
    },
    async getMessage(id) {
      // Full format: ATS decision language usually sits past the 200-character snippet.
      // The body is read for classification only and is not persisted.
      const response = await fetch(`${GMAIL_API}/messages/${encodeURIComponent(id)}?format=full`, { headers:auth });
      if (!response.ok) throw new Error('Unable to read Career Gmail message');
      return response.json();
    }
  };
}

export default async function handler(req, res) {
  try {
    const session = await requireSession(req);
    if (!session) return json(res, 401, { ok:false, error:'Unauthorized' });
    if (req.method !== 'POST') return json(res, 405, { ok:false, error:'Method not allowed' });
    if (!sameOrigin(req)) return json(res, 403, { ok:false, error:'Origin not allowed' });

    const sql = getSql();
    await ensureCareerSchema(sql);
    await ensureGmailSyncSchema(sql);
    const token = await accessToken();
    const auth = { Authorization: `Bearer ${token}` };

    const profileResponse = await fetch(`${GMAIL_API}/profile`, { headers:auth });
    if (!profileResponse.ok) throw new Error('Unable to read delegated Gmail profile');
    const profile = await profileResponse.json();
    if (String(profile.emailAddress).toLowerCase() !== 'hire.tkashwood@gmail.com') {
      return json(res, 409, { ok:false, error:'Delegated Gmail account does not match Career Ops account' });
    }

    const priorSync = await sql`
      SELECT last_history_id
      FROM workspace_career_gmail_sync
      WHERE account = ${profile.emailAddress}
      LIMIT 1
    `;
    const result = await syncCareerGmail({
      sql,
      gmail:gmailClient(auth, priorSync[0]?.last_history_id || null)
    });

    await sql`
      INSERT INTO workspace_career_gmail_sync (account, last_history_id, last_synced_at, updated_at)
      VALUES (${profile.emailAddress}, ${profile.historyId || null}, NOW(), NOW())
      ON CONFLICT (account) DO UPDATE SET
        last_history_id = EXCLUDED.last_history_id,
        last_synced_at = NOW(),
        updated_at = NOW()
    `;

    if (!result.ok) {
      return json(res, 500, { ...result, account:profile.emailAddress, code:'RECONCILIATION_FAILED', error:'Tracker update could not be verified' });
    }
    return json(res, 200, { ...result, account:profile.emailAddress });
  } catch (error) {
    console.error('workspace career gmail sync failed', error);
    if (error.code === 'GMAIL_NOT_CONFIGURED') {
      return json(res, 503, { ok:false, code:error.code, error:error.message });
    }
    return json(res, 500, { ok:false, error:'Career Gmail sync failed' });
  }
}
