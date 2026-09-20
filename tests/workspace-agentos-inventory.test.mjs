import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Workspace AgentOS board exposes ecosystem awareness lanes', async () => {
  const source = await readFile(new URL('../workspace/agentos-board.mjs', import.meta.url), 'utf8');
  assert.match(source, /id:\s*"orphaned_pr"/);
  assert.match(source, /id:\s*"untriaged"/);
  assert.match(source, /GitHub inventory/);
});

test('GitHub inventory does not fall through as active execution evidence', async () => {
  const source = await readFile(new URL('../workspace/app.js', import.meta.url), 'utf8');
  assert.match(source, /untriaged:'PLANNED'/);
  assert.match(source, /orphaned_pr:'PLANNED'/);
  assert.match(source, /startsWith\('github_'\)/);
});
