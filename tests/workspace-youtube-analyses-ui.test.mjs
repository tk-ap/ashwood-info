import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOperatorDraft, prefillOperatorDraft, renderAnalysisItem } from '../workspace/youtube-analyses.mjs';

const item = {
  analysis_id: 'fuECuGW_Eeo:abc123def456',
  video_url: 'https://www.youtube.com/watch?v=fuECuGW_Eeo',
  title: 'Evidence-backed video',
  channel: 'Example channel',
  coverage: 'HIGH',
  visual_pending: true,
  analyzed_at: '2026-10-12T12:00:00.000Z',
  summary: 'A bounded summary.',
  findings: [{ id: 'fuECuGW_Eeo:abc123def456:f1', text: 'The source supports the claim.', evidence_basis: 'Timestamped evidence.', confidence: 0.9 }],
  ecosystem_relevance: [{ workstream: 'ASHWOOD', rationale: 'Useful signal.', risk: 'Needs verification.' }],
  candidate_actions: [{ id: 'fuECuGW_Eeo:abc123def456:a1', action: 'Review the source.', why: 'It may be stale.' }],
  limitations: ['No live product verification.'],
};

test('the Evidence view renders a YouTube analysis item and its review details', () => {
  const html = renderAnalysisItem(item);
  assert.match(html, /Evidence-backed video/);
  assert.match(html, /Visual review pending/);
  assert.match(html, /Timestamped evidence/);
  assert.match(html, /Candidate actions/);
  assert.match(html, /Launch in Operator/);
});

test('Launch only pre-fills the Operator command; it does not submit', () => {
  let dispatched = 0;
  let focused = 0;
  let submits = 0;
  const input = {
    value: '',
    dispatchEvent() { dispatched += 1; },
    focus() { focused += 1; },
  };
  const note = { textContent: '' };
  const draft = buildOperatorDraft({ id: item.findings[0].id, title: item.title, text: item.findings[0].text });
  const filled = prefillOperatorDraft({ input, note, draft });
  assert.equal(filled, true);
  assert.equal(input.value, draft);
  assert.equal(dispatched, 1);
  assert.equal(focused, 1);
  assert.equal(submits, 0);
  assert.match(note.textContent, /Edit it, then send/i);
});
