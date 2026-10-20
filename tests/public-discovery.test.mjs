import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('the public ASHWOOD menu indexes every public landing page and provides a visit guide', async () => {
  const [nav, guide, theme] = await Promise.all([
    read('v3-nav.js'),
    read('guide/index.html'),
    read('theme.js')
  ]);
  for (const href of ['/', '/guide/', '/work/', '/career/', '/modeling/', '/music/', '/performance/', '/journal/', '/dispatch/', '/ai-from-zero/', '/dive-deeper/', '/journal-lab/', '/about/', '/connect/', '/sponsor/', '/partners/']) {
    assert.match(nav, new RegExp('href="' + href.replaceAll('/', '\\/') + '"'));
  }
  assert.match(nav, /<span>Work overview<\/span>/);
  assert.doesNotMatch(nav, /href="\\/portfolio\\/"/);
  assert.match(nav, /VISIT GUIDE/);
  assert.match(nav, /Explore pages/);
  assert.match(nav, /mouseenter/);
  assert.match(nav, /type="search"/);
  assert.match(nav, /No public page matches that search/);
  assert.doesNotMatch(nav, /href="\/workspace\//);
  assert.match(theme, /installPublicNavigation/);
  assert.match(guide, /Private owner tools are intentionally not listed/);
});

test('Career receives the staged operating-thesis hero and its interactive modes', async () => {
  const [html, css, runtime] = await Promise.all([
    read('career/index.html'),
    read('career/career.css'),
    read('career/career.js')
  ]);
  assert.match(html, /Interactive résumé \/ operating thesis/);
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
});

test('standalone public landing pages load the shared discovery navigation', async () => {
  for (const page of ['guide/index.html', 'journal-lab/index.html', 'sponsor/index.html']) {
    assert.match(await read(page), /\/theme\.js\?v=20261019-navigation1/);
  }
});
