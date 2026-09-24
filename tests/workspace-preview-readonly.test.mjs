import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

// Preview redeploy marker: environment wiring verified 2026-09-24.
const source = fs.readFileSync(new URL('../api/workspace-state.mjs', import.meta.url), 'utf8');

test('workspace preview blocks owner mutations before state writes', () => {
  const methodGate = source.indexOf("if (req.method !== 'POST')");
  const readonlyGate = source.indexOf("process.env.WORKSPACE_PREVIEW_READONLY === '1'");
  const originGate = source.indexOf("if (!sameOrigin(req))", methodGate);
  const firstOwnerWrite = source.indexOf("if (action === 'network_upsert')", methodGate);

  assert.ok(methodGate >= 0, 'POST method gate should exist');
  assert.ok(readonlyGate > methodGate, 'read-only guard should run after method validation');
  assert.ok(readonlyGate < originGate, 'read-only guard should run before owner mutation routing');
  assert.ok(readonlyGate < firstOwnerWrite, 'read-only guard must precede every owner write action');
  assert.match(source, /Workspace preview is read-only/);
});
