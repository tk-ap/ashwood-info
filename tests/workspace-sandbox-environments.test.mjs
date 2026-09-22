import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const api = readFileSync(new URL("../api/workspace-sandboxes.mjs", import.meta.url), "utf8");
const ui = readFileSync(new URL("../workspace/sandbox-environments.mjs", import.meta.url), "utf8");
const views = readFileSync(new URL("../workspace/views.mjs", import.meta.url), "utf8");

test("sandbox registry stores deployment metadata, never here.now claim credentials", () => {
  assert.match(api, /workspace_sandbox_environments/);
  assert.match(api, /provider_version_id/);
  assert.match(api, /source_ref/);
  assert.doesNotMatch(api, /claimToken|claim_token|claimUrl|claim_url/);
});

test("Workspace sandbox actions route through the existing governed owner command queue", () => {
  assert.match(ui, /\/api\/workspace-state/);
  assert.match(ui, /action:'submit_command'/);
  assert.match(ui, /AgentOS\/ledgato governance/);
  assert.doesNotMatch(ui, /ashwood_workspace_session/);
});

test("sandbox environments are an explicit Build surface", () => {
  assert.match(views, /#sandbox-environments/);
  assert.match(views, /"sandbox-environments":"build"/);
});
