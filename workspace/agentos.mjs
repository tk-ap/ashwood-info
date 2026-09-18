const target = document.querySelector('#agentos-control');

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[character]));

function viewModel(data) {
  const command = data.command;
  const projection = data.projection;
  if (projection) {
    const freshness = data.freshness === 'offline' ? 'Omarchy offline or projection stale' :
      data.freshness === 'watch' ? 'Projection aging' : 'Live AgentOS projection';
    return {
      eyebrow: freshness,
      title: `Proof 0 · ${projection.phase || 'unknown'}`,
      detail: projection.task_id ? `Task ${projection.task_id}` : 'Directive recorded; task not created yet',
      facts: [
        ['Milchik', projection.milchik || 'monitoring'],
        ['Assigned specialist', projection.specialist || 'not assigned yet'],
        ['Harness', projection.harness || 'not selected yet'],
        ['Evidence', `${projection.event_count || 0} lifecycle events`],
        ['Last observed', data.observed_at ? new Date(data.observed_at).toLocaleString() : 'not reported'],
        ['Next gate', projection.next_gate || 'waiting for runtime state'],
        ['Production authority', 'none'],
      ],
      disabled: true,
      button: 'Run already recorded',
    };
  }
  if (command && ['queued', 'claimed'].includes(command.status)) {
    return {
      eyebrow: command.status === 'claimed' ? 'AgentOS acknowledged' : 'Queued for Omarchy',
      title: 'Long Weekend Test · waiting to start',
      detail: command.status === 'claimed' ? 'Omarchy claimed the command; waiting for the canonical run projection.' : 'The workstation has not acknowledged this command yet.',
      facts: [['Production authority', 'none']],
      disabled: true,
      button: command.status === 'claimed' ? 'Accepted by Omarchy' : 'Queued — Omarchy offline',
    };
  }
  return {
    eyebrow: command?.status === 'failed' ? 'Last request failed' : 'No autonomous run confirmed',
    title: 'Long Weekend Test',
    detail: command?.error || 'Start the bounded, read-only ALVIRA Proof 0. AgentOS—not ASHWOOD—owns routing, execution, and evidence.',
    facts: [['Scope', 'signed-out baseline'], ['Production authority', 'none']],
    disabled: false,
    button: 'Start Proof 0',
  };
}

function render(data) {
  const view = viewModel(data);
  target.className = `agentos-control freshness-${escapeHtml(data.freshness || 'unconfirmed')}`;
  target.innerHTML = `
    <div class="agentos-heading">
      <div>
        <p class="section-kicker">AgentOS control</p>
        <p class="agentos-state">${escapeHtml(view.eyebrow)}</p>
        <h2>${escapeHtml(view.title)}</h2>
      </div>
      <button class="agentos-start" type="button" ${view.disabled ? 'disabled' : ''}>${escapeHtml(view.button)}</button>
    </div>
    <p class="agentos-detail">${escapeHtml(view.detail)}</p>
    <dl class="agentos-facts">${view.facts.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl>
    <p class="agentos-footnote">Repeated requests return the same canonical run. Queued is not running.</p>`;
  const button = target.querySelector('.agentos-start:not(:disabled)');
  if (button) button.addEventListener('click', start);
}

async function load() {
  try {
    const response = await fetch('/api/workspace-agentos', { credentials: 'same-origin', cache: 'no-store' });
    if (response.status === 401) return false;
    if (!response.ok) throw new Error(`AgentOS control ${response.status}`);
    render(await response.json());
    return true;
  } catch (error) {
    render({ freshness: 'unconfirmed', command: { status: 'failed', error: error.message } });
    return true;
  }
}

async function start(event) {
  const button = event.currentTarget;
  button.disabled = true;
  button.textContent = 'Queueing…';
  try {
    const response = await fetch('/api/workspace-agentos', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start_long_weekend' }),
    });
    if (!response.ok) throw new Error(`Start request ${response.status}`);
    await load();
  } catch (error) {
    render({ freshness: 'unconfirmed', command: { status: 'failed', error: error.message } });
  }
}

async function boot() {
  if (await load()) return;
  let attempts = 0;
  const timer = setInterval(async () => {
    attempts += 1;
    if (await load() || attempts >= 30) clearInterval(timer);
  }, 1500);
}

if (target) boot();
