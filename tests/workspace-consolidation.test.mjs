import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = name => readFileSync(new URL("../" + name, import.meta.url), "utf8");
const html = source("workspace/index.html");
const router = source("workspace/views.mjs");
const shell = source("workspace/shell-consolidation.css");
const brain = source("workspace/brain-explorer.mjs");
const config = JSON.parse(source("vercel.json"));

test("V2 Brain is in the canonical Workspace shell, with every existing owner control", () => {
  assert.match(html, /id="brain-explorer"/);
  assert.match(html, /workspace\/brain-explorer\.mjs\?v=20261103-native1/);
  assert.match(html, /workspace\/shell-consolidation\.css\?v=20261103-shell1/);
  assert.match(html, /id="sign-out"/);
  assert.match(html, /id="passphrase-dialog"/);
  assert.match(html, /id="evidence-form"/);
  assert.match(html, /data-workspace-nav="self"/);
  assert.match(html, /data-workspace-nav="career"/);
  assert.match(html, /data-workspace-nav="content"/);
  assert.doesNotMatch(html, /data-workspace-nav="brain"/);
  assert.equal((html.match(/id="brain-explorer"/g) || []).length, 1);
});
test("The existing fail-closed router owns Self, including its Brain deep link", () => {
  assert.ok(router.indexOf('"#self-alignment-mirror"') >= 0 && router.indexOf('"#brain-explorer"') > router.indexOf('"#self-alignment-mirror"'), 'Alignment and Brain must be grouped in Self');
  assert.match(router, /"brain-explorer":"self"/);
  assert.match(router, /node\.dataset\.workspaceView = "unassigned"/);
  assert.match(router, /function enforceViewOwnership/);
});
test("Native Brain is readonly, synthetic, owner-session gated and keyboard accessible", () => {
  assert.match(brain, /dataset\.workspaceAuth==="authenticated"/);
  assert.match(brain, /ashwood:workspace-locked/);
  assert.match(brain, /No owner notes or persistence/);
  assert.match(brain, /pointerdown/);
  assert.match(brain, /keydown/);
  assert.match(brain, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(brain, /\bfetch\s*\(|\bXMLHttpRequest\b|\bindexedDB\b|\blocalStorage\b|\bsessionStorage\b/);
  assert.doesNotMatch(brain, /ASHWOOD_DATABASE_URL|ASHWOOD_BRAIN_DATABASE_URL|Bearer /);
});
test("Workspace shell adapts without replacing application routes or production deploy gates", () => {
  assert.match(shell, /min-width: 1300px/);
  assert.match(shell, /max-width: 779px/);
  assert.match(shell, /prefers-reduced-motion: reduce/);
  assert.match(shell, /aria-current="page"/);
  assert.match(shell, /\.workspace-mobile-nav/);
  assert.match(html, /id="today-command-form"/);
  assert.match(html, /id="workspace-view-data-hero"/);
  assert.match(html, /id="workspace-global-add"/);
  assert.equal(config.git.deploymentEnabled.main, true);
  assert.match(config.ignoreCommand, /VERCEL_GIT_COMMIT_REF/);
  assert.ok(!config.rewrites?.some(x=>x.source === "/workspace" && x.destination !== "/workspace"));
});

test("Funding waits behind existing owner login rather than redirect-looping Workspace", () => {
  const funding = source("workspace/funding/funding.mjs");
  assert.ok(!funding.includes("location.replace('/workspace/')"));
  assert.ok(funding.includes("if(!status.authenticated)"));
  assert.ok(funding.includes("ashwood:workspace-authenticated"));
  assert.ok(funding.includes("awaitingWorkspaceAuth"));
});
