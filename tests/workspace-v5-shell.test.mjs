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

test('the here.now fixture is static and labels all workspace records as demo or unavailable', async () => {
  const [html, runtime] = await Promise.all([
    readFile(new URL('../.agent-os/here-now-workspace/index.html', import.meta.url), 'utf8'),
    readFile(new URL('../.agent-os/here-now-workspace/workspace/sandbox.mjs', import.meta.url), 'utf8')
  ]);
  assert.match(html, /DEMO SANDBOX · NO PRIVATE DATA/);
  assert.match(html, /https:\/\/ashwood-info\.vercel\.app\/career/);
  assert.match(html, /Saturn Return Companion is a separate private reflection/);
  assert.doesNotMatch(runtime, /fetch\s*\(/);
  assert.match(runtime, /addEventListener\("hashchange", selectFromHash\)/);
});

test('the public ASHWOOD menu indexes every public landing page and provides a visit guide', async () => {
  const [nav, guide] = await Promise.all([
    readFile(new URL('../v3-nav.js', import.meta.url), 'utf8'),
    readFile(new URL('../guide/index.html', import.meta.url), 'utf8')
  ]);
  for (const href of ['/', '/guide/', '/work/', '/career/', '/modeling/', '/music/', '/performance/', '/portfolio/', '/journal/', '/dispatch/', '/ai-from-zero/', '/dive-deeper/', '/journal-lab/', '/about/', '/connect/', '/sponsor/', '/partners/']) {
    assert.match(nav, new RegExp('href="' + href.replaceAll('/', '\\/') + '"'));
  }
  assert.match(nav, /VISIT GUIDE/);
  assert.match(nav, /Explore pages/);
  assert.match(nav, /mouseenter/);
  assert.match(nav, /type="search"/);
  assert.match(nav, /No public page matches that search/);
  assert.doesNotMatch(nav, /href="\/workspace\//);
  assert.match(guide, /Private owner tools are intentionally not listed/);
});
