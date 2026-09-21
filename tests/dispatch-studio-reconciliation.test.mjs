import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL(path, import.meta.url), "utf8");

test("Dispatch Studio (#145) survives the integrated release", async () => {
  const studio = read("../workspace/dispatch-studio/index.html");
  assert.match(studio, /<title>Dispatch Studio/);
  for (const id of ['id="title"', 'id="body"', 'id="save"', 'id="publish"', 'id="logs"']) assert.ok(studio.includes(id), id);
  assert.match(read("../workspace/build-logs/index.html"), /href="\/workspace\/dispatch-studio\/"/);
  assert.match(read("../dispatch/index.html"), /\/api\/dispatch-studio\?view=published/);
  assert.match(read("../dispatch/building-around-the-agent/index.html"), /<html/);
  const api = await import("../api/dispatch-studio.mjs");
  assert.equal(typeof api.default, "function");
});

test("Workspace still loads the deployment tracker alongside the rest of Build", () => {
  const workspace = read("../workspace/index.html");
  assert.match(workspace, /deployment-budget\.mjs\?v=20260921-agentos1/);
  assert.match(workspace, /id="deployment-budget"/);
});
