const escapeHtml = (value = '') => String(value).replace(/[&<>'\"]/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '\"': '&quot;'
}[c]));

const normalize = value => String(value || '').toLowerCase();
const ACTIVE = new Set(['active', 'in_progress', 'running', 'executing', 'started', 'working']);
const NEEDS_OWNER = new Set(['waiting_approval', 'decision_required', 'review', 'blocked', 'needs_attention']);

function matchesPriority(row, priority) {
  const haystack = [row.product, row.title, row.summary, row.source_system]
    .map(normalize)
    .join(' ');
  return (priority.match || []).some(term => haystack.includes(normalize(term)));
}

function executionState(rows, priority) {
  const matches = rows.filter(row => matchesPriority(row, priority));
  const agentRows = matches.filter(row => normalize(row.source_system).includes('agent') || normalize(row.owner).includes('agentos') || normalize(row.owner).includes('agent os'));
  const ownerNeeded = agentRows.find(row => NEEDS_OWNER.has(normalize(row.status)));
  if (ownerNeeded) return { label: 'AgentOS · needs you', className: 'is-decision', row: ownerNeeded };
  const underway = agentRows.find(row => ACTIVE.has(normalize(row.status)) || !row.status);
  if (underway) return { label: 'AgentOS · underway', className: 'is-agent', row: underway };
  if (agentRows.length) return { label: `AgentOS · ${String(agentRows[0].status || 'synced').replaceAll('_', ' ')}`, className: 'is-agent', row: agentRows[0] };
  if (matches.length) return { label: `${matches[0].source_system || 'Owning repo'} · ${String(matches[0].status || 'synced').replaceAll('_', ' ')}`, className: 'is-synced', row: matches[0] };
  return { label: 'No autonomous work confirmed', className: 'is-unconfirmed', row: null };
}

function ensureSurface() {
  let section = document.querySelector('#actual-priorities');
  if (section) return section;
  const workstreams = document.querySelector('.workstreams');
  if (!workstreams) return null;
  section = document.createElement('section');
  section.className = 'actual-priorities';
  section.id = 'actual-priorities';
  section.innerHTML = `
    <div class="section-heading-row priorities-heading">
      <div>
        <p class="section-kicker">Actual priorities</p>
        <h2>What matters now</h2>
      </div>
      <p class="section-note" id="priority-as-of"></p>
    </div>
    <div class="priority-list" id="priority-list" aria-live="polite"></div>
    <p class="priority-rule">Autonomous status is shown only when confirmed by the synced workstream projection.</p>`;
  workstreams.parentNode.insertBefore(section, workstreams);
  return section;
}

export async function renderPriorities(workstreamRows = []) {
  const section = ensureSurface();
  if (!section) return;
  const list = section.querySelector('#priority-list');
  const asOf = section.querySelector('#priority-as-of');
  try {
    const response = await fetch('/workspace/priorities.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Priorities ${response.status}`);
    const data = await response.json();
    if (asOf) asOf.textContent = `Ranked focus · ${data.as_of || 'current'}`;
    const priorities = Array.isArray(data.priorities) ? data.priorities : [];
    list.innerHTML = priorities.map(priority => {
      const execution = executionState(workstreamRows, priority);
      const gate = execution.row?.next_gate ? `<p class="priority-agent-gate"><span>AgentOS next gate</span>${escapeHtml(execution.row.next_gate)}</p>` : '';
      return `<article class="priority-row" data-tier="${escapeHtml(priority.tier || '')}">
        <div class="priority-rank">${String(priority.rank).padStart(2, '0')}</div>
        <div class="priority-main">
          <div class="priority-topline">
            <div><span class="priority-tier">${escapeHtml(priority.tier || 'NOW')}</span><h3>${escapeHtml(priority.product)}</h3></div>
            <span class="priority-execution ${execution.className}">${escapeHtml(execution.label)}</span>
          </div>
          <p class="priority-outcome">${escapeHtml(priority.outcome)}</p>
          <p class="priority-owner"><span>Your next</span>${escapeHtml(priority.owner_next)}</p>
          ${gate}
        </div>
      </article>`;
    }).join('') || '<p class="workstream-empty"><strong>No priorities configured.</strong><span>Add ranked priorities to workspace/priorities.json.</span></p>';
  } catch (error) {
    if (asOf) asOf.textContent = 'Priority model unavailable';
    list.innerHTML = `<p class="workstream-empty"><strong>Actual priorities could not load.</strong><span>${escapeHtml(error.message)}</span></p>`;
  }
}
