import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('legacy public routes preserve a visitor’s query and hash while redirecting to canonical pages', async () => {
  const routes = [
    ['portfolio/index.html', 'modeling'],
    ['dive-deeper/index.html', 'work'],
    ['partners/index.html', 'sponsor'],
    ['guide/index.html', 'work']
  ];

  for (const [file, destination] of routes) {
    const page = await read(file);
    assert.match(page, new RegExp(`canonical" href="https://ashwood-info\\.vercel\\.app/${destination}/"`));
    const target = file === 'dive-deeper/index.html' ? `/${destination}/#choose` : `/${destination}/`;
    assert.ok(page.includes(`location.replace('${target}' + location.search + location.hash);`));
    assert.match(page, new RegExp(`href="${target}"`));
  }
});

test('public navigation and guides point at canonical pages, not duplicate landing routes', async () => {
  const [nav, guide, sitemap, identity, parity, curiosity, theme, home, journalLab, dispatch, article] = await Promise.all([
    read('v3-nav.js'),
    read('guide/index.html'),
    read('sitemap.xml'),
    read('v3-identity-thesis.js'),
    read('v3-parity.js'),
    read('curiosity.js'),
    read('theme.js'),
    read('index.html'),
    read('journal-lab/index.html'),
    read('dispatch/index.html'),
    read('dispatch/001-the-mind-is-the-moat/index.html')
  ]);

  for (const text of [nav, guide, identity, parity, curiosity, theme, home, journalLab, dispatch, article]) {
    assert.doesNotMatch(text, /href="\/(?:portfolio|dive-deeper|partners|journal-lab)\/?(?:["#?])/);
  }

  for (const href of ['/', '/work/', '/career/', '/modeling/', '/music/', '/performance/', '/journal/', '/dispatch/', '/ai-from-zero/', '/about/', '/connect/', '/sponsor/']) {
    assert.match(nav, new RegExp(`href="${href.replaceAll('/', '\\/')}"`));
  }
  assert.doesNotMatch(nav, /href="\/(?:portfolio|dive-deeper|partners|journal-lab)\//);
  assert.doesNotMatch(sitemap, /https:\/\/ashwood-info\.vercel\.app\/(?:guide|dive-deeper|journal-lab)/);
  assert.match(journalLab, /location\.replace\('\/journal\/' \+ location\.search \+ location\.hash\)/);
  assert.match(nav, /See the full orientation/);
  assert.doesNotMatch(nav, /href="\/guide\//);
  assert.doesNotMatch(nav.match(/<summary>Start here<\/summary>[\s\S]*?<\/details>/)?.[0] ?? '', /Guide/);
});
