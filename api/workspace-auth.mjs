import { clearSession, getSql, hashPassphrase, issueSession, json, parseBody, requireSession, sameOrigin, sha256, verifyPassphrase } from './_workspace.mjs';

export default async function handler(req, res) {
  try {
    const sql = getSql();
    if (req.method === 'GET') {
      const authRows = await sql`SELECT pass_hash IS NOT NULL AS configured, bootstrap_used_at FROM workspace_auth WHERE id = 'owner' LIMIT 1`;
      const session = await requireSession(req);
      return json(res, 200, { ok: true, configured: Boolean(authRows[0]?.configured), authenticated: Boolean(session), bootstrap_used: Boolean(authRows[0]?.bootstrap_used_at) });
    }

    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });
    if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'Origin not allowed' });
    const body = parseBody(req);
    const action = String(body.action || 'login');

    if (action === 'logout') {
      const session = await requireSession(req);
      if (session) await sql`DELETE FROM workspace_sessions WHERE token_hash = ${sha256(session.token)}`;
      clearSession(res);
      return json(res, 200, { ok: true });
    }

    const rows = await sql`SELECT pass_salt, pass_hash, bootstrap_hash, bootstrap_used_at FROM workspace_auth WHERE id = 'owner' LIMIT 1`;
    const auth = rows[0];
    if (!auth) return json(res, 500, { ok: false, error: 'Workspace auth is not initialized' });

    if (action === 'setup') {
      if (auth.bootstrap_used_at || auth.pass_hash) return json(res, 409, { ok: false, error: 'Workspace setup is already complete' });
      const bootstrap = String(body.bootstrap || '');
      const passphrase = String(body.passphrase || '');
      if (sha256(bootstrap) !== auth.bootstrap_hash) return json(res, 403, { ok: false, error: 'Invalid setup token' });
      if (passphrase.length < 12) return json(res, 400, { ok: false, error: 'Passphrase must be at least 12 characters' });
      const { salt, hash } = hashPassphrase(passphrase);
      await sql`UPDATE workspace_auth SET pass_salt = ${salt}, pass_hash = ${hash}, bootstrap_used_at = NOW(), updated_at = NOW() WHERE id = 'owner'`;
      await issueSession(res);
      return json(res, 200, { ok: true, authenticated: true });
    }

    if (action === 'login') {
      const passphrase = String(body.passphrase || '');
      if (!verifyPassphrase(passphrase, auth.pass_salt, auth.pass_hash)) return json(res, 403, { ok: false, error: 'Invalid passphrase' });
      await sql`DELETE FROM workspace_sessions WHERE expires_at <= NOW()`;
      await issueSession(res);
      return json(res, 200, { ok: true, authenticated: true });
    }

    return json(res, 400, { ok: false, error: 'Unknown action' });
  } catch (error) {
    console.error('workspace auth failed', error);
    return json(res, 500, { ok: false, error: 'Workspace auth failed' });
  }
}
