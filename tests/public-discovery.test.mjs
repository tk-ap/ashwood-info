import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('the public ASHWOOD menu indexes every public landing page and provides visitor orientation', async () => {
  const [nav, guide, work, workStyles, routeVisuals, theme] = await Promise.all([
    read('v3-nav.js'),
    read('guide/index.html'),
    read('work/index.html'),
    read('work/work.css'),
    read('work/work-route-visuals.js'),
    read('theme.js')
  ]);
  // Portfolio and Partners remain legacy redirects to Modeling and Support;
  // every canonical public landing page is discoverable here.
  const publicLandingPages = ['/', '/work/', '/career/', '/modeling/', '/music/', '/performance/', '/journal/', '/dispatch/', '/ai-from-zero/', '/ai-from-zero/build-gate/', '/ai-from-zero/continuity/', '/ai-from-zero/reference/', '/about/', '/connect/', '/sponsor/'];
  for (const href of publicLandingPages) {
    assert.match(nav, new RegExp('href="' + href.replaceAll('/', '\\/') + '"'));
  }
  assert.equal((nav.match(/<a href="\//g) || []).filter(link => link).length >= publicLandingPages.length, true);
  assert.match(nav, /FIND YOUR WAY IN/);
  assert.doesNotMatch(nav, /Explore pages/);
  assert.match(nav, /mouseenter/);
  assert.match(nav, /type="search"/);
  assert.match(nav, /No public page matches that search/);
  assert.match(nav, /background:var\(--ashwood-paper\)/);
  assert.match(nav, /Creative Practice/);
  assert.match(nav, /Professional Evidence/);
  assert.doesNotMatch(nav, /href="\/guide\//);
  assert.doesNotMatch(nav, /Journal lab/);
  assert.doesNotMatch(nav, /href="\/workspace\//);
  assert.match(theme, /installPublicNavigation/);
  assert.match(theme, /id: "tokyo-night"/);
  assert.match(theme, /--ashwood-paper:#1a1b26/);
  assert.match(theme, /--ashwood-accent-2:#7aa2f7/);
  assert.match(theme, /v3-nav\.js\?v=20261021-globaltype1/);
  assert.match(theme, /--ashwood-font-system:"Geist"/);
  assert.match(theme, /font-family:var\(--ashwood-font-system\)!important/);
  assert.match(guide, /canonical" href="https:\/\/ashwood-info\.vercel\.app\/work\//);
  assert.match(guide, /location\.replace\('\/work\/' \+ location\.search \+ location\.hash\)/);
  assert.match(work, /id="choose"/);
  assert.match(work, /Private owner tools are intentionally not listed/);
  assert.match(work, /Professional Evidence/);
  for (const route of ['career', 'creative', 'builds', 'connect']) {
    assert.match(work, new RegExp(`data-route-visual="${route}"`));
  }
  assert.match(routeVisuals, /Math\.random/);
  assert.match(routeVisuals, /career:/);
  assert.match(routeVisuals, /creative:/);
  assert.match(routeVisuals, /builds:/);
  assert.match(routeVisuals, /connect:/);
  assert.doesNotMatch(workStyles, /min-height:92svh/);
  assert.match(workStyles, /work-scroll,\.work-professional-link\{[^}]*border:0/);
});

test('Career receives the staged operating-thesis hero and its interactive modes', async () => {
  const [html, css, runtime] = await Promise.all([
    read('career/index.html'),
    read('career/career.css'),
    read('career/career.js')
  ]);
  assert.match(html, /Interactive résumé \/ operating thesis/);
  assert.match(html, /career\.css\?v=20261021-live-layer2/);
  assert.match(html, /career\.js\?v=20261021-live-layer1/);
  assert.match(html, /I turn messy operating problems into systems people/);
  assert.match(html, /data-ir-key="throughput"/);
  assert.match(html, /data-ir-key="product"/);
  assert.match(html, /data-ir-key="signal"/);
  assert.match(html, /href="#experience"/);
  assert.match(html, /href="#systems"/);
  assert.match(css, /\.ir-hero/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(runtime, /modeContent/);
  assert.match(runtime, /aria-pressed/);
  assert.doesNotMatch(html, /career-proof-strip/);
  assert.match(html, /<section class="ir-flow" aria-label="TK operating layer">/);
  assert.match(html, /data-ir-step="context"/);
  assert.match(runtime, /stepContent/);
  assert.match(runtime, /data-ir-step/);
  assert.match(css, /min-height:clamp\(560px,74svh,760px\)/);
  assert.match(css, /border-radius:999px/);
  assert.match(css, /\.ir-steps\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)\}/);
});

test('standalone public landing pages load the shared discovery navigation', async () => {
  for (const page of ['sponsor/index.html', 'work/index.html']) {
    assert.match(await read(page), /\/theme\.js\?v=20261021-globaltype1/);
  }
});

test('Journal Lab preserves legacy links but redirects visitors into the single Build Journal', async () => {
  const page = await read('journal-lab/index.html');
  assert.match(page, /canonical" href="https:\/\/ashwood-info\.vercel\.app\/journal\//);
  assert.match(page, /location\.replace\('\/journal\/' \+ location\.search \+ location\.hash\)/);
  assert.match(page, /The Journal Lab is now part of the/);
});
