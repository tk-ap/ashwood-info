import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { universeEntries, universeGroups, universePublicationGuide } from '../universe/content.mjs';

test('the Universe registry keeps public threads distinct and publishable', () => {
  const ids = new Set();
  const groups = new Set(universeGroups.map(group => group.id));
  for (const entry of universeEntries) {
    assert.ok(entry.id && !ids.has(entry.id), `unique id for ${entry.title}`);
    ids.add(entry.id);
    assert.ok(groups.has(entry.group), `${entry.id} has a declared group`);
    assert.ok(entry.x >= 5 && entry.x <= 95 && entry.y >= 5 && entry.y <= 95, `${entry.id} stays inside the map`);
    assert.match(entry.summary, /\S+/);
    assert.equal(typeof entry.href === 'string' || entry.href === null, true);
    for (const relatedId of entry.related) assert.ok(universeEntries.some(candidate => candidate.id === relatedId), `${entry.id} has a real relationship`);
  }
  assert.equal(universePublicationGuide.source, 'universe/content.mjs');
  assert.ok(universeEntries.some(entry => entry.group === 'archive' && entry.href === null), 'unpublished work is visibly held rather than invented');
  const music = universeEntries.find(entry => entry.id === 'music');
  assert.match(music.previewHref, /^https:\/\//, 'music preview is an explicit HTTPS render');
});

test('the Universe offers both optional interaction and a readable reduced-motion-safe index', async () => {
  const [html, css, runtime] = await Promise.all([
    readFile(new URL('../universe/index.html', import.meta.url), 'utf8'),
    readFile(new URL('../universe/universe.css', import.meta.url), 'utf8'),
    readFile(new URL('../universe/universe.js', import.meta.url), 'utf8')
  ]);
  assert.match(html, /data-universe-stage/);
  assert.match(html, /data-universe-viewport/);
  assert.match(html, /data-universe-reset/);
  assert.match(html, /data-universe-index/);
  assert.match(html, /<noscript>/);
  assert.match(html, /aria-live="polite"/);
  assert.match(runtime, /universeEntries/);
  assert.match(runtime, /aria-pressed/);
  assert.match(runtime, /pointerdown/);
  assert.match(runtime, /wheel/);
  assert.match(runtime, /previewHref/);
  assert.match(runtime, /sandbox', 'allow-scripts/);
  assert.match(runtime, /prefers-reduced-motion: no-preference/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /@media \(max-width:720px\)/);
});
