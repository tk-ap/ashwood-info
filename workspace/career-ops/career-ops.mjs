import { normaliseStatus, requestedSalaryLabel, salaryLabel, sortApplications, summaryCounts, syncSummary, needsAttention } from './model.mjs';

const $ = selector => document.querySelector(selector);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const fmtDate = value => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' });
};
const fmtDateTime = value => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString(undefined, { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' });
};

const state = {
  applications: [],
  events: [],
  selectedId: null,
  opportunities: [],
  reviewOpportunities: [],
  opportunityCursor: 0,
  opportunityMeta: null,
  inboxSync: null,
  inboxReviews: [],
  opportunityDispositions: [],
  resumeProfile: { configured:false, source:null, updated_at:null },
  newJobsSinceSession: 0,
  gmailSyncInFlight: false,
  gmailPollTimer: null,
  declinedOpportunityIds: new Set(JSON.parse(localStorage.getItem('ashwood.career.declined-opportunities.v1') || '[]'))
};

async function api(options={}) {
  const response = await fetch('/api/workspace-career', {
    credentials:'same-origin',
    headers:{ 'Content-Type':'application/json', ...(options.headers || {}) },
    ...options
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return body;
}

async function gmailSyncApi() {
  const response = await fetch('/api/workspace-career-gmail-sync', {
    method:'POST',
    credentials:'same-origin',
    headers:{ 'Content-Type':'application/json' }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || `Sync failed (${response.status})`);
    error.code = body.code;
    error.body = body;
    throw error;
  }
  return body;
}

async function opportunityApi({ cursor=0, refresh=false }={}) {
  const query = new URLSearchParams({ cursor:String(cursor) });
  if (refresh) query.set('refresh', '1');
  const response = await fetch(`/api/workspace-career?view=opportunities&${query.toString()}`, {
    credentials:'same-origin',
    headers:{ 'Accept':'application/json' }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return body;
}

function opportunitySourceKey(opportunity={}) {
  return String(opportunity.source || 'unknown').trim().toLowerCase().replace(/\s+/g,'-');
}

function opportunityStorageKey(opportunity={}) {
  return `${opportunitySourceKey(opportunity)}:${String(opportunity.id || '')}`;
}

function workArrangementLabel(opportunity={}) {
  const tier = String(opportunity.work_arrangement_preference || '').toLowerCase();
  if (tier === 'remote') return 'Remote';
  if (tier === 'hybrid') return 'Hybrid';
  if (tier === 'onsite') return 'On-site';
  const evidence = `${opportunity.job_type || ''} ${opportunity.location || ''}`;
  if (/hybrid/i.test(evidence)) return 'Hybrid';
  if (/remote/i.test(evidence)) return 'Remote';
  if (/on[- ]?site|onsite|in[- ]office/i.test(evidence)) return 'On-site';
  return '';
}

function salaryBounds(label='') {
  const values = [...String(label).matchAll(/(?:\$|USD\s*)?([\d,.]+(?:\.\d+)?)\s*([kKmM]?)/g)]
    .map(match => {
      let value = Number(String(match[1]).replaceAll(',', ''));
      if (!Number.isFinite(value)) return null;
      if (/k/i.test(match[2] || '')) value *= 1000;
      if (/m/i.test(match[2] || '')) value *= 1000000;
      return Math.round(value);
    })
    .filter(value => Number.isFinite(value) && value >= 1000);
  return {
    min:values[0] || null,
    max:values[1] || values[0] || null
  };
}

function isLocallyDeclined(opportunity={}) {
  const id = String(opportunity.id || '');
  return state.declinedOpportunityIds.has(opportunityStorageKey(opportunity)) || state.declinedOpportunityIds.has(id);
}

async function persistOpportunityDecline(opportunity, reason=null) {
  const source = opportunitySourceKey(opportunity);
  const id = String(opportunity.id || '');
  if (!id) throw new Error('Opportunity ID is required');
  await api({
    method:'POST',
    body:JSON.stringify({
      action:'decline_opportunity',
      source,
      opportunity_id:id,
      company:opportunity.company,
      role:opportunity.role,
      url:opportunity.url,
      reason
    })
  });
  return { source, id };
}

function statusClass(status) {
  return normaliseStatus(status).toLowerCase();
}

function eventsFor(applicationId) {
  return state.events.filter(event => event.application_id === applicationId);
}

function silentRejectionFor(applicationId) {
  return eventsFor(applicationId)
    .filter(event => event.source === 'gmail' && event.payload?.silent_rejection_policy?.detected)
    .sort((a,b) => new Date(b.occurred_at || 0) - new Date(a.occurred_at || 0))[0]?.payload?.silent_rejection_policy || null;
}

function snapshotList(snapshot, key) {
  const values = Array.isArray(snapshot?.[key]) ? snapshot[key] : [];
  if (!values.length) return '';
  return `<div class="career-detail-block"><h4>${escapeHtml(key.replaceAll('_',' '))}</h4><ul>${values.map(value => `<li>${escapeHtml(value)}</li>`).join('')}</ul></div>`;
}

function materialChips(materials={}) {
  const items = [];
  if (materials.resume && typeof materials.resume === 'object') {
    items.push(`Résumé: ${materials.resume.filename || materials.resume.variant || 'tailored artifact'}`);
  } else if (materials.resume) {
    items.push(`Résumé: ${materials.resume}`);
  } else if (materials.resume_variant) {
    items.push(`Résumé lane: ${materials.resume_variant}`);
  }
  if (materials.projects) items.push(`Projects: ${Array.isArray(materials.projects) ? materials.projects.join(', ') : materials.projects}`);
  if (materials.work_sample) items.push(`Work sample: ${materials.work_sample}`);
  if (materials.self_intro) items.push('Self-introduction submitted');
  return items;
}

function renderHeader() {
  const counts = summaryCounts(state.applications, state.events);
  const denominator = counts.submitted || 0;
  const ratio = numerator => `${numerator} / ${denominator}`;
  const cards = [
    [counts.submitted, 'applications submitted'],
    [ratio(counts.denied), 'rejected / submitted'],
    [ratio(counts.noResponse), 'no response / submitted'],
    [ratio(counts.interviews), 'interview requests / submitted'],
    [state.newJobsSinceSession, 'recommended jobs found']
  ];
  const markup = cards.map(([value,label]) => `<article><strong>${value}</strong><span>${label}</span></article>`).join('');
  $('#career-summary').innerHTML = markup;
  const hero = $('#workspace-view-data-hero');
  if (hero) hero.innerHTML = '<p class="section-kicker">Work · live career state · relationships below</p><div class="workspace-data-hero-grid">' + markup + '</div>';
}

function renderToday() {
  const root = $('#career-today');
  if (!root) return;
  const actions = sortApplications(state.applications)
    .filter(app => needsAttention(app))
    .map(app => ({
      kind:normaliseStatus(app.status),
      title:`${app.company} — ${app.role}`,
      detail:app.next_action || 'Review this application and set the next action.',
      due:app.next_action_at ? fmtDateTime(app.next_action_at) : null,
      appId:app.id
    }));

  const reviewOpen = Number(state.inboxSync?.reviewOpen || state.inboxReviews.length || 0);
  if (reviewOpen) actions.unshift({
    kind:'INBOX',
    title:`${reviewOpen} application email${reviewOpen === 1 ? '' : 's'} need review`,
    detail:'Resolve unmatched or ambiguous email evidence before relying on the pipeline.',
    due:null
  });
  if (actions.length < 5 && state.opportunities.length) actions.push({
    kind:'APPLY NEXT',
    title:'Review the next recommended role',
    detail:`${state.opportunities[0].company} — ${state.opportunities[0].role}`,
    due:null
  });

  root.innerHTML = actions.length ? actions.slice(0,7).map(item => `
    <button class="career-today-row" type="button" ${item.appId ? `data-today-app="${escapeHtml(item.appId)}"` : ''}>
      <span>${escapeHtml(item.kind)}</span>
      <strong>${escapeHtml(item.title)}</strong>
      <small>${escapeHtml(item.detail)}${item.due ? ` · ${escapeHtml(item.due)}` : ''}</small>
    </button>`).join('') :
    '<div class="career-empty"><strong>No urgent application action is currently due.</strong><p>Use Recommended to keep the pipeline moving rather than treating an empty task list as completion.</p></div>';

  root.querySelectorAll('[data-today-app]').forEach(button => button.addEventListener('click', () => {
    state.selectedId = button.dataset.todayApp;
    renderApplications();
    renderDetail();
    $('#career-applications')?.scrollIntoView({ behavior:'smooth', block:'start' });
  }));
}

function renderHistoryPreferences() {
  const root = $('#career-history-preferences');
  if (!root) return;
  const dispositions = state.opportunityDispositions.filter(item => item.disposition === 'DECLINED');
  const recentEvents = state.events.slice(0,5);
  root.innerHTML = `
    <div class="career-preference-card">
      <span>Recommendation learning</span>
      <strong>${dispositions.length} declined recommendation${dispositions.length === 1 ? '' : 's'} persisted</strong>
      <p>Declines are durable preference evidence. Engineering and technical roles are excluded unless the title belongs to a demonstrated target lane.</p>
    </div>
    <div class="career-history-list">
      ${recentEvents.length ? recentEvents.map(event => `<article><time>${escapeHtml(fmtDateTime(event.occurred_at))}</time><strong>${escapeHtml(event.summary)}</strong><span>${escapeHtml(event.source || 'manual')} · ${escapeHtml(event.event_type || 'NOTE')}</span></article>`).join('') : '<p class="career-muted">No career history recorded yet.</p>'}
    </div>`;
}

function renderApplications() {
  const root = $('#career-applications');
  const apps = sortApplications(state.applications);
  if (!apps.length) {
    root.innerHTML = `<div class="career-empty"><strong>No applications recorded yet.</strong><p>Add the first one here. Career data is stored in the private workspace database, not in this public repository.</p></div>`;
    return;
  }

  root.innerHTML = apps.map(app => {
    const attention = needsAttention(app);
    const requested = requestedSalaryLabel(app);
    const eventCount = eventsFor(app.id).length;
    const silentPolicy = silentRejectionFor(app.id);
    const silentNote = silentPolicy?.deadline ? ` · silent-close ${fmtDate(silentPolicy.deadline)}` : '';
    return `<button class="career-row ${state.selectedId === app.id ? 'is-selected' : ''}" type="button" data-app-id="${escapeHtml(app.id)}">
      <span class="career-row-main">
        <span class="career-company">${escapeHtml(app.company)}</span>
        <strong>${escapeHtml(app.role)}</strong>
        <span>${[app.job_id ? `Req ${app.job_id}` : null, app.location, app.work_arrangement].filter(Boolean).map(escapeHtml).join(' · ')}</span>
      </span>
      <span class="career-row-comp">${escapeHtml(salaryLabel(app))}${requested ? `<small>asked ${escapeHtml(requested)}</small>` : ''}</span>
      <span class="career-status ${statusClass(app.status)}">${escapeHtml(normaliseStatus(app.status))}</span>
      <span class="career-row-meta">${attention ? '<b>action due</b>' : `${eventCount} event${eventCount === 1 ? '' : 's'}${escapeHtml(silentNote)}`}</span>
    </button>`;
  }).join('');

  root.querySelectorAll('[data-app-id]').forEach(button => button.addEventListener('click', () => {
    state.selectedId = button.dataset.appId;
    renderApplications();
    renderDetail();
  }));
}

function renderDetail() {
  const root = $('#career-detail');
  const app = state.applications.find(item => item.id === state.selectedId);
  if (!app) {
    root.innerHTML = `<div class="career-detail-empty"><p>Select an application to see the preserved posting, submitted materials, next action, and message history.</p></div>`;
    return;
  }

  const snapshot = app.posting_snapshot || {};
  const materials = app.materials || {};
  const chips = materialChips(materials);
  const events = eventsFor(app.id);
  const silentPolicy = silentRejectionFor(app.id);

  root.innerHTML = `
    <div class="career-detail-head">
      <div>
        <p class="section-kicker">Application record</p>
        <h2>${escapeHtml(app.company)} · ${escapeHtml(app.role)}</h2>
        <p>${[app.job_id ? `Req ${app.job_id}` : null, app.location, app.work_arrangement].filter(Boolean).map(escapeHtml).join(' · ')}</p>
      </div>
      <div class="career-detail-actions">
        ${app.posting_url ? `<a href="${escapeHtml(app.posting_url)}" target="_blank" rel="noopener">Open posting ↗</a>` : ''}
        <button type="button" id="career-edit">Edit</button>
      </div>
    </div>
    <div class="career-detail-grid">
      <article><span>Status</span><strong>${escapeHtml(normaliseStatus(app.status))}</strong></article>
      <article><span>Posted compensation</span><strong>${escapeHtml(salaryLabel(app))}</strong></article>
      <article><span>Requested salary</span><strong>${escapeHtml(requestedSalaryLabel(app) || '—')}</strong></article>
      <article><span>Submitted</span><strong>${escapeHtml(fmtDate(app.submitted_at))}</strong></article>
    </div>
    ${silentPolicy?.deadline ? `<div class="career-note"><span>Silent rejection policy detected</span><p>Employer confirmation says unsuccessful applicants may not receive a rejection notice. If no meaningful employer response arrives by ${escapeHtml(fmtDate(silentPolicy.deadline))}, Career Ops will mark this <b>ASSUMED_REJECTED</b>. This remains distinguishable from an explicit rejection.</p></div>` : ''}
    ${app.next_action ? `<div class="career-next"><span>Next action</span><strong>${escapeHtml(app.next_action)}</strong><small>${app.next_action_at ? `Due ${escapeHtml(fmtDateTime(app.next_action_at))}` : 'No due date set'}</small></div>` : ''}
    ${app.fit_decision ? `<div class="career-note"><span>Fit decision</span><p>${escapeHtml(app.fit_decision)}</p></div>` : ''}
    ${chips.length ? `<div class="career-materials"><span>Submitted materials</span><div>${chips.map(chip => `<b>${escapeHtml(chip)}</b>`).join('')}</div></div>` : ''}
    <div class="career-snapshot">
      <div class="career-section-title"><span>Posting snapshot</span><small>Preserved for interview prep even if the listing disappears.</small></div>
      ${snapshot.summary ? `<p>${escapeHtml(snapshot.summary)}</p>` : ''}
      ${snapshotList(snapshot, 'responsibilities')}
      ${snapshotList(snapshot, 'requirements')}
      ${snapshotList(snapshot, 'preferred')}
      ${snapshot.interview_notes ? `<div class="career-detail-block"><h4>Interview notes</h4><p>${escapeHtml(snapshot.interview_notes)}</p></div>` : ''}
      ${!snapshot.summary && !snapshot.responsibilities?.length && !snapshot.requirements?.length && !snapshot.preferred?.length ? '<p class="career-muted">No posting details have been captured yet.</p>' : ''}
    </div>
    <div class="career-timeline">
      <div class="career-section-title"><span>Timeline</span><small>Email-driven status events appear here as Career Ops reconciles the inbox.</small></div>
      ${events.length ? events.map(event => `<article><time>${escapeHtml(fmtDateTime(event.occurred_at))}</time><div><strong>${escapeHtml(event.summary)}</strong><span>${escapeHtml(event.source || 'manual')} · ${escapeHtml(event.event_type || 'NOTE')}</span></div></article>`).join('') : '<p class="career-muted">No events yet.</p>'}
    </div>`;

  $('#career-edit')?.addEventListener('click', () => openApplicationDialog(app));
}

function syncSummaryMarkup(sync) {
  const summary = syncSummary(sync);
  const items = summary.items.map(item => `<small><b>${escapeHtml(item.title)}</b><br>${escapeHtml(item.outcome)} → <b>${escapeHtml(item.status)}</b><br>Tracker updated.</small>`).join('');
  const review = summary.review ? `<small>${escapeHtml(summary.review)}</small>` : '';
  return `<strong>Inbox synced successfully</strong><span>${escapeHtml(summary.headline)} · ${escapeHtml(fmtDateTime(sync.syncedAt))}</span>${items}${review}`;
}

function renderSyncState() {
  const gmailEvents = state.events.filter(event => event.source === 'gmail');
  const node = $('#career-sync-state');
  if (state.inboxSync?.status === 'success') {
    node.innerHTML = syncSummaryMarkup(state.inboxSync);
    return;
  }
  if (state.inboxSync?.status === 'error') {
    const failures = (state.inboxSync.failures || []).map(item => `<small>${escapeHtml(`${item.company} — ${item.role}: ${item.from} → ${item.to} could not be verified. Tracker shows ${item.observed || 'unknown'}.`)}</small>`).join('');
    node.innerHTML = `<strong>Inbox sync unavailable</strong><span>${escapeHtml(state.inboxSync.message || 'Career Gmail sync failed')}</span>${failures}`;
    return;
  }
  if (gmailEvents.length) {
    const latest = gmailEvents[0];
    node.innerHTML = `<strong>Gmail monitoring active</strong><span>${gmailEvents.length} tracked message event${gmailEvents.length === 1 ? '' : 's'} · latest ${escapeHtml(fmtDateTime(latest.occurred_at))}</span>`;
  } else {
    node.innerHTML = `<strong>Gmail monitoring connected</strong><span>Live inbox sync checks about once a minute while this page is open. Refresh remains available for an immediate check.</span>`;
  }
}


async function importResumeProfileFile(file, statusNode=null) {
  if (!file) return;
  if (!/\.json$/i.test(file.name || '')) throw new Error('Choose the Career resume profile .json file.');
  const text = await file.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Resume profile file is not valid JSON.');
  }
  const profile = parsed?.profile || parsed;
  const source = String(parsed?.source || file.name || 'workspace-import').slice(0,80);
  if (!profile?.identity?.name || !Array.isArray(profile?.experience) || !profile.experience.length) {
    throw new Error('Resume profile is missing identity or experience data.');
  }
  if (statusNode) statusNode.textContent = 'Saving private baseline…';
  await api({
    method:'POST',
    body:JSON.stringify({ action:'set_resume_profile', profile, source })
  });
  state.resumeProfile = { configured:true, source, updated_at:new Date().toISOString() };
  if (statusNode) statusNode.textContent = 'Baseline saved. Resume generation is ready.';
  renderOpportunities();
}

function resumeProfileSetupMarkup() {
  if (state.resumeProfile?.configured) return '';
  return `
    <div class="career-resume-setup" data-resume-setup>
      <div>
        <span>One-time resume setup</span>
        <strong>Import the private baseline profile</strong>
        <p>Drop the normalized Career resume JSON here once. It is saved to the private Workspace database and is not committed to the public repository.</p>
        <small data-resume-import-status>Required before Career can generate application-ready .docx files.</small>
      </div>
      <label>
        Import baseline resume
        <input type="file" accept=".json,application/json" data-resume-profile-file>
      </label>
    </div>`;
}

function wireResumeProfileImport(root) {
  const setup = root.querySelector('[data-resume-setup]');
  const input = root.querySelector('[data-resume-profile-file]');
  if (!setup || !input) return;
  const status = setup.querySelector('[data-resume-import-status]');
  const run = async file => {
    try {
      setup.classList.add('is-working');
      await importResumeProfileFile(file, status);
    } catch (error) {
      if (status) status.textContent = error.message;
    } finally {
      setup.classList.remove('is-working');
    }
  };
  input.addEventListener('change', () => run(input.files?.[0]));
  setup.addEventListener('dragover', event => {
    event.preventDefault();
    setup.classList.add('is-dragging');
  });
  setup.addEventListener('dragleave', () => setup.classList.remove('is-dragging'));
  setup.addEventListener('drop', event => {
    event.preventDefault();
    setup.classList.remove('is-dragging');
    run(event.dataTransfer?.files?.[0]);
  });
}

function resumeArtifactMarkup(opportunity={}) {
  const recommendation = opportunity.resume_recommendation || {};
  if (!recommendation.variant) return '';
  const profileReady = Boolean(state.resumeProfile?.configured);
  const requirementsReady = String(opportunity.requirements_status || 'unknown') === 'qualified';
  const canGenerate = profileReady && requirementsReady;
  return `
    <div class="career-resume-artifact">
      <div>
        <span>Tailored résumé</span>
        <strong>${escapeHtml(recommendation.variant)}</strong>
        <small>${!profileReady ? 'Private baseline resume needs to be configured once before file generation.' : !requirementsReady ? 'Review the employer requirements before generating an application-ready résumé.' : 'Built from your verified Career profile; factual history stays locked.'}</small>
      </div>
      <button type="button" data-generate-resume="${escapeHtml(opportunity.id)}" ${canGenerate ? '' : 'disabled'}>
        ${!profileReady ? 'Resume source missing' : !requirementsReady ? 'Review requirements first' : 'Generate résumé (.docx)'}
      </button>
      <details>
        <summary>View tailoring details</summary>
        ${recommendation.summary ? `<p><b>Summary:</b> ${escapeHtml(recommendation.summary)}</p>` : ''}
        ${Array.isArray(recommendation.emphasis) && recommendation.emphasis.length ? `<ul>${recommendation.emphasis.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
        ${recommendation.guardrail ? `<small>${escapeHtml(recommendation.guardrail)}</small>` : ''}
      </details>
    </div>`;
}

function filenameFromDisposition(value='') {
  const match=String(value).match(/filename="([^"]+)"/i);
  return match?.[1] || 'TK_Tailored_Resume.docx';
}

async function generateResumeArtifact(opportunity, button) {
  const original = button.textContent;
  button.disabled = true;
  button.textContent = 'Generating…';
  try {
    const response = await fetch('/api/workspace-career?view=resume', {
      method:'POST',
      credentials:'same-origin',
      headers:{ 'Content-Type':'application/json' },
      body:JSON.stringify({
        source:String(opportunity.source || 'remotive').toLowerCase(),
        opportunity_id:String(opportunity.id || '')
      })
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Resume generation failed (${response.status})`);
    }
    const blob = await response.blob();
    const filename = filenameFromDisposition(response.headers.get('Content-Disposition'));
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(href);
    button.textContent = 'Downloaded';
  } catch (error) {
    button.disabled = false;
    button.textContent = 'Try again';
    button.title = error.message;
    return;
  }
  window.setTimeout(() => {
    button.disabled = false;
    button.textContent = original;
  }, 1400);
}


function decisionDimensionsMarkup(opportunity={}) {
  const eligibilityLabels = { eligible:'Eligible', review:'Needs requirement review', excluded:'Not eligible' };
  const fitLabels = { strong:'Strong fit', credible:'Credible fit', stretch:'Stretch', weak:'Weak fit' };
  const practicalityLabels = { strong:'Highly practical', practical:'Practical', friction:'Practicality friction', poor:'Poor practical fit' };
  const requirementDetail = opportunity.eligibility_reason === 'requirements_low_confidence'
    ? 'No conflict was detected, but the available posting text is too thin to call eligibility verified.'
    : Array.isArray(opportunity.requirements_checked) && opportunity.requirements_checked.length
      ? opportunity.requirements_checked[0]
      : opportunity.eligibility_status === 'eligible'
        ? 'No conflicting hard requirement was detected in the available posting.'
        : 'The full employer requirements need review before applying.';
  const practicalDetail = [
    ...(opportunity.practicality_positives || []).slice(0,2),
    ...(opportunity.practicality_frictions || []).slice(0,2)
  ].join(' · ') || 'Practicality evidence is incomplete.';
  return '<div class="career-decision-dimensions">' +
    '<article data-dimension-status="' + escapeHtml(opportunity.eligibility_status || 'review') + '">' +
      '<span>Eligibility</span><strong>' + escapeHtml(eligibilityLabels[opportunity.eligibility_status] || eligibilityLabels.review) + '</strong><small>' + escapeHtml(requirementDetail) + '</small></article>' +
    '<article data-dimension-status="' + escapeHtml(opportunity.fit_status || 'weak') + '">' +
      '<span>Fit</span><strong>' + escapeHtml(fitLabels[opportunity.fit_status] || fitLabels.weak) + '</strong><small>' + escapeHtml(opportunity.fit_summary || 'Fit evidence is incomplete.') + '</small></article>' +
    '<article data-dimension-status="' + escapeHtml(opportunity.practicality_status || 'poor') + '">' +
      '<span>Practicality</span><strong>' + escapeHtml(practicalityLabels[opportunity.practicality_status] || practicalityLabels.poor) + '</strong><small>' + escapeHtml(practicalDetail) + '</small></article>' +
    '</div>';
}

function opportunityCardMarkup(opportunity={}, options={}) {
  const review = Boolean(options.review);
  const actions = review
    ? '<a href="' + escapeHtml(opportunity.url) + '" target="_blank" rel="noopener">Review employer requirements ↗</a>'
    : '<button type="button" data-apply-opportunity="' + escapeHtml(opportunity.id) + '">Apply ↗</button>' +
      '<button type="button" data-track-opportunity="' + escapeHtml(opportunity.id) + '">Track target</button>';
  return '<article class="career-opportunity-card ' + (review ? 'is-review' : 'is-recommended') + '">' +
    '<div class="career-opportunity-topline"><span>' + escapeHtml(opportunity.company) + '</span><time>' + escapeHtml(fmtDate(opportunity.published_at)) + '</time></div>' +
    '<h3>' + escapeHtml(opportunity.role) + '</h3>' +
    '<p class="career-opportunity-location">' + escapeHtml([opportunity.location || 'Remote', opportunity.job_type].filter(Boolean).join(' · ')) + '</p>' +
    (opportunity.salary ? '<p class="career-opportunity-salary">' + escapeHtml(opportunity.salary) + '</p>' : '') +
    '<p class="career-opportunity-summary">' + escapeHtml(opportunity.summary || '') + '</p>' +
    decisionDimensionsMarkup(opportunity) +
    (review ? '' : resumeArtifactMarkup(opportunity)) +
    '<div class="career-opportunity-actions">' + actions +
      '<button type="button" data-decline-opportunity="' + escapeHtml(opportunity.id) + '">Decline</button></div>' +
    '<small>Source: <a href="' + escapeHtml(opportunity.source_url || opportunity.url) + '" target="_blank" rel="noopener">' + escapeHtml(opportunity.source || 'job feed') + '</a></small>' +
    '</article>';
}

function allVisibleOpportunityChoices() {
  return [...state.opportunities, ...state.reviewOpportunities];
}

function wireOpportunityActions(root) {
  root.querySelectorAll('[data-generate-resume]').forEach(button => button.addEventListener('click', async () => {
    const opportunity = allVisibleOpportunityChoices().find(item => String(item.id) === String(button.dataset.generateResume || ''));
    if (!opportunity) return;
    await generateResumeArtifact(opportunity, button);
  }));

  root.querySelectorAll('[data-decline-opportunity]').forEach(button => button.addEventListener('click', async () => {
    const id = String(button.dataset.declineOpportunity || '');
    const opportunity = allVisibleOpportunityChoices().find(item => String(item.id) === id);
    if (!id || !opportunity) return;
    button.disabled = true;
    button.textContent = 'Declining…';
    try {
      const declineReason = opportunity.eligibility_status === 'review'
        ? 'owner_declined_after_requirements_review:' + ((opportunity.requirements_reasons || [])[0] || opportunity.eligibility_reason || 'unspecified')
        : 'owner_declined';
      const { source } = await persistOpportunityDecline(opportunity, declineReason);
      state.declinedOpportunityIds.add(opportunityStorageKey(opportunity));
      state.declinedOpportunityIds.delete(id);
      localStorage.setItem('ashwood.career.declined-opportunities.v1', JSON.stringify([...state.declinedOpportunityIds]));
      state.opportunityDispositions.unshift({ source, opportunity_id:id, company:opportunity.company, role:opportunity.role, url:opportunity.url, disposition:'DECLINED', reason:declineReason, updated_at:new Date().toISOString() });
      state.opportunities = state.opportunities.filter(item => String(item.id) !== id);
      state.reviewOpportunities = state.reviewOpportunities.filter(item => String(item.id) !== id);
      renderOpportunities();
      renderHistoryPreferences();
      await loadOpportunities();
    } catch (error) {
      button.disabled = false;
      button.textContent = 'Decline';
      $('#career-opportunity-meta').textContent = 'Decline was not saved: ' + error.message;
    }
  }));

  root.querySelectorAll('[data-apply-opportunity]').forEach(button => button.addEventListener('click', async () => {
    const opportunity = state.opportunities.find(item => String(item.id) === button.dataset.applyOpportunity);
    if (!opportunity) return;
    const applicationTab = window.open('about:blank', '_blank');
    if (applicationTab) applicationTab.opener = null;
    const tracked = await trackOpportunity(opportunity, button, { reload:false, nextAction:'Complete the employer application; Gmail confirmation will update this record automatically.' });
    if (!tracked) {
      applicationTab?.close();
      return;
    }
    if (applicationTab) applicationTab.location.replace(opportunity.url);
    else window.location.href = opportunity.url;
    await load();
  }));

  root.querySelectorAll('[data-track-opportunity]').forEach(button => button.addEventListener('click', async () => {
    const opportunity = state.opportunities.find(item => String(item.id) === button.dataset.trackOpportunity);
    if (!opportunity) return;
    await trackOpportunity(opportunity, button);
  }));
}

function renderOpportunities() {
  const root = $('#career-opportunity-grid');
  const meta = $('#career-opportunity-meta');
  const data = state.opportunityMeta || {};
  const recommended = state.opportunities.filter(opportunity => !isLocallyDeclined(opportunity));
  const review = state.reviewOpportunities.filter(opportunity => !isLocallyDeclined(opportunity));

  const recommendedMarkup = recommended.length
    ? '<div class="career-opportunity-group-head"><div><span>High-confidence recommendations</span><strong>Eligible + strong fit + practical</strong></div><small>' + recommended.length + ' shown</small></div>' +
      recommended.map(opportunity => opportunityCardMarkup(opportunity)).join('')
    : '<div class="career-opportunity-empty"><strong>No high-confidence recommendation in this source window.</strong><span>ASHWOOD will leave the primary list empty rather than promote a role with uncertain requirements, weak fit, or poor practical constraints.</span></div>';

  const reviewMarkup = review.length
    ? '<div class="career-opportunity-group-head is-review"><div><span>Review queue</span><strong>Promising, but a hard requirement is not verified</strong></div><small>' + review.length + ' shown</small></div>' +
      review.map(opportunity => opportunityCardMarkup(opportunity,{review:true})).join('')
    : '';

  root.innerHTML = resumeProfileSetupMarkup() + recommendedMarkup + reviewMarkup;
  wireOpportunityActions(root);
  wireResumeProfileImport(root);

  const sourceStamp = data.source_fetched_at ? 'sources checked ' + fmtDateTime(data.source_fetched_at) : 'source time unavailable';
  const sourceLabel = data.source ? data.source + ' · ' : '';
  const pool = Number(data.pool_count || 0);
  const reviewPool = Number(data.review_pool_count || 0);
  const warning = data.warning ? ' · ' + data.warning : '';
  meta.textContent = recommended.length + ' high-confidence shown · ' + pool + ' high-confidence in pool · ' + reviewPool + ' held for requirement review · ' + sourceLabel + sourceStamp + warning;
}

async function loadOpportunities({ refresh=false }={}) {
  const button = $('#career-opportunity-refresh');
  button.disabled = true;
  button.textContent = refresh ? 'Finding more…' : 'Loading…';
  try {
    if (refresh) state.opportunityCursor += 1;
    let data = await opportunityApi({ cursor:state.opportunityCursor, refresh });
    let opportunities = data.opportunities || [];
    let reviewOpportunities = data.review_opportunities || [];
    let allIncoming = [...opportunities, ...reviewOpportunities];

    const legacyDeclines = allIncoming.filter(opportunity =>
      isLocallyDeclined(opportunity) &&
      !state.opportunityDispositions.some(item =>
        item.disposition === 'DECLINED' &&
        item.source === opportunitySourceKey(opportunity) &&
        String(item.opportunity_id) === String(opportunity.id)
      )
    );
    let migratedLegacyDecline = false;
    for (const opportunity of legacyDeclines) {
      try {
        const { source, id } = await persistOpportunityDecline(opportunity, 'migrated_from_legacy_local_storage');
        state.opportunityDispositions.unshift({
          source,
          opportunity_id:id,
          company:opportunity.company,
          role:opportunity.role,
          url:opportunity.url,
          disposition:'DECLINED',
          reason:'migrated_from_legacy_local_storage',
          updated_at:new Date().toISOString()
        });
        migratedLegacyDecline = true;
      } catch {
        // Keep the legacy browser disposition as a fail-safe; do not resurrect a role the owner already declined.
      }
    }
    if (migratedLegacyDecline) {
      data = await opportunityApi({ cursor:state.opportunityCursor, refresh:false });
      opportunities = data.opportunities || [];
      reviewOpportunities = data.review_opportunities || [];
    }

    state.opportunities = opportunities.filter(opportunity => !isLocallyDeclined(opportunity));
    state.reviewOpportunities = reviewOpportunities.filter(opportunity => !isLocallyDeclined(opportunity));
    state.opportunityMeta = data;
    state.newJobsSinceSession = Number(data.pool_count || state.opportunities.length || 0);
    renderHeader();
    renderOpportunities();
    renderToday();
    renderHistoryPreferences();
  } catch (error) {
    $('#career-opportunity-grid').innerHTML = `<div class="career-opportunity-empty"><strong>New options could not be loaded.</strong><span>${escapeHtml(error.message)}</span></div>`;
    $('#career-opportunity-meta').textContent = 'Opportunity feed unavailable';
  } finally {
    button.disabled = false;
    button.textContent = 'Next recommendations';
  }
}

async function trackOpportunity(opportunity, button, { reload=true, nextAction=null }={}) {
  const original = button.textContent;
  button.disabled = true;
  button.textContent = reload ? 'Adding…' : 'Preparing…';
  try {
    const salary = salaryBounds(opportunity.salary);
    const result = await api({
      method:'POST',
      body:JSON.stringify({
        action:'upsert_application',
        id:`career:${opportunitySourceKey(opportunity)}:${opportunity.id}`,
        company:opportunity.company,
        role:opportunity.role,
        job_id:String(opportunity.id),
        posting_url:opportunity.url,
        location:opportunity.location,
        work_arrangement:workArrangementLabel(opportunity),
        salary_min:salary.min,
        salary_max:salary.max,
        salary_currency:'USD',
        status:'TARGET',
        next_action:nextAction || 'Review the full employer posting and decide whether to apply.',
        posting_snapshot:{
          summary:opportunity.summary || '',
          responsibilities:[],
          requirements:Array.isArray(opportunity.requirements_checked) ? opportunity.requirements_checked : [],
          requirements_status:opportunity.requirements_status || 'unknown',
          requirements_reasons:Array.isArray(opportunity.requirements_reasons) ? opportunity.requirements_reasons : [],
          preferred:[],
          source:opportunity.source || null,
          source_url:opportunity.source_url || opportunity.url,
          salary_label:opportunity.salary || null,
          published_at:opportunity.published_at || null
        },
        materials:{ resume_variant:opportunity.resume_recommendation?.variant || '' },
        source:opportunitySourceKey(opportunity),
        notes:`Discovered through ASHWOOD Career Ops. Source: ${opportunity.source || 'job feed'}. Published ${opportunity.published_at || 'date unavailable'}.`
      })
    });
    state.selectedId = result.id;
    if (reload) await load();
    button.textContent = original;
    button.disabled = false;
    return true;
  } catch (error) {
    button.disabled = false;
    button.textContent = 'Try again';
    button.title = error.message;
    return false;
  }
}

function render() {
  renderHeader();
  renderToday();
  renderApplications();
  renderDetail();
  renderSyncState();
  renderHistoryPreferences();
  $('#career-refreshed').textContent = `↻ Last synced ${new Date().toLocaleTimeString([], { hour:'numeric', minute:'2-digit' })}`;
}

async function refreshCareerState({ showLoading=false }={}) {
  if (showLoading) {
    $('#career-state').textContent = 'Loading…';
    $('#career-applications').innerHTML = '<div class="workspace-state is-loading"><strong>Loading applications…</strong><span>Reading the private Career Ops record.</span></div>';
    $('#career-detail').innerHTML = '<div class="workspace-state is-loading"><strong>Preparing application detail…</strong><span>Selecting the current application after the record loads.</span></div>';
  }
  const data = await api();
  state.applications = data.applications || [];
  state.events = data.events || [];
  state.opportunityDispositions = data.opportunity_dispositions || [];
  state.resumeProfile = data.resume_profile || { configured:false, source:null, updated_at:null };
  if (!state.selectedId && state.applications.length) state.selectedId = sortApplications(state.applications)[0].id;
  if (state.selectedId && !state.applications.some(item => item.id === state.selectedId)) {
    state.selectedId = state.applications.length ? sortApplications(state.applications)[0].id : null;
  }
  $('#career-state').textContent = '';
  $('#career-state').hidden = true;
  render();
}

async function load() {
  try {
    await refreshCareerState({ showLoading:true });
    await loadOpportunities();
  } catch (error) {
    if (error.status === 401) {
      $('#career-state').hidden = false;
      $('#career-state').textContent = 'Locked';
      $('#career-applications').innerHTML = `<div class="career-empty"><strong>Workspace is locked.</strong><p>Unlock the main ASHWOOD workspace first, then return here.</p><a class="career-primary-link" href="/workspace/">Unlock workspace</a></div>`;
      $('#career-detail').innerHTML = '';
      $('#career-opportunity-grid').innerHTML = '';
      $('#career-opportunity-meta').textContent = 'Unlock the workspace to load private recommendations.';
      return;
    }
    $('#career-state').hidden = false;
    $('#career-state').textContent = 'Unavailable';
    $('#career-applications').innerHTML = `<div class="workspace-state is-error"><strong>Career Ops could not load.</strong><span>${escapeHtml(error.message)} Canonical application data was not changed.</span></div>`;
    $('#career-detail').innerHTML = '<div class="workspace-state is-error"><strong>Application detail unavailable.</strong><span>No application was modified.</span></div>';
    $('#career-opportunity-grid').innerHTML = '<div class="workspace-state is-error"><strong>Opportunities unavailable.</strong><span>The failure affects this view only; saved Career Ops records are unchanged.</span></div>';
  }
}

function parseLines(value='') {
  return String(value).split('\n').map(line => line.trim()).filter(Boolean);
}

function openApplicationDialog(application=null) {
  const dialog = $('#career-dialog');
  const form = $('#career-form');
  form.reset();
  $('#career-form-error').textContent = '';
  $('#career-form-id').value = application?.id || '';
  $('#career-company').value = application?.company || '';
  $('#career-role').value = application?.role || '';
  $('#career-job-id').value = application?.job_id || '';
  $('#career-posting-url').value = application?.posting_url || '';
  $('#career-location').value = application?.location || '';
  $('#career-work-arrangement').value = application?.work_arrangement || '';
  $('#career-salary-min').value = application?.salary_min || '';
  $('#career-salary-max').value = application?.salary_max || '';
  $('#career-requested-salary').value = application?.requested_salary || '';
  $('#career-status-input').value = normaliseStatus(application?.status || 'TARGET');
  $('#career-submitted-at').value = application?.submitted_at ? new Date(application.submitted_at).toISOString().slice(0,10) : '';
  $('#career-next-action').value = application?.next_action || '';
  $('#career-next-action-at').value = application?.next_action_at ? new Date(application.next_action_at).toISOString().slice(0,16) : '';
  $('#career-fit-decision').value = application?.fit_decision || '';
  $('#career-summary-input').value = application?.posting_snapshot?.summary || '';
  $('#career-responsibilities').value = (application?.posting_snapshot?.responsibilities || []).join('\n');
  $('#career-requirements').value = (application?.posting_snapshot?.requirements || []).join('\n');
  $('#career-preferred').value = (application?.posting_snapshot?.preferred || []).join('\n');
  $('#career-interview-notes').value = application?.posting_snapshot?.interview_notes || '';
  const resumeMaterial = application?.materials?.resume;
  $('#career-resume').value = typeof resumeMaterial === 'string' ? resumeMaterial : (resumeMaterial?.filename || '');
  $('#career-projects').value = Array.isArray(application?.materials?.projects) ? application.materials.projects.join(', ') : application?.materials?.projects || '';
  $('#career-work-sample').value = application?.materials?.work_sample || '';
  $('#career-notes').value = application?.notes || '';
  $('#career-dialog-title').textContent = application ? 'Edit application' : 'Add application';
  dialog.showModal();
}

async function saveApplication(event) {
  event.preventDefault();
  const button = $('#career-save');
  button.disabled = true;
  button.textContent = 'Saving…';
  try {
    const payload = {
      action:'upsert_application',
      id: $('#career-form-id').value || undefined,
      company: $('#career-company').value,
      role: $('#career-role').value,
      job_id: $('#career-job-id').value,
      posting_url: $('#career-posting-url').value,
      location: $('#career-location').value,
      work_arrangement: $('#career-work-arrangement').value,
      salary_min: $('#career-salary-min').value,
      salary_max: $('#career-salary-max').value,
      requested_salary: $('#career-requested-salary').value,
      status: $('#career-status-input').value,
      submitted_at: $('#career-submitted-at').value,
      next_action: $('#career-next-action').value,
      next_action_at: $('#career-next-action-at').value,
      fit_decision: $('#career-fit-decision').value,
      posting_snapshot: {
        summary: $('#career-summary-input').value.trim(),
        responsibilities: parseLines($('#career-responsibilities').value),
        requirements: parseLines($('#career-requirements').value),
        preferred: parseLines($('#career-preferred').value),
        interview_notes: $('#career-interview-notes').value.trim()
      },
      materials: {
        resume: $('#career-resume').value.trim(),
        projects: $('#career-projects').value.split(',').map(value => value.trim()).filter(Boolean),
        work_sample: $('#career-work-sample').value.trim()
      },
      notes: $('#career-notes').value,
      source:'workspace'
    };
    const result = await api({ method:'POST', body:JSON.stringify(payload) });
    state.selectedId = result.id;
    $('#career-dialog').close();
    await load();
  } catch (error) {
    $('#career-form-error').textContent = error.message;
  } finally {
    button.disabled = false;
    button.textContent = 'Save application';
  }
}

async function syncInbox({ interactive=false }={}) {
  if (state.gmailSyncInFlight) return;
  state.gmailSyncInFlight = true;
  const button = $('#career-refresh');
  const original = button?.textContent || 'Refresh';
  if (interactive && button) {
    button.disabled = true;
    button.textContent = 'Syncing inbox…';
  }
  try {
    const result = await gmailSyncApi();
    state.inboxReviews = Array.isArray(result.reviews) ? result.reviews : [];
    state.inboxSync = {
      status:'success',
      outcomes:Array.isArray(result.outcomes) ? result.outcomes.filter(item => item.verified) : [],
      reviewOpen:Number(result.counts?.review_open || 0),
      counts:result.counts || {},
      syncedAt:new Date().toISOString()
    };
    await refreshCareerState();
  } catch (error) {
    state.inboxSync = { status:'error', message:error.message, failures:error.body?.failures || [] };
    renderSyncState();
  } finally {
    state.gmailSyncInFlight = false;
    if (interactive && button) {
      button.disabled = false;
      button.textContent = original;
    }
  }
}

function startCareerLiveSync() {
  if (state.gmailPollTimer) window.clearInterval(state.gmailPollTimer);
  window.setTimeout(() => {
    if (document.visibilityState === 'visible') syncInbox();
  }, 10000);
  state.gmailPollTimer = window.setInterval(() => {
    if (document.visibilityState === 'visible') syncInbox();
  }, 60000);
}

$('#career-add').addEventListener('click', () => openApplicationDialog());
$('#career-refresh').addEventListener('click', () => syncInbox({ interactive:true }));
$('#career-opportunity-refresh').addEventListener('click', () => loadOpportunities({ refresh:true }));
$('#career-form').addEventListener('submit', saveApplication);
document.querySelectorAll('[data-career-close]').forEach(button => button.addEventListener('click', () => $('#career-dialog').close()));
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') syncInbox();
});

load().then(startCareerLiveSync);


// production deploy retry: 2026-09-26T21:52Z
