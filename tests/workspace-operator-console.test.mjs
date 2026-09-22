import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../workspace/index.html", import.meta.url), "utf8");
const views = await readFile(new URL("../workspace/views.mjs", import.meta.url), "utf8");
const operator = await readFile(new URL("../workspace/operator-console.mjs", import.meta.url), "utf8");
const today = await readFile(new URL("../workspace/today.mjs", import.meta.url), "utf8");

test("Operator is a first-class Workspace view and primary command surface", () => {
  assert.match(html, /data-workspace-nav="operator"/);
  assert.match(html, /id="operator"/);
  assert.match(html, /id="today-command-form"/);
  assert.match(html, /id="operator-thread"/);
  assert.match(views, /operator:\s*\{/);
  assert.match(views, /"#operator"/);
});

test("Operator thread uses canonical Workspace command and AgentOS board projections", () => {
  assert.match(operator, /\/api\/workspace-state\?view=commands/);
  assert.match(operator, /\/api\/workspace-board/);
  assert.match(operator, /runtime_task_id/);
  assert.match(operator, /canonical_url/);
  assert.match(operator, /ledgato denied dispatch/);
});

test("owner directives are submitted to the persistent operator thread", () => {
  assert.match(today, /thread_id:"operator:primary"/);
  assert.match(today, /ashwood:operator-command-submitted/);
});
