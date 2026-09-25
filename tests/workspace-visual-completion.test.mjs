import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('visual completion layer uses view-specific accents without restoring constellation',()=>{
  const css=fs.readFileSync('workspace/visual-completion.css','utf8');
  assert.match(css,/data-workspace-current-view="today"/);
  assert.match(css,/data-workspace-current-view="build"/);
  assert.match(css,/data-workspace-current-view="career"/);
  assert.match(css,/--vc-mint:#76e6c2/);
  assert.match(css,/--vc-coral:#ff8e7a/);
  assert.doesNotMatch(css,/owner-constellation/);
});

test('visual signal rail mirrors existing DOM readouts instead of inventing telemetry',()=>{
  const js=fs.readFileSync('workspace/visual-completion.mjs','utf8');
  for(const id of ['ops-pulse-underway','ops-pulse-owner','ops-pulse-blocked','ops-pulse-queued']){
    assert.match(js,new RegExp(id));
  }
  assert.match(js,/MutationObserver/);
  assert.doesNotMatch(js,/Math\.random/);
});

test('main Workspace, Funding and AgentOS opt into the completion layer',()=>{
  for(const file of ['workspace/index.html','workspace/funding/index.html','workspace/agentos/index.html']){
    const html=fs.readFileSync(file,'utf8');
    assert.match(html,/visual-completion\.css/);
  }
  assert.match(fs.readFileSync('workspace/index.html','utf8'),/visual-completion\.mjs/);
});
