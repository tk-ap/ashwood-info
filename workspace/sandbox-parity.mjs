/* Hosted ASHWOOD V2 structural port: component hierarchy, not a legacy CSS skin.
 * Existing authenticated controllers keep ownership of their DOM IDs and data.
 * Fictional here.now fixtures are deliberately not copied into private Workspace.
 */
const q=(s,root=document)=>root.querySelector(s);
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n}
function section(number,title,description,children=[]){
 const root=el("section","hosted-section");
 root.dataset.hostedSection=number;
 const head=el("header","hosted-section__head");
 const label=el("h2","hosted-section__title");
 label.append(el("span","hosted-section__number",number),el("span","hosted-section__name",title));
 head.append(label,el("p","hosted-section__description",description));
 root.append(head,...children.filter(Boolean));
 return root;
}
function relocate(root,items){items.forEach(node=>{if(node)root.append(node)})}
function buildToday(){
 const host=q("#today");if(!host||host.dataset.hostedMounted)return;
 host.dataset.hostedMounted="true";
 const cockpit=q(".today-cockpit",host),pulse=q("#ops-pulse",host),panels=q(".today-grid",host),
 movement=q(".today-movement",host),sessions=q(".today-sessions",host),
 objective=q(".today-objective",host);
 const first=section("00","What may be slipping","Across your commitments");
 const provenance=el("p","hosted-provenance","No fictional demo records. Only verified owner and connected source data are shown.");
 first.append(provenance);
 const summary=el("div","hosted-summary");
 relocate(summary,[cockpit]);
 first.append(summary);
 const second=section("01","What matters","Current priorities and next actions");
 relocate(second,[panels]);
 const third=section("02","What agents are doing","Freshness from recorded sources");
 relocate(third,[pulse,sessions]);
 const fourth=section("03","Needs you","Owner decisions and approvals");
 relocate(fourth,[objective]);
 const fifth=section("04","What changed","Evidence and recent movement");
 relocate(fifth,[movement]);
 const sixth=section("05","Attention budget","Prioritize only what can be verified");
 const note=el("p","hosted-provenance","Unverified activity is not represented as completed work.");
 sixth.append(note);
 host.prepend(first,second,third,fourth,fifth,sixth);
 const intro=q(".today-head",host);if(intro)intro.classList.add("hosted-secondary");
}
function buildSelf(){
 const brain=q("#brain-explorer"),mirror=q("#self-alignment-mirror");
 if(!brain||!mirror||brain.dataset.hostedMounted)return;
 brain.dataset.hostedMounted="true";
 mirror.before(brain);
 const title=q("#brain-explorer-title");if(title)title.textContent="A connected reading.";
 const kicker=q(".brain-explorer__head .section-kicker");if(kicker)kicker.textContent="Self · linked ideas";
 const demo=q(".brain-explorer__demo");if(demo)demo.textContent="DEMO CONCEPTS · PRIVATE BRAIN DISCONNECTED";
 const stage=q(".brain-explorer__stage",brain);
 if(stage){
  const labels=q(".brain-explorer__stage-top",stage);
  if(labels){labels.firstElementChild.textContent="CONCEPTS · CONNECTIONS";labels.lastElementChild.textContent="NOT A NEUROLOGICAL MAP"}
 }
 const reading=q(".brain-explorer__reading",brain);
 if(reading)reading.classList.add("hosted-reading");
 const rhythm=section("A","Rhythm","Private signals · source-aware");
 const rhythmGrid=el("div","hosted-rhythm");
 for(const [name,description] of [["Sleep","No source connected — not shown."],["Deep-work blocks this week","No verified source connected."],["Days since a full rest day","No verified source connected."]]){
  const item=el("article","hosted-rhythm__item");item.append(el("h3","",name),el("strong","","—"),el("p","",description));rhythmGrid.append(item)
 }
 rhythm.append(rhythmGrid);
 const second=section("B","Second Brain","Capture · connections · provenance");
 const status=el("p","hosted-provenance","Owner Brain records are not loaded in this preview. Sample concepts above are illustrative and are not private notes.");
 second.append(status);
 const existing=q("#self-daily-wisdom");
 if(existing)existing.before(rhythm,second);else brain.after(rhythm,second);
 mirror.classList.add("hosted-self-followup");
}
function buildShell(){
 const nav=q(".workspace-section-nav");
 if(nav&&!nav.querySelector(".hosted-brand")){
  const brand=el("div","hosted-brand");brand.append(el("strong","","ASHWOOD"),el("span","","WORKSPACE"));nav.prepend(brand);
 }
 const shell=q(".workspace-shell");if(shell)shell.classList.add("hosted-workspace");
 const intro=q(".workspace-view-intro");if(intro)intro.classList.add("hosted-intro");
}
function init(){document.body.classList.add("hosted-parity");buildShell();buildToday();buildSelf()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
