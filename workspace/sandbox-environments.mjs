const host = document.querySelector('#sandbox-environments-list');
const statusHost = document.querySelector('#sandbox-environments-status');
const refreshButton = document.querySelector('#sandbox-environments-refresh');

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, c => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

const fmt = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(date)
    : '—';
};

function accessLabel(row) {
  if (row.access_mode === 'workspace_gateway') return 'WORKSPACE LOGIN';
  if (row.access_mode === 'account_members') return 'PROVIDER MEMBERS';
  if (row.access_mode === 'restricted') return 'RESTRICTED';
  if (row.access_mode === 'password') return 'PASSWORD';
  if (row.access_mode === 'anyone_with_link') return 'LINK ACCESS';
  return 'UNKNOWN';
}

function lifecycleLabel(row) {
  if (row.status === 'retired') return 'RETIRED';
  if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) return 'EXPIRED';
  if (row.persistence === 'permanent') return 'PERSISTENT';
  if (row.expires_at) return 'EXPIRES ' + fmt(row.expires_at);
  return String(row.persistence || 'unknown').toUpperCase();
}

async function queueAction(row, action) {
  const labels = {
    verify: 'Verify',
    update: 'Update',
    retire: 'Retire',
    gate: 'Gate'
  };
  const command =
    `${labels[action] || action} sandbox environment ${row.id}. ` +
    `Product: ${row.product_key}. Provider: ${row.provider}. URL: ${row.url}. ` +
    `Treat ASHWOOD Workspace as the owner interface, preserve GitHub as source-code truth, ` +
    `preserve provider deployment facts as evidence, and route any mutating action through AgentOS/ledgato governance. ` +
    (action === 'gate'
      ? 'Implement Workspace-authenticated access without exposing or reusing the raw ashwood_workspace_session cookie outside the ASHWOOD origin. Use a scoped gateway/grant boundary.'
      : action === 'verify'
        ? 'Check provider state, current version, access policy, expiry/persistence, and source-ref parity; update the sandbox registry with evidence.'
        : action === 'update'
          ? 'Reconcile the canonical source and provider state, then publish only the bounded intended sandbox delta and update registry evidence.'
          : 'Retire the sandbox only after verifying it is not serving a still-needed review path; then update the registry evidence.');

  const response = await fetch('/api/workspace-state', {
    method:'POST',
    credentials:'same-origin',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({action:'submit_command', command})
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Workspace command ${response.status}`);
  return payload;
}

function render(rows) {
  if (!host) return;
  if (!rows.length) {
    host.innerHTML = '<p class="section-note">No sandbox environments are registered yet.</p>';
    return;
  }

  host.innerHTML = rows.map(row => {
    const meta = row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
    const source = [row.source_repo, row.source_ref ? String(row.source_ref).slice(0, 10) : null].filter(Boolean).join(' · ') || 'source unavailable';
    const parity = meta.parity_verified === true ? 'PARITY VERIFIED' : 'PARITY UNKNOWN';
    const authNeedsWork = row.provider === 'here.now' && row.access_mode !== 'workspace_gateway';
    return `<article class="sandbox-environment-card" data-sandbox-id="${escapeHtml(row.id)}">
      <div class="sandbox-environment-card__head">
        <div>
          <p class="section-kicker">${escapeHtml(row.product_key)} · ${escapeHtml(row.provider)}</p>
          <h3>${escapeHtml(row.purpose)}</h3>
        </div>
        <span class="sandbox-environment-status" data-state="${escapeHtml(row.status)}">${escapeHtml(String(row.status || 'unknown').toUpperCase())}</span>
      </div>
      <div class="sandbox-environment-grid">
        <div><small>Access</small><strong>${escapeHtml(accessLabel(row))}</strong><span>${authNeedsWork ? 'Workspace gateway not active yet' : 'current provider policy'}</span></div>
        <div><small>Lifecycle</small><strong>${escapeHtml(lifecycleLabel(row))}</strong><span>${escapeHtml(String(row.ownership || 'unknown'))} ownership</span></div>
        <div><small>Version</small><strong>${escapeHtml(row.provider_version_id || '—')}</strong><span>${escapeHtml(parity)}</span></div>
        <div><small>Source</small><strong>${escapeHtml(source)}</strong><span>observed ${escapeHtml(fmt(row.last_observed_at))}</span></div>
      </div>
      <div class="sandbox-environment-actions">
        <a href="${escapeHtml(row.url)}" target="_blank" rel="noopener">Open sandbox ↗</a>
        <button type="button" data-sandbox-action="verify">Queue verify</button>
        <button type="button" data-sandbox-action="update">Queue update</button>
        ${authNeedsWork ? '<button type="button" data-sandbox-action="gate">Queue Workspace gate</button>' : ''}
        <button type="button" data-sandbox-action="retire">Queue retire</button>
      </div>
    </article>`;
  }).join('');

  host.querySelectorAll('[data-sandbox-action]').forEach(button => {
    button.addEventListener('click', async () => {
      const card = button.closest('[data-sandbox-id]');
      const row = rows.find(item => item.id === card?.dataset.sandboxId);
      if (!row) return;
      const original = button.textContent;
      button.disabled = true;
      button.textContent = 'Queuing…';
      try {
        await queueAction(row, button.dataset.sandboxAction);
        button.textContent = 'Queued';
        setTimeout(() => { button.textContent = original; button.disabled = false; }, 1400);
      } catch (error) {
        button.textContent = 'Failed';
        if (statusHost) statusHost.textContent = error.message;
        setTimeout(() => { button.textContent = original; button.disabled = false; }, 1800);
      }
    });
  });
}

async function load() {
  if (refreshButton) {
    refreshButton.disabled = true;
    refreshButton.textContent = 'Refreshing…';
  }
  try {
    const response = await fetch('/api/workspace-sandboxes', {
      credentials:'same-origin',
      cache:'no-store'
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Sandbox registry ${response.status}`);
    render(Array.isArray(payload.environments) ? payload.environments : []);
    if (statusHost) statusHost.textContent =
      'Provider facts are displayed here; source code stays in GitHub, work lifecycle stays in AgentOS, and authorization stays in ledgato.';
  } catch (error) {
    if (host) host.innerHTML = `<p class="section-note">Sandbox environments unavailable: ${escapeHtml(error.message)}.</p>`;
    if (statusHost) statusHost.textContent = 'Registry unavailable; this is not evidence that a sandbox is down.';
  } finally {
    if (refreshButton) {
      refreshButton.disabled = false;
      refreshButton.textContent = 'Refresh';
    }
  }
}

refreshButton?.addEventListener('click', load);
window.addEventListener('ashwood:workspace-authenticated', load);
load();
