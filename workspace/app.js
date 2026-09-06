import { renderOverview } from './overview.mjs';
import { renderFrame, mountCheckin } from './frame.mjs';
(() => {
  'use strict';

  const USER = 'tk-ap';
  const DAY = 86400000;
  const PRODUCT_ROLES = {
    ALVIRA: { label: 'ALVIRA', type: 'Context Intelligence', goal: 'ownership' },
    ailhat: { label: 'ailhat', type: 'Portfolio Intelligence', goal: 'ownership' },
    ledgato: { label: 'LEDGATo', type: 'Execution Intelligence', goal: 'ownership' },
    'agent-os': { label: 'agent-os', type: 'Workforce infrastructure', goal: 'learning' },
    'ashwood-info': { label: 'ASHWOOD', type: 'Creative practice & build archive', goal: 'leadership' },
    'tk-ap.github.io': { label: 'ASHWOOD', type: 'Human / creative operating layer', goal: 'leadership' },
    'alvira-bridge': { label: 'ALVIRA Bridge', type: 'ALVIRA feature infrastructure', goal: 'ownership' }
  };

  let GOALS = [];
  let goalModel = null;
  const state = { repos: [], githubEvidence: [], persistedEvidence: [], overrides: {}, ailhat: null, filter: 'all', selectedGoal: null, lastRefresh: null, error: null };
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  function escapeHtml(v='') { return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function daysSince(d) { const t = new Date(d).getTime(); return Number.isFinite(t) ? Math.max(0, Math.floor((Date.now()-t)/DAY)) : 999; }
  function shortDate(d) { const x = new Date(d); return Number.isNaN(x.getTime()) ? 'Unknown' : x.toLocaleDateString(undefined,{month:'short',day:'numeric'}); }
  function relativeDate(d) { const n=daysSince(d); return n===0?'today':n===1?'yesterday':n<14?`${n}d ago`:shortDate(d); }

  async function api(path, options={}) {
    const res = await fetch(path, { credentials:'same-origin', headers:{'Content-Type':'application/json', ...(options.headers||{})}, ...options });
    const body = await res.json().catch(()=>({}));
    if (!res.ok) { const err = new Error(body.error || `Request failed (${res.status})`); err.status=res.status; throw err; }
    return body;
  }

  async function ensureAuth() {
    const status = await api('/api/workspace-auth');
    if (status.authenticated) return true;
    return new Promise(resolve => {
      const wrap = document.createElement('div');
      wrap.id='workspace-auth-gate';
      wrap.innerHTML = `<style>#workspace-auth-gate{position:fixed;inset:0;z-index:9999;background:#f5f3ef;display:grid;place-items:center;padding:24px;color:#171713}#workspace-auth-gate form{width:min(520px,100%);border:1px solid rgba(23,23,19,.2);padding:clamp(24px,5vw,48px);background:#f9f7f2}#workspace-auth-gate h1{font-size:clamp(34px,6vw,64px);margin:0 0 12px;font-weight:500;letter-spacing:-.04em}#workspace-auth-gate p{line-height:1.6}#workspace-auth-gate label{display:block;margin:18px 0;font-size:12px;text-transform:uppercase;letter-spacing:.08em}#workspace-auth-gate input{display:block;width:100%;box-sizing:border-box;margin-top:8px;padding:13px;border:1px solid rgba(23,23,19,.3);background:transparent;font:inherit}#workspace-auth-gate button{padding:12px 18px;border:1px solid #171713;background:#171713;color:#f5f3ef;cursor:pointer}.auth-error{color:#8b2d23;min-height:1.5em}</style><form><p class="eyebrow">ASHWOOD · PRIVATE WORKSPACE</p><h1>${status.configured?'Unlock workspace':'Finish private setup'}</h1><p>${status.configured?'Enter your workspace passphrase. Return using the Workspace link at the bottom of ASHWOOD, or bookmark this page.':'Use the one-time setup token from this chat, then choose a passphrase. The passphrase is stored only as a one-way hash.'}</p>${status.configured?'':`<label>Setup token<input name="bootstrap" autocomplete="off" required></label>`}<label>Passphrase<input name="passphrase" type="password" autocomplete="current-password" minlength="12" required></label><p class="auth-error" aria-live="polite"></p><button type="submit">${status.configured?'Unlock':'Create private workspace'}</button></form>`;
      document.body.appendChild(wrap);
      $('.workspace-shell').inert=true;
      wrap.querySelector('input').focus();
      wrap.querySelector('form').addEventListener('submit', async e => {
        e.preventDefault(); const fd=new FormData(e.currentTarget); const error=wrap.querySelector('.auth-error'); error.textContent='';
        try {
          await api('/api/workspace-auth',{method:'POST',body:JSON.stringify({action:status.configured?'login':'setup',passphrase:fd.get('passphrase'),bootstrap:fd.get('bootstrap')})});
          wrap.remove(); $('.workspace-shell').inert=false; resolve(true);
        } catch(err) { error.textContent=err.message; }
      });
    });
  }

  async function loadGoalModel() {
    goalModel = await fetch('/workspace/goals.json',{cache:'no-store'}).then(r=>r.json());
    GOALS = goalModel.goals || [];
    const kicker = $('.goals .section-kicker');
    if (kicker) kicker.textContent = 'Saturn frame';
    const note = $('#goal-source-note');
    if (note) note.textContent = goalModel.source_note;
    renderFrame(goalModel);
    mountCheckin(goalModel);
  }

  async function loadPersistentState() {
    const data = await api('/api/workspace-state');
    state.persistedEvidence = (data.evidence||[]).map(x=>({ id:x.id, source:x.source, sourceLabel:x.source_label, title:x.title, date:x.occurred_at, status:x.status, goal:x.goal_id, secondaryGoals:x.secondary_goals||[], confidence:Number(x.confidence||1), url:x.url, notes:x.notes }));
    state.overrides = data.overrides || {};
  }

  async function github(path) {
    const r=await fetch(`https://api.github.com${path}`,{headers:{Accept:'application/vnd.github+json'}}); if(!r.ok) throw new Error(`GitHub ${r.status}`); return r.json();
  }
  function isEcosystemRepo(repo) { if(PRODUCT_ROLES[repo.name]) return true; const h=`${repo.name} ${repo.description||''} ${(repo.topics||[]).join(' ')}`.toLowerCase(); return ['alvira','ailhat','ledgato','agent workforce','portfolio intelligence','context intelligence'].some(t=>h.includes(t)); }
  function goalForRepo(name) { if(PRODUCT_ROLES[name]?.goal) return PRODUCT_ROLES[name].goal; const lower=name.toLowerCase(); return GOALS.find(g=>(g.repo_hints||[]).some(h=>lower.includes(h.toLowerCase())))?.id || 'ownership'; }
  function secondaryGoals(name,msg) { const t=`${name} ${msg}`.toLowerCase(), out=[]; if(/docs|essay|dispatch|newsletter|field notes|poetry|writing/.test(t))out.push('writing'); if(/music|audio|song|record|track|sing/.test(t))out.push('music'); if(/portfolio|model|campaign|barely|digitals|casting/.test(t))out.push('modeling'); if(/learn|curriculum|reference|ai-from-zero|skill|agent-os/.test(t))out.push('learning'); if(/about|journal|build|publish|launch|site|workspace/.test(t))out.push('leadership'); return [...new Set(out)]; }

  async function loadGithubEvidence() {
    const repos=await github(`/users/${USER}/repos?per_page=100&sort=updated&type=owner`);
    state.repos=repos.filter(r=>!r.archived && isEcosystemRepo(r));
    const sets=await Promise.all(state.repos.slice(0,12).map(async repo=>{ try { const commits=await github(`/repos/${USER}/${encodeURIComponent(repo.name)}/commits?per_page=6`); return commits.map(commit=>({repo,commit})); } catch { return []; } }));
    state.githubEvidence=sets.flat().map(({repo,commit})=>{ const id=`gh:${repo.name}:${commit.sha}`, msg=String(commit.commit?.message||'Repository update').split('\n')[0], inferred=goalForRepo(repo.name); return { id,source:'github',sourceLabel:repo.name,title:msg,date:commit.commit?.author?.date||repo.pushed_at,status:'IN_PROGRESS',goal:state.overrides[id]||inferred,inferredGoal:inferred,secondaryGoals:secondaryGoals(repo.name,msg),confidence:PRODUCT_ROLES[repo.name] ? .88 : .65,url:commit.html_url }; }).filter(x=>daysSince(x.date)<=45);
  }

  async function loadAilhatEvidence() {
    try {
      const data=await fetch('https://ailhat.vercel.app/api/product-state',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject(new Error(`ailhat ${r.status}`)));
      state.ailhat=data;
    } catch { state.ailhat=null; }
  }

  function ailhatEvidence() {
    if(!state.ailhat?.ok) return [];
    const a=state.ailhat, items=[];
    const contractItems=a.workspace_evidence?.items || [];
    contractItems.forEach(item=>items.push({id:item.id||`ailhat:${item.kind}:${item.title}`,source:'ailhat',sourceLabel:item.product_id||'ailhat',title:item.title||item.kind||'Portfolio evidence',date:item.occurred_at||a.scan?.observed_at||null,status:item.status||'IN_PROGRESS',goal:(item.suggested_goal_ids||[])[0]||'ownership',secondaryGoals:(item.suggested_goal_ids||[]).slice(1),confidence:Number(item.confidence||.5),notes:item.next_action||'',url:'https://ailhat.vercel.app/'}));
    if(!contractItems.length && a.attention?.top_issue) items.push({id:'ailhat:attention',source:'ailhat',sourceLabel:'ailhat',title:`Portfolio signal: ${a.attention.top_issue}`,date:a.scan?.observed_at||null,status:'IN_PROGRESS',goal:'ownership',secondaryGoals:['leadership'],confidence:a.scan?.observed_at ? .9 : .55,notes:a.attention.top_next_action||'',url:'https://ailhat.vercel.app/'});
    return items.filter(item=>item.date);
  }

  function ailhatOpportunities() {
    if (!state.ailhat?.ok) return [];
    const a = state.ailhat, out = [];
    (a.work || []).forEach(w => out.push({
      kind: w.priority || 'WORK',
      title: w.title || 'Untitled work item',
      meta: [w.suggested_execution_mode, w.expected_product_impact, w.estimated_minutes ? `~${w.estimated_minutes}m` : null].filter(Boolean).join(' · '),
      url: 'https://ailhat.vercel.app/',
    }));
    if (a.attention?.top_issue) out.push({
      kind: a.attention.priority || 'ATTENTION',
      title: a.attention.top_issue,
      meta: a.attention.top_next_action || '',
      url: 'https://ailhat.vercel.app/',
    });
    return out;
  }

  function allEvidence() { return [...state.persistedEvidence,...ailhatEvidence(),...state.githubEvidence].map(x=>({...x,goal:state.overrides[x.id]||x.goal})).sort((a,b)=>new Date(b.date)-new Date(a.date)); }
  function weight(x){const age=daysSince(x.date),fresh=age<=2?1:age<=7?.82:age<=14?.58:age<=30?.32:.08,status=x.status==='COMPLETED'?1.15:x.status==='PLANNED'?.25:.8;return fresh*status*(x.confidence||1);}
  function goalStats(goal){const ev=allEvidence().filter(x=>x.goal===goal.id||x.secondaryGoals?.includes(goal.id)),recent=ev.filter(x=>daysSince(x.date)<=30),weighted=recent.reduce((s,x)=>s+weight(x)*(x.goal===goal.id?1:.35),0),momentum=Math.min(100,Math.round(weighted*22)),newest=ev[0]?.date||null;let status='IN_PROGRESS';if(!newest||daysSince(newest)>30)status='STALE';else if(daysSince(newest)>14||momentum<18)status='NEEDS_ATTENTION';return{ev,recent,momentum,newest,status};}

  function render() {
    const evidence=allEvidence(), last7=evidence.filter(x=>daysSince(x.date)<=7), moved=new Set(last7.flatMap(x=>[x.goal,...(x.secondaryGoals||[])])).size, active=state.repos.filter(r=>daysSince(r.pushed_at)<=14).length, needs=GOALS.filter(g=>['STALE','NEEDS_ATTENTION'].includes(goalStats(g).status)).length;
    $('#pulse-grid').innerHTML=[[moved,'goals with evidence · 7d'],[active,'active ecosystem repos · 14d'],[needs,'buckets needing review'],[state.persistedEvidence.length,'private evidence items']].map(([n,l])=>`<article class="pulse-card"><div class="pulse-number">${n}</div><div class="pulse-label">${l}</div></article>`).join('');
    renderOverview(GOALS, evidence, state.selectedGoal, selectGoal);
    const products=state.repos.map(r=>({name:PRODUCT_ROLES[r.name]?.label||r.name,type:PRODUCT_ROLES[r.name]?.type||'Discovered ecosystem repository',state:daysSince(r.pushed_at)<=7?'ACTIVE':daysSince(r.pushed_at)<=21?'QUIET':'STALE',pushedAt:r.pushed_at,url:r.html_url,description:r.description||''}));
    if(state.ailhat?.product) products.unshift({name:'ailhat intelligence',type:'Portfolio Intelligence contract',state:state.ailhat.product.attention_status||state.ailhat.product.state,pushedAt:state.ailhat.scan?.observed_at,url:'https://ailhat.vercel.app/api/product-state',description:`Readiness ${state.ailhat.product.readiness_score ?? 'unknown'} · ${state.ailhat.attention?.top_next_action||'No next action supplied'}`});
    $('#ecosystem-list').innerHTML=products.map(p=>`<article class="ecosystem-row"><div><a class="ecosystem-name" href="${escapeHtml(p.url)}" target="_blank" rel="noopener">${escapeHtml(p.name)} ↗</a><div class="ecosystem-commit">${escapeHtml(p.description)}</div></div><div class="ecosystem-type">${escapeHtml(p.type)}</div><div><span class="status-pill">${escapeHtml(p.state)}</span><div class="ecosystem-age">${p.pushedAt?relativeDate(p.pushedAt):'source timestamp unavailable'}</div></div></article>`).join('')||'<p class="empty-state">No project details available from the current sources.</p>';
    renderEvidence(); renderAttention(); renderNext();
    $('#as-of').textContent=`Refreshed ${new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}`;
    $('#live-state').textContent=state.error?state.error:`Private state + GitHub + ${state.ailhat?.ok?'ailhat':'ailhat unavailable'}`;
  }

  function renderEvidence(){const items=allEvidence().filter(x=>(state.filter==='all'||x.source===state.filter)&&(!state.selectedGoal||x.goal===state.selectedGoal||x.secondaryGoals?.includes(state.selectedGoal))).slice(0,60);$('#evidence-list').innerHTML=items.map(x=>`<article class="evidence-row"><div class="evidence-source">${escapeHtml(x.sourceLabel||x.source)}</div><div>${x.url?`<a class="evidence-title" href="${escapeHtml(x.url)}" target="_blank" rel="noopener">${escapeHtml(x.title)}</a>`:`<span class="evidence-title">${escapeHtml(x.title)}</span>`}<div class="evidence-meta">${escapeHtml(x.status)} · ${relativeDate(x.date)} · confidence ${Math.round((x.confidence||1)*100)}%</div></div><label class="evidence-goal">Goal<select data-override-id="${escapeHtml(x.id)}">${GOALS.map(g=>`<option value="${g.id}" ${g.id===x.goal?'selected':''}>${escapeHtml(g.name)}</option>`).join('')}</select></label></article>`).join('')||'<p class="section-note">No evidence in this filter.</p>'; $$('[data-override-id]').forEach(sel=>sel.addEventListener('change',()=>saveOverride(sel.dataset.overrideId,sel.value)));}

  function renderAttention(){const signals=[];GOALS.map(g=>({g,...goalStats(g)})).filter(x=>['STALE','NEEDS_ATTENTION'].includes(x.status)).forEach(x=>{const blind=['relationships','music','modeling','writing'].includes(x.g.id)&&!x.ev.some(e=>['manual','calendar','music','modeling'].includes(e.source));signals.push({kind:blind?'EVIDENCE GAP':x.status,goal:x.g.name,copy:blind?`Current automatic sources do not reliably observe ${x.g.name.toLowerCase()}. Missing evidence is not proof of neglect.`:`${x.g.name} has weak recent evidence relative to its stated priority.`});});const active14=state.repos.filter(r=>daysSince(r.pushed_at)<=14);if(active14.length>=6)signals.unshift({kind:'FOCUS CHECK',goal:'Visible Leadership',copy:`${active14.length} ecosystem repositories show activity in the last 14 days. Check whether that breadth is strengthening or fragmenting the public narrative.`});$('#attention-list').innerHTML=(signals.slice(0,6).length?signals:[{kind:'CLEAR',goal:'Workspace',copy:'No strong neglect or contradiction signal is supported by current evidence.'}]).map(s=>`<article class="attention-row"><span class="status-pill">${s.kind.replace('_',' ')}</span><div><strong>${escapeHtml(s.goal)}</strong><p>${escapeHtml(s.copy)}</p></div></article>`).join('');}

  function renderNext(){const opps=ailhatOpportunities();$('#opportunity-list').innerHTML=opps.length?opps.map(o=>`<article class="next-card opportunity"><p class="eyebrow">ailhat · ${escapeHtml(o.kind)}</p><h3>${escapeHtml(o.title)}</h3>${o.meta?`<p>${escapeHtml(o.meta)}</p>`:''}<a href="${escapeHtml(o.url)}" target="_blank" rel="noopener">Open in ailhat →</a></article>`).join(''):'<p class="section-note">No open opportunities from ailhat right now.</p>';const ranked=GOALS.map(g=>({g,...goalStats(g)})).sort((a,b)=>(a.momentum/a.g.priority)-(b.momentum/b.g.priority)),t=ranked[0],blind=['relationships','music','modeling','writing'].includes(t.g.id)&&!t.ev.some(e=>e.source==='manual');$('#next-action-card').innerHTML=`<article class="next-card"><p class="eyebrow">${escapeHtml(t.g.name)}</p><h3>${escapeHtml(blind?`Improve evidence before judging ${t.g.name.toLowerCase()}`:`Review the next active bet that materially advances ${t.g.name.toLowerCase()}`)}</h3><p>${escapeHtml(blind?'This bucket is under-observed by the current adapters. Add or connect one concrete piece of evidence rather than manufacturing a task from missing data.':`This bucket currently has the weakest evidence-weighted momentum relative to its priority (${t.momentum}/100).`)}</p></article>`;}

  async function saveOverride(id,goal){try{await api('/api/workspace-state',{method:'POST',body:JSON.stringify({action:'set_override',evidence_id:id,goal_id:goal})});state.overrides[id]=goal;const item=[...state.githubEvidence,...state.persistedEvidence].find(x=>x.id===id);if(item)item.goal=goal;render();}catch(e){alert(e.message);}}
  function fillGoalSelect(){const sel=$('#evidence-goal-input');sel.innerHTML=GOALS.map(g=>`<option value="${g.id}">${escapeHtml(g.name)}</option>`).join('');}
  async function addEvidence(e){e.preventDefault();try{await api('/api/workspace-state',{method:'POST',body:JSON.stringify({action:'add_evidence',title:$('#evidence-title-input').value,goal_id:$('#evidence-goal-input').value,status:$('#evidence-status-input').value,occurred_at:$('#evidence-date-input').value,notes:$('#evidence-source-input').value})});$('#evidence-dialog').close();e.target.reset();$('#evidence-date-input').value=new Date().toISOString().slice(0,10);await loadPersistentState();render();}catch(err){alert(err.message);}}
  async function refresh(){
    $('#refresh-evidence').disabled=true;
    $('#live-state').textContent='Refreshing…';
    const results=await Promise.allSettled([loadPersistentState(),loadGithubEvidence(),loadAilhatEvidence()]);
    state.error=results.filter(r=>r.status==='rejected').map(r=>r.reason.message).join(' · ')||null;
    state.lastRefresh=new Date(); render(); $('#refresh-evidence').disabled=false;
  }
  function selectGoal(id){
    state.selectedGoal=id;
    $('#evidence-selection').textContent=GOALS.find(g=>g.id===id)?.name||'All goals';
    $('#evidence-panel').open=true;
    renderOverview(GOALS,allEvidence(),id,selectGoal);renderEvidence();
    $('#evidence-panel').scrollIntoView({behavior:'instant',block:'start'});
    $('#evidence-panel summary').focus();
  }


  async function init(){await ensureAuth();
    $('#sign-out').addEventListener('click',async()=>{try{await api('/api/workspace-auth',{method:'POST',body:JSON.stringify({action:'logout'})});location.reload();}catch(e){$('#live-state').textContent=e.message;}});
    $('#clear-goal').addEventListener('click',()=>selectGoal(null));
    $$('[data-close-dialog]').forEach(b=>b.addEventListener('click',()=>$('#evidence-dialog').close()));
await loadGoalModel();fillGoalSelect();$('#evidence-date-input').value=new Date().toISOString().slice(0,10);$('#refresh-evidence').addEventListener('click',refresh);$('#add-evidence').addEventListener('click',()=>$('#evidence-dialog').showModal());$('#evidence-form').addEventListener('submit',addEvidence);$$('.filter').forEach(b=>b.addEventListener('click',()=>{$$('.filter').forEach(x=>{x.classList.remove('is-active');x.setAttribute('aria-pressed','false');});b.classList.add('is-active');b.setAttribute('aria-pressed','true');state.filter=b.dataset.filter;renderEvidence();}));await refresh();}
  init().catch(e=>{console.error(e);$('#live-state').textContent=e.message||'Workspace failed to load';});
})();
