// Private ALVIRA Context panel: the owner's released ALVIRA Context, as interpretation input for
// /workspace (WORKSPACE_GOAL_EVIDENCE_SYSTEM.md). Owner session only; never public copy.
const host = document.querySelector('#alvira-context');
const statusNode = document.querySelector('#alvira-context-status');
const refresh = document.querySelector('#alvira-context-refresh');

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const when = value => {
  if (!value) return 'unknown time';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'unknown time' : date.toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
};
const SPEC_LABELS = { goal:'Goal', done:'Definition of done', successMeasures:'Success measures', constraints:'Constraints', priorities:'Priorities and tradeoffs', decisions:'Decisions made', currentState:'Where things stand', people:'People involved', openQuestions:'Open questions', nextSteps:'Next steps' };

function contextCard(context) {
  const answers = (context.domains || []).reduce((n, d) => n + (d.answers || []).length, 0);
  const spec = Object.entries(context.goal_spec?.fields || {}).map(([key, field]) =>
    `<li><b>${esc(SPEC_LABELS[key] || key)}</b> ${esc(field.value ?? 'Not stated in the interview.')}</li>`).join('');
  const areas = (context.domains || []).map(d =>
    `<details><summary>${esc(d.label)} · ${d.answers.length}</summary><ul>${d.answers.map(a => `<li>${esc(a)}</li>`).join('')}</ul></details>`).join('');
  const sources = (context.sources || []).map(s => `<li><a href="${esc(s.locator)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a></li>`).join('');
  return `<article class="source-card">
    <div class="source-card-head">
      <div><strong>${esc(context.topic)}</strong>
        <span>${esc(context.environment === 'production' ? 'ALVIRA' : 'ALVIRA test environment')} · ${answers} answers · synced ${esc(when(context.observed_at))}</span></div>
    </div>
    ${spec ? `<h3>Goal spec (owner-approved)</h3><ul class="context-spec">${spec}</ul>` : '<p class="section-note">No owner-approved goal spec yet.</p>'}
    ${areas ? `<h3>Context areas</h3><div class="context-areas">${areas}</div>` : ''}
    ${sources ? `<h3>Confirmed sources</h3><ul>${sources}</ul>` : ''}
  </article>`;
}

async function load() {
  if (!host) return;
  statusNode.textContent = 'Reading ALVIRA Context…';
  try {
    const response = await fetch('/api/workspace-context', { credentials: 'same-origin' });
    if (response.status === 401) { statusNode.textContent = 'Sign in to the workspace to see ALVIRA Context.'; host.innerHTML = ''; return; }
    const body = await response.json();
    const contexts = Array.isArray(body.contexts) ? body.contexts : [];
    host.innerHTML = contexts.length
      ? contexts.map(contextCard).join('')
      : '<div class="workspace-state"><strong>No ALVIRA Context synced yet.</strong>Run scripts/sync-alvira-context.mjs with a Bridge readback to add one.</div>';
    statusNode.textContent = contexts.length ? `${contexts.length} Context${contexts.length === 1 ? '' : 's'}` : '';
  } catch {
    statusNode.textContent = 'Could not read ALVIRA Context.';
  }
}

refresh?.addEventListener('click', load);
load();
