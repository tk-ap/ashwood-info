import test from 'node:test';
import assert from 'node:assert/strict';
import { collectDeployments, publishSnapshot } from '../scripts/collect-deployment-snapshot.mjs';

test('collector paginates, normalizes, and deduplicates deployment records', async () => {
  const calls = [];
  const fetchImpl = async url => {
    calls.push(url);
    const projectId = url.searchParams.get('projectId');
    const until = url.searchParams.get('until');
    if (projectId !== 'prj_p0OqGFvZZU8940ePrXIoVocuTUl7') {
      return { ok: true, async json() { return { deployments: [], pagination: { next: null } }; } };
    }
    return {
      ok: true,
      async json() {
        if (!until) return { deployments: [{ uid: 'first', created: 2000, state: 'READY' }], pagination: { next: 1500 } };
        return { deployments: [{ uid: 'first', created: 2000, state: 'READY' }, { uid: 'second', created: 1600, readyState: 'ERROR' }], pagination: { next: null } };
      },
    };
  };
  const snapshot = await collectDeployments({ token: 'test-token', now: 86_400_000 + 1_000, fetchImpl });
  assert.equal(snapshot.complete, true);
  assert.equal(calls.length, 5, 'the first project paginates and the remaining three each have one page');
  assert.deepEqual(snapshot.deployments.map(item => item.id), ['first', 'second']);
  assert.equal(snapshot.deployments[1].projectName, 'ASHWOOD');
});

test('publisher sends only snapshot data with a bearer sync credential', async () => {
  let request;
  await publishSnapshot({
    endpoint: 'https://example.test/api/workspace-state',
    syncToken: 'sync-secret',
    snapshot: { observed_at: '2026-09-21T00:00:00.000Z', window_started_at: '2026-09-20T00:00:00.000Z', complete: true, deployments: [] },
    fetchImpl: async (_url, options) => { request = options; return { ok: true }; },
  });
  assert.equal(request.headers.Authorization, 'Bearer sync-secret');
  assert.equal(JSON.parse(request.body).action, 'sync_deployments');
});
