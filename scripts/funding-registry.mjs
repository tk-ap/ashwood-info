import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {upsert, sourceKey, evidenceCurrent, DISPOSITIONS, LIFECYCLE} from '../workspace/funding/model.mjs';
export const REGISTRY_PATH='workspace/funding/opportunities.json';
export function validateRegistry(registry) {
  const ids=new Set();
  for(const item of registry.opportunities) {
    if(!item.id || ids.has(item.id)) throw new Error('Missing or duplicate opportunity ID');
    ids.add(item.id);
    if(!item.name || !item.funder || !sourceKey(item.source_url)) throw new Error('Invalid program identity or official source');
    if(!LIFECYCLE.includes(item.status) || !DISPOSITIONS.includes(item.disposition)) throw new Error('Invalid lifecycle or disposition');
    if(!Array.isArray(item.criteria) || !Array.isArray(item.unknowns) || !Array.isArray(item.categories)) throw new Error('Missing eligibility/category arrays');
  }
  return registry;
}
// Reports are transient agent output, never a second opportunity store.
export function applyReport(registry, report, now = new Date().toISOString()) {
  if(!Array.isArray(report.records)) throw new Error('records array required');
  const next=structuredClone(registry);
  const allowed=new Set(['id','program_key','name','aliases','funder','source_url','source_label','type','categories','applicant_lane','value','amount','repayable','interest_percent','fees','criteria','unknowns','eligibility_rules','veteran_requirements','employment_requirements','income_requirements','geography','match_tags','deadline','application_window','availability','documents','time_to_funding_days','training_weeks','employment_ready_at','effort','benefit_interactions','last_verified_at','evidence','verification','confidence','disposition','reason','next_action','action_deadline','related_ids']);
  for(const incoming of report.records) {
    for(const key of Object.keys(incoming)) if(!allowed.has(key)) throw new Error('Unsupported/public-private boundary field: '+key);
    upsert(next,incoming,now);
  }
  next.generated_at=now;
  next.last_scan_at=now;
  return validateRegistry(next);
}
export function dueRecords(registry, now=Date.now()) {
  return registry.opportunities.filter(item=>!evidenceCurrent(item,now)).map(item=>({id:item.id,source_url:item.source_url,verification:item.verification}));
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const registry=JSON.parse(fs.readFileSync(REGISTRY_PATH,'utf8'));
  if(process.argv.includes('--due')) console.log(JSON.stringify(dueRecords(registry),null,2));
  else if(process.argv.includes('--validate')) {validateRegistry(registry); console.log(`Valid canonical registry: ${registry.opportunities.length} records`);}
  else if(process.argv.includes('--apply')) {
    const report=JSON.parse(fs.readFileSync(0,'utf8'));
    const updated=applyReport(registry,report);
    fs.writeFileSync(REGISTRY_PATH,JSON.stringify(updated,null,2)+'\n');
    console.log(`Updated canonical registry: ${updated.opportunities.length} records`);
  } else throw new Error('Use --validate, --due or --apply (JSON report on stdin)');
}
