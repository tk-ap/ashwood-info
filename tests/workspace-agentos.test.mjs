import assert from 'node:assert/strict';
import test from 'node:test';

import { projectionFreshness, sanitizeProjection } from '../api/workspace-agentos.mjs';

test('projection sanitizer preserves oversight fields and removes arbitrary input', () => {
  const result = sanitizeProjection({
    scenario_id: 'long-weekend-001',
    run_id: 'run-1',
    phase: 'running',
    specialist: 'eugene',
    harness: 'codex',
    production_authority: 'production',
    secret: 'must not cross boundary',
  });
  assert.equal(result.specialist, 'eugene');
  assert.equal(result.production_authority, 'none');
  assert.equal('secret' in result, false);
});

test('projection freshness makes an offline workstation visible', () => {
  const now = Date.parse('2026-09-18T12:00:00Z');
  assert.equal(projectionFreshness('2026-09-18T11:55:00Z', now), 'current');
  assert.equal(projectionFreshness('2026-09-18T11:20:00Z', now), 'watch');
  assert.equal(projectionFreshness('2026-09-18T10:00:00Z', now), 'offline');
});
