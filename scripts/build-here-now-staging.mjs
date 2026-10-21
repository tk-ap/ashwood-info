#!/usr/bin/env node
/**
 * Build the static artifact for ASHWOOD's one stable here.now sandbox.
 *
 * The artifact begins with the current public ASHWOOD source, excludes every
 * runtime/private surface, then mounts the separately-built Workspace V2
 * static demo beneath /workspace/. It never edits a source checkout.
 *
 * Usage:
 *   node scripts/build-here-now-staging.mjs /tmp/new-output \
 *     --workspace-static /absolute/workspace/.output/public \
 *     --workspace-source-ref <immutable-commit-sha>
 */
import { execFileSync } from "node:child_process";
import { access, copyFile, lstat, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, extname, isAbsolute, relative, resolve, sep } from "node:path";

const [destinationArg, ...flags] = process.argv.slice(2);
const flag = (name) => {
  const index = flags.indexOf(name);
  return index >= 0 ? flags[index + 1] : undefined;
};
const workspaceStaticArg = flag("--workspace-static");
const workspaceSourceRef = flag("--workspace-source-ref");

if (!destinationArg || !isAbsolute(destinationArg)) {
  throw new Error("Pass a new, absolute output directory.");
}
if (!workspaceStaticArg || !isAbsolute(workspaceStaticArg)) {
  throw new Error("Pass --workspace-static as an absolute path to a verified static build.");
}
if (!workspaceSourceRef || !/^[0-9a-f]{7,64}$/i.test(workspaceSourceRef)) {
  throw new Error("Pass --workspace-source-ref as an immutable commit SHA.");
}

const root = resolve(process.cwd());
const destination = resolve(destinationArg);
const workspaceStatic = resolve(workspaceStaticArg);
const tmpRoot = resolve("/tmp");
if (destination === root || !destination.startsWith(`${tmpRoot}${sep}`)) {
  throw new Error("The artifact must be a new directory below /tmp, never a source checkout.");
}
try {
  await access(destination);
  throw new Error(`Refusing to replace existing artifact: ${destination}`);
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

const publicExtensions = new Set([
  ".css", ".gif", ".html", ".ico", ".jpeg", ".jpg", ".js", ".mjs", ".mp3",
  ".png", ".svg", ".txt", ".wav", ".webp", ".woff", ".woff2", ".xml",
]);
const excludedRoots = new Set([".agent-os", ".github", ".herenow", "api", "data", "docs", "node_modules", "scripts", "tests", "workspace"]);
const requiredPublicPaths = ["index.html", "career/index.html", "guide/index.html", "v3-nav.js"];
const requiredWorkspacePaths = [
  "workspace/index.html", "workspace/build/index.html", "workspace/evidence/index.html",
  "workspace/network/index.html", "workspace/operator/index.html", "workspace/self/index.html",
  "workspace/work/index.html", "workspace/work/studio/index.html",
];
const forbiddenText = [
  "Northwind", "The Long Field", "Run #214", "LG-0921", "mighty-yoga-pgph",
  "82358ab", "https://drive.google.com/file/d/17xoV4qzS6Tr0CA-kgWbfgo_MFVBYUa7b",
];
const credentialPatterns = [
  /hnk_[a-z0-9]+/i,
  /postgres(?:ql)?:\/\//i,
  /(?:DATABASE_URL|NEON_[A-Z0-9_]*|WORKSPACE_[A-Z0-9_]*TOKEN)\s*[:=]/,
  /authorization\s*:\s*bearer\s+[a-z0-9._-]+/i,
  /BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY/,
];

const isPublishablePublicFile = (path) => {
  const parts = path.split("/");
  if (excludedRoots.has(parts[0])) return false;
  if (path === ".gitignore" || path.startsWith(".env") || path.endsWith(".md") || path.endsWith(".yaml") || path.endsWith(".yml")) return false;
  return publicExtensions.has(extname(path).toLowerCase());
};

const ensureInside = (base, candidate, description) => {
  if (candidate !== base && !candidate.startsWith(`${base}${sep}`)) throw new Error(`Unsafe ${description}: ${candidate}`);
};

async function copyInto(sourceRoot, targetRoot, relativePath = "") {
  const current = resolve(sourceRoot, relativePath);
  const info = await lstat(current);
  if (info.isSymbolicLink()) throw new Error(`Refusing symlink in static input: ${relativePath || "."}`);
  if (info.isDirectory()) {
    for (const entry of await readdir(current)) {
      await copyInto(sourceRoot, targetRoot, relativePath ? `${relativePath}/${entry}` : entry);
    }
    return;
  }
  const target = resolve(targetRoot, relativePath);
  ensureInside(targetRoot, target, "output path");
  await mkdir(dirname(target), { recursive: true });
  await copyFile(current, target);
}

const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "buffer" })
  .toString("utf8").split("\0").filter(Boolean).filter(isPublishablePublicFile);

