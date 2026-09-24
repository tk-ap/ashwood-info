const qs = s => document.querySelector(s);
const esc = (v='') => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const now = Date.now();
const DAY = 86400000;

async function getJson(url){
  try{
    const res = await fetch(url,{credentials:'same-origin',cache:'no-store'});
    if(!res.ok) throw new Error(`${url} ${res.status}`);
    return await res.json();
  }catch(error){ return {__error:error.message}; }
}

function withinDays(value, days=14){
  const t = Date.parse(value || '');
  return Number.isFinite(t) && (now - t) <= days*DAY && (now - t) >= 0;
}

function phaseForWorkstream(row={}){
  const text = `${row.status||''} ${row.stage||''} ${row.next_gate||''} ${row.summary||''}`.toLowerCase();
  if(/review|verify|test|qa|proof|security|validation/.test(text)) return 'VERIFY';
  if(/approval|decision|choose|accept|reject/.test(text)) return 'DECIDE';
  if(/feedback|observe|research|evidence|partner|user/.test(text)) return 'OBSERVE';
  if(/share|threads|publish|dispatch|post/.test(text)) return 'SHARE';
  if(/build|implement|develop|ship|merge|code|active|running|in_progress/.test(text)) return 'BUILD';
  return 'USE';
}

async function main(){
  const [checklist, workstreams, state] = await Promise.all([
    getJson('/api/workspace-checklist'),
    getJson('/api/workspace-workstreams'),
    getJson('/api/workspace-state')
  ]);

  const buckets = {BUILD:0,VERIFY:0,USE:0,OBSERVE:0,SHARE:0,'CREATE/LIVE':0};
  const evidence = [];
  const debt = [];

  const rows = Array.isArray(workstreams.rows) ? workstreams.rows : [];
  for(const row of rows){
    const phase = phaseForWorkstream(row);
    if(phase in buckets) buckets[phase] += 1;
    evidence.push({title:`${row.product||'Workstream'} · ${phase}`,detail:row.next_gate || row.summary || row.status || 'Current workstream projection'});
  }

  const autoItems = Array.isArray(checklist.auto_items) ? checklist.auto_items : [];
  const reviewed = new Set(checklist.deployment_completed_items || []);
  const started = checklist.review_started || {};
  const productionItems = autoItems.filter(item => String(item.id||'').startsWith('deploy:'));
  const pendingProduction = productionItems.filter(item => !reviewed.has(item.id));
  buckets.VERIFY += pendingProduction.length;
  const startedPending = pendingProduction.filter(item => started[item.id]);
  buckets.USE += startedPending.length;
  pendingProduction.slice(0,6).forEach(item => debt.push({title:item.label || 'Production review pending',detail:started[item.id] ? 'Live review started; explicit approval still pending.' : 'Shipped to production but owner live-use review has not started.',phase:started[item.id] ? 'USE' : 'VERIFY'}));
  if(pendingProduction.length) evidence.push({title:`${pendingProduction.length} production review item${pendingProduction.length===1?'':'s'} pending`,detail:`${startedPending.length} have been opened for live review.`});

  const completedBase = new Set(checklist.completed_items || []);
  const observationSignals = [...completedBase].filter(id => /feedback|evidence|reasoning|assumption|experiment|judgment|attention/.test(id)).length;
  buckets.OBSERVE += observationSignals;
  const shareSignals = [...completedBase].filter(id => /share|thread|dispatch|post|worth/.test(id)).length;
  buckets.SHARE += shareSignals;

  const rawState = state && typeof state === 'object' ? state : {};
  const possibleEntries = [rawState.evidence, rawState.events, rawState.activity, rawState.entries].flat().filter(Array.isArray).flat();
  const recentCreative = possibleEntries.filter(item => withinDays(item?.date || item?.created_at || item?.updated_at,14) && /music|model|photo|art|poetry|writing|creative|relationship|life/i.test(`${item?.goal||''} ${item?.title||''} ${item?.type||''}`));
  buckets['CREATE/LIVE'] += recentCreative.length;
  if(recentCreative.length) evidence.push({title:`${recentCreative.length} recent creative/life signal${recentCreative.length===1?'':'s'}`,detail:'Derived from available Workspace state in the last 14 days.'});
  else evidence.push({title:'CREATE/LIVE evidence is quiet',detail:'Workspace does not currently have a reliable recent creative/life signal. Quiet is not automatically neglect.'});

  const total = Object.values(buckets).reduce((a,b)=>a+b,0);
  const ranked = Object.entries(buckets).sort((a,b)=>b[1]-a[1]);
  const [heavy, heavyCount] = ranked[0];
  const [quiet, quietCount] = ranked.at(-1);

  let recommendation = 'Keep moving through the current loop; no strong imbalance is visible from the available evidence.';
  if(pendingProduction.length){
    recommendation = `You have ${pendingProduction.length} shipped change${pendingProduction.length===1?'':'s'} still carrying verification/use debt. Best next action: review the oldest pending production change before starting another feature.`;
  } else if(total && heavyCount >= Math.max(3, quietCount + 2)){
    recommendation = `You are ${heavy.toLowerCase()}-heavy relative to the available evidence. Feed ${quiet.toLowerCase()} next unless there is a deliberate reason not to.`;
  } else if(rows.length===0){
    recommendation = 'No active workstream projection is available. Do not manufacture a balance story; restore canonical workstream sync first.';
  }

  qs('#cycle-recommendation').textContent = recommendation;

  qs('#cycle-buckets').innerHTML = Object.entries(buckets).map(([name,count])=>{
    const klass = count===heavyCount && count>0 ? 'is-heavy' : count===quietCount ? 'is-quiet' : '';
    return `<article class="cycle-bucket ${klass}"><div><small>${esc(name)}</small><strong>${count}</strong></div><p>${count ? 'Visible evidence/signals in the current operating window.' : 'No reliable signal detected from connected Workspace state.'}</p></article>`;
  }).join('');

  qs('#cycle-debt-list').innerHTML = debt.length ? debt.map(item=>`<article class="cycle-row"><h3>${esc(item.title)}</h3><p>${esc(item.detail)}</p><span class="cycle-phase">${esc(item.phase)}</span></article>`).join('') : '<p class="cycle-empty">No production verification/use debt detected from the checklist.</p>';

  qs('#cycle-products-list').innerHTML = rows.length ? rows.map(row=>{ const phase=phaseForWorkstream(row); return `<article class="cycle-row"><h3>${esc(row.product || row.title || 'Workstream')}</h3><p>${esc(row.next_gate || row.summary || 'No next gate published.')}</p><span class="cycle-phase">${esc(phase)}</span></article>`; }).join('') : '<p class="cycle-empty">No canonical workstreams are currently synced.</p>';

  const sourceErrors = [checklist.__error && `Checklist unavailable: ${checklist.__error}`,workstreams.__error && `Workstreams unavailable: ${workstreams.__error}`,state.__error && `Workspace state unavailable: ${state.__error}`].filter(Boolean);
  const allEvidence = [...evidence,...sourceErrors.map(detail=>({title:'Source unavailable',detail}))];
  qs('#cycle-evidence-list').innerHTML = allEvidence.length ? allEvidence.map(item=>`<article class="cycle-evidence-item"><strong>${esc(item.title)}</strong><span>${esc(item.detail)}</span></article>`).join('') : '<p class="cycle-empty">Not enough evidence to explain a recommendation.</p>';

  try{ localStorage.setItem('ashwood-cycle-snapshot',JSON.stringify({at:new Date().toISOString(),recommendation,buckets,pending:pendingProduction.length})); }catch{}
}

main();
