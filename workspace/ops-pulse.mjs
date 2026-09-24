import { summarizePulse } from "/workspace/ops-pulse-model.mjs";
const q = selector => document.querySelector(selector);
const esc = value => String(value ?? "").replace(/[&<>'"]/g, char =>
  ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
const read = async url => {
  const r = await fetch(url, { credentials:"same-origin", cache:"no-store" });
  if (!r.ok) throw Object.assign(new Error("HTTP " + r.status), { status:r.status });
  return r.json();
};
const ago = date => {
  const ms = Date.parse(date || "");
  if (!Number.isFinite(ms)) return "source time unavailable";
  const age = Math.max(0, Date.now()-ms);
  return age < 3600000 ? Math.floor(age/60000)+"m ago" : Math.floor(age/3600000)+"h ago";
};
let loading=false;
function miniCard(row, badge) {
  const title = esc(row.title || row.command_text || "AgentOS work");
  const summary = esc(row.next_gate || row.summary || row.error || "Open the canonical board for evidence and next transition.");
  const status = esc(row.status || row.phase || row.lane || "unknown");
  const source = row.canonical_url && /^https:\/\//.test(row.canonical_url)
    ? '<a href="'+esc(row.canonical_url)+'" target="_blank" rel="noopener">Source ↗</a>'
    : '<a href="#agentos-board-section">Open board →</a>';
  return '<article class="ops-pulse-item"><small>'+esc(badge)+' · '+status+'</small><strong>'+title+'</strong><p>'+summary+'</p>'+source+'</article>';
}
async function refresh() {
  if(loading) return;
  const host=q("#ops-pulse");if(!host)return;
  loading=true;
  const status=q("#ops-pulse-status");
  const details=q("#ops-pulse-detail");
  status.textContent="Reading protected Workspace sources…";
  const [board, commands, environment]=await Promise.allSettled([
    read("/api/workspace-board"),
    read("/api/workspace-state?view=commands"),
    read("/data/sandbox-environments.json")
  ]);
  const result=summarizePulse(
    board.status==="fulfilled"?board.value:null,
    commands.status==="fulfilled" ? commands.value.commands : null
  );
  if(!result.available) {
    status.textContent=board.reason?.status===401?"Workspace locked":"AgentOS projection unavailable";
    details.innerHTML='<p class="ops-pulse-unavailable">No operational totals shown until the authenticated board responds. This is not evidence the runtime is down.</p>';
  } else {
    const count=(id,n)=>{const el=q(id);if(el)el.textContent=String(n);};
    count("#ops-pulse-underway",result.underway.length);
    count("#ops-pulse-owner",result.owner.length);
    count("#ops-pulse-blocked",result.blocked.length);
    count("#ops-pulse-queued",commands.status==="fulfilled"?result.queued.length:"—");
    status.textContent="Workspace fetched "+new Date().toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})+
      (result.observedAt?" · source "+ago(result.observedAt):" · upstream timestamp unavailable");
    const cards=[...result.owner.slice(0,2).map(row=>miniCard(row,"Needs your decision")),
      ...result.blocked.slice(0,2).map(row=>miniCard(row,"Blocked")),
      ...result.underway.slice(0,2).map(row=>miniCard(row,"Underway"))];
    details.innerHTML=cards.join("") || '<p class="ops-pulse-unavailable">No active, blocked or review-required AgentOS rows confirmed by the current board.</p>';
    if(commands.status==="rejected") {
      details.insertAdjacentHTML("beforeend",'<p class="ops-pulse-unavailable">Command queue unavailable. Queue count is not a zero.</p>');
    }
  }
  const deployment=q("#ops-pulse-deployment");
  if(environment.status==="fulfilled") {
    const data=environment.value;
    const own=(data.products || []).find(x=>x.product_key==="ashwood");
    const snap=own?.sandbox;
    const time=data.generated_at ? ago(data.generated_at) : "time unavailable";
    deployment.innerHTML='<strong>'+esc(snap?.current_version_id || "Unassigned")+'</strong>'+
      '<span>Static environment projection · '+esc(time)+'. Check the build tracker for canonical capacity and the provider for live deployment state.</span>'+
      '<a href="#deployment-budget">Build tracker →</a>';
  } else {
    deployment.textContent="Environment projection unavailable; this does not establish deployment failure.";
  }
  loading=false;
}
q("#ops-pulse-refresh")?.addEventListener("click",refresh);
window.addEventListener("ashwood:workspace-authenticated",refresh);
window.addEventListener("ashwood:operator-command-submitted",refresh);
refresh();
