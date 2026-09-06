import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkScore, decisionSentence, dayKey, emptyRecord, isActiveRecord, mergeCheckin, readCheckins, streak, writeCheckins, STORAGE_KEY } from '../workspace/frame.mjs';

const now = new Date(2026, 8, 6, 12, 0, 0); // 2026-09-06, local time so the test is timezone independent
const checks = ['recognition','environment','body','reciprocity','foundation','freedom','reality_test'].map(id => ({id}));
const day = (date, checked = [], extra = {}) => ({date, checks: Object.fromEntries(checked.map(id => [id, true])), commitment: '', evening: [], ...extra});
const fakeStore = (seed = null) => { let value = seed; return {getItem: () => value, setItem: (_key, next) => { value = next; }, read: () => value}; };

test('dayKey uses the local calendar day, not UTC', () => {
  assert.equal(dayKey(new Date(2026, 8, 6, 23, 30)), '2026-09-06');
  assert.equal(dayKey(new Date(2026, 8, 6, 0, 30)), '2026-09-06');
  assert.equal(emptyRecord(now).date, '2026-09-06');
});

test('scoring counts only checks answered yes and flags a low score', () => {
  assert.deepEqual(checkScore(day('2026-09-06', ['recognition','body','freedom']), checks), {score: 3, total: 7, low: true});
  assert.deepEqual(checkScore(day('2026-09-06', ['recognition','body','freedom','reciprocity']), checks), {score: 4, total: 7, low: true});
  assert.deepEqual(checkScore(day('2026-09-06', ['recognition','body','freedom','reciprocity','foundation']), checks), {score: 5, total: 7, low: false});
  assert.deepEqual(checkScore(day('2026-09-06', checks.map(check => check.id)), checks), {score: 7, total: 7, low: false});
});

test('scoring survives a missing or malformed record and never flags an empty instrument', () => {
  assert.deepEqual(checkScore(undefined, checks), {score: 0, total: 7, low: true});
  assert.deepEqual(checkScore({date: '2026-09-06'}, checks), {score: 0, total: 7, low: true});
  assert.deepEqual(checkScore(day('2026-09-06', [], {checks: {recognition: 'yes', body: 1}}), checks), {score: 0, total: 7, low: true});
  assert.deepEqual(checkScore(day('2026-09-06'), []), {score: 0, total: 0, low: false});
});

test('a record only counts as activity once something is actually recorded', () => {
  assert.equal(isActiveRecord(day('2026-09-06')), false);
  assert.equal(isActiveRecord(day('2026-09-06', [], {commitment: '   '})), false);
  assert.equal(isActiveRecord(day('2026-09-06', [], {evening: ['', ' ']})), false);
  assert.equal(isActiveRecord(day('2026-09-06', ['body'])), true);
  assert.equal(isActiveRecord(day('2026-09-06', [], {commitment: 'Ship the frame'})), true);
  assert.equal(isActiveRecord(day('2026-09-06', [], {evening: ['', 'Stopped carrying the old contract']})), true);
  assert.equal(isActiveRecord({date: 'not-a-date', commitment: 'x'}), false);
  assert.equal(isActiveRecord(null), false);
});

test('streak counts consecutive days and stops at the first gap', () => {
  const records = ['2026-09-01','2026-09-03','2026-09-04','2026-09-05','2026-09-06'].map(date => day(date, ['body']));
  assert.equal(streak(records, now), 4);
});

test('streak is zero with no records and zero when the last entry is older than yesterday', () => {
  assert.equal(streak([], now), 0);
  assert.equal(streak([day('2026-09-04', ['body'])], now), 0);
});

test('streak survives an untouched today by anchoring on yesterday', () => {
  assert.equal(streak([day('2026-09-04', ['body']), day('2026-09-05', ['body'])], now), 2);
  assert.equal(streak([day('2026-09-05', ['body']), day('2026-09-06')], now), 1, 'an empty record for today must not break yesterday\'s streak');
});

test('a same-day double entry replaces the first record and never counts twice', () => {
  const first = day('2026-09-06', ['body']);
  const second = day('2026-09-06', ['body','freedom'], {commitment: 'One durable thing'});
  const records = mergeCheckin(mergeCheckin([day('2026-09-05', ['body'])], first), second);
  assert.equal(records.length, 2);
  assert.deepEqual(records.map(record => record.date), ['2026-09-05','2026-09-06']);
  assert.equal(records.at(-1).commitment, 'One durable thing');
  assert.equal(streak(records, now), 2);
});

test('merge refuses a record with no usable date and keeps the list sorted', () => {
  assert.deepEqual(mergeCheckin([day('2026-09-06', ['body'])], {date: null}).map(record => record.date), ['2026-09-06']);
  assert.deepEqual(mergeCheckin([day('2026-09-06'), day('2026-09-02')], day('2026-09-04')).map(record => record.date), ['2026-09-02','2026-09-04','2026-09-06']);
});

test('storage round-trips through the check-in key and tolerates a hostile browser', () => {
  const store = fakeStore();
  assert.deepEqual(readCheckins(store), []);
  assert.equal(writeCheckins([day('2026-09-06', ['body'])], store), true);
  assert.equal(JSON.parse(store.read()).version, 1);
  assert.deepEqual(readCheckins(store).map(record => record.date), ['2026-09-06']);
  assert.deepEqual(readCheckins(fakeStore('{not json')), []);
  assert.deepEqual(readCheckins(fakeStore('{"records":{"a":1}}')), []);
  assert.deepEqual(readCheckins(fakeStore('{"records":[{"date":"nope"},{"date":"2026-09-06"}]}')).map(record => record.date), ['2026-09-06']);
  const blocked = {getItem() { throw new Error('private window'); }, setItem() { throw new Error('private window'); }};
  assert.deepEqual(readCheckins(blocked), []);
  assert.equal(writeCheckins([], blocked), false);
  assert.deepEqual(readCheckins(undefined), []);
  assert.equal(writeCheckins([], undefined), false, 'no storage means nothing was saved, and the surface must be told so');
  assert.equal(STORAGE_KEY, 'ashwood.workspace.checkin.v1');
});

test('the decision sentence prefers the recorded key and labels the fallback honestly', () => {
  assert.deepEqual(decisionSentence({decision_sentence: 'Choose the smallest honest step.', decision_compass: {default_priority: 'Protect clarity first.'}}), {text: 'Choose the smallest honest step.', label: 'Decision sentence', canonical: true});
  assert.deepEqual(decisionSentence({decision_compass: {default_priority: 'Protect clarity first.'}}), {text: 'Protect clarity first.', label: 'Default priority', canonical: false});
  assert.equal(decisionSentence({decision_sentence: '   '}), null);
  assert.equal(decisionSentence({}), null);
});

test('the shipped goal model exposes the seven-check instrument the surface scores against', () => {
  const model = JSON.parse(readFileSync(new URL('../workspace/goals.json', import.meta.url), 'utf8'));
  assert.equal(model.decision_compass.checks.length, 7);
  assert.deepEqual(model.decision_compass.checks.map(check => check.id), checks.map(check => check.id));
  assert.equal(model.alignment_dimensions.length, 6, 'the six-check variant is retained but is not the instrument');
  assert.equal(model.evening_evidence.prompts.length, 2);
  assert.ok(model.decision_compass.warning);
});
