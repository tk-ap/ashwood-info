(() => {
  "use strict";

  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/" && path !== "/index.html") return;
  if (window.AshwoodDocCharacterV2) return;

  const coarse = matchMedia("(max-width:760px), (pointer:coarse)");
  const fine = matchMedia("(pointer:fine) and (hover:hover)");
  const reduce = matchMedia("(prefers-reduced-motion:reduce)");
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const chance = (p) => Math.random() < p;
  const mag = (v) => Math.hypot(v.x, v.y);
  const norm = (v) => { const d = mag(v) || 1; return { x: v.x / d, y: v.y / d }; };
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const css = document.createElement("style");
  css.textContent = `
    .ashwood-doctor-bird-cursor.ashwood-doc-character-v2{
      display:block!important;position:fixed!important;left:0!important;top:0!important;z-index:625!important;
      width:clamp(148px,14vw,210px)!important;aspect-ratio:360/247;opacity:0;visibility:hidden;
      pointer-events:none!important;transform-origin:68% 51%;will-change:transform,opacity;
      transition:opacity .34s ease,visibility 0s linear .36s;filter:drop-shadow(0 9px 20px rgba(0,0,0,.24));
      contain:layout style;
    }
    .ashwood-doctor-bird-cursor.ashwood-doc-character-v2.is-present{opacity:1!important;visibility:visible!important;transition-delay:0s}
    .ashwood-doctor-bird-cursor.ashwood-doc-character-v2.can-interact{pointer-events:auto!important;cursor:help}
    .ashwood-doc-character-v2>img:not(.ashwood-doc-character-v2__wing){display:block;width:100%;height:100%;object-fit:contain;animation:none!important;transform:none!important;filter:saturate(1.03) contrast(1.02)}
    .ashwood-doc-character-v2__wing{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:contain;pointer-events:none!important;clip-path:polygon(7% 0,83% 0,80% 57%,17% 59%);transform-origin:64% 55%;opacity:var(--doc-wing-opacity,.06);animation:ashwood-doc-v2-wing var(--doc-wing-duration,108ms) linear infinite alternate!important;filter:blur(.35px)}
    .ashwood-doc-character-v2__wing--far{opacity:.032;animation-direction:alternate-reverse!important;transform-origin:61% 54%}
    @keyframes ashwood-doc-v2-wing{from{transform:rotate(-5deg) scaleY(.88)}to{transform:rotate(7deg) scaleY(1.04)}}
    .ashwood-doc-v2-fact{position:fixed;z-index:646;width:min(254px,calc(100vw - 32px));box-sizing:border-box;padding:10px 12px 11px;border:1px solid color-mix(in srgb,var(--ashwood-field-green,#009b3a) 34%,var(--ashwood-rule));background:color-mix(in srgb,var(--ashwood-paper) 97%,transparent);color:var(--ashwood-ink);box-shadow:0 12px 34px #0002;opacity:0;transform:translateY(5px);pointer-events:none;transition:opacity .18s ease,transform .22s ease;backdrop-filter:blur(12px)}
    .ashwood-doc-v2-fact.is-visible{opacity:1;transform:none}.ashwood-doc-v2-fact b{display:block;margin-bottom:5px;color:var(--ashwood-field-green,#009b3a);font:700 7px/1 Arial,Helvetica,sans-serif;letter-spacing:.16em;text-transform:uppercase}.ashwood-doc-v2-fact span{display:block;font:500 10px/1.45 Arial,Helvetica,sans-serif}
    @media(max-width:760px),(pointer:coarse){.ashwood-doctor-bird-cursor.ashwood-doc-character-v2{display:block!important;width:132px!important;pointer-events:none!important}.ashwood-doc-v2-fact{display:none!important}}
    @media(prefers-reduced-motion:reduce){.ashwood-doc-character-v2__wing{display:none!important}.ashwood-doctor-bird-cursor.ashwood-doc-character-v2{transition:opacity .2s ease!important}}
  `;
  document.head.appendChild(css);

  const facts = [
    "The Doctor Bird is Jamaica’s national bird — the red-billed streamertail.",
    "The red-billed streamertail is endemic to Jamaica; the island is its wild home.",
    "Male red-billed streamertails grow two long black tail feathers called streamers.",
    "ASHWOOD’s XAYMACA detail points to a Taíno name associated with Jamaica, commonly rendered as ‘land of wood and water.’"
  ];

  let bird, launcher, panel, fact;
  let ready = false;
  let state = "REST";
  let guideActive = false;
  let guideIndex = 0;
  let targetEl = null;
  let targetMarker = null;
  let visible = false;
  let facing = 1;
  let bank = 0;
  let pos = { x: innerWidth + 120, y: innerHeight * .27 };
  let vel = { x: 0, y: 0 };
  let lastVel = { x: 0, y: 0 };
  let rest = { ...pos };
  let sprite = { w: 180, h: 124 };
  let trajectory = null;
  let trajectoryResolve = null;
  let behaviorId = 0;
  let lastFrame = performance.now();
  let nextDecision = performance.now() + rand(5000, 9000);
  let hiddenUntil = 0;
  let lastStimulus = 0;
  let pointer = null;
  let pointerSpeed = 0;
  let pointerCooldown = 0;
  let reactionTimer = 0;
  let factIndex = 0;
  let factTimer = 0;
  const phase = { x: rand(0, 7), y: rand(0, 7), z: rand(0, 7) };

  const setState = (next) => {
    state = next;
    if (!bird) return;
    bird.dataset.docState = next;
    bird.classList.toggle("can-interact", fine.matches && visible && ["REST","OBSERVE","INSPECT","GUIDE","PERCH"].includes(next));
  };
  const show = () => { visible = true; bird?.classList.add("is-present", "is-visible"); };
  const hide = () => { visible = false; bird?.classList.remove("is-present", "is-visible", "can-interact"); };
  const measure = () => {
    if (!bird) return;
    sprite.w = bird.offsetWidth || (coarse.matches ? 132 : 180);
    sprite.h = bird.offsetHeight || sprite.w * 247 / 360;
  };

  const anchors = () => [
    { name:"intro", el:document.querySelector(".intro"), weight:1.05 },
    { name:"capabilities", el:document.querySelector("#throughline,.principles-field"), weight:1.15 },
    { name:"portfolio", el:document.querySelector('.home-entryway[data-kind="modeling"]'), weight:.86 },
    { name:"builds", el:document.querySelector('.home-entryway[data-kind="builds"]'), weight:1 },
    { name:"about", el:document.querySelector('.home-closing a[href*="/about"]')?.closest(".home-closing"), weight:.7 },
    { name:"contact", el:document.querySelector('.home-closing a[href*="/connect"]')?.closest(".home-closing"), weight:.7 }
  ].filter((a) => a.el);

  const visibleAnchors = () => anchors().filter(({el}) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > innerHeight * .12 && r.top < innerHeight * .88;
  });

  const pick = (items) => {
    if (!items.length) return null;
    const total = items.reduce((s, a) => s + (a.weight || 1), 0);
    let n = Math.random() * total;
    for (const item of items) { n -= item.weight || 1; if (n <= 0) return item; }
    return items.at(-1);
  };

  const pointNear = (el, mode="inspect") => {
    const r = el.getBoundingClientRect();
    const mobile = coarse.matches;
    let side = innerWidth - r.right >= r.left ? 1 : -1;
    if (mode === "rest" && chance(.3)) side *= -1;
    let x;
    if (mobile) x = side > 0 ? innerWidth - 68 : 68;
    else x = side > 0 ? r.right + clamp((innerWidth - r.right) * .38, 36, 66) : r.left - clamp(r.left * .38, 36, 66);
    const fraction = mode === "guide" ? rand(.16,.25) : mode === "rest" ? rand(.12,.23) : rand(.2,.33);
    const y = r.top + Math.min(r.height * fraction, mode === "guide" ? 112 : 144);
    return { x:clamp(x, mobile?66:104, innerWidth-(mobile?66:104)), y:clamp(y, mobile?84:92, innerHeight-(mobile?116:96)) };
  };

  const neutralPoint = () => {
    const a = pick(visibleAnchors()) || pick(anchors());
    return a ? pointNear(a.el, "rest") : { x:innerWidth*.82, y:innerHeight*.24 };
  };

  const bezier = (a,b,c,d,t) => {
    const u=1-t, uu=u*u, tt=t*t;
    return { x:uu*u*a.x+3*uu*t*b.x+3*u*tt*c.x+tt*t*d.x, y:uu*u*a.y+3*uu*t*b.y+3*u*tt*c.y+tt*t*d.y };
  };
  const derivative = (a,b,c,d,t) => {
    const u=1-t;
    return { x:3*u*u*(b.x-a.x)+6*u*t*(c.x-b.x)+3*t*t*(d.x-c.x), y:3*u*u*(b.y-a.y)+6*u*t*(c.y-b.y)+3*t*t*(d.y-c.y) };
  };

  const sample = (now) => {
    if (!trajectory) return;
    const t = clamp((now - trajectory.start) / trajectory.duration, 0, 1);
    pos = bezier(trajectory.a, trajectory.b, trajectory.c, trajectory.d, t);
    const dv = derivative(trajectory.a, trajectory.b, trajectory.c, trajectory.d, t);
    vel = { x:dv.x/(trajectory.duration/1000), y:dv.y/(trajectory.duration/1000) };
    if (t >= 1) {
      pos = { ...trajectory.d };
      trajectory = null;
      const done = trajectoryResolve;
      trajectoryResolve = null;
      done?.(true);
    }
  };

  const cancelTrajectory = () => {
    if (trajectory) sample(performance.now());
    trajectory = null;
    trajectoryResolve?.(false);
    trajectoryResolve = null;
  };

  const segment = (destination, { duration, softStop=false, arcSign }={}) => new Promise((resolve) => {
    const now = performance.now();
    sample(now);
    trajectoryResolve?.(false);
    trajectoryResolve = resolve;
    const a = { ...pos };
    const delta = { x:destination.x-a.x, y:destination.y-a.y };
    const distance = Math.max(1, mag(delta));
    const dir = norm(delta);
    const perp = { x:-dir.y, y:dir.x };
    const ms = duration || clamp(distance * rand(3.1,4.1), coarse.matches?720:760, coarse.matches?1500:1650);
    const seconds = ms/1000;
    let tangent = { x:vel.x*seconds/3, y:vel.y*seconds/3 };
    const maxTangent = Math.min(distance*.3,112);
    if (mag(tangent) > maxTangent) { const n=norm(tangent); tangent={x:n.x*maxTangent,y:n.y*maxTangent}; }
    const b = { x:a.x+tangent.x, y:a.y+tangent.y };
    const arc = softStop ? 0 : rand(Math.min(16,distance*.05), Math.min(68,Math.max(22,distance*.16)));
    const sign = arcSign || (chance(.5)?1:-1);
    const lead = softStop ? 0 : Math.min(24,distance*.09);
    const c = softStop ? { ...destination } : { x:destination.x-dir.x*lead+perp.x*arc*sign, y:destination.y-dir.y*lead+perp.y*arc*sign };
    trajectory = { a,b,c,d:{...destination},start:now,duration:ms };
  });

  const moveTo = async (destination,{guide=false,delay,perch=false}={}) => {
    const id = ++behaviorId;
    clearTimeout(reactionTimer);
    show();
    if (reduce.matches) {
      pos={...destination}; rest={...destination}; vel={x:0,y:0}; setState(guide?"GUIDE":perch?"PERCH":"OBSERVE");
      return true;
    }
    if (mag(vel)<34 && Math.abs(destination.x-pos.x)>18) facing = destination.x>=pos.x?1:-1;
    setState("NOTICE");
    await sleep(delay ?? rand(guide?170:280, guide?350:760));
    if (id!==behaviorId) return false;
    setState(guide?"GUIDE":"APPROACH");
    const d={x:destination.x-pos.x,y:destination.y-pos.y}, n=norm(d), over=guide?rand(7,13):rand(9,20);
    if (!await segment({x:destination.x+n.x*over,y:destination.y+n.y*over})) return false;
    if (id!==behaviorId) return false;
    setState(guide?"GUIDE":"INSPECT");
    if (!await segment(destination,{duration:rand(270,390),softStop:true})) return false;
    if (id!==behaviorId) return false;
    rest={...destination}; vel={x:0,y:0}; setState(guide?"GUIDE":perch?"PERCH":"INSPECT");
    return true;
  };

  const stimulate = (el,{force=false,guide=false,priority=.5,delay,perch=false}={}) => {
    if (!ready || !el) return Promise.resolve(false);
    const now=performance.now();
    if (!force) {
      if (guideActive || now<hiddenUntil || now-lastStimulus<rand(2600,5200)) return Promise.resolve(false);
      if (!chance(clamp(priority*rand(.62,.94),.08,.8))) return Promise.resolve(false);
    }
    lastStimulus=now;
    return moveTo(pointNear(el,guide?"guide":"inspect"),{guide,delay,perch});
  };

  const retreat = async (far=false) => {
    if (!ready || guideActive) return false;
    behaviorId++; cancelTrajectory(); setState("RETREAT");
    if (reduce.matches) { hide(); return true; }
    const dir=facing>0?1:-1;
    const destination=far?{x:dir>0?innerWidth+110:-110,y:clamp(pos.y-rand(40,110),70,innerHeight-100)}:{x:clamp(pos.x-dir*rand(76,140),84,innerWidth-84),y:clamp(pos.y+rand(-72,42),82,innerHeight-104)};
    if (!await segment(destination)) return false;
    if (far) { hide(); hiddenUntil=performance.now()+rand(7000,14000); setState("REST"); }
    else { rest={...destination};vel={x:0,y:0};setState("REST"); }
    return true;
  };

  const wake = async () => {
    if (!ready || guideActive || reduce.matches || performance.now()<hiddenUntil) return;
    const destination=neutralPoint();
    if (!visible) {
      const side=destination.x>innerWidth/2?1:-1;
      pos={x:side>0?innerWidth+96:-96,y:clamp(destination.y-rand(30,72),70,innerHeight-90)};rest={...pos};vel={x:0,y:0};facing=side>0?-1:1;
    }
    await moveTo(destination,{delay:rand(140,340),perch:chance(.35)});
    nextDecision=performance.now()+rand(6500,12500);
  };

  const autonomousDecision = (now) => {
    if (!ready || guideActive || trajectory || reduce.matches || now<nextDecision || now<hiddenUntil) return;
    nextDecision=now+rand(6500,14000);
    const roll=Math.random();
    if (roll<.55) { setState(chance(.25)?"PERCH":"OBSERVE");rest={...pos};return; }
    if (roll<.77) { const a=pick(visibleAnchors()); if(a) stimulate(a.el,{priority:.72}); return; }
    if (roll<.92) { retreat(false); return; }
    retreat(true);
  };

  const frame = (now) => {
    if (!ready) return requestAnimationFrame(frame);
    const dt=clamp((now-lastFrame)/1000,0,.05);lastFrame=now;
    sample(now);
    const speed=mag(vel), accel={x:(vel.x-lastVel.x)/Math.max(dt,.001),y:(vel.y-lastVel.y)/Math.max(dt,.001)};lastVel={...vel};
    let driftX=0,driftY=0;
    if (!trajectory && visible) {
      const amp=state==="INSPECT"||state==="GUIDE"?2.6:state==="OBSERVE"?1.55:state==="PERCH"?.4:1;
      const settle=1-Math.exp(-dt*2.5);pos.x+=(rest.x-pos.x)*settle;pos.y+=(rest.y-pos.y)*settle;vel.x*=Math.exp(-dt*5.5);vel.y*=Math.exp(-dt*5.5);
      driftX=Math.sin(now/1730+phase.x)*amp+Math.sin(now/3110+phase.z)*amp*.3;
      driftY=Math.sin(now/1310+phase.y)*amp*.72+Math.cos(now/2570+phase.x)*amp*.25;
    }
    if (speed>42) { const nextFacing=vel.x>=0?1:-1;if(nextFacing!==facing&&speed<86) facing=nextFacing; }
    const desiredBank=clamp(vel.y*.009+accel.y*.00012-accel.x*.00005*facing,-5.2,5.2);bank+=(desiredBank-bank)*(1-Math.exp(-dt*5.4));
    bird.style.transform=`translate3d(${pos.x-sprite.w*.68+driftX}px,${pos.y-sprite.h*.51+driftY}px,0) rotate(${bank}deg) scaleX(${facing})`;
    bird.style.setProperty("--doc-wing-duration",`${clamp(118-speed*.07,64,state==="PERCH"?138:118)}ms`);
    bird.style.setProperty("--doc-wing-opacity",`${state==="PERCH"?.025:state==="REST"?.045:clamp(.055+speed/3300,.055,.14)}`);
    autonomousDecision(now);
    requestAnimationFrame(frame);
  };

  const hideFact=()=>{clearTimeout(factTimer);fact?.classList.remove("is-visible");};
  const placeFact=()=>{if(!fact||!fine.matches)return;const r=bird.getBoundingClientRect(),w=Math.min(254,innerWidth-32),left=clamp(r.left+r.width*.5-w*.5,16,innerWidth-w-16),below=r.bottom+10;fact.style.left=`${left}px`;fact.style.top=`${below+92<innerHeight?below:Math.max(16,r.top-96)}px`;};
  const showFact=()=>{if(!fact||!fine.matches||!visible)return;clearTimeout(factTimer);fact.querySelector("span").textContent=facts[factIndex++%facts.length];placeFact();fact.classList.add("is-visible");if(!guideActive&&chance(.45))factTimer=setTimeout(()=>{hideFact();if(!guideActive&&!trajectory)retreat(false);},rand(1600,2500));};

  const clearTarget=()=>{targetEl?.classList.remove("ashwood-doc-targeted");targetMarker?.remove();targetEl=null;targetMarker=null;};
  const markTarget=(el)=>{clearTarget();targetEl=el;targetEl.classList.add("ashwood-doc-targeted");if(!coarse.matches){targetMarker=document.createElement("span");targetMarker.className="ashwood-doc-reference-marker";targetMarker.textContent="DOC / HERE";targetEl.appendChild(targetMarker);}};
  const stops=[
    [".intro","DOC / 01 / ORIENTATION","Follow the idea.","ASHWOOD begins with curiosity: modeling, music, products, and systems are different forms the same point of view can take."],
    [".ashwood-home-thesis","DOC / 02 / INSTINCT","Notice what should exist next.","The recurring instinct is to identify the missing condition, then build what lets a different outcome become possible."],
    ["#throughline,.principles-field","DOC / 03 / THROUGHLINE","The method keeps returning.","Anticipation, diagnosis, translation, systems, adaptation, and synthesis describe how the work moves."],
    [".home-entryways","DOC / 04 / BECOMINGS","Then the pattern becomes something.","Modeling, music, and builds are different manifestations — not separate identities competing for space."],
    [".home-now-editorial","DOC / 05 / NOW","The practice stays live.","The Build Journal keeps the beliefs, reversals, evidence, failures, and decisions behind what is being made now."],
    [".home-closing","DOC / 06 / CONTINUE","Come make something.","Choose a thread: collaborate, listen, follow the work, or go deeper into the practice."]
  ];
  const waitScroll=()=>new Promise((resolve)=>{if(reduce.matches)return resolve();let calm=0,hard=0;const finish=()=>{clearTimeout(calm);clearTimeout(hard);removeEventListener("scroll",onScroll);resolve();};const onScroll=()=>{clearTimeout(calm);calm=setTimeout(finish,135);};addEventListener("scroll",onScroll,{passive:true});calm=setTimeout(finish,coarse.matches?480:360);hard=setTimeout(finish,1200);});
  const fillPanel=(s)=>{panel.querySelector(".ashwood-doc-editorial-panel__eyebrow").textContent=s[1];panel.querySelector(".ashwood-doc-editorial-panel__title").textContent=s[2];panel.querySelector(".ashwood-doc-editorial-panel__copy").textContent=s[3];panel.querySelector(".count").textContent=`${String(guideIndex+1).padStart(2,"0")} / 06`;panel.querySelector(".back").disabled=guideIndex===0;panel.querySelector(".next").textContent=guideIndex===stops.length-1?"Finish →":"Next →";panel.hidden=false;};
  const renderGuide=async()=>{const s=stops[guideIndex],el=document.querySelector(s[0]);if(!el||!guideActive)return;panel.hidden=true;markTarget(el);el.scrollIntoView({behavior:reduce.matches?"auto":"smooth",block:"center"});await waitScroll();if(!guideActive)return;show();if(reduce.matches){pos={x:innerWidth-(coarse.matches?66:104),y:coarse.matches?92:104};rest={...pos};setState("GUIDE");fillPanel(s);return;}await stimulate(el,{force:true,guide:true,priority:1,delay:rand(180,330)});if(guideActive)fillPanel(s);};
  const startGuide=()=>{if(!ready||guideActive)return;guideActive=true;guideIndex=0;behaviorId++;cancelTrajectory();launcher.hidden=true;show();renderGuide();};
  const endGuide=()=>{if(!guideActive)return;guideActive=false;panel.hidden=true;launcher.hidden=false;clearTarget();hideFact();if(reduce.matches){setState("REST");hide();return;}setState("OBSERVE");nextDecision=performance.now()+rand(4500,8500);setTimeout(()=>{if(!guideActive&&!trajectory)moveTo(neutralPoint(),{delay:rand(180,440),perch:chance(.4)});},rand(350,760));};
  const nextGuide=()=>{if(!guideActive)return;if(guideIndex===stops.length-1)return endGuide();guideIndex++;behaviorId++;cancelTrajectory();renderGuide();};
  const backGuide=()=>{if(!guideActive||guideIndex===0)return;guideIndex--;behaviorId++;cancelTrajectory();renderGuide();};

  const signals=()=>{
    const semantic='.home-entryway,.ashwood-home-thesis,.principles-field,.ashwood-throughline-native,.home-now-editorial,.home-closing';
    document.addEventListener("pointerdown",e=>{const el=e.target.closest?.(semantic);if(el&&!guideActive)stimulate(el,{priority:.76,delay:rand(250,620)});},{passive:true});
    document.addEventListener("pointerover",e=>{if(!fine.matches||guideActive)return;const el=e.target.closest?.(semantic);if(el&&!el.contains(e.relatedTarget))stimulate(el,{priority:.3,delay:rand(440,900)});},{passive:true});
    document.addEventListener("pointermove",e=>{const now=performance.now();if(pointer){const dt=Math.max(12,now-pointer.t),instant=Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)/dt;pointerSpeed=pointerSpeed*.78+instant*.22;}pointer={x:e.clientX,y:e.clientY,t:now};if(!fine.matches||guideActive||!visible||now<pointerCooldown)return;const d=Math.hypot(e.clientX-pos.x,e.clientY-pos.y);if(d<125&&pointerSpeed>.42&&chance(.16)){pointerCooldown=now+rand(3200,6200);reactionTimer=setTimeout(()=>{reactionTimer=0;if(!guideActive&&!trajectory)retreat(false);},rand(280,720));}else if(pointerSpeed>1.15&&d<250&&chance(.07)){setState("NOTICE");nextDecision=Math.max(nextDecision,now+rand(1600,3200));}},{passive:true});
    const io=new IntersectionObserver(entries=>{if(guideActive||trajectory||reduce.matches)return;for(const entry of entries){if(entry.isIntersecting&&entry.intersectionRatio>=.52&&chance(.13)){stimulate(entry.target,{priority:.27,delay:rand(680,1250)});break;}}},{threshold:[.52,.7]});anchors().forEach(a=>io.observe(a.el));
    let idle=0;const reset=()=>{clearTimeout(idle);idle=setTimeout(()=>{if(!guideActive&&!trajectory&&visible){setState("PERCH");rest={...pos};nextDecision=performance.now()+rand(7000,13000);}},11500);};["pointermove","keydown","scroll","touchstart"].forEach(n=>addEventListener(n,reset,{passive:true}));reset();
  };

  const takeover=()=>{
    if(ready)return true;
    const oldBird=document.querySelector(".ashwood-doctor-bird-cursor"),oldLauncher=document.querySelector(".ashwood-doc-editorial-launcher"),oldPanel=document.querySelector(".ashwood-doc-editorial-panel");
    if(!oldBird||!oldLauncher||!oldPanel||!oldBird.querySelector("img"))return false;
    bird=oldBird.cloneNode(true);bird.querySelectorAll(".ashwood-doc-wing-trace").forEach(n=>n.remove());bird.removeAttribute("style");bird.className="ashwood-doctor-bird-cursor ashwood-doc-character-v2";bird.removeAttribute("aria-hidden");bird.setAttribute("aria-label","Doctor Bird — ASHWOOD guide. Hover for a Jamaica fact.");bird.tabIndex=fine.matches?0:-1;
    const image=bird.querySelector("img"),near=image.cloneNode(true),far=image.cloneNode(true);for(const n of [near,far]){n.removeAttribute("id");n.removeAttribute("alt");n.setAttribute("aria-hidden","true");}near.className="ashwood-doc-character-v2__wing";far.className="ashwood-doc-character-v2__wing ashwood-doc-character-v2__wing--far";bird.append(far,near);oldBird.replaceWith(bird);
    launcher=oldLauncher.cloneNode(true);oldLauncher.replaceWith(launcher);panel=oldPanel.cloneNode(true);oldPanel.replaceWith(panel);panel.hidden=true;
    document.querySelectorAll(".ashwood-doc-fact,.ashwood-doc-character-fact,.ashwood-jm-bird").forEach(n=>n.remove());document.querySelectorAll("[data-ashwood-bird-guide]").forEach(n=>n.removeAttribute("data-ashwood-bird-guide"));
    fact=document.createElement("aside");fact.className="ashwood-doc-v2-fact";fact.setAttribute("aria-live","polite");fact.innerHTML='<b>DOC’S NOTE / EASTER EGG</b><span></span>';if(fine.matches)document.body.appendChild(fact);
    launcher.addEventListener("click",startGuide);panel.querySelector(".next").addEventListener("click",nextGuide);panel.querySelector(".back").addEventListener("click",backGuide);panel.querySelector(".exit").addEventListener("click",endGuide);
    document.addEventListener("keydown",e=>{if(!guideActive)return;if(e.key==="Escape")endGuide();else if(e.key==="ArrowRight"){e.preventDefault();nextGuide();}else if(e.key==="ArrowLeft"){e.preventDefault();backGuide();}});
    if(fine.matches){bird.addEventListener("mouseenter",showFact);bird.addEventListener("mouseleave",hideFact);bird.addEventListener("focus",showFact);bird.addEventListener("blur",hideFact);}
    ready=true;measure();addEventListener("resize",()=>{measure();if(fact?.classList.contains("is-visible"))placeFact();},{passive:true});signals();
    window.AshwoodDocCharacterV2={get state(){return state;},get guideActive(){return guideActive;},bird,stimulate,startGuide,endGuide,retreat,wake};
    if(reduce.matches){setState("REST");hide();}else setTimeout(()=>{if(!guideActive)wake();},coarse.matches?rand(1800,3200):rand(1250,2600));
    requestAnimationFrame(frame);return true;
  };

  if(!takeover()){
    const observer=new MutationObserver(()=>{if(takeover())observer.disconnect();});observer.observe(document.documentElement,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),8000);
  }
})();