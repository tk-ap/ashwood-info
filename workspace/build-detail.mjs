const esc = (value = '') => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const age = value => { const ms = Date.now() - new Date(value).getTime(); return Number.isFinite(ms) ? (ms < 60000 ? `${Math.max(1, Math.round(ms / 1000))}s ago` : `${Math.round(ms / 60000)}m ago`) : 'unknown'; };
async function get(url) { const response = await fetch(url, { credentials:'same-origin', cache:'no-store' }); if (!response.ok) throw new Error(response.status === 401 ? 'Unlock Workspace at /workspace/ to read private Build state.' : `${url} returned ${response.status}`); return response.json(); }
function card(title, lines, status = '') { return `<article class="build-detail-card"><div><h2>${esc(title)}</h2>${status ? `<span class="build-status build-status--${esc(status.toLowerCase())}">${esc(status)}</span>` : ''}</div>${lines.map(([label, value]) => `<p><small>${esc(label)}</small>${esc(value || '—')}</p>`).join('')}</article>`; }
async function render() {
  const page = document.body.dataset.buildPage;
  const host = document.querySelector('#build-detail-content');
  try {
    if (page === 'environments') {
      const data = await get('/api/workspace-environments');
      host.innerHTML = `<p class="build-detail-fresh">Source: ${esc(data.authority)} · updated ${data.observed_at ? age(data.observed_at) : 'never'} · records older than ${data.stale_after_seconds / 60}m are STALE.</p><div class="build-detail-grid">${data.environments.map(item => { const s = item.sandbox; return card(item.label, [['Production', item.production.url], ['Sandbox', s?.url], ['Provider', s?.provider], ['Provider identity', s?.provider_identity], ['Revision', s?.revision], ['Source ref', s?.source_ref], ['Verification', s?.verification_state], ['Observed', s?.observed_at ? age(s.observed_at) : 'not associated']], item.status); }).join('')}</div>`;
    } else if (page === 'agentos' || page === 'queue') {
      const data = await get('/api/workspace-agentos'); const rows = page === 'queue' ? data.rows.filter(row => row.work_domain !== 'agentos') : data.rows;
      host.innerHTML = `<p class="build-detail-fresh">Source: AgentOS board snapshot · ${data.observed_at ? `updated ${age(data.observed_at)}` : 'no snapshot received'} · ${rows.length} rows.</p><div class="build-detail-grid">${rows.map(row => card(row.title, [['Product', row.product], ['Lane', row.lane], ['Status', row.status], ['Assignee', row.assignee], ['Blocker', row.blocker], ['Next gate', row.next_gate], ['Observed', row.observed_at ? age(row.observed_at) : 'unknown']], row.lane === 'stuck' ? 'BLOCKED' : row.status)).join('') || '<p>No matching rows in the latest AgentOS projection.</p>'}</div>`;
    } else if (page === 'design') {
      const data = await get('/api/workspace-design'); const items = data.items || data.rows || [];
      host.innerHTML = `<p class="build-detail-fresh">Source: design lifecycle projection · ${data.reconciled_at ? `reconciled ${age(data.reconciled_at)}` : 'freshness not supplied'}.</p><div class="build-detail-grid">${items.map(item => card(item.title || item.id, [['Surface', item.surface], ['State', item.state], ['Next', item.next_step || item.next_gate], ['Evidence', item.evidence_ref]], item.blocked ? 'BLOCKED' : item.stale ? 'STALE' : item.state)).join('') || '<p>No design items in the current projection.</p>'}</div>`;
    } else {
      const [logs, board] = await Promise.all([get('/api/workspace-state?view=build_logs'), get('/api/workspace-agentos')]);
      const rows = [...(logs.logs || []).map(row => ({ ...row, category:'Build log' })), ...board.rows.filter(row => ['done', 'review'].includes(row.lane)).map(row => ({ title:row.title, occurred_at:row.updated_at, status:row.status, notes:row.summary, category:'AgentOS transition' }))].sort((a,b) => new Date(b.occurred_at) - new Date(a.occurred_at));
      host.innerHTML = `<p class="build-detail-fresh">Completed, stale, superseded, and deployment evidence remain historical—not current state.</p><div class="build-detail-grid">${rows.map(row => card(row.title, [['Type', row.category], ['Status', row.status], ['When', row.occurred_at ? age(row.occurred_at) : 'unknown'], ['Notes', row.notes]], row.status)).join('') || '<p>No history records are available.</p>'}</div>`;
    }
  } catch (error) { host.innerHTML = `<p class="workstream-empty"><strong>Detail unavailable.</strong><span>${esc(error.message)}</span></p>`; }
}
render(); const timer = setInterval(() => { if (!document.hidden) render(); }, 45000); window.addEventListener('beforeunload', () => clearInterval(timer), { once:true });
