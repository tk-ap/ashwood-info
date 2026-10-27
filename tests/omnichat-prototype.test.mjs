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
test("Two cockpit perspectives are visible, selectable, and never represent demo work as live", () => {
  for (const id of [
    "view-build","view-team","build-dashboard","team-dashboard",
    "priority-title","priority-description","simulate-focus",
    "radar-list","autonomous-queue","reality-stamp"
  ]) assert.match(html, new RegExp('id="' + id + '"'), id + " absent");
  assert.match(html, /Building the Build/);
  assert.match(html, /Building the Team/);
  assert.match(html, /INTERACTIVE CONCEPT · DEMO DATA/);
  assert.match(html, /Illustrative|ILLUSTRATIVE WORKFLOW/);
  assert.match(script, /let workspacePerspective='build'/);
  assert.match(script, /foregroundDemo=!foregroundDemo/);
  assert.match(script, /if\(connected\)\{/);
  assert.match(script, /No canonical autonomous mission queue projection is attached/);
  assert.match(css, /\.main\[data-workspace-view="build"\]/);
  assert.match(css, /\.main\[data-workspace-view="team"\]/);
});

test("Foreground priority remains concept-only and portfolio feed is fail-closed", () => {
  assert.match(script, /This capture listener visually demonstrates/);
  assert.match(script, /It does not call providers, pause jobs, persist session leases/);
  assert.match(script, /!connected&&\$\('prompt'\)\.value\.trim\(\)/);
  assert.match(script, /\$\('simulate-focus'\)\.disabled=connected/);
  assert.match(script, /No authenticated portfolio signal projection is attached/);
  assert.match(script, /Switching perspectives never changes capacity/);
});

test("Swimlane visualizes six evidenced lifecycle stages, not guessed percent progress", () => {
  for(const stage of ["Wake","Check-in","Execute","Checkpoint","Handoff","Check-out"]){
    assert.ok(html.includes(">" + stage + "</b>"), stage + " column absent");
  }
  assert.match(html, /id="journey-scroll"/);
  assert.match(html, /id="stage-caption"/);
  assert.match(html, /data-lane-filter="all"/);
  assert.match(html, /data-lane-filter="waiting"/);
  assert.match(html, /data-lane-filter="handoff"/);
  assert.match(script, /const lifecycleStages=\[/);
  assert.match(script, /const present=events\.map\(stageFor\)\.filter\(Boolean\)/);
  assert.match(script, /const matching=events\.filter\(e=>stageFor\(e\)===stage\.id\)/);
  assert.match(script, /class=.*journey-cell|journey-cell /);
  assert.match(script, /No .* event /);
  assert.doesNotMatch(script.slice(script.indexOf("function renderLanes"),script.indexOf("function renderEvents")), /lane\.start|lane\.width|bar\.style/);
});
test("Swimlane controls are interactive but do not dispatch or fabricate production event data", () => {
  assert.match(script,/data-lane-filter/);
  assert.match(script,/laneFilter=b\.dataset\.laneFilter/);
  assert.match(script,/row\.addEventListener\('click',/);
  assert.match(script,/selected=lane\.id;render\(\)/);
  assert.match(script,/source_system:'demo'/);
  assert.match(script,/last_heartbeat_at:null/);
  assert.match(script,/No .* event .*observed/);
  assert.match(script,/usage:v\.usage&&typeof v\.usage==='object'/);
  assert.match(script,/l\.usage\?\.input_tokens!=null/);
  assert.match(css,/\.journey-scroll\{/);
  assert.match(css,/\.journey-persona\{position:sticky/);
  assert.match(css,/\.journey-cell\.unobserved/);
});
