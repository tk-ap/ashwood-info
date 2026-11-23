import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const src = file => readFileSync(new URL('../'+file,import.meta.url),'utf8');
const html=src('workspace/index.html');
const router=src('workspace/views.mjs');
const js=src('workspace/operator-v2.mjs');
const css=src('workspace/operator-v2.css');

test('Operator perspectives mount inside the canonical Workspace, not a second application', () => {
  for(const id of ['operator-v2','operator-v2-team','operator-v2-build','operator-v2-team-tab','operator-v2-build-tab','operator']) assert.ok(html.includes('id="'+id+'"'),id);
  assert.ok(html.includes('workspace/operator-v2.mjs?v='));
  assert.ok(html.includes('workspace/operator-v2.css?v='));
  assert.ok(router.includes('"#operator-v2"'));
  assert.ok(router.includes('"#operator"'));
  assert.ok(html.includes('id="today-command-form"'));
});
test('Operator read-only projection does not dispatch, simulate private runtime or invent receipts', () => {
  assert.ok(js.includes("fetch('/api/workspace-agentos'"));
  assert.ok(js.includes("credentials:'same-origin'"));
  assert.ok(js.includes("document.body.dataset.workspaceAuth === 'authenticated'"));
  assert.ok(js.includes("No verified receipt"));
  assert.ok(js.includes("No sample tasks"));
  assert.ok(!js.includes('localStorage'));
  assert.ok(!js.includes('sessionStorage'));
  assert.ok(!js.includes('fetch("/api/omnichat/command"'));
  assert.ok(!js.includes('POST'));
  const check=spawnSync(process.execPath,['--check',new URL('../workspace/operator-v2.mjs',import.meta.url).pathname],{encoding:'utf8'});
  assert.equal(check.status,0,check.stderr);
});
test('Operator layout remains responsive and scoped, preserving previous features', () => {
  assert.ok(css.includes('#operator-v2'));
  assert.ok(css.includes('@media(max-width:600px)'));
  assert.ok(css.includes('prefers-reduced-motion'));
  assert.ok(html.includes('data-operator-perspective="team"'));
  assert.ok(html.includes('data-operator-perspective="build"'));
  assert.ok(html.includes('id="sign-out"'));
});
