const TEAM_ID = 'team_o8DEWGS5bzF8jdgWsD9IfBec';
const WINDOW_MS = 24 * 60 * 60 * 1000;
const PAGE_SIZE = 100;

export const PROJECTS = [
  ['prj_p0OqGFvZZU8940ePrXIoVocuTUl7', 'ASHWOOD'],
  ['prj_yMUW9t71FNsaFeJSNntNCV4tZZFe', 'ledgato'],
  ['prj_ocnKA4Xr7Jd1aTjUKcRjYgsniy5l', 'ALVIRA'],
  ['prj_dqOUuTJPaegWYi3l4f9Kx8vxyWOe', 'ailhat'],
];

function required(name, value) {
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function cleanDeployment(item, projectId, projectName) {
  const id = String(item.uid || item.id || '').trim();
  const created = Number(item.created || item.createdAt);
  if (!id || !Number.isFinite(created)) throw new Error('Vercel returned an invalid deployment record');
  return {
    id,
    projectId,
    projectName,
    created,
    state: String(item.state || item.readyState || 'UNKNOWN').slice(0, 50),
    target: item.target ? String(item.target).slice(0, 80) : null,
  };
}

export async function collectDeployments({ token, now = Date.now(), fetchImpl = fetch }) {
  const since = now - WINDOW_MS;
  const byId = new Map();

  for (const [projectId, projectName] of PROJECTS) {
    let until = null;
    let previousCursor = null;
    do {
      const url = new URL('https://api.vercel.com/v6/deployments');
      url.searchParams.set('projectId', projectId);
      url.searchParams.set('teamId', TEAM_ID);
      url.searchParams.set('since', String(since));
      url.searchParams.set('limit', String(PAGE_SIZE));
      if (until !== null) url.searchParams.set('until', String(until));

      const response = await fetchImpl(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Vercel deployment query failed (${response.status})`);
      const payload = await response.json();
      for (const item of payload.deployments || []) {
        const clean = cleanDeployment(item, projectId, projectName);
        if (clean.created >= since) byId.set(clean.id, clean);
      }

      const cursor = payload.pagination?.next;
      if (cursor === null || cursor === undefined) break;
      until = Number(cursor);
      if (!Number.isFinite(until) || until <= since || until === previousCursor) {
        throw new Error('Vercel deployment pagination did not advance');
      }
      previousCursor = until;
    } while (true);
  }

  return {
    observed_at: new Date(now).toISOString(),
    window_started_at: new Date(since).toISOString(),
    complete: true,
    deployments: [...byId.values()].sort((a, b) => b.created - a.created),
  };
}

export async function publishSnapshot({ endpoint, syncToken, snapshot, fetchImpl = fetch }) {
  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${syncToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'sync_deployments', ...snapshot }),
  });
  if (!response.ok) throw new Error(`Workspace deployment snapshot sync failed (${response.status})`);
}

async function main() {
  const token = required('VERCEL_DEPLOYMENT_READ_TOKEN', process.env.VERCEL_DEPLOYMENT_READ_TOKEN);
  const syncToken = required('WORKSPACE_DEPLOYMENT_SYNC_TOKEN', process.env.WORKSPACE_DEPLOYMENT_SYNC_TOKEN);
  const endpoint = process.env.ASHWOOD_DEPLOYMENT_SYNC_URL || 'https://ashwood-info.vercel.app/api/workspace-state';
  const snapshot = await collectDeployments({ token });
  await publishSnapshot({ endpoint, syncToken, snapshot });
  console.log(JSON.stringify({
    ok: true,
    observed_at: snapshot.observed_at,
    deployments: snapshot.deployments.length,
    project_counts: Object.fromEntries(PROJECTS.map(([id, name]) => [name, snapshot.deployments.filter(item => item.projectId === id).length])),
  }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
