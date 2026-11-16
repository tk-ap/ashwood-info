#!/usr/bin/env node
// Local-only ALVIRA seed preflight. Nothing is imported, published, or logged
// from private note bodies. Use with approved inputs on an authorized machine.
import { readFileSync } from 'node:fs';
import { extname, basename } from 'node:path';
import { createHash } from 'node:crypto';

const sha256 = v => createHash('sha256').update(v).digest('hex');
const text = v => typeof v==='string' ? v.trim() : '';
function draftsFromMirror(obj) {
  if (!obj || !obj.normalized || typeof obj.normalized!=='object' || Array.isArray(obj.normalized))
    throw Error('Not a recognized normalized ALVIRA Context mirror');
  const drafts=[];
  for(const [category,items] of Object.entries(obj.normalized)){
    if(!Array.isArray(items) || items.length===0)continue;
    const body=items.map(item=>{
      if(typeof item==='string')return '- '+item;
      if(item && typeof item==='object')return '- '+Object.entries(item).map(([k,v])=>k+': '+String(v)).join(' | ');
      return '- [unrecognized]';
    }).join('\n');
    drafts.push({
      title:'ALVIRA seed · '+category.replace(/([a-z])([A-Z])/g,'$1 $2'),
      body_markdown:body,
      category,
      epistemic_status:'INFERRED',
      owner_confirmed:false,
      disposition:'NEEDS_REVIEW'
    });
  }
  return drafts;
}
export function reviewSeed({name,bytes}) {
  if(!bytes || bytes.length>5_000_000)throw Error('Seed must be nonempty and at most 5 MB');
  const ext=extname(name).toLowerCase();
  const digest=sha256(bytes);
  let drafts,kind,sourceDate=null,sourceName=null,sourceExportConfirmed=false;
  if(ext==='.md'||ext==='.txt'){
    kind='markdown';
    const body=bytes.toString('utf8').trim();
    if(!body)throw Error('Empty Markdown seed');
    const firstLine=body.split(/\r?\n/).find(l=>l.trim())||'';
    const title=firstLine.replace(/^#+\s*/,'').slice(0,160)||'ALVIRA seed note';
    drafts=[{title,body_markdown:body,category:'source-document',
      epistemic_status:'INFERRED',owner_confirmed:false,disposition:'NEEDS_REVIEW'}];
  }else if(ext==='.json'){
    kind='alvira-context-mirror';
    const obj=JSON.parse(bytes.toString('utf8'));
    drafts=draftsFromMirror(obj);
    sourceDate=text(obj.sourceUpdatedAt)||null;
    sourceName=text(obj.source)||null;
    sourceExportConfirmed=obj.sourceExportConfirmed===true;
  }else{
    throw Error('Provide a Markdown/TXT file or ALVIRA normalized JSON; extract ZIP privately before review');
  }
  const manifest={
    contract:'ashwood-brain-seed-review/v1',
    input_name:basename(name),
    kind,
    source_name:sourceName,
    source_updated_at:sourceDate,
    source_export_confirmed:sourceExportConfirmed,
    actor_provenance:'UNVERIFIED',
    subject_confirmation:'NOT_ESTABLISHED',
    original_sha256:digest,
    note_count:drafts.length,
    imported:false,
    requires_owner_review:true,
    notes:drafts.map((item,i)=>({
      index:i,category:item.category,
      // Fingerprint without including private note contents.
      fingerprint:sha256(item.category+'\0'+item.body_markdown),
      epistemic_status:item.epistemic_status,
      disposition:item.disposition
    }))
  };
  return {manifest,drafts};
}
if(process.argv[1] && import.meta.url === new URL('file://'+process.argv[1]).href){
  const inputs=process.argv.slice(2);
  if(!inputs.length){console.error('Usage: node scripts/brain-seed-review.mjs <ALVIRA-seed.md|normalized.json> [more files]');process.exitCode=2}
  else for(const file of inputs){
    try{const {manifest}=reviewSeed({name:file,bytes:readFileSync(file)});console.log(JSON.stringify(manifest,null,2))}
    catch(error){console.error(basename(file)+': '+error.message);process.exitCode=1}
  }
}
