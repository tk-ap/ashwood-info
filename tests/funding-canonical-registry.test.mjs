import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {actionState,duplicateOf,evaluate,evidenceCurrent,inView,ranked,upsert} from '../workspace/funding/model.mjs';
import {applyReport,validateRegistry} from '../scripts/funding-registry.mjs';
const now=Date.parse('2026-10-05T17:00:00Z');
const verified={id:'program',program_key:'program',name:'Program',funder:'Provider',source_url:'https://provider.org/program',type:'emergency_cash',status:'NEEDS_FACT',categories:['housing'],criteria:['Residency'],eligibility_rules:[{fact:'resident',label:'Residency'}],unknowns:[],repayable:false,effort:'low',last_verified_at:'2026-10-05T16:00:00Z',verification:'VERIFIED',disposition:'APPLY',evidence:[{url:'https://provider.org/program',authoritative:true,checked_at:'2026-10-05T16:00:00Z',supports:['availability','criteria','value'],summary:'Official criteria, benefit and application availability checked.'}],next_action:'Review application',availability:'open'};
test('discovery cannot become actionable through search results, tags or manual fit statuses',()=>{
 for(const patch of [{verification:'UNVERIFIED'},{evidence:[]},{evidence:[{...verified.evidence[0],authoritative:false}]},{last_verified_at:'2026-09-01'},{last_verified_at:'2027-01-01'}]) {
   const e=evaluate({...verified,...patch,match_tags:['resident']},{resident:true},{program:'READY_TO_APPLY'},now);
   assert.equal(e.disposition,'HOLD');assert.equal(e.fresh,false);
 }
 assert.equal(evaluate(verified,{resident:true},{},now).disposition,'APPLY');
 assert.equal(evaluate(verified,{}, {},now).disposition,'CONSULT');
 assert.equal(evaluate(verified,{resident:false},{},now).disposition,'SKIP');
});
test('legacy string state survives and actions never authorize applications',()=>{
 assert.equal(actionState(verified,{program:'APPLIED'}).status,'APPLIED');
 const e=evaluate(verified,{resident:true},{program:{status:'AWAITING_RESPONSE',next_action:'Follow up',action_deadline:'2026-10-07'}},now);
 assert.equal(e.next_action,'Follow up');assert.ok(inView(e,'progress'));assert.equal(inView(e,'recommended'),false);
 assert.equal(evaluate(verified,{resident:true},{program:{disposition:'SKIP',reason:'Owner closed'}},now).disposition,'SKIP');
});
test('current ranking prioritizes housing, employment, grants and penalizes delayed training',()=>{
 const items=[{...verified,id:'credits',categories:['business'],type:'build_credits'}, {...verified,id:'training',categories:['employment'],training_weeks:14,employment_ready_at:'2027-03-12'}, {...verified,id:'employment',categories:['employment']}, {...verified,id:'housing'}];
 assert.deepEqual(ranked(items,{resident:true},{},now).map(e=>e.item.id),['housing','employment','credits','training']);
 assert.equal(evaluate(items[1],{resident:true},{},now).disposition,'HOLD');
 assert.equal(evaluate({...verified,repayable:true,interest_percent:0,fees:0},{resident:true},{},now).disposition,'HOLD');
});
test('duplicates merge by stable ID, aliases and program key; shared providers remain distinct',()=>{
 const registry={opportunities:[structuredClone(verified)]};
 assert.equal(duplicateOf(registry.opportunities,{name:'Program',id:'new'}).id,'program');
 upsert(registry,{...verified,id:'new',categories:['employment'],verification:'UNVERIFIED'},new Date(now).toISOString());
 assert.equal(registry.opportunities.length,1);assert.equal(registry.opportunities[0].verification,'VERIFIED');
 assert.ok(registry.opportunities[0].categories.includes('employment'));
 assert.equal(duplicateOf(registry.opportunities,{id:'other',name:'Other Program',program_key:'other',funder:'Provider',source_url:verified.source_url}),undefined);
});
test('new discovery enters same registry before verification; updates retain lifecycle and change evidence',()=>{
 const registry={opportunities:[]};
 assert.throws(()=>upsert(registry,verified,new Date(now).toISOString()),/CANDIDATE/);
 upsert(registry,{...verified,verification:'UNVERIFIED'},new Date(now).toISOString());
 assert.equal(registry.opportunities[0].status,'CANDIDATE');assert.equal(registry.opportunities[0].last_verified_at,null);
 upsert(registry,verified,new Date(now).toISOString());
 registry.opportunities[0].status='APPLIED';
 upsert(registry,{...verified,deadline:'2026-10-07'},new Date(now).toISOString());
 assert.equal(registry.opportunities[0].status,'APPLIED');assert.equal(registry.opportunities[0].changes.at(-1).field,'deadline');
 assert.ok(inView(evaluate(registry.opportunities[0],{}, {},now),'changed'));
});
test('atomic report rejects PII or malformed evidence without partially writing records',()=>{
 const registry={opportunities:[structuredClone(verified)]}, original=JSON.stringify(registry);
 const {status,...reportRecord}=verified;
 assert.throws(()=>applyReport(registry,{records:[{...reportRecord,profile:{resident:true}}]},new Date(now).toISOString()),/boundary/);
 assert.equal(JSON.stringify(registry),original);
 assert.throws(()=>applyReport(registry,{records:[{...reportRecord,evidence:[]}]},new Date(now).toISOString()),/evidence/);
});
test('all existing IDs and nine requested opportunities share one canonical registry',()=>{
 const data=JSON.parse(fs.readFileSync('workspace/funding/opportunities.json'));
 validateRegistry(data);assert.equal(data.opportunities.length,15);
 for(const id of ['village-for-vets-efund','lacahsa-rphp','founders-first-tadlock-2026','nsf-sbir-26-510','aws-activate-founders','google-startups-cloud','microsoft-for-startups','ssvf','jvs-vsta-ajcc','jfla-veteran-loan','village-veteran-street-academy','va-vre','veep-los-angeles','army-emergency-relief','operation-homefront-cfa'])assert.ok(data.opportunities.find(x=>x.id===id));
 assert.equal(data.opportunities.filter(x=>x.name.includes('Emergency Financial Assistance') && x.funder==='Village for Vets').length,1);
 assert.equal(evidenceCurrent(data.opportunities.find(x=>x.id==='aws-activate-founders'),now),true);
});
