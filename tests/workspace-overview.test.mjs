import test from 'node:test';
import assert from 'node:assert/strict';
import { activityDays, connections } from '../workspace/overview.mjs';
const now = new Date('2026-09-06T12:00:00Z');
const goals = [{id:'ownership'}, {id:'learning'}, {id:'music'}];
const evidence = [
  {date:'2026-09-06T09:00:00Z', sourceLabel:'ALVIRA', goal:'ownership', secondaryGoals:['ownership','learning']},
  {date:'2026-09-05T09:00:00Z', sourceLabel:'ALVIRA', goal:'learning'},
  {date:null, sourceLabel:'ailhat', goal:'ownership'},
  {date:'invalid', sourceLabel:'ailhat', goal:'ownership'},
  {date:'2026-09-06T23:00:00Z', sourceLabel:'future', goal:'ownership'},
  {date:'2026-07-01T09:00:00Z', sourceLabel:'old', goal:'ownership'}
];
test('daily chart includes empty days and excludes undated, invalid, future and old evidence',()=>{
  const days = activityDays(evidence, 14, now);
  assert.equal(days.length, 14);
  assert.equal(days.at(-1).date, '2026-09-06');
  assert.equal(days.at(-1).items.length, 1);
  assert.equal(days.flatMap(day=>day.items).length, 2);
  assert.equal(days[0].items.length, 0);
});
test('connections count each item once per goal and retain secondary mappings',()=>{
  assert.deepEqual(connections(goals,evidence,now), [{source:'ALVIRA',counts:[1,2,0]}]);
});
test('empty sources produce no fabricated connections',()=>assert.deepEqual(connections(goals,[],now),[]));
