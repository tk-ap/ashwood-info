const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const host = document.querySelector('#ecosystem-feed');
const status = document.querySelector('#ecosystem-feed-status');
let feed = [];

async function api(path, options = {}) {
  const response = await fetch(path, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
  return body;
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function render() {
  if (!host) return;
  if (!feed.length) {
    host.innerHTML = '<p class="ecosystem-feed__empty"><strong>No feed items yet.</strong><span>Signals, decisions, blockers, and results will appear here as the ecosystem publishes evidence.</span></p>';
    if (status) status.textContent = 'No saved feed items';
    return;
  }
  host.innerHTML = feed.map(item => {
    const resolved = ['ACCEPTED', 'DISMISSED'].includes(String(item.status).toUpperCase());
    return `<article class="ecosystem-feed__item ${resolved ? 'is-resolved' : ''}">
      <div class="ecosystem-feed__topline"><span>${escapeHtml(item.source_label || item.source)} · ${formatDate(item.occurred_at)}</span><span class="status-pill">${escapeHtml(item.status || 'SIGNAL')}</span></div>
      <h3>${escapeHtml(item.title)}</h3>
      <p class="ecosystem-feed__notes">${escapeHtml(item.notes || 'Evidence received. Review before turning it into work.')}</p>
      <div class="ecosystem-feed__meta"><span>Confidence ${Math.round(Number(item.confidence || .5) * 100)}%</span><span>Goal ${escapeHtml(item.goal_id || 'unassigned')}</span></div>
      <div class="ecosystem-feed__actions">
        ${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">Open source ↗</a>` : ''}
        ${resolved ? '<span>Decision recorded</span>' : `<button type="button" data-feed-decision="ACCEPTED" data-feed-id="${escapeHtml(item.id)}">Keep in focus</button><button type="button" data-feed-decision="DISMISSED" data-feed-id="${escapeHtml(item.id)}">Dismiss</button>`}
      </div>
    </article>`;
  }).join('');
  if (status) status.textContent = `${feed.length} saved feed item${feed.length === 1 ? '' : 's'}`;
  host.querySelectorAll('[data-feed-decision]').forEach(button => button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      await api('/api/workspace-state', { method: 'POST', body: JSON.stringify({ action: 'record_feed_decision', id: button.dataset.feedId, status: button.dataset.feedDecision }) });
      await load();
    } catch (error) {
      button.disabled = false;
      if (status) status.textContent = error.message;
    }
  }));
}

async function load() {
  try {
    const data = await api('/api/workspace-state?view=feed');
    feed = data.feed || [];
    render();
  } catch (error) {
    if (status) status.textContent = error.status === 401 ? 'Unlock Workspace to read the ecosystem feed.' : 'Feed unavailable';
  }
}

async function syncAilhatSignals(items = []) {
  await Promise.all(items.slice(0, 20).map(item => api('/api/workspace-state', {
    method: 'POST',
    body: JSON.stringify({
      action: 'ingest_external_signal',
      id: item.id,
      source: 'ailhat',
      source_label: item.sourceLabel || 'ailhat',
      title: item.title,
      occurred_at: item.date,
      status: item.status === 'COMPLETED' ? 'COMPLETED' : 'SIGNAL',
      goal_id: item.goal || 'ownership',
      confidence: item.confidence ?? .5,
      url: item.url || 'https://ailhat.vercel.app/',
      notes: item.notes || 'ailhat signal saved for owner review.'
    })
  })));
  await load();
}

window.addEventListener('ashwood:ailhat-signals', event => syncAilhatSignals(event.detail || []).catch(() => {}));
window.addEventListener('ashwood:refresh-feed', () => load());
load();
