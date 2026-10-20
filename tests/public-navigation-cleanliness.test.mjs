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
