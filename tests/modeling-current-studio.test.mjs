import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('modeling leads with one current editorial hero while retaining the archive', async () => {
  const [html, css, hero] = await Promise.all([
    read('modeling/index.html'),
    read('portfolio/portfolio.css'),
    read('modeling/site-hero.json')
  ]);

  assert.doesNotMatch(html, /id="current-studio"/);
  assert.doesNotMatch(html, /long-locs-(?:front|profile|three-quarter|full-length|white-tee)\.jpg/);
  assert.match(html, /href="#striped-attire">View selected work<\/a>/);
  assert.match(html, /id="work"/);
  assert.match(html, /class="archive-grid"/);
  assert.doesNotMatch(css, /\.studio-grid/);
  assert.match(hero, /gel-portrait\.jpg/);
  assert.match(html, /campaign-hero:start[\s\S]*gel-portrait\.jpg/);
});

test('the Octavia digitals are withheld until they are replaced', async () => {
  const html = await read('modeling/index.html');
  assert.doesNotMatch(html, /assets\/digitals2026\//);
  assert.doesNotMatch(html, /Current digitals/i);
  assert.match(html, /Model details\./);
});

test('Tokyo Night is a global theme and the modeling page inherits its shared palette', async () => {
  const [theme, css, shell] = await Promise.all([
    read('theme.js'),
    read('portfolio/portfolio.css'),
    read('creative-shell.css')
  ]);

  assert.match(theme, /id: "tokyo-night"/);
  assert.match(theme, /html\[data-ashwood-theme="tokyo-night"\]/);
  assert.match(theme, /label: "Tokyo Night"/);
  assert.match(css, /html\[data-ashwood-theme\] \.portfolio-page/);
  assert.match(css, /--hero-accent: #bfc8ff/);
  assert.match(shell, /\.ashwood-site-header__section,\.ashwood-site-header \.v3-global-nav__hint\{display:none\}/);
});
