const esc = (value = '') => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const age = value => {
  const stamp = new Date(value).getTime();
  if (!Number.isFinite(stamp)) return 'unknown';
  const ms = Date.now() - stamp;
  if (ms < 60000) return `${Math.max(1, Math.round(ms / 1000))}s ago`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.round(ms / 3600000)}h ago`;
  return `${Math.round(ms / 86400000)}d ago`;
};
const safeUrl = value => {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' ? url.toString() : '';
  } catch { return ''; }
};
const shortSha = value => String(value || '').slice(0, 8) || '—';

async function getBoard() {
  const response = await fetch('/api/workspace-agentos', { credentials:'same-origin', cache:'no-store' });
  if (!response.ok) throw new Error(response.status === 401 ? 'Unlock Workspace at /workspace/ to read deployment evidence.' : `AgentOS projection returned ${response.status}`);
  return response.json();
}

function count(rows, fn) { return rows.filter(fn).length; }

function metric(label, value, detail) {
  return `<article class="deployment-ledger__metric"><small>${esc(label)}</small><strong>${esc(value)}</strong><span>${esc(detail)}</span></article>`;
}

function selectOptions(values, selected, allLabel) {
  return [`<option value="">${esc(allLabel)}</option>`, ...values.map(value => `<option value="${esc(value)}" ${value === selected ? 'selected' : ''}>${esc(value)}</option>`)].join('');
}

function deploymentCard(row) {
  const deploymentUrl = safeUrl(row.deployment_url);
  const siteUrl = safeUrl(row.site_url);
  const target = String(row.target || 'preview');
  const state = String(row.state || 'UNKNOWN');
  const destinationUrl = target === 'production' ? (siteUrl || deploymentUrl) : (deploymentUrl || siteUrl);
  return `<article class="deployment-ledger__row" data-project="${esc(row.project)}" data-target="${esc(target)}" data-state="${esc(state)}">
    <div class="deployment-ledger__row-head">
      <div>
        <p class="section-kicker">${esc(row.project || 'Unknown project')} · ${esc(target)}</p>
        <h2>${esc(row.summary || row.commit_message || 'Deployment')}</h2>
      </div>
      <span class="build-status build-status--${esc(state.toLowerCase())}">${esc(state)}</span>
    </div>
    <dl class="deployment-ledger__facts">
      <div><dt>When</dt><dd>${esc(age(row.created_at))}</dd></div>
      <div><dt>Branch</dt><dd>${esc(row.git_ref || '—')}</dd></div>
      <div><dt>Revision</dt><dd><code>${esc(shortSha(row.git_sha))}</code></dd></div>
      <div><dt>Destination</dt><dd>${destinationUrl ? `<a href="${esc(destinationUrl)}" target="_blank" rel="noopener">${esc(destinationUrl.replace(/^https:\/\//,''))}</a>` : '—'}</dd></div>
    </dl>
    <div class="deployment-ledger__links">
      ${deploymentUrl ? `<a href="${esc(deploymentUrl)}" target="_blank" rel="noopener">Deployment ↗</a>` : ''}
      ${row.git_repo && row.git_org && row.git_sha ? `<a href="https://github.com/${encodeURIComponent(row.git_org)}/${encodeURIComponent(row.git_repo)}/commit/${encodeURIComponent(row.git_sha)}" target="_blank" rel="noopener">Commit ↗</a>` : ''}
      <span>${esc(row.id || '')}</span>
    </div>
  </article>`;
}

function attemptCard(row) {
  const items = Array.isArray(row.batch_items) ? row.batch_items : [];
  const blocker = row.blocker_reason || row.terminal_reason || '';
  return `<article class="deployment-ledger__attempt">
    <div>
      <p class="section-kicker">${esc(row.product || 'Unknown')} · ${esc(row.target_environment || 'unknown target')}</p>
      <h3>${esc(row.work_id || row.id)}</h3>
    </div>
    <dl class="deployment-ledger__facts">
      <div><dt>State</dt><dd>${esc(row.state || 'unknown')}</dd></div>
      <div><dt>Branch</dt><dd>${esc(row.branch || '—')}</dd></div>
      <div><dt>Revision</dt><dd><code>${esc(shortSha(row.revision))}</code></dd></div>
      <div><dt>Mutation attempts</dt><dd>${esc(row.mutation_attempts ?? 0)}</dd></div>
      <div><dt>Availability checks</dt><dd>${esc(row.availability_checks ?? 0)}</dd></div>
      <div><dt>Batch size</dt><dd>${items.length}</dd></div>
    </dl>
    ${items.length ? `<p class="deployment-ledger__batch"><strong>Batch:</strong> ${esc(items.join(' · '))}</p>` : ''}
    ${blocker ? `<p class="deployment-ledger__blocker"><strong>${row.blocker_class ? 'Blocked' : 'Result'}:</strong> ${esc(blocker)}</p>` : ''}
  </article>`;
}

function render(board) {
  const host = document.querySelector('#deployment-ledger');
  const budgetRow = (board.rows || []).find(row => row.kind === 'deployment_budget');
  if (!budgetRow) {
    host.innerHTML = '<p class="workstream-empty"><strong>No deployment ledger projection yet.</strong><span>AgentOS has not published deployment evidence to this Workspace snapshot.</span></p>';
    return;
  }

  const meta = budgetRow.metadata || {};
  const history = meta.deployment_history || {};
  const deployments = Array.isArray(history.deployments) ? history.deployments : [];
  const attempts = Array.isArray(meta.deployment_attempts) ? meta.deployment_attempts : [];

  const uniqueRevisions = new Set(deployments.map(row => row.git_sha).filter(Boolean)).size;
  const repeatedRevisionEvents = Math.max(0, deployments.filter(row => row.git_sha).length - uniqueRevisions);
  const productionReady = count(deployments, row => row.target === 'production' && row.state === 'READY');
  const previewEvents = count(deployments, row => row.target !== 'production');
  const unsuccessful = count(deployments, row => ['ERROR','CANCELED'].includes(String(row.state).toUpperCase()));
  const parked = count(attempts, row => row.state === 'waiting_availability');
  const superseded = count(attempts, row => row.state === 'superseded');
  const mutationAttempts = attempts.reduce((sum, row) => sum + Number(row.mutation_attempts || 0), 0);

  const projects = [...new Set(deployments.map(row => row.project).filter(Boolean))].sort();
  const targets = [...new Set(deployments.map(row => row.target).filter(Boolean))].sort();
  const states = [...new Set(deployments.map(row => row.state).filter(Boolean))].sort();

  host.innerHTML = `
    <p class="build-detail-fresh">Source: canonical AgentOS Vercel observation ledger · snapshot ${board.observed_at ? esc(age(board.observed_at)) : 'freshness unavailable'} · ${esc(history.projected ?? deployments.length)} of ${esc(history.total ?? deployments.length)} retained records projected here.</p>
    <section class="deployment-ledger__metrics">
      ${metric('Deployment events', deployments.length, 'provider-observed records in this projection')}
      ${metric('Unique revisions', uniqueRevisions, `${repeatedRevisionEvents} additional event(s) reused an observed revision`)}
      ${metric('Production READY', productionReady, `${previewEvents} non-production deployment event(s)`)}
      ${metric('Unsuccessful', unsuccessful, 'ERROR or CANCELED provider states')}
      ${metric('Gate records', attempts.length, `${parked} parked · ${superseded} superseded`)}
      ${metric('Mutation attempts', mutationAttempts, 'AgentOS-recorded deployment mutations')}
    </section>

    <section class="deployment-ledger__diagnostic">
      <div>
        <p class="section-kicker">Batching diagnostic</p>
        <h2>Did one source change become more than one deployment?</h2>
      </div>
      <p><strong>${deployments.length}</strong> deployment events currently map to <strong>${uniqueRevisions || 0}</strong> unique known source revisions. <strong>${repeatedRevisionEvents}</strong> extra event(s) reused a known revision. AgentOS separately records <strong>${attempts.length}</strong> governed release/gate entries, including <strong>${parked}</strong> parked before mutation. This does not treat previews or retries as failures by itself; it exposes the churn so the release strategy can be checked against evidence.</p>
    </section>

    <section class="deployment-ledger__section">
      <div class="deployment-ledger__section-head">
        <div><p class="section-kicker">Provider record</p><h2>Deployment ledger</h2></div>
        <div class="deployment-ledger__filters">
          <label>Product<select id="deployment-filter-project">${selectOptions(projects, '', 'All products')}</select></label>
          <label>Target<select id="deployment-filter-target">${selectOptions(targets, '', 'All targets')}</select></label>
          <label>State<select id="deployment-filter-state">${selectOptions(states, '', 'All states')}</select></label>
        </div>
      </div>
      <p id="deployment-filter-count" class="build-detail-fresh"></p>
      <div id="deployment-ledger-rows" class="deployment-ledger__rows"></div>
    </section>

    <section class="deployment-ledger__section">
      <div class="deployment-ledger__section-head"><div><p class="section-kicker">AgentOS release path</p><h2>Attempts, gates, and batches</h2></div></div>
      <p class="build-detail-fresh">These are AgentOS release-recovery records, not Vercel deployments. A parked gate with zero mutation attempts means capacity prevented a deployment before provider mutation.</p>
      <div class="deployment-ledger__attempts">${attempts.map(attemptCard).join('') || '<p>No AgentOS deployment gate records are present in this projection.</p>'}</div>
    </section>`;

  const rowsHost = host.querySelector('#deployment-ledger-rows');
  const countHost = host.querySelector('#deployment-filter-count');
  const controls = ['project','target','state'].map(key => host.querySelector(`#deployment-filter-${key}`));

  function applyFilters() {
    const [project, target, state] = controls.map(control => control?.value || '');
    const visible = deployments.filter(row => (!project || row.project === project) && (!target || row.target === target) && (!state || row.state === state));
    rowsHost.innerHTML = visible.map(deploymentCard).join('') || '<p>No deployment records match these filters.</p>';
    countHost.textContent = `${visible.length} of ${deployments.length} deployment records shown.`;
  }
  controls.forEach(control => control?.addEventListener('change', applyFilters));
  applyFilters();
}

async function load() {
  const host = document.querySelector('#deployment-ledger');
  try { render(await getBoard()); }
  catch (error) { host.innerHTML = `<p class="workstream-empty"><strong>Deployment ledger unavailable.</strong><span>${esc(error.message)}</span></p>`; }
}

load();
const timer = setInterval(() => { if (!document.hidden) load(); }, 60000);
window.addEventListener('beforeunload', () => clearInterval(timer), { once:true });
