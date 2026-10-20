import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
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
  assert.match(natalReferenceFor(chart, 'sun').title, /Libra Sun/);
  assert.match(natalReferenceFor(chart, 'moon').title, /Scorpio Moon/);
  assert.match(natalReferenceFor(chart, 'rising').title, /Cancer Rising/);
  assert.equal(natalReferenceFor('', 'sun'), null);
  assert.equal(natalReferenceFor(chart, 'other'), null);
  const synthetic = 'Astrology: DEMO Sun · DEMO Moon · DEMO Rising.';
  assert.match(natalReferenceFor(synthetic, 'sun').title, /DEMO Sun/);
});

test('Self daily practice is reachable through the fail-closed six-view Workspace shell', async () => {
  const [html, views] = await Promise.all([
    readFile(new URL('../workspace/index.html', import.meta.url), 'utf8'),
    readFile(new URL('../workspace/views.mjs', import.meta.url), 'utf8')
  ]);
  assert.match(views, /self:\s*\[[\s\S]*?"#self-practice"/);
  assert.match(html, /id="self-practice"/);
  assert.match(html, /src="\/workspace\/self-practice\.mjs/);
  assert.match(html, /href="\/workspace\/self-practice\.css/);
  assert.match(html, /data-workspace-nav="self"/);
});

test('complete-site here.now demo artifact requires Self JS and CSS', async () => {
  const builder = await readFile(new URL('../scripts/build-here-now-staging.mjs', import.meta.url), 'utf8');
  assert.match(builder, /'workspace\/self-practice\.mjs'/);
  assert.match(builder, /'workspace\/self-practice\.css'/);
  assert.match(builder, /Incomplete Self staging integration/);
  assert.match(builder, /DEMO_ONLY_NO_PRIVATE_API_OR_RECORDS/);
  assert.match(builder, /Cannot prove Self profile sanitization/);
  assert.match(builder, /Personal natal profile detected/);
  assert.match(builder, /DEMO Sun/);
});
