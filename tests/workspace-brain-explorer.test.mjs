import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
const html=readFileSync(new URL("../workspace/index.html",import.meta.url),"utf8");
const router=readFileSync(new URL("../workspace/views.mjs",import.meta.url),"utf8");
const js=readFileSync(new URL("../workspace/brain-explorer.mjs",import.meta.url),"utf8");
const css=readFileSync(new URL("../workspace/brain-explorer.css",import.meta.url),"utf8");

test("Brain is part of existing Self view, not a new navigation or auth shell",()=>{
  assert.match(html,/<section class="brain-explorer" id="brain-explorer"/);
  assert.match(router,/self:\s*\[\s*"#brain-explorer"/);
  assert.match(router,/"brain-explorer":"self"/);
  assert.match(html,/id="sign-out"/);
  assert.match(html,/data-workspace-nav="self"/);
  assert.doesNotMatch(html,/data-workspace-nav="brain"/);
  assert.match(html,/workspace\/brain-explorer\.mjs/);
  assert.match(html,/workspace\/brain-explorer\.css/);
});
test("Brain stays private-session aware, synthetic and read-only",()=>{
  assert.match(js,/ashwood:workspace-authenticated/);
  assert.match(js,/data-workspace-auth/);
  assert.match(js,/dataset\.workspaceAuth==="authenticated"/);
  assert.match(html,/Sample concepts · no private notes/);
  assert.match(js,/No owner notes or persistence/);
  assert.doesNotMatch(js,/\blocalStorage\b|\bsessionStorage\b|\bfetch\s*\(|\bXMLHttpRequest\b|\bIndexedDB\b/);
  assert.doesNotMatch(js,/tahlia\.ashwood|hire\.tkashwood|ASHWOOD_DATABASE_URL|ASHWOOD_BRAIN_DATABASE_URL/);
});
test("Brain selection, connections, keyboard, reduced-motion and mobile contracts exist",()=>{
  assert.match(js,/function select\(id\)/);
  assert.match(js,/function project\(p\)/);
  assert.match(js,/pointerdown/);
  assert.match(js,/keydown/);
  assert.match(js,/prefers-reduced-motion: reduce/);
  assert.match(js,/requestAnimationFrame/);
  assert.match(css,/@media \(max-width:560px\)/);
  assert.match(css,/var\(--ink\)/);
  const check=spawnSync(process.execPath,["--check",new URL("../workspace/brain-explorer.mjs",import.meta.url).pathname],{encoding:"utf8"});
  assert.equal(check.status,0,check.stderr);
});
