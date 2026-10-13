import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function loadGate({ visible = true } = {}) {
  const listeners = {};
  const doc = { visibilityState: visible ? 'visible' : 'hidden', addEventListener: (t, f) => { (listeners['doc:' + t] ||= []).push(f); } };
  globalThis.document = doc;
  globalThis.addEventListener = (t, f) => { (listeners[t] ||= []).push(f); };
  return { doc, listeners };
}

test('background polling stops when hidden or after 15 idle minutes, and resumes on activity', async () => {
  const realNow = Date.now;
  let now = 1_000_000;
  Date.now = () => now;
  try {
    const { doc, listeners } = loadGate();
    const { shouldPoll } = await import('../workspace/poll-gate.mjs?' + now);
    assert.equal(shouldPoll(), true);
    doc.visibilityState = 'hidden';
    assert.equal(shouldPoll(), false);
    doc.visibilityState = 'visible';
    now += 15 * 60 * 1000;
    assert.equal(shouldPoll(), false, 'an untouched visible tab must stop polling');
    listeners.pointerdown[0]();
    assert.equal(shouldPoll(), true);
  } finally {
    Date.now = realNow;
  }
});

test('every recurring Workspace poller goes through the gate at a slow interval', () => {
  const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
  for (const file of ['workspace/operator-console.mjs', 'workspace/career-ops/career-ops.mjs',
    'workspace/agentos/agentos-health.mjs', 'workspace/build-command-center.mjs',
    'workspace/build-detail.mjs', 'workspace/deployment-ledger.mjs']) {
    const src = read(file);
    assert.match(src, /import \{ shouldPoll \} from ['"][./]+poll-gate\.mjs['"]/, file);
    assert.doesNotMatch(src, /setInterval\([^)]*\b(5000|15000|30000|45000|60000)\)/, file);
  }
  assert.doesNotMatch(read('workspace/operator-console.mjs'), /setTimeout\(loadOperator, 5000\)/);
});
