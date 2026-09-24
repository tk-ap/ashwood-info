import { json, requireSession, sameOrigin } from './_workspace.mjs';

/**
 * Server-enforced Paper Lab access probe.
 *
 * This does not expose or forward the workspace session token. A future
 * independent Paper Lab host must redeem a short-lived server-side handoff;
 * until that receiver exists, this endpoint deliberately does not mint a
 * cross-site credential.
 */
export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'Method not allowed' });
    if (!sameOrigin(req)) return json(res, 403, { ok: false, error: 'Origin not allowed' });
    const session = await requireSession(req);
    if (!session) return json(res, 401, { ok: false, authenticated: false });
    return json(res, 200, {
      ok: true,
      authenticated: true,
      audience: 'paper-lab',
      handoff_ready: false,
      note: 'Independent-site handoff remains disabled until a trusted receiver can redeem one-time tickets server-side.'
    });
  } catch (error) {
    console.error('paper lab access check failed', error);
    return json(res, 500, { ok: false, error: 'Paper Lab access check failed' });
  }
}
