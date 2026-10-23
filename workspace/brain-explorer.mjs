/* ASHWOOD Workspace Brain: read-only, zero-network demo. No owner notes or persistence. */
const root = document.getElementById("brain-explorer");
if (root) {
  const $ = (sel) => root.querySelector(sel);
  const DEMO = Object.freeze([
    {id:"emerson",name:"Self-reliance",author:"Ralph Waldo Emerson",work:"Self-Reliance (1841)",url:"https://www.gutenberg.org/ebooks/2944",kind:"agency",quote:"Trust thyself: every heart vibrates to that iron string.",meaning:"A call to examine inherited expectations and make choices that reflect considered conviction, rather than reflexive conformity.",question:"Where is agreement replacing your own judgment?",links:["thoreau","wollstonecraft","james"]},
    {id:"thoreau",name:"Deliberate living",author:"Henry David Thoreau",work:"Walden (1854)",url:"https://www.gutenberg.org/ebooks/205",kind:"agency",quote:"I went to the woods because I wished to live deliberately.",meaning:"An experiment in reducing unnecessary complexity so that attention and action serve a chosen life.",question:"What activity could you remove without losing what matters?",links:["emerson","aurelius","woolf"]},
    {id:"aurelius",name:"The examined response",author:"Marcus Aurelius",work:"Meditations",url:"https://www.gutenberg.org/ebooks/2680",kind:"attention",quote:"",meaning:"A Stoic practice of distinguishing events from the judgments and responses within one's control.",question:"What is yours to decide in this situation?",links:["epictetus","james","thoreau"]},
    {id:"epictetus",name:"The boundary of control",author:"Epictetus",work:"Enchiridion",url:"https://www.gutenberg.org/ebooks/45109",kind:"attention",quote:"",meaning:"The discipline of attending to one's own judgments and actions without confusing influence with ownership.",question:"Which part can you act on today, and which part cannot be guaranteed?",links:["aurelius","douglass"]},
    {id:"wollstonecraft",name:"Independent judgment",author:"Mary Wollstonecraft",work:"A Vindication of the Rights of Woman (1792)",url:"https://www.gutenberg.org/ebooks/3420",kind:"freedom",quote:"",meaning:"Education and the development of reason are conditions of genuine independence, not merely status or permission.",question:"What skill expands your ability to choose?",links:["emerson","douglass","dubois"]},
    {id:"james",name:"Attention becomes experience",author:"William James",work:"The Principles of Psychology (1890)",url:"https://www.gutenberg.org/ebooks/57628",kind:"attention",quote:"",meaning:"Attention selects from a wider field of experience. Practice changes what becomes vivid and actionable.",question:"What is consuming attention without improving understanding?",links:["emerson","aurelius","woolf"]},
    {id:"douglass",name:"Learning as liberation",author:"Frederick Douglass",work:"Narrative of the Life of Frederick Douglass (1845)",url:"https://www.gutenberg.org/ebooks/23",kind:"freedom",quote:"",meaning:"Douglass's account places literacy, self-authorship, and material freedom in direct relationship, rather than treating autonomy as an abstraction.",question:"Where must insight be paired with real access or resources?",links:["wollstonecraft","dubois","epictetus"]},
    {id:"dubois",name:"Double consciousness",author:"W. E. B. Du Bois",work:"The Souls of Black Folk (1903)",url:"https://www.gutenberg.org/ebooks/408",kind:"relation",quote:"",meaning:"The tension of encountering oneself through one's own experience and through an unequal society's gaze.",question:"Whose standards shape the way you evaluate yourself?",links:["douglass","wollstonecraft","woolf"]},
    {id:"woolf",name:"A room to create",author:"Virginia Woolf",work:"A Room of One's Own (1929)",url:"https://www.gutenberg.org/ebooks/65545",kind:"freedom",quote:"",meaning:"Intellectual and creative freedom depend on practical conditions such as privacy, time, and economic agency.",question:"What environment would make serious creation sustainable?",links:["thoreau","dubois","james"]}
  ]);
  const byId = new Map(DEMO.map((node) => [node.id, node]));
  const scope = $(".brain-explorer__scope");
  const canvas = $(".brain-explorer__canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const input = $(".brain-explorer__search");
  const picker = $(".brain-explorer__select");
  const reset = $(".brain-explorer__reset");
  const rotate = $(".brain-explorer__rotate");
  const name = $(".brain-explorer__reading-title");
  const author = $(".brain-explorer__author");
  const meaning = $(".brain-explorer__meaning");
  const quote = $(".brain-explorer__quote");
  const prompt = $(".brain-explorer__question");
  const source = $(".brain-explorer__source");
  const connections = $(".brain-explorer__connections");
  const availability = $(".brain-explorer__availability");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const shades = {agency:"#dcaf78",attention:"#86bbb1",freedom:"#a8be85",relation:"#b69dbe"};
  let selected = "emerson", yaw = -.32, pitch = .12, zoom = 1, moving = false, dragging = false, lastPointer = null, shown = false, frame = 0, width = 0, height = 0, hitboxes = [];
  const nodePositions = new Map(DEMO.map((n,i)=>{
    const angle = i * Math.PI * (3-Math.sqrt(5));
    const z = 1 - 2*(i+.5)/DEMO.length;
    const r = Math.sqrt(1-z*z);
    return [Math.cos(angle)*r*1.03,Math.sin(angle)*r*.76,z*.72];
  }));
  const brainDots=[];
  const count=2879;
  for(let i=0;i<count;i++){
    const t=(i+.5)/count;
    const a=i*2.399963229728653;
    const side=i%2===0?-1:1;
    const u=Math.cos(a),v=Math.sin(a);
    const longitudinal=Math.acos(1-2*t);
    const wave=Math.sin(longitudinal*17+a*.65)*.042+Math.cos(longitudinal*30-a*.23)*.019;
    const x=side*(.08+Math.abs(Math.sin(longitudinal)*u)*.91)*(1+wave);
    const y=Math.cos(longitudinal)*.80*(1+wave);
    const z=Math.sin(longitudinal)*v*.84*(1+wave);
    brainDots.push({p:[x,y,z],side});
  }
  function text(node,str){node.textContent=str;}
  function current(){return byId.get(selected) || DEMO[0];}
  function select(id){
    if(!byId.has(id))return;
    selected=id;
    const n=current();
    text(name,n.name);
    text(author,n.author+" · "+n.work);
    text(meaning,n.meaning);
    quote.hidden=!n.quote;
    text(quote,n.quote);
    text(prompt,n.question);
    source.href=n.url;
    source.textContent="Read "+n.work;
    connections.replaceChildren();
    for(const key of n.links){
      const next=byId.get(key);
      if(!next)continue;
      const button=document.createElement("button");
      button.type="button";button.className="brain-explorer__connection";
      button.textContent=next.name;
      button.addEventListener("click",()=>select(next.id));
      connections.append(button);
    }
    if(picker.value!==id)picker.value=id;
    canvas.setAttribute("aria-label","Brain model. Selected: "+n.name+". Drag to rotate or use arrow keys.");
    draw();
  }
  function fillPicker(filter=""){
    const q=filter.trim().toLowerCase();
    const results=DEMO.filter(n=>(n.name+" "+n.author+" "+n.work).toLowerCase().includes(q));
    picker.replaceChildren();
    for(const n of results){const option=document.createElement("option");option.value=n.id;option.textContent=n.name+" — "+n.author;picker.append(option);}
    if(results.length){picker.value=results.some(n=>n.id===selected)?selected:results[0].id;}
    else{const option=document.createElement("option");option.value="";option.textContent="No matching ideas";picker.append(option);}
  }
  function transform(p){
    const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
    const xx=p[0]*cy-p[2]*sy,z=p[0]*sy+p[2]*cy;
    return [xx,p[1]*cp-z*sp,p[1]*sp+z*cp];
  }
  function project(p){
    const [x,y,z]=transform(p);
    const perspective=3.5/(3.5-z);
    const unit=Math.min(width*.41,height*.42)*zoom;
    return {x:width*.5+x*unit*perspective,y:height*.51-y*unit*perspective,z,scale:perspective};
  }
  function measure(){
    if(!shown)return;
    const rect=canvas.getBoundingClientRect();
    const w=Math.floor(rect.width),h=Math.floor(rect.height);
    if(w<1||h<1)return;
    const dpr=Math.min(window.devicePixelRatio||1,2);
    if(width!==w||height!==h||canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){
      width=w;height=h;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    draw();
  }
  function draw(){
    if(!shown||!ctx||!width||!height)return;
    const bg=getComputedStyle(root).getPropertyValue("--brain-bg").trim()||"#151d1b";
    ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
    const dots=brainDots.map(dot=>({point:project(dot.p),side:dot.side})).sort((a,b)=>a.point.z-b.point.z);
    for(const dot of dots){
      const p=dot.point;
      const alpha=.14+(p.z+1.2)*.22;
      ctx.beginPath();ctx.fillStyle="rgba(157,192,174,"+Math.max(.05,Math.min(.6,alpha))+")";
      ctx.arc(p.x,p.y,Math.max(.48,(p.z+1.5)*.62*p.scale),0,Math.PI*2);ctx.fill();
    }
    const p1=new Map(DEMO.map(n=>[n.id,project(nodePositions.get(n.id))]));
    const n=current();
    for(const target of n.links){
      const a=p1.get(selected),b=p1.get(target);
      if(!a||!b)continue;
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(width/2,height*.46,b.x,b.y);
      ctx.lineWidth=1.5;ctx.strokeStyle="rgba(220,175,120,.55)";ctx.stroke();
    }
    hitboxes=[];
    const ordered=DEMO.slice().sort((a,b)=>p1.get(a.id).z-p1.get(b.id).z);
    for(const node of ordered){
      const p=p1.get(node.id),active=node.id===selected;
      const rad=active?7.5:5.2;
      ctx.beginPath();ctx.arc(p.x,p.y,rad+4,0,Math.PI*2);ctx.fillStyle=active?"rgba(220,175,120,.18)":"rgba(0,0,0,.16)";ctx.fill();
      ctx.beginPath();ctx.arc(p.x,p.y,rad,0,Math.PI*2);
      ctx.fillStyle=shades[node.kind]||shades.agency;ctx.fill();
      if(active){
        ctx.font="500 12px Arial, sans-serif";ctx.textAlign=p.x>width*.62?"right":"left";
        ctx.fillStyle="#f1eee5";ctx.fillText(node.name,p.x+(p.x>width*.62?-15:15),p.y-14);
      }
      hitboxes.push({id:node.id,x:p.x,y:p.y,r:19});
    }
  }
  function tick(){
    frame=0;
    if(!shown||!moving||reduced.matches||document.hidden)return;
    yaw+=.002;
    draw();
    frame=requestAnimationFrame(tick);
  }
  function stop(){if(frame)cancelAnimationFrame(frame);frame=0;}
  function updateMotion(){
    moving=moving&&!reduced.matches;
    rotate.setAttribute("aria-pressed",String(moving));
    rotate.textContent=moving?"Pause rotation":"Rotate";
    stop();if(moving&&shown)frame=requestAnimationFrame(tick);
  }
  function authReady(){
    return document.body.dataset.workspaceAuth==="authenticated";
  }
  function activate(){
    if(shown||!authReady())return;
    shown=true;
    scope.hidden=false;
    availability.hidden=true;
    measure();
    select(selected);
    updateMotion();
  }
  function deactivate(){
    shown=false;stop();scope.hidden=true;availability.hidden=false;
    text(availability,"Unlock Workspace to explore the Brain.");
  }
  input.addEventListener("input",()=>fillPicker(input.value));
  picker.addEventListener("change",()=>select(picker.value));
  reset.addEventListener("click",()=>{yaw=-.32;pitch=.12;zoom=1;moving=false;input.value="";fillPicker();select("emerson");updateMotion();});
  rotate.addEventListener("click",()=>{moving=!moving;updateMotion();});
  canvas.addEventListener("pointerdown",ev=>{
    if(!shown)return;
    dragging=false;lastPointer={x:ev.clientX,y:ev.clientY};canvas.setPointerCapture(ev.pointerId);
  });
  canvas.addEventListener("pointermove",ev=>{
    if(!lastPointer)return;
    const dx=ev.clientX-lastPointer.x,dy=ev.clientY-lastPointer.y;
    if(Math.abs(dx)+Math.abs(dy)>2)dragging=true;
    if(dragging){yaw+=dx*.008;pitch=Math.max(-.75,Math.min(.75,pitch+dy*.006));stop();moving=false;updateMotion();draw();}
    lastPointer={x:ev.clientX,y:ev.clientY};
  });
  canvas.addEventListener("pointerup",ev=>{
    if(!lastPointer)return;
    if(!dragging){
      const box=canvas.getBoundingClientRect(),x=ev.clientX-box.left,y=ev.clientY-box.top;
      const h=hitboxes.slice().reverse().find(p=>Math.hypot(x-p.x,y-p.y)<p.r);
      if(h)select(h.id);
    }
    lastPointer=null;dragging=false;
  });
  canvas.addEventListener("pointercancel",()=>{lastPointer=null;dragging=false;});
  canvas.addEventListener("wheel",ev=>{
    if(!shown)return;
    ev.preventDefault();zoom=Math.min(1.5,Math.max(.7,zoom-ev.deltaY*.0008));draw();
  },{passive:false});
  canvas.addEventListener("keydown",ev=>{
    if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(ev.key))return;
    ev.preventDefault();
    if(ev.key==="ArrowLeft")yaw-=.13;
    if(ev.key==="ArrowRight")yaw+=.13;
    if(ev.key==="ArrowUp")pitch=Math.max(-.75,pitch-.1);
    if(ev.key==="ArrowDown")pitch=Math.min(.75,pitch+.1);
    moving=false;updateMotion();draw();
  });
  new ResizeObserver(measure).observe(canvas);
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden)stop();else if(shown){measure();updateMotion();}
  });
  window.addEventListener("ashwood:workspace-authenticated",activate);
  window.addEventListener("ashwood:workspace-locked",deactivate);
  const observer=new MutationObserver(()=>{if(authReady())activate();else if(shown)deactivate();});
  observer.observe(document.body,{attributes:true,attributeFilter:["data-workspace-auth"]});
  const viewObserver=new MutationObserver(()=>{
    if(!shown)return;
    const active=root.dataset.workspaceActive==="true";
    if(!active)stop();else{measure();updateMotion();}
  });
  viewObserver.observe(root,{attributes:true,attributeFilter:["data-workspace-active"]});
  fillPicker();
  activate();
}
