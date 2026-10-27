/* OmniChat v0.1 — public static prototype. No credentials or canonical task mutations. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const demo = {
    source_system:'demo', observed_at:null,
    lanes:[
      {id:'codex',agent:'Codex',harness:'codex-cli',status:'working',title:'Durable lifecycle persistence',task_id:'demo-task-014',last_heartbeat_at:null,checkpoint:'state persisted · sample',start:5,width:75,events:[{kind:'check_in',label:'Harness session checked in',time:'10:42'},{kind:'checkpoint',label:'Atomic checkpoint persisted',time:'10:47'},{kind:'heartbeat',label:'Execution heartbeat',time:'10:51'}]},
      {id:'claude',agent:'Claude',harness:'claude-code',status:'review',title:'Independent protocol review',task_id:'demo-task-015',last_heartbeat_at:null,checkpoint:'review pending · sample',start:36,width:55,events:[{kind:'check_in',label:'Reviewer context hydrated',time:'10:44'},{kind:'review',label:'Cross-harness test matrix',time:'10:49'}]},
      {id:'hermes',agent:'Hermes',harness:'hermes',status:'waiting',title:'Provider capacity exhausted',task_id:'demo-task-016',last_heartbeat_at:null,checkpoint:'capacity receipt saved · sample',start:15,width:42,capacity:{state:'exhausted',reset_at:'not observed'},events:[{kind:'capacity_exhausted',label:'Capacity receipt recorded',time:'10:46'},{kind:'checkpoint',label:'Task frozen safely for handoff',time:'10:48'}]},
      {id:'jev',agent:'Jev',harness:'agentos-router',status:'handoff',title:'Evaluate capacity-aware successor',task_id:'demo-task-016',last_heartbeat_at:null,checkpoint:'proposed, not dispatched',start:52,width:42,events:[{kind:'handoff_proposed',label:'Route scored for replacement session',time:'10:48'},{kind:'handoff_pending',label:'Awaiting governed dispatch receipt',time:'10:50'}]}
    ]
  };
  // All six lifecycle stages are intentionally demonstrated with fictional receipts.
  // No stage is inferred from a phase/status; only events illuminate cells.
  demo.lanes.unshift({
    id:'scout-demo',agent:'Scout',harness:'agentos-worker',status:'done',
    title:'Market signal → approved experiment brief',task_id:'demo-task-021',
    checkpoint:'sample strategy artifact, not an actual PR',last_heartbeat_at:null,
    usage:{input_tokens:1340,output_tokens:420,cost_usd:0},
    capacity:{state:'unknown',reset_at:null},
    events:[
      {kind:'wake',label:'No-model fleet wake observed',time:'09:01'},
      {kind:'check_in',label:'Scout claimed the bounded research task',time:'09:02'},
      {kind:'tool_use',label:'Compared available source evidence',time:'09:07'},
      {kind:'checkpoint',label:'Market brief staged for review',time:'09:13'},
      {kind:'handoff_committed',label:'Independent review assigned to W Dog',time:'09:14'},
      {kind:'check_out',label:'Scout checked out; artifact awaits review',time:'09:15'}
    ]
  });
  const views = {
    build:{title:'AgentOS continuity',sub:'Your intent enters once. Jev proposes the best available session; AgentOS controls execution.',lanes:demo.lanes},
    site:{title:'ASHWOOD release',sub:'One owner conversation, multiple controlled release agents.',lanes:[
      {id:'site-codex',agent:'Codex',harness:'codex-cli',status:'done',title:'Prepare sandbox artifact',task_id:'demo-site-1',checkpoint:'built · sample',start:9,width:54,events:[{kind:'checkpoint',label:'Build complete — example only',time:'11:00'}]},
      {id:'site-muse',agent:'Muse',harness:'claude-code',status:'review',title:'Visual and privacy review',task_id:'demo-site-2',checkpoint:'human gate',start:49,width:39,events:[{kind:'review',label:'Waiting for visual acceptance — example only',time:'11:07'}]}
    ]},
    career:{title:'Career operations',sub:'One conversation that hands off bounded hiring tasks to available workers.',lanes:[
      {id:'career-scout',agent:'Scout',harness:'agentos-worker',status:'waiting',title:'Awaiting source verification',task_id:'demo-career-1',checkpoint:'evidence required',start:12,width:62,events:[{kind:'waiting',label:'Salary source evidence pending — example only',time:'09:30'}]}
    ]}
  };
  let session='build', connected=false, loading=false, selected='scout-demo', activityView='swim', laneFilter='all', lastFeed=null, heartbeatTimer=null;
  const time = (value) => {const n=Date.parse(value||'');return Number.isFinite(n)?new Date(n).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}):'not observed'};
  const fresh = (date,seconds=90) => {const n=Date.parse(date||'');return Number.isFinite(n)&&Date.now()-n>=0&&Date.now()-n<seconds*1000};
  const clean = (value,max=180) => String(value??'').slice(0,max);
  const elt = (tag,className,text) => {const e=document.createElement(tag); if(className)e.className=className; if(text!=null)e.textContent=clean(text,600); return e};
  const laneStatus = s => ['working','waiting','handoff','review','blocked','done','unknown'].includes(s)?s:'unknown';
  const current = () => connected ? (lastFeed?.lanes || []) : (views[session]?.lanes||[]);
  const readable = s => ({working:'WORKING',waiting:'WAITING',handoff:'HANDOFF',review:'REVIEW',blocked:'BLOCKED',done:'DONE',unknown:'UNKNOWN'})[laneStatus(s)];
  const isActive = item => connected && fresh(item.last_heartbeat_at) && fresh(lastFeed?.observed_at);
  function safeFeed(payload) {
    if(!payload || payload.source_system!=='agent-os'||!Array.isArray(payload.lanes)||!fresh(payload.observed_at,120)) throw new Error('Feed unavailable or stale');
    return {observed_at:payload.observed_at,source_system:'agent-os',commands_enabled:payload.commands_enabled===true,lanes:payload.lanes.slice(0,16).map((v,i)=>{
      const status=laneStatus(v.status);
      const heartbeat=fresh(v.last_heartbeat_at);
      return {
        id:clean(v.id||v.task_id||('lane-'+i),80),agent:clean(v.agent||'Unknown',80),harness:clean(v.harness||'unobserved',80),
        status:status==='working'&&!heartbeat?'unknown':status,title:clean(v.title||'Unlabeled execution',160),
        task_id:clean(v.task_id||'',100),last_heartbeat_at:v.last_heartbeat_at,
        checkpoint:clean(v.checkpoint||'no checkpoint receipt',120),
        capacity:{state:clean(v.capacity?.state||'unknown',50),reset_at:clean(v.capacity?.reset_at||'',80)},
        events:Array.isArray(v.events)?v.events.slice(-24).map(e=>({kind:clean(e.kind,80),label:clean(e.label,200),occurred_at:clean(e.occurred_at||'',50),time:time(e.occurred_at)})):[],
        usage:v.usage&&typeof v.usage==='object'?{
          input_tokens:Number.isFinite(v.usage.input_tokens)&&v.usage.input_tokens>=0?v.usage.input_tokens:null,
          output_tokens:Number.isFinite(v.usage.output_tokens)&&v.usage.output_tokens>=0?v.usage.output_tokens:null,
          cost_usd:Number.isFinite(v.usage.cost_usd)&&v.usage.cost_usd>=0?v.usage.cost_usd:null
        }:null,
        start:Math.max(0,Math.min(85,Number(v.start)||6)),width:Math.max(12,Math.min(94,Number(v.width)||65))
      }
    })};
  }
  function updateMode() {
    $('mode-label').textContent=connected?'LIVE FEED':'DEMO DATA';
    $('mode-label').classList.toggle('connected',connected);
    $('sidebar-mode').textContent=connected?'OBSERVED RUNTIME':'SIMULATED RUNTIME';
    $('sidebar-indicator').classList.toggle('connected',connected);
    $('live-pulse').classList.toggle('connected',connected&&!!lastFeed);
    $('toggle-mode').textContent=connected?'Disconnect':'Connect feed';
    $('time-label').textContent=connected?'Observed timeline':'Sample sequence';
    $('send-hint').textContent=connected&&lastFeed?.commands_enabled?'Governed ingress enabled':'No real dispatch';
    $('freshness').textContent=connected ? (lastFeed?'AgentOS bridge · observed '+time(lastFeed.observed_at):'Live telemetry unavailable'):'Sample data · not a live telemetry source';
  }
  function metrics(lanes) {
    const count = (s) => lanes.filter(l=>l.status===s).length;
    $('metric-working').textContent=count('working');
    $('metric-waiting').textContent=count('waiting')+count('blocked');
    $('metric-handoffs').textContent=count('handoff');
    const exhausted=lanes.filter(l=>l.capacity?.state==='exhausted').length;
    $('metric-capacity').textContent=exhausted?' '+exhausted+' alert':connected?'clear':'—';
  }
  // A stage means a real event was received (or a clearly labeled demo sample).
  // A task phase, page refresh, heartbeat inference or elapsed time never completes a stage.
  const lifecycleStages=[
    {id:'wake',label:'Wake',kinds:['wake','wake_receipt','scheduler_wake','resume','resumed','recovered']},
    {id:'checkin',label:'Check-in',kinds:['check_in','checkin','claim','session_started']},
    {id:'execute',label:'Execute',kinds:['execute','start','heartbeat','tool_use','tool_call','thinking','text','result','review']},
    {id:'checkpoint',label:'Checkpoint',kinds:['checkpoint','capacity_exhausted','capacity_checkpoint']},
    {id:'handoff',label:'Handoff',kinds:['handoff','handoff_proposed','handoff_pending','handoff_committed']},
    {id:'checkout',label:'Check-out',kinds:['check_out','checkout','complete','completed','done']}
  ];
  function stageFor(event) {
    const kind=String(event?.kind||'').toLowerCase();
    return lifecycleStages.find(stage=>stage.kinds.includes(kind))?.id||null;
  }
  function filteredLanes(lanes) {
    if(laneFilter==='active')return lanes.filter(l=>l.status==='working'||l.status==='review');
    if(laneFilter==='waiting')return lanes.filter(l=>l.status==='waiting'||l.status==='blocked'||l.capacity?.state==='exhausted');
    if(laneFilter==='handoff')return lanes.filter(l=>l.status==='handoff'||l.events?.some(e=>stageFor(e)==='handoff'));
    return lanes;
  }
  function renderLanes(lanes) {
    const root=$('swimlanes');root.replaceChildren();
    const visible=filteredLanes(lanes);
    if(!visible.length){
      root.append(elt('p','journey-empty',connected?'No observed sessions match the filter. This does not prove the fleet is idle.':'No sample sessions match the filter.'));
      return;
    }
    for(const lane of visible) {
      const row=elt('button','journey-row'+(selected===lane.id?' selected':''));row.type='button';
      row.dataset.id=lane.id;
      row.setAttribute('aria-pressed',String(selected===lane.id));
      row.setAttribute('aria-label',lane.agent+' · '+lane.title+' · '+readable(lane.status)+' · inspect execution');
      const persona=elt('div','journey-persona');
      const identity=elt('div','journey-identity');
      identity.append(elt('span','journey-avatar',(lane.agent||'?').charAt(0).toUpperCase()),elt('strong','',lane.agent));
      persona.append(identity,elt('small','journey-harness',lane.harness||'unobserved'),elt('span','journey-task',lane.title));
      const state=elt('span','journey-state '+laneStatus(lane.status),readable(lane.status));
      persona.append(state);row.append(persona);
      const events=Array.isArray(lane.events)?lane.events:[];
      const present=events.map(stageFor).filter(Boolean);
      const latest=present.length?present[present.length-1]:null;
      for(const stage of lifecycleStages){
        const matching=events.filter(e=>stageFor(e)===stage.id);
        const cell=elt('div','journey-cell '+(matching.length?'observed ':'unobserved ')+(matching.length&&latest===stage.id?'latest':''));
        cell.dataset.stage=stage.id;
        if(matching.length){
          const event=matching[matching.length-1];
          const marker=elt('span','journey-marker',String(matching.length).padStart(2,'0'));
          const card=elt('span','journey-event-card');
          card.append(elt('b','',event.label||stage.label));
          const detail=elt('small','',clean(event.kind,24).replaceAll('_',' ')+' · '+(event.time||'time unknown'));
          card.append(detail);cell.append(marker,card);
          cell.title=(connected?'Observed event: ':'Sample event: ')+(event.label||stage.label)+(matching.length>1?' ('+matching.length+' events)':'');
        }else{
          cell.append(elt('span','journey-unobserved','—'));
          cell.title='No '+stage.label+' event '+(connected?'observed':'in this sample');
        }
        row.append(cell);
      }
      row.addEventListener('click',()=>{selected=lane.id;render()});
      root.append(row);
    }
  }
  function renderEvents(lanes) {
    const root=$('event-stream');root.replaceChildren();
    const events=lanes.flatMap(l=>(l.events||[]).map(e=>({...e,agent:l.agent,harness:l.harness})));
    if(!events.length){root.append(elt('p','notice','No canonical activity events observed.'));return}
    for(const e of events){const row=elt('div','event-row');row.append(elt('time','',e.time||'—'),elt('b','',e.agent));const detail=elt('div','',e.label||e.kind);detail.append(elt('small','',e.harness+' · '+e.kind));row.append(detail);root.append(row)}
  }
  function renderTrace(lanes){
    const visible=filteredLanes(lanes);
    const l=visible.find(x=>x.id===selected)||visible[0];
    $('trace-agent').textContent=l?l.agent+' · '+l.harness:'No selected execution';
    $('trace-state').textContent=l?readable(l.status):'UNKNOWN';
    $('trace-state').className='status-pill '+(l?laneStatus(l.status):'unknown');
    $('trace-details').replaceChildren();$('trace-evidence').replaceChildren();
    if(!l){$('trace-details').append(elt('div','','No state available'));return}
    const fields=[
      ['CURRENT TASK',l.title],['TASK REFERENCE',l.task_id||'not observed'],
      ['LAST HEARTBEAT',connected?time(l.last_heartbeat_at):'sample only'],
      ['LAST CHECKPOINT',l.checkpoint||'not observed'],
      ['CAPACITY',l.capacity?.state||'not observed'],['CONTINUITY',l.status==='handoff'?'handoff pending':l.status==='waiting'?'parked / waiting':'receipt required'],
      ['INPUT / OUTPUT TOKENS',l.usage?.input_tokens!=null&&l.usage?.output_tokens!=null?(l.usage.input_tokens+' / '+l.usage.output_tokens+(connected?' observed':' · sample')):'not observed'],
      ['MODEL COST',l.usage?.cost_usd!=null?('USD '+Number(l.usage.cost_usd).toFixed(4)+(connected?' observed':' · sample')):'not observed']
    ];
    for(const [a,b] of fields){const cell=elt('div','');cell.append(elt('small','',a),elt('strong','',b));$('trace-details').append(cell)}
    $('trace-evidence').append(elt('b','',connected?'OBSERVED RECEIPTS':'SAMPLE EVENTS'));
    for(const e of l.events||[]) $('trace-evidence').append(elt('span','',e.kind));
  }
  function render(){
    const v=views[session]||views.build;
    $('thread-title').textContent=connected?'Runtime session':v.title;
    $('thread-subtitle').textContent=connected?'Live read-only projection. The shared conversation remains a governed AgentOS ingress.':v.sub;
    const lanes=current();const visible=filteredLanes(lanes);if(!visible.some(x=>x.id===selected))selected=visible[0]?.id||'';
    $('stage-caption').textContent=connected?'Observed receipts only · 15s polling · a missing stage stays unobserved':'Sample receipts only · stage cells are not evidence of live execution';
    $('thread-meta').textContent=lanes.length+' '+(connected?'observed':'sample')+' lanes';
    metrics(lanes);renderLanes(lanes);renderEvents(lanes);renderTrace(lanes);updateMode();renderWorkforce();
    $('swimlanes').hidden=activityView!=='swim';$('event-stream').hidden=activityView!=='events';
  }
  function addMessage(text,kind='owner'){
    const box=elt('div','message '+kind);const header=elt('div','msg-label');
    header.append(elt('span',kind==='owner'?'avatar small':'a-mark',kind==='owner'?'TK':'A'),elt('b','',kind==='owner'?'You':'AgentOS'),elt('time','',time(new Date().toISOString())));
    box.append(header,elt('p','',text));$('messages').append(box);$('messages').scrollTop=$('messages').scrollHeight;
  }
  async function poll() {
    if(!connected||loading||document.hidden)return;
    loading=true;
    try{
      const res=await fetch('/api/omnichat/activity',{credentials:'same-origin',cache:'no-store',headers:{'Accept':'application/json'}});
      if(!res.ok)throw new Error('HTTP '+res.status);
      lastFeed=safeFeed(await res.json());
    }catch(e){lastFeed=null;$('freshness').textContent='Feed unavailable · '+clean(e.message,80)}
    finally{loading=false;render();if(connected&&!lastFeed)$('freshness').textContent='Bridge unavailable or stale · no live claims'}
  }
  $('toggle-mode').addEventListener('click',async()=>{
    connected=!connected;lastFeed=null;
    if(connected){await poll();}else{render();}
  });
  $('refresh').addEventListener('click',()=>{if(connected)poll();else render()});
  $('view-doc').addEventListener('click',()=>$('about').showModal());
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{
    activityView=b.dataset.view;document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('selected',x===b));render();
  }));
  document.querySelectorAll('[data-lane-filter]').forEach(b=>b.addEventListener('click',()=>{
    laneFilter=b.dataset.laneFilter;
    document.querySelectorAll('[data-lane-filter]').forEach(x=>{
      const active=x===b;x.classList.toggle('selected',active);x.setAttribute('aria-pressed',String(active));
    });
    render();
  }));
  document.querySelectorAll('[data-session]').forEach(b=>b.addEventListener('click',()=>{
    session=b.dataset.session;document.querySelectorAll('[data-session]').forEach(x=>x.classList.toggle('active',x===b));selected='';render();
  }));
  $('new-thread').addEventListener('click',()=>{
    session='build';connected=false;lastFeed=null;selected='';$('messages').replaceChildren();
    addMessage('New draft conversation. Messages are not dispatched from the static prototype.','system');render();$('prompt').focus();
  });
  $('composer').addEventListener('submit',async(e)=>{
    e.preventDefault();const text=$('prompt').value.trim();if(!text)return;
    $('prompt').value='';addMessage(text);
    if(!connected || !lastFeed?.commands_enabled){
      addMessage('Draft captured locally for this preview only. No AgentOS task was created and no harness was called. Connect an authenticated, governed command bridge to enable dispatch.','system');
      return;
    }
    try {
      const res=await fetch('/api/omnichat/command',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,thread_id:'operator:primary'})});
      if(!res.ok)throw new Error('Ingress returned '+res.status);
      const result=await res.json();addMessage(result.accepted===true?'Command accepted by governed ingress; awaiting durable receipt.':'No acceptance receipt returned. Confirm state in AgentOS.','system');
    } catch(e){addMessage('Governed ingress unavailable; the message was not confirmed dispatched.','system')}
  });
  $('prompt').addEventListener('keydown',(e)=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('composer').requestSubmit()}});
  heartbeatTimer=setInterval(()=>{if(connected)poll()},15000);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&connected)poll()});

  // Cockpit perspectives are UI presentation only. Autonomous work must already exist
  // in AgentOS; the static sample never starts tasks or controls real provider capacity.
  let workspacePerspective='build';
  let foregroundDemo=false;
  const sampleRadar=[
    {product:'ALVIRA',detail:'Portable context: observe onboarding comprehension and bridge reliability',label:'Opportunity',color:'blue'},
    {product:'ailhat',detail:'Marketing Engineering pilot: test audience language and acquisition signal',label:'Growth pilot',color:''},
    {product:'ASHWOOD',detail:'Catalog discoverability, portfolio clarity, sandbox staging',label:'Design review',color:'slate'},
    {product:'Career Ops',detail:'Application tracker consistency and evidence-backed job matching',label:'Quality gate',color:'amber'}
  ];
  const sampleMissions=[
    {n:'01',title:'Observe market signals',detail:'Scout + Steward · source-backed findings for ailhat',state:'PROPOSED',color:'blue'},
    {n:'02',title:'Stage ALVIRA clarity improvements',detail:'Bill → Router → Eugene → W Dog · isolated draft only',state:'STAGING',color:''},
    {n:'03',title:'Verify ASHWOOD navigation',detail:'Designer + W Dog · preserve modeling route and existing design',state:'REVIEW',color:'amber'},
    {n:'04',title:'Prepare a measurable growth test',detail:'Scout · no public posting without governed approval',state:'BOUNDED',color:'slate'}
  ];
  function addRadarItem(item) {
    const node=elt('div','radar-item'),body=elt('div','');
    body.append(elt('b','',item.product),elt('small','',item.detail));
    node.append(body,elt('span','mini-status '+(item.color||''),item.label));return node;
  }
  function addMissionItem(item) {
    const node=elt('div','mission-item'),body=elt('div','');
    body.append(elt('b','',item.title),elt('small','',item.detail));
    node.append(elt('span','mission-step',item.n),body,elt('span','mini-status '+(item.color||''),item.state));return node;
  }
  function renderWorkforce() {
    const main=document.querySelector('main.main');
    main.dataset.workspaceView=workspacePerspective;
    main.classList.toggle('is-connected',connected);
    $('build-dashboard').hidden=workspacePerspective!=='build';
    $('team-dashboard').hidden=workspacePerspective!=='team';
    for (const view of ['build','team']) {
      const b=$('view-'+view),active=view===workspacePerspective;
      b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;
    }
    const ribbon=document.querySelector('.priority-ribbon');
    const isForeground=foregroundDemo&&!connected;
    ribbon.classList.toggle('foreground',isForeground);
    $('priority-title').textContent=isForeground?'Foreground priority — simulated owner session':
      connected?'Connected feed — foreground reservation unverified':'Autonomous mode — background eligible';
    $('priority-description').textContent=isForeground?
      'Example: no new background calls on competing quota buckets. Safe checkpoint/yield; keep no-model wakes active. Nothing is paused on your host.':
      connected?'The connected activity feed does not attest global owner-session priority. Do not infer that workers have been paused.':
      'Example background workforce may act on existing standing mandates while no owner session is registered.';
    $('simulate-focus').disabled=connected;
    $('simulate-focus').textContent=connected?'Control unavailable on feed':isForeground?'End example session':'Simulate owner session';
    $('priority-explainer').textContent=connected?'This bridge does not control quotas.':'Switching perspectives never changes capacity.';
    const stamp=$('reality-stamp');
    stamp.querySelector('strong').textContent=connected?'SESSION FEED ONLY':'SIMULATION';
    stamp.querySelector('small').textContent=connected?'Portfolio/priority telemetry not connected':'Sample missions, not host events';
    document.querySelectorAll('.concept-marker').forEach(el=>el.textContent=connected?'PORTFOLIO DATA UNAVAILABLE':'ILLUSTRATIVE WORKFLOW');
    const radar=$('radar-list'),queue=$('autonomous-queue');
    radar.replaceChildren();queue.replaceChildren();
    if(connected){
      radar.append(elt('p','notice','No authenticated portfolio signal projection is attached. Session lanes below may be observed, but these product states are UNKNOWN.'));
      queue.append(elt('p','notice','No canonical autonomous mission queue projection is attached. Do not infer dispatch or staged work from this concept panel.'));
    }else{
      for(const item of sampleRadar)radar.append(addRadarItem(item));
      for(const item of sampleMissions)queue.append(addMissionItem({
        ...item,
        state:isForeground&&item.state==='STAGING'?'YIELD · DEMO':item.state,
        color:isForeground&&item.state==='STAGING'?'amber':item.color
      }));
    }
  }
  $('view-build').addEventListener('click',()=>{workspacePerspective='build';renderWorkforce()});
  $('view-team').addEventListener('click',()=>{workspacePerspective='team';renderWorkforce()});
  $('simulate-focus').addEventListener('click',()=>{if(connected)return;foregroundDemo=!foregroundDemo;workspacePerspective=foregroundDemo?'team':'build';renderWorkforce()});
  // This capture listener visually demonstrates the desired foreground-preemption rule.
  // It does not call providers, pause jobs, persist session leases, or grant authority.
  $('composer').addEventListener('submit',()=>{
    if(!connected&&$('prompt').value.trim()){
      foregroundDemo=true;
      workspacePerspective='team';
      renderWorkforce();
    }
  },true);
  document.querySelectorAll('.perspective-tab').forEach((button,i,all)=>{
    button.addEventListener('keydown',e=>{
      if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
        e.preventDefault();
        const next=all[(i+(e.key==='ArrowRight'?1:all.length-1))%all.length];
        next.click();next.focus();
      }
    });
  });

  render();
})();+Number(l.usage.cost_usd).toFixed(4)+(connected?' observed':' · sample')):'not observed']
    ];
    for(const [a,b] of fields){const cell=elt('div','');cell.append(elt('small','',a),elt('strong','',b));$('trace-details').append(cell)}
    $('trace-evidence').append(elt('b','',connected?'OBSERVED RECEIPTS':'SAMPLE EVENTS'));
    for(const e of l.events||[]) $('trace-evidence').append(elt('span','',e.kind));
  }
  function render(){
    const v=views[session]||views.build;
    $('thread-title').textContent=connected?'Runtime session':v.title;
    $('thread-subtitle').textContent=connected?'Live read-only projection. The shared conversation remains a governed AgentOS ingress.':v.sub;
    const lanes=current();const visible=filteredLanes(lanes);if(!visible.some(x=>x.id===selected))selected=visible[0]?.id||'';
    $('stage-caption').textContent=connected?'Observed receipts only · 15s polling · a missing stage stays unobserved':'Sample receipts only · stage cells are not evidence of live execution';
    $('thread-meta').textContent=lanes.length+' '+(connected?'observed':'sample')+' lanes';
    metrics(lanes);renderLanes(lanes);renderEvents(lanes);renderTrace(lanes);updateMode();renderWorkforce();
    $('swimlanes').hidden=activityView!=='swim';$('event-stream').hidden=activityView!=='events';
  }
  function addMessage(text,kind='owner'){
    const box=elt('div','message '+kind);const header=elt('div','msg-label');
    header.append(elt('span',kind==='owner'?'avatar small':'a-mark',kind==='owner'?'TK':'A'),elt('b','',kind==='owner'?'You':'AgentOS'),elt('time','',time(new Date().toISOString())));
    box.append(header,elt('p','',text));$('messages').append(box);$('messages').scrollTop=$('messages').scrollHeight;
  }
  async function poll() {
    if(!connected||loading||document.hidden)return;
    loading=true;
    try{
      const res=await fetch('/api/omnichat/activity',{credentials:'same-origin',cache:'no-store',headers:{'Accept':'application/json'}});
      if(!res.ok)throw new Error('HTTP '+res.status);
      lastFeed=safeFeed(await res.json());
    }catch(e){lastFeed=null;$('freshness').textContent='Feed unavailable · '+clean(e.message,80)}
    finally{loading=false;render();if(connected&&!lastFeed)$('freshness').textContent='Bridge unavailable or stale · no live claims'}
  }
  $('toggle-mode').addEventListener('click',async()=>{
    connected=!connected;lastFeed=null;
    if(connected){await poll();}else{render();}
  });
  $('refresh').addEventListener('click',()=>{if(connected)poll();else render()});
  $('view-doc').addEventListener('click',()=>$('about').showModal());
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{
    activityView=b.dataset.view;document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('selected',x===b));render();
  }));
  document.querySelectorAll('[data-session]').forEach(b=>b.addEventListener('click',()=>{
    session=b.dataset.session;document.querySelectorAll('[data-session]').forEach(x=>x.classList.toggle('active',x===b));selected='';render();
  }));
  $('new-thread').addEventListener('click',()=>{
    session='build';connected=false;lastFeed=null;selected='';$('messages').replaceChildren();
    addMessage('New draft conversation. Messages are not dispatched from the static prototype.','system');render();$('prompt').focus();
  });
  $('composer').addEventListener('submit',async(e)=>{
    e.preventDefault();const text=$('prompt').value.trim();if(!text)return;
    $('prompt').value='';addMessage(text);
    if(!connected || !lastFeed?.commands_enabled){
      addMessage('Draft captured locally for this preview only. No AgentOS task was created and no harness was called. Connect an authenticated, governed command bridge to enable dispatch.','system');
      return;
    }
    try {
      const res=await fetch('/api/omnichat/command',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,thread_id:'operator:primary'})});
      if(!res.ok)throw new Error('Ingress returned '+res.status);
      const result=await res.json();addMessage(result.accepted===true?'Command accepted by governed ingress; awaiting durable receipt.':'No acceptance receipt returned. Confirm state in AgentOS.','system');
    } catch(e){addMessage('Governed ingress unavailable; the message was not confirmed dispatched.','system')}
  });
  $('prompt').addEventListener('keydown',(e)=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('composer').requestSubmit()}});
  heartbeatTimer=setInterval(()=>{if(connected)poll()},15000);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&connected)poll()});

  // Cockpit perspectives are UI presentation only. Autonomous work must already exist
  // in AgentOS; the static sample never starts tasks or controls real provider capacity.
  let workspacePerspective='build';
  let foregroundDemo=false;
  const sampleRadar=[
    {product:'ALVIRA',detail:'Portable context: observe onboarding comprehension and bridge reliability',label:'Opportunity',color:'blue'},
    {product:'ailhat',detail:'Marketing Engineering pilot: test audience language and acquisition signal',label:'Growth pilot',color:''},
    {product:'ASHWOOD',detail:'Catalog discoverability, portfolio clarity, sandbox staging',label:'Design review',color:'slate'},
    {product:'Career Ops',detail:'Application tracker consistency and evidence-backed job matching',label:'Quality gate',color:'amber'}
  ];
  const sampleMissions=[
    {n:'01',title:'Observe market signals',detail:'Scout + Steward · source-backed findings for ailhat',state:'PROPOSED',color:'blue'},
    {n:'02',title:'Stage ALVIRA clarity improvements',detail:'Bill → Router → Eugene → W Dog · isolated draft only',state:'STAGING',color:''},
    {n:'03',title:'Verify ASHWOOD navigation',detail:'Designer + W Dog · preserve modeling route and existing design',state:'REVIEW',color:'amber'},
    {n:'04',title:'Prepare a measurable growth test',detail:'Scout · no public posting without governed approval',state:'BOUNDED',color:'slate'}
  ];
  function addRadarItem(item) {
    const node=elt('div','radar-item'),body=elt('div','');
    body.append(elt('b','',item.product),elt('small','',item.detail));
    node.append(body,elt('span','mini-status '+(item.color||''),item.label));return node;
  }
  function addMissionItem(item) {
    const node=elt('div','mission-item'),body=elt('div','');
    body.append(elt('b','',item.title),elt('small','',item.detail));
    node.append(elt('span','mission-step',item.n),body,elt('span','mini-status '+(item.color||''),item.state));return node;
  }
  function renderWorkforce() {
    const main=document.querySelector('main.main');
    main.dataset.workspaceView=workspacePerspective;
    main.classList.toggle('is-connected',connected);
    $('build-dashboard').hidden=workspacePerspective!=='build';
    $('team-dashboard').hidden=workspacePerspective!=='team';
    for (const view of ['build','team']) {
      const b=$('view-'+view),active=view===workspacePerspective;
      b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;
    }
    const ribbon=document.querySelector('.priority-ribbon');
    const isForeground=foregroundDemo&&!connected;
    ribbon.classList.toggle('foreground',isForeground);
    $('priority-title').textContent=isForeground?'Foreground priority — simulated owner session':
      connected?'Connected feed — foreground reservation unverified':'Autonomous mode — background eligible';
    $('priority-description').textContent=isForeground?
      'Example: no new background calls on competing quota buckets. Safe checkpoint/yield; keep no-model wakes active. Nothing is paused on your host.':
      connected?'The connected activity feed does not attest global owner-session priority. Do not infer that workers have been paused.':
      'Example background workforce may act on existing standing mandates while no owner session is registered.';
    $('simulate-focus').disabled=connected;
    $('simulate-focus').textContent=connected?'Control unavailable on feed':isForeground?'End example session':'Simulate owner session';
    $('priority-explainer').textContent=connected?'This bridge does not control quotas.':'Switching perspectives never changes capacity.';
    const stamp=$('reality-stamp');
    stamp.querySelector('strong').textContent=connected?'SESSION FEED ONLY':'SIMULATION';
    stamp.querySelector('small').textContent=connected?'Portfolio/priority telemetry not connected':'Sample missions, not host events';
    document.querySelectorAll('.concept-marker').forEach(el=>el.textContent=connected?'PORTFOLIO DATA UNAVAILABLE':'ILLUSTRATIVE WORKFLOW');
    const radar=$('radar-list'),queue=$('autonomous-queue');
    radar.replaceChildren();queue.replaceChildren();
    if(connected){
      radar.append(elt('p','notice','No authenticated portfolio signal projection is attached. Session lanes below may be observed, but these product states are UNKNOWN.'));
      queue.append(elt('p','notice','No canonical autonomous mission queue projection is attached. Do not infer dispatch or staged work from this concept panel.'));
    }else{
      for(const item of sampleRadar)radar.append(addRadarItem(item));
      for(const item of sampleMissions)queue.append(addMissionItem({
        ...item,
        state:isForeground&&item.state==='STAGING'?'YIELD · DEMO':item.state,
        color:isForeground&&item.state==='STAGING'?'amber':item.color
      }));
    }
  }
  $('view-build').addEventListener('click',()=>{workspacePerspective='build';renderWorkforce()});
  $('view-team').addEventListener('click',()=>{workspacePerspective='team';renderWorkforce()});
  $('simulate-focus').addEventListener('click',()=>{if(connected)return;foregroundDemo=!foregroundDemo;workspacePerspective=foregroundDemo?'team':'build';renderWorkforce()});
  // This capture listener visually demonstrates the desired foreground-preemption rule.
  // It does not call providers, pause jobs, persist session leases, or grant authority.
  $('composer').addEventListener('submit',()=>{
    if(!connected&&$('prompt').value.trim()){
      foregroundDemo=true;
      workspacePerspective='team';
      renderWorkforce();
    }
  },true);
  document.querySelectorAll('.perspective-tab').forEach((button,i,all)=>{
    button.addEventListener('keydown',e=>{
      if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
        e.preventDefault();
        const next=all[(i+(e.key==='ArrowRight'?1:all.length-1))%all.length];
        next.click();next.focus();
      }
    });
  });

  render();
})();