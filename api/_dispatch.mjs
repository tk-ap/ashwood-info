import crypto from "node:crypto";
import { neon } from "@neondatabase/serverless";

export function getSql() {
  const connectionString = process.env.ASHWOOD_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("ASHWOOD_DATABASE_URL is not configured");
  return neon(connectionString);
}

export function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function unsubscribeSignature(email) {
  const secret = process.env.ASHWOOD_UNSUBSCRIBE_SECRET;
  if (!secret) return null;
  return crypto.createHmac("sha256", secret).update(normalizeEmail(email)).digest("hex");
}

export function validUnsubscribeSignature(email, signature) {
  const expected = unsubscribeSignature(email);
  if (!expected || !signature || expected.length !== String(signature).length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(signature)));
}

export async function sendAgentMail({ to, subject, text }) {
  const apiKey = process.env.AGENTMAIL_API_KEY?.trim();
  const inboxId = (process.env.ASHWOOD_AGENTMAIL_INBOX_ID || "ashwood@agentmail.to").trim();
  if (!apiKey) return { provider: "skipped" };

  const response = await fetch(`https://api.agentmail.to/v0/inboxes/${encodeURIComponent(inboxId)}/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ to, subject, text }),
  });

  if (!response.ok) {
    throw new Error(`AgentMail delivery failed (${response.status}): ${await response.text()}`);
  }

  const result = await response.json();
  return { provider: "agentmail", messageId: result.message_id, threadId: result.thread_id };
}

export function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}
