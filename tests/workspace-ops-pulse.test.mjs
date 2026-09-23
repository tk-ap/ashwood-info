import test from "node:test";
import assert from "node:assert/strict";
import {isAgentRow,rowState,summarizePulse} from "../workspace/ops-pulse-model.mjs";
test("only confirmed AgentOS rows are counted",()=>{
 const rows=[
  {source_system:"agentos",status:"running",title:"a"},
  {owner:"Milchik",lane:"review",status:"unknown",title:"b"},
  {source_system:"agent-os",lane:"stuck",status:"unknown",title:"c"},
  {source_system:"manual",status:"running",title:"not agent"}
 ];
 const s=summarizePulse({rows,as_of:"2026-09-22T00:00:00Z"},[{command_kind:"owner_command",status:"queued"},{status:"completed"}]);
 assert.deepEqual([s.underway.length,s.owner.length,s.blocked.length,s.queued.length],[1,1,1,1]);
 assert.equal(s.observedAt,"2026-09-22T00:00:00Z");
 assert.equal(rowState(rows[2]),"blocked");assert.equal(isAgentRow(rows[3]),false);
});
test("missing board fails closed without imaginary zeros",()=>{
 const s=summarizePulse(null,[]);
 assert.equal(s.available,false);
 assert.equal(s.observedAt,null);
});
