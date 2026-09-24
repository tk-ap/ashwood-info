import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const scriptPath = new URL('../workspace/owner-constellation.js', import.meta.url);
const cssPath = new URL('../workspace/owner-constellation.css', import.meta.url);

test('Owner Constellation keeps real evidence signals and work-to-goal interaction', async () => {
  const source = await readFile(scriptPath, 'utf8');
  assert.match(source, /goalSnapshot\(\)/);
  assert.match(source, /productSnapshot\(\)/);
  assert.match(source, /data-owner-goal/);
  assert.match(source, /target\.click\(\)/);
  assert.match(source, /owner-constellation__metrics/);
  assert.match(source, /strongest pull/);
});

test('Owner Constellation has a legible signal hierarchy and mobile fallback', async () => {
  const css = await readFile(cssPath, 'utf8');
  for (const selector of ['.owner-node--goal', '.owner-node--product', '.owner-node--quiet', '.owner-constellation__metrics', '.owner-legend-dot--goal']) {
    assert.match(css, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(css, /@media\(max-width:760px\)/);
  assert.match(css, /prefers-reduced-motion:no-preference/);
});
