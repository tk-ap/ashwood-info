import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ALIGNMENT_LENSES, alignmentLensFor, mountSelfAlignmentMirror, approvedChiefAimFromContexts} from '../workspace/self-alignment.mjs';

test('mirror provides six grounded, distinct philosophical prompts', () => {
  assert.equal(ALIGNMENT_LENSES.length, 6);
  const ids = new Set();
  for (const lens of ALIGNMENT_LENSES) {
    assert.ok(lens.id && lens.label && lens.thinker && lens.work);
    assert.ok(lens.idea && lens.affirmation && lens.question && lens.action);
    assert.ok(!ids.has(lens.id));
    ids.add(lens.id);
  }
  assert.equal(alignmentLensFor('wealth').thinker, 'Erich Fromm');
  assert.equal(alignmentLensFor('missing').id, 'overwhelmed');
});

test('mirror selection changes both the reading and pressed state', () => {
  const fields = Object.fromEntries(['thinker','work','idea','affirmation','question','action'].map(key=>[key,{textContent:''}]));
  const callbacks={};
  const buttons=ALIGNMENT_LENSES.map(lens=>({
    dataset:{selfReset:lens.id}, pressed:null,
    setAttribute(name,val){if(name==='aria-pressed')this.pressed=val;},
    addEventListener(name,fn){if(name==='click')callbacks[this.dataset.selfReset]=fn;}
  }));
  const host={
    querySelectorAll(selector){assert.equal(selector,'[data-self-reset]');return buttons;},
    querySelector(selector){return fields[selector.replace('[data-mirror-','').replace(']','')];}
  };
  const root={getElementById(id){return id==='self-alignment-mirror'?host:null;}};
  mountSelfAlignmentMirror(root);
  assert.equal(fields.thinker.textContent,'Alan Watts');
  callbacks.wealth();
  assert.equal(fields.thinker.textContent,'Erich Fromm');
  assert.match(fields.affirmation.textContent,/prosperity/);
  assert.equal(buttons.find(b=>b.dataset.selfReset==='wealth').pressed,'true');
  assert.ok(buttons.filter(b=>b.pressed==='true').length===1);
  mountSelfAlignmentMirror({getElementById(){return null;}});
});

test('Self mirror is mounted to current main shell and remains in Self view', async () => {
 const [html,views,css,script]=await Promise.all([
  readFile(new URL('../workspace/index.html',import.meta.url),'utf8'),
  readFile(new URL('../workspace/views.mjs',import.meta.url),'utf8'),
  readFile(new URL('../workspace/self-alignment.css',import.meta.url),'utf8'),
  readFile(new URL('../workspace/self-alignment.mjs',import.meta.url),'utf8')
 ]);
 assert.match(html,/id="self-alignment-mirror"/);
 assert.match(html,/src="\/workspace\/self-alignment\.mjs/);
 assert.match(html,/href="\/workspace\/self-alignment\.css/);
 assert.match(views,/"#self-alignment-mirror"/);
 assert.match(html,/id="self-daily-wisdom"/);
 assert.match(html,/id="meos-places"/);
 assert.match(css,/@media\(max-width:750px\)/);
 assert.match(script,/Original interpretive prompts/);
 const inserted=html.match(/<section class="self-alignment-mirror"[\s\S]*?<\/section>/)?.[0];
 assert.ok(inserted);
 // No private owner aim, birth data or owner-authored confidential diary in static mirror.
 assert.doesNotMatch(inserted,/25,000,000|2046|birth time|birth place|Life Path 4|Scorpio Moon|Cancer Rising/);
 assert.match(inserted,/data-chief-aim-status/);
});

test('Chief Aim selector refuses unsourced, unapproved and test records', () => {
  const sample = (basis,environment='production',topic='My Definite Chief Aim') => ({
    source:'alvira', environment, topic,
    observed_at:'2026-10-23T15:00:00.000Z',
    goal_spec:{fields:{goal:{value:'An owner-approved private goal',basis}}}
  });
  assert.equal(approvedChiefAimFromContexts(null),null);
  assert.equal(approvedChiefAimFromContexts([sample('interview')]),null);
  assert.equal(approvedChiefAimFromContexts([sample('owner','test')]),null);
  assert.equal(approvedChiefAimFromContexts([sample('owner','production','Other goal')]),null);
  assert.equal(approvedChiefAimFromContexts([{...sample('owner'),source:'unknown'}]),null);
  const selected=approvedChiefAimFromContexts([sample('interview'),sample('owner')]);
  assert.equal(selected.text,'An owner-approved private goal');
  assert.equal(selected.updatedAt,'2026-10-23T15:00:00.000Z');
});
