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
  if (hero) hero.innerHTML = '<p class="section-kicker">Work · live career state</p><div class="workspace-data-hero-grid">' + markup + '</div>';
}
