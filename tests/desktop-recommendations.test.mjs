import test from 'node:test';
import assert from 'node:assert/strict';
import { desktopRecommendations, projectFunding, recommendationId } from '../api/_desktop-recommendations.mjs';
import { rankOpportunityQueues } from '../api/_career-opportunities.mjs';
import { ranked } from '../workspace/funding/model.mjs';
const now=Date.parse('2026-10-05T18:00:00Z'), stamp=new Date(now).toISOString();
const rawJobs=[
  {id:'b',title:'Compliance Program Manager',company_name:'B',url:'https://example.com/b',work_arrangement:'remote',candidate_required_location:'USA',publication_date:stamp,description:'Compliance governance controls risk cross-functional process improvement.',requirements_review:{status:'qualified',checks:['Checked'],reasons:[]}},
  {id:'a',title:'Senior Business Analyst',company_name:'A',url:'https://example.com/a',work_arrangement:'remote',candidate_required_location:'USA',publication_date:stamp,description:'Business analysis stakeholder management and process improvement.',requirements_review:{status:'qualified',checks:['Checked'],reasons:[]}}
];
test('desktop jobs preserve the canonical queue and whitelist display fields',()=>{
  const canonical=rankOpportunityQueues(rawJobs,[],now).recommended;
  assert.ok(canonical.length>0);
  const input=canonical.map(item=>({...item,resume_content:'SECRET',tokens:['SECRET'],application_pii:'SECRET'}));
  const feed=desktopRecommendations(input,{now,freshAt:stamp});
  assert.deepEqual(feed.jobs.map(item=>item.id),canonical.map(recommendationId));
  assert.ok(!JSON.stringify(feed).includes('SECRET'));
  assert.deepEqual(Object.keys(feed.jobs[0]).sort(),['id','company','role','compensation_label','location_label','bucket','reason','fresh_at','canonical_url'].sort());
  assert.ok(feed.jobs.every(item=>new URL(item.canonical_url).searchParams.get('opportunity')===item.id));
});
test('stale/missing source, reviews, duplicates and tracked jobs are excluded',()=>{
  const queues=rankOpportunityQueues(rawJobs,[],now);
  assert.equal(desktopRecommendations(queues.recommended,{now}).jobs.length,0);
  assert.equal(desktopRecommendations(queues.recommended,{now,freshAt:'2026-10-01T00:00:00Z'}).jobs.length,0);
  const input=[...queues.recommended,...queues.recommended,{...queues.recommended[0],id:'review',recommendation_bucket:'review'}];
  assert.equal(desktopRecommendations(input,{now,freshAt:stamp}).jobs.length,queues.recommended.length);
  const tracked=rankOpportunityQueues(rawJobs,[{company:'A',role:'Senior Business Analyst',posting_url:'https://example.com/a'}],now).recommended;
  assert.ok(desktopRecommendations(tracked,{now,freshAt:stamp}).jobs.every(item=>item.company!=='A'));
});
test('each source must have its own fresh observation; feeds cannot refresh curated records',()=>{
  const item=rankOpportunityQueues(rawJobs,[],now).recommended[0];
  const input=[{...item,id:'one',source:'Fresh'},{...item,id:'two',source:'Stale'},{...item,id:'three',source:'Curated Career Search'},{...item,id:'four',source:'Future'}];
  const feed=desktopRecommendations(input,{now,freshAt:stamp,sourceFreshness:{Fresh:stamp,Stale:'2026-10-01T00:00:00Z',Future:new Date(now+1000).toISOString()}});
  assert.deepEqual(feed.jobs.map(item=>item.id),['fresh:one']);
  assert.equal(feed.jobs[0].fresh_at,stamp);
  const oldStamp=new Date(now-5*3600000).toISOString();
  const expiring=desktopRecommendations(input,{now,sourceFreshness:{Fresh:oldStamp}});
  assert.equal(Date.parse(expiring.expires_at),now+3600000,'generation cannot extend source evidence lifetime');
});

const program=(id,categories)=>({id,name:id,funder:'Provider',value:'Non-repayable support',categories,
  status:'POSSIBLE_FIT',disposition:'APPLY',availability:'open',repayable:false,effort:'low',
  eligibility_rules:[{fact:'confirmed',label:'Criterion'}],unknowns:[],last_verified_at:stamp,verification:'VERIFIED',
  evidence:[{authoritative:true,url:'https://provider.example/program',summary:'Current program criteria',checked_at:stamp,supports:['availability','criteria','value']}]});
test('Funding projection consumes canonical disposition/rank, freshness and action state',()=>{
  const records=[program('business',['business']),program('housing',['housing']),program('employment',['employment'])];
  const evaluations=ranked(records,{confirmed:true},{},now);
  assert.deepEqual(projectFunding(evaluations),[],'browser-only owner state is never inferred on the server');
  const projected=projectFunding(evaluations,{ownerStateAvailable:true});
  assert.deepEqual(projected.map(item=>item.id),evaluations.map(e=>e.item.id));
  assert.equal(projected[0].id,'housing');
  const updated=ranked(records,{confirmed:true},{housing:{status:'SUBMITTED'},employment:{disposition:'SKIP'}},now);
  assert.deepEqual(projectFunding(updated,{ownerStateAvailable:true}).map(item=>item.id),['business']);
  assert.deepEqual(projectFunding(ranked(records,{confirmed:true},{},now+15*86400000),{ownerStateAvailable:true}),[]);
  const duplicated=[...evaluations,...evaluations];
  assert.equal(projectFunding(duplicated,{ownerStateAvailable:true}).length,3);
  assert.deepEqual(desktopRecommendations([], {now,freshAt:stamp}).funding,[]);
});
