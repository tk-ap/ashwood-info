import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { deriveLifecycle, summarize, STATES } from "../api/_design-lifecycle.mjs";
import { DECISIONS, STALE_REFERENCES } from "../api/_design-decisions.mjs";
import snapshot from "../api/_design-implementation.mjs";
import designHandler from "../api/_design-handler.mjs";
import { matchesFilter, nextStep, groupByProduct } from "../workspace/design-implementation.mjs";

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const decision = (extra = {}) => ({ id: "X", product: "P", title: "t", ...extra });
const merged = { prs: [{ number: 1, merged: true, mergeCommit: "a" }] };

test("each lifecycle state is distinct and derived from evidence", () => {
  assert.equal(deriveLifecycle(decision()).state, "discussed");
  assert.equal(deriveLifecycle(decision({ design_refs: [{ number: 1 }] })).state, "designed");
  assert.equal(deriveLifecycle(decision(), { prs: [{ number: 1, merged: false }] }).state, "built", "an open PR is built, not merged");
  assert.equal(deriveLifecycle(decision(), { commitsOnMain: [{ sha: "c", onMain: false }] }).state, "built");
  assert.equal(deriveLifecycle(decision(), merged).state, "merged", "a merge without live evidence is not deployed");
  assert.equal(deriveLifecycle(decision(), { ...merged, live: { containsAll: null } }).state, "merged");
  assert.equal(deriveLifecycle(decision(), { ...merged, live: { containsAll: true } }).state, "deployed");
});

test("visually verified requires a record contained in the live revision, with no later changes", () => {
  const live = { containsAll: true, revision: "r2" };
  assert.equal(deriveLifecycle(decision(), { ...merged, live }).state, "deployed", "READY/live is not verified");
  const current = { revision: "r1", containedInLive: true, pathsChangedSince: [] };
  assert.equal(deriveLifecycle(decision(), { ...merged, live, verification: current }).state, "verified");
  const changed = { ...current, pathsChangedSince: ["workspace/app.js"] };
  const reverify = deriveLifecycle(decision(), { ...merged, live, verification: changed });
  assert.equal(reverify.state, "deployed");
  assert.equal(reverify.verification, "reverify");
  const elsewhere = deriveLifecycle(decision(), { ...merged, live, verification: { ...current, containedInLive: false } });
  assert.equal(elsewhere.verification, "different-revision");
  const notLive = deriveLifecycle(decision(), { ...merged, live: { containsAll: false }, verification: current });
  assert.equal(notLive.state, "merged");
  assert.equal(notLive.verification, "not-live", "a check cannot outrank what production actually serves");
});

test("external blockers and stale items stay visible", () => {
  assert.equal(deriveLifecycle(decision({ blocker: "owner action" }), merged).blocked, true);
  const staleItem = deriveLifecycle(decision({ stale: true }));
  assert.equal(staleItem.stale, true);
  assert.equal(staleItem.unfinished, false);
  const drift = deriveLifecycle(decision(), { ...merged, live: { containsAll: false, note: "serving another branch" } });
  assert.equal(drift.blocked, true, "merged work missing from production is surfaced");
});

test("summary answers the eight questions without double counting", () => {
  const items = [
    { lifecycle: deriveLifecycle(decision(), { ...merged, live: { containsAll: true }, verification: { containedInLive: true, pathsChangedSince: [] } }) },
    { lifecycle: deriveLifecycle(decision(), merged) },
    { lifecycle: deriveLifecycle(decision({ blocker: "b" }), { prs: [{ merged: false }] }) },
    { lifecycle: deriveLifecycle(decision({ stale: true })) },
  ];
  const s = summarize(items);
  assert.deepEqual([s.agreed, s.inCode, s.merged, s.live, s.verified, s.blocked, s.unfinished], [3, 3, 2, 1, 1, 1, 2]);
  assert.equal(s.stale, 1);
});

test("the generated snapshot covers every agreed decision and claims nothing without evidence", () => {
  assert.deepEqual(snapshot.items.map(i => i.id), DECISIONS.map(d => d.id));
  assert.equal(new Set(DECISIONS.map(d => d.id)).size, DECISIONS.length, "stable, unique ids");
  assert.ok(Date.parse(snapshot.reconciled_at));
  for (const item of snapshot.items) {
    assert.ok(STATES.includes(item.lifecycle.state), item.id);
    if (item.lifecycle.state === "verified") assert.ok(item.facts.verification?.comment, `${item.id} verified without a record`);
    if (item.lifecycle.stateIndex >= STATES.indexOf("deployed")) assert.equal(item.facts.live.containsAll, true, `${item.id} live without live evidence`);
    if (item.blocker) assert.equal(item.lifecycle.blocked, true, item.id);
  }
  assert.equal(snapshot.stale_refs.length, STALE_REFERENCES.length);
});

test("tracker data is served only through the session-protected API", async () => {
  // No public static copy of the snapshot or decisions (they reference a private repository).
  assert.equal(readdirSync(new URL("../workspace/", import.meta.url)).some(f => /design.*\.json$/.test(f)), false);
  for (const file of ["_design-decisions.mjs", "_design-implementation.mjs", "_design-handler.mjs", "_design-lifecycle.mjs"]) {
    assert.ok(existsSync(new URL(`../api/${file}`, import.meta.url)), `${file} is a server-only helper`);
  }
  const res = { statusCode: 0, headers: {}, body: "", status(c) { this.statusCode = c; return this; }, setHeader(k, v) { this.headers[k] = v; return this; }, end(b) { this.body = b; } };
  await designHandler({ method: "GET", headers: {}, url: "/api/workspace-design" }, res);
  assert.equal(res.statusCode, 401);
  assert.doesNotMatch(res.body, /agent-os|reconciled_at/);
  assert.match(read("vercel.json"), /"\/api\/workspace-design", "destination": "\/api\/workspace-review\?view=design"/);
});

test("Design Implementation is discoverable in Build and opens its own section", () => {
  const views = read("workspace/views.mjs");
  assert.match(views, /"#sprint-directive",\s*"#design-implementation",\s*"#deployment-budget"/);
  assert.match(views, /\{label:"Design implementation", href:"#design-implementation"\}/);
  assert.match(views, /"design-implementation":"build"/);
  assert.match(views, /target\.scrollIntoView/, "section links land on the section, not the top of the view");
  const html = read("workspace/index.html");
  assert.match(html, /<section class="design-impl" id="design-implementation"/);
  assert.match(html, /design-implementation\.mjs\?v=/);
});

test("the view model states truth in plain language", () => {
  const items = snapshot.items;
  const live = items.find(i => i.lifecycle.state === "deployed");
  assert.match(nextStep(live), /Not visually checked|check it/i);
  const blocked = items.find(i => i.lifecycle.blocked);
  assert.equal(nextStep(blocked), blocked.blocker);
  assert.ok(items.filter(i => matchesFilter(i, "blocked")).every(i => i.lifecycle.blocked));
  assert.ok(items.filter(i => matchesFilter(i, "live")).every(i => i.facts.live.containsAll === true));
  assert.deepEqual(groupByProduct(items).map(([p]) => p), [...new Set(items.map(i => i.product))]);
});

test("the Workspace menu runtime fix is present and cache-busted", () => {
  const app = read("workspace/app.js");
  assert.match(app, /\$\$\('\.workspace-menu-panel \.text-button'\)\.forEach/);
  assert.doesNotMatch(app, /[^$]\$\('\.workspace-menu-panel \.text-button'\)\.forEach/);
  assert.match(read("workspace/index.html"), /app\.js\?v=20260921-menufix1/);
});
