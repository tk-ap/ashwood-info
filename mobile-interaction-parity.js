(() => {
  "use strict";

  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/" && path !== "/index.html") return;

  const mobile = window.matchMedia("(max-width: 760px), (pointer: coarse)");
  const isMobile = mobile.matches;

  if (!isMobile && !document.querySelector('script[data-ashwood-hotspot-runtime]')) {
    const script = document.createElement("script");
    script.src = "/hotspot-runtime-restore.js?v=20260831-restore2";
    script.async = false;
    script.dataset.ashwoodHotspotRuntime = "1";
    document.head.appendChild(script);
  }

  if (!isMobile && !document.querySelector('script[data-ashwood-hotspot-guidance]')) {
    const script = document.createElement("script");
    script.src = "/hotspot-guidance.js?v=20260831-guide2";
    script.async = false;
    script.dataset.ashwoodHotspotGuidance = "1";
    document.head.appendChild(script);
  }

  if (!document.querySelector('script[data-ashwood-doctor-bird-trigger]')) {
    const script = document.createElement("script");
    script.src = "/doctor-bird-trigger.js?v=20260901-rendered-restore4";
    script.async = false;
    script.dataset.ashwoodDoctorBirdTrigger = "1";
    document.head.appendChild(script);
  }

  if (isMobile && !document.querySelector('script[data-ashwood-doctor-bird-mobile-motion]')) {
    const script = document.createElement("script");
    script.src = "/doctor-bird-mobile-motion.js?v=20260901-motion1";
    script.async = false;
    script.dataset.ashwoodDoctorBirdMobileMotion = "1";
    document.head.appendChild(script);
  }

  if (!document.querySelector('script[data-ashwood-home-flow]')) {
    const script = document.createElement("script");
    script.src = "/home-flow.js?v=20260831-flow3";
    script.async = false;
    script.dataset.ashwoodHomeFlow = "1";
    document.head.appendChild(script);
  }

  if (!isMobile) return;

  document.documentElement.classList.add("ashwood-mobile-interaction-parity");
  document.body.classList.add("ashwood-mobile-capability-native");

  const after = (ms, fn) => window.setTimeout(fn, ms);
  const capabilities = [
    ["signal","SIGNAL","I notice what is starting to matter.","Priorities are unclear and weak signals need separating from noise.","ailhat · Portfolio Intelligence","https://ailhat.vercel.app/",true],
    ["friction","FRICTION","I look for where intention and reality stop matching.","The same workaround keeps appearing, or the experience is fighting its intent.","ALVIRA · Context Intelligence","https://alviratech.vercel.app/",true],
    ["translation","TRANSLATION","I turn difficult ideas into forms people can use.","Complex work needs to become clear enough for different people to act.","BUILD JOURNAL · Field Notes + public proof","/journal/",false],
    ["systems","SYSTEMS","I look for the structure underneath the thing.","A recurring problem needs durable structure rather than another patch.","Builds · Governed execution systems","/journal/",false],
    ["resilience","ADAPTATION","I let evidence change the approach.","Reality changes the conditions and the approach needs to change with it.","LEDGATo · Operational reality","https://ledgato.vercel.app/",true],
    ["range","SYNTHESIS","I bring separate things into one coherent idea.","The opportunity sits between disciplines, ideas, or mediums.","ASHWOOD · Modeling + Music + Builds","/about/",false]
  ];

  const markup = () => `
    <p class="ashwood-mobile-capability-intro">Different roles. Different people. The same patterns kept showing up.</p>
    <div class="ashwood-capability-map__header">
      <p class="ashwood-capability-map__eyebrow">THE THROUGHLINE · SIX PATTERNS</p>
      <h2 class="ashwood-capability-map__title">Different work. Same underlying patterns.</h2>
      <p class="ashwood-capability-map__authorship-key">Scroll the field. Each pattern is one way the work tends to move — and where it becomes useful now.</p>
    </div>
    <ol class="ashwood-capability-map__list">
      ${capabilities.map(([id,label,summary,useful,practice,href,external]) => `
        <li class="ashwood-capability-map__item" data-capability="${id}">
          <span class="ashwood-capability-map__skill">${label}</span>
          <p class="ashwood-capability-map__description">${summary}</p>
          <p class="ashwood-capability-map__useful"><strong>Useful when →</strong>${useful}</p>
          <span class="ashwood-capability-map__authorship">WHERE IT SHOWS UP NOW →</span>
          <a class="ashwood-capability-map__practice" data-internal="${String(!external)}" href="${href}"${external ? ' target="_blank" rel="noreferrer"' : ""}>${practice}</a>
        </li>`).join("")}
    </ol>
    <footer class="ashwood-capability-map__footer">
      <p class="ashwood-capability-map__closing">The medium changes. The throughline does not.</p>
      <div class="ashwood-capability-map__provenance"><strong>FOLLOW THE THREAD</strong>See where these patterns become visible across builds, decisions, and field notes.<br><a href="/journal/">Trace the work →</a></div>
    </footer>`;

  const installCapabilityChapter = () => {
    const field = document.querySelector(".principles-field");
    if (!field) return false;

    let map = document.querySelector(".ashwood-capability-map[data-mobile-native='1']");
    if (!map) {
      const existing = document.querySelector(".ashwood-capability-map");
      map = existing || document.createElement("aside");
      map.className = "ashwood-capability-map";
      map.dataset.mobileNative = "1";
      map.setAttribute("aria-label", "ASHWOOD capability throughline");
      map.innerHTML = markup();
      field.appendChild(map);
    } else if (map.parentElement !== field) {
      field.appendChild(map);
    }

    document.querySelectorAll(".ashwood-capability-map").forEach((candidate) => {
      if (candidate !== map) candidate.remove();
    });

    if (map.dataset.mobileReadingInstalled === "1") return true;
    map.dataset.mobileReadingInstalled = "1";
    const items = [...map.querySelectorAll(".ashwood-capability-map__item")];
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = innerHeight * .46;
      let closest = null;
      let distance = Infinity;
      items.forEach((item) => {
        const rect = item.getBoundingClientRect();
        const d = Math.abs(rect.top + Math.min(rect.height * .34,72) - line);
        if (d < distance) { distance = d; closest = item; }
      });
      items.forEach((item) => item.classList.toggle("is-mobile-reading", item === closest));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    addEventListener("scroll", schedule, { passive:true });
    addEventListener("resize", schedule, { passive:true });
    requestAnimationFrame(update);
    return true;
  };

  const installXaymaca = () => {
    const masthead = document.querySelector(".masthead");
    const inline = document.querySelector(".ashwood-jm-xaymaca-inline");
    if (!masthead || !inline || inline.dataset.mobileParity === "1") return false;
    inline.dataset.mobileParity = "1";
    inline.classList.add("ashwood-mobile-parity");
    inline.tabIndex = 0;
    inline.setAttribute("role","button");
    inline.setAttribute("aria-expanded","false");
    let expanded=false, teased=false, timer=0;
    const collapse=()=>{expanded=false;inline.classList.remove("is-mobile-expanded","is-mobile-tease");inline.classList.add("is-mobile-earned");inline.setAttribute("aria-expanded","false");};
    const expand=()=>{expanded=true;inline.classList.remove("is-mobile-tease");inline.classList.add("is-mobile-earned","is-mobile-expanded");inline.setAttribute("aria-expanded","true");};
    const toggle=(event)=>{event?.preventDefault();event?.stopPropagation();clearTimeout(timer);expanded?collapse():expand();};
    inline.addEventListener("click",toggle);
    inline.addEventListener("keydown",(event)=>{if(event.key!=="Enter"&&event.key!==" ")return;toggle(event);});
    const io=new IntersectionObserver((entries)=>{if(teased||!entries.some((entry)=>entry.isIntersecting&&entry.intersectionRatio>=.55))return;after(1500,()=>{const r=masthead.getBoundingClientRect();if(r.bottom>0&&r.top<innerHeight&&!expanded){teased=true;inline.classList.add("is-mobile-earned","is-mobile-tease");inline.setAttribute("aria-expanded","true");timer=after(5200,collapse);}});},{threshold:[.55]});
    io.observe(masthead);
    return true;
  };

  const installTouchToggles = () => {
    [[".iridescent-word--jamaica",".ashwood-jm-motto-context"],[".ashwood-jm-1962",".ashwood-jm-1962-context"]].forEach(([triggerSelector,contextSelector])=>{
      const trigger=document.querySelector(triggerSelector), context=document.querySelector(contextSelector);
      if(!trigger||!context||trigger.dataset.mobileParity==="1")return;
      trigger.dataset.mobileParity="1";
      trigger.addEventListener("click",()=>context.classList.toggle("is-mobile-auto-visible"));
    });
  };

  const install = () => {
    installCapabilityChapter();
    installXaymaca();
    installTouchToggles();
  };

  install();
  const observer = new MutationObserver(install);
  observer.observe(document.body,{childList:true,subtree:true});
})();