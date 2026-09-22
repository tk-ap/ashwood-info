#!/usr/bin/env node
// Reconcile the Design Implementation tracker (ashwood-info#149) against canonical evidence.
//
//   node scripts/reconcile-design-implementation.mjs            write api/_design-implementation.mjs
//   node scripts/reconcile-design-implementation.mjs --check    print the summary, write nothing
//
// Read-only. Sources, by authority:
//   GitHub  (gh api)      PR state, merge commits, ancestry, changed files, and visual-verification
//                         records posted as structured comments on ashwood-info#149
//   Vercel  (vercel api)  which deployment, and therefore which git revision, each production
//                         domain is actually serving. A GitHub "deployment success" is not
//                         enough: a CLI deploy can replace it (see AIL-DRAG-GRID).
//   AgentOS               runtime items stay capped at "merged" until the governed activation.
//
// Verification record format (a comment on ashwood-info#149):
//   <!-- design-verified
//   id: ASH-WS-SHELL
//   revision: <full sha that was live when verified>
//   url: https://...
//   viewports: 1404x840, 390x844
//   exercised: what was actually clicked / toggled / dragged
//   result: pass
//   -->
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { DECISIONS, STALE_REFERENCES } from "../api/_design-decisions.mjs";
import { deriveLifecycle, summarize } from "../api/_design-lifecycle.mjs";

const TRACKER = { repo: "tk-ap/ashwood-info", issue: 149 };
const VERCEL_SCOPE = "alvira2";
const CHECK = process.argv.includes("--check");
const OUT = new URL("../api/_design-implementation.mjs", import.meta.url);

