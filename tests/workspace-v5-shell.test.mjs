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
