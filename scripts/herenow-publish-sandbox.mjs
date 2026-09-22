import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const CLIENT = "chatgpt/github-actions";
const RESULT_DIR = path.join(ROOT, ".sandbox");
const RESULT_PATH = path.join(RESULT_DIR, "herenow-result.json");

const publicDirs = new Set([
  "assets",
  "audio",
  "portfolio",
  "music",
  "modeling",
  "about",
  "performance",
  "work",
  "sponsor",
  "dive-deeper",
  "journal",
  "dispatch",
  "ai-from-zero",
  "connect",
  "partners",
  "data"
]);

const rootExtensions = new Set([
  ".html", ".css", ".js", ".svg", ".txt", ".xml", ".ico",
  ".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif",
  ".woff", ".woff2", ".ttf", ".otf", ".json"
]);

const rootDeny = new Set([
  "package.json",
  "package-lock.json",
  "vercel.json"
]);

function contentType(file) {
  const ext = path.extname(file).toLowerCase();
  const map = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".txt": "text/plain; charset=utf-8",
    ".xml": "application/xml; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".avif": "image/avif",
    ".ico": "image/x-icon",
    ".mp3": "audio/mpeg",
    ".m4a": "audio/mp4",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".otf": "font/otf"
  };
  return map[ext] || "application/octet-stream";
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

async function collectFiles() {
  const rootEntries = await fs.readdir(ROOT, { withFileTypes: true });
  const candidates = [];

  for (const entry of rootEntries) {
    if (entry.isDirectory() && publicDirs.has(entry.name)) {
      candidates.push(...await walk(path.join(ROOT, entry.name)));
      continue;
    }

    if (!entry.isFile()) continue;
    if (rootDeny.has(entry.name)) continue;
    if (entry.name.startsWith(".")) continue;
    if (!rootExtensions.has(path.extname(entry.name).toLowerCase())) continue;
    candidates.push(path.join(ROOT, entry.name));
  }

  candidates.sort();
  return candidates;
}

async function sha256(file) {
  const data = await fs.readFile(file);
  return crypto.createHash("sha256").update(data).digest("hex");
}

async function buildManifest(files) {
  const manifest = [];
  for (const file of files) {
    const stat = await fs.stat(file);
    manifest.push({
      path: path.relative(ROOT, file).split(path.sep).join("/"),
      size: stat.size,
      contentType: contentType(file),
      hash: await sha256(file)
    });
  }
  return manifest;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : {}; }
  catch { body = { raw: text.slice(0, 1000) }; }

  if (!response.ok) {
    const message = body?.message || body?.error || response.statusText;
    throw new Error(`${response.status} ${message}`);
  }
  return body;
}

async function uploadFiles(createResponse, manifestByPath) {
  const uploads = createResponse?.upload?.uploads || [];
  const concurrency = 6;
  let cursor = 0;

  async function worker() {
    while (cursor < uploads.length) {
      const index = cursor++;
      const upload = uploads[index];
      const meta = manifestByPath.get(upload.path);
      if (!meta) throw new Error(`Missing local manifest entry for ${upload.path}`);

      const local = path.join(ROOT, upload.path);
      const bytes = await fs.readFile(local);
      const headers = {
        ...(upload.headers || {}),
        "Content-Type": meta.contentType
      };

      const response = await fetch(upload.url, {
        method: upload.method || "PUT",
        headers,
        body: bytes
      });

      if (!response.ok) {
        throw new Error(`Upload failed for ${upload.path}: ${response.status} ${response.statusText}`);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, Math.max(1, uploads.length)) }, () => worker()));
}

async function main() {
  await fs.mkdir(RESULT_DIR, { recursive: true });

  const files = await collectFiles();
  if (!files.some(file => path.relative(ROOT, file) === "index.html")) {
    throw new Error("index.html was not selected for the sandbox");
  }

  const manifest = await buildManifest(files);
  const totalBytes = manifest.reduce((sum, item) => sum + item.size, 0);
  const manifestByPath = new Map(manifest.map(item => [item.path, item]));

  console.log(`Preparing ASHWOOD public-home sandbox: ${manifest.length} files / ${Math.round(totalBytes / 1024 / 1024)} MiB`);

  const createResponse = await fetchJson("https://here.now/api/v1/publish", {
    method: "POST",
    headers: {
      "X-HereNow-Client": CLIENT,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      files: manifest,
      ttlSeconds: 86400,
      displayName: "ASHWOOD / GRAVITY — parity sandbox",
      displayDescription: "Temporary parity baseline for the ASHWOOD public-home Gravity interaction prototype."
    })
  });

  if (!createResponse.claimUrl || !createResponse.claimToken) {
    throw new Error("Anonymous here.now publish did not return the required claim credentials");
  }

  await uploadFiles(createResponse, manifestByPath);

  const finalizeUrl = createResponse?.upload?.finalizeUrl;
  const versionId = createResponse?.upload?.versionId;
  if (!finalizeUrl || !versionId) throw new Error("here.now create response omitted finalize metadata");

  const finalizeResponse = await fetchJson(finalizeUrl, {
    method: "POST",
    headers: {
      "X-HereNow-Client": CLIENT,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ versionId })
  });

  const siteUrl = finalizeResponse.siteUrl || createResponse.siteUrl;
  if (!siteUrl) throw new Error("here.now finalize response omitted siteUrl");

  const verify = await fetch(siteUrl, { redirect: "follow" });
  const html = await verify.text();
  const paritySignals = {
    status200: verify.ok,
    title: /<title>ASHWOOD<\/title>/i.test(html),
    thesis: /I follow ideas/i.test(html),
    manifestations: /manifestations/i.test(html),
    instinct: /The instinct/i.test(html)
  };

  if (!paritySignals.status200 || !paritySignals.title || !paritySignals.thesis) {
    throw new Error(`Sandbox verification failed: ${JSON.stringify(paritySignals)}`);
  }

  const result = {
    siteUrl,
    slug: finalizeResponse.slug || createResponse.slug,
    claimUrl: createResponse.claimUrl,
    claimToken: createResponse.claimToken,
    expiresAt: createResponse.expiresAt || finalizeResponse?.publishStatus?.expiresAt || null,
    currentVersionId: finalizeResponse.currentVersionId || versionId,
    publishStatus: finalizeResponse.publishStatus || null,
    files: manifest.length,
    bytes: totalBytes,
    paritySignals,
    source: {
      repository: "tk-ap/ashwood-info",
      ref: process.env.GITHUB_SHA || "unknown"
    }
  };

  await fs.writeFile(RESULT_PATH, JSON.stringify(result, null, 2) + "\n", { mode: 0o600 });

  // Do not print claimToken or claimUrl into public Actions logs.
  console.log(`Sandbox finalized and verified. Slug: ${result.slug}; version: ${result.currentVersionId}`);
  console.log(`Parity signals: ${JSON.stringify(paritySignals)}`);
}

main().catch(error => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
