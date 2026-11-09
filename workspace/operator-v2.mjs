/* ASHWOOD Operator consolidation: read-only canonical board lens.
 * No synthetic runtime, command dispatch, identity inference or extra auth.
 */
const operatorV2 = document.getElementById('operator-v2');
if (operatorV2) {
  const query = selector => operatorV2.querySelector(selector);
  const all = selector => [...operatorV2.querySelectorAll(selector)];
  const authenticated = () => document.body.dataset.workspaceAuth === 'authenticated';
  const state = { perspective: 'team', rows: [], selected: null, snapshot: null, loaded: false, error: '' };
  const phases = ['Wake', 'Check-in', 'Execute', 'Checkpoint', 'Handoff', 'Check-out'];
  const text = (node, value) => { if (node) node.textContent = String(value == null ? '' : value).slice(0, 400); };
  const category = row => {
    const product = String(row?.product || '').toLowerCase().replace(/[\s_-]/g, '');
    return product.includes('agentos') || product.includes('ledgato') ? 'team' : 'build';
  };
  const source = row => String(row?.source || 'canonical board');
  const assignee = row => String(row?.assignee || row?.owner || '').trim();
  const status = row => String(row?.status || row?.phase || 'unknown').replaceAll('_', ' ');
  const stamp = value => {
    const n = Date.parse(value || '');
    return Number.isFinite(n) ? new Date(n).toLocaleString() : 'time unavailable';
  };
  const safeLink = value => {
    try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) ? u.href : null; }
    catch { return null; }
  };
  function element(tag, className, value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value != null) text(node, value);
    return node;
  }
  function setPerspective(value) {
    state.perspective = value === 'build' ? 'build' : 'team';
    for (const button of all('[data-operator-perspective]')) {
      const active = button.dataset.operatorPerspective === state.perspective;
      button.setAttribute('aria-selected', String(active));
      button.classList.toggle('is-active', active);
    }
    for (const panel of all('[data-operator-panel]')) {
      panel.hidden = panel.dataset.operatorPanel !== state.perspective;
    }
    render();
  }
  function renderCard(row) {
    const card = element('article', 'operator-v2__task');
    const head = element('div', 'operator-v2__task-head');
    head.append(element('span', 'operator-v2__label', status(row)));
    head.append(element('span', 'operator-v2__muted', source(row)));
    card.append(head);
    card.append(element('h4', null, row.title || row.summary || 'Untitled canonical work'));
    const detail = [row.assignee ? 'Board assignee: ' + row.assignee : null, row.next_gate ? 'Next: ' + row.next_gate : null].filter(Boolean).join(' · ');
    if (detail) card.append(element('p', 'operator-v2__muted', detail));
    const link = safeLink(row.canonical_url);
    if (link) {
      const a = element('a', 'operator-v2__source', 'Inspect canonical source');
      a.href = link; a.target = '_blank'; a.rel = 'noopener noreferrer';
      card.append(a);
    }
    return card;
  }
  function renderStages(row) {
    const timeline = query('[data-operator-lifecycle]');
    if (!timeline) return;
    timeline.replaceChildren();
    timeline.append(element('p', 'operator-v2__muted',
      row ? 'Task status does not prove a live harness. Stages require individually verified lifecycle receipts.'
          : 'Select a task to inspect its evidence; no verified harness timeline is connected here.'));
    const strip = element('div', 'operator-v2__stages');
    for (const label of phases) {
      const cell = element('div', 'operator-v2__stage');
      cell.append(element('strong', null, label));
      cell.append(element('small', null, 'No verified receipt'));
      strip.append(cell);
    }
    timeline.append(strip);
  }
  function render() {
    const meta = query('[data-operator-v2-status]');
    if (!authenticated()) {
      text(meta, 'Locked · Sign in through the existing ASHWOOD Workspace.');
      for (const host of all('[data-operator-items]')) host.replaceChildren();
      renderStages(null);
      return;
    }
    if (state.error) {
      text(meta, state.error);
    } else if (state.loaded) {
      text(meta, 'Canonical AgentOS board · observed ' + stamp(state.snapshot) +
        ' · snapshot only, not proof of live harnesses');
    } else {
      text(meta, 'Reading the owner-authenticated AgentOS projection…');
    }
    const group = state.rows.filter(row => category(row) === state.perspective).slice(0, 12);
    const host = query('[data-operator-items="' + state.perspective + '"]');
    if (host) {
      host.replaceChildren();
      if (!state.loaded) {
        host.append(element('p', 'operator-v2__empty', state.error || 'Source not connected. No sample tasks are substituted.'));
      } else if (!group.length) {
        host.append(element('p', 'operator-v2__empty', 'No canonical board tasks in this perspective.'));
      } else {
        for (const row of group) host.append(renderCard(row));
      }
    }
    const current = group.find(row => row.task_id === state.selected) || group[0];
    const owners = [...new Set(group.map(assignee).filter(Boolean))].slice(0, 10);
    const roster = query('[data-operator-v2-roster]');
    if (roster) {
      roster.replaceChildren();
      if (state.perspective === 'team') {
        if (!owners.length) roster.append(element('p', 'operator-v2__muted', 'No attributable task owners in the board snapshot.'));
        else for (const name of owners) {
          const chip = element('span', 'operator-v2__roster-chip', name + ' · board assignee');
          roster.append(chip);
        }
      }
    }
    const count = query('[data-operator-v2-count]');
    text(count, state.loaded ? group.length + ' shown' : 'unavailable');
    renderStages(current);
  }
  let pending = false;
  async function load() {
    if (!authenticated() || pending) return;
    pending = true; state.error = ''; render();
    try {
      const response = await fetch('/api/workspace-agentos', {credentials:'same-origin',cache:'no-store'});
      if (!response.ok) throw new Error('AgentOS board read returned ' + response.status);
      const data = await response.json();
      if (!Array.isArray(data?.rows)) throw new Error('Board snapshot has no task list');
      state.rows = data.rows.filter(row => row && typeof row === 'object').slice(0, 100);
      state.snapshot = data.observed_at || data.rows[0]?.observed_at || null;
      state.loaded = true;
    } catch {
      state.rows = []; state.loaded = false;
      state.error = 'Canonical board unavailable. No sample tasks or live sessions are represented.';
    } finally { pending = false; render(); }
  }
  for (const button of all('[data-operator-perspective]')) {
    button.addEventListener('click', () => setPerspective(button.dataset.operatorPerspective));
  }
  query('[data-operator-v2-refresh]')?.addEventListener('click', load);
  query('[data-operator-v2-compose]')?.addEventListener('click', () => {
    const form = document.getElementById('today-command-form');
    form?.scrollIntoView({block:'center',behavior:'smooth'});
    document.getElementById('today-command-input')?.focus({preventScroll:true});
  });
  window.addEventListener('ashwood:workspace-authenticated', load);
  window.addEventListener('ashwood:workspace-locked', () => {
    state.rows = []; state.loaded = false; state.error = ''; render();
  });
  setPerspective('team');
  if (authenticated()) void load();
}
