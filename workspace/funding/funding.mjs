import {actionState, LIFECYCLE, VIEWS, ranked, inView, sourceKey} from './model.mjs';
const PROFILE_KEY = 'ashwood.funding.profile.v1';
const STATUS_KEY = 'ashwood.funding.status.v1';
const SEEN_KEY = 'ashwood.funding.seen.v1';
const PROFILE_OPTIONS = [
  ['southern_california','Southern California resident'],
  ['los_angeles','Los Angeles / LA County'],
  ['veteran','Veteran / military-connected'],
  ['reservist','Army Reserve service'],
  ['housing_risk','Housing instability'],
  ['financial_emergency','Documented financial emergency'],
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
  ['noncash','Non-cash'],
  ['training','Training / stipends'],
  ['zero_interest','0% financing'],
  ['scholarship','Scholarships']
];


const escapeHtml = (value='') => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const readJson = (key, fallback={}) => { try { return JSON.parse(localStorage.getItem(key) || '') || fallback; } catch { return fallback; } };
const writeJson = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
let registry = {opportunities:[]};
let profile = readJson(PROFILE_KEY, {}), statuses = readJson(STATUS_KEY, {});
let seenAt = readJson(SEEN_KEY,null), typeFilter='all', view='action', search='';
const list = values => (values || []).map(x => `<li>${escapeHtml(x)}</li>`).join('');
const label = value => String(value || '').replaceAll('_',' ');
const safeLink = value => sourceKey(value) ? value : '#';
function save(key,value) {
  if (!writeJson(key,value)) document.querySelector('#funding-registry-state').textContent='Changes not saved: browser storage unavailable';
}
function updateAction(id,patch) {
  const item=registry.opportunities.find(x=>x.id===id);
  const previous=actionState(item,statuses);
  statuses[id]={...previous,...patch,updated_at:new Date().toISOString(),history:[...(previous.history || []),{at:new Date().toISOString(),...patch}].slice(-50)};
  save(STATUS_KEY,statuses); render();
}
function renderProfile() {
  const rules=new Map(PROFILE_OPTIONS);
  for(const item of registry.opportunities) for(const rule of item.eligibility_rules || []) for(const key of rule.any || [rule.fact]) if(!rules.has(key)) rules.set(key,label(key));
  rules.set('repayment_capacity','Loan repayment capacity confirmed');
  rules.set('assistance_coordination_confirmed','Other-assistance coordination confirmed');
  const host=document.querySelector('#funding-profile-options');
  const chip=([id,text])=>`<label class="funding-profile-chip"><span>${escapeHtml(text)}</span><select data-profile="${escapeHtml(id)}" aria-label="${escapeHtml(text)}"><option value="unknown" ${profile[id]===undefined?'selected':''}>Unknown</option><option value="yes" ${profile[id]===true?'selected':''}>Confirmed yes</option><option value="no" ${profile[id]===false?'selected':''}>Confirmed no</option></select></label>`;
  const basic=new Set(PROFILE_OPTIONS.map(([id])=>id));
  host.innerHTML=[...rules].filter(([id])=>basic.has(id)).map(chip).join('')+'<details class="funding-profile-more"><summary>Confirm required eligibility facts</summary><div class="funding-profile-options">'+[...rules].filter(([id])=>!basic.has(id)).map(chip).join('')+'</div></details>';
  host.querySelectorAll('[data-profile]').forEach(input=>input.addEventListener('change',()=>{
    if(input.value==='unknown') delete profile[input.dataset.profile]; else profile[input.dataset.profile]=input.value==='yes';
    save(PROFILE_KEY,profile); render();
  }));
}
function renderFilters() {
  for(const [selector,values,key,current] of [['#funding-type-filters',TYPES,'type',typeFilter],['#funding-view-filters',VIEWS,'view',view]]) {
    const host=document.querySelector(selector);
    host.innerHTML=values.map(([id,text])=>`<button type="button" data-${key}="${id}" aria-pressed="${id===current}">${text}</button>`).join('');
    host.querySelectorAll(`[data-${key}]`).forEach(button=>button.addEventListener('click',()=>{
      if(key==='type') typeFilter=button.dataset.type; else view=button.dataset.view;
      renderFilters(); render();
    }));
  }
}
function render() {
  const all=ranked(registry.opportunities,profile,statuses);
  const counts=[['action','action needed'],['consult','needs consultation'],['progress','in progress'],['new','new / unverified']];
  document.querySelector('#funding-summary').innerHTML=counts.map(([v,text])=>`<article><strong>${all.filter(e=>inView(e,v,seenAt)).length}</strong><span>${text}</span></article>`).join('');
  const q=search.trim().toLowerCase();
  const items=all.filter(e=>inView(e,view,seenAt) && (typeFilter==='all' || e.item.type===typeFilter) && (!q || JSON.stringify(e.item).toLowerCase().includes(q)));
  document.querySelector('#funding-visible-count').textContent=`${items.length} shown · one registry · profile matches are not provider approval`;
  const host=document.querySelector('#funding-list');
  host.innerHTML=items.map(e=>{
    const {item,action,fit}=e;
    return `<article tabindex="-1" class="funding-card" data-opportunity="${escapeHtml(item.id)}">
      <div class="funding-card__top"><div><p class="funding-card__meta">${escapeHtml(item.funder)} · ${escapeHtml(label(item.type))}</p><h3>${escapeHtml(item.name)}</h3></div><span class="funding-match">${e.disposition} · ${escapeHtml(label(action.status))}</span></div>
      <p class="funding-value">${escapeHtml(item.value)}</p>
      <p>${escapeHtml(e.reason)}</p>
      <dl class="funding-facts"><div><dt>Source evidence</dt><dd>${e.fresh?'Current official program evidence':'Unverified / needs recheck'} · ${escapeHtml(item.last_verified_at || 'Never verified')}</dd></div><div><dt>Deadline / window</dt><dd>${escapeHtml(item.deadline || item.application_window || 'Not stated; confirm with provider')}</dd></div><div><dt>Cost / burden</dt><dd>${item.repayable===true?'Repayable':item.repayable===false?'Non-repayable support':'Repayment terms unknown'} · ${escapeHtml(item.effort || 'unknown')} effort</dd></div></dl>
      <div class="funding-columns"><div><h4>Is it applicable?</h4><p>${escapeHtml(label(fit.state))} — ${escapeHtml(item.confidence || 'unknown confidence')}</p><ul>${list([...fit.failed,...fit.unknown,...(item.unknowns || [])])}</ul></div><div><h4>What the source requires</h4><ul>${list(item.criteria)}</ul></div></div>
      <p class="funding-next"><strong>Next:</strong> ${escapeHtml(e.next_action)}</p>
      <details><summary>Evidence, documents and changes</summary><ul>${list(item.documents)}</ul><p>Other assistance: ${escapeHtml((item.benefit_interactions || []).join(' '))}</p><p>Time to funding: ${escapeHtml(item.time_to_funding_days == null ? 'Unknown; confirm with provider' : item.time_to_funding_days+' days')}</p><p>Interest: ${escapeHtml(item.interest_percent == null ? 'Unknown / not applicable' : item.interest_percent+'%')} · Fees: ${escapeHtml(item.fees ?? 'Unknown / not applicable')}</p>
      ${(item.evidence || []).map(x=>`<p><a href="${escapeHtml(safeLink(x.url))}" target="_blank" rel="noopener">Official evidence ↗</a> · ${escapeHtml(x.checked_at)}<br>${escapeHtml(x.summary)}</p>`).join('')}
      ${(item.changes || []).map(c=>`<p>${escapeHtml(c.at)} · ${escapeHtml(c.field)}: ${escapeHtml(JSON.stringify(c.before))} → ${escapeHtml(JSON.stringify(c.after))}</p>`).join('')}
      <p>Priority factors: ${escapeHtml(Object.entries(e.parts).filter(([,n])=>n).map(([k,n])=>k+': '+n).join(' · '))}</p></details>
      <form data-action="${escapeHtml(item.id)}" class="funding-action-form"><label>Progress<select name="status">${LIFECYCLE.map(value=>`<option value="${value}" ${action.status===value?'selected':''}>${escapeHtml(label(value))}</option>`).join('')}</select></label>
      <label>Owner choice<select name="disposition"><option value="">Use evidence recommendation</option>${['HOLD','SKIP'].map(value=>`<option value="${value}" ${action.disposition===value?'selected':''}>${value}</option>`).join('')}</select></label>
      <label>Next action<input name="next_action" maxlength="1500" value="${escapeHtml(action.next_action || '')}" placeholder="${escapeHtml(e.next_action)}"></label><label>Action deadline<input name="action_deadline" type="date" value="${escapeHtml(action.action_deadline || '')}"></label><label>Outcome / reason<textarea name="outcome" maxlength="3000">${escapeHtml(action.outcome || '')}</textarea></label><button type="submit">Save action</button></form>
      <div class="funding-card__actions"><a href="${escapeHtml(safeLink(item.source_url))}" target="_blank" rel="noopener">${escapeHtml(item.source_label)} ↗</a><small>Actions and outcomes are private to this browser.</small></div>
    </article>`;
  }).join('') || '<p class="funding-empty">No records in this view. Try All or Watching to see pending verification.</p>';
  host.querySelectorAll('[data-action]').forEach(form=>form.addEventListener('submit',event=>{
    event.preventDefault(); const values=Object.fromEntries(new FormData(form));
    updateAction(form.dataset.action,{...values,reason:values.outcome || null,completed_at:['AWARDED','DENIED','COMPLETED','CLOSED','DECLINED'].includes(values.status)?new Date().toISOString():null});
  }));
}
async function loadRegistry() {
  const state=document.querySelector('#funding-registry-state'), stamp=document.querySelector('#funding-registry-time');
  state.textContent='Refreshing';
  try {
    const res=await fetch('/workspace/funding/opportunities.json?ts='+Date.now(),{cache:'no-store'});
    if(!res.ok) throw new Error('Registry unavailable');
    registry=await res.json();
    const requested=new URLSearchParams(location.search).get('funding_opportunity');
    if(requested && registry.opportunities.some(item=>item.id===requested)) {view='all';typeFilter='all';search='';renderFilters();}
    renderProfile(); render();
    if(requested) {
      const card=[...document.querySelectorAll('[data-opportunity]')].find(node=>node.dataset.opportunity===requested);
      if(card) {card.scrollIntoView({block:'center'});card.focus({preventScroll:true});}
    }
    state.textContent='Loaded'; stamp.textContent=`Registry updated ${registry.generated_at}. Reloading does not verify upstream sources.`;
  } catch(error) {state.textContent='Unavailable';stamp.textContent=error.message;}
}
async function start() {
  const response=await fetch('/api/workspace-auth',{credentials:'same-origin'});
  if(!response.ok) throw new Error('Workspace authentication unavailable');
  const status=await response.json();
  if(!status.authenticated) {location.replace('/workspace/');return;}
  renderFilters();
  document.querySelector('#funding-search').addEventListener('input',event=>{search=event.target.value;render();});
  document.querySelector('#funding-refresh').addEventListener('click',loadRegistry);
  document.querySelector('#funding-mark-reviewed').addEventListener('click',()=>{seenAt=new Date().toISOString();save(SEEN_KEY,seenAt);render();});
  await loadRegistry();
}
start().catch(error=>{document.querySelector('#funding-registry-state').textContent=error.message;});
