const endpoint = '/api/workspace-analyses';
const drafts = new Map();

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[char]));

function shortDate(value) {
  const date = new Date(value || '');
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

export function buildOperatorDraft({ id, title, text, kind = 'finding' }) {
  const subject = kind === 'candidate action' ? 'candidate action' : 'finding';
  return `Review YouTube analysis ${subject} ${id} from “${title || 'an untitled video'}”: ${text}. Verify the current evidence, then propose one bounded next step.`;
}

export function prefillOperatorDraft({ input, note, draft }) {
  if (!input || !draft) return false;
  input.value = draft;
  input.dispatchEvent?.(new Event('input', { bubbles: true }));
  if (note) note.textContent = 'Draft loaded from the evidence review. Edit it, then send only if you want AgentOS to consider it.';
  input.focus?.({ preventScroll: true });
  return true;
}

function launchButton(id, draft, label = 'Launch in Operator') {
  drafts.set(id, draft);
  return `<button class="youtube-analysis-launch" type="button" data-youtube-analysis-launch="${escapeHtml(id)}">${escapeHtml(label)}</button>`;
}

export function renderAnalysisItem(item) {
  const title = item.title || 'Untitled video';
  const findings = Array.isArray(item.findings) ? item.findings : [];
  const relevance = Array.isArray(item.ecosystem_relevance) ? item.ecosystem_relevance : [];
  const actions = Array.isArray(item.candidate_actions) ? item.candidate_actions : [];
  const limitations = Array.isArray(item.limitations) ? item.limitations : [];
  const badges = [
    item.coverage ? `<span>${escapeHtml(item.coverage)} coverage</span>` : '',
    item.visual_pending ? '<span class="is-attention">Visual review pending</span>' : '',
  ].filter(Boolean).join('');
  const findingMarkup = findings.length ? `<ul class="youtube-analysis-findings">${findings.map(finding => {
    const draft = buildOperatorDraft({ id: finding.id, title, text: finding.text });
    return `<li>
      <div><strong>${escapeHtml(finding.text)}</strong><p>${escapeHtml(finding.evidence_basis)}</p></div>
      <div class="youtube-analysis-finding__meta"><span>${finding.confidence === null || finding.confidence === undefined ? 'Confidence not rated' : `${Math.round(finding.confidence * 100)}% confidence`}</span>${launchButton(finding.id, draft)}</div>
    </li>`;
  }).join('')}</ul>` : '<p class="youtube-analysis-empty">No findings were included in this analysis.</p>';
  const relevanceMarkup = relevance.length ? `<ul>${relevance.map(entry => `<li><strong>${escapeHtml(entry.workstream)}</strong><span>${escapeHtml(entry.rationale)}</span><small>Risk / assumption: ${escapeHtml(entry.risk)}</small></li>`).join('')}</ul>` : '<p class="youtube-analysis-empty">No ecosystem relevance was included.</p>';
  const actionMarkup = actions.length ? `<ul>${actions.map(action => {
    const draft = buildOperatorDraft({ id: action.id, title, text: action.action, kind: 'candidate action' });
    return `<li><div><strong>${escapeHtml(action.action)}</strong><p>${escapeHtml(action.why)}</p></div>${launchButton(action.id, draft)}</li>`;
  }).join('')}</ul>` : '<p class="youtube-analysis-empty">No candidate actions were included.</p>';
  const limitationMarkup = limitations.length ? `<ul>${limitations.map(entry => `<li>${escapeHtml(entry)}</li>`).join('')}</ul>` : '<p class="youtube-analysis-empty">No limitations were included.</p>';
  return `<article class="youtube-analysis-card">
    <header class="youtube-analysis-card__head">
      <div>
        <p class="section-kicker">YouTube analysis</p>
        <h3><a href="${escapeHtml(item.video_url)}" target="_blank" rel="noopener">${escapeHtml(title)} ↗</a></h3>
        <p class="youtube-analysis-card__meta">${escapeHtml(item.channel || 'Channel unavailable')} · analyzed ${escapeHtml(shortDate(item.analyzed_at))}</p>
      </div>
      <div class="youtube-analysis-badges">${badges}</div>
    </header>
    <p class="youtube-analysis-summary">${escapeHtml(item.summary)}</p>
    <details open><summary>Findings (${findings.length})</summary>${findingMarkup}</details>
    <details><summary>Ecosystem relevance (${relevance.length})</summary><div class="youtube-analysis-detail-list">${relevanceMarkup}</div></details>
    <details><summary>Candidate actions (${actions.length})</summary><div class="youtube-analysis-actions">${actionMarkup}</div></details>
    <details><summary>Limitations (${limitations.length})</summary><div class="youtube-analysis-detail-list">${limitationMarkup}</div></details>
  </article>`;
}

function renderState(kind, title, detail) {
  const host = document.querySelector('#youtube-analyses-list');
  if (host) host.innerHTML = `<div class="workspace-state ${kind}"><strong>${escapeHtml(title)}</strong>${escapeHtml(detail)}</div>`;
}

function launchDraft(event) {
  const button = event.target.closest('[data-youtube-analysis-launch]');
  if (!button) return;
  const draft = drafts.get(button.dataset.youtubeAnalysisLaunch);
  if (!draft) return;
  document.querySelector('[data-workspace-nav="operator"]')?.click();
  requestAnimationFrame(() => {
    const input = document.querySelector('#today-command-input');
    const note = document.querySelector('#today-command-note');
    if (prefillOperatorDraft({ input, note, draft })) input.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

async function load() {
  renderState('is-loading', 'Loading YouTube analyses…', 'Reading the latest evidence-only AgentOS snapshot.');
  const status = document.querySelector('#youtube-analyses-status');
  try {
    const response = await fetch(endpoint, { credentials: 'same-origin', cache: 'no-store' });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(body.error || `Request failed (${response.status})`), { status: response.status });
    const items = (Array.isArray(body.items) ? body.items : []).slice().sort((a, b) => {
      const left = Date.parse(a.analyzed_at || '');
      const right = Date.parse(b.analyzed_at || '');
      return (Number.isFinite(right) ? right : 0) - (Number.isFinite(left) ? left : 0);
    });
    drafts.clear();
    const host = document.querySelector('#youtube-analyses-list');
    if (host) host.innerHTML = items.length
      ? items.map(renderAnalysisItem).join('')
      : '<div class="workspace-state is-empty"><strong>No completed video analyses yet.</strong>When AgentOS finishes an evidence-backed video analysis, it will appear here for review.</div>';
    if (status) status.textContent = body.generated_at ? `Updated ${shortDate(body.generated_at)} · ${items.length} analyses` : 'No snapshot received yet';
  } catch (error) {
    const message = error.status === 401
      ? 'Unlock Workspace to review the latest analyses.'
      : 'The analysis feed is unavailable. This does not change the underlying AgentOS work.';
    renderState('is-error', 'YouTube analyses unavailable.', message);
    if (status) status.textContent = error.status === 401 ? 'Workspace locked' : 'Feed unavailable';
  }
}

function start() {
  const host = document.querySelector('#youtube-analyses-list');
  if (!host) return;
  host.addEventListener('click', launchDraft);
  document.querySelector('#youtube-analyses-refresh')?.addEventListener('click', load);
  window.addEventListener('ashwood:workspace-authenticated', load);
  window.addEventListener('ashwood:refresh-feed', load);
  load();
}

if (typeof document !== 'undefined') start();
