import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Funding Intelligence route and registry exist with explicit freshness', () => {
  const html = fs.readFileSync('workspace/funding/index.html','utf8');
  const data = JSON.parse(fs.readFileSync('workspace/funding/opportunities.json','utf8'));
  assert.match(html, /Private funding intelligence/);
  assert.ok(Array.isArray(data.opportunities) && data.opportunities.length >= 5);
  for (const item of data.opportunities) {
    assert.ok(item.source_url);
    assert.ok(item.last_verified_at);
    assert.ok(item.status);
    assert.ok(Array.isArray(item.unknowns));
  }
});

test('Sensitive matching profile is local-only and not pre-populated', () => {
  const js = fs.readFileSync('workspace/funding/funding.mjs','utf8');
  assert.match(js, /localStorage/);
  assert.match(js, /black_founder/);
  assert.match(js, /lgbtq/);
  assert.match(js, /nonbinary_trans/);
  assert.doesNotMatch(js, /black_founder['"]\s*:\s*true/);
  assert.doesNotMatch(js, /lgbtq['"]\s*:\s*true/);
  assert.doesNotMatch(js, /nonbinary_trans['"]\s*:\s*true/);
});

test('Funding statuses never default seed records to awarded', () => {
  const data = JSON.parse(fs.readFileSync('workspace/funding/opportunities.json','utf8'));
  assert.ok(data.opportunities.every(item => item.status !== 'AWARDED'));
});
