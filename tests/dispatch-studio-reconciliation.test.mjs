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

test("Dispatch Studio renders persisted titles and sources as text, not HTML", () => {
  const archive = read("../dispatch/index.html");
  assert.doesNotMatch(archive, /innerHTML=`[^`]*\$\{x\.title\}/, "published title must not be interpolated into innerHTML");
  assert.match(archive, /h\.textContent=String\(x\.title/);
  assert.match(archive, /\^\[a-z0-9-\]\+\$/, "slug is validated before use in a URL");
  const studio = read("../workspace/dispatch-studio/index.html");
  assert.doesNotMatch(studio, /href="'\+s\.url\+'"/, "source URL must not be concatenated into HTML");
  assert.match(studio, /u\.protocol!=='https:'&&u\.protocol!=='http:'/, "only http(s) source links");
  assert.match(studio, /a\.textContent=String\(s\.label/);
});
