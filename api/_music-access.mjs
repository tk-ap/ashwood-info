import { createHash, randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { get } from "@vercel/blob";
import { getSql, normalizeEmail, validEmail } from "./_dispatch.mjs";
import { musicSubscription } from "./_music-subscription.mjs";

const entryVideo = "hlf.mp4";
const tracks = new Set([entryVideo, "02-havingmyway.mp3", "03-lies.mp3", "04-sorryma.mp3"]);
const hash = value => createHash("sha256").update(value).digest("hex");
const lifetime = 30 * 24 * 60 * 60;

function renderGate(res, error = "", status = 200) {
  res.statusCode = status;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(`<!doctype html><html lang="en" data-music-theme="dark">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>demoDanceR — ASHWOOD</title><link rel="stylesheet" href="/music/music.css?v=night-drive-entry"><style>
.music-entry__video { position: relative; margin-top: 12px; }
.music-entry__video summary { width: fit-content; padding: 10px 14px; border-radius: 5px; color: #17120e; background: #ffcb43; cursor: pointer; font-weight: 700; }
.music-entry__video:not([open]) { position: static; }
.music-entry__video:not([open]) summary::after { position: absolute; inset: 0; content: ""; }
.music-entry__video summary:focus-visible { outline: 2px solid #fff; outline-offset: 4px; }
.music-entry__video .music-entry__back, .music-entry__video[open] .music-entry__watch { display: none; }
.music-entry__video[open] .music-entry__back { display: inline; }
.music-entry__art:has(.music-entry__video[open]) { display: block; padding: 16px; background: #0b0a09; }
.music-entry__art:has(.music-entry__video[open]) > img,
.music-entry__art:has(.music-entry__video[open])::after { display: none; }
.music-entry__art:has(.music-entry__video[open]) .music-entry__intro { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.music-entry__video[open] { margin: 0; }
.music-entry__video[open] summary { margin-bottom: 12px; color: #ffcb43; background: transparent; padding-inline: 0 8px; }
.music-entry__video video { display: block; width: min(100%, 300px); aspect-ratio: 9 / 16; margin-inline: auto; border-radius: 8px; background: #080808; }
.music-entry__video p { margin-top: 10px; text-align: center; }
</style></head>
<body class="music-page music-page--demos"><main class="music-shell music-entry">
<a class="music-entry__home" href="/">ASHWOOD</a>
<section class="music-entry__door" aria-labelledby="music-access-title">
<header class="music-entry__art">
  <img src="/music/media/hlf-feature.webp" alt="" fetchpriority="high">
  <div class="music-entry__intro"><p>t.kap’s listening room</p><h1 id="music-access-title">demoDanceR</h1></div>
  <details class="music-entry__video">
    <summary><span class="music-entry__watch">▶ Watch HLF</span><span class="music-entry__back">← Back to cover</span></summary>
    <video controls playsinline preload="none" poster="/music/media/hlf-feature.webp" src="/music/listen/${entryVideo}" aria-label="HLF lyric video by t.kap"></video>
    <p>t.kap · Produced by Bapop</p>
  </details>
</header>
<div class="music-signup music-entry__form">
<h2>Come in and listen.</h2>
<p>Enter the listening room for the rest of demoDanceR.</p>
<form method="post" action="/music"><fieldset>
<label for="guest-name">Name</label>
<input id="guest-name" name="name" autocomplete="name" placeholder="What should I call you?" maxlength="80" required>
<label for="guest-contact">Email or phone number</label>
<input id="guest-contact" name="contact" placeholder="Where can I drop a line?" maxlength="254" required>
<label class="music-entry__optin"><input type="checkbox" name="updates" value="yes"> <span>Send me occasional t.kap release updates.</span></label>
<button type="submit">Enter listening room <span aria-hidden="true">→</span></button></fieldset>
<p role="status">${error}</p></form>
<details class="listening-pet">
<summary><span class="listening-pet__record" aria-hidden="true"><span class="listening-pet__face"></span></span><span class="listening-pet__label">A note from t.kap</span></summary>
<p>Thanks for trusting me with your info. I’m really happy you’re here. I won’t sell your contact info or share it for anyone else’s marketing. Updates are optional, and if you choose them, you’ll only hear from me about t.kap music. No spam. — t.kap</p>
</details>
</div>
</section></main>
<script>
  const panel = document.querySelector(".music-entry__video");
  const video = panel.querySelector("video");
  panel.querySelector("summary").addEventListener("click", () => {
    if (!panel.open) video.play().catch(() => {});
  });
  panel.addEventListener("toggle", () => {
    if (!panel.open) video.pause();
  });
</script>
</body></html>`);
}

export async function musicAccess(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  const media = req.query?.list === "music-media";
  const track = req.query?.track;
  const isEntryVideo = media && track === entryVideo;
  try {
    const method = req.method;
    if (!["GET", "HEAD", "POST"].includes(method) || (media && method === "POST")) {
      res.statusCode = 405;
      return res.end();
    }
    const session = /(?:^|;\s*)ashwood_music=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || "")?.[1];
    if (method === "POST") {
      const allowedOrigins = new Set(["https://ashwood-info.vercel.app"]);
      if (process.env.VERCEL_ENV === "preview") {
        for (const host of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]) {
          if (host) allowedOrigins.add(`https://${host}`);
        }
      }
      if (req.headers.origin && !allowedOrigins.has(req.headers.origin)) {
        res.statusCode = 403;
        return res.end();
      }
      const body = typeof req.body === "object" && req.body
        ? req.body : Object.fromEntries(new URLSearchParams(String(req.body || "")));
      const name = String(body.name || "").trim();
      const contact = String(body.contact || "").trim();
      const email = normalizeEmail(contact);
      const isEmail = validEmail(email) && email.length <= 254;
      const phone = contact.replace(/[ .()-]/g, "");
      const isPhone = /^\+?[0-9]{10,15}$/.test(phone);
      if (!name || name.length > 80 || (!isEmail && !isPhone)) {
        return renderGate(res, "Enter your name and a valid email or phone number.", 400);
      }
      const token = randomBytes(32).toString("hex");
      const sql = getSql();
      await sql`CREATE TABLE IF NOT EXISTS music_guest_access (
        session_hash text PRIMARY KEY, name text NOT NULL, contact text NOT NULL,
        contact_type text NOT NULL, updates_requested_at timestamptz, expires_at timestamptz NOT NULL
      )`;
      await sql`DELETE FROM music_guest_access WHERE expires_at <= NOW()`;
      await sql`INSERT INTO music_guest_access
        (session_hash, name, contact, contact_type, updates_requested_at, expires_at)
        VALUES (${hash(token)}, ${name}, ${isEmail ? email : phone}, ${isEmail ? "email" : "phone"},
          ${body.updates === "yes" ? new Date().toISOString() : null},
          NOW() + ${lifetime} * INTERVAL '1 second')`;
      res.setHeader("Set-Cookie", `ashwood_music=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${lifetime}`);
      if (isEmail && body.updates === "yes") {
        return musicSubscription({ ...req, query: {}, body: { email, first_name: name } }, res);
      }
      res.statusCode = 303;
      res.setHeader("Location", "/music");
      return res.end();
    }
    if (!isEntryVideo && (!session || !(await getSql()`SELECT 1 FROM music_guest_access
      WHERE session_hash = ${hash(session)} AND expires_at > NOW()`).length)) {
      if (!media) return renderGate(res);
      res.statusCode = 403;
      return res.end();
    }
    if (!media) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.end(method === "HEAD" ? undefined : await readFile(new URL("./_music-listening.html", import.meta.url)));
    }
    if (!tracks.has(track)) {
      res.statusCode = 404;
      return res.end();
    }
    const storeId = process.env.ASHWOOD_MUSIC_STORE_ID?.trim();
    if (!storeId) {
      res.statusCode = 503;
      return res.end();
    }
    const range = req.headers.range;
    const filename = track === entryVideo ? "hlf-credits.mp4" : track;
    const asset = await get(`music/${filename}`, {
      access: "private",
      storeId,
      headers: range ? { Range: range } : undefined
    });
    if (!asset?.stream) {
      res.statusCode = 404;
      return res.end();
    }
    if (asset.headers.has("content-range")) res.statusCode = 206;
    for (const key of ["content-type", "content-length", "content-range", "accept-ranges"]) {
      const value = asset.headers.get(key);
      if (value) res.setHeader(key, value);
    }
    if (method === "HEAD") {
      await asset.stream.cancel();
      return res.end();
    }
    await pipeline(Readable.fromWeb(asset.stream), res);
  } catch {
    console.error("Music access request failed");
    if (!res.headersSent && !res.destroyed) {
      if (!media) return renderGate(res, "The listening room is temporarily unavailable. Please try again later.", 503);
      res.statusCode = 503;
      res.end();
    }
  }
}
