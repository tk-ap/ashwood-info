import { renderOverview } from './overview.mjs';
import { renderFrame, mountCheckin } from './frame.mjs';
import { buildContentRecommendation } from './content-intelligence.mjs';
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
    'ashwood-info': { label: 'ASHWOOD', type: 'Human / creative operating layer', goal: 'leadership' },
    'alvira-bridge': { label: 'ALVIRA Bridge', type: 'ALVIRA feature infrastructure', goal: 'ownership' }
  };

  let GOALS = [];
  let goalModel = null;
  const state = { repos: [], githubEvidence: [], persistedEvidence: [], overrides: {}, contentFeedback: {}, ailhat: null, board: [], filter: 'all', selectedGoal: null, lastRefresh: null, error: null };
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  function escapeHtml(v='') { return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function daysSince(d) { const t = new Date(d).getTime(); return Number.isFinite(t) ? Math.max(0, Math.floor((Date.now()-t)/DAY)) : 999; }
  function shortDate(d) { const x = new Date(d); return Number.isNaN(x.getTime()) ? 'Unknown' : x.toLocaleDateString(undefined,{month:'short',day:'numeric'}); }
  function relativeDate(d) { const n=daysSince(d); return n===0?'today':n===1?'yesterday':n<14?`${n}d ago`:shortDate(d); }

  async function api(path, options={}) {
    const res = await fetch(path, { credentials:'same-origin', cache:'no-store', headers:{'Content-Type':'application/json', ...(options.headers||{})}, ...options });
    const body = await res.json().catch(()=>({}));
    if (!res.ok) { const err = new Error(body.error || `Request failed (${res.status})`); err.status=res.status; throw err; }
    return body;
  }

  let authPromise = null;
  let authEventSent = false;

  function announceAuthenticated() {
    if (authEventSent) return;
    authEventSent = true;
    document.body.dataset.workspaceAuth = 'authenticated';
    window.dispatchEvent(new Event('ashwood:workspace-authenticated'));
  }

  async function ensureAuth() {
    if (authPromise) return authPromise;

    authPromise = (async () => {
      document.body.dataset.workspaceAuth = 'checking';
      const status = await api('/api/workspace-auth');
      if (status.authenticated) {
        $('.workspace-shell').inert = false;
        announceAuthenticated();
        return true;
      }

      document.body.dataset.workspaceAuth = 'locked';
      return new Promise(resolve => {
        const existing = document.querySelector('#workspace-auth-gate');
        if (existing) existing.remove();

        const wrap = document.createElement('div');
        wrap.id='workspace-auth-gate';
        wrap.innerHTML = `<style>#workspace-auth-gate{position:fixed;inset:0;z-index:9999;background:#f5f3ef;display:grid;place-items:center;padding:24px;color:#171713}#workspace-auth-gate form{width:min(520px,100%);border:1px solid rgba(23,23,19,.2);padding:clamp(24px,5vw,48px);background:#f9f7f2}#workspace-auth-gate h1{font-size:clamp(34px,6vw,64px);margin:0 0 12px;font-weight:500;letter-spacing:-.04em}#workspace-auth-gate p{line-height:1.6}#workspace-auth-gate label{display:block;margin:18px 0;font-size:12px;text-transform:uppercase;letter-spacing:.08em}#workspace-auth-gate input{display:block;width:100%;box-sizing:border-box;margin-top:8px;padding:13px;border:1px solid rgba(23,23,19,.3);background:transparent;font:inherit}#workspace-auth-gate button{padding:12px 18px;border:1px solid #171713;background:#171713;color:#f5f3ef;cursor:pointer}#workspace-auth-gate button:disabled{opacity:.58;cursor:wait}.auth-error{color:#8b2d23;min-height:1.5em}</style><form><p class="eyebrow">ASHWOOD · PRIVATE WORKSPACE</p><h1>${status.configured?'Unlock workspace':'Finish private setup'}</h1><p>${status.configured?'Enter your workspace passphrase. Return using the Workspace link at the bottom of ASHWOOD, or bookmark this page.':'Use the one-time setup token from this chat, then choose a passphrase. The passphrase is stored only as a one-way hash.'}</p>${status.configured?'':`<label>Setup token<input name="bootstrap" autocomplete="off" required></label>`}<label>Passphrase<input name="passphrase" type="password" autocomplete="current-password" minlength="12" required></label><p class="auth-error" aria-live="polite"></p><button type="submit">${status.configured?'Unlock':'Create private workspace'}</button></form>`;
        document.body.appendChild(wrap);

        const shell = $('.workspace-shell');
        shell.inert = true;
        const form = wrap.querySelector('form');
        const button = form.querySelector('button[type="submit"]');
        const firstInput = wrap.querySelector('input');
        firstInput?.focus();

        form.addEventListener('submit', async e => {
          e.preventDefault();
          const fd = new FormData(form);
          const error = wrap.querySelector('.auth-error');
          error.textContent = '';
          button.disabled = true;
          const idleLabel = status.configured ? 'Unlock' : 'Create private workspace';
          button.textContent = status.configured ? 'Unlocking…' : 'Creating…';

          try {
            await api('/api/workspace-auth', {
              method:'POST',
              body:JSON.stringify({
                action:status.configured?'login':'setup',
                passphrase:fd.get('passphrase'),
                bootstrap:fd.get('bootstrap')
              })
            });

            // Do not expose the workspace merely because the login POST returned 200.
            // Safari/iOS can discard a cookie in edge navigation states. Confirm that
            // the browser actually sends the new session back before removing the gate.
            const verified = await api('/api/workspace-auth?verify=' + Date.now());
            if (!verified.authenticated) {
              throw new Error('The browser did not retain the private workspace session. The workspace will stay locked instead of reloading; retry once.');
            }

            wrap.remove();
            shell.inert = false;
            announceAuthenticated();
            resolve(true);
          } catch(err) {
            error.textContent = err.message;
            button.disabled = false;
            button.textContent = idleLabel;
          }
        });
      });
    })().catch(error => {
      authPromise = null;
      throw error;
    });

    return authPromise;
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
    state.contentFeedback = Object.fromEntries((data.content_feedback || []).map(row => [row.evidence_id, row]));
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

  async function loadBoard() {
    try { const data=await api('/api/workspace-board'); state.board=data.rows||[]; }
    catch { state.board=[]; }
  }

  function boardGoal(b){const p=String(b.product||'').toLowerCase();if(p.includes('ashwood'))return 'leadership';if(p.includes('agent-os'))return 'learning';return 'ownership';}

  function boardEvidence() {
    const statusMap={done:'COMPLETED',accepted:'COMPLETED',completed:'COMPLETED',retired:'COMPLETED',blocked:'BLOCKED',collision:'BLOCKED',revoked:'BLOCKED',failed:'BLOCKED',stale:'BLOCKED',review:'IN_PROGRESS',running:'IN_PROGRESS',ready:'PLANNED',queued:'PLANNED',waiting_approval:'IN_PROGRESS',waiting_capacity:'IN_PROGRESS',proposed:'PLANNED',approved:'PLANNED',release_pending:'PLANNED',untriaged:'PLANNED',orphaned_pr:'PLANNED'};
    return state.board.map(b=>({
      id:`board:${b.board_key}`,
      source:'board',
      sourceLabel:b.kind==='backlog'?'Milchik backlog':String(b.kind||'').startsWith('github_')?'GitHub inventory':'Milchik fleet',
      title:b.title,
      date:b.updated_at,
      status:statusMap[String(b.status||'').toLowerCase()]||((b.kind==='backlog'||String(b.kind||'').startsWith('github_'))?'PLANNED':'IN_PROGRESS'),
      goal:boardGoal(b),
      secondaryGoals:[],
      confidence:b.kind==='backlog'?.72:.9,
      notes:[b.product||'workforce',b.assignee||null,b.blocker||b.next_gate||null].filter(Boolean).join(' · '),
      url:b.canonical_url||''
    }));
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
      goal: 'ownership',
      title: w.title || 'Untitled work item',
      meta: [w.suggested_execution_mode, w.expected_product_impact, w.estimated_minutes ? `~${w.estimated_minutes}m` : null].filter(Boolean).join(' · '),
      url: 'https://ailhat.vercel.app/',
    }));
    if (a.attention?.top_issue) out.push({
      kind: a.attention.priority || 'ATTENTION',
      goal: 'ownership',
      title: a.attention.top_issue,
      meta: a.attention.top_next_action || '',
      url: 'https://ailhat.vercel.app/',
    });
    return out;
  }

  function allEvidence() { return [...state.persistedEvidence,...ailhatEvidence(),...boardEvidence(),...state.githubEvidence].map(x=>({...x,goal:state.overrides[x.id]||x.goal})).sort((a,b)=>new Date(b.date)-new Date(a.date)); }
  function weight(x){const age=daysSince(x.date),fresh=age<=2?1:age<=7?.82:age<=14?.58:age<=30?.32:.08,status=x.status==='COMPLETED'?1.15:x.status==='PLANNED'?.25:.8;return fresh*status*(x.confidence||1);}
  function goalStats(goal){const ev=allEvidence().filter(x=>x.goal===goal.id||x.secondaryGoals?.includes(goal.id)),recent=ev.filter(x=>daysSince(x.date)<=30),weighted=recent.reduce((s,x)=>s+weight(x)*(x.goal===goal.id?1:.35),0),momentum=Math.min(100,Math.round(weighted*22)),newest=ev[0]?.date||null;let status='IN_PROGRESS';if(!newest||daysSince(newest)>30)status='STALE';else if(daysSince(newest)>14||momentum<18)status='NEEDS_ATTENTION';return{ev,recent,momentum,newest,status};}


  async function recordContentFeedback(evidenceId, decision, channel = null, draft = null, truthState = null) {
    try {
      const result = await api('/api/workspace-state', {
        method:'POST',
        body:JSON.stringify({
          action:'record_content_feedback',
          evidence_id:evidenceId,
          decision,
          channel,
          draft,
          truth_state:truthState
        })
      });
      state.contentFeedback[evidenceId] = result.feedback;
      return result.feedback;
    } catch (error) {
      const status=$('#content-intelligence-status');
      if(status) status.textContent='Recommendation feedback could not be saved. The rest of Workspace is unaffected.';
      throw error;
    }
  }

  function renderFromWork(){
    const host=$('#from-work-queue');
    const status=$('#content-intelligence-status');
    if(!host) return;

    const candidates=allEvidence()
      .map(x=>{
        const productLabel=PRODUCT_ROLES[x.sourceLabel]?.label || x.sourceLabel || x.source;
        const recommendation=buildContentRecommendation(x,{daysSince,productLabel});
        return {...x,_content:recommendation};
      })
      .filter(x=>x._content.score>18)
      .filter(x=>state.contentFeedback[x.id]?.decision!=='do_not_post')
      .sort((a,b)=>b._content.score-a._content.score)
      .slice(0,5);

    if(status){
      status.textContent=candidates.length
        ? `${candidates.length} evidence-grounded thought${candidates.length===1?'':'s'} worth considering`
        : 'No strong new thought surfaced from current evidence.';
    }

    host.innerHTML=candidates.length?candidates.map((x,i)=>{
      const r=x._content;
      const feedback=state.contentFeedback[x.id] || {};
      const chosen=feedback.channel && r.drafts[feedback.channel] ? feedback.channel : r.channels[0];
      const draft=feedback.draft || r.drafts[chosen] || '';
      const isDeveloping=feedback.decision==='develop';
      const isSaved=feedback.decision==='save';
      return `<article class="content-opportunity" data-content-id="${escapeHtml(x.id)}">
        <div class="content-opportunity__meta">
          <span>${escapeHtml(x.sourceLabel||x.source)} · ${relativeDate(x.date)}</span>
          <span>truth · ${escapeHtml(r.truthState)}</span>
        </div>
        <h3>${escapeHtml(r.angle.hook)}</h3>
        <p class="content-opportunity__why"><strong>Why now:</strong> ${escapeHtml(r.angle.why)}</p>
        <p class="content-opportunity__fit"><strong>Best fit:</strong> ${r.bestFit.map(escapeHtml).join(' → ')}</p>
        <p class="content-opportunity__source"><strong>Underlying evidence:</strong> ${escapeHtml(x.title)}</p>
        <div class="content-opportunity__actions">
          <button type="button" data-develop-content="${i}">${isDeveloping?'Developing':'Develop thought'}</button>
          <button type="button" data-save-content="${i}">${isSaved?'Saved':'Save for later'}</button>
          <button type="button" data-dont-post-content="${i}">Don’t post</button>
          ${x.url?`<a href="${escapeHtml(x.url)}" target="_blank" rel="noopener">Source evidence ↗</a>`:''}
        </div>
        <div class="content-opportunity__draft" data-content-editor="${i}" ${isDeveloping?'':'hidden'}>
          <label>Channel
            <select data-content-channel="${i}">${r.channels.map(k=>`<option ${k===chosen?'selected':''}>${escapeHtml(k)}</option>`).join('')}</select>
          </label>
          <textarea rows="8" data-content-draft="${i}">${escapeHtml(draft)}</textarea>
          <div class="content-opportunity__draft-actions">
            <button type="button" data-save-draft="${i}">Save draft</button>
            <button type="button" data-copy-content="${i}">Copy</button>
          </div>
        </div>
        <script type="application/json" data-content-payload="${i}">${JSON.stringify({
          evidenceId:x.id,
          truthState:r.truthState,
          drafts:r.drafts
        }).replace(/</g,'\\u003c')}</script>
      </article>`;
    }).join(''):'<p class="content-empty"><strong>Nothing worth forcing right now.</strong><span>ASHWOOD checked current ecosystem evidence and did not find a recent item strong enough to develop. That is a valid outcome.</span></p>';

    const payloadFor=i=>JSON.parse(document.querySelector(`[data-content-payload="${i}"]`).textContent);
    const selectedChannel=i=>document.querySelector(`[data-content-channel="${i}"]`)?.value || null;
    const draftValue=i=>document.querySelector(`[data-content-draft="${i}"]`)?.value || null;

    $$('[data-develop-content]').forEach(btn=>btn.addEventListener('click',async()=>{
      const i=btn.dataset.developContent, payload=payloadFor(i), editor=document.querySelector(`[data-content-editor="${i}"]`);
      editor.hidden=false;
      await recordContentFeedback(payload.evidenceId,'develop',selectedChannel(i),draftValue(i),payload.truthState);
      btn.textContent='Developing';
    }));

    $$('[data-save-content]').forEach(btn=>btn.addEventListener('click',async()=>{
      const i=btn.dataset.saveContent, payload=payloadFor(i);
      await recordContentFeedback(payload.evidenceId,'save',selectedChannel(i),draftValue(i),payload.truthState);
      btn.textContent='Saved';
    }));

    $$('[data-dont-post-content]').forEach(btn=>btn.addEventListener('click',async()=>{
      const i=btn.dataset.dontPostContent, payload=payloadFor(i);
      await recordContentFeedback(payload.evidenceId,'do_not_post',selectedChannel(i),draftValue(i),payload.truthState);
      renderFromWork();
    }));

    $$('[data-content-channel]').forEach(sel=>sel.addEventListener('change',()=>{
      const i=sel.dataset.contentChannel, payload=payloadFor(i), ta=document.querySelector(`[data-content-draft="${i}"]`);
      ta.value=payload.drafts[sel.value]||'';
    }));

    $$('[data-save-draft]').forEach(btn=>btn.addEventListener('click',async()=>{
      const i=btn.dataset.saveDraft, payload=payloadFor(i);
      await recordContentFeedback(payload.evidenceId,'develop',selectedChannel(i),draftValue(i),payload.truthState);
      btn.textContent='Saved';
      setTimeout(()=>btn.textContent='Save draft',1200);
    }));

    $$('[data-copy-content]').forEach(btn=>btn.addEventListener('click',async()=>{
      const i=btn.dataset.copyContent, payload=payloadFor(i), draft=draftValue(i);
      await recordContentFeedback(payload.evidenceId,'develop',selectedChannel(i),draft,payload.truthState);
      await navigator.clipboard.writeText(draft);
      btn.textContent='Copied';
      setTimeout(()=>btn.textContent='Copy',1200);
    }));
  }

  function classifyReality(x){
    const t=`${x.title||''} ${x.notes||''} ${x.status||''}`.toLowerCase();
    const market=/user|customer|paid|revenue|signup|design partner|beta|pilot|adoption|external|client/.test(t);
    const proof=/test|tested|verify|verified|proof|evidence|smoke|readback|production|live|deployed|completed|merged/.test(t);
    const speculative=/idea|propos|draft|architecture|direction|roadmap|planned|concept|documentation|brief|future|could|maybe/.test(t);
    if(market && proof) return 'market';
    if(proof && (x.status==='COMPLETED'||x.source==='manual'||x.source==='ailhat')) return 'verified';
    if(speculative || x.status==='PLANNED') return 'speculation';
    return 'build';
  }

  function renderRealityCheck(evidence){
    const host=$('#reality-check-grid'); if(!host) return;
    const recent=evidence.filter(x=>daysSince(x.date)<=45), counts={verified:0,build:0,market:0,speculation:0};
    recent.forEach(x=>counts[classifyReality(x)]++);
    const total=Math.max(1,recent.length), coverage=Math.round(((counts.verified+counts.market*.8)/total)*100), distraction=Math.round((counts.speculation/total)*100);
    const label=coverage>=65&&distraction<25?'Evidence is keeping pace':coverage>=40?'Promising, but proof is lagging':'Story is moving faster than proof';
    const summary=counts.market?'Market-facing evidence exists, but it needs repeatable use or conversion proof to carry the larger claim.':'Most current movement is internal build evidence; the market-value question remains open.';
    $('#reality-check-score').textContent=`${coverage}%`;
    $('#reality-check-label').textContent=label;
    $('#reality-check-summary').textContent=summary;
    const cards=[['verified','Verified evidence','Tests, deployments, persisted records, or completed work with a receipt.'],['market','Market signal','External users, pilots, customers, signups, payment, or adoption—not just internal readiness.'],['build','Build activity','Real implementation progress that still needs an end-to-end or independent proof step.'],['speculation','Story / speculation','Ideas, architecture, drafts, or future language that may be valuable but is not proof yet.']];
    host.innerHTML=cards.map(([key,title,copy])=>`<article class="reality-check__card reality-check__card--${key}"><div><strong>${counts[key]}</strong><span>${title}</span></div><p>${copy}</p></article>`).join('');
    const note=document.querySelector('.reality-check__note'); if(note) note.dataset.distraction=`${distraction}% of recent activity is currently classified as story/speculation.`;
  }

  function render() {
    const evidence=allEvidence(), last7=evidence.filter(x=>daysSince(x.date)<=7), moved=new Set(last7.flatMap(x=>[x.goal,...(x.secondaryGoals||[])])).size, active=state.repos.filter(r=>daysSince(r.pushed_at)<=14).length, needs=GOALS.filter(g=>['STALE','NEEDS_ATTENTION'].includes(goalStats(g).status)).length;
    $('#pulse-grid').innerHTML=[[moved,'goals with evidence · 7d'],[active,'active ecosystem repos · 14d'],[needs,'buckets needing review'],[state.persistedEvidence.length,'private evidence items']].map(([n,l])=>`<article class="pulse-card"><div class="pulse-number">${n}</div><div class="pulse-label">${l}</div></article>`).join('');
    renderOverview(GOALS, evidence, state.selectedGoal, selectGoal);
    const products=state.repos.map(r=>({name:PRODUCT_ROLES[r.name]?.label||r.name,type:PRODUCT_ROLES[r.name]?.type||'Discovered ecosystem repository',state:daysSince(r.pushed_at)<=7?'ACTIVE':daysSince(r.pushed_at)<=21?'QUIET':'STALE',pushedAt:r.pushed_at,url:r.html_url,description:r.description||''}));
    if(state.ailhat?.product) products.unshift({name:'ailhat intelligence',type:'Portfolio Intelligence contract',state:state.ailhat.product.attention_status||state.ailhat.product.state,pushedAt:state.ailhat.scan?.observed_at,url:'https://ailhat.vercel.app/',description:`Readiness ${state.ailhat.product.readiness_score ?? 'unknown'} · ${state.ailhat.attention?.top_next_action||'No next action supplied'}`});
    $('#ecosystem-list').innerHTML=products.map(p=>`<article class="ecosystem-row"><div><a class="ecosystem-name" href="${escapeHtml(p.url)}" target="_blank" rel="noopener">${escapeHtml(p.name)} ↗</a><div class="ecosystem-commit">${escapeHtml(p.description)}</div></div><div class="ecosystem-type">${escapeHtml(p.type)}</div><div><span class="status-pill">${escapeHtml(p.state)}</span><div class="ecosystem-age">${p.pushedAt?relativeDate(p.pushedAt):'source timestamp unavailable'}</div></div></article>`).join('')||'<p class="empty-state">No project details available from the current sources.</p>';
    renderEvidence(); renderAttention(); renderNext(); renderFromWork(); renderRealityCheck(evidence);
    $('#as-of').textContent=`Refreshed ${new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}`;
    $('#live-state').textContent=state.error?state.error:`Private state + GitHub + ${state.ailhat?.ok?'ailhat':'ailhat unavailable'} · ${state.board.length} governed tasks`;
  }

  function renderEvidence(){const items=allEvidence().filter(x=>(state.filter==='all'||x.source===state.filter)&&(!state.selectedGoal||x.goal===state.selectedGoal||x.secondaryGoals?.includes(state.selectedGoal))).slice(0,60);$('#evidence-list').innerHTML=items.map(x=>`<article class="evidence-row"><div class="evidence-source">${escapeHtml(x.sourceLabel||x.source)}</div><div>${x.url?`<a class="evidence-title" href="${escapeHtml(x.url)}" target="_blank" rel="noopener">${escapeHtml(x.title)}</a>`:`<span class="evidence-title">${escapeHtml(x.title)}</span>`}<div class="evidence-meta">${escapeHtml(x.status)} · ${relativeDate(x.date)} · confidence ${Math.round((x.confidence||1)*100)}%</div></div><label class="evidence-goal">Goal<select data-override-id="${escapeHtml(x.id)}">${GOALS.map(g=>`<option value="${g.id}" ${g.id===x.goal?'selected':''}>${escapeHtml(g.name)}</option>`).join('')}</select></label></article>`).join('')||'<p class="section-note">No evidence in this filter.</p>'; $$('[data-override-id]').forEach(sel=>sel.addEventListener('change',()=>saveOverride(sel.dataset.overrideId,sel.value)));}

  function renderAttention(){const signals=[];GOALS.map(g=>({g,...goalStats(g)})).filter(x=>['STALE','NEEDS_ATTENTION'].includes(x.status)).forEach(x=>{const blind=['relationships','music','modeling','writing'].includes(x.g.id)&&!x.ev.some(e=>['manual','calendar','music','modeling'].includes(e.source));signals.push({kind:blind?'EVIDENCE GAP':x.status,goal:x.g.name,copy:blind?`Current automatic sources do not reliably observe ${x.g.name.toLowerCase()}. Missing evidence is not proof of neglect.`:`${x.g.name} has weak recent evidence relative to its stated priority.`});});const active14=state.repos.filter(r=>daysSince(r.pushed_at)<=14);if(active14.length>=6)signals.unshift({kind:'FOCUS CHECK',goal:'Visible Leadership',copy:`${active14.length} ecosystem repositories show activity in the last 14 days. Check whether that breadth is strengthening or fragmenting the public narrative.`});$('#attention-list').innerHTML=(signals.slice(0,6).length?signals:[{kind:'CLEAR',goal:'Workspace',copy:'No strong neglect or contradiction signal is supported by current evidence.'}]).map(s=>`<article class="attention-row"><span class="status-pill">${s.kind.replace('_',' ')}</span><div><strong>${escapeHtml(s.goal)}</strong><p>${escapeHtml(s.copy)}</p></div></article>`).join('');}

  function renderNext(){const pRank=p=>p==='P0'?0:p==='P1'?1:p==='P2'?2:p==='P3'?3:9;const opps=ailhatOpportunities();GOALS.forEach(goal=>{const s=goalStats(goal);if(s.status==='STALE'||s.status==='NEEDS_ATTENTION'){const blind=['relationships','music','modeling','writing'].includes(goal.id)&&!s.ev.some(e=>e.source==='manual');opps.push({kind:s.status,goal:goal.id,title:blind?`Improve evidence before judging ${goal.name.toLowerCase()}`:`Review the next bet advancing ${goal.name.toLowerCase()}`,meta:`priority ${goal.priority} · evidence momentum ${s.momentum}/100`,url:''});}});opps.sort((a,b)=>{const pa=GOALS.find(g=>g.id===a.goal)?.priority??1,pb=GOALS.find(g=>g.id===b.goal)?.priority??1;return pb!==pa?pb-pa:pRank(a.kind)-pRank(b.kind);});$('#opportunity-list').innerHTML=opps.length?opps.map(o=>{const gn=GOALS.find(g=>g.id===o.goal)?.name||'ailhat';return `<article class="next-card opportunity"><p class="eyebrow">${escapeHtml(gn)} · ${escapeHtml(o.kind)}</p><h3>${escapeHtml(o.title)}</h3>${o.meta?`<p>${escapeHtml(o.meta)}</p>`:''}${o.url?`<a href="${escapeHtml(o.url)}" target="_blank" rel="noopener">Open in ailhat →</a>`:''}</article>`;}).join(''):'<p class="section-note">No open opportunities right now.</p>';$('#next-action-card').innerHTML='';}

  async function saveOverride(id,goal){try{await api('/api/workspace-state',{method:'POST',body:JSON.stringify({action:'set_override',evidence_id:id,goal_id:goal})});state.overrides[id]=goal;const item=[...state.githubEvidence,...state.persistedEvidence].find(x=>x.id===id);if(item)item.goal=goal;render();}catch(e){alert(e.message);}}
  function fillGoalSelect(){const sel=$('#evidence-goal-input');sel.innerHTML=GOALS.map(g=>`<option value="${g.id}">${escapeHtml(g.name)}</option>`).join('');}
  async function addEvidence(e){e.preventDefault();try{await api('/api/workspace-state',{method:'POST',body:JSON.stringify({action:'add_evidence',title:$('#evidence-title-input').value,goal_id:$('#evidence-goal-input').value,status:$('#evidence-status-input').value,occurred_at:$('#evidence-date-input').value,notes:$('#evidence-source-input').value})});$('#evidence-dialog').close();e.target.reset();$('#evidence-date-input').value=new Date().toISOString().slice(0,10);await loadPersistentState();render();}catch(err){alert(err.message);}}
  async function refresh(){
    $('#refresh-evidence').disabled=true;
    $('#live-state').textContent='Refreshing…';
    const results=await Promise.allSettled([loadPersistentState(),loadGithubEvidence(),loadAilhatEvidence(),loadBoard()]);
    state.error=results.filter(r=>r.status==='rejected').map(r=>r.reason.message).join(' · ')||null;
    state.lastRefresh=new Date(); render(); window.dispatchEvent(new CustomEvent('ashwood:ailhat-signals',{detail:ailhatEvidence()})); window.dispatchEvent(new Event('ashwood:refresh-feed')); $('#refresh-evidence').disabled=false;
  }
  function selectGoal(id){
    state.selectedGoal=id;
    $('#evidence-selection').textContent=GOALS.find(g=>g.id===id)?.name||'All goals';
    $('#evidence-panel').open=true;
    renderOverview(GOALS,allEvidence(),id,selectGoal);renderEvidence();
    $('#evidence-panel').scrollIntoView({behavior:'instant',block:'start'});
    $('#evidence-panel summary').focus();
  }


  async function changePassphrase(e){
    e.preventDefault();
    const error=$('#passphrase-error'); error.textContent='';
    const next=$('#passphrase-new').value, confirmed=$('#passphrase-confirm').value;
    if(next!==confirmed){error.textContent='The two entries do not match.';return;}
    try{
      await api('/api/workspace-auth',{method:'POST',body:JSON.stringify({action:'rotate',passphrase:next})});
      $('#passphrase-form').reset(); $('#passphrase-dialog').close();
      $('#live-state').textContent='Passphrase changed · other browsers locked out';
    }catch(err){error.textContent=err.message;}
  }

  async function init(){await ensureAuth();
    $('#sign-out').addEventListener('click',async()=>{try{await api('/api/workspace-auth',{method:'POST',body:JSON.stringify({action:'logout'})});location.reload();}catch(e){$('#live-state').textContent=e.message;}});
    $('#change-passphrase').addEventListener('click',()=>{$('#passphrase-form').reset();$('#passphrase-error').textContent='';$('#passphrase-dialog').showModal();});
    $('#passphrase-form').addEventListener('submit',changePassphrase);
    $('#clear-goal').addEventListener('click',()=>selectGoal(null));
    $$('[data-close-dialog]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
await loadGoalModel();fillGoalSelect();$('#evidence-date-input').value=new Date().toISOString().slice(0,10);$('#refresh-evidence').addEventListener('click',refresh);$('#add-evidence').addEventListener('click',()=>$('#evidence-dialog').showModal());$('#mobile-add-evidence')?.addEventListener('click',()=>$('#add-evidence').click());$$('.workspace-menu-panel .text-button').forEach(button=>button.addEventListener('click',()=>button.closest('details')?.removeAttribute('open')));document.querySelector('a[href="#evidence-panel"]')?.addEventListener('click',event=>{event.preventDefault();const panel=$('#evidence-panel');panel.open=true;panel.scrollIntoView({behavior:'smooth',block:'start'});});$('#evidence-form').addEventListener('submit',addEvidence);$$('.filter').forEach(b=>b.addEventListener('click',()=>{$$('.filter').forEach(x=>{x.classList.remove('is-active');x.setAttribute('aria-pressed','false');});b.classList.add('is-active');b.setAttribute('aria-pressed','true');state.filter=b.dataset.filter;renderEvidence();}));await refresh();}
  init().catch(e=>{console.error(e);$('#live-state').textContent=e.message||'Workspace failed to load';});
})();
