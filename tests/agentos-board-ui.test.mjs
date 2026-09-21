import test from 'node:test';
import assert from 'node:assert/strict';

import { filterRows, matchesView, workDomain } from '../workspace/agentos-board.mjs';

const rows = [
  { lane:'in_progress', product:'AgentOS', work_domain:'agentos', priority:'p2', title:'Build AgentOS ledger', assignee:'milchik', kind:'execution' },
  { lane:'backlog', product:'ALVIRA', work_domain:'ecosystem', priority:'p1', title:'Context portability baseline', assignee:'eugene', kind:'backlog' },
  { lane:'done', product:'ASHWOOD', work_domain:'ecosystem', priority:'p1', title:'Old shipped work', assignee:'w-dog', kind:'backlog' },
  { lane:'stuck', product:'ledgato', work_domain:'ecosystem', priority:'p3', title:'Enforcement proof blocked', assignee:'rook', kind:'execution' },
];

test('workDomain preserves canonical AgentOS versus ecosystem identity', () => {
  assert.equal(workDomain(rows[0]), 'agentos');
  assert.equal(workDomain(rows[1]), 'ecosystem');
  assert.equal(workDomain({ product:'AgentOS' }), 'agentos');
  assert.equal(workDomain({ product:'ailhat' }), 'ecosystem');
});

test('saved views distinguish operating-layer work from greater ecosystem work', () => {
  assert.deepEqual(rows.filter(row => matchesView(row, 'agentos')).map(row => row.title), ['Build AgentOS ledger']);
  assert.deepEqual(
    rows.filter(row => matchesView(row, 'ecosystem')).map(row => row.title),
    ['Context portability baseline', 'Old shipped work', 'Enforcement proof blocked']
  );
  assert.deepEqual(rows.filter(row => matchesView(row, 'attention')).map(row => row.title), ['Enforcement proof blocked']);
});

test('Sprint Focus includes active/review/stuck and P0/P1 work but excludes done', () => {
  assert.deepEqual(
    rows.filter(row => matchesView(row, 'sprint')).map(row => row.title),
    ['Build AgentOS ledger', 'Context portability baseline', 'Enforcement proof blocked']
  );
});

test('combined filters behave like a persistent operator view', () => {
  const visible = filterRows(rows, {
    view:'ecosystem',
    product:'ALVIRA',
    owner:'eugene',
    priority:'3',
    search:'context',
    collapsed:[]
  });
  assert.equal(visible.length, 1);
  assert.equal(visible[0].title, 'Context portability baseline');
});
