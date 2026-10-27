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
  let session='build', connected=false, loading=false, selected='codex', activityView='swim', lastFeed=null, heartbeatTimer=null;
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
        events:Array.isArray(v.events)?v.events.slice(-7).map(e=>({kind:clean(e.kind,80),label:clean(e.label,200),time:time(e.occurred_at)})):[],
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
  function renderLanes(lanes) {
    const root=$('swimlanes');root.replaceChildren();
    if(!lanes.length){root.append(elt('p','notice','No observed sessions. An empty feed does not prove the runtime is idle.'));return}
    for(const lane of lanes){
      const b=elt('button','lane'+(selected===lane.id?' selected':''));b.type='button';b.dataset.id=lane.id;
      const meta=elt('div','lane-meta'); const name=elt('div','lane-name');
      name.append(elt('span','lane-circle',(lane.agent||'?').charAt(0).toUpperCase()),elt('strong','',lane.agent));
      meta.append(name,elt('small','',lane.harness));b.append(meta);
      const track=elt('div','track'),bar=elt('span','bar '+laneStatus(lane.status),readable(lane.status)+' · '+lane.title);
      bar.style.setProperty('--left',(lane.start??8)+'%');bar.style.setProperty('--width',Math.min(lane.width??65,99-(lane.start??8))+'%');
      track.append(bar,elt('span','nowline'));b.append(track);b.addEventListener('click',()=>{selected=lane.id;render()});root.append(b);
    }
  }
  function renderEvents(lanes) {
    const root=$('event-stream');root.replaceChildren();
    const events=lanes.flatMap(l=>(l.events||[]).map(e=>({...e,agent:l.agent,harness:l.harness})));
    if(!events.length){root.append(elt('p','notice','No canonical activity events observed.'));return}
    for(const e of events){const row=elt('div','event-row');row.append(elt('time','',e.time||'—'),elt('b','',e.agent));const detail=elt('div','',e.label||e.kind);detail.append(elt('small','',e.harness+' · '+e.kind));row.append(detail);root.append(row)}
  }
  function renderTrace(lanes){
    const l=lanes.find(x=>x.id===selected)||lanes[0];
    $('trace-agent').textContent=l?l.agent+' · '+l.harness:'No selected execution';
    $('trace-state').textContent=l?readable(l.status):'UNKNOWN';
    $('trace-state').className='status-pill '+(l?laneStatus(l.status):'unknown');
    $('trace-details').replaceChildren();$('trace-evidence').replaceChildren();
    if(!l){$('trace-details').append(elt('div','','No state available'));return}
    const fields=[
      ['CURRENT TASK',l.title],['TASK REFERENCE',l.task_id||'not observed'],
      ['LAST HEARTBEAT',connected?time(l.last_heartbeat_at):'sample only'],
      ['LAST CHECKPOINT',l.checkpoint||'not observed'],
      ['CAPACITY',l.capacity?.state||'not observed'],['CONTINUITY',l.status==='handoff'?'handoff pending':l.status==='waiting'?'parked / waiting':'receipt required']
    ];
    for(const [a,b] of fields){const cell=elt('div','');cell.append(elt('small','',a),elt('strong','',b));$('trace-details').append(cell)}
    $('trace-evidence').append(elt('b','',connected?'OBSERVED RECEIPTS':'SAMPLE EVENTS'));
    for(const e of l.events||[]) $('trace-evidence').append(elt('span','',e.kind));
  }
  function render(){
    const v=views[session]||views.build;
    $('thread-title').textContent=connected?'Runtime session':v.title;
    $('thread-subtitle').textContent=connected?'Live read-only projection. The shared conversation remains a governed AgentOS ingress.':v.sub;
    const lanes=current();if(!lanes.some(x=>x.id===selected))selected=lanes[0]?.id||'';
    $('thread-meta').textContent=lanes.length+' '+(connected?'observed':'sample')+' lanes';
    metrics(lanes);renderLanes(lanes);renderEvents(lanes);renderTrace(lanes);updateMode();
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
  render();
})();