(() => {
  'use strict';

  const USER = 'tk-ap';
  const STORAGE = {
    evidence: 'ashwood.workspace.manualEvidence.v1',
    overrides: 'ashwood.workspace.goalOverrides.v1'
  };

  const GOALS = [
    {
      id: 'ownership',
      name: 'Build & Own',
      description: 'Build durable products, intellectual property, and ownership rather than optimizing only for income or activity.',
      priority: 1.35,
      repoHints: ['alvira', 'ailhat', 'ledgato', 'agent-os', 'agentfence', 'agent-availability']
    },
    {
      id: 'leadership',
      name: 'Visible Leadership',
      description: 'Become known for a valuable point of view and capability by making the thinking, evidence, and work legible in public.',
      priority: 1.3,
      repoHints: ['tk-ap.github.io', 'ashwood', 'ai-from-zero', 'alvira', 'ailhat']
    },
    {
      id: 'relationships',
      name: 'Relationship Equity',
      description: 'Build with the right people, strengthen collaboration, and create relationships that compound beyond a single transaction.',
      priority: 1.25,
      repoHints: []
    },
    {
      id: 'modeling',
      name: 'Modeling & Presence',
      description: 'Re-establish modeling as an active creative and professional practice with current work, visibility, and collaboration.',
      priority: 1.05,
      repoHints: ['tk-ap.github.io', 'ashwood']
    },
    {
      id: 'music',
      name: 'Music & Creative Return',
      description: 'Keep writing, recording, releasing, and returning to singing and performance as a real creative practice.',
      priority: 1.05,
      repoHints: ['tk-ap.github.io', 'ashwood']
    },
    {
      id: 'writing',
      name: 'Writing & Art',
      description: 'Make essays, poetry, visual work, and field notes visible as part of the broader creative practice.',
      priority: .95,
      repoHints: ['tk-ap.github.io', 'ashwood']
    },
    {
      id: 'learning',
      name: 'Learning & Capability',
      description: 'Deepen agentic, technical, creative, and operating capability while turning learning into reusable systems and teaching.',
      priority: 1.1,
      repoHints: ['agent-os', 'ai-from-zero', 'ailhat', 'alvira']
    }
  ];

  const PRODUCT_ROLES = {
    'ALVIRA': { label: 'ALVIRA', type: 'Context Intelligence', goal: 'ownership' },
    'ailhat': { label: 'ailhat', type: 'Portfolio Intelligence', goal: 'ownership' },
    'ledgato': { label: 'LEDGATo', type: 'Execution Intelligence', goal: 'ownership' },
    'agent-os': { label: 'agent-os', type: 'Workforce infrastructure', goal: 'learning' },
    'tk-ap.github.io': { label: 'ASHWOOD', type: 'Human / creative operating layer', goal: 'leadership' },
    'alvira-bridge': { label: 'ALVIRA Bridge', type: 'ALVIRA feature infrastructure', goal: 'ownership' }
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const now = () => new Date();
  const DAY = 86400000;

  const state = {
    repos: [],
    evidence: [],
    manual: loadJson(STORAGE.evidence, []),
    overrides: loadJson(STORAGE.overrides, {}),
    filter: 'all',
    lastRefresh: null,
    error: null
  };

  function loadJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  }

  function saveJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function daysSince(date) {
    const time = new Date(date).getTime();
    if (!Number.isFinite(time)) return 999;
    return Math.max(0, Math.floor((Date.now() - time) / DAY));
  }

  function shortDate(date) {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return 'Unknown';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function relativeDate(date) {
    const days = daysSince(date);
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 14) return `${days}d ago`;
    return shortDate(date);
  }

  function isEcosystemRepo(repo) {
    if (PRODUCT_ROLES[repo.name]) return true;
    const haystack = `${repo.name} ${repo.description || ''} ${(repo.topics || []).join(' ')}`.toLowerCase();
    return ['alvira', 'ailhat', 'ledgato', 'agent workforce', 'portfolio intelligence', 'context intelligence'].some(token => haystack.includes(token));
  }

  function goalForRepo(repoName) {
    if (PRODUCT_ROLES[repoName]?.goal) return PRODUCT_ROLES[repoName].goal;
    const lower = repoName.toLowerCase();
    const match = GOALS.find(goal => goal.repoHints.some(hint => lower.includes(hint.toLowerCase())));
    return match?.id || 'ownership';
  }

  function inferSecondaryGoals(repoName, message) {
    const text = `${repoName} ${message}`.toLowerCase();
    const goals = [];
    if (/docs|essay|dispatch|newsletter|field notes|poetry|writing/.test(text)) goals.push('writing');
    if (/music|audio|song|record|track|sing/.test(text)) goals.push('music');
    if (/portfolio|model|campaign|barely|digitals|casting/.test(text)) goals.push('modeling');
    if (/learn|curriculum|reference|ai-from-zero|skill|agent-os/.test(text)) goals.push('learning');
    if (/about|journal|build|publish|launch|site|workspace/.test(text)) goals.push('leadership');
    return [...new Set(goals)];
  }

  function evidenceWeight(item) {
    const age = daysSince(item.date);
    const freshness = age <= 2 ? 1 : age <= 7 ? .82 : age <= 14 ? .58 : age <= 30 ? .32 : .08;
    const status = item.status === 'COMPLETED' ? 1.15 : item.status === 'PLANNED' ? .25 : .8;
    return freshness * status;
  }

  async function github(path) {
    const response = await fetch(`https://api.github.com${path}`, {
      headers: { Accept: 'application/vnd.github+json' }
    });
    if (!response.ok) throw new Error(`GitHub ${response.status}`);
    return response.json();
  }

  async function refreshEvidence() {
    setLoading(true);
    state.error = null;
    try {
      const allRepos = await github(`/users/${USER}/repos?per_page=100&sort=updated&type=owner`);
      state.repos = allRepos.filter(repo => !repo.archived && isEcosystemRepo(repo));

      const commitSets = await Promise.all(state.repos.slice(0, 12).map(async repo => {
        try {
          const commits = await github(`/repos/${USER}/${encodeURIComponent(repo.name)}/commits?per_page=6`);
          return commits.map(commit => ({ repo, commit }));
        } catch {
          return [];
        }
      }));

      state.evidence = commitSets.flat().map(({ repo, commit }) => {
        const id = `gh:${repo.name}:${commit.sha}`;
        const message = String(commit.commit?.message || 'Repository update').split('\n')[0];
        const inferred = goalForRepo(repo.name);
        return {
          id,
          source: 'github',
          sourceLabel: repo.name,
          title: message,
          date: commit.commit?.author?.date || repo.pushed_at,
          status: 'IN_PROGRESS',
          goal: state.overrides[id] || inferred,
          inferredGoal: inferred,
          secondaryGoals: inferSecondaryGoals(repo.name, message),
          confidence: PRODUCT_ROLES[repo.name] ? .88 : .65,
          url: commit.html_url
        };
      }).filter(item => daysSince(item.date) <= 45);

      state.lastRefresh = now();
    } catch (error) {
      state.error = error.message || 'Evidence refresh failed';
    }
    render();
    setLoading(false);
  }

  function allEvidence() {
    const manual = state.manual.map(item => ({ ...item, source: 'manual', confidence: 1 }));
    return [...manual, ...state.evidence].sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  function goalStats(goal) {
    const evidence = allEvidence().filter(item => item.goal === goal.id || item.secondaryGoals?.includes(goal.id));
    const recent = evidence.filter(item => daysSince(item.date) <= 30);
    const weighted = recent.reduce((sum, item) => sum + evidenceWeight(item) * (item.goal === goal.id ? 1 : .35), 0);
    const momentum = Math.min(100, Math.round(weighted * 22));
    const newest = evidence[0]?.date || null;
    let status = 'IN_PROGRESS';
    if (!newest || daysSince(newest) > 30) status = 'STALE';
    else if (daysSince(newest) > 14 || momentum < 18) status = 'NEEDS_ATTENTION';
    if (recent.some(item => item.source === 'manual' && item.status === 'COMPLETED' && item.goal === goal.id) && momentum >= 65) status = 'IN_PROGRESS';
    return { evidence, recent, momentum, newest, status };
  }

  function productView(repo) {
    const role = PRODUCT_ROLES[repo.name];
    const freshDays = daysSince(repo.pushed_at);
    return {
      name: role?.label || repo.name,
      type: role?.type || 'Discovered ecosystem repository',
      state: freshDays <= 7 ? 'ACTIVE' : freshDays <= 21 ? 'QUIET' : 'STALE',
      pushedAt: repo.pushed_at,
      url: repo.html_url,
      description: repo.description || '',
      repoName: repo.name
    };
  }

  function attentionSignals() {
    const signals = [];
    const stats = GOALS.map(goal => ({ goal, ...goalStats(goal) }));
    stats.filter(s => s.status === 'STALE' || s.status === 'NEEDS_ATTENTION').forEach(s => {
      const automaticBlindSpot = ['relationships', 'music', 'modeling', 'writing'].includes(s.goal.id) && !s.evidence.some(e => e.source === 'manual');
      signals.push({
        kind: automaticBlindSpot ? 'EVIDENCE GAP' : s.status,
        goal: s.goal.name,
        copy: automaticBlindSpot
          ? `Public repository activity cannot reliably measure ${s.goal.name.toLowerCase()}. Treat this as missing evidence, not proof of neglect.`
          : `${s.goal.name} has weak recent evidence relative to its stated priority.`
      });
    });

    const activeRepos14 = state.repos.filter(repo => daysSince(repo.pushed_at) <= 14);
    if (activeRepos14.length >= 6) {
      signals.unshift({
        kind: 'FOCUS CHECK',
        goal: 'Visible Leadership',
        copy: `${activeRepos14.length} ecosystem repositories show activity in the last 14 days. That breadth may be useful, but it is enough to check whether the public narrative is becoming fragmented.`
      });
    }

    if (!signals.length) signals.push({ kind: 'CLEAR', goal: 'Workspace', copy: 'No strong neglect or contradiction signal is supported by the evidence currently available.' });
    return signals.slice(0, 6);
  }

  function nextAction() {
    const ranked = GOALS.map(goal => ({ goal, ...goalStats(goal) }))
      .sort((a, b) => (a.momentum / a.goal.priority) - (b.momentum / b.goal.priority));
    const target = ranked[0];
    const evidenceBlindSpot = ['relationships', 'music', 'modeling', 'writing'].includes(target.goal.id) && !target.evidence.some(e => e.source === 'manual');
    if (evidenceBlindSpot) {
      return {
        goal: target.goal.name,
        copy: `Connect or add one concrete piece of evidence for ${target.goal.name.toLowerCase()} before treating the quiet signal as neglect.`,
        reason: 'The current adapter sees public GitHub activity well, but this goal mostly happens outside repositories. The highest-value move is improving the evidence model rather than manufacturing a task from missing data.'
      };
    }
    return {
      goal: target.goal.name,
      copy: `Review the next active bet that materially advances ${target.goal.name.toLowerCase()}, and deprioritize work that does not connect to a stated goal.`,
      reason: `This bucket currently has the weakest evidence-weighted momentum relative to its stated priority (${target.momentum}/100 momentum signal).`
    };
  }

  function renderPulse() {
    const evidence = allEvidence();
    const last7 = evidence.filter(item => daysSince(item.date) <= 7);
    const movedGoals = new Set(last7.flatMap(item => [item.goal, ...(item.secondaryGoals || [])])).size;
    const activeProducts = state.repos.filter(repo => daysSince(repo.pushed_at) <= 14).length;
    const needsAttention = GOALS.filter(goal => ['STALE', 'NEEDS_ATTENTION'].includes(goalStats(goal).status)).length;
    const manual = state.manual.filter(item => daysSince(item.date) <= 30).length;
    $('#pulse-grid').innerHTML = [
      [movedGoals, 'goals moved · 7d'],
      [activeProducts, 'active ecosystem repos · 14d'],
      [needsAttention, 'buckets needing review'],
      [manual, 'non-code evidence · 30d']
    ].map(([number, label]) => `<article class="pulse-card"><div class="pulse-number">${number}</div><div class="pulse-label">${label}</div></article>`).join('');
  }

  function renderGoals() {
    $('#goal-grid').innerHTML = GOALS.map(goal => {
      const stats = goalStats(goal);
      return `<article class="goal-card ${stats.status === 'NEEDS_ATTENTION' || stats.status === 'STALE' ? 'is-attention' : ''}">
        <div><header><h3>${escapeHtml(goal.name)}</h3><span class="status-pill">${escapeHtml(stats.status.replace('_', ' '))}</span></header>
        <p class="goal-description">${escapeHtml(goal.description)}</p></div>
        <div class="goal-meta"><div><div class="goal-score">${stats.momentum}</div><div class="goal-evidence-count">momentum · ${stats.recent.length} evidence item${stats.recent.length === 1 ? '' : 's'} / 30d</div></div><div class="goal-evidence-count">${stats.newest ? relativeDate(stats.newest) : 'no evidence'}</div><div class="progress-track"><div class="progress-fill" style="width:${stats.momentum}%"></div></div></div>
      </article>`;
    }).join('');
  }

  function renderEcosystem() {
    const products = state.repos.map(productView).sort((a, b) => new Date(b.pushedAt) - new Date(a.pushedAt));
    $('#ecosystem-list').innerHTML = products.length ? products.map(product => `<article class="ecosystem-row">
      <div><a class="ecosystem-name" href="${escapeHtml(product.url)}" target="_blank" rel="noopener">${escapeHtml(product.name)} ↗</a><div class="ecosystem-commit">${escapeHtml(product.description)}</div></div>
      <div class="ecosystem-type">${escapeHtml(product.type)}</div>
      <div class="ecosystem-state">${escapeHtml(product.state)}</div>
      <div class="ecosystem-date">Updated ${escapeHtml(relativeDate(product.pushedAt))}</div>
      <div class="ecosystem-commit">${escapeHtml(product.repoName)}</div>
    </article>`).join('') : '<p class="empty-state">No live public ecosystem repositories were discovered.</p>';
  }

  function renderEvidence() {
    const filtered = allEvidence().filter(item => state.filter === 'all' || item.source === state.filter);
    const options = GOALS.map(goal => `<option value="${goal.id}">${escapeHtml(goal.name)}</option>`).join('');
    $('#evidence-list').innerHTML = filtered.length ? filtered.slice(0, 60).map(item => `<article class="evidence-row" data-source="${item.source}">
      <div class="evidence-date">${escapeHtml(shortDate(item.date))}<br>${escapeHtml(item.status.replace('_',' '))}</div>
      <div class="evidence-title">${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">${escapeHtml(item.title)} ↗</a>` : escapeHtml(item.title)}</div>
      <div class="evidence-goal"><select aria-label="Goal for ${escapeHtml(item.title)}" data-evidence-id="${escapeHtml(item.id)}">${options}</select></div>
      <div class="evidence-source">${escapeHtml(item.sourceLabel || item.source)}</div>
      <div class="evidence-confidence">${Math.round((item.confidence || 0) * 100)}% confidence</div>
    </article>`).join('') : '<p class="empty-state">No evidence matches this filter.</p>';

    $$('#evidence-list select').forEach(select => {
      const item = allEvidence().find(e => e.id === select.dataset.evidenceId);
      if (item) select.value = item.goal;
      select.addEventListener('change', () => updateEvidenceGoal(select.dataset.evidenceId, select.value));
    });
  }

  function updateEvidenceGoal(id, goal) {
    const manualIndex = state.manual.findIndex(item => item.id === id);
    if (manualIndex >= 0) {
      state.manual[manualIndex].goal = goal;
      saveJson(STORAGE.evidence, state.manual);
    } else {
      state.overrides[id] = goal;
      saveJson(STORAGE.overrides, state.overrides);
      const live = state.evidence.find(item => item.id === id);
      if (live) live.goal = goal;
    }
    render();
  }

  function renderAttention() {
    $('#attention-list').innerHTML = attentionSignals().map(signal => `<article class="attention-row"><div class="attention-kind">${escapeHtml(signal.kind)}</div><div class="attention-copy">${escapeHtml(signal.copy)}</div><div class="attention-goal">${escapeHtml(signal.goal)}</div></article>`).join('');
  }

  function renderNextAction() {
    const next = nextAction();
    $('#next-action-card').innerHTML = `<article class="next-action-card"><div class="next-action-goal">${escapeHtml(next.goal)}</div><div><div class="next-action-copy">${escapeHtml(next.copy)}</div><div class="next-action-reason">${escapeHtml(next.reason)}</div></div></article>`;
  }

  function render() {
    $('#as-of').textContent = state.lastRefresh ? `Evidence refreshed ${state.lastRefresh.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Waiting for evidence';
    renderPulse(); renderGoals(); renderEcosystem(); renderEvidence(); renderAttention(); renderNextAction();
    $('#live-state').textContent = state.error ? `Live adapter unavailable · ${state.error}` : state.lastRefresh ? 'Live public evidence connected' : 'Loading evidence…';
  }

  function setLoading(loading) {
    $('#refresh-evidence').disabled = loading;
    $('#refresh-evidence').textContent = loading ? 'Refreshing…' : 'Refresh evidence';
  }

  function setupDialog() {
    const dialog = $('#evidence-dialog');
    const form = $('#evidence-form');
    const goalSelect = $('#evidence-goal-input');
    goalSelect.innerHTML = GOALS.map(goal => `<option value="${goal.id}">${escapeHtml(goal.name)}</option>`).join('');
    $('#evidence-date-input').value = new Date().toISOString().slice(0, 10);
    $('#add-evidence').addEventListener('click', () => dialog.showModal());
    form.addEventListener('submit', event => {
      event.preventDefault();
      const title = $('#evidence-title-input').value.trim();
      if (!title) return;
      state.manual.unshift({
        id: `manual:${Date.now()}`,
        title,
        goal: goalSelect.value,
        status: $('#evidence-status-input').value,
        date: $('#evidence-date-input').value,
        sourceLabel: $('#evidence-source-input').value.trim() || 'manual evidence',
        secondaryGoals: []
      });
      saveJson(STORAGE.evidence, state.manual);
      form.reset();
      $('#evidence-date-input').value = new Date().toISOString().slice(0, 10);
      dialog.close();
      render();
    });
  }

  function setupFilters() {
    $$('.filter').forEach(button => button.addEventListener('click', () => {
      state.filter = button.dataset.filter;
      $$('.filter').forEach(b => b.classList.toggle('is-active', b === button));
      renderEvidence();
    }));
  }

  $('#refresh-evidence').addEventListener('click', refreshEvidence);
  setupDialog();
  setupFilters();
  render();
  refreshEvidence();
})();