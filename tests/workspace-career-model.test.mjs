import test from 'node:test';
import assert from 'node:assert/strict';
import { summaryCounts } from '../workspace/career-ops/model.mjs';

test('summary counts rejected applications as submitted and keeps unanswered screening in no-response', () => {
  const applications = [
    { id:'a', status:'REJECTED', submitted_at:'2026-09-20T12:00:00Z' },
    { id:'b', status:'REJECTED', submitted_at:'2026-09-21T12:00:00Z' },
    { id:'c', status:'SCREENING', submitted_at:'2026-09-22T12:00:00Z' }
  ];
  const counts = summaryCounts(applications, [
    { application_id:'a', event_type:'REJECTION', payload:{} },
    { application_id:'b', event_type:'REJECTION', payload:{} },
    { application_id:'c', event_type:'CONFIRMATION', payload:{} }
  ]);
  assert.deepEqual(counts, {
    submitted:3,
    denied:2,
    noResponse:1,
    interviews:0
  });
});

test('recruiter contact clears no-response for a submitted application', () => {
  const applications = [
    { id:'c', status:'SCREENING', submitted_at:'2026-09-22T12:00:00Z' }
  ];
  const counts = summaryCounts(applications, [
    { application_id:'c', event_type:'RECRUITER', payload:{} }
  ]);
  assert.equal(counts.noResponse, 0);
});
