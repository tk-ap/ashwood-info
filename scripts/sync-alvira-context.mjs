#!/usr/bin/env node
// Make an ALVIRA Context available to the private /workspace ("ALVIRA / ALVIRA Context" input).
//
// Input: a Bridge get_alvira_context response (saved JSON-RPC result, or the profile object).
// Output: the released snapshot ASHWOOD stores: answers without sensitive items, the raw
// Links & sources answers left out, only owner-confirmed links, only owner-approved goal-spec
// fields. The same sanitizer runs again on the server.
//
//   node scripts/sync-alvira-context.mjs get_alvira_context.json [--environment test|production]   # dry run
//   WORKSPACE_CONTEXT_SYNC_TOKEN=… node scripts/sync-alvira-context.mjs file.json --send           # store it
//
// ASHWOOD_URL defaults to https://ashwood-info.vercel.app. Nothing is sent without --send.

import { readFileSync } from 'node:fs';
import { cleanContextSnapshot } from '../api/_workspace-context-clean.mjs';

const LABELS = {
  identity: 'Identity', goals: 'Goals', decisionFrameworks: 'Decision frameworks', constraints: 'Constraints',
  processes: 'Processes', peopleAndRoles: 'People & roles', relationships: 'Relationships', communication: 'Communication',
  toolsAndSystems: 'Tools & systems', knowledgeAndTerminology: 'Knowledge & terminology', rules: 'Rules',
  exceptions: 'Exceptions', unknowns: 'Unknowns', faqs: 'FAQs', background: 'Background', currentProjects: 'Current projects',
  dailyLife: 'Daily life', preferences: 'Preferences', knowledgeGaps: 'Knowledge gaps', updates: 'Living updates',
};

export function profileFrom(payload) {
  let value = payload;
  if (value?.result) value = value.result;
  if (value?.structuredContent) value = value.structuredContent;
  if (value?.profile) value = value.profile;
  if (!value || typeof value !== 'object' || !value.id || !value.state) throw new Error('Expected a Bridge get_alvira_context profile (id + state).');
  return value;
}

export function snapshotBody(profile, environment = 'test') {
  const state = profile.state || {};
  const domains = Object.entries(state.domains || {})
    .filter(([id]) => id !== 'sources') // links reach the workspace only as owner-confirmed sources
    .map(([id, area]) => ({ id, label: LABELS[id] || id, answers: Array.isArray(area?.answers) ? area.answers : [] }));
  const sources = (state.contextSources || []).filter(source => source?.status === 'ready');
  return {
    source: 'alvira',
    source_system: 'alvira-bridge',
    context_id: `alvira:${profile.id}`,
    topic: profile.topic || state.topic,
    context_updated_at: profile.updated_at,
    domains,
    goal_spec: profile.goal_spec || null,
    sources,
    provenance: state.provenance || null,
    environment,
  };
}

async function main(argv) {
  const file = argv.find(arg => !arg.startsWith('--'));
  if (!file) {
    console.error('Usage: node scripts/sync-alvira-context.mjs <get_alvira_context.json> [--environment test|production] [--send]');
    return 2;
  }
  const envIndex = argv.indexOf('--environment');
  const environment = envIndex >= 0 && argv[envIndex + 1] === 'production' ? 'production' : 'test';
  const body = snapshotBody(profileFrom(JSON.parse(readFileSync(file, 'utf8'))), environment);
  const snapshot = cleanContextSnapshot(body);
  if (!snapshot) {
    console.error('Not a usable ALVIRA Context snapshot (no releasable answers or goal-spec fields).');
    return 2;
  }
  const answers = snapshot.domains.reduce((n, d) => n + d.answers.length, 0);
  console.log(JSON.stringify({
    context_id: snapshot.context_id, topic: snapshot.topic, environment: snapshot.environment,
    areas: snapshot.domains.length, answers, goal_spec_fields: Object.keys(snapshot.goal_spec?.fields || {}),
    confirmed_sources: snapshot.sources.length, content_hash: snapshot.content_hash,
  }, null, 2));
  if (!argv.includes('--send')) {
    console.error('Dry run: nothing sent. Add --send with WORKSPACE_CONTEXT_SYNC_TOKEN to store it in the private workspace.');
    return 0;
  }
  const token = process.env.WORKSPACE_CONTEXT_SYNC_TOKEN || '';
  if (!token) {
    console.error('Not sent: WORKSPACE_CONTEXT_SYNC_TOKEN is not set.');
    return 3;
  }
  const base = (process.env.ASHWOOD_URL || 'https://ashwood-info.vercel.app').replace(/\/$/, '');
  const response = await fetch(`${base}/api/workspace-context`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) {
    console.error(`Not stored: ${response.status} ${result.error || ''}`.trim());
    return 3;
  }
  console.error(`Stored in the private workspace as ${result.context_id} (${result.domains} areas, ${result.goal_spec_fields} goal-spec fields).`);
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2)).then(code => process.exit(code), error => { console.error(`Failed: ${error.message}`); process.exit(1); });
}
