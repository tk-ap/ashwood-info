const $ = id => document.getElementById(id);
const viewNames = [['all','All work'],['issue','Issues'],['pr','Pull requests'],['task','Execution'],['checklist','Checklists'],['attention','Needs attention']];
const source = { github: null, board: null, failures: [] };
const filters = { view:'all', repo:'all', lane:'all', query:'', limit:80 };
let records = [];

function element(tag, cls, value) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (value !== undefined) node.textContent = String(value);
  return node;
}
function add(parent, tag, cls, value) {
  const node = element(tag, cls, value); parent.append(node); return node;
}
function normalizedUrl(s) { return String(s || '').replace(/\/+$/, '').toLowerCase(); }
function validLink(s) {
  try { const u = new URL(String(s || '')); return u.protocol === 'https:' && (u.hostname === 'github.com' || u.hostname.endsWith('.vercel.app')); }
  catch { return false; }
}
function repoOf(board) {
  const fromUrl = /^https:\/\/github\.com\/tk-ap\/([^/]+)\//i.exec(board.canonical_url || '');
  if (fromUrl) return fromUrl[1];
  const p = String(board.product || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (p === 'agentos') return 'agent-os';
  if (p === 'ashwood' || p === 'ashwoodinfo') return 'ashwood-info';
  if (p === 'ledgato') return 'ledgato';
  if (p === 'alvira') return 'ALVIRA';
  if (p === 'ailhat') return 'ailhat';
  return board.product || 'other';
}
function laneOf(row) { return String(row.execution?.lane || row.lane || '').toLowerCase(); }
function needsAttention(row) {
  return ['stuck','review','orphaned_pr','untriaged'].includes(laneOf(row))
    || ['blocked','failed','waiting_approval','needs_attention'].includes(String(row.execution?.status || row.status || '').toLowerCase());
}
function mergeSources() {
  const found = new Map();
  for (const row of source.github?.rows || []) found.set(normalizedUrl(row.url), { ...row, execution:null });
  for (const board of source.board?.rows || []) {
    const url = board.canonical_url || '';
    const key = normalizedUrl(url);
    if (key && found.has(key)) {
      found.get(key).execution = { lane:board.lane, status:board.status, assignee:board.assignee,
        next_gate:board.next_gate, blocker:board.blocker, observed_at:board.observed_at };
      continue;
    }
    const match = /^https:\/\/github\.com\/tk-ap\/([^/]+)\/(pull|issues)\/(\d+)\/?$/i.exec(url);
    const inferredType = match ? (match[2] === 'pull' ? 'pr' : 'issue') : 'task';
    const item = {
      id: board.board_key || board.task_id || ('snapshot:' + found.size),
      repo: repoOf(board), type:inferredType, title:board.title || 'Untitled work',
      url:validLink(url) ? url : null, number: match ? Number(match[3]) : null,
      status:board.status || 'unknown', labels:[], checklist:{ total:0, completed:0, items:[] },
      updated_at:board.updated_at, assignee:board.assignee, source:'agentos-mirror',
      execution:{ lane:board.lane, status:board.status, assignee:board.assignee,
        next_gate:board.next_gate, blocker:board.blocker, observed_at:board.observed_at }
    };
    if (!found.has(key || item.id)) found.set(key || item.id, item);
  }
  records = [...found.values()].sort((a,b) => {
    const delta = Number(needsAttention(b)) - Number(needsAttention(a));
    return delta || (Date.parse(b.updated_at || 0) || 0) - (Date.parse(a.updated_at || 0) || 0);
  });
}
function when(date) {
  const value = Date.parse(String(date || ''));
  if (!Number.isFinite(value)) return 'time unknown';
  return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(new Date(value));
}
function metric(parent,label,number) {
  const block=add(parent,'div','work-register-metric');
  add(block,'strong','',number);
  add(block,'span','',label);
}
function refreshSummary() {
  const host=$('register-metrics'); host.replaceChildren();
  const subset=records.filter(row => filters.repo==='all' || row.repo.toLowerCase()===filters.repo.toLowerCase());
  metric(host,'Issues',subset.filter(x=>x.type==='issue').length);
  metric(host,'Pull requests',subset.filter(x=>x.type==='pr').length);
  metric(host,'Execution records',subset.filter(x=>x.type==='task').length);
  metric(host,'Unchecked items',subset.reduce((sum,x)=>sum + Math.max(0,(x.checklist?.total||0)-(x.checklist?.completed||0)),0));
}
function coverage() {
  const host=$('register-coverage'); host.replaceChildren();
  if (source.github) {
    const c=source.github;
    const full=c.completeness === 'bounded';
    add(host,'p',full?'':'is-warning',
      'GitHub: ' + (full?'Up to date within the bounded API window':'Coverage incomplete') +
      ' · ' + (c.authenticated_upstream?'Authenticated upstream':'No configured GitHub read credential') +
      ' · ' + when(c.observed_at));
    if (!full) add(host,'p','','Counts are observed only, not exhaustive. Missing private repositories and results beyond the page limit are not counted.');
    for (const status of c.coverage || []) {
      if (status.status !== 'ok') add(host,'p','is-warning',status.repo + ': ' + status.status + (status.reason ? ' (' + status.reason + ')' : ''));
    }
  } else add(host,'p','is-warning','GitHub source not available. Mirror records are not a complete list of open issues or PRs.');
  if (source.board?.observed_at) add(host,'p','','Agent OS projection observed ' + when(source.board.observed_at) + ' (not a real-time lease check).');
  else add(host,'p','is-warning','Agent OS projection not available; live execution status is unknown.');
  for (const f of source.failures) add(host,'p','is-warning',f);
}
function matches(row) {
  if (filters.repo !== 'all' && String(row.repo).toLowerCase() !== filters.repo.toLowerCase()) return false;
  if (filters.view === 'issue' && row.type !== 'issue') return false;
  if (filters.view === 'pr' && row.type !== 'pr') return false;
  if (filters.view === 'task' && row.type !== 'task') return false;
  if (filters.view === 'checklist' && !(row.checklist?.total > 0)) return false;
  if (filters.view === 'attention' && !needsAttention(row)) return false;
  if (filters.lane !== 'all' && laneOf(row) !== filters.lane) return false;
  const text=[row.title,row.repo,row.number,row.assignee,row.execution?.assignee,row.status,row.execution?.blocker,row.execution?.next_gate,...(row.labels||[])].join(' ').toLowerCase();
  if (filters.query && !text.includes(filters.query.toLowerCase().trim())) return false;
  return true;
}
function renderItem(row) {
  const card=element('article','work-register-item');
  const head=add(card,'div','work-register-item__eyebrow');
  add(head,'span','',row.repo);
  add(head,'span','',row.type==='pr'?'Pull request':row.type==='issue'?'Issue':'Execution');
  if (row.number) add(head,'span','','#'+row.number);
  if (row.source==='agentos-mirror') add(head,'span','','Mirror only');
  const title=element('h3');
  if (row.url && validLink(row.url)) {
    const link=add(title,'a','',row.title);
    link.href=row.url;link.target='_blank';link.rel='noopener noreferrer';
  } else title.textContent=row.title;
  card.append(title);
  const meta=add(card,'div','work-register-item__meta');
  add(meta,'span','', 'Updated ' + when(row.updated_at));
  if (row.assignee || row.execution?.assignee) add(meta,'span','','Owner ' + (row.assignee || row.execution.assignee));
  if (row.labels?.length) add(meta,'span','',row.labels.slice(0,3).join(' / '));
  if (row.execution?.blocker) add(card,'p','work-register-item__meta','Blocker: ' + row.execution.blocker);
  else if (row.execution?.next_gate) add(card,'p','work-register-item__meta','Next: ' + row.execution.next_gate);
  if (row.checklist?.total > 0) {
    const detail=add(card,'details','work-register-checklist');
    const openCount=row.checklist.total-row.checklist.completed;
    add(detail,'summary','',row.checklist.completed + ' / ' + row.checklist.total + ' checklist items complete · ' + openCount + ' open');
    const ul=add(detail,'ul');
    for (const item of row.checklist.items || []) {
      const li=add(ul,'li');
      const input=add(li,'input');input.type='checkbox';input.disabled=true;input.checked=Boolean(item.complete);input.setAttribute('aria-label',item.complete?'Complete':'Not complete');
      add(li,'span','',item.label);
    }
    if (row.checklist.truncated) add(detail,'p','','More items in the source issue/PR.');
  }
  const foot=add(card,'div','work-register-item__foot');
  const status=String(row.execution?.status || row.status || 'unknown');
  add(foot,'span','work-register-item__state',status);
  add(foot,'span','',row.execution?.lane?'Agent OS · '+row.execution.lane:row.source==='github'?'GitHub source':'Agent OS snapshot');
  return card;
}
function render() {
  refreshSummary();
  const matching=records.filter(matches);
  $('register-summary').textContent='Showing '+Math.min(matching.length,filters.limit)+' of '+matching.length+' matching entries · '+records.length+' observed records';
  const host=$('register-records');host.replaceChildren();
  if (!matching.length) add(host,'p','work-register-empty',records.length?'No work matches these filters.':'No source-backed records available. Check the source-coverage note above.');
  for (const row of matching.slice(0,filters.limit)) host.append(renderItem(row));
  const more=$('register-more');more.hidden=matching.length<=filters.limit;
  if (!more.hidden) more.textContent='Show more ('+(matching.length-filters.limit)+' remaining)';
}
function initFilters() {
  const tabs=$('register-tabs');
  for (const [id,name] of viewNames) {
    const b=add(tabs,'button','',name);
    b.type='button';b.dataset.view=id;
    b.addEventListener('click',()=>{filters.view=id;filters.limit=80;updateTabs();render();});
  }
  updateTabs();
  $('register-repo').addEventListener('change',e=>{filters.repo=e.target.value;filters.limit=80;render();});
  $('register-lane').addEventListener('change',e=>{filters.lane=e.target.value;filters.limit=80;render();});
  $('register-search').addEventListener('input',e=>{filters.query=e.target.value;filters.limit=80;render();});
  $('register-refresh').addEventListener('click',load);
  $('register-more').addEventListener('click',()=>{filters.limit+=80;render();});
}
function updateTabs() {
  for (const btn of $('register-tabs').querySelectorAll('button')) btn.setAttribute('aria-pressed',String(btn.dataset.view===filters.view));
}
async function get(path) {
  const response=await fetch(path,{credentials:'same-origin',cache:'no-store'});
  if (!response.ok) throw new Error(response.status===401?'Workspace locked · sign in at /workspace/':path+' unavailable ('+response.status+')');
  return response.json();
}
async function load() {
  $('register-refresh').disabled=true;
  $('register-freshness').textContent='Refreshing source observations…';
  source.failures=[];
  const [github,board]=await Promise.allSettled([get('/api/workspace-work-register'),get('/api/workspace-agentos')]);
  source.github=github.status==='fulfilled'?github.value:null;
  source.board=board.status==='fulfilled'?board.value:null;
  if(github.status==='rejected') source.failures.push(github.reason.message);
  if(board.status==='rejected') source.failures.push(board.reason.message);
  mergeSources();coverage();render();
  $('register-freshness').textContent='Last read '+new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit'}).format(new Date())+' · '+(source.failures.length?'partial availability':'source observations loaded');
  $('register-refresh').disabled=false;
}
initFilters();load();
