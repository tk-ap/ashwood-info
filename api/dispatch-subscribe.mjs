import { getSql, json, normalizeEmail, sendAgentMail, unsubscribeSignature, validEmail } from "./_dispatch.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { ok: false, error: "Method not allowed" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    if (body.website) return json(res, 200, { ok: true });

    const email = normalizeEmail(body.email);
    const name = String(body.name || "").trim();
    const interest = String(body.interest || "").trim().slice(0, 1200) || null;
    const source = String(body.source || "ashwood_connect").trim().slice(0, 120) || "ashwood_connect";

    if (!name || name.length > 160) return json(res, 400, { ok: false, error: "Please enter your name." });
    if (!validEmail(email) || email.length > 320) return json(res, 400, { ok: false, error: "Please enter a valid email address." });

    const sql = getSql();
    const rows = await sql`
      INSERT INTO dispatch_subscribers (email, name, interest, source, status, subscribed_at, unsubscribed_at, updated_at)
      VALUES (${email}, ${name}, ${interest}, ${source}, 'subscribed', NOW(), NULL, NOW())
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        interest = EXCLUDED.interest,
        source = EXCLUDED.source,
        status = 'subscribed',
        subscribed_at = CASE WHEN dispatch_subscribers.status = 'unsubscribed' THEN NOW() ELSE dispatch_subscribers.subscribed_at END,
        unsubscribed_at = NULL,
        updated_at = NOW()
      RETURNING email, name
    `;

    const sig = unsubscribeSignature(email);
    const unsubscribeUrl = sig
      ? `https://ashwood-info.vercel.app/api/dispatch-unsubscribe?email=${encodeURIComponent(email)}&sig=${encodeURIComponent(sig)}`
      : null;

    let emailSent = false;
    try {
      const receipt = await sendAgentMail({
        to: email,
        subject: "You’re on the ASHWOOD Dispatch list",
        text: [
          `Hi ${rows[0]?.name || name},`,
          "",
          "You’re on the list for ASHWOOD Dispatch.",
          "",
          "Dispatch is sent when there is something worth sending — essays and notes on AI, creativity, learning, systems, culture, and the thinking behind the work.",
          "",
          "The full archive stays public here:",
          "https://ashwood-info.vercel.app/dispatch",
          "",
          unsubscribeUrl ? `Unsubscribe anytime: ${unsubscribeUrl}` : "",
          "",
          "— ASHWOOD",
        ].filter(Boolean).join("\n"),
      });
      if (receipt.messageId) {
        await sql`UPDATE dispatch_subscribers SET welcome_message_id = ${receipt.messageId}, updated_at = NOW() WHERE email = ${email}`;
      }
      emailSent = receipt.provider === "agentmail";
    } catch (emailError) {
      console.error("Dispatch welcome email failed", emailError);
    }

    return json(res, 201, { ok: true, emailSent });
  } catch (error) {
    console.error("Dispatch subscription failed", error);
    return json(res, 500, { ok: false, error: "Could not save your subscription. Please try again." });
  }
}
