import { createHash, randomBytes } from "node:crypto";
import { getSql, normalizeEmail, sendAgentMail, validEmail } from "./_dispatch.mjs";

const endpoint = "https://ashwood-info.vercel.app/api/dispatch-subscribe?list=music";
const tokenPattern = /^[a-f0-9]{64}$/;
const digest = token => createHash("sha256").update(token).digest("hex");

function redirect(res, status) {
  res.statusCode = 303;
  res.setHeader("Location", `/music/?releases=${status}#music-signup-title`);
  res.end();
}

export async function musicSubscription(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  const action = req.query?.action;
  try {
    if (req.method === "GET") {
      const token = String(req.query?.token || "");
      if (!["confirm", "unsubscribe"].includes(action) || !tokenPattern.test(token)) {
        return redirect(res, "expired");
      }
      const label = action === "confirm" ? "Confirm release updates" : "Unsubscribe from release updates";
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.end(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${label} · t.kap</title><main><h1>${label}</h1><form method="post"><input type="hidden" name="token" value="${token}"><button>${label}</button></form></main></html>`);
    }

    const body = typeof req.body === "object" && req.body
      ? req.body : Object.fromEntries(new URLSearchParams(String(req.body || "")));
    if (action === "confirm" || action === "unsubscribe") {
      const token = String(body.token || "");
      if (!tokenPattern.test(token)) return redirect(res, "expired");
      const sql = getSql();
      if (action === "unsubscribe") {
        const removed = await sql`DELETE FROM music_release_subscribers
          WHERE token_hash = ${digest(token)} RETURNING email`;
        return redirect(res, removed.length ? "unsubscribed" : "expired");
      }
      const confirmed = await sql`UPDATE music_release_subscribers
        SET confirmed_at = COALESCE(confirmed_at, NOW())
        WHERE token_hash = ${digest(token)}
          AND (confirmed_at IS NOT NULL OR requested_at > NOW() - INTERVAL '24 hours')
        RETURNING email`;
      return redirect(res, confirmed.length ? "confirmed" : "expired");
    }

    const email = normalizeEmail(body.email);
    const name = String(body.first_name || "").trim();
    if (!validEmail(email) || email.length > 320 || name.length > 80) return redirect(res, "invalid");
    if (!process.env.AGENTMAIL_API_KEY?.trim()) return redirect(res, "error");

    const sql = getSql();
    await sql`CREATE TABLE IF NOT EXISTS music_release_subscribers (
      email text PRIMARY KEY, first_name text, token_hash text NOT NULL UNIQUE,
      requested_at timestamptz NOT NULL DEFAULT NOW(), confirmed_at timestamptz
    )`;
    const token = randomBytes(32).toString("hex");
    const tokenHash = digest(token);
    const pending = await sql`INSERT INTO music_release_subscribers (email, first_name, token_hash)
      VALUES (${email}, ${name || null}, ${tokenHash})
      ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name,
        token_hash = EXCLUDED.token_hash, requested_at = NOW()
      WHERE music_release_subscribers.confirmed_at IS NULL
        AND music_release_subscribers.requested_at < NOW() - INTERVAL '15 minutes'
      RETURNING email`;
    if (pending.length) {
      try {
        await sendAgentMail({
          inbox: "ashwood.info@agentmail.to",
          to: email,
          subject: "Confirm your t.kap release updates",
          text: `Confirm that you want new tracks and lyric videos from t.kap:\n${endpoint}&action=confirm&token=${token}\n\nCancel this signup or unsubscribe whenever you want:\n${endpoint}&action=unsubscribe&token=${token}`
        });
      } catch (error) {
        await sql`DELETE FROM music_release_subscribers WHERE token_hash = ${tokenHash} AND confirmed_at IS NULL`;
        throw error;
      }
    }
    return redirect(res, "pending");
  } catch {
    console.error("Music release subscription failed");
    return redirect(res, "error");
  }
}
