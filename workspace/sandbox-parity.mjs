/* Sandbox-first presentation adapter. Canonical API/controllers and owner gate remain authoritative. */
const $ = (selector, root=document) => root.querySelector(selector);
const heading = (number,title,description) => {
  const el=document.createElement("header");
  el.className="sandbox-parity-heading";
  const n=document.createElement("span"); n.className="sandbox-parity-heading__number"; n.textContent=number;
  const h=document.createElement("h2"); h.textContent=title;
  el.append(n,h);
  if(description){const p=document.createElement("p");p.textContent=description;el.append(p)}
  return el;
};
function init(){
  document.body.classList.add("sandbox-parity");
  const today=$("#today");
  if(today && !today.dataset.parityMounted){
    today.dataset.parityMounted="true";
    const cockpit=$(".today-cockpit",today);
    if(cockpit) {
      cockpit.before(heading("00","What may be slipping","Evidence and freshness before urgency"));
      const status=document.createElement("p");
      status.className="sandbox-parity-status";
      status.textContent="Protected live sources only. No fictional sandbox records are presented as real.";
      cockpit.before(status);
    }
    const panels=$(".today-grid",today);
    if(panels) panels.before(heading("01","What matters","Owner actions and current priorities"));
    const pulse=$(".ops-pulse",today);
    if(pulse) pulse.before(heading("02","What agents are doing","Verified execution and source freshness"));
    const movement=$(".today-movement",today);
    if(movement) movement.before(heading("03","Needs you","Decisions and next actions"));
  }
  const brain=$("#brain-explorer");
  const mirror=$("#self-alignment-mirror");
  if(brain && mirror && brain.parentNode===mirror.parentNode) mirror.before(brain);
  const title=$("#brain-explorer-title");
  if(title)title.textContent="A connected reading.";
  const kicker=$(".brain-explorer__head .section-kicker");
  if(kicker)kicker.textContent="Self · linked ideas";
  const demo=$(".brain-explorer__demo");
  if(demo)demo.textContent="DEMO DATA · PRIVATE BRAIN DISCONNECTED";
  const nav=$(".workspace-section-nav");
  if(nav && !nav.querySelector(".sandbox-parity-brand")){
    const brand=document.createElement("div");
    brand.className="sandbox-parity-brand";
    brand.innerHTML="<strong>ASHWOOD</strong><span>WORKSPACE</span>";
    nav.prepend(brand);
  }
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