function gh(path) {
  try {
    return JSON.parse(execFileSync("gh", ["api", path], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
  } catch {
    return null;
  }
}

function ghPaged(path) {
  try {
    const out = execFileSync("gh", ["api", "--paginate", "--slurp", path], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return JSON.parse(out).flat();
  } catch {
    return [];
  }
}

const liveCache = new Map();
function liveRevision(live) {
  if (!live?.domain) return { revision: null, source: live?.kind || "none" };
  if (liveCache.has(live.domain)) return liveCache.get(live.domain);
  let result = { revision: null, source: "vercel", note: "Vercel lookup unavailable" };
  try {
    const raw = execFileSync("npx", ["-y", "vercel@latest", "api", `/v13/deployments/${live.domain}`, "--scope", VERCEL_SCOPE],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 120000 });
    const d = JSON.parse(raw);
    const meta = d.meta || {};
    result = {
      revision: meta.githubCommitSha || null,
      ref: meta.githubCommitRef || null,
      deployment: d.id || null,
      deployment_url: d.url ? `https://${d.url}` : null,
      created_at: d.createdAt ? new Date(d.createdAt).toISOString() : null,
      via: d.source || null,
      source: "vercel",
    };
  } catch { /* stays unavailable */ }
  liveCache.set(live.domain, result);
  return result;
}

// true when `target` already contains `commit`; null when GitHub cannot say.
function contains(repo, commit, target) {
  if (!commit || !target) return null;
  if (commit === target) return true;
  const cmp = gh(`repos/${repo}/compare/${commit}...${target}`);
  if (!cmp) return null;
  return cmp.status === "ahead" || cmp.status === "identical";
}

function changedPaths(repo, from, to, prefixes) {
  if (!prefixes?.length || from === to) return [];
  const cmp = gh(`repos/${repo}/compare/${from}...${to}`);
  if (!cmp) return ["(could not compare)"];
  return (cmp.files || []).map(f => f.filename).filter(name => prefixes.some(p => name.startsWith(p)));
}

function verificationRecords() {
  const comments = ghPaged(`repos/${TRACKER.repo}/issues/${TRACKER.issue}/comments?per_page=100`);
  const records = new Map();
  for (const c of comments) {
    for (const block of String(c.body || "").matchAll(/<!--\s*design-verified([\s\S]*?)-->/g)) {
      const fields = Object.fromEntries(block[1].split("\n").map(l => l.match(/^\s*([a-z_]+):\s*(.+?)\s*$/)).filter(Boolean).map(m => [m[1], m[2]]));
      if (!fields.id || !fields.revision || fields.result !== "pass") continue;
      records.set(fields.id, { ...fields, at: c.created_at, comment: c.html_url });   // latest wins
    }
  }
  return records;
}

function reconcile() {
  const records = verificationRecords();
  const items = DECISIONS.map(decision => {
    const repo = decision.impl?.repo;
    const prs = (decision.impl?.prs || []).map(number => {
      const pr = gh(`repos/${repo}/pulls/${number}`);
      return pr
        ? { number, url: pr.html_url, title: pr.title, state: pr.state, merged: Boolean(pr.merged), mergeCommit: pr.merge_commit_sha || null, mergedAt: pr.merged_at, headRef: pr.head?.ref || null }
        : { number, url: `https://github.com/${repo}/pull/${number}`, state: "unknown", merged: false, mergeCommit: null };
    });
    const main = repo ? gh(`repos/${repo}/commits/HEAD`)?.sha || null : null;
    const commitsOnMain = (decision.impl?.commits || []).map(sha => ({ sha, onMain: Boolean(contains(repo, sha, main)) }));

    const live = decision.live?.kind === "agentos-runtime" ? { revision: null, source: "agentos-runtime", note: "Awaits the governed combined AgentOS runtime activation." }
      : repo ? liveRevision(decision.live) : { revision: null, source: "none" };
    const mustContain = [...prs.filter(p => p.merged).map(p => p.mergeCommit), ...commitsOnMain.map(c => c.sha)].filter(Boolean);
    let containsAll = null;
    if (live.revision && mustContain.length) {
      const results = mustContain.map(sha => contains(repo, sha, live.revision));
      containsAll = results.every(r => r === true) ? true : results.some(r => r === false) ? false : null;
      if (results.some(r => r === null) && !results.some(r => r === false)) {
        live.note = "The live revision is not on GitHub, so it cannot be shown to contain this work.";
        containsAll = false;
      }
    }
    if (containsAll === false && !live.note) live.note = "Merged work is not in the revision production is serving.";

    const record = records.get(decision.id) || null;
    let verification = null;
    if (record) {
      const containedInLive = Boolean(live.revision && contains(repo || TRACKER.repo, record.revision, live.revision));
      verification = {
        ...record,
        containedInLive,
        pathsChangedSince: containedInLive ? changedPaths(repo || TRACKER.repo, record.revision, live.revision, decision.paths) : [],
      };
    }
    const facts = { prs, commitsOnMain, main, live: { ...live, containsAll }, verification };
    return { ...decision, facts, lifecycle: deriveLifecycle(decision, facts) };
  });
  return {
    reconciled_at: new Date().toISOString(),
    tracker: `https://github.com/${TRACKER.repo}/issues/${TRACKER.issue}`,
    summary: summarize(items.map(i => ({ ...i, stale_refs: [] }))),
    stale_refs: STALE_REFERENCES,
    items,
  };
}

const snapshot = reconcile();
snapshot.summary.stale = snapshot.items.filter(i => i.lifecycle.stale).length + STALE_REFERENCES.length;
console.log(JSON.stringify(snapshot.summary));
for (const i of snapshot.items) {
  console.log(`${i.id.padEnd(24)} ${i.lifecycle.state.padEnd(10)} verif=${i.lifecycle.verification.padEnd(18)} ${i.lifecycle.blocked ? "BLOCKED " : ""}live=${(i.facts.live.revision || "-").slice(0, 7)}`);
}
if (!CHECK) {
  writeFileSync(OUT, `// GENERATED by scripts/reconcile-design-implementation.mjs. Do not edit by hand.\n// Server-only snapshot for /api/workspace-design (session-protected).\nexport default ${JSON.stringify(snapshot, null, 2)};\n`);
  console.log(`wrote ${OUT.pathname}`);
}
