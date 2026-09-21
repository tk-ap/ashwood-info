const LANE_LABELS = {
  in_progress: 'In progress',
  stuck: 'Stuck',
  review: 'Review',
  orphaned_pr: 'Orphaned PRs',
  untriaged: 'Untriaged',
  backlog: 'Backlog',
  done: 'Recently done',
  other: 'Open',
};

const LANE_ORDER = ['in_progress', 'stuck', 'review', 'orphaned_pr', 'untriaged', 'backlog', 'done', 'other'];
const CLOSED_STATES = new Set(['done', 'completed', 'cancelled', 'canceled', 'closed', 'accepted', 'retired']);

export function normalizeBoardLane(item = {}) {
  const raw = String(item.lane || item.status || '').trim().toLowerCase().replace(/\s+/g, '_');
  return LANE_LABELS[raw] ? raw : CLOSED_STATES.has(raw) ? 'done' : 'other';
}

export function isOpenBoardItem(item = {}) {
  const lane = String(item.lane || '').trim().toLowerCase().replace(/\s+/g, '_');
  const status = String(item.status || '').trim().toLowerCase().replace(/\s+/g, '_');
  return lane !== 'done' && !CLOSED_STATES.has(status);
}

export function openBoardItems(rows = []) {
  return (Array.isArray(rows) ? rows : []).filter(isOpenBoardItem);
}

export function boardColumns(rows = []) {
  const items = Array.isArray(rows) ? rows : [];
  return LANE_ORDER.map(lane => ({
    lane,
    label: LANE_LABELS[lane],
    items: items.filter(item => normalizeBoardLane(item) === lane),
  })).filter(column => column.items.length);
}

function clean(value, fallback = '') {
  return String(value || '').replace(/\s+/g, ' ').trim() || fallback;
}

export function translateBoardItem(item = {}) {
  const title = clean(item.title, 'This work item has no title');
  const lane = LANE_LABELS[normalizeBoardLane(item)].toLowerCase();
  const context = [clean(item.product), clean(item.workspace)].filter(Boolean).join(' · ');
  const detail = clean(item.blocker || item.next_gate || item.summary || item.metadata?.why_now);
  const owner = clean(item.assignee);
  const location = context ? ` in ${context}` : '';
  const ownerSentence = owner ? ` ${owner} is the current assignee.` : ' It still needs a clearly named owner.';
  const detailSentence = detail ? ` The board says: ${detail}.` : '';

  let next = 'The next useful move is to decide or record what happens next.';
  if (normalizeBoardLane(item) === 'stuck') next = 'The next useful move is to remove the blocker or make the decision holding it up.';
  if (normalizeBoardLane(item) === 'review') next = 'The next useful move is an explicit review outcome.';
  if (normalizeBoardLane(item) === 'backlog') next = 'The next useful move is to decide whether this deserves to enter active work.';
  if (normalizeBoardLane(item) === 'in_progress') next = 'The work is underway; keep it moving or surface a new blocker.';
  if (normalizeBoardLane(item) === 'untriaged') next = 'The next useful move is to classify it and decide who owns the next step.';

  return `${title} It is ${lane}${location}.${ownerSentence}${detailSentence} ${next}`;
}

export function translateOpenBoardItems(rows = []) {
  return openBoardItems(rows).map(item => ({ ...item, translation: translateBoardItem(item) }));
}

export { LANE_LABELS };
