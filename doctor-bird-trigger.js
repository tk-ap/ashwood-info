(() => {
  "use strict";

  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/" && path !== "/index.html") return;

  const field = document.querySelector(".principles-field");
  if (!field || document.querySelector(".ashwood-doctor-bird-cursor")) return;

  const finePointer = window.matchMedia("(pointer: fine) and (hover: hover)");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const bird = document.createElement("div");
  bird.className = "ashwood-doctor-bird-cursor";
  bird.setAttribute("aria-hidden", "true");
  bird.innerHTML = `
    <svg class="ashwood-doctor-bird-cursor__svg" viewBox="0 0 320 220" focusable="false" aria-hidden="true">
      <defs>
        <linearGradient id="docBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#073a31"/>
          <stop offset=".24" stop-color="#00a36d"/>
          <stop offset=".48" stop-color="#15c783"/>
          <stop offset=".66" stop-color="#087d58"/>
          <stop offset=".84" stop-color="#154a3b"/>
          <stop offset="1" stop-color="#041e19"/>
        </linearGradient>
        <linearGradient id="docIridescence" x1="0" y1=".2" x2="1" y2=".8">
          <stop offset="0" stop-color="#b8ffdc" stop-opacity=".18"/>
          <stop offset=".22" stop-color="#0ae3a1" stop-opacity=".72"/>
          <stop offset=".46" stop-color="#0a78a2" stop-opacity=".72"/>
          <stop offset=".63" stop-color="#47e466" stop-opacity=".72"/>
          <stop offset=".82" stop-color="#f2cc32" stop-opacity=".42"/>
          <stop offset="1" stop-color="#1b6b56" stop-opacity=".14"/>
        </linearGradient>
        <linearGradient id="docHead" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#031914"/>
          <stop offset=".46" stop-color="#07533d"/>
          <stop offset=".72" stop-color="#10a56e"/>
          <stop offset="1" stop-color="#031914"/>
        </linearGradient>
        <linearGradient id="docTail" x1="1" y1="0" x2="0" y2=".8">
          <stop offset="0" stop-color="#0b2a23"/>
          <stop offset=".18" stop-color="#0ea46a"/>
          <stop offset=".42" stop-color="#0f6476"/>
          <stop offset=".62" stop-color="#132a5d"/>
          <stop offset=".82" stop-color="#0e1819"/>
          <stop offset="1" stop-color="#030707" stop-opacity=".25"/>
        </linearGradient>
        <linearGradient id="docTailHighlight" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#e7ffb7" stop-opacity=".56"/>
          <stop offset=".36" stop-color="#28e2a0" stop-opacity=".7"/>
          <stop offset=".68" stop-color="#3277c7" stop-opacity=".62"/>
          <stop offset="1" stop-color="#8a5fff" stop-opacity=".18"/>
        </linearGradient>
        <linearGradient id="docWing" x1=".8" y1=".8" x2=".05" y2=".1">
          <stop offset="0" stop-color="#1b3d31" stop-opacity=".7"/>
          <stop offset=".27" stop-color="#716453" stop-opacity=".5"/>
          <stop offset=".62" stop-color="#d8c8ae" stop-opacity=".42"/>
          <stop offset="1" stop-color="#fff8ed" stop-opacity=".12"/>
        </linearGradient>
        <filter id="docWingSoft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.1"/>
        </filter>
        <filter id="docGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.8" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <g class="doc-bird__tail" fill="none" stroke-linecap="round">
        <path d="M132 148 C100 159 70 180 13 210" stroke="url(#docTail)" stroke-width="9"/>
        <path d="M134 153 C105 177 80 201 31 217" stroke="url(#docTail)" stroke-width="7"/>
        <path d="M133 143 C91 149 61 163 6 181" stroke="url(#docTail)" stroke-width="5.5"/>
        <path d="M130 148 C97 160 67 181 13 207" stroke="url(#docTailHighlight)" stroke-width="1.25" opacity=".88"/>
        <path d="M134 153 C104 177 82 198 32 214" stroke="url(#docTailHighlight)" stroke-width="1" opacity=".68"/>
      </g>

      <g class="doc-bird__wing doc-bird__wing--upper" filter="url(#docWingSoft)">
        <path d="M142 111 C115 62 76 18 21 17 C29 60 64 94 127 124 Z" fill="url(#docWing)"/>
        <path d="M135 109 C112 74 82 42 40 27" fill="none" stroke="#f5ecdf" stroke-opacity=".28" stroke-width="4"/>
        <path d="M134 112 C105 84 75 65 35 50" fill="none" stroke="#f5ecdf" stroke-opacity=".24" stroke-width="3.5"/>
        <path d="M132 116 C99 97 72 85 39 75" fill="none" stroke="#f5ecdf" stroke-opacity=".2" stroke-width="3"/>
        <path d="M127 120 C98 111 77 106 49 102" fill="none" stroke="#f5ecdf" stroke-opacity=".16" stroke-width="2.4"/>
      </g>
      <g class="doc-bird__wing doc-bird__wing--lower" filter="url(#docWingSoft)">
        <path d="M145 119 C103 91 62 84 27 106 C55 137 94 146 151 131 Z" fill="url(#docWing)" opacity=".86"/>
        <path d="M139 120 C103 105 74 103 42 111" fill="none" stroke="#f5ecdf" stroke-opacity=".25" stroke-width="3.8"/>
        <path d="M141 124 C108 118 79 120 54 128" fill="none" stroke="#f5ecdf" stroke-opacity=".19" stroke-width="3"/>
      </g>

      <g class="doc-bird__body-wrap" filter="url(#docGlow)">
        <path class="doc-bird__body" d="M111 119 C133 94 176 91 213 108 C220 125 208 149 184 162 C154 178 119 165 106 143 C100 133 102 126 111 119 Z" fill="url(#docBody)"/>
        <path d="M118 116 C143 100 177 101 204 111 C177 115 151 127 128 151 C116 142 109 127 118 116 Z" fill="url(#docIridescence)" opacity=".78"/>
        <path d="M134 111 C150 105 166 106 177 111 M127 121 C145 115 164 117 181 124 M123 132 C144 126 164 130 178 138 M130 143 C145 140 158 143 169 149" fill="none" stroke="#baffd8" stroke-opacity=".23" stroke-width="2.2" stroke-linecap="round"/>
        <g class="doc-bird__scales" fill="#8bffd0" opacity=".34">
          <circle cx="151" cy="115" r="2.1"/><circle cx="160" cy="118" r="1.8"/><circle cx="169" cy="120" r="1.9"/>
          <circle cx="143" cy="125" r="1.7"/><circle cx="153" cy="129" r="2"/><circle cx="164" cy="132" r="1.7"/>
          <circle cx="136" cy="137" r="1.6"/><circle cx="147" cy="141" r="1.8"/><circle cx="158" cy="145" r="1.6"/>
        </g>
        <g class="doc-bird__head">
          <path d="M190 105 C204 88 228 84 247 95 C258 102 258 115 247 124 C235 133 213 131 199 121 C191 116 187 111 190 105 Z" fill="url(#docHead)"/>
          <path d="M199 102 C213 91 229 91 242 97 C228 100 217 106 206 119 C199 116 195 108 199 102 Z" fill="url(#docIridescence)" opacity=".7"/>
          <path d="M197 118 C209 126 226 129 239 122 C228 134 211 138 198 128 Z" fill="#07100e" opacity=".94"/>
          <circle cx="235" cy="101" r="6.2" fill="#020403"/>
          <circle cx="236" cy="100" r="2.2" fill="#e9ffe9"/>
          <circle cx="236.8" cy="99.4" r=".8" fill="#fff"/>
          <path d="M251 106 C270 105 294 101 315 98" fill="none" stroke="#c72c37" stroke-width="4.1" stroke-linecap="round"/>
          <path d="M251 106 C273 105 296 102 315 99" fill="none" stroke="#ff7178" stroke-opacity=".48" stroke-width="1.2" stroke-linecap="round"/>
        </g>
        <path d="M177 159 C184 168 190 173 195 181 M188 160 C193 169 198 174 203 177" stroke="#1a1210" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        <path d="M195 181 l-4 5 M195 181 l3 6 M203 177 l-1 6 M203 177 l5 4" stroke="#1a1210" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      </g>
    </svg>`;
  document.body.appendChild(bird);

  const style = document.createElement("style");
  style.textContent = `
    .ashwood-doctor-bird-cursor{
      position:fixed;left:0;top:0;z-index:520;width:clamp(160px,17vw,250px);aspect-ratio:320/220;
      pointer-events:none;opacity:0;visibility:hidden;transform-origin:68% 51%;will-change:transform,opacity;
      transition:opacity .24s ease,visibility 0s linear .26s,filter .6s cubic-bezier(.4,0,.2,1);
      filter:drop-shadow(0 9px 18px rgba(0,0,0,.18));
    }
    .ashwood-doctor-bird-cursor.is-visible{opacity:1;visibility:visible;transition-delay:0s}
    .ashwood-doctor-bird-cursor__svg{display:block;width:100%;height:100%;overflow:visible}
    .doc-bird__tail{transform-origin:132px 150px;transform:translate(var(--ashwood-bird-tail-x,0),var(--ashwood-bird-tail-y,0)) rotate(var(--ashwood-bird-tail-rotate,0deg));transition:transform .08s linear}
    .doc-bird__body-wrap{transform-origin:177px 128px;transition:transform .28s cubic-bezier(.16,.8,.24,1)}
    .doc-bird__head{transform-origin:210px 111px;animation:doc-head-breathe 1.7s ease-in-out infinite}
    .doc-bird__wing{transform-box:fill-box;transform-origin:87% 72%;will-change:transform,opacity,filter}
    .doc-bird__wing--upper{animation:doc-wing-upper 84ms ease-in-out infinite alternate}
    .doc-bird__wing--lower{animation:doc-wing-lower 92ms ease-in-out infinite alternate-reverse}
    .ashwood-doctor-bird-cursor.is-reversing .doc-bird__body-wrap{transform:translateX(5px) rotate(1.8deg)}
    .ashwood-doctor-bird-cursor.is-reversing .doc-bird__tail{filter:saturate(1.18) brightness(1.08)}
    html[data-ashwood-theme="warm-dark"] .ashwood-doctor-bird-cursor{filter:drop-shadow(0 10px 24px rgba(0,0,0,.42)) saturate(1.1)}
    html[data-ashwood-theme="paper-light"] .ashwood-doctor-bird-cursor{filter:drop-shadow(0 8px 16px rgba(18,28,20,.16)) saturate(1.03)}
    html[data-ashwood-theme="phosphor-cyber"] .ashwood-doctor-bird-cursor{filter:drop-shadow(0 0 12px rgba(74,255,145,.35)) saturate(1.25) contrast(1.04)}

    .ashwood-doctor-guide{
      position:fixed;z-index:525;width:min(330px,calc(100vw - 36px));padding:14px 15px 13px;
      border:1px solid color-mix(in srgb,var(--ashwood-rule) 72%,transparent);
      background:color-mix(in srgb,var(--ashwood-paper) 94%,transparent);
      backdrop-filter:blur(15px);-webkit-backdrop-filter:blur(15px);
      color:var(--ashwood-ink);opacity:0;visibility:hidden;pointer-events:none;
      transform:translateY(6px);transition:opacity .28s ease,transform .32s ease,visibility 0s linear .32s,background-color .6s ease,color .6s ease,border-color .6s ease;
      box-shadow:0 14px 44px rgba(0,0,0,.12)
    }
    .ashwood-doctor-guide.is-visible{opacity:1;visibility:visible;pointer-events:auto;transform:translateY(0);transition-delay:0s}
    .ashwood-doctor-guide__eyebrow{margin:0 0 7px;color:var(--ashwood-field-green,#009b3a);font-size:7.5px;line-height:1;letter-spacing:.16em;text-transform:uppercase}
    .ashwood-doctor-guide__title{margin:0 0 7px;font-family:Georgia,serif;font-size:18px;font-weight:400;line-height:1.08;letter-spacing:-.018em}
    .ashwood-doctor-guide__copy{margin:0;color:var(--ashwood-muted);font-size:9.5px;line-height:1.52;letter-spacing:.02em}
    .ashwood-doctor-guide__controls{display:grid;grid-template-columns:auto 1fr auto auto auto;align-items:center;gap:8px;margin-top:12px;padding-top:10px;border-top:1px solid color-mix(in srgb,var(--ashwood-rule) 54%,transparent)}
    .ashwood-doctor-guide__count{color:var(--ashwood-muted);font-size:7px;letter-spacing:.14em;text-transform:uppercase}
    .ashwood-doctor-guide button{border:0;padding:7px 0;background:none;color:var(--ashwood-muted);font-family:inherit;font-size:7.5px;letter-spacing:.13em;text-transform:uppercase;cursor:pointer}
    .ashwood-doctor-guide button:hover,.ashwood-doctor-guide button:focus-visible{color:var(--ashwood-gold);font-style:italic}
    .ashwood-doctor-guide button:disabled{opacity:.22;cursor:default;font-style:normal}
    .ashwood-doctor-guide__next{color:var(--ashwood-ink)!important}
    body.ashwood-bird-guide-active [data-ashwood-guide-target="true"]{outline:1px solid color-mix(in srgb,var(--ashwood-field-green,#009b3a) 34%,transparent);outline-offset:9px}

    .ashwood-doc-field-note{
      position:fixed;z-index:530;width:min(310px,calc(100vw - 36px));padding:13px 14px 12px;
      border:1px solid color-mix(in srgb,var(--ashwood-rule) 72%,transparent);background:color-mix(in srgb,var(--ashwood-paper) 96%,transparent);
      color:var(--ashwood-ink);box-shadow:0 16px 42px rgba(0,0,0,.13);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
      opacity:0;transform:translateY(7px) scale(.985);pointer-events:none;transition:opacity .3s ease,transform .34s cubic-bezier(.16,.8,.24,1),background-color .6s ease,color .6s ease,border-color .6s ease
    }
    .ashwood-doc-field-note.is-visible{opacity:1;transform:translateY(0) scale(1)}
    .ashwood-doc-field-note__kicker{margin:0 0 8px;color:var(--ashwood-field-green,#009b3a);font-size:7px;letter-spacing:.17em;text-transform:uppercase}
    .ashwood-doc-field-note__fact{margin:0 0 9px;font-family:Georgia,serif;font-size:15px;line-height:1.25}
    .ashwood-doc-field-note__bridge{margin:0;color:var(--ashwood-muted);font-size:9px;line-height:1.48}
    .ashwood-doc-field-note__bridge em{color:var(--ashwood-ink);font-family:Georgia,serif;font-size:12px}
    .ashwood-doc-field-note__reverse{display:block;margin-top:9px;padding-top:8px;border-top:1px solid color-mix(in srgb,var(--ashwood-rule) 54%,transparent);font-size:8px;letter-spacing:.12em}

    @keyframes doc-wing-upper{from{transform:rotate(-13deg) scaleY(.66);opacity:.42;filter:blur(1.1px)}to{transform:rotate(12deg) scaleY(1.13);opacity:.82;filter:blur(.35px)}}
    @keyframes doc-wing-lower{from{transform:rotate(10deg) scaleY(.65);opacity:.38;filter:blur(1.35px)}to{transform:rotate(-12deg) scaleY(1.08);opacity:.76;filter:blur(.4px)}}
    @keyframes doc-head-breathe{0%,100%{transform:translate(0,0)}50%{transform:translate(.8px,-.5px)}}

    @media(max-width:760px),(pointer:coarse){
      .ashwood-doctor-bird-cursor{width:148px}
      .ashwood-doctor-guide{left:16px!important;right:16px!important;bottom:16px!important;top:auto!important;width:auto;max-width:none}
      .ashwood-doctor-guide__title{font-size:17px}.ashwood-doctor-guide__copy{font-size:10px}
      .ashwood-doc-field-note{left:16px!important;right:16px!important;bottom:122px!important;top:auto!important;width:auto}
    }
    @media(prefers-reduced-motion:reduce){
      .ashwood-doctor-bird-cursor,.ashwood-doctor-guide,.ashwood-doc-field-note,.doc-bird__tail,.doc-bird__body-wrap{transition:none!important}
      .doc-bird__wing,.doc-bird__head{animation:none!important}
    }
  `;
  document.head.appendChild(style);

  const panel = document.createElement("aside");
  panel.className = "ashwood-doctor-guide";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "false");
  panel.setAttribute("aria-label", "Doc, ASHWOOD homepage guide");
  panel.innerHTML = `
    <p class="ashwood-doctor-guide__eyebrow"></p>
    <h2 class="ashwood-doctor-guide__title"></h2>
    <p class="ashwood-doctor-guide__copy"></p>
    <div class="ashwood-doctor-guide__controls">
      <span class="ashwood-doctor-guide__count"></span><span></span>
      <button class="ashwood-doctor-guide__back" type="button">Back</button>
      <button class="ashwood-doctor-guide__next" type="button">Next →</button>
      <button class="ashwood-doctor-guide__exit" type="button">Exit</button>
    </div>`;
  document.body.appendChild(panel);

  const note = document.createElement("aside");
  note.className = "ashwood-doc-field-note";
  note.setAttribute("aria-live", "polite");
  note.innerHTML = `<p class="ashwood-doc-field-note__kicker">DOC / FIELD NOTE</p><p class="ashwood-doc-field-note__fact">Hummingbirds are the only birds capable of true controlled backward flight.</p><p class="ashwood-doc-field-note__bridge"><em>Some things reveal themselves in reverse.</em><span class="ashwood-doc-field-note__reverse">TAHLIA → ailhat</span></p>`;
  document.body.appendChild(note);

  const stops = [
    { selectors:["#site-title",".intro"], eyebrow:"DOC / 01 / ORIENTATION", title:"I follow ideas wherever they go.", copy:"ASHWOOD is a living record of one point of view moving across creative work, product building, and the systems underneath both.", anchor:[.78,.58] },
    { selectors:[".principles-field"], eyebrow:"DOC / 02 / THROUGHLINE", title:"The work has recurring patterns.", copy:"SIGNAL · FRICTION · TRANSLATION · SYSTEMS · ADAPTATION · SYNTHESIS are recurring ways the work tends to move. The field lets you discover them; the map makes them legible.", anchor:[.76,.48] },
    { selectors:[".home-entryways"], eyebrow:"DOC / 03 / MANIFESTATION", title:"Different forms. Same point of view.", copy:"Modeling, music, and builds sit together because they are not separate identities here. They are different places the same curiosity becomes visible.", anchor:[.72,.42] },
    { selectors:[".home-entryways a[href='/journal/']",".ashwood-capability-evidence",".home-entryways"], eyebrow:"DOC / 04 / BUILD JOURNAL", title:"The reasoning stays with the work.", copy:"The Build Journal records more than what shipped: what I believed, what changed, what failed, the evidence, and the decision that followed.", anchor:[.62,.58] },
    { selectors:[".home-now","#now"], eyebrow:"DOC / 05 / SITREP", title:"This is the live layer.", copy:"WHEN · WHERE · WHAT IT IS · WHAT IT IS DOING · WHAT I’M DOING ABOUT IT. SITREP connects the archive to the work happening now.", anchor:[.76,.36] },
    { selectors:[".future-nav",".home-utility",".home-entryways"], eyebrow:"DOC / 06 / CONTINUE", title:"Choose a thread and follow it.", copy:"Explore the creative work, trace the builds, listen, or connect. The homepage is the map; the rest of ASHWOOD is the evidence.", anchor:[.72,.5] }
  ];

  const resolveTarget = stop => stop.selectors.map(s=>document.querySelector(s)).find(node=>node && node.getBoundingClientRect().width>0) || null;
  const clamp = (value,min,max)=>Math.max(min,Math.min(max,value));

  let active=false,index=0,currentTarget=null,targetX=window.innerWidth+140,targetY=window.innerHeight*.35;
  let x=targetX,y=targetY,vx=0,vy=0,bank=0,tailX=0,tailY=0,tailRotate=0,visible=false,exiting=false,frame=0,settleTimer=0;
  let lastNavigationWasBack=false;

  const pointFor=(element,anchor=[.72,.5])=>{const r=element.getBoundingClientRect();return{x:clamp(r.left+r.width*anchor[0],105,window.innerWidth-105),y:clamp(r.top+r.height*anchor[1],86,window.innerHeight-86)}};
  const positionPanel=point=>{if(window.innerWidth<=760)return;requestAnimationFrame(()=>{const r=panel.getBoundingClientRect();let left=point.x+72;if(left+r.width>window.innerWidth-18)left=point.x-r.width-112;left=clamp(left,18,window.innerWidth-r.width-18);const top=clamp(point.y-r.height*.44,74,window.innerHeight-r.height-18);panel.style.left=`${Math.round(left)}px`;panel.style.top=`${Math.round(top)}px`;panel.style.right="auto";panel.style.bottom="auto"})};
  const positionNote=()=>{if(window.innerWidth<=760)return;const left=clamp(window.innerWidth-note.offsetWidth-28,18,window.innerWidth-note.offsetWidth-18);const top=clamp(window.innerHeight-note.offsetHeight-28,80,window.innerHeight-note.offsetHeight-18);note.style.left=`${left}px`;note.style.top=`${top}px`};

  const hideBird=()=>{visible=false;exiting=false;bird.classList.remove("is-visible","is-guide","is-reversing")};
  const flyOut=()=>{if(!finePointer.matches||reduceMotion.matches)return hideBird();exiting=true;targetX=window.innerWidth+180;targetY=clamp(y-80,50,window.innerHeight-70);window.setTimeout(hideBird,1100)};
  const moveBird=(point,entering=false,backward=false)=>{if(!finePointer.matches||reduceMotion.matches)return;exiting=false;if(entering||!visible){const enterFromRight=point.x<window.innerWidth*.67;x=point.x+(enterFromRight?220:-220);y=point.y-88;vx=0;vy=0}targetX=point.x;targetY=point.y;visible=true;bird.classList.add("is-visible","is-guide");bird.classList.toggle("is-reversing",backward);if(backward)window.setTimeout(()=>bird.classList.remove("is-reversing"),950);if(!frame)frame=requestAnimationFrame(tick)};

  function tick(now){frame=0;if(!visible)return;const spring=exiting?.09:.105,damping=exiting?.79:.755;vx=(vx+(targetX-x)*spring)*damping;vy=(vy+(targetY-y)*spring)*damping;x+=vx;y+=vy;const speed=Math.hypot(vx,vy);bank+=(clamp(vx*.72,-9,9)-bank)*.17;tailX+=(clamp(-vx*1.25,-16,16)-tailX)*.1;tailY+=(clamp(-vy*.72,-8,8)-tailY)*.09;tailRotate+=(clamp(-vy*.55-vx*.08,-8,8)-tailRotate)*.09;const hovering=!exiting&&speed<.55;const hoverY=hovering?Math.sin(now/170)*1.25:0,hoverX=hovering?Math.cos(now/240)*.55:0;bird.style.transform=`translate3d(${x-170+hoverX}px,${y-110+hoverY}px,0) rotate(${bank}deg)`;bird.style.setProperty("--ashwood-bird-tail-x",`${tailX}px`);bird.style.setProperty("--ashwood-bird-tail-y",`${tailY}px`);bird.style.setProperty("--ashwood-bird-tail-rotate",`${tailRotate}deg`);bird.style.setProperty("--ashwood-bird-speed",String(clamp(speed/10,0,1)));frame=requestAnimationFrame(tick)}

  const clearTarget=()=>{currentTarget?.removeAttribute("data-ashwood-guide-target");currentTarget=null};
  const showBackwardNote=()=>{let shown=false;try{shown=sessionStorage.getItem("ashwood.doc.backward-note")==="1"}catch(_){}if(shown)return;try{sessionStorage.setItem("ashwood.doc.backward-note","1")}catch(_){}positionNote();window.setTimeout(()=>note.classList.add("is-visible"),520);window.setTimeout(()=>note.classList.remove("is-visible"),7200)};

  const renderStop=()=>{const stop=stops[index],target=resolveTarget(stop);if(!target)return;clearTarget();currentTarget=target;currentTarget.setAttribute("data-ashwood-guide-target","true");panel.classList.remove("is-visible");target.scrollIntoView({behavior:reduceMotion.matches?"auto":"smooth",block:"center"});window.clearTimeout(settleTimer);settleTimer=window.setTimeout(()=>{if(!active)return;const point=pointFor(target,stop.anchor);moveBird(point,index===0,lastNavigationWasBack);panel.querySelector(".ashwood-doctor-guide__eyebrow").textContent=stop.eyebrow;panel.querySelector(".ashwood-doctor-guide__title").textContent=stop.title;panel.querySelector(".ashwood-doctor-guide__copy").textContent=stop.copy;panel.querySelector(".ashwood-doctor-guide__count").textContent=`${String(index+1).padStart(2,"0")} / ${String(stops.length).padStart(2,"0")}`;panel.querySelector(".ashwood-doctor-guide__back").disabled=index===0;panel.querySelector(".ashwood-doctor-guide__next").textContent=index===stops.length-1?"Finish →":"Next →";positionPanel(point);panel.classList.add("is-visible");if(lastNavigationWasBack)showBackwardNote();lastNavigationWasBack=false},reduceMotion.matches?30:430)};

  const endGuide=()=>{active=false;document.body.classList.remove("ashwood-bird-guide-active");window.clearTimeout(settleTimer);panel.classList.remove("is-visible");note.classList.remove("is-visible");clearTarget();flyOut()};
  const startGuide=()=>{active=true;index=0;lastNavigationWasBack=false;document.body.classList.add("ashwood-bird-guide-active");renderStop()};
  const goBack=()=>{if(!active||index<=0)return;lastNavigationWasBack=true;index-=1;renderStop()};
  const goNext=()=>{if(!active)return;if(index>=stops.length-1)return endGuide();lastNavigationWasBack=false;index+=1;renderStop()};

  panel.querySelector(".ashwood-doctor-guide__back").addEventListener("click",goBack);
  panel.querySelector(".ashwood-doctor-guide__next").addEventListener("click",goNext);
  panel.querySelector(".ashwood-doctor-guide__exit").addEventListener("click",endGuide);
  document.addEventListener("ashwood:start-bird-guide",startGuide);
  document.addEventListener("click",event=>{const trigger=event.target.closest("[data-ashwood-bird-guide]");if(!trigger)return;event.preventDefault();startGuide()});
  document.addEventListener("keydown",event=>{if(!active)return;if(event.key==="Escape")endGuide();if(event.key==="ArrowRight")goNext();if(event.key==="ArrowLeft")goBack()});
  window.addEventListener("resize",()=>{if(!active||!currentTarget)return;const stop=stops[index],point=pointFor(currentTarget,stop.anchor);targetX=point.x;targetY=point.y;positionPanel(point);positionNote()},{passive:true});

  const labelDoc=()=>document.querySelectorAll("[data-ashwood-bird-guide]").forEach(el=>{el.textContent="Follow Doc →";el.setAttribute("aria-label","Follow Doc, ASHWOOD guide")});
  labelDoc();
  const labelObserver=new MutationObserver(labelDoc);labelObserver.observe(field,{childList:true,subtree:true});
})();