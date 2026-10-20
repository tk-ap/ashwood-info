import test from 'node:test';
import assert from 'node:assert/strict';
import { DAILY_PRACTICES, dailyPracticeFor, natalReferenceFor } from '../workspace/self-practice.mjs';

test('one local date has stable daily practice', () => {
  const morning = dailyPracticeFor(new Date(2026, 9, 20, 8, 5));
  const evening = dailyPracticeFor(new Date(2026, 9, 20, 22, 30));
  assert.equal(morning, evening);
  assert.ok(morning.action && morning.reflection && morning.evening);
});

test('next local day rotates authored practice', () => {
  assert.notEqual(dailyPracticeFor(new Date(2026, 9, 20)), dailyPracticeFor(new Date(2026, 9, 21)));
  assert.equal(DAILY_PRACTICES.length, 7);
});

test('natal lens requires matching preexisting chart source, never invents it', () => {
  const chart = 'Astrology: Libra Sun · Scorpio Moon · Cancer Rising';
  assert.match(natalReferenceFor(chart, 'libra').title, /Libra Sun/);
  assert.match(natalReferenceFor(chart, 'scorpio').title, /Scorpio Moon/);
  assert.match(natalReferenceFor(chart, 'cancer').title, /Cancer Rising/);
  assert.equal(natalReferenceFor('', 'libra'), null);
  assert.equal(natalReferenceFor(chart, 'capricorn'), null);
});
