import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { isAgentRow, rowState, summarizePulse } from "../workspace/ops-pulse-model.mjs";

test("Ops Pulse counts canonical AgentOS work and fails closed", () => {
  const rows = [
    { source_system:"agent-os", status:"running", title:"a" },
    { source_system:"agent-os", lane:"review", status:"unknown", title:"b" },
    { source_system:"agent-os", lane:"stuck", status:"parked", title:"c" },
    { source_system:"manual", status:"running", title:"not agent" }
  ];
  const summary = summarizePulse(
    { rows, observed_at:"2026-09-24T20:00:00Z" },
    [{ command_kind:"owner_command", status:"queued" }, { status:"completed" }]
  );
  assert.deepEqual(
    [summary.underway.length, summary.owner.length, summary.blocked.length, summary.queued.length],
    [1, 1, 1, 1]
  );
  assert.equal(summary.observedAt, "2026-09-24T20:00:00Z");
  assert.equal(rowState(rows[2]), "parked");
  assert.equal(isAgentRow(rows[3]), false);
  assert.equal(summarizePulse(null, []).available, false);
});

test("Issue 170 forward-port uses current protected Workspace architecture", async () => {
  const [html, pulse, views, health] = await Promise.all([
    readFile(new URL("../workspace/index.html", import.meta.url), "utf8"),
    readFile(new URL("../workspace/ops-pulse.mjs", import.meta.url), "utf8"),
    readFile(new URL("../workspace/views.mjs", import.meta.url), "utf8"),
    readFile(new URL("../workspace/agentos/agentos-health.mjs", import.meta.url), "utf8")
  ]);
  assert.match(html, /ops-pulse\.css\?v=20260924-forward1/);
  assert.match(html, /v4-atmosphere\.css\?v=20260924-forward1/);
  assert.match(html, /ops-pulse\.mjs\?v=20260924-forward1/);
  assert.match(pulse, /\/api\/workspace-agentos/);
  assert.match(pulse, /\/api\/workspace-environments/);
  assert.doesNotMatch(pulse, /data\/sandbox-environments\.json/);
  assert.doesNotMatch(pulse, /#deployment-budget/);
  assert.match(views, /AgentOS Health/);
  assert.match(health, /\/api\/workspace-agentos/);
  assert.match(health, /autonomy-rubric\.v1/);
});
