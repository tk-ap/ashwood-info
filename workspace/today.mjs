
const STORE_KEY = 'ashwood.workspace.capture.v1';
const ACTIVE = new Set(['active','in_progress','running','executing','started','working','ready']);
const NEEDS_OWNER = new Set(['waiting_approval','decision_required','review','needs_attention']);
const BLOCKED = new Set(['blocked','failed']);
const DONE = new Set(['completed','done','shipped','closed']);

const q = selector => document.querySelector(selector);
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const normalize = value => String(value || '').toLowerCase().replaceAll(' ','_');

function sourceLooksAgent(row) {
  const value = [row.source_system,row.owner,row.assignee,row.product].filter(Boolean).join(' ').toLowerCase();
  return value.includes('agentos') || value.includes('agent os') || value.includes('agent-os') || value.includes('milchik');
}
function rowStatus(row) { return normalize(row.status || 'active'); }
function classifyCapture(value) {
  const text = value.toLowerCase();
  if (/investor|job|application|sponsor|outreach|revenue|money|client|partner/.test(text)) return 'Work';
  if (/person|follow up|follow-up|email|contact|network|meeting/.test(text)) return 'Network';
  if (/proof|evidence|test|verify|screenshot|result|metric/.test(text)) return 'Evidence';
  if (/journal|note|reflect|learn|health|personal|self/.test(text)) return 'Self';
  return 'Build';
}
function readCapture() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch { return []; }
}
function writeCapture(items) {
  localStorage.setItem(STORE_KEY, JSON.stringify(items.slice(-40)));
}
function renderCaptureQueue() {
  const host = q('#today-local-list');
  if (!host) return;
  const items = readCapture().slice().reverse().slice(0,6);
  host.innerHTML = items.length ? items.map(item => '<li><span>' + escapeHtml(item.text) + '</span><span>' + escapeHtml(item.bucket) + '</span></li>').join('') : '<li><span>No local captures yet.</span><span>empty</span></li>';
}
async function fetchJson(url) {
  const response = await fetch(url, { credentials:'same-origin', cache:'no-store' });
  if (!response.ok) {
    const error = new Error(String(response.status));
    error.status = response.status;
    throw error;
  }
  return response.json();
}
function normalizeBoard(row) {
  return {
    title: row.title,
    product: row.product || 'AgentOS',
    status: row.status,
    owner: row.assignee || row.owner || 'AgentOS',
    source_system: 'AgentOS',
    next_gate: row.next_gate || row.blocker || '',
    updated_at: row.updated_at || row.occurred_at || null
  };
}
function statusBadge(row) {
  const status = rowStatus(row);
  const cls = BLOCKED.has(status) ? ' is-risk' : NEEDS_OWNER.has(status) ? ' is-decision' : '';
  return '<span class="today-command__status' + cls + '">' + escapeHtml(String(row.status || 'active').replaceAll('_',' ')) + '</span>';
}
function renderRows(host, rows, empty) {
  if (!host) return;
  host.innerHTML = rows.length ? rows.slice(0,4).map(row => '<div class="today-command__row"><div><strong>' + escapeHtml(row.title || 'Untitled work') + '</strong><small>' + escapeHtml([row.product || row.source_system || '', row.owner || row.assignee || '', row.next_gate ? 'next: ' + row.next_gate : ''].filter(Boolean).join(' · ')) + '</small></div>' + statusBadge(row) + '</div>').join('') : '<p class="today-command__empty">' + escapeHtml(empty) + '</p>';
}
function renderObjective(priorities, rows) {
  const host = q('#today-objective');
  if (!host) return;
  const sorted = (priorities || []).slice().sort((a,b) => Number(a.rank||99) - Number(b.rank||99));
  const chosen = sorted.find(priority => {
    const match = (priority.match || []).map(x => String(x).toLowerCase());
    return !rows.some(row => DONE.has(rowStatus(row)) && match.some(term => [row.product,row.title].filter(Boolean).join(' ').toLowerCase().includes(term)));
  }) || sorted[0];
  if (!chosen) {
    host.innerHTML = '<p class="today-command__empty">No ranked objective is configured.</p>';
    return;
  }
  host.innerHTML = '<div class="today-command__objective"><span class="today-command__objective-label">Next highest-value objective · rank ' + escapeHtml(chosen.rank) + '</span><h4>' + escapeHtml(chosen.product) + '</h4><p>' + escapeHtml(chosen.outcome) + '</p><p class="today-command__owner"><strong>Your next:</strong> ' + escapeHtml(chosen.owner_next) + '</p><div class="today-command__objective-actions"><button class="today-command__button" type="button" id="today-open-priorities">Open objective</button><button class="today-command__button is-secondary" type="button" id="today-copy-objective">Copy for AgentOS</button><button class="today-command__button is-secondary" type="button" id="today-refresh-objective">Get next objective</button></div></div>';
  q('#today-open-priorities')?.addEventListener('click', () => document.querySelector('#actual-priorities')?.scrollIntoView({behavior:'smooth',block:'start'}));
  q('#today-refresh-objective')?.addEventListener('click', async event => { event.currentTarget.textContent = 'Checking…'; await loadToday(); });\n  q('#today-copy-objective')?.addEventListener('click', async event => {
    const text = chosen.product + ': ' + chosen.outcome + '\nYour next: ' + chosen.owner_next;
    await navigator.clipboard.writeText(text);
    event.currentTarget.textContent = 'Copied';
    setTimeout(() => event.currentTarget.textContent = 'Copy for AgentOS', 1200);
  });
}
function setStats(rows) {
  const agent = rows.filter(sourceLooksAgent);
  const running = agent.filter(row => ACTIVE.has(rowStatus(row)));
  const owner = agent.filter(row => NEEDS_OWNER.has(rowStatus(row)));
  const blocked = agent.filter(row => BLOCKED.has(rowStatus(row)));
  const done = agent.filter(row => DONE.has(rowStatus(row)));
  const values = {
    '#today-running-count': running.length,
    '#today-owner-count': owner.length,
    '#today-blocked-count': blocked.length,
    '#today-done-count': done.length
  };
  Object.entries(values).forEach(([selector,value]) => { const node=q(selector); if(node) node.textContent=String(value); });
  renderRows(q('#today-running'), running, 'No autonomous work is currently confirmed as running.');
  renderRows(q('#today-needs-you'), owner.concat(blocked), 'Nothing in the synced AgentOS projection currently needs your decision.');
}
async function loadToday() {
  const status = q('#today-runtime-status');
  try {
    const [workstreams, board, priorityData] = await Promise.all([
      fetchJson('/api/workspace-workstreams'),
      fetchJson('/api/workspace-board').catch(() => ({rows:[]})),
      fetch('/workspace/priorities.json',{cache:'no-store'}).then(r => r.json())
    ]);
    const combined = [...(workstreams.rows || []), ...(board.rows || []).map(normalizeBoard)];\n    const seen = new Set();\n    const rows = combined.filter(row => { const key = [row.product,row.title,row.status].map(value => String(value || '').toLowerCase()).join('|'); if (seen.has(key)) return false; seen.add(key); return true; });
    setStats(rows);
    renderObjective(priorityData.priorities || [], rows);
    if (status) status.textContent = 'Live from Workspace + AgentOS projection';
    return true;
  } catch (error) {
    if (error.status === 401) {
      if (status) status.textContent = 'Unlock Workspace to load today';
      return false;
    }
    if (status) status.textContent = 'Today view unavailable';
    return false;
  }
}
function mountCapture() {
  const form = q('#today-capture-form');
  const input = q('#today-capture-input');
  const status = q('#today-capture-status');
  if (!form || !input) return;
  renderCaptureQueue();
  form.addEventListener('submit', event => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    const bucket = classifyCapture(text);
    const items = readCapture();
    items.push({ text, bucket, created_at:new Date().toISOString() });
    writeCapture(items);
    renderCaptureQueue();
    input.value = '';
    if (status) status.textContent = 'Captured to ' + bucket + ' on this browser · not dispatched to AgentOS.';
    input.focus();
  });
}
function setDate() {
  const node = q('#today-date');
  if (node) node.textContent = new Intl.DateTimeFormat(undefined,{weekday:'long',month:'long',day:'numeric'}).format(new Date());
}
async function start() {
  setDate();
  mountCapture();
  if (await loadToday()) return;
  let attempts = 0;
  const timer = setInterval(async () => {
    attempts += 1;
    if (await loadToday() || attempts >= 30) clearInterval(timer);
  }, 1500);
}
start();
