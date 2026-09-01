(() => {
  "use strict";

  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/" && path !== "/index.html") return;

  const mobile = window.matchMedia("(max-width: 760px), (pointer: coarse)");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const isMobile = mobile.matches;
  const after = (ms, fn) => window.setTimeout(fn, ms);
  document.body.classList.add("ashwood-home-editorial");

  const thesisStyle = document.createElement("style");
  thesisStyle.textContent = `
    .ashwood-home-thesis {
      position: relative;
      box-sizing: border-box;
      width: 100%;
      margin: clamp(62px,10vw,136px) 0 clamp(52px,8vw,110px);
      padding: clamp(28px,4vw,52px) 0 clamp(34px,5vw,68px);
      border-top: 1px solid color-mix(in srgb,var(--ashwood-field-green,#009b3a) 38%,var(--ashwood-rule));
      border-bottom: 1px solid color-mix(in srgb,var(--ashwood-rule) 62%,transparent);
    }
    .ashwood-home-thesis__eyebrow { display:block; margin:0 0 clamp(18px,2.6vw,30px); color:var(--ashwood-field-green,#009b3a); font-size:8px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; }
    .ashwood-home-thesis__statement { margin:0; max-width:18ch; color:var(--ashwood-ink); font-family:Georgia,serif; font-size:clamp(44px,6.7vw,98px); font-weight:400; line-height:.94; letter-spacing:-.05em; }
    .ashwood-home-thesis__statement em { color:var(--ashwood-gold); font-style:italic; font-weight:400; }
    .ashwood-home-thesis__prompt { display:flex; align-items:center; gap:12px; margin:clamp(26px,3.4vw,42px) 0 0; color:var(--ashwood-muted); font-size:8px; letter-spacing:.16em; text-transform:uppercase; }
    .ashwood-home-thesis__prompt::before { content:""; width:clamp(28px,5vw,72px); height:1px; background:color-mix(in srgb,var(--ashwood-gold) 58%,transparent); }
    @media (max-width:760px),(pointer:coarse) {
      .ashwood-home-thesis { margin:24px 0 56px; padding:30px 0 38px; }
      .ashwood-home-thesis__statement { max-width:12ch; font-size:clamp(40px,12.2vw,58px); line-height:.95; }
      .ashwood-home-thesis__prompt { margin-top:28px; }
    }
  `;
  document.head.appendChild(thesisStyle);

  const loadScript = (src, marker) => {
    if (document.querySelector(`script[${marker}]`)) return;
    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    script.setAttribute(marker, "1");
    document.head.appendChild(script);
  };

  if (!isMobile) {
    loadScript("/hotspot-runtime-restore.js?v=20260831-restore2", "data-ashwood-hotspot-runtime");
    loadScript("/hotspot-guidance.js?v=20260831-guide2", "data-ashwood-hotspot-guidance");
  }
  loadScript("/doctor-bird-trigger.js?v=20260831-guide1", "data-ashwood-doctor-bird-trigger");
  loadScript("/home-flow.js?v=20260831-flow3", "data-ashwood-home-flow");

  const capabilities = [
    { id:"anticipation", name:"ANTICIPATION", statement:"I notice what is likely to matter next.", useful:"A weak signal is becoming important before the need is obvious.", practice:"ailhat · Portfolio Intelligence", href:"https://ailhat.vercel.app/", external:true },
    { id:"diagnosis", name:"DIAGNOSIS", statement:"I find where intention and reality diverge.", useful:"The stated intent and lived reality have started to pull apart.", practice:"ALVIRA · Context Intelligence", href:"https://alviratech.vercel.app/", external:true },
    { id:"translation", name:"TRANSLATION", statement:"I make complex ideas digestible.", useful:"Complex work needs to become clear enough for different people to absorb and act on.", practice:"Build Journal · Field notes + public proof", href:"/journal/" },
    { id:"systems", name:"SYSTEMS", statement:"I look for the structure underneath the thing.", useful:"A recurring problem needs durable structure rather than another patch.", practice:"Builds · Governed execution systems", href:"/journal/" },
    { id:"adaptation", name:"ADAPTATION", statement:"I let evidence change the approach.", useful:"Reality changes the conditions and the approach needs to change with it.", practice:"LEDGATo · Operational reality", href:"https://ledgato.vercel.app/", external:true },
    { id:"synthesis", name:"SYNTHESIS", statement:"I bring separate things into one coherent idea.", useful:"The opportunity sits between disciplines, ideas, or mediums.", practice:"ASHWOOD · Modeling + Music + Builds", href:"/about/" }
  ];

  const installThesis = () => {
    if (document.querySelector(".ashwood-home-thesis")) return;
    const intro = document.querySelector(".intro");
    const field = document.querySelector(".principles-field");
    if (!intro || !field) return;
    const section = document.createElement("section");
    section.className = "ashwood-home-thesis";
    section.setAttribute("aria-labelledby", "ashwood-home-thesis-title");
    section.innerHTML = `<span class="ashwood-home-thesis__eyebrow">THE INSTINCT</span><h2 class="ashwood-home-thesis__statement" id="ashwood-home-thesis-title">I notice what should exist next, then build the conditions for it to <em>become real.</em></h2><p class="ashwood-home-thesis__prompt">The throughline is how.</p>`;
    field.before(section);
  };

  const buildThroughline = () => {
    if (!isMobile) return;
    const field = document.querySelector(".principles-field");
    if (!field || field.querySelector(".ashwood-throughline-native")) return;
    field.querySelectorAll(".ashwood-capability-map,.ashwood-field-guide,.ashwood-mobile-hotspot-panel").forEach((node) => node.remove());
    const throughline = document.createElement("section");
    throughline.className = "ashwood-throughline-native";
    throughline.id = "throughline";
    throughline.setAttribute("aria-labelledby", "throughline-title");
    throughline.innerHTML = `<p class="ashwood-throughline__eyebrow">THE THROUGHLINE · HOW THE WORK MOVES</p><h2 class="ashwood-throughline__title" id="throughline-title">The forms change.<br>The method keeps returning.</h2><p class="ashwood-throughline__intro">Six recurring ways I anticipate, diagnose, translate, build, adapt, and bring separate things into coherence.</p><ol class="ashwood-throughline__list">${capabilities.map((item,index)=>`<li class="ashwood-throughline__item" data-capability="${item.id}"><span class="ashwood-throughline__index">${String(index+1).padStart(2,"0")} / 06</span><span class="ashwood-throughline__name">${item.name}</span><p class="ashwood-throughline__statement">${item.statement}</p><p class="ashwood-throughline__useful"><strong>Useful when</strong>${item.useful}</p><a class="ashwood-throughline__practice" href="${item.href}"${item.external?' target="_blank" rel="noreferrer"':""}>${item.practice} →</a></li>`).join("")}</ol>`;
    field.appendChild(throughline);
    const items=[...throughline.querySelectorAll(".ashwood-throughline__item")];
    const setReading=()=>{ const line=window.innerHeight*.47; let closest=null,distance=Infinity; items.forEach((item)=>{ const rect=item.getBoundingClientRect(); const d=Math.abs((rect.top+Math.min(rect.height*.3,110))-line); if(d<distance){distance=d;closest=item;} }); items.forEach((item)=>item.classList.toggle("is-reading",item===closest)); };
    let frame=0;
    const schedule=()=>{ if(frame)return; frame=requestAnimationFrame(()=>{frame=0;setReading();}); };
    window.addEventListener("scroll",schedule,{passive:true});
    window.addEventListener("resize",schedule,{passive:true});
    setReading();
  };

  const refinePortals=()=>{ const container=document.querySelector(".home-entryways"); if(!container||container.dataset.editorial==="1")return; container.dataset.editorial="1"; [...container.querySelectorAll(".home-entryway")].forEach((entry)=>{ const href=entry.getAttribute("href")||""; if(/connect/.test(href)){entry.remove();return;} if(/portfolio/.test(href))entry.dataset.kind="modeling"; else if(/music/.test(href))entry.dataset.kind="music"; else if(/journal/.test(href))entry.dataset.kind="builds"; }); };
  const simplifyNow=()=>{ const section=document.querySelector("#now,.home-sitrep"); if(!section||section.classList.contains("home-now-editorial"))return; section.className="home-now home-now-editorial"; section.setAttribute("aria-label","What is happening now"); section.innerHTML=`<span class="home-now-editorial__label">NOW</span><p class="home-now-editorial__copy">Los Angeles · modeling, music, and product building in active motion.</p><a class="home-now-editorial__link" href="/journal/">Follow the Build Journal →</a>`; };
  const refineClosing=()=>{ const nav=document.querySelector(".future-nav,.home-utility"); if(!nav||nav.classList.contains("home-closing"))return; nav.className="future-nav home-utility home-closing"; nav.setAttribute("aria-label","Continue with TK Ashwood"); nav.innerHTML=`<h2 class="home-closing__title">Come make something.</h2><span class="home-closing__links"><a href="/connect/">Work together →</a><a href="/music/">Listen →</a><a href="/journal/">Follow the Journal →</a><a href="/about/">About →</a></span>`; };

  const installXaymaca=()=>{
    if(!isMobile)return;
    const masthead=document.querySelector(".masthead");
    const inline=document.querySelector(".ashwood-jm-xaymaca-inline");
    if(!masthead||!inline||inline.dataset.mobileParity==="1")return;
    inline.dataset.mobileParity="1"; inline.classList.add("ashwood-mobile-parity"); inline.tabIndex=0; inline.setAttribute("role","button"); inline.setAttribute("aria-expanded","false");
    let expanded=false;
    const render=()=>{ inline.classList.toggle("is-mobile-expanded",expanded); inline.classList.add("is-mobile-earned"); inline.setAttribute("aria-expanded",String(expanded)); };
    inline.addEventListener("click",(event)=>{event.preventDefault();expanded=!expanded;render();});
    inline.addEventListener("keydown",(event)=>{if(event.key!=="Enter"&&event.key!==" ")return;event.preventDefault();expanded=!expanded;render();});
    after(1500,()=>{const rect=masthead.getBoundingClientRect();if(rect.bottom>0){inline.classList.add("is-mobile-tease");after(4300,()=>inline.classList.remove("is-mobile-tease"));}});
  };

  const installDocEditorial=()=>{
    if(!isMobile||document.querySelector(".ashwood-doc-editorial-launcher"))return;
    const bird=document.querySelector(".ashwood-doctor-bird-cursor");
    const rendered=bird?.querySelector("img");
    if(!bird||!rendered)return;
    bird.classList.add("ashwood-doc-editorial-bird"); bird.style.opacity="0"; bird.style.visibility="hidden";
    if(!bird.querySelector(".ashwood-doc-wing-trace")){ const near=rendered.cloneNode(true),far=rendered.cloneNode(true); near.className="ashwood-doc-wing-trace ashwood-doc-wing-trace--near"; far.className="ashwood-doc-wing-trace ashwood-doc-wing-trace--far"; near.removeAttribute("id");far.removeAttribute("id");near.setAttribute("aria-hidden","true");far.setAttribute("aria-hidden","true");bird.append(far,near); }
    const launcher=document.createElement("button"); launcher.className="ashwood-doc-editorial-launcher"; launcher.type="button"; launcher.textContent="DOC / GUIDE"; document.body.appendChild(launcher);
    const panel=document.createElement("aside"); panel.className="ashwood-doc-editorial-panel"; panel.hidden=true; panel.innerHTML=`<p class="ashwood-doc-editorial-panel__eyebrow"></p><h2 class="ashwood-doc-editorial-panel__title"></h2><p class="ashwood-doc-editorial-panel__copy"></p><div class="ashwood-doc-editorial-panel__controls"><span class="count"></span><span></span><button class="back" type="button">Back</button><button class="next" type="button">Next →</button><button class="exit" type="button">Exit</button></div>`; document.body.appendChild(panel);
    const stops=[
      [".intro","DOC / 01 / ORIENTATION","Follow the idea.","ASHWOOD begins with curiosity: modeling, music, products, and systems are different forms the same point of view can take."],
      [".ashwood-home-thesis","DOC / 02 / INSTINCT","Notice what should exist next.","The recurring instinct is to identify the missing condition, then build what lets a different outcome become possible."],
      ["#throughline,.principles-field","DOC / 03 / THROUGHLINE","The method keeps returning.","Anticipation, diagnosis, translation, systems, adaptation, and synthesis describe how the work moves."],
      [".home-entryways","DOC / 04 / BECOMINGS","Then the pattern becomes something.","Modeling, music, and builds are different manifestations—not separate identities competing for space."],
      [".home-now-editorial","DOC / 05 / NOW","The practice stays live.","The Build Journal keeps the beliefs, reversals, evidence, failures, and decisions behind what is being made now."],
      [".home-closing","DOC / 06 / CONTINUE","Come make something.","Choose a thread: collaborate, listen, follow the work, or go deeper into the practice."]
    ];
    let active=false,index=0,current={x:innerWidth+120,y:130};
    const targetPoint=(el)=>{const rect=el.getBoundingClientRect();return{x:Math.max(66,Math.min(innerWidth-68,rect.right-Math.min(42,rect.width*.12))),y:Math.max(82,Math.min(innerHeight*.56,rect.top+Math.min(rect.height*.28,126)))};};
    const placeInstant=(point)=>{current=point;bird.style.transform=`translate3d(${point.x-41}px,${point.y-28}px,0)`;};
    const flyTo=(point,backwards=false,entering=false)=>{bird.getAnimations().forEach((animation)=>animation.cancel());const start=entering?{x:innerWidth+115,y:Math.max(84,point.y-92)}:current;const mid={x:start.x+(point.x-start.x)*.52,y:Math.min(start.y,point.y)-28};bird.style.scale=backwards?"-1 1":"1 1";bird.style.opacity="1";bird.style.visibility="visible";if(reduce.matches){placeInstant(point);return Promise.resolve();}const animation=bird.animate([{transform:`translate3d(${start.x-41}px,${start.y-28}px,0) rotate(0deg)`},{transform:`translate3d(${mid.x-41}px,${mid.y-28}px,0) rotate(${backwards?-4:4}deg)`,offset:.52},{transform:`translate3d(${point.x-41}px,${point.y-28}px,0) rotate(0deg)`}],{duration:720,easing:"cubic-bezier(.22,.78,.22,1)",fill:"forwards"});return animation.finished.catch(()=>{}).then(()=>placeInstant(point));};
    const afterScrollSettles=(callback)=>{if(reduce.matches){callback();return;}let timer=0;const done=()=>{window.clearTimeout(timer);window.removeEventListener("scroll",reset);callback();};const reset=()=>{window.clearTimeout(timer);timer=window.setTimeout(done,150);};window.addEventListener("scroll",reset,{passive:true});timer=window.setTimeout(done,520);};
    const render=(backwards=false,entering=false)=>{const stop=stops[index],el=document.querySelector(stop[0]);if(!el)return;panel.hidden=true;el.scrollIntoView({behavior:reduce.matches?"auto":"smooth",block:"center"});afterScrollSettles(()=>{if(!active)return;const point=targetPoint(el);flyTo(point,backwards,entering).then(()=>{if(!active)return;panel.querySelector(".ashwood-doc-editorial-panel__eyebrow").textContent=stop[1];panel.querySelector(".ashwood-doc-editorial-panel__title").textContent=stop[2];panel.querySelector(".ashwood-doc-editorial-panel__copy").textContent=stop[3];panel.querySelector(".count").textContent=`${String(index+1).padStart(2,"0")} / 06`;panel.querySelector(".back").disabled=index===0;panel.querySelector(".next").textContent=index===stops.length-1?"Finish →":"Next →";panel.hidden=false;});});};
    const start=()=>{if(active)return;active=true;index=0;launcher.hidden=true;render(false,true);};
    const end=()=>{active=false;panel.hidden=true;launcher.hidden=false;if(reduce.matches){bird.style.opacity="0";bird.style.visibility="hidden";return;}const exit={x:innerWidth+120,y:Math.max(80,current.y-70)};flyTo(exit,false,false).then(()=>{bird.style.opacity="0";bird.style.visibility="hidden";});};
    const next=()=>{if(!active)return;if(index===stops.length-1){end();return;}index+=1;render(false,false);};
    const back=()=>{if(!active||index===0)return;index-=1;render(true,false);};
    launcher.addEventListener("click",start);panel.querySelector(".next").addEventListener("click",next);panel.querySelector(".back").addEventListener("click",back);panel.querySelector(".exit").addEventListener("click",end);
  };

  const cleanupMobileLegacy=()=>{if(!isMobile)return;document.querySelectorAll(".ashwood-capability-map,.ashwood-curiosity-progress,.ashwood-thread-flash,.ashwood-field-guide,.ashwood-capability-nudge,.ashwood-mobile-hotspot-panel").forEach((node)=>node.remove());};
  const install=()=>{installThesis();refinePortals();simplifyNow();refineClosing();buildThroughline();installXaymaca();cleanupMobileLegacy();installDocEditorial();};
  install();
  requestAnimationFrame(()=>requestAnimationFrame(install));
  window.addEventListener("load",install,{once:true});
  if(isMobile){const observer=new MutationObserver(()=>{cleanupMobileLegacy();if(!document.querySelector(".ashwood-home-thesis"))installThesis();if(!document.querySelector(".ashwood-throughline-native"))buildThroughline();if(!document.querySelector(".ashwood-doc-editorial-launcher"))installDocEditorial();});observer.observe(document.body,{childList:true,subtree:true});after(2400,()=>observer.disconnect());}
})();