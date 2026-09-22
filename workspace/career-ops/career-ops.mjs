import { normaliseStatus, requestedSalaryLabel, salaryLabel, sortApplications, summaryCounts, needsAttention } from './model.mjs';

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
  opportunityCursor: 0,
  opportunityMeta: null
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

function statusClass(status) {
  return normaliseStatus(status).toLowerCase();
}

function eventsFor(applicationId) {
  return state.events.filter(event => event.application_id === applicationId);
}

function snapshotList(snapshot, key) {
  const values = Array.isArray(snapshot?.[key]) ? snapshot[key] : [];
  if (!values.length) return '';
  return `<div class="career-detail-block"><h4>${escapeHtml(key.replaceAll('_',' '))}</h4><ul>${values.map(value => `<li>${escapeHtml(value)}</li>`).join('')}</ul></div>`;
}

function materialChips(materials={}) {
  const items = [];
  if (materials.resume) items.push(`Résumé: ${materials.resume}`);
  if (materials.projects) items.push(`Projects: ${Array.isArray(materials.projects) ? materials.projects.join(', ') : materials.projects}`);
  if (materials.work_sample) items.push(`Work sample: ${materials.work_sample}`);
  if (materials.self_intro) items.push('Self-introduction submitted');
  return items;
}

function renderHeader() {
  const counts = summaryCounts(state.applications);
  const cards = [
    [counts.active, 'active pipeline'],
    [counts.submitted, 'submitted / screening'],
    [counts.conversations, 'recruiter / assessment / interview'],
    [counts.needsAction, 'need action']
  ];
  const markup = cards.map(([value,label]) => `<article><strong>${value}</strong><span>${label}</span></article>`).join('');
  $('#career-summary').innerHTML = markup;
  const hero = $('#workspace-view-data-hero');
  if (hero) hero.innerHTML = '<p class="section-kicker">Work · live career state · relationships below</p><div class="workspace-data-hero-grid">' + markup + '</div>';
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
    return `<button class="career-row ${state.selectedId === app.id ? 'is-selected' : ''}" type="button" data-app-id="${escapeHtml(app.id)}">
      <span class="career-row-main">
        <span class="career-company">${escapeHtml(app.company)}</span>
        <strong>${escapeHtml(app.role)}</strong>
        <span>${[app.job_id ? `Req ${app.job_id}` : null, app.location, app.work_arrangement].filter(Boolean).map(escapeHtml).join(' · ')}</span>
      </span>
      <span class="career-row-comp">${escapeHtml(salaryLabel(app))}${requested ? `<small>asked ${escapeHtml(requested)}</small>` : ''}</span>
      <span class="career-status ${statusClass(app.status)}">${escapeHtml(normaliseStatus(app.status))}</span>
      <span class="career-row-meta">${attention ? '<b>action due</b>' : `${eventCount} event${eventCount === 1 ? '' : 's'}`}</span>
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
      <div class="career-section-title"><span>Timeline</span><small>Email-driven status events will appear here once Gmail monitoring is connected.</small></div>
      ${events.length ? events.map(event => `<article><time>${escapeHtml(fmtDateTime(event.occurred_at))}</time><div><strong>${escapeHtml(event.summary)}</strong><span>${escapeHtml(event.source || 'manual')} · ${escapeHtml(event.event_type || 'NOTE')}</span></div></article>`).join('') : '<p class="career-muted">No events yet.</p>'}
    </div>`;

  $('#career-edit')?.addEventListener('click', () => openApplicationDialog(app));
}

function renderSyncState() {
  const gmailEvents = state.events.filter(event => event.source === 'gmail');
  const node = $('#career-sync-state');
  if (gmailEvents.length) {
    const latest = gmailEvents[0];
    node.innerHTML = `<strong>Gmail activity detected</strong><span>${gmailEvents.length} tracked message event${gmailEvents.length === 1 ? '' : 's'} · latest ${escapeHtml(fmtDateTime(latest.occurred_at))}</span>`;
  } else {
    node.innerHTML = `<strong>Inbox sync ready, not connected</strong><span>Connect the dedicated job-search Gmail account in ChatGPT; application emails can then be matched to these records and written into the timeline without exposing credentials to ASHWOOD.</span>`;
  }
}

