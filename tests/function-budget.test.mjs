import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

// Vercel deploys root-level api/*.mjs entrypoints as separate functions.
// Underscore-prefixed modules are internal helpers, not HTTP entrypoints.
test('ASHWOOD stays within the Vercel Hobby 12-function deployment budget', async () => {
  const files = await readdir(new URL('../api/', import.meta.url));
  const entries = files.filter(name => /\\.m?js$/.test(name) && !name.startsWith('_'));
  assert.ok(entries.length <= 12, `Hobby function budget exceeded: ${entries.length}/12 (\n${entries.join('\n')}\n)`);
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
  assert.ok(config.rewrites.some(route => route.source === '/api/workspace-analyses' && route.destination.includes('view=analyses')));
});
