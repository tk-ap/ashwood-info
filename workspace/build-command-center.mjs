const esc = (value = '') => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const age = value => { const ms = Date.now() - new Date(value).getTime(); if (!Number.isFinite(ms)) return 'unknown'; return ms < 60000 ? `${Math.max(1, Math.round(ms / 1000))}s ago` : `${Math.round(ms / 60000)}m ago`; };
const isBlocked = row => ['blocked', 'failed', 'stuck'].includes(String(row?.status || row?.lane || '').toLowerCase()) || Boolean(row?.blocker);

async function json(url) { const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store' }); if (!response.ok) throw new Error(response.status === 401 ? 'Unlock Workspace to load live Build state.' : `${url} returned ${response.status}`); return response.json(); }

function render({ environments, workstreams, board }) {
  const envs = environments.environments || [];
  const active = (workstreams.rows || []).filter(row => !['completed', 'done', 'shipped'].includes(String(row.status).toLowerCase()));
  const blockers = [...active, ...(board.rows || [])].filter(isBlocked);
  const status = state => (envs.filter(item => item.status === state).length);
  const latest = [...active, ...(board.rows || [])].sort((a, b) => new Date(b.observed_at || b.updated_at || 0) - new Date(a.observed_at || a.updated_at || 0))[0];
  const next = active.find(row => row.next_gate)?.next_gate || (blockers[0]?.blocker ? blockers[0].blocker : 'Await the next canonical AgentOS observation.');
  const host = document.querySelector('#build-command-center');
  const freshness = document.querySelector('#build-command-freshness');
  if (!host) return;
  host.innerHTML = `
    <div class="build-command-metrics">
      <article><strong>${active.length}</strong><span>active builds</span></article>
      <article><strong>${status('LIVE') + status('READY')}</strong><span>healthy environments</span></article>
      <article><strong>${envs.filter(item => item.sandbox).length}</strong><span>sandboxes associated</span></article>
      <article><strong>${blockers.length}</strong><span>require attention</span></article>
    </div>
    <div class="build-command-grid">
      <section><p class="section-kicker">Active</p><h2>What is moving</h2><div class="build-command-list">${active.slice(0, 3).map(row => `<article><strong>${esc(row.product || row.source_system || 'Build')}</strong><span>${esc(row.title)}</span><small>Next: ${esc(row.next_gate || row.stage || 'awaiting canonical update')}</small></article>`).join('') || '<p>No active workstream projection yet.</p>'}</div></section>
      <section><p class="section-kicker">Environment summary</p><h2>What is live</h2><div class="build-command-list">${envs.map(row => `<article><strong>${esc(row.label)}</strong><span class="build-status build-status--${esc(row.status.toLowerCase())}">${esc(row.status)}</span><small>${row.sandbox ? `${esc(row.sandbox.provider)} · ${esc(row.sandbox.source_system)} · ${age(row.sandbox.observed_at)}` : 'No sandbox association'}</small></article>`).join('')}</div></section>
      <section><p class="section-kicker">Requires TK</p><h2>Blockers</h2><div class="build-command-list">${blockers.slice(0, 3).map(row => `<article><strong>${esc(row.product || row.source_system || 'Build')}</strong><span>${esc(row.blocker || row.title)}</span><small>${esc(row.next_gate || 'Review canonical state')}</small></article>`).join('') || '<p>No blocker is present in the current projections.</p>'}</div></section>
      <section><p class="section-kicker">Next gate</p><h2>What changes next</h2><p class="build-command-next">${esc(next)}</p><p class="build-command-latest"><strong>Latest meaningful change</strong><br>${latest ? `${esc(latest.title || latest.summary || 'Canonical state updated')} · ${age(latest.observed_at || latest.updated_at)}` : 'No recent state transition in the projection.'}</p></section>
    </div>`;
  if (freshness) freshness.textContent = `Updated ${environments.observed_at ? age(environments.observed_at) : 'not yet'} · Sources: AgentOS + environment registry${envs.some(item => item.status === 'STALE') ? ' · stale associations are marked STALE' : ''}`;
}

async function load() { try { render({ environments: await json('/api/workspace-environments'), workstreams: await json('/api/workspace-agentos?view=workstreams'), board: await json('/api/workspace-agentos') }); } catch (error) { const host = document.querySelector('#build-command-center'); if (host) host.innerHTML = `<p class="workstream-empty"><strong>Build state unavailable.</strong><span>${esc(error.message)}</span></p>`; } }
load();
let timer = setInterval(() => { if (!document.hidden) load(); }, 45000);
window.addEventListener('beforeunload', () => clearInterval(timer), { once: true });
