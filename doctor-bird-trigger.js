(() => {
  "use strict";

  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/" && path !== "/index.html") return;
  const field = document.querySelector(".principles-field");
  if (!field) return;

  document.querySelectorAll(".ashwood-doctor-bird-cursor").forEach((node) => node.remove());

  const fine = matchMedia("(pointer:fine) and (hover:hover)");
  const mobile = matchMedia("(max-width:760px), (pointer:coarse)");
  const reduce = matchMedia("(prefers-reduced-motion:reduce)");
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const style = document.createElement("style");
  style.textContent = `
    .ashwood-doc-launcher{position:fixed;left:18px;bottom:18px;z-index:510;display:flex;align-items:center;gap:8px;min-height:38px;padding:7px 11px;border:1px solid color-mix(in srgb,var(--ashwood-rule) 82%,transparent);border-radius:999px;background:color-mix(in srgb,var(--ashwood-paper) 92%,transparent);color:var(--ashwood-ink);backdrop-filter:blur(12px);cursor:pointer;font:600 8px/1 Arial;letter-spacing:.14em;text-transform:uppercase;box-shadow:0 8px 28px #0001}
    .ashwood-doc-launcher i{width:8px;height:8px;border-radius:50%;background:var(--ashwood-field-green,#009b3a);box-shadow:0 0 10px var(--ashwood-glow)}
    body.ashwood-bird-guide-active .ashwood-doc-launcher{opacity:0;pointer-events:none}

    .ashwood-doctor-bird-cursor{position:fixed;left:0;top:0;z-index:520;width:96px;height:64px;pointer-events:none;opacity:0;visibility:hidden;transform-origin:50% 50%;will-change:transform,opacity;transition:opacity .22s ease,visibility 0s linear .24s,filter .5s ease;filter:drop-shadow(0 8px 16px rgba(0,0,0,.25))}
    .ashwood-doctor-bird-cursor.is-visible{opacity:1;visibility:visible;transition-delay:0s}
    .ashwood-doctor-bird-svg{display:block;width:100%;height:100%;overflow:visible;transform-origin:center;transition:transform .28s ease}
    .ashwood-doctor-bird-cursor.is-reversing .ashwood-doctor-bird-svg{transform:scaleX(-1)}
    .ashwood-doctor-bird-core{transform-box:fill-box;transform-origin:center;animation:ashwood-doc-body-hover 1.25s ease-in-out infinite alternate}
    .ashwood-doctor-bird-wing{transform-box:fill-box;transform-origin:86% 70%;will-change:transform,opacity}
    .ashwood-doctor-bird-wing--near{animation:ashwood-doc-wing-near .095s cubic-bezier(.35,0,.65,1) infinite alternate}
    .ashwood-doctor-bird-wing--far{animation:ashwood-doc-wing-far .11s cubic-bezier(.35,0,.65,1) infinite alternate}
    .ashwood-doctor-bird-tail{transform-box:fill-box;transform-origin:88% 48%;animation:ashwood-doc-tail 1.6s ease-in-out infinite alternate}
    .ashwood-doctor-bird-wing path{vector-effect:non-scaling-stroke}
    .ashwood-doctor-bird-cursor.is-flying .ashwood-doctor-bird-wing--near{animation-duration:.072s}
    .ashwood-doctor-bird-cursor.is-flying .ashwood-doctor-bird-wing--far{animation-duration:.082s}
    .ashwood-doctor-bird-cursor.is-flying .ashwood-doctor-bird-core{animation-duration:.72s}

    @keyframes ashwood-doc-wing-near{
      0%{transform:rotate(-42deg) scaleY(.58);opacity:.24}
      42%{opacity:.58}
      100%{transform:rotate(34deg) scaleY(1.18);opacity:.34}
    }
    @keyframes ashwood-doc-wing-far{
      0%{transform:rotate(28deg) scaleY(.7);opacity:.13}
      100%{transform:rotate(-32deg) scaleY(1.1);opacity:.31}
    }
    @keyframes ashwood-doc-body-hover{
      0%{transform:translateY(-1.2px) rotate(-.7deg)}
      100%{transform:translateY(1.6px) rotate(.8deg)}
    }
    @keyframes ashwood-doc-tail{
      0%{transform:rotate(-2deg)}
      100%{transform:rotate(3.5deg)}
    }

    html[data-ashwood-theme="warm-dark"] .ashwood-doctor-bird-cursor{filter:drop-shadow(0 10px 20px rgba(0,0,0,.46))}
    html[data-ashwood-theme="paper-light"] .ashwood-doctor-bird-cursor{filter:drop-shadow(0 7px 16px rgba(18,28,20,.18))}
    html[data-ashwood-theme="phosphor-cyber"] .ashwood-doctor-bird-cursor{filter:drop-shadow(0 0 13px rgba(74,255,145,.34))}

    .ashwood-doctor-guide{position:fixed;z-index:525;width:min(330px,calc(100vw - 36px));padding:14px 15px;border:1px solid color-mix(in srgb,var(--ashwood-rule) 72%,transparent);background:color-mix(in srgb,var(--ashwood-paper) 94%,transparent);backdrop-filter:blur(15px);color:var(--ashwood-ink);opacity:0;visibility:hidden;pointer-events:none;transform:translateY(6px);transition:opacity .28s ease,transform .28s ease,visibility 0s linear .3s,background-color .6s ease,color .6s ease,border-color .6s ease;box-shadow:0 14px 44px #0002}
    .ashwood-doctor-guide.is-visible{opacity:1;visibility:visible;pointer-events:auto;transform:none;transition-delay:0s}
    .ashwood-doctor-guide__eyebrow{margin:0 0 7px;color:var(--ashwood-field-green,#009b3a);font-size:7.5px;letter-spacing:.16em;text-transform:uppercase}
    .ashwood-doctor-guide__title{margin:0 0 7px;font:400 18px/1.08 Georgia,serif}
    .ashwood-doctor-guide__copy{margin:0;color:var(--ashwood-muted);font-size:9.5px;line-height:1.52}
    .ashwood-doctor-guide__controls{display:grid;grid-template-columns:auto 1fr auto auto auto;gap:8px;align-items:center;margin-top:12px;padding-top:10px;border-top:1px solid var(--ashwood-rule)}
    .ashwood-doctor-guide__count{font-size:7px;color:var(--ashwood-muted);letter-spacing:.14em}
    .ashwood-doctor-guide button{border:0;background:none;color:var(--ashwood-muted);font:inherit;font-size:7.5px;letter-spacing:.13em;text-transform:uppercase;cursor:pointer}
    .ashwood-doctor-guide__next{color:var(--ashwood-ink)!important}
    .ashwood-doc-note{max-height:0;overflow:hidden;opacity:0;color:var(--ashwood-muted);font-size:8.5px;line-height:1.45;transition:.35s ease}
    .ashwood-doc-note.show{max-height:120px;opacity:1;margin-top:10px;padding-top:8px;border-top:1px solid var(--ashwood-rule)}
    .ashwood-doc-note b{display:block;color:var(--ashwood-field-green,#009b3a);font-size:7px;letter-spacing:.14em}.ashwood-doc-note em{display:block;margin-top:4px;font:italic 10px Georgia,serif;color:var(--ashwood-ink)}.ashwood-doc-note span{display:block;margin-top:5px;color:var(--ashwood-gold)}
    body.ashwood-bird-guide-active [data-ashwood-guide-target=true]{outline:1px solid color-mix(in srgb,var(--ashwood-field-green,#009b3a) 32%,transparent);outline-offset:9px}

    @media(max-width:760px),(pointer:coarse){
      .ashwood-doc-launcher{left:14px;bottom:max(14px,env(safe-area-inset-bottom))}
      .ashwood-doctor-bird-cursor{display:block!important;width:82px;height:55px;z-index:524}
      .ashwood-doctor-guide{left:14px!important;right:14px!important;bottom:max(14px,env(safe-area-inset-bottom))!important;top:auto!important;width:auto;max-height:min(42dvh,330px);overflow:auto;padding:13px 14px}
      .ashwood-doctor-guide__title{font-size:17px}
      body.ashwood-bird-guide-active [data-ashwood-guide-target=true]{outline-offset:6px}
    }

    @media(prefers-reduced-motion:reduce){
      .ashwood-doctor-guide,.ashwood-doctor-bird-cursor{transition:none!important}
      .ashwood-doctor-bird-core,.ashwood-doctor-bird-wing,.ashwood-doctor-bird-tail{animation:none!important}
    }
  `;
  document.head.append(style);

  const launch = document.createElement("button");
  launch.className = "ashwood-doc-launcher";
  launch.type = "button";
  launch.setAttribute("aria-label", "Follow Doc, ASHWOOD guide");
  launch.innerHTML = "<i></i><span>DOC / GUIDE</span>";
  document.body.append(launch);

  const bird = document.createElement("div");
  bird.className = "ashwood-doctor-bird-cursor";
  bird.setAttribute("aria-hidden", "true");
  bird.innerHTML = `
    <svg class="ashwood-doctor-bird-svg" viewBox="0 0 140 90" aria-hidden="true">
      <defs>
        <linearGradient id="ashwood-doc-green" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#38b86a"/><stop offset=".58" stop-color="#087a3c"/><stop offset="1" stop-color="#034b29"/>
        </linearGradient>
        <linearGradient id="ashwood-doc-gold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#d9c764"/><stop offset="1" stop-color="#8d7b2e"/>
        </linearGradient>
        <radialGradient id="ashwood-doc-belly" cx="38%" cy="35%" r="74%">
          <stop offset="0" stop-color="#f2efe4"/><stop offset="1" stop-color="#b6b6a2"/>
        </radialGradient>
      </defs>
      <g class="ashwood-doctor-bird-wing ashwood-doctor-bird-wing--far" opacity=".45">
        <path d="M78 41 C52 10 28 8 17 18 C39 20 52 34 73 51 Z" fill="rgba(74,190,121,.35)" stroke="#5abf7d" stroke-width="1"/>
      </g>
      <g class="ashwood-doctor-bird-core">
        <g class="ashwood-doctor-bird-tail">
          <path d="M47 55 C26 67 14 79 7 84 C27 79 43 72 58 61 Z" fill="#19392a"/>
          <path d="M52 58 C32 76 26 84 21 88 C39 81 52 72 64 62 Z" fill="#0b6035"/>
        </g>
        <ellipse cx="72" cy="50" rx="31" ry="21" fill="url(#ashwood-doc-green)"/>
        <path d="M54 49 C61 63 81 69 96 57 C88 71 62 74 48 59 Z" fill="url(#ashwood-doc-belly)" opacity=".92"/>
        <circle cx="99" cy="38" r="14" fill="#0b6e3a"/>
        <path d="M93 34 C98 28 109 28 114 35 C105 33 100 35 94 40 Z" fill="#31a861" opacity=".8"/>
        <circle cx="104" cy="35" r="2.1" fill="#0b0d0a"/>
        <circle cx="104.6" cy="34.4" r=".55" fill="#f6f2df"/>
        <path d="M112 39 L138 35 L114 43 Z" fill="url(#ashwood-doc-gold)"/>
        <path d="M91 46 C99 48 105 50 110 55 C103 56 96 54 90 51 Z" fill="#db3a57" opacity=".82"/>
      </g>
      <g class="ashwood-doctor-bird-wing ashwood-doctor-bird-wing--near">
        <path d="M74 45 C58 9 34 4 19 14 C42 17 57 31 76 56 Z" fill="rgba(98,205,142,.58)" stroke="#66c98d" stroke-width="1.1"/>
        <path d="M72 44 C56 18 43 13 31 14" fill="none" stroke="rgba(230,244,226,.55)" stroke-width="1"/>
      </g>
    </svg>`;
  document.body.append(bird);

  const panel = document.createElement("aside");
  panel.className = "ashwood-doctor-guide";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Doc, ASHWOOD homepage guide");
  panel.innerHTML = `<p class="ashwood-doctor-guide__eyebrow"></p><h2 class="ashwood-doctor-guide__title"></h2><p class="ashwood-doctor-guide__copy"></p><div class="ashwood-doc-note"><b>DOC / FIELD NOTE</b>Hummingbirds are the only birds capable of true controlled backward flight.<em>Some things reveal themselves in reverse.</em><span>Tahlia → ailhat</span></div><div class="ashwood-doctor-guide__controls"><span class="ashwood-doctor-guide__count"></span><span></span><button class="back">Back</button><button class="ashwood-doctor-guide__next next">Next →</button><button class="exit">Exit</button></div>`;
  document.body.append(panel);

  const note = panel.querySelector(".ashwood-doc-note");
  const stops = [
    ["#site-title,.intro", "DOC / 01 / ORIENTATION", "I follow ideas wherever they go.", "ASHWOOD is one point of view moving through creative work, product building, and the systems underneath both.", [.78,.58]],
    [".ashwood-capability-map,.principles-field", "DOC / 02 / THROUGHLINE", "The work has recurring patterns.", "SIGNAL · FRICTION · TRANSLATION · SYSTEMS · ADAPTATION · SYNTHESIS describe recurring ways the work tends to move.", [.82,.26]],
    [".home-entryways", "DOC / 03 / MANIFESTATION", "Different forms. Same point of view.", "Modeling, music, and builds are different places the same curiosity becomes visible.", [.78,.35]],
    [".ashwood-capability-evidence,.home-entryways", "DOC / 04 / BUILD JOURNAL", "The reasoning stays with the work.", "The Build Journal keeps the beliefs, reversals, evidence, failures, and decisions—not only what shipped.", [.68,.58]],
    [".home-now,#now", "DOC / 05 / SITREP", "This is the live layer.", "WHEN · WHERE · WHAT IT IS · WHAT IT IS DOING · WHAT I’M DOING ABOUT IT connects the archive to what is happening now.", [.78,.3]],
    [".future-nav,.home-utility,.home-entryways", "DOC / 06 / CONTINUE", "Choose a thread and follow it.", "The homepage is the map. The rest of ASHWOOD is where the evidence opens up.", [.76,.48]]
  ];

  let active=false, index=0, target=null, timer=0, x=innerWidth+150, y=innerHeight*.32, tx=x, ty=y, vx=0, vy=0, bank=0, raf=0, visible=false, exiting=false, backing=false;

  const pointFor = (el, a) => {
    const r = el.getBoundingClientRect();
    const sidePad = mobile.matches ? 52 : 100;
    const topPad = mobile.matches ? 76 : 80;
    const bottomPad = mobile.matches ? Math.min(230, innerHeight * .3) : 80;
    return {
      x: clamp(r.left + r.width * a[0], sidePad, innerWidth - sidePad),
      y: clamp(r.top + r.height * a[1], topPad, innerHeight - bottomPad)
    };
  };

  const positionPanel = (q) => {
    if (mobile.matches) return;
    requestAnimationFrame(() => {
      const r = panel.getBoundingClientRect();
      let left = q.x + 58;
      if (left + r.width > innerWidth - 18) left = q.x - r.width - 92;
      left = clamp(left, 18, innerWidth - r.width - 18);
      panel.style.left = left + "px";
      panel.style.top = clamp(q.y - r.height * .44, 74, innerHeight - r.height - 18) + "px";
    });
  };

  function tick(now){
    raf=0;
    if(!visible) return;
    const spring=exiting?.075:(mobile.matches?.086:.105);
    const damping=exiting?.80:(mobile.matches?.78:.755);
    vx=(vx+(tx-x)*spring)*damping;
    vy=(vy+(ty-y)*spring)*damping;
    x+=vx;
    y+=vy;
    bank+=(clamp(vx*.52,-9,9)-bank)*.14;
    const speed=Math.hypot(vx,vy);
    bird.classList.toggle("is-flying", speed > .7 || exiting);
    const hoverY=!exiting&&speed<.7?Math.sin(now/150)*(mobile.matches?2.4:1.5):0;
    const hoverX=!exiting&&speed<.7?Math.cos(now/220)*(mobile.matches?.9:.6):0;
    const halfW=mobile.matches?41:48;
    const halfH=mobile.matches?28:32;
    bird.style.transform=`translate3d(${x-halfW+hoverX}px,${y-halfH+hoverY}px,0) rotate(${bank}deg)`;
    raf=requestAnimationFrame(tick);
  }

  function move(q,enter=false,back=false){
    if(reduce.matches){
      x=q.x;y=q.y;tx=q.x;ty=q.y;visible=true;
      bird.classList.add("is-visible");
      bird.style.transform=`translate3d(${x-(mobile.matches?41:48)}px,${y-(mobile.matches?28:32)}px,0)`;
      return;
    }
    exiting=false;
    if(enter||!visible){
      const fromRight=!back;
      x=fromRight?innerWidth+(mobile.matches?82:180):-(mobile.matches?82:180);
      y=clamp(q.y-(mobile.matches?90:70),64,innerHeight-100);
      vx=vy=0;
    }
    tx=q.x;ty=q.y;visible=true;
    bird.classList.add("is-visible");
    bird.classList.toggle("is-reversing",back);
    if(!raf) raf=requestAnimationFrame(tick);
  }

  function clearTarget(){ target?.removeAttribute("data-ashwood-guide-target"); target=null; }

  function showBackwardNote(){
    let seen=false;
    try{seen=sessionStorage.getItem("ashwood.doc.backward-note")==="1";}catch{}
    if(seen) return;
    try{sessionStorage.setItem("ashwood.doc.backward-note","1");}catch{}
    note.classList.add("show");
    setTimeout(()=>note.classList.remove("show"),6800);
  }

  function render(){
    const s=stops[index], el=document.querySelector(s[0]);
    if(!el) return;
    clearTarget();
    target=el;
    el.setAttribute("data-ashwood-guide-target","true");
    panel.classList.remove("is-visible");
    el.scrollIntoView({behavior:reduce.matches?"auto":"smooth",block:mobile.matches?"center":"center"});
    clearTimeout(timer);
    timer=setTimeout(()=>{
      if(!active) return;
      const q=pointFor(el,s[4]);
      move(q,index===0,backing);
      panel.querySelector(".ashwood-doctor-guide__eyebrow").textContent=s[1];
      panel.querySelector(".ashwood-doctor-guide__title").textContent=s[2];
      panel.querySelector(".ashwood-doctor-guide__copy").textContent=s[3];
      panel.querySelector(".ashwood-doctor-guide__count").textContent=`${String(index+1).padStart(2,"0")} / 06`;
      panel.querySelector(".back").disabled=index===0;
      panel.querySelector(".next").textContent=index===5?"Finish →":"Next →";
      positionPanel(q);
      panel.classList.add("is-visible");
      if(backing) showBackwardNote();
      backing=false;
    }, reduce.matches?20:(mobile.matches?360:430));
  }

  function start(){
    if(active) return;
    active=true;
    index=0;
    document.body.classList.add("ashwood-bird-guide-active");
    render();
  }

  function end(){
    active=false;
    document.body.classList.remove("ashwood-bird-guide-active");
    clearTimeout(timer);
    panel.classList.remove("is-visible");
    note.classList.remove("show");
    clearTarget();
    if(visible&&!reduce.matches){
      exiting=true;
      tx=innerWidth+(mobile.matches?110:190);
      ty=clamp(y-80,54,innerHeight-90);
      setTimeout(()=>{
        visible=false;
        bird.classList.remove("is-visible","is-flying","is-reversing");
        if(raf){cancelAnimationFrame(raf);raf=0;}
      },mobile.matches?820:950);
    }else{
      visible=false;
      bird.classList.remove("is-visible","is-flying","is-reversing");
    }
  }

  function next(){ if(!active) return; if(index===5) return end(); index++; backing=false; render(); }
  function back(){ if(!active||index===0) return; index--; backing=true; render(); }

  launch.onclick=start;
  panel.querySelector(".next").onclick=next;
  panel.querySelector(".back").onclick=back;
  panel.querySelector(".exit").onclick=end;
  document.addEventListener("ashwood:start-bird-guide",start);
  document.addEventListener("click",(e)=>{const t=e.target.closest("[data-ashwood-bird-guide]");if(!t)return;e.preventDefault();start();});
  document.addEventListener("keydown",(e)=>{if(!active)return;if(e.key==="Escape")end();else if(e.key==="ArrowRight")next();else if(e.key==="ArrowLeft")back();});
  const label=()=>document.querySelectorAll("[data-ashwood-bird-guide]").forEach((el)=>{if(el.textContent.trim()!=="Follow Doc →")el.textContent="Follow Doc →";el.setAttribute("aria-label","Follow Doc, ASHWOOD guide");});
  label();
  requestAnimationFrame(()=>requestAnimationFrame(label));
  addEventListener("load",label,{once:true});
})();