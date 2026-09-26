import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../workspace/build/deployments/index.html", import.meta.url), "utf8");
const ui = readFileSync(new URL("../workspace/deployment-ledger.mjs", import.meta.url), "utf8");
const main = readFileSync(new URL("../workspace/index.html", import.meta.url), "utf8");

test("deployment ledger is a private Build subpage", () => {
  assert.match(page, /<title>Deployments — ASHWOOD Workspace<\/title>/);
  assert.match(page, /noindex,nofollow,noarchive/);
  assert.match(page, /data-build-page="deployments"/);
  assert.match(page, /href="\/workspace\/#build"/);
  assert.match(page, /src="\/workspace\/deployment-ledger\.mjs"/);
  assert.match(main, /href="\/workspace\/build\/deployments\/">Deployments<\/a>/);
});

test("deployment ledger consumes AgentOS projection, not Vercel directly", () => {
  assert.match(ui, /fetch\('\/api\/workspace-agentos'/);
  assert.match(ui, /row\.kind === 'deployment_budget'/);
  assert.match(ui, /deployment_history/);
  assert.match(ui, /deployment_attempts/);
  assert.doesNotMatch(ui, /api\.vercel\.com/);
  assert.doesNotMatch(ui, /VERCEL_TOKEN/);
});

test("deployment ledger exposes batching and deployment-churn evidence", () => {
  assert.match(ui, /Unique revisions/);
  assert.match(ui, /repeatedRevisionEvents/);
  assert.match(ui, /Production READY/);
  assert.match(ui, /Unsuccessful/);
  assert.match(ui, /Mutation attempts/);
  assert.match(ui, /Batching diagnostic/);
  assert.match(ui, /parked before mutation/);
});

test("deployment page supports product, target, and state filters", () => {
  assert.match(ui, /deployment-filter-project/);
  assert.match(ui, /deployment-filter-target/);
  assert.match(ui, /deployment-filter-state/);
  assert.match(ui, /applyFilters/);
});

test("all Build detail pages link to the deployment ledger", () => {
  for (const name of ["environments", "agentos", "queue", "design", "history"]) {
    const html = readFileSync(new URL(`../workspace/build/${name}/index.html`, import.meta.url), "utf8");
    assert.match(html, /href="\/workspace\/build\/deployments\/">Deployments<\/a>/, name);
  }
});