function renderOpportunities() {
  const root = $('#career-opportunity-grid');
  const meta = $('#career-opportunity-meta');
  const data = state.opportunityMeta || {};

  if (!state.opportunities.length) {
    root.innerHTML = `<div class="career-opportunity-empty"><strong>No strong new matches in the current feed.</strong><span>Refresh again later; Career Ops only surfaces roles that overlap the current business execution, risk, controls, compliance, PMO, operations, process, and finance lanes.</span></div>`;
  } else {
    root.innerHTML = state.opportunities.map(opportunity => `
      <article class="career-opportunity-card">
        <div class="career-opportunity-topline">
          <span>${escapeHtml(opportunity.company)}</span>
          <time>${escapeHtml(fmtDate(opportunity.published_at))}</time>
        </div>
        <h3>${escapeHtml(opportunity.role)}</h3>
        <p class="career-opportunity-location">${escapeHtml([opportunity.location || 'Remote', opportunity.job_type].filter(Boolean).join(' · '))}</p>
        ${opportunity.salary ? `<p class="career-opportunity-salary">${escapeHtml(opportunity.salary)}</p>` : ''}
        ${opportunity.matches?.length ? `<div class="career-opportunity-tags">${opportunity.matches.map(match => `<span>${escapeHtml(match)}</span>`).join('')}</div>` : ''}
        <p class="career-opportunity-summary">${escapeHtml(opportunity.summary || '')}</p>
        <div class="career-opportunity-actions">
          <a href="${escapeHtml(opportunity.url)}" target="_blank" rel="noopener">Open role ↗</a>
          <button type="button" data-track-opportunity="${escapeHtml(opportunity.id)}">Track target</button>
        </div>
        <small>Source: <a href="${escapeHtml(opportunity.source_url || opportunity.url)}" target="_blank" rel="noopener">${escapeHtml(opportunity.source || 'job feed')}</a></small>
      </article>`).join('');

    root.querySelectorAll('[data-track-opportunity]').forEach(button => button.addEventListener('click', async () => {
      const opportunity = state.opportunities.find(item => String(item.id) === button.dataset.trackOpportunity);
      if (!opportunity) return;
      await trackOpportunity(opportunity, button);
    }));
  }

  const sourceStamp = data.source_fetched_at ? `source checked ${fmtDateTime(data.source_fetched_at)}` : 'source time unavailable';
  const pool = Number(data.pool_count || 0);
  const warning = data.warning ? ` · ${data.warning}` : '';
  meta.textContent = `${state.opportunities.length || 0} options shown · ${pool} matched in the current pool · ${sourceStamp}${warning}`;
}

async function loadOpportunities({ refresh=false }={}) {
  const button = $('#career-opportunity-refresh');
  button.disabled = true;
  button.textContent = refresh ? 'Finding more…' : 'Loading…';
  try {
    if (refresh) state.opportunityCursor += 1;
    const data = await opportunityApi({ cursor:state.opportunityCursor, refresh });
    state.opportunities = data.opportunities || [];
    state.opportunityMeta = data;
    renderOpportunities();
  } catch (error) {
    $('#career-opportunity-grid').innerHTML = `<div class="career-opportunity-empty"><strong>New options could not be loaded.</strong><span>${escapeHtml(error.message)}</span></div>`;
    $('#career-opportunity-meta').textContent = 'Opportunity feed unavailable';
  } finally {
    button.disabled = false;
    button.textContent = 'Refresh options';
  }
}

async function trackOpportunity(opportunity, button) {
  const original = button.textContent;
  button.disabled = true;
  button.textContent = 'Adding…';
  try {
    const result = await api({
      method:'POST',
      body:JSON.stringify({
        action:'upsert_application',
        id:`career:remotive:${opportunity.id}`,
        company:opportunity.company,
        role:opportunity.role,
        job_id:String(opportunity.id),
        posting_url:opportunity.url,
        location:opportunity.location,
        work_arrangement:'Remote',
        status:'TARGET',
        next_action:'Review the full employer posting and decide whether to apply.',
        posting_snapshot:{ summary:opportunity.summary || '', responsibilities:[], requirements:[], preferred:[] },
        materials:{},
        source:'remotive',
        notes:`Discovered through ASHWOOD Career Ops. Source: Remotive. Published ${opportunity.published_at || 'date unavailable'}.`
      })
    });
    state.selectedId = result.id;
    await load();
  } catch (error) {
    button.disabled = false;
    button.textContent = 'Try again';
    button.title = error.message;
    return;
  }
  button.textContent = original;
}

function render() {
  renderHeader();
  renderApplications();
  renderDetail();
  renderSyncState();
  $('#career-refreshed').textContent = `Refreshed ${new Date().toLocaleTimeString([], { hour:'numeric', minute:'2-digit' })}`;
}

async function load() {
  try {
    $('#career-state').textContent = 'Loading…';
    $('#career-applications').innerHTML = '<div class="workspace-state is-loading"><strong>Loading applications…</strong><span>Reading the private Career Ops record.</span></div>';
    $('#career-detail').innerHTML = '<div class="workspace-state is-loading"><strong>Preparing application detail…</strong><span>Selecting the current application after the record loads.</span></div>';
    const data = await api();
    state.applications = data.applications || [];
    state.events = data.events || [];
    if (!state.selectedId && state.applications.length) state.selectedId = sortApplications(state.applications)[0].id;
    $('#career-state').textContent = 'Private workspace';
    render();
    await loadOpportunities();
  } catch (error) {
    if (error.status === 401) {
      $('#career-state').textContent = 'Locked';
      $('#career-applications').innerHTML = `<div class="career-empty"><strong>Workspace is locked.</strong><p>Unlock the main ASHWOOD workspace first, then return here.</p><a class="career-primary-link" href="/workspace/">Unlock workspace</a></div>`;
      $('#career-detail').innerHTML = '';
      $('#career-opportunity-grid').innerHTML = '';
      $('#career-opportunity-meta').textContent = 'Unlock the workspace to load private recommendations.';
      return;
    }
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
  $('#career-resume').value = application?.materials?.resume || '';
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

$('#career-add').addEventListener('click', () => openApplicationDialog());
$('#career-refresh').addEventListener('click', load);
$('#career-opportunity-refresh').addEventListener('click', () => loadOpportunities({ refresh:true }));
$('#career-form').addEventListener('submit', saveApplication);
document.querySelectorAll('[data-career-close]').forEach(button => button.addEventListener('click', () => $('#career-dialog').close()));

load();
