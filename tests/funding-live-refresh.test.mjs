import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {startLiveRefresh,registryPayload} from '../workspace/funding/live-refresh.mjs';

test('published registry pulls use Career-like cadence, visibility and single-flight boundaries',async()=>{
  const document=new EventTarget(),window=new EventTarget();
  document.visibilityState='visible';
  let tick,interval,cleared,calls=0,done;
  window.setInterval=(fn,ms)=>{tick=fn;interval=ms;return 7;};
  window.clearInterval=id=>{cleared=id;};
  const stop=startLiveRefresh({document,window,refresh:()=>{calls++;return new Promise(resolve=>{done=resolve;});}});
  assert.equal(interval,60000);
  const first=tick(); await tick();window.dispatchEvent(new Event('focus'));
  assert.equal(calls,1);
  done();await first;
  document.visibilityState='hidden';await tick();assert.equal(calls,1);
  document.visibilityState='visible';document.dispatchEvent(new Event('visibilitychange'));assert.equal(calls,2);
  done();await Promise.resolve();await Promise.resolve();
  window.dispatchEvent(new Event('hashchange'));assert.equal(calls,3);done();
  stop();assert.equal(cleared,7);
  window.dispatchEvent(new Event('focus'));assert.equal(calls,3);
});

test('malformed or duplicate responses cannot replace the displayed registry',()=>{
  for(const value of [null,{}, {opportunities:[null]}, {opportunities:[{}]}, {opportunities:[{id:'x'},{id:'x'}]}]) assert.throws(()=>registryPayload(value),/Invalid registry/);
  const value={opportunities:[{id:'x'},{id:'y'}]};assert.equal(registryPayload(value),value);
});

test('background updates preserve an action draft started during retrieval and retain data on failure',async()=>{
  const nodes={'#funding-registry-state':{},'#funding-registry-time':{},'#funding':{contains:()=>false}};
  let respond,renders=0,calls=0;
  const context=vm.createContext({registryPayload,localStorage:{getItem:()=>null},Date,JSON,Set,Map,
    document:{querySelector:id=>nodes[id],activeElement:null},
    fetch:()=>{calls++;return new Promise(resolve=>{respond=resolve;});}});
  const source=fs.readFileSync('workspace/funding/funding.mjs','utf8').replace(/^import .*;\n/gm,'').replace(/^start\(\)\.catch.*$/m,'');
  vm.runInContext(source,context);
  context.countRender=()=>{renders++;};
  vm.runInContext('renderProfile=()=>{}; render=countRender;',context);
  const first=vm.runInContext('loadRegistry({automatic:true})',context);
  vm.runInContext("editedActions.add('existing');",context);
  respond({ok:true,json:async()=>({opportunities:[{id:'new'}]})});await first;
  assert.equal(renders,0);assert.equal(vm.runInContext('registry.opportunities.length',context),0);
  await vm.runInContext('loadRegistry({automatic:true})',context);assert.equal(calls,1);
  vm.runInContext('editedActions.clear()',context);
  const second=vm.runInContext('loadRegistry({automatic:true})',context);
  respond({ok:true,json:async()=>({opportunities:[{id:'new'}]})});await second;
  assert.equal(renders,1);
  const unchanged=vm.runInContext('loadRegistry({automatic:true})',context);
  respond({ok:true,json:async()=>({opportunities:[{id:'new'}]})});await unchanged;assert.equal(renders,1);
  const failed=vm.runInContext('loadRegistry({automatic:true})',context);
  respond({ok:false});await failed;
  assert.equal(vm.runInContext('registry.opportunities[0].id',context),'new');
  assert.equal(nodes['#funding-registry-state'].textContent,'Refresh unavailable');
});
