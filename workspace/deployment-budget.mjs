const LIMIT=100;
const PROJECTS=[
  {name:"ASHWOOD",id:"prj_p0OqGFvZZU8940ePrXIoVocuTUl7"},
  {name:"ledgato",id:"prj_yMUW9t71FNsaFeJSNntNCV4tZZFe"},
  {name:"ALVIRA",id:"prj_ocnKA4Xr7Jd1aTjUKcRjYgsniy5l"},
  {name:"ailhat",id:"prj_dqOUuTJPaegWYi3l4f9Kx8vxyWOe"}
];
function fmt(ts){return ts?new Intl.DateTimeFormat(undefined,{hour:"numeric",minute:"2-digit"}).format(new Date(ts)): "—"}
function status(n){return n>=LIMIT?"BLOCKED":n>=90?"CRITICAL":n>=75?"CAUTION":"SAFE"}
function render(data){
 const summary=document.querySelector("#deployment-budget-summary"),projects=document.querySelector("#deployment-budget-projects");
 if(!summary||!projects)return;
 const rows=data.deployments||[], now=Date.now(), cutoff=now-86400000;
 const live=rows.filter(x=>x.created>cutoff).sort((a,b)=>a.created-b.created), used=live.length, left=Math.max(0,LIMIT-used);
 const next=live[0]?.created+86400000;
 const s=status(used);
 summary.innerHTML='<article><strong>'+used+' / '+LIMIT+'</strong><span>deployments used</span></article><article><strong>'+left+'</strong><span>slots available</span></article><article><strong>'+s+'</strong><span>capacity state</span></article><article><strong>'+fmt(next)+'</strong><span>next slot ages out</span></article>';
 projects.innerHTML=PROJECTS.map(p=>{const r=live.filter(x=>x.projectId===p.id);return '<article><strong>'+p.name+'</strong><span>'+r.length+' deployments</span><small>'+r.filter(x=>x.state==="READY").length+' ready · '+r.filter(x=>x.state==="ERROR").length+' error · '+r.filter(x=>x.state==="CANCELED").length+' canceled</small></article>'}).join("");
 document.querySelector("#deployment-budget")?.setAttribute("data-capacity-state",s.toLowerCase());
}
async function load(){
 const b=document.querySelector("#deployment-budget-refresh"); if(b){b.disabled=true;b.textContent="Refreshing…"}
 try{const r=await fetch("/api/workspace-state?view=deployments",{credentials:"same-origin",cache:"no-store"});if(!r.ok)throw new Error("deployment data "+r.status);render(await r.json())}
 catch(e){const h=document.querySelector("#deployment-budget-summary");if(h)h.innerHTML="<p>Deployment capacity unavailable: "+e.message+"</p>"}
 finally{if(b){b.disabled=false;b.textContent="Refresh deployments"}}
}
document.querySelector("#deployment-budget-refresh")?.addEventListener("click",load);
window.addEventListener("ashwood:workspace-authenticated",load);
load();
