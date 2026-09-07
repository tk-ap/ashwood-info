const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[c]));

const goalName = id => ({
  ownership: 'Ownership',
  leadership: 'Visible leadership',
  relationships: 'Relationship equity',
  learning: 'Learning',
  modeling: 'Modeling',
  music: 'Music',
  writing: 'Writing',
}[id] || id);

function stateClass(status = '') {
  const normalized = String(status).toLowerCase();
  if (['blocked', 'failed', 'needs_attention'].includes(normalized)) return 'is-risk';
  if (['completed', 'done', 'shipped'].includes(normalized)) return 'is-done';
  if (['waiting_approval', 'decision_required', 'review'].includes(normalized)) return 'is-decision';
  return 'is-active';
}

function renderRows(rows) {
  const target = document.querySelector('#workstream-list');
  const count = document.querySelector('#workstream-count');
  if (!target) return;
  if (count) count.textContent = `${rows.length} active workstream${rows.length === 1 ? '' : 's'}`;

  if (!rows.length) {
    target.innerHTML = `<p class="workstream-empty">No canonical workstreams have synced yet. AgentOS and other owning systems can publish projections here without moving execution truth into ASHWOOD.</p>`;
    return;
  }

  target.innerHTML = rows.map(row => {
    const goals = Array.isArray(row.goal_ids) ? row.goal_ids : [];
    const url = row.canonical_url ? `<a class="workstream-link" href="${escapeHtml(row.canonical_url)}" target="_blank" rel="noopener">Open canonical source ↗</a>` : '';
    const tags = goals.map(g => `<span>${escapeHtml(goalName(g))}</span>`).join('');
    return `<article class="workstream-card">
      <div class="workstream-topline">
        <div>
          <p class="workstream-product">${escapeHtml(row.product || row.source_system || 'Workstream')}</p>
          <h3>${escapeHtml(row.title)}</h3>
        </div>
        <span class="workstream-status ${stateClass(row.status)}">${escapeHtml(row.status || 'ACTIVE').replaceAll('_', ' ')}</span>
      </div>
      ${row.summary ? `<p class="workstream-summary">${escapeHtml(row.summary)}</p>` : ''}
      <dl class="workstream-meta">
        <div><dt>Owner</dt><dd>${escapeHtml(row.owner || 'Unassigned')}</dd></div>
        <div><dt>Stage</dt><dd>${escapeHtml(row.stage || 'Active')}</dd></div>
        <div><dt>Source</dt><dd>${escapeHtml(row.source_system || 'Unknown')}</dd></div>
      </dl>
      ${row.next_gate ? `<div class="workstream-gate"><span>Next gate</span><strong>${escapeHtml(row.next_gate)}</strong></div>` : ''}
      <div class="workstream-footer"><div class="workstream-goals">${tags}</div>${url}</div>
    </article>`;
  }).join('');
}

async function load() {
  const target = document.querySelector('#workstream-list');
  if (!target) return;
  try {
    const response = await fetch('/api/workspace-workstreams', { credentials: 'same-origin', cache: 'no-store' });
    if (response.status === 401) {
      target.innerHTML = '<p class="workstream-empty">Unlock the workspace to load workstreams.</p>';
      return false;
    }
    if (!response.ok) throw new Error(`Workstreams ${response.status}`);
    const data = await response.json();
    renderRows(data.rows || []);
    return true;
  } catch (error) {
    target.innerHTML = `<p class="workstream-empty">Workstreams unavailable: ${escapeHtml(error.message)}</p>`;
    return false;
  }
}

async function start() {
  if (await load()) return;
  // app.js owns the auth gate. Retry briefly so this independent projection
  // loads immediately after the owner unlocks the workspace.
  let attempts = 0;
  const timer = setInterval(async () => {
    attempts += 1;
    if (await load() || attempts >= 30) clearInterval(timer);
  }, 1500);
}

start();
