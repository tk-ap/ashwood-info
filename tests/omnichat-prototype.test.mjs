import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";

const html = readFileSync("workspace/prototypes/omnichat/index.html", "utf8");
const css = readFileSync("workspace/prototypes/omnichat/styles.css", "utf8");
const script = readFileSync("workspace/prototypes/omnichat/app.js", "utf8");

test("OmniChat prototype has parseable JavaScript and expected self-contained assets", () => {
  const result = spawnSync(process.execPath, ["--check", "workspace/prototypes/omnichat/app.js"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(html, /href="\.\/styles\.css"/);
  assert.match(html, /src="\.\/app\.js"/);
  assert.doesNotMatch(html, /<script[^>]+https?:\/\//);
  assert.match(css, /prefers-reduced-motion/);
});
test("Unified ingress and activity controls are represented", () => {
  for (const id of ["composer", "prompt", "swimlanes", "event-stream", "toggle-mode", "trace", "freshness"]) {
    assert.match(html, new RegExp('id="' + id + '"'), id + " absent");
  }
  assert.match(script, /\/api\/omnichat\/activity/);
  assert.match(script, /\/api\/omnichat\/command/);
});
test("Live connection requires canonical source and time-bounded heartbeat", () => {
  assert.match(script, /payload\.source_system\s*!==\s*'agent-os'/);
  assert.match(script, /!fresh\(payload\.observed_at,120\)/);
  assert.match(script, /!heartbeat\?'unknown'/);
  assert.match(script, /if\(!connected \|\| !lastFeed\?\.commands_enabled\)/);
});
test("Default is explicit simulation and cannot imply real command dispatch", () => {
  assert.match(html, /DEMO DATA/);
  assert.match(html, /Demo: no real dispatch/);
  assert.match(script, /source_system:'demo'/);
  assert.match(html, /Protected actions are approved in LEDGATo/);
  assert.doesNotMatch(script, /localStorage|sessionStorage/);
});