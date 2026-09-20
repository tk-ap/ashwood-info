const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const host = document.querySelector('#ecosystem-feed');
const statusNode = document.querySelector('#ecosystem-feed-status');

let attention = { active: [], ignored: [], archive: [] };
let monitoring = [];
let activeDays = 7;

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

const GOAL_NAMES = {
  ownership: 'making the products and business more durable',
  leadership: 'making the work visible and coherent',
  learning: 'understanding and improving the system',
  writing: 'turning the work into a clear public record',
  modeling: 'developing the modeling practice',
  music: 'developing the music practice'
};

function humanGoal(value) {
  return GOAL_NAMES[String(value || '').toLowerCase()] || String(value || 'an owner priority').replaceAll('_', ' ');
}

function explainNotification(item) {
  const source = String(item.source_label || item.source || 'the ecosystem');
  const lower = `${item.title || ''} ${item.notes || ''}`.toLowerCase();
  const plain = lower.includes('block') || lower.includes('fail') || lower.includes('error')
    ? 'Something needs attention. The system is recording a problem or constraint, not claiming that the work is complete.'
    : lower.includes('complete') || lower.includes('merge') || lower.includes('deploy')
      ? 'This is a progress signal: something changed in the build. It still needs to be interpreted in context before it becomes a bigger claim.'
      : 'This is an observation worth reviewing. It has been saved so you can decide whether it should change your focus or next action.';
  const role = source.toLowerCase().includes('ailhat')
    ? 'ailhat is acting as portfolio intelligence here: it notices patterns across the products, but it does not make the decision for you.'
    : source.toLowerCase().includes('agent')
      ? 'AgentOS is the execution control layer here: it helps route and supervise work, while ownership and authority remain separate.'
      : source.toLowerCase().includes('ledgato')
        ? 'ledgato is the authorization boundary here: it is concerned with whether an action is allowed, denied, or requires approval.'
        : source.toLowerCase().includes('alvira')
          ? 'ALVIRA is the context layer here: it helps preserve what the system should know about the work and why it matters.'
          : 'ASHWOOD is the reflective layer here: it keeps the signal connected to your goals, judgment, and public record.';
  const curiosity = lower.includes('confidence') || lower.includes('evidence')
    ? 'The useful next question: what would make this evidence stronger, weaker, or outdated?'
    : lower.includes('route') || lower.includes('approval') || lower.includes('authority')
      ? 'The useful next question: who is allowed to move this from an observation into an action?'
      : 'The useful next question: what would you do differently if this signal were true?';
  return { plain, role, curiosity, goal: humanGoal(item.goal_id) };
}

function decisionActions(item, bucket) {
  const state = String(item.status || 'SIGNAL').toUpperCase();
  if (bucket === 'archive') return '<span>Archived decision</span>';

  const source = item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">Open source ↗</a>` : '';
  if (state === 'ACCEPTED') {
    return `${source}<span>Kept in focus</span><button type="button" data-feed-decision="DISMISSED" data-feed-id="${escapeHtml(item.id)}">Dismiss</button>`;
  }
  const focusLabel = bucket === 'ignored' ? 'Restore to focus' : 'Keep in focus';
  return `${source}<button type="button" data-feed-decision="ACCEPTED" data-feed-id="${escapeHtml(item.id)}">${focusLabel}</button><button type="button" data-feed-decision="DISMISSED" data-feed-id="${escapeHtml(item.id)}">Dismiss</button>`;
}

function itemHtml(item, bucket = 'active') {
  const state = String(item.status || 'SIGNAL').toUpperCase();
  const explanation = explainNotification(item);
  const bucketClass = bucket === 'archive' ? ' is-resolved' : bucket === 'ignored' ? ' is-aged' : '';
  const agingNote = bucket === 'ignored'
    ? `<p class="ecosystem-feed__aging">Aged out after ${activeDays} days without action. This is not a dismissal.</p>`
    : '';

  return `<article class="ecosystem-feed__item${bucketClass}" data-notification-status="${escapeHtml(state)}" role="listitem">
    <div class="ecosystem-feed__topline"><span class="ecosystem-feed__source"><span class="ecosystem-feed__source-dot" aria-hidden="true"></span><strong>${escapeHtml(item.source_label || item.source || 'Ecosystem')}</strong><span>notification</span></span><time datetime="${escapeHtml(item.occurred_at || '')}">${formatDate(item.occurred_at)}</time></div>
    <div class="ecosystem-feed__body"><div class="ecosystem-feed__signal-mark" aria-hidden="true">↗</div><div><h3>${escapeHtml(item.title)}</h3><p class="ecosystem-feed__notes">${escapeHtml(item.notes || 'Evidence received. Review before turning it into work.')}</p></div></div>
    <div class="ecosystem-feed__meta"><span class="ecosystem-feed__status">${escapeHtml(state.replaceAll('_', ' '))}</span><span>Confidence ${Math.round(Number(item.confidence || .5) * 100)}%</span><span>Goal ${escapeHtml(item.goal_id || 'unassigned')}</span></div>
    ${agingNote}
    <details class="ecosystem-feed__elitk"><summary class="ecosystem-feed__elitk-button"><span>ELITK</span><span>Explain this notification</span></summary><div class="ecosystem-feed__explanation"><p><strong>Plain English</strong>${escapeHtml(explanation.plain)}</p><p><strong>How it fits the build</strong>${escapeHtml(explanation.role)} The signal is connected to ${escapeHtml(explanation.goal)}.</p><p class="ecosystem-feed__curiosity"><strong>Keep going</strong>${escapeHtml(explanation.curiosity)}</p></div></details>
    <div class="ecosystem-feed__actions">${decisionActions(item, bucket)}</div>
  </article>`;
}

function bucketHtml(title, items, bucket, note) {
  if (!items.length) return '';
  return `<details class="ecosystem-feed__bucket ecosystem-feed__bucket--${bucket}">
    <summary><span>${escapeHtml(title)}</span><small>${items.length}</small></summary>
    ${note ? `<p class="ecosystem-feed__bucket-note">${escapeHtml(note)}</p>` : ''}
    <div class="ecosystem-feed__bucket-items">${items.map(item => itemHtml(item, bucket)).join('')}</div>
  </details>`;
}

function monitoringHtml() {
  const candidates = monitoring.filter(item => item.needs_review);
  if (!candidates.length) return '';
  return `<details class="ecosystem-feed__monitoring">
    <summary><span>Monitoring worth reviewing</span><small>${candidates.length} source${candidates.length === 1 ? '' : 's'}</small></summary>
    <p class="ecosystem-feed__bucket-note">These sources repeatedly produced signals that aged out without action. That does not prove the monitoring is useless; it tells you where to question frequency or whether the signal belongs here at all.</p>
    <div class="ecosystem-feed__monitoring-grid">
      ${candidates.map(item => `<article><strong>${escapeHtml(item.source)}</strong><span>${item.ignored} of ${item.total} signals aged out · ${Math.round(Number(item.ignored_rate || 0) * 100)}%</span><small>${item.kept_in_focus} kept in focus · ${item.dismissed} dismissed</small></article>`).join('')}
    </div>
  </details>`;
}

function bindActions() {
  host?.querySelectorAll('[data-feed-decision]').forEach(button => button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      await api('/api/workspace-state', { method: 'POST', body: JSON.stringify({ action: 'record_feed_decision', id: button.dataset.feedId, status: button.dataset.feedDecision }) });
      await load();
    } catch (error) {
      button.disabled = false;
      if (statusNode) statusNode.textContent = error.message;
    }
  }));
}

function render() {
  if (!host) return;
  const active = attention.active || [];
  const ignored = attention.ignored || [];
  const archive = attention.archive || [];

  const activeHtml = active.length
    ? active.map(item => itemHtml(item, 'active')).join('')
    : '<p class="ecosystem-feed__empty"><strong>Nothing needs attention right now.</strong><span>Ordinary observations age out automatically; blockers, approval requests, and anything you explicitly keep in focus stay visible.</span></p>';

  host.innerHTML = `
    <div class="ecosystem-feed__active">${activeHtml}</div>
    ${bucketHtml('Not acted on', ignored, 'ignored', `Ordinary signals leave the main view after ${activeDays} days without action. Restore one if it turns out to matter.`)}
    ${monitoringHtml()}
    ${bucketHtml('Archive', archive, 'archive', 'Completed and dismissed signals remain searchable history instead of dashboard content.')}
  `;
  if (statusNode) statusNode.textContent = `${active.length} need attention · ${ignored.length} aged out`;
  bindActions();
}

async function load() {
  try {
    const data = await api('/api/workspace-state?view=feed');
    attention = data.attention || { active: data.feed || [], ignored: [], archive: [] };
    monitoring = data.monitoring || [];
    activeDays = Number(data.attention_policy?.ordinary_signal_days || 7);
    render();
  } catch (error) {
    if (statusNode) statusNode.textContent = 'Feed unavailable';
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
