import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Workspace exposes deferred Omarchy actions as a read-only pickup surface', async () => {
  const html = await readFile(new URL('../workspace/index.html', import.meta.url), 'utf8');
  const ui = await readFile(new URL('../workspace/operator-actions.mjs', import.meta.url), 'utf8');
  const views = await readFile(new URL('../workspace/views.mjs', import.meta.url), 'utf8');

  assert.match(html, /Terminal actions waiting for you/);
  assert.match(html, /Copy all ready commands/);
  assert.match(ui, /kind === "operator_action"/);
  assert.match(ui, /metadata\?\.safe_to_batch/);
  assert.match(ui, /metadata\?\.batch_key/);
  assert.match(ui, /Copy commands/);
  assert.match(ui, /Workspace is read-only/);
  assert.doesNotMatch(ui, /method\s*:\s*["']POST["']/);
  assert.match(views, /#operator-actions-section/);
});
