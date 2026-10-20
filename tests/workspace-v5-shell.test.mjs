import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { provenanceChip } from '../workspace/provenance-chip.mjs';

test('provenance chips fail closed to awaiting verification and escape display text', () => {
  const chip = provenanceChip({ source:'Agent <source>', state:'untrusted-state', age:'1h ago' });
  assert.match(chip, /Agent &lt;source&gt;/);
  assert.match(chip, /AWAITING VERIFICATION/);
  assert.match(chip, /1h ago/);
});

test('Today offers source-aware reading without adding a write control for LEDGATo', async () => {
  const [html, source] = await Promise.all([
    readFile(new URL('../workspace/index.html', import.meta.url), 'utf8'),
    readFile(new URL('../workspace/today.mjs', import.meta.url), 'utf8')
  ]);
  for (const section of ['today','build','work','network','evidence','self']) {
    assert.match(html, new RegExp('data-workspace-nav="' + section + '"'));
  }
  assert.match(html, /LEDGATo · read-only/);
  assert.match(source, /Note as handled/);
  assert.match(source, /provenanceChip/);
  assert.match(source, /slice\(0, 4\)/);
  assert.doesNotMatch(html, /Approve decision|Deny decision/);
});

test('the public sandbox has a source-controlled DEMO fixture layer before its API bootstrap', async () => {
  const [builder, fixtures, bootstrap] = await Promise.all([
    readFile(new URL('../scripts/build-here-now-staging.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../workspace/sandbox-demo-fixtures.js', import.meta.url), 'utf8'),
    readFile(new URL('../workspace/sandbox-bootstrap.js', import.meta.url), 'utf8')
  ]);
  assert.match(builder, /sandbox-demo-fixtures\.js/);
  assert.match(fixtures, /Every value is invented/);
  assert.match(fixtures, /DEMO fixture/);
  assert.match(bootstrap, /DEMO sandbox is read-only/);
  assert.match(bootstrap, /External data is unavailable/);
  assert.match(bootstrap, /api\.github\.com/);
});
