import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('modeling leads with the current long-locs studio series while retaining the archive', async () => {
  const [html, css] = await Promise.all([
    read('modeling/index.html'),
    read('portfolio/portfolio.css')
  ]);

  assert.match(html, /id="current-studio"/);
  for (const asset of ['long-locs-full-length.jpg', 'long-locs-front.jpg', 'long-locs-profile.jpg', 'long-locs-three-quarter.jpg', 'long-locs-white-tee.jpg', 'gel-portrait.jpg']) {
    assert.match(html, new RegExp(`/assets/modeling/current-studio-2026/${asset.replace('.', '\\.')}`));
  }
  assert.match(html, /id="work"/);
  assert.match(html, /class="archive-grid"/);
  assert.match(css, /\.studio-grid/);
});

test('Tokyo Night is a global theme and the modeling page inherits its shared palette', async () => {
  const [theme, css] = await Promise.all([
    read('theme.js'),
    read('portfolio/portfolio.css')
  ]);

  assert.match(theme, /id: "tokyo-night"/);
  assert.match(theme, /html\[data-ashwood-theme="tokyo-night"\]/);
  assert.match(theme, /label: "Tokyo Night"/);
  assert.match(css, /html\[data-ashwood-theme\] \.portfolio-page/);
});
