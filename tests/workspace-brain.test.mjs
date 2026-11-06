import test from 'node:test';
import assert from 'node:assert/strict';
import { createBrainHandler } from '../api/_brain-handler.mjs';

function response() {
  return {
    statusCode: 200, headers: {}, body: null,
    status(n) { this.statusCode=n; return this; },
    setHeader(k,v) { this.headers[k.toLowerCase()]=v; return this; },
    end(s) { this.body=s; return this; }
  };
}
function request(method='GET', url='/api/workspace-brain') {
  return { method, url, headers: {host:'preview.local',origin:'https://preview.local'} };
}
test('anonymous caller denied before database access',async()=>{
  let accessed=false;
  const h=createBrainHandler({authenticate:async()=>null,sqlFactory:()=>{accessed=true;throw Error('database access');}});
  const res=response();await h(request(),res);
  assert.equal(res.statusCode,401);assert.equal(accessed,false);
});
test('cross-origin write refused without SQL statements',async()=>{
  let count=0;
  const h=createBrainHandler({authenticate:async()=>({token:'test'}),sqlFactory:()=>async()=>{count++;return [];}});
  const req=request('POST');req.headers.origin='https://attacker.example';req.body={title:'test'};
  const res=response();await h(req,res);
  assert.equal(res.statusCode,403);assert.equal(count,0);
});
test('invalid note identifier fails before querying',async()=>{
  let count=0;
  const h=createBrainHandler({authenticate:async()=>({token:'test'}),sqlFactory:()=>async()=>{count++;return [];}});
  const res=response();await h(request('GET','/api/workspace-brain?id=invalid'),res);
  assert.equal(res.statusCode,400);assert.equal(count,0);
});
test('unconfigured brain database fails closed',async()=>{
  const h=createBrainHandler({authenticate:async()=>({token:'test'}),sqlFactory:()=>{throw Error('missing');}});
  const res=response();await h(request(),res);
  assert.equal(res.statusCode,503);
});
