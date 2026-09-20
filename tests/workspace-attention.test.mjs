import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MONITORING_WINDOW_DAYS,
  REVIEW_ACTIVE_DAYS,
  SIGNAL_ACTIVE_DAYS,
  classifyReviewItem,
  classifySignal,
  monitoringSummary,
  splitReviewAttention,
  splitSignalAttention,
} from '../api/_attention.mjs';

const DAY = 24 * 60 * 60 * 1000;
const now = new Date('2026-09-20T22:30:00Z').getTime();

function at(daysAgo) {
  return new Date(now - (daysAgo * DAY)).toISOString();
}

test('ordinary signals age out while blockers and explicitly focused signals stay active', () => {
  const items = [
    { id:'fresh', occurred_at:at(2), status:'SIGNAL', title:'Fresh observation' },
    { id:'old', occurred_at:at(SIGNAL_ACTIVE_DAYS + 1), status:'SIGNAL', title:'Old observation' },
    { id:'blocker', occurred_at:at(30), status:'SIGNAL', title:'Build blocked by missing authority' },
    { id:'focus', occurred_at:at(30), status:'ACCEPTED', title:'Owner kept this in focus' },
    { id:'done', occurred_at:at(1), status:'COMPLETED', title:'Completed work' },
    { id:'dismissed', occurred_at:at(1), status:'DISMISSED', title:'Dismissed work' },
  ];
  const buckets = splitSignalAttention(items, now);
  assert.deepEqual(buckets.active.map(item => item.id), ['fresh','blocker','focus']);
  assert.deepEqual(buckets.ignored.map(item => item.id), ['old']);
  assert.deepEqual(buckets.archive.map(item => item.id), ['done','dismissed']);
  assert.equal(classifySignal(items[1], now), 'ignored');
});

test('release review checks age out without becoming approved', () => {
  const items = [
    { id:'fresh', deployed_at:at(3) },
    { id:'old', deployed_at:at(REVIEW_ACTIVE_DAYS + 1) },
    { id:'reviewed', deployed_at:at(40) },
  ];
  const completed = new Set(['reviewed']);
  const buckets = splitReviewAttention(items, completed, now);
  assert.deepEqual(buckets.active.map(item => item.id), ['fresh']);
  assert.deepEqual(buckets.ignored.map(item => item.id), ['old']);
  assert.deepEqual(buckets.archive.map(item => item.id), ['reviewed']);
  assert.equal(classifyReviewItem(items[1], completed, now), 'ignored');
});

test('monitoring review only uses recent non-manual sources and flags repeatedly ignored sources', () => {
  const items = [
    { source:'ailhat', source_label:'ailhat', occurred_at:at(8), status:'SIGNAL' },
    { source:'ailhat', source_label:'ailhat', occurred_at:at(9), status:'SIGNAL' },
    { source:'ailhat', source_label:'ailhat', occurred_at:at(1), status:'SIGNAL' },
    { source:'github', source_label:'GitHub', occurred_at:at(1), status:'SIGNAL' },
    { source:'github', source_label:'GitHub', occurred_at:at(2), status:'ACCEPTED' },
    { source:'manual', source_label:'workspace', occurred_at:at(8), status:'SIGNAL' },
    { source:'ailhat', source_label:'ailhat', occurred_at:at(MONITORING_WINDOW_DAYS + 1), status:'SIGNAL' },
  ];
  const summary = monitoringSummary(items, now);
  const ailhat = summary.find(item => item.source === 'ailhat');
  const github = summary.find(item => item.source === 'GitHub');
  assert.equal(ailhat.total, 3);
  assert.equal(ailhat.ignored, 2);
  assert.equal(ailhat.needs_review, true);
  assert.equal(github.needs_review, false);
  assert.equal(summary.some(item => item.source === 'workspace'), false);
});
