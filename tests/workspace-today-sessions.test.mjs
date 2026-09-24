import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Today autonomous sessions use the AgentOS board rather than legacy workstreams', async () => {
  const source = await readFile(new URL('../workspace/today.mjs', import.meta.url), 'utf8');
  assert.match(source, /readJson\("\/api\/workspace-board"\)/);
  assert.doesNotMatch(source, /readJson\("\/api\/workspace-workstreams"\)/);
  assert.match(source, /Promise\.allSettled/);
});

test('Today renders an explicit session state when the AgentOS board cannot load', async () => {
  const source = await readFile(new URL('../workspace/today.mjs', import.meta.url), 'utf8');
  assert.match(source, /Unlock Workspace to load AgentOS execution\./);
  assert.match(source, /AgentOS execution could not load from the synced board/);
  assert.match(source, /#today-sessions/);
});

test('private AgentOS views reload immediately after Workspace unlock', async () => {
  const app = await readFile(new URL('../workspace/app.js', import.meta.url), 'utf8');
  const today = await readFile(new URL('../workspace/today.mjs', import.meta.url), 'utf8');
  const board = await readFile(new URL('../workspace/agentos-board.mjs', import.meta.url), 'utf8');
  assert.match(app, /ashwood:workspace-authenticated/);
  assert.match(today, /ashwood:workspace-authenticated/);
  assert.match(board, /ashwood:workspace-authenticated/);
});

test('Workspace cache-busts the current autonomous-session and Build scripts', async () => {
  const html = await readFile(new URL('../workspace/index.html', import.meta.url), 'utf8');
  assert.match(html, /today\.mjs\?v=20260920-sessions1/);
  assert.match(html, /app\.js\?v=20260921-menufix1/);
  assert.match(html, /build-command-center\.mjs\?v=20260923-command-center1/);
  assert.match(html, /agentos-board\.css\?v=20260922-fitboard1/);
  assert.doesNotMatch(html, /agentos-board\.mjs\?v=/, 'the legacy inline AgentOS board runtime moved to Build detail pages');
});
