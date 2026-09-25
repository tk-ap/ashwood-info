const PROFILE_KEY = 'ashwood.funding.profile.v1';
const STATUS_KEY = 'ashwood.funding.status.v1';

const PROFILE_OPTIONS = [
  ['southern_california','Southern California resident'],
  ['los_angeles','Los Angeles / LA County'],
  ['veteran','Veteran / military-connected'],
  ['founder','Founder / small-business owner'],
  ['software_ai','Software / AI startup'],
  ['black_founder','Black founder / creator'],
  ['lgbtq','LGBTQ+'],
  ['nonbinary_trans','Nonbinary / trans'],
  ['artist_creator','Artist / creator'],
  ['zero_budget','Build-cost reduction is high priority']
];

const TYPES = [
  ['all','All'],
  ['emergency_cash','Emergency cash'],
  ['founder_cash','Founder funding'],
  ['rd_funding','R&D'],
  ['build_credits','Build credits'],
  ['creative_funding','Creative'],
  ['noncash','Non-cash']
];

const escapeHtml = (value='') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const readJson = (key, fallback={}) => { try { return JSON.parse(localStorage.getItem(key) || '') || fallback; } catch { return fallback; } };
const writeJson = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };

let registry = {opportunities:[]};
let profile = readJson(PROFILE_KEY, {});
let statuses = readJson(STATUS_KEY, {});
let typeFilter = 'all';
let search = '';