for (const path of ["index.html", "assets"]) {
  try { await stat(resolve(workspaceStatic, path)); }
  catch { throw new Error(`Workspace static input is incomplete: missing ${path}`); }
}

await mkdir(destination, { recursive: true });
for (const path of tracked) {
  const source = resolve(root, path);
  const target = resolve(destination, path);
  ensureInside(destination, target, "public output path");
  await mkdir(dirname(target), { recursive: true });
  await copyFile(source, target);
}
await copyInto(workspaceStatic, resolve(destination, "workspace"));

async function collectFiles(dir, base = dir, files = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Refusing symlink in artifact: ${relative(base, full)}`);
    if (entry.isDirectory()) await collectFiles(full, base, files);
    else files.push(relative(base, full));
  }
  return files;
}

for (const path of [...requiredPublicPaths, ...requiredWorkspacePaths]) {
  try { await stat(resolve(destination, path)); }
  catch { throw new Error(`Incomplete staging artifact: missing ${path}`); }
}

const emittedPaths = await collectFiles(destination);
for (const path of emittedPaths) {
  if (path.startsWith("api/") || path.startsWith("data/") || path.startsWith(".agent-os/") || path.endsWith(".md") || path.endsWith(".json")) {
    throw new Error(`Non-public source leaked into the staging artifact: ${path}`);
  }
  const full = resolve(destination, path);
  if (!publicExtensions.has(extname(path).toLowerCase()) && !path.endsWith("_headers")) {
    throw new Error(`Unexpected file type in the staging artifact: ${path}`);
  }
  if (!/\.(?:css|html|js|mjs|svg|txt)$/i.test(path)) continue;
  const text = await readFile(full, "utf8");
  for (const marker of forbiddenText) {
    if (text.includes(marker)) throw new Error(`Forbidden prior fixture or private reference leaked: ${marker} in ${path}`);
  }
  for (const pattern of credentialPatterns) {
    if (pattern.test(text)) throw new Error(`Credential-like content leaked into ${path}`);
  }
}

const workspaceIndex = await readFile(resolve(destination, "workspace/index.html"), "utf8");
if (!workspaceIndex.includes("Demo data") || !workspaceIndex.includes("demo sandbox")) {
  throw new Error("Workspace output is not visibly labelled as the demo sandbox.");
}

const manifest = {
  format: "ashwood-here-now-staging-v2",
  public_source_commit: sourceCommit,
  public_source_base: "https://ashwood-info.vercel.app/",
  workspace_source_repository: "tk-ap/ashwood-command-center",
  workspace_source_ref: workspaceSourceRef,
  workspace_mode: "DEMO_ONLY_NO_PRIVATE_API_OR_RECORDS",
  generated_at: new Date().toISOString(),
  file_count: emittedPaths.length,
  required_paths: [...requiredPublicPaths, ...requiredWorkspacePaths],
};
await writeFile(resolve(destination, "staging-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ output: destination, ...manifest }));
