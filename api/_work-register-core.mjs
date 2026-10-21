export const REGISTER_REPOS = Object.freeze([
  'agent-os', 'ledgato', 'ALVIRA', 'ailhat', 'ashwood-info'
]);

export function parseChecklist(markdown) {
  const rows = [];
  for (const line of String(markdown || '').split(/\r?\n/)) {
    const found = /^\s*[-*]\s+\[([ xX])\]\s+(.+?)\s*$/.exec(line);
    if (!found) continue;
    rows.push({ complete: found[1].toLowerCase() === 'x', label: found[2].slice(0, 360) });
  }
  return { total: rows.length, completed: rows.filter(x => x.complete).length, items: rows.slice(0, 30), truncated: rows.length > 30 };
}

export function githubRecord(row, repo) {
  if (!row || !Number.isSafeInteger(row.number) || !row.title || !REGISTER_REPOS.includes(repo)) return null;
  const type = row.pull_request ? 'pr' : 'issue';
  const url = 'https://github.com/tk-ap/' + repo + '/' + (type === 'pr' ? 'pull/' : 'issues/') + row.number;
  return {
    id: 'github:' + repo + ':' + type + ':' + row.number,
    repo, number: row.number, type, title: String(row.title).slice(0, 360),
    url, state: 'open',
    updated_at: row.updated_at || null,
    assignee: row.assignee?.login || null,
    labels: (row.labels || []).slice(0, 12).map(x => typeof x === 'string' ? x : x.name).filter(Boolean),
    checklist: parseChecklist(row.body),
    source: 'github'
  };
}

export function permittedGitHubUrl(value) {
  try {
    const u = new URL(String(value || ''));
    return u.protocol === 'https:' && u.hostname === 'github.com'
      && /^\/tk-ap\/[A-Za-z0-9_.-]+\/(issues|pull)\/[0-9]+\/?$/.test(u.pathname);
  } catch { return false; }
}