async function api(path, options={}) {
  const res = await fetch(path, {credentials:'same-origin', headers:{'Content-Type':'application/json', ...(options.headers||{})}, ...options});
  const body = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

async function ensureAuth() {
  const status = await api('/api/workspace-auth');
  if (status.authenticated) return true;
  location.replace('/workspace/');
  return false;
}

function selectedTags() {
  return Object.entries(profile).filter(([,on])=>on===true).map(([key])=>key);
}

function matchedCount(item) {
  const selected = new Set(selectedTags());
  return (item.match_tags || []).filter(tag => selected.has(tag)).length;
}

function effectiveStatus(item) {
  return statuses[item.id] || item.status || 'POSSIBLE_FIT';
}

function urgency(item) {
  if (!item.deadline) return 9999;
  const delta = Math.ceil((new Date(item.deadline + 'T23:59:59').getTime() - Date.now()) / 86400000);
  return Number.isFinite(delta) ? delta : 9999;
}

function ranked(items) {
  return [...items].sort((a,b) => {
    const am = matchedCount(a), bm = matchedCount(b);
    if (bm !== am) return bm - am;
    const au = urgency(a), bu = urgency(b);
    if (au !== bu) return au - bu;
    const order = {VERIFIED_FIT:0,READY_TO_APPLY:1,POSSIBLE_FIT:2,NEEDS_FACT:3,APPLIED:4,AWAITING_RESPONSE:5,AWARDED:6,NOT_ELIGIBLE:8,CLOSED:9};
    return (order[effectiveStatus(a)] ?? 7) - (order[effectiveStatus(b)] ?? 7);
  });
}

function renderProfile() {
  const host = document.querySelector('#funding-profile-options');
  host.innerHTML = PROFILE_OPTIONS.map(([id,label]) => `<label class="funding-profile-chip"><input type="checkbox" data-profile="${id}" ${profile[id] ? 'checked' : ''}><span>${escapeHtml(label)}</span></label>`).join('');
  host.querySelectorAll('[data-profile]').forEach(input => input.addEventListener('change', () => {
    profile[input.dataset.profile] = input.checked;
    writeJson(PROFILE_KEY, profile);
    render();
  }));
}

function renderFilters() {
  const host = document.querySelector('#funding-type-filters');
  host.innerHTML = TYPES.map(([id,label]) => `<button type="button" data-type="${id}" aria-pressed="${id===typeFilter}">${label}</button>`).join('');
  host.querySelectorAll('[data-type]').forEach(button => button.addEventListener('click', () => {
    typeFilter = button.dataset.type;
    renderFilters();
    render();
  }));
}

function statusOptions(current) {
  return ['POSSIBLE_FIT','NEEDS_FACT','VERIFIED_FIT','READY_TO_APPLY','APPLIED','AWAITING_RESPONSE','AWARDED','DECLINED','NOT_ELIGIBLE','CLOSED']
    .map(value => `<option value="${value}" ${value===current?'selected':''}>${value.replaceAll('_',' ')}</option>`).join('');
}

function renderSummary(items) {
  const available = items.filter(x => !['NOT_ELIGIBLE','CLOSED','DECLINED'].includes(effectiveStatus(x))).length;
  const soon = items.filter(x => urgency(x) <= 30 && urgency(x) >= 0).length;
  const active = items.filter(x => ['APPLIED','AWAITING_RESPONSE'].includes(effectiveStatus(x))).length;
  const credits = items.filter(x => x.type === 'build_credits').length;
  document.querySelector('#funding-summary').innerHTML = [
    [available,'available / unresolved'],
    [soon,'closing ≤ 30d'],
    [active,'in progress'],
    [credits,'credit programs']
  ].map(([n,label])=>`<article><strong>${n}</strong><span>${label}</span></article>`).join('');
}

function visibleItems() {
  const q = search.trim().toLowerCase();
  return ranked(registry.opportunities.filter(item => {
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;
    if (!q) return true;
    return JSON.stringify(item).toLowerCase().includes(q);
  }));
}

function render() {
  const items = visibleItems();
  renderSummary(registry.opportunities);
  document.querySelector('#funding-visible-count').textContent = `${items.length} shown · ${selectedTags().length} private matching lanes active`;
  const host = document.querySelector('#funding-list');
  host.innerHTML = items.map(item => {
    const current = effectiveStatus(item);
    const matches = matchedCount(item);
    const deadline = item.deadline ? new Date(item.deadline+'T12:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}) : 'Rolling / not stated';
    return `<article class="funding-card">
      <div class="funding-card__top">
        <div>
          <p class="funding-card__meta">${escapeHtml(item.funder)} · ${escapeHtml(item.applicant_lane.replaceAll('_',' '))}</p>
          <h3>${escapeHtml(item.name)}</h3>
        </div>
        <span class="funding-match">${matches ? `${matches} profile match${matches===1?'':'es'}` : 'unranked'}</span>
      </div>
      <p class="funding-value">${escapeHtml(item.value)}</p>
      <dl class="funding-facts">
        <div><dt>Deadline</dt><dd>${escapeHtml(deadline)}</dd></div>
        <div><dt>Source verified</dt><dd>${escapeHtml(item.last_verified_at)}</dd></div>
        <div><dt>Effort</dt><dd>${escapeHtml(item.effort)}</dd></div>
      </dl>
      <div class="funding-columns">
        <div><h4>What the source requires</h4><ul>${(item.criteria||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></div>
        <div><h4>Still unknown</h4><ul>${(item.unknowns||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></div>
      </div>
      <p class="funding-next"><strong>Next:</strong> ${escapeHtml(item.next_action)}</p>
      <div class="funding-card__actions">
        <label>Status <select data-status="${escapeHtml(item.id)}">${statusOptions(current)}</select></label>
        <a href="${escapeHtml(item.source_url)}" target="_blank" rel="noopener">${escapeHtml(item.source_label)} ↗</a>
      </div>
    </article>`;
  }).join('') || '<p class="funding-empty">No opportunities match the current filters.</p>';
  host.querySelectorAll('[data-status]').forEach(select => select.addEventListener('change', () => {
    statuses[select.dataset.status] = select.value;
    writeJson(STATUS_KEY, statuses);
    render();
  }));
}

async function loadRegistry() {
  const state = document.querySelector('#funding-registry-state');
  const stamp = document.querySelector('#funding-registry-time');
  state.textContent = 'Refreshing';
  try {
    const res = await fetch('/workspace/funding/opportunities.json?ts='+Date.now(), {cache:'no-store'});
    if (!res.ok) throw new Error('Registry unavailable');
    registry = await res.json();
    state.textContent = 'Loaded';
    stamp.textContent = `Seed registry generated ${new Date(registry.generated_at).toLocaleString()}`;
    render();
  } catch (error) {
    state.textContent = 'Unavailable';
    stamp.textContent = error.message;
  }
}

async function start() {
  if (!(await ensureAuth())) return;
  const shell = document.querySelector('.funding-shell');
  if (shell) shell.inert = false;
  renderProfile();
  renderFilters();
  document.querySelector('#funding-search').addEventListener('input', event => { search = event.target.value; render(); });
  document.querySelector('#funding-refresh').addEventListener('click', loadRegistry);
  await loadRegistry();
}

start();