const q=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const WEIGHTS=[
["durable","Durable work persistence",10],["recovery","Restart / recovery reconciliation",8],["authority","Governed authority + sender provenance",8],["routing","Capacity-aware routing",7],["harness","Harness / provider interchangeability",6],["handoff","Agent-to-agent handoff",7],["verification","Independent verification",8],["evidence","Evidence persistence",7],["retry","Retry / park / resume lifecycle",7],["human","Human-interruption discipline",6],["telegram","Telegram operator interface",6],["convergence","Runtime / canonical convergence",7],["external","External-operation reconciliation",4],["workspace","Cross-domain Workspace integration",5],["telemetry","Self-observation / health telemetry",4]
];
const SCORE={VERIFIED:1,PARTIAL:.5,BLOCKED:0,UNVERIFIED:0};
let timer=null,lastScore=null;
async function read(url){const r=await fetch(url,{credentials:"same-origin",cache:"no-store"});const b=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(new Error(b.error||("HTTP "+r.status)),{status:r.status});return b}
async function ensureAuth(){
 const s=await read("/api/workspace-auth"); if(s.authenticated)return true;
 return new Promise(resolve=>{const host=document.createElement("div");host.className="health-auth";host.innerHTML='<form><p class="health-kicker">ASHWOOD · PRIVATE WORKSPACE</p><h2>Unlock AgentOS Health</h2><p>This page reads the same protected Workspace projection as the operating board.</p><label>Passphrase<input name="passphrase" type="password" autocomplete="current-password" minlength="12" required></label><p class="auth-error" aria-live="polite"></p><button type="submit">Unlock</button></form>';document.body.appendChild(host);host.querySelector("input").focus();host.querySelector("form").addEventListener("submit",async e=>{e.preventDefault();const err=host.querySelector(".auth-error");err.textContent="";try{await readPost("/api/workspace-auth",{action:"login",passphrase:new FormData(e.currentTarget).get("passphrase")});host.remove();resolve(true)}catch(x){err.textContent=x.message}})})
}
async function readPost(url,body){const r=await fetch(url,{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const b=await r.json().catch(()=>({}));if(!r.ok)throw new Error(b.error||("HTTP "+r.status));return b}
const txt=row=>[row.title,row.summary,row.blocker,row.next_gate,row.phase,row.status,JSON.stringify(row.metadata||{})].filter(Boolean).join(" ").toLowerCase();
const any=(rows,re)=>rows.some(r=>re.test(txt(r)));
const firstMeta=(rows,keys)=>{for(const r of rows){for(const k of keys){if(r?.metadata?.[k])return String(r.metadata[k])}}return null};
function ageLabel(date){const t=Date.parse(date||"");if(!Number.isFinite(t))return"timestamp unavailable";const m=Math.max(0,Math.floor((Date.now()-t)/60000));return m<1?"just now":m<60?m+"m ago":m<1440?Math.floor(m/60)+"h ago":Math.floor(m/1440)+"d ago"}
function derive(board,commands){
 const rows=Array.isArray(board?.rows)?board.rows:[];
 const observed=board?.observed_at||null;
 const age=Number.isFinite(Date.parse(observed||""))?Date.now()-Date.parse(observed):Infinity;
 const assigned=[...new Set(rows.map(r=>r.assignee).filter(Boolean))];
 const underway=rows.filter(r=>/running|in_progress|review|waiting_approval|approved|release_pending/i.test([r.status,r.phase,r.lane].join(" ")));
 const blocked=rows.filter(r=>/blocked|stuck|parked|collision|revoked|failed|waiting_capacity/i.test([r.status,r.phase,r.lane].join(" ")));
 const owner=rows.filter(r=>/human|owner|approval|needs_you|waiting_approval/i.test(txt(r)));
 const canonical=firstMeta(rows,["canonical_sha","canonical_commit","main_sha"]);
 const runtime=firstMeta(rows,["runtime_sha","runtime_commit","live_sha"]);
 const hasIds=rows.some(r=>r.work_id&&r.task_id);
 const hasSnapshot=Boolean(board?.snapshot_id||rows.some(r=>r.snapshot_id));
 const evidenceLinks=rows.filter(r=>r.canonical_url||r?.metadata?.evidence||r?.metadata?.evidence_ref).length;
 const agents=new Set(assigned.map(x=>String(x).toLowerCase()));
 const providers=["claude","codex","gemini","hermes"].filter(x=>[...agents].some(a=>a.includes(x)));
 const caps={};
 const set=(id,state,proof,next)=>caps[id]={state,proof,next};
 set("durable",hasIds&&hasSnapshot?"VERIFIED":rows.length?"PARTIAL":"UNVERIFIED",hasIds&&hasSnapshot?"Work/task identity and a durable board snapshot are present.":"Board data exists, but durable identity/snapshot proof is incomplete.","Require task/work IDs plus reconstructable persisted snapshot.");
 set("recovery",any(rows,/restart|recover|reconcile|stale worker|lease|fenc/)? "PARTIAL":"UNVERIFIED",any(rows,/restart|recover|reconcile|stale worker|lease|fenc/)?"Recovery/reconciliation work is visible, but this page cannot prove a successful restart cycle yet.":"No restart/recovery evidence is exposed in the current projection.","Persist and surface a bounded restart/recovery proof event.");
 set("authority",rows.some(r=>r.authority_expires||r?.metadata?.authority_ref||r?.metadata?.sender_type)?"PARTIAL":"UNVERIFIED",rows.some(r=>r.authority_expires||r?.metadata?.authority_ref||r?.metadata?.sender_type)?"Authority-related metadata is visible; end-to-end sender provenance is not yet proven here.":"No authority provenance fields are observable in this projection.","Expose durable authority_ref + sender_type/interaction lineage.");
 set("routing",any(rows,/capacity reason|capacity-aware|routing decision|selected harness/)?"VERIFIED":rows.some(r=>r.assignee)&&rows.some(r=>r.lane||r.status)?"PARTIAL":"UNVERIFIED",any(rows,/capacity reason|capacity-aware|routing decision|selected harness/)?"Capacity/routing evidence is explicitly visible in the canonical projection.":rows.some(r=>r.assignee)&&rows.some(r=>r.lane||r.status)?"Assignment and lifecycle state are visible, but capacity-aware routing is not fully proven.":"Routing evidence is incomplete.","Surface routing decision, capacity reason and selected harness.");
 set("harness",providers.length>=2?"PARTIAL":"UNVERIFIED",providers.length>=2?"Multiple harness/provider identities are visible ("+providers.join(", ")+"), but substitution parity is not proven.":"Fewer than two model/harness identities are observable.","Prove one governed work item can safely switch harness/provider.");
 set("handoff",any(rows,/handoff|upstream|downstream|agent.to.agent|review return/)?"PARTIAL":"UNVERIFIED",any(rows,/handoff|upstream|downstream|agent.to.agent|review return/)?"Cross-agent handoff work is visible; autonomous relay completion remains unproven.":"No direct agent-to-agent handoff proof in the projection.","Persist sender/recipient handoff lineage and successful relay evidence.");
 set("verification",any(rows,/independent review|reviewer|verifier|verification/)? "PARTIAL":"UNVERIFIED",any(rows,/independent review|reviewer|verifier|verification/)?"Independent-review activity is visible; reviewer/implementer separation is not yet fully machine-proven here.":"No independent-verification proof is exposed.","Persist implementer and independent verifier identities with verdict.");
 set("evidence",evidenceLinks>0?"PARTIAL":"UNVERIFIED",evidenceLinks>0?evidenceLinks+" rows expose durable evidence/source links.":"No durable evidence references are visible.","Require evidence_ref/canonical_url on terminal transitions.");
 set("retry",rows.some(r=>Number(r.attempts)>0)||blocked.length?"PARTIAL":"UNVERIFIED",rows.some(r=>Number(r.attempts)>0)||blocked.length?"Attempts and/or parked/blocked states are observable; automatic recovery completion is not proven.":"No retry/park/resume evidence is visible.","Surface retry decision, park reason and successful resume.");
 set("human",rows.length?(owner.length===0?"PARTIAL":"PARTIAL"):"UNVERIFIED",rows.length?owner.length+" current rows look like they may require owner intervention. Legitimate authority asks are not yet separated from orchestration toil.":"No board data to measure human interruption.","Tag interruptions as AUTHORITY / DECISION / ACCESS / ORCHESTRATION_TOIL.");
 set("telegram",any(rows,/telegram|milchik|hermes bot|operator interface/)?"PARTIAL":"UNVERIFIED",any(rows,/telegram|milchik|hermes bot|operator interface/)?"Telegram/Hermes/Milchik work is visible; a bounded governed E2E pass is not exposed.":"No Telegram operator proof is visible.","Persist one Hermes submit → AgentOS lifecycle → Milchik report E2E proof.");
 set("convergence",canonical&&runtime?(canonical===runtime?"VERIFIED":"BLOCKED"):"UNVERIFIED",canonical&&runtime?(canonical===runtime?"Canonical and live runtime SHAs match.":"Canonical and live runtime SHAs differ."):"Runtime and canonical SHAs are not exposed to this projection.",canonical&&runtime&&canonical!==runtime?"Reconcile runtime and canonical code before activation.":"Expose both canonical_sha and runtime_sha with freshness.");
 set("external","UNVERIFIED","Durable external-operation reconciliation is not proven by the current Workspace projection.","Persist external operation intent, receipt, reconciliation and terminal evidence.");
 set("workspace",rows.length&&Number.isFinite(Date.parse(observed||""))?"VERIFIED":"PARTIAL",rows.length?"ASHWOOD is reading the authenticated AgentOS board projection with source freshness.":"The page is mounted, but the canonical board source is unavailable.","Keep this page projection-only and preserve source timestamps.");
 set("telemetry",age<5*60000?"VERIFIED":age<30*60000?"PARTIAL":Number.isFinite(age)?"BLOCKED":"UNVERIFIED",Number.isFinite(age)?"Latest AgentOS projection observed "+ageLabel(observed)+".":"No source observation timestamp is available.",age>=30*60000?"Restore the AgentOS → Workspace sync before trusting health.":"Add direct runtime heartbeat/evidence events.");
 const score=Math.round(WEIGHTS.reduce((sum,[id,,w])=>sum+w*SCORE[caps[id].state],0));
 return {rows,observed,assigned,providers,underway,blocked,owner,canonical,runtime,caps,score,commands:Array.isArray(commands?.commands)?commands.commands:[]}
}
function render(d){
 q("#autonomy-value").textContent=d.score+"%";q("#autonomy-fill").style.width=d.score+"%";q("#autonomy-track").setAttribute("aria-valuenow",d.score);
 const ranked=WEIGHTS.map(([id,name,w])=>({id,name,w,...d.caps[id]})).filter(x=>x.state!=="VERIFIED").sort((a,b)=>b.w-a.w);
 const constraint=ranked[0];q("#autonomy-constraint").textContent=constraint?constraint.name+" — "+constraint.state:"No unresolved capability in rubric";
 const fresh=Date.parse(d.observed||"");const age=Number.isFinite(fresh)?Date.now()-fresh:Infinity;
 const health=age>30*60000?"STALE":d.caps.convergence.state==="BLOCKED"?"DEGRADED":d.score>=75?"STRONG":d.score>=45?"BUILDING":"EARLY";
 q("#health-overall").textContent=health;q("#health-freshness").textContent=d.observed?"AgentOS projection · "+ageLabel(d.observed):"Source timestamp unavailable";q("#health-source-state").textContent=d.observed?"Synced · "+ageLabel(d.observed):"Projection unavailable";
 q("#stat-underway").textContent=d.underway.length;q("#stat-owner").textContent=d.owner.length;q("#stat-blocked").textContent=d.blocked.length;q("#stat-agents").textContent=d.assigned.length;q("#stat-snapshot").textContent=(d.rows.find(r=>r.snapshot_id)?.snapshot_id||"—").slice(0,12);
 q("#stat-convergence").textContent=d.caps.convergence.state;q("#stat-shas").textContent=d.canonical&&d.runtime?("main "+d.canonical.slice(0,7)+" · live "+d.runtime.slice(0,7)):"SHA evidence unavailable";
 q("#capability-list").innerHTML=WEIGHTS.map(([id,name,w],i)=>{const c=d.caps[id];return '<article class="capability-row"><span class="capability-index">'+String(i+1).padStart(2,"0")+'</span><div class="capability-name"><strong>'+esc(name)+'</strong><span>'+w+'% weight</span></div><div class="capability-proof"><strong>'+esc(c.proof)+'</strong><br>'+esc(c.next)+'</div><span class="state-pill state-'+c.state+'">'+c.state+'</span></article>'}).join("");
 const accidental=Math.min(100,Math.round(((d.owner.length*2+d.blocked.length+d.commands.length)/(Math.max(1,d.rows.length+d.commands.length)))*100));
 q("#dependency-value").textContent=accidental+"%";
 const dep=[["Manual owner/approval signals",d.owner.length],["Blocked / parked work",d.blocked.length],["Queued operator commands",d.commands.length],["Manual cross-agent relay","not yet instrumented"],["Legitimate authority asks","not yet separated"]];
 q("#dependency-list").innerHTML=dep.map(([a,b])=>'<div class="dependency-item"><span>'+esc(a)+'</span><span>'+esc(b)+'</span></div>').join("");
 q("#next-gate-title").textContent=constraint?constraint.name:"Rubric complete";q("#next-gate-copy").textContent=constraint?constraint.next:"Maintain proof freshness and watch for regressions.";
 const agents=d.assigned.length?d.assigned:["No assigned agents in current projection"];
 q("#agent-list").innerHTML=agents.map(a=>{const rows=d.rows.filter(r=>r.assignee===a);const active=rows.filter(r=>/running|in_progress|review|ready/i.test([r.status,r.phase,r.lane].join(" "))).length;return '<article class="agent-card"><span class="agent-state">'+(rows.length?"Observed":"Unverified")+'</span><strong>'+esc(a)+'</strong><span>'+rows.length+' work rows · '+active+' active/review</span><p>'+(rows[0]?esc(rows[0].title):"No current assignment evidence.")+'</p></article>'}).join("");
 const events=[{t:d.observed,label:"AgentOS board snapshot",detail:d.rows.length+" rows · "+(d.rows.find(r=>r.snapshot_id)?.snapshot_id||"snapshot id unavailable")},{t:new Date().toISOString(),label:"Autonomy score computed",detail:d.score+"% from autonomy-rubric.v1"},{t:d.observed,label:"Runtime convergence",detail:d.caps.convergence.proof},{t:d.observed,label:"Human intervention signal",detail:d.owner.length+" candidate rows require classification"}];
 q("#evidence-events").innerHTML=events.map(e=>'<article class="evidence-event"><time>'+esc(e.t?new Date(e.t).toLocaleString():"unknown")+'</time><strong>'+esc(e.label)+'</strong><span>'+esc(e.detail)+'</span></article>').join("");
 if(lastScore!==null&&lastScore!==d.score){q("#health-source-state").textContent+=" · score "+(d.score>lastScore?"+":"")+String(d.score-lastScore)}lastScore=d.score
}
async function refresh(){
 q("#health-source-state").textContent="Refreshing…";
 try{
  const [board,commands]=await Promise.all([read("/api/workspace-agentos"),read("/api/workspace-state?view=commands").catch(()=>({commands:[]}))]);
  render(derive(board,commands));
 }catch(e){
  q("#health-source-state").textContent=e.status===401?"Workspace locked":"Projection unavailable";
  q("#health-overall").textContent="UNVERIFIED";q("#health-freshness").textContent="No health claim made without canonical data";
 }
}
q("#health-refresh")?.addEventListener("click",refresh);
(async()=>{await ensureAuth();await refresh();timer=setInterval(refresh,30000)})();