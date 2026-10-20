import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skip = new Set(['.git', '.github', 'node_modules', 'workspace', 'tests', 'scripts', 'api', 'assets', 'data']);

function publicSources(dir = root) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.isDirectory()) return skip.has(entry.name) ? [] : publicSources(path.join(dir, entry.name));
    return entry.isFile() && /\.(?:html|js|css)$/.test(entry.name) ? [path.join(dir, entry.name)] : [];
  });
}

test('public pages and runtime avoid iOS emoji-rendered arrow glyphs', () => {
  for (const file of publicSources()) {
    assert.doesNotMatch(readFileSync(file, 'utf8'), /[\u2197\u2198]/u, `Emoji arrow in ${path.relative(root, file)}`);
  }
});

test('site navigation has a distinct Work overview and no duplicate Portfolio entry', () => {
  const nav = readFileSync(path.join(root, 'v3-nav.js'), 'utf8');
  assert.match(nav, /<span>Work overview<\/span>/);
  assert.match(nav, /href="\/modeling\/"/);
  assert.doesNotMatch(nav, /href="\/portfolio\/"/);
  assert.equal((nav.match(/<small>\d\d<\/small>/g) || []).length, 16);
});

test('Work is an evidenced cross-medium overview, not a duplicate portfolio index', () => {
  const work = readFileSync(path.join(root, 'work/index.html'), 'utf8');
  const style = readFileSync(path.join(root, 'work/work.css'), 'utf8');
  assert.match(work, /Creative overview/);
  assert.match(work, /id="selected"/);
  assert.match(work, /href="\/modeling\/"/);
  assert.match(work, /href="\/performance\/"/);
  assert.match(work, /href="\/music\/"/);
  assert.match(work, /src="\/audio\/in-me\.mp3"/);
  assert.match(work, /Archive in formation/);
  for (const route of ['alvira', 'ledgato', 'ailhat']) {
    assert.match(work, new RegExp(`href="/journal/${route}/"`));
  }
  assert.match(work, /href="\/journal\/"/);
  assert.match(style, /@media\(max-width:650px\)/);
  assert.match(style, /prefers-reduced-motion/);
  assert.doesNotMatch(work, /href="\/portfolio\/"/);
});
