import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Workspace sprint intake stays on the existing durable command queue', async () => {
  const source = await readFile(new URL('../api/workspace-state.mjs', import.meta.url), 'utf8');
  assert.match(source, /command_kind TEXT NOT NULL DEFAULT 'owner_command'/);
  assert.match(source, /command_kind = 'ailhat_sprint'/);
  assert.match(source, /A sprint directive requires exactly five selected items/);
  assert.match(source, /view === 'sprint-recommendation'/);
  assert.match(source, /AILHAT_WORKSPACE_READ_TOKEN/);
  assert.match(source, /content_hash/);
});

test('Build exposes ailhat default selection and explicit acceptance', async () => {
  const html = await readFile(new URL('../workspace/index.html', import.meta.url), 'utf8');
  const ui = await readFile(new URL('../workspace/sprint.mjs', import.meta.url), 'utf8');
  assert.match(html, /Next 5 Sprint/);
  assert.match(html, /Accept Sprint &amp; Create Directive/);
  assert.match(ui, /sourceRank/);
  assert.match(ui, /override/);
  assert.match(ui, /submit_sprint_directive/);
});
