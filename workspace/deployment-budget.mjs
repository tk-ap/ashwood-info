const LIMIT=100;
const PROJECTS=[
  {name:"ASHWOOD",id:"prj_p0OqGFvZZU8940ePrXIoVocuTUl7"},
  {name:"ledgato",id:"prj_yMUW9t71FNsaFeJSNntNCV4tZZFe"},
  {name:"ALVIRA",id:"prj_ocnKA4Xr7Jd1aTjUKcRjYgsniy5l"},
  {name:"ailhat",id:"prj_dqOUuTJPaegWYi3l4f9Kx8vxyWOe"}
];
const ASHWOOD=PROJECTS[0];
function fmt(ts){return ts?new Intl.DateTimeFormat(undefined,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}).format(new Date(ts)):"—"}
function age(ts){if(!ts)return"unknown";const m=Math.max(0,Math.round((Date.now()-ts)/60000));return m<60?m+"m ago":Math.round(m/60)+"h ago"}
function capacity(n){return n>=LIMIT?"BLOCKED":n>=90?"CRITICAL":n>=75?"CAUTION":"SAFE"}
function stateLabel(x){if(!x)return"UNKNOWN";if(x.state==="READY"&&x.target==="production")return"LIVE";if(x.state==="READY")return"PREVIEW READY";return x.state||"UNKNOWN"}
function render(data){
 const summary=document.querySelector("#deployment-budget-summary"),projects=document.querySelector("#deployment-budget-projects"),availability=document.querySelector("#deployment-availability");
 if(!summary||!projects)return;
 const rows=(data.deployments||[]).sort((a,b)=>b.created-a.created), cutoff=Date.now()-86400000, live=rows.filter(x=>x.created>cutoff), used=live.length,left=Math.max(0,LIMIT-used),next=[...live].sort((a,b)=>a.created-b.created)[0]?.created+86400000,s=capacity(used);
 const ashwood=rows.filter(x=>x.projectId===ASHWOOD.id), prod=ashwood.find(x=>x.target==="production"&&x.state==="READY"), latest=ashwood[0], pending=ashwood.filter(x=>!x.target&&["BUILDING","QUEUED","INITIALIZING"].includes(x.state)), failed=ashwood.filter(x=>["ERROR","CANCELED"].includes(x.state)).slice(0,2);
 if(availability)availability.innerHTML=
   '<article><small>ASHWOOD production</small><strong>'+stateLabel(prod)+'</strong><span>'+(prod?age(prod.created)+" · "+(prod.state||""):"No READY production deployment observed")+'</span></article>'+
   '<article><small>Latest deployment</small><strong>'+stateLabel(latest)+'</strong><span>'+(latest?(latest.target||"preview")+" · "+age(latest.created):"No deployment observed")+'</span></article>'+
   '<article><small>Deploy availability</small><strong>'+(left>0?"AVAILABLE":"BLOCKED")+'</strong><span>'+left+' / '+LIMIT+' rolling slots remain</span></article>'+
   '<article><small>Queue / failures</small><strong>'+pending.length+' / '+failed.length+'</strong><span>active preview builds / recent canceled or error</span></article>';
 summary.innerHTML='<article><strong>'+used+' / '+LIMIT+'</strong><span>deployments used</span></article><article><strong>'+left+'</strong><span>slots available</span></article><article><strong>'+s+'</strong><span>capacity state</span></article><article><strong>'+fmt(next)+'</strong><span>next slot ages out</span></article>';
 projects.innerHTML=PROJECTS.map(p=>{const r=live.filter(x=>x.projectId===p.id);const newest=rows.find(x=>x.projectId===p.id);return '<article><strong>'+p.name+'</strong><span>'+r.length+' deployments / 24h</span><small>'+stateLabel(newest)+' · '+(newest?age(newest.created):"no recent deploy")+'</small></article>'}).join("");
 document.querySelector("#deployment-budget")?.setAttribute("data-capacity-state",s.toLowerCase());
 const note=document.querySelector("#deployment-budget-note");if(note)note.textContent="Live Vercel readout. Production status is based on the newest READY production deployment; availability combines current deployment state with the rolling 24-hour team budget.";
}
async function load(){
 const b=document.querySelector("#deployment-budget-refresh");if(b){b.disabled=true;b.textContent="Refreshing…"}
 try{const r=await fetch("/api/workspace-state?view=deployments",{credentials:"same-origin",cache:"no-store"});if(!r.ok)throw new Error("deployment data "+r.status);render(await r.json())}
 catch(e){const h=document.querySelector("#deployment-availability")||document.querySelector("#deployment-budget-summary");if(h)h.innerHTML="<p>Live deployment status unavailable: "+e.message+". This does not mean production is down.</p>"}
 finally{if(b){b.disabled=false;b.textContent="Refresh deployments"}}
}
document.querySelector("#deployment-budget-refresh")?.addEventListener("click",load);
window.addEventListener("ashwood:workspace-authenticated",load);
load();
