import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { budgetView, selectBudgetRow } from "../workspace/deployment-budget-view.mjs";

// Fixture produced by AgentOS itself (workspace_board.build_snapshot on the
// #169 integration branch), so parity is checked against what AgentOS publishes.
const fixture = JSON.parse(readFileSync(new URL("./fixtures/agentos-deployment-budget-row.json", import.meta.url)));
const OBSERVED = Date.parse(fixture.canonical.observed_at);

test("ASHWOOD displays exactly the canonical AgentOS values", () => {
  const view = budgetView(selectBudgetRow([{ kind: "execution", title: "x" }, fixture.row]), OBSERVED + 60_000);
  const c = fixture.canonical;
  assert.equal(view.used, c.used);
  assert.equal(view.capacityAvailable, c.available);
  assert.equal(view.limit, c.limit);
  assert.equal(view.utilization, c.utilization);
  assert.equal(view.band, c.band.toUpperCase());
  assert.equal(view.deployAllowed, c.deploy_allowed);
  assert.equal(view.nextSlotAt, c.next_slot_at);
  assert.equal(view.observedAt, c.observed_at);
  assert.equal(view.telemetry, "ok");
  assert.deepEqual(view.projects.map(p => [p.name, p.used24h]),
    Object.entries(c.projects).map(([name, p]) => [name, p.used_24h]));
  assert.equal(view.limitSource, "agentos_policy");
  assert.equal(view.providerLimitVerified, false);
});

test("production availability and latest deployment come from the same canonical observation", () => {
  const view = budgetView(fixture.row, OBSERVED + 60_000);
  assert.equal(view.production.label, fixture.canonical.projects.ASHWOOD.production ? "LIVE" : "NO READY PRODUCTION OBSERVED");
  assert.ok(view.latest.label);
});

test("telemetry failure is never shown as production downtime", () => {
  const row = structuredClone(fixture.row);
  row.metadata.deployment_budget.telemetry = { status: "unavailable", error: "OSError: vercel unreachable",
    last_success_at: fixture.canonical.observed_at };
  const view = budgetView(row, OBSERVED + 60_000);
  assert.equal(view.telemetry, "unavailable");
  assert.match(view.telemetryNote, /not production downtime/);
  assert.equal(view.production.label === "DOWN", false);
  const missing = budgetView(null);
  assert.equal(missing.available, false);
  assert.match(missing.message, /does not mean production is down/);
});

test("an old observation is labelled stale, not current", () => {
  const view = budgetView(fixture.row, OBSERVED + 2 * 60 * 60 * 1000);
  assert.equal(view.telemetry, "stale");
  assert.equal(view.used, fixture.canonical.used, "values are still the canonical ones, just labelled stale");
});

test("parked deployments are shown", () => {
  const row = structuredClone(fixture.row);
  row.metadata.parked_deployments = [{ product: "ashwood", work_id: "ashwood-batch-7", next_check_at: "2026-09-22T00:00:00Z" }];
  assert.equal(budgetView(row, OBSERVED).parked.length, 1);
});

test("ASHWOOD no longer calculates the budget or queries Vercel for it", () => {
  for (const file of ["../workspace/deployment-budget.mjs", "../workspace/deployment-budget-view.mjs"]) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.doesNotMatch(source, /api\.vercel\.com/);
    assert.doesNotMatch(source, /view=deployments/);
    assert.doesNotMatch(source, /86400000|const LIMIT/);
  }
  const glue = readFileSync(new URL("../workspace/deployment-budget.mjs", import.meta.url), "utf8");
  assert.match(glue, /\/api\/workspace-board/);
});

test("the AgentOS board labels the budget row", () => {
  const board = readFileSync(new URL("../workspace/agentos-board.mjs", import.meta.url), "utf8");
  assert.match(board, /deployment_budget.*deployment budget/);
});
