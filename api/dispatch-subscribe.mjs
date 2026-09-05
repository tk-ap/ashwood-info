import { getSql, json, normalizeEmail, sendAgentMail, validEmail } from "./_dispatch.mjs";

function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const raw = String(req.body || "");
  const contentType = String(req.headers?.["content-type"] || "");
  if (contentType.includes("application/json")) return raw ? JSON.parse(raw) : {};
  if (contentType.includes("application/x-www-form-urlencoded")) return Object.fromEntries(new URLSearchParams(raw));
  return {};
}

function isBrowserForm(req) {
  const contentType = String(req.headers?.["content-type"] || "");
  return contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data");
}

function redirect(res, state) {
  res.statusCode = 303;
  res.setHeader("Location", `/connect?dispatch=${encodeURIComponent(state)}#dispatch-title`);
  res.end();
}

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { ok: false, error: "Method not allowed" });

  const browserForm = isBrowserForm(req);

  try {
    const body = parseBody(req);
    if (body.website) return browserForm ? redirect(res, "subscribed") : json(res, 200, { ok: true });

    const email = normalizeEmail(body.email);
    const name = String(body.name || "").trim();
    const interest = String(body.interest || "").trim().slice(0, 1200) || null;
    const source = String(body.source || "ashwood_connect").trim().slice(0, 120) || "ashwood_connect";

    if (!name || name.length > 160) {
      return browserForm ? redirect(res, "invalid") : json(res, 400, { ok: false, error: "Please enter your name." });
    }
    if (!validEmail(email) || email.length > 320) {
      return browserForm ? redirect(res, "invalid") : json(res, 400, { ok: false, error: "Please enter a valid email address." });
    }

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

    let emailSent = false;
    try {
      const receipt = await sendAgentMail({
        to: email,
        subject: "Welcome to ASHWOOD Dispatch",
        text: [
          `Hi ${rows[0]?.name || name},`,
          "",
          "Thanks for subscribing to ASHWOOD Dispatch.",
          "",
          "You’ll receive new Dispatches when they’re published.",
          "",
          "Read the archive:",
          "https://ashwood-info.vercel.app/dispatch",
          "",
          "If you ever want to unsubscribe, reply to any Dispatch email with ‘unsubscribe’.",
          "",
          "TK Ashwood",
          "ASHWOOD",
        ].join("\n"),
      });
      if (receipt.messageId) {
        await sql`UPDATE dispatch_subscribers SET welcome_message_id = ${receipt.messageId}, updated_at = NOW() WHERE email = ${email}`;
      }
      emailSent = receipt.provider === "agentmail";
    } catch (emailError) {
      console.error("Dispatch welcome email failed", emailError);
    }

    return browserForm ? redirect(res, emailSent ? "confirmed" : "subscribed") : json(res, 201, { ok: true, emailSent });
  } catch (error) {
    console.error("Dispatch subscription failed", error);
    return browserForm ? redirect(res, "error") : json(res, 500, { ok: false, error: "Could not save your subscription. Please try again." });
  }
}
