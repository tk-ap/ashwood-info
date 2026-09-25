import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('Preview read-only enforcement is centralized and rejects database writes', async () => {
  const source = await read('api/_workspace.mjs');
  assert.match(source, /WORKSPACE_PREVIEW_READONLY/);
  assert.match(source, /rejectPreviewMutation/);
  assert.match(source, /Workspace preview database access is read-only/);
  assert.match(source, /INSERT\|UPDATE\|DELETE\|CREATE\|ALTER/);
});

test('Workspace write surfaces opt into preview protection while read projections skip schema writes', async () => {
  for (const path of [
    'api/workspace-state.mjs', 'api/workspace-environments.mjs',
    'api/_agentos-workstreams-handler.mjs', 'api/_agentos-board-handler.mjs',
    'api/_career-ops-handler.mjs', 'api/workspace-sandbox-review.mjs',
    'api/dispatch-studio.mjs', 'api/_review-checklist-handler.mjs',
    'api/_upload-handler.mjs', 'api/_upload-direct-handler.mjs'
  ]) assert.match(await read(path), /rejectPreviewMutation/);
  const environments = await read('api/workspace-environments.mjs');
  assert.match(environments, /if \(!isPreviewReadOnly\(\)\) await ensureTable/);
});

test('Preview permits session login but blocks setup and passphrase rotation', async () => {
  const auth = await read('api/workspace-auth.mjs');
  assert.match(auth, /getSql\(\{ allowPreviewWrites: true \}\)/);
  assert.match(auth, /!\['login', 'logout'\]\.includes\(action\)/);
});
