import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const evidence = JSON.parse(
  fs.readFileSync(new URL('../workspace/agentos/health-evidence.json', import.meta.url), 'utf8')
);

test('AgentOS health evidence snapshot has bounded weighted scores', () => {
  assert.equal(evidence.schema_version, 2);
  assert.equal(evidence.rubric, 'agentos-health-rubric.v2');
  assert.ok(Number.isInteger(evidence.overall_score));
  assert.ok(evidence.overall_score >= 0 && evidence.overall_score <= 100);
  assert.equal(evidence.scores.length, 5);
  assert.equal(evidence.scores.reduce((sum, row) => sum + row.weight, 0), 100);
  for (const row of evidence.scores) {
    assert.ok(Number.isInteger(row.score));
    assert.ok(row.score >= 0 && row.score <= 100);
    assert.ok(row.proof);
    assert.ok(row.next);
  }
});

test('AgentOS health snapshot distinguishes repository state from live proof', () => {
  assert.match(evidence.latest_proven_runtime_sha, /^[a-f0-9]{40}$/);
  assert.match(evidence.canonical_main_at_assessment_sha, /^[a-f0-9]{40}$/);
  assert.notEqual(evidence.latest_proven_runtime_sha, evidence.canonical_main_at_assessment_sha);
  assert.match(evidence.evidence_note, /not imply.*live/i);
});

test('health ownership keeps telemetry authoritative and roles separated', () => {
  assert.equal(evidence.health_ownership.dedicated_health_agent, false);
  assert.equal(evidence.health_ownership.systemic_monitor, 'W Dog');
  assert.equal(evidence.health_ownership.operator_surface, 'Milchik');
  assert.match(evidence.health_ownership.design_rule, /telemetry/i);
});
