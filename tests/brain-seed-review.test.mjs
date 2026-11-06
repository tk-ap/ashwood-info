import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewSeed } from '../scripts/brain-seed-review.mjs';
test('normalized ALVIRA mirror produces review-only manifest with no interview text',()=>{
 const source={
   schema:'ashwood.workspace/self-context/v1',
   source:'ALVIRA Context Mirror',
   sourceUpdatedAt:'2026-09-24',
   sourceExportConfirmed:true,
   normalized:{operatingModel:['Private marker never belongs in CI output'],tensions:['Source attribution pending']}
 };
 const {manifest,drafts}=reviewSeed({name:'source.json',bytes:Buffer.from(JSON.stringify(source))});
 assert.equal(manifest.note_count,2);
 assert.equal(manifest.imported,false);
 assert.equal(manifest.requires_owner_review,true);
 assert.equal(manifest.actor_provenance,'UNVERIFIED');
 assert.equal(manifest.subject_confirmation,'NOT_ESTABLISHED');
 assert.equal(manifest.notes[0].epistemic_status,'INFERRED');
 assert.match(drafts[0].body_markdown,/Private marker/);
 assert.doesNotMatch(JSON.stringify(manifest),/Private marker|Source attribution pending/);
 const repeat=reviewSeed({name:'source.json',bytes:Buffer.from(JSON.stringify(source))});
 assert.deepEqual(manifest.notes.map(x=>x.fingerprint),repeat.manifest.notes.map(x=>x.fingerprint));
});
test('raw Markdown is review-only, and unrecognized ZIP does not get ingested',()=>{
 const {manifest}=reviewSeed({name:'interview.md',bytes:Buffer.from('# Private interview\n\nSensitive wording')});
 assert.equal(manifest.kind,'markdown');
 assert.equal(manifest.note_count,1);
 assert.doesNotMatch(JSON.stringify(manifest),/Sensitive wording/);
 assert.throws(()=>reviewSeed({name:'interview.zip',bytes:Buffer.from('not zip')}),/extract ZIP privately/);
});
