(() => {
  const routes = ["/portfolio/", "/music/", "/journal/", "/about/"];
  const target = routes[Math.floor(Math.random() * routes.length)];
  const link = document.querySelector(".iridescent-word");
  if (link) {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      try { sessionStorage.setItem("ashwood.curiosity.walkthrough", "1"); } catch (_) {}
      window.location.assign(`${target}?curious=1`);
    });
  }

  const hotspots = [...document.querySelectorAll(".principle-hotspot")];
  if (!hotspots.length) return;

  const STORAGE_KEY = "ashwood.curiosity.hotspots.v1";
  const REWARD_KEY = "ashwood.curiosity.reward.v1";
  const hotspotId = (hotspot, index) => {
    const namedClass = [...hotspot.classList].find((name) => name.startsWith("principle-hotspot--"));
    return namedClass ? namedClass.replace("principle-hotspot--", "") : `hotspot-${index + 1}`;
  };
  const ids = hotspots.map(hotspotId);
  let discovered = new Set();

  const practiceMap = {
    signal: {
      skill: "SIGNAL",
      description: "Anticipates what matters next, surfaces risk early, and turns noise into decision-ready signal.",
      authorship: "WHERE IT SHOWS UP NOW →",
      practice: "ailhat · Portfolio Intelligence",
      href: "https://ailhat.vercel.app/",
      external: true
    },
    friction: {
      skill: "FRICTION",
      description: "Finds roadblocks early, questions workarounds, and improves the process before the issue compounds.",
      authorship: "WHERE IT SHOWS UP NOW →",
      practice: "ALVIRA · Context Experience",
      href: "https://alviratech.vercel.app/",
      external: true
    },
    translation: {
      skill: "TRANSLATION",
      description: "Makes complex data and operational detail understandable across peers, leaders, auditors, and partners.",
      authorship: "WHERE IT SHOWS UP NOW →",
      practice: "Build Journal · Product Storytelling",
      href: "/journal/",
      external: false
    },
    systems: {
      skill: "SYSTEMS",
      description: "Builds controls, procedures, documentation, and repeatable structures that hold up under scrutiny.",
      authorship: "WHERE IT SHOWS UP NOW →",
      practice: "Agent OS / Workforce · Infrastructure",
      href: "/journal/",
      external: false
    },
    resilience: {
      skill: "RESILIENCE",
      description: "Learns quickly, performs reliably through ambiguity, and keeps the work accurate when conditions change.",
      authorship: "WHERE IT SHOWS UP NOW →",
      practice: "LEDGATo · Operational Reality",
      href: "https://ledgato.vercel.app/",
      external: true
    },
    range: {
      skill: "RANGE",
      description: "Moves across functions, industries, and levels of an organization — building trust, translating context, and keeping complex work moving.",
      authorship: "WHERE IT SHOWS UP NOW →",
      practice: "ASHWOOD · Modeling + Music + Builds",
      href: "/about/",
      external: false
    }
  };

  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(stored)) discovered = new Set(stored.filter((id) => ids.includes(id)));
  } catch (_) {}

  const style = document.createElement("style");
  style.textContent = `
    .ashwood-curiosity-progress{position:fixed;right:clamp(22px,3vw,48px);top:50%;z-index:73;display:flex;flex-direction:column;gap:7px;transform:translateY(-50%);pointer-events:none;opacity:.38;transition:opacity .34s ease}
    .ashwood-curiosity-progress span{display:block;width:3px;height:3px;border-radius:50%;background:var(--ashwood-muted);transition:background .28s ease,box-shadow .32s ease,transform .28s ease}
    .ashwood-curiosity-progress span.is-found{background:var(--ashwood-gold);box-shadow:0 0 9px rgba(214,194,74,.48);transform:scale(1.45)}

    .ashwood-capability-map{position:fixed;right:clamp(34px,5vw,84px);top:var(--ashwood-capability-top,clamp(146px,20vh,220px));z-index:76;width:min(39vw,550px);max-height:var(--ashwood-capability-max-height,60vh);overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;opacity:0;visibility:hidden;pointer-events:none;filter:blur(5px);transform:translateY(8px) scale(.992);transition:opacity .7s ease,filter .72s ease,transform .72s cubic-bezier(.16,.8,.24,1),visibility 0s linear .72s;color:var(--ashwood-ink)}
    .ashwood-capability-map__header{position:relative;display:grid;grid-template-columns:1fr auto;align-items:start;gap:8px 22px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid color-mix(in srgb,var(--ashwood-rule) 72%,transparent)}
    .ashwood-capability-map__eyebrow{grid-column:1;margin:0;color:var(--ashwood-gold);font-size:8px;letter-spacing:.18em;text-transform:uppercase}
    .ashwood-capability-map__title{grid-column:1;margin:0;font-family:Georgia,serif;font-size:clamp(20px,2vw,30px);font-weight:400;line-height:1.02;letter-spacing:-.025em}
    .ashwood-capability-map__authorship-key{grid-column:1;margin:1px 0 0;max-width:50ch;color:var(--ashwood-muted);font-size:8px;line-height:1.45;letter-spacing:.035em}
    .ashwood-capability-map__reset{grid-column:2;grid-row:1 / span 3;align-self:start;border:0;padding:0;background:none;cursor:pointer;font-family:inherit;font-size:8px;letter-spacing:.13em;text-transform:uppercase;color:var(--ashwood-muted)}
    .ashwood-capability-map__reset:hover,.ashwood-capability-map__reset:focus-visible{color:var(--ashwood-gold);font-style:italic}
    .ashwood-capability-map__list{display:grid;gap:0;margin:0;padding:0;list-style:none}
    .ashwood-capability-map__item{position:relative;display:grid;grid-template-columns:minmax(72px,.25fr) minmax(0,1fr);gap:4px 15px;padding:9px 0 10px;border-bottom:1px solid color-mix(in srgb,var(--ashwood-rule) 60%,transparent)}
    .ashwood-capability-map__skill{font-size:8px;letter-spacing:.15em;text-transform:uppercase;color:var(--ashwood-gold)}
    .ashwood-capability-map__description{grid-column:2;margin:0 0 3px;color:var(--ashwood-ink);font-size:9px;line-height:1.42;opacity:.86}
    .ashwood-capability-map__authorship{grid-column:2;display:block;margin:2px 0 0;color:var(--ashwood-muted);font-size:7px;line-height:1.2;letter-spacing:.14em;text-transform:uppercase;opacity:.72}
    .ashwood-capability-map__practice{grid-column:2;display:inline-flex;align-items:center;gap:6px;width:max-content;max-width:100%;font-size:9px;font-weight:500;letter-spacing:.055em;color:var(--ashwood-ink);text-decoration:none}
    .ashwood-capability-map__practice::after{content:"↗";font-size:8px;color:var(--ashwood-muted);transition:transform .2s ease,color .2s ease}
    .ashwood-capability-map__practice[data-internal="true"]::after{content:"→"}
    .ashwood-capability-map__practice:hover,.ashwood-capability-map__practice:focus-visible{color:var(--ashwood-gold);font-style:italic}
    .ashwood-capability-map__practice:hover::after,.ashwood-capability-map__practice:focus-visible::after{color:var(--ashwood-gold);transform:translateX(2px)}
    .ashwood-capability-map__footer{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-top:10px}
    .ashwood-capability-map__closing{max-width:34ch;margin:0;color:var(--ashwood-muted);font-family:Georgia,serif;font-size:9px;line-height:1.4;font-style:italic}
    .ashwood-capability-map__link{flex:none;font-size:8px;letter-spacing:.14em;text-transform:uppercase;text-decoration:none;color:var(--ashwood-muted)}
    .ashwood-capability-map__link:hover,.ashwood-capability-map__link:focus-visible{color:var(--ashwood-gold);font-style:italic}

    .principles-field__hint{transition:opacity .32s ease,color .32s ease,letter-spacing .32s ease}
    .principles-field__hint.is-assisting{color:var(--ashwood-gold);letter-spacing:.13em;opacity:.78}
    .principle-hotspot.is-assist-pulse{animation:ashwood-assist-pulse 2.2s ease-in-out infinite!important}
    .ashwood-assist-status{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
    @keyframes ashwood-assist-pulse{0%,100%{filter:none;box-shadow:0 0 0 0 rgba(214,194,74,0)}50%{filter:drop-shadow(0 0 5px rgba(214,194,74,.46));box-shadow:0 0 0 7px rgba(214,194,74,.035)}}

    body.has-found-all-hotspots .ashwood-capability-map{opacity:1;visibility:visible;pointer-events:auto;filter:blur(0);transform:translateY(0) scale(1);transition-delay:1.18s}
    body.has-found-all-hotspots .ashwood-curiosity-progress{opacity:0}
    body.has-found-all-hotspots .principle-hotspot{opacity:0!important;pointer-events:none!important;filter:blur(3px);transform:scale(.985);transition:opacity .7s ease,filter .7s ease,transform .7s ease!important}
    body.has-found-all-hotspots .principles-field__hint{opacity:0!important;transition:opacity .45s ease!important}

    .ashwood-thread-flash{position:fixed;inset:0;z-index:77;display:grid;place-items:center;pointer-events:none;opacity:0;visibility:hidden;background:radial-gradient(circle at 68% 42%,rgba(214,194,74,.09) 0%,rgba(180,135,50,.025) 24%,transparent 56%);backdrop-filter:blur(0)}
    .ashwood-thread-flash span{position:absolute;left:68%;top:42%;transform:translate(-50%,-50%) scale(.972);filter:blur(8px);font-family:Georgia,serif;font-size:clamp(22px,2.6vw,38px);white-space:nowrap;color:var(--ashwood-ink);opacity:0;letter-spacing:-.015em}
    .ashwood-thread-flash.is-active{visibility:visible;animation:ashwood-thread-shell 2.35s cubic-bezier(.16,.8,.24,1) both}
    .ashwood-thread-flash.is-active span{animation:ashwood-thread-copy 2.35s cubic-bezier(.16,.8,.24,1) both}
    @keyframes ashwood-thread-shell{0%{opacity:0}18%{opacity:.5}52%{opacity:.72}100%{opacity:0;visibility:hidden}}
    @keyframes ashwood-thread-copy{0%{opacity:0;filter:blur(8px);transform:translate(-50%,calc(-50% + 7px)) scale(.972)}24%{opacity:.18}43%{opacity:.92;filter:blur(0);transform:translate(-50%,-50%) scale(1)}65%{opacity:.82;filter:blur(0);transform:translate(-50%,-50%) scale(1)}100%{opacity:0;filter:blur(4px);transform:translate(-50%,calc(-50% - 4px)) scale(1.008)}}

    @media(max-width:760px){
      .ashwood-curiosity-progress{right:13px}
      .ashwood-capability-map{position:relative;right:auto;top:auto;z-index:72;width:100%;max-height:none;margin:30px 0 18px;padding:16px 0 0;transform:translateY(8px)}
      .ashwood-capability-map__header{grid-template-columns:1fr;gap:7px}
      .ashwood-capability-map__reset{grid-column:1;grid-row:auto;margin-top:4px;justify-self:start;min-height:44px;display:inline-flex;align-items:center;padding:8px 0}
      .ashwood-capability-map__item{grid-template-columns:82px 1fr;padding:10px 0 11px}
      .ashwood-capability-map__authorship,.ashwood-capability-map__practice,.ashwood-capability-map__description{grid-column:2}
      .ashwood-capability-map__practice{min-height:40px;padding:6px 0}
      .ashwood-capability-map__footer{align-items:flex-start;flex-direction:column}
      .ashwood-capability-map__closing{max-width:38ch}
      .ashwood-capability-map__link{min-height:44px;display:inline-flex;align-items:center;padding:8px 0}
      body.has-found-all-hotspots .principles-field{min-height:0!important;height:auto!important}
      .ashwood-thread-flash span{left:50%;top:46%;font-size:clamp(20px,7vw,30px)}
    }
    @media(prefers-reduced-motion:reduce){.ashwood-capability-map,.principle-hotspot{transition:none!important}.ashwood-thread-flash{display:none!important}.principle-hotspot.is-assist-pulse{animation:none!important;outline:1px solid color-mix(in srgb,var(--ashwood-gold) 32%,transparent);outline-offset:3px}}
  `;
  document.head.append(style);

  const progress = document.createElement("div");
  progress.className = "ashwood-curiosity-progress";
  progress.setAttribute("aria-hidden", "true");
  progress.innerHTML = ids.map((id) => `<span data-hotspot-progress="${id}"></span>`).join("");
  document.body.append(progress);

  const flash = document.createElement("div");
  flash.className = "ashwood-thread-flash";
  flash.setAttribute("aria-hidden", "true");
  flash.innerHTML = "<span>You found the thread.</span>";
  document.body.append(flash);

  const capabilityMap = document.createElement("aside");
  capabilityMap.className = "ashwood-capability-map";
  capabilityMap.setAttribute("aria-live", "polite");
  capabilityMap.setAttribute("aria-label", "ASHWOOD observed strengths map");
  capabilityMap.innerHTML = `
    <div class="ashwood-capability-map__header">
      <p class="ashwood-capability-map__eyebrow">SIX / SIX · OBSERVED STRENGTHS</p>
      <h2 class="ashwood-capability-map__title">The capabilities people keep relying on.</h2>
      <p class="ashwood-capability-map__authorship-key">Recurring patterns drawn from feedback by managers, peers, and mentors across years of work. I tend to start by uncovering “why?” — and stay with the problem until the structure underneath it becomes clear.</p>
      <button class="ashwood-capability-map__reset" type="button" aria-label="Reset the observed strengths map and rediscover the six signals">↺ Reset field</button>
    </div>
    <ol class="ashwood-capability-map__list">
      ${ids.map((id) => {
        const item = practiceMap[id] || {
          skill: id.toUpperCase(),
          description: "A recurring capability reflected through real working relationships.",
          authorship: "WHERE IT SHOWS UP NOW →",
          practice: "ASHWOOD",
          href: "/about/",
          external: false
        };
        const targetAttrs = item.external ? ' target="_blank" rel="noreferrer"' : '';
        return `<li class="ashwood-capability-map__item" data-capability="${id}">
          <span class="ashwood-capability-map__skill">${item.skill}</span>
          <p class="ashwood-capability-map__description">${item.description}</p>
          <span class="ashwood-capability-map__authorship">${item.authorship}</span>
          <a class="ashwood-capability-map__practice" href="${item.href}" data-internal="${item.external ? "false" : "true"}"${targetAttrs}>${item.practice}</a>
        </li>`;
      }).join("")}
    </ol>
    <div class="ashwood-capability-map__footer">
      <p class="ashwood-capability-map__closing">Different roles. Different people. The same patterns kept showing up.</p>
      <a class="ashwood-capability-map__link" href="/dive-deeper?found=all-six">Dive deeper →</a>
    </div>`;
  const shell = document.querySelector(".shell") || document.body;
  shell.append(capabilityMap);

  const field = document.querySelector(".principles-field");
  const fieldHint = field?.querySelector(".principles-field__hint");
  const defaultHint = fieldHint?.textContent || "There is more here.";
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const assistStatus = document.createElement("p");
  assistStatus.className = "ashwood-assist-status";
  assistStatus.setAttribute("role", "status");
  assistStatus.setAttribute("aria-live", "polite");
  assistStatus.setAttribute("aria-atomic", "true");
  field?.append(assistStatus);

  let lastDiscoveryAt = performance.now();
  let lastPointerAt = 0;
  let lastPointer = null;
  let pointerTravel = 0;
  let latestPointer = null;
  let assistTarget = null;
  let touchSearchEvents = 0;
  let lastTouchSearchAt = 0;
  let lastAssistMessage = "";

  const announce = (message) => {
    if (!message || message === lastAssistMessage) return;
    lastAssistMessage = message;
    assistStatus.textContent = message;
  };

  const clearAssist = (resetHint = true) => {
    assistTarget?.classList.remove("is-assist-pulse");
    assistTarget = null;
    lastAssistMessage = "";
    assistStatus.textContent = "";
    if (fieldHint && resetHint) {
      fieldHint.textContent = defaultHint;
      fieldHint.classList.remove("is-assisting");
    }
  };

  const setAssistMessage = (message) => {
    if (fieldHint) {
      fieldHint.textContent = message;
      fieldHint.classList.add("is-assisting");
    }
    announce(message);
  };

  field?.addEventListener("pointermove", (event) => {
    const point = { x: event.clientX, y: event.clientY };
    if ((event.pointerType === "mouse" || event.pointerType === "pen") && lastPointer) {
      pointerTravel += Math.hypot(point.x - lastPointer.x, point.y - lastPointer.y);
    }
    lastPointer = point;
    latestPointer = point;
    lastPointerAt = performance.now();
  }, { passive: true });

  field?.addEventListener("pointerdown", (event) => {
    const now = performance.now();
    latestPointer = { x: event.clientX, y: event.clientY };
    lastPointerAt = now;
    if ((event.pointerType === "touch" || coarsePointer) && !event.target.closest(".principle-hotspot")) {
      touchSearchEvents += 1;
      lastTouchSearchAt = now;
    }
  }, { passive: true });

  field?.addEventListener("pointerleave", () => {
    lastPointer = null;
  }, { passive: true });

  const maybeAssistSearch = () => {
    if (!field || discovered.size >= hotspots.length) {
      clearAssist();
      return;
    }

    const now = performance.now();
    const pointerSearching = pointerTravel > 900 && (now - lastPointerAt) < 2600;
    const touchSearching = touchSearchEvents >= 3 && (now - lastTouchSearchAt) < 12000;
    const activelySearching = pointerSearching || touchSearching;
    if (!activelySearching) return;

    const stalledFor = now - lastDiscoveryAt;
    if (stalledFor >= 16000) {
      setAssistMessage(discovered.size ? "You’re close." : "Keep following the field.");
    }

    if (stalledFor < 28000 || !latestPointer) return;

    const remaining = hotspots.filter((hotspot, index) => !discovered.has(ids[index]));
    if (!remaining.length) return;
    const nearestRemaining = remaining
      .map((hotspot) => {
        const rect = hotspot.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + Math.min(rect.height / 2, 34);
        return { hotspot, distance: Math.hypot(centerX - latestPointer.x, centerY - latestPointer.y) };
      })
      .sort((a, b) => a.distance - b.distance)[0]?.hotspot;

    if (nearestRemaining && nearestRemaining !== assistTarget) {
      assistTarget?.classList.remove("is-assist-pulse");
      assistTarget = nearestRemaining;
      assistTarget.classList.add("is-assist-pulse");
      setAssistMessage("One signal is warmer than the rest.");
    }
  };

  const assistInterval = window.setInterval(maybeAssistSearch, 1200);
  window.addEventListener("pagehide", () => window.clearInterval(assistInterval), { once: true });

  const fitCapabilityMap = () => {
    if (window.matchMedia("(max-width: 760px)").matches) {
      capabilityMap.style.removeProperty("--ashwood-capability-top");
      capabilityMap.style.removeProperty("--ashwood-capability-max-height");
      return;
    }

    const now = document.querySelector(".home-now");
    if (!now) return;
    const nowRect = now.getBoundingClientRect();
    const preferredTop = Math.max(124, Math.min(220, window.innerHeight * .2));
    const safetyGap = 34;
    const minimumUsableHeight = 230;
    let top = preferredTop;
    let available = nowRect.top - safetyGap - top;

    if (available < minimumUsableHeight) {
      top = Math.max(92, nowRect.top - safetyGap - minimumUsableHeight);
      available = nowRect.top - safetyGap - top;
    }

    capabilityMap.style.setProperty("--ashwood-capability-top", `${Math.round(top)}px`);
    capabilityMap.style.setProperty("--ashwood-capability-max-height", `${Math.max(185, Math.floor(available))}px`);
  };

  const updateProgress = () => {
    progress.querySelectorAll("[data-hotspot-progress]").forEach((dot) => {
      dot.classList.toggle("is-found", discovered.has(dot.dataset.hotspotProgress));
    });
  };

  let rewardedThisVisit = false;
  const unlockReward = (remembered = false) => {
    if (rewardedThisVisit) return;
    rewardedThisVisit = true;
    clearAssist();
    fitCapabilityMap();
    document.body.classList.add("has-found-all-hotspots");
    requestAnimationFrame(fitCapabilityMap);
    if (!remembered) {
      flash.classList.remove("is-active");
      void flash.offsetWidth;
      flash.classList.add("is-active");
      announce("All six observed strengths found. Capability map revealed.");
    }
    try { localStorage.setItem(REWARD_KEY, "1"); } catch (_) {}
  };

  const resetDiscovery = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(REWARD_KEY);
    } catch (_) {}
    window.location.reload();
  };

  const markDiscovered = (hotspot) => {
    const index = hotspots.indexOf(hotspot);
    if (index < 0) return;
    const id = ids[index];
    if (discovered.has(id)) return;
    discovered.add(id);
    hotspot.classList.add("is-discovered");
    lastDiscoveryAt = performance.now();
    pointerTravel = 0;
    touchSearchEvents = 0;
    clearAssist();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...discovered])); } catch (_) {}
    updateProgress();
    announce(`${discovered.size} of ${hotspots.length} signals found.`);
    if (!coarsePointer && discovered.size === hotspots.length) unlockReward(false);
  };

  hotspots.forEach((hotspot) => {
    const observer = new MutationObserver(() => {
      if (hotspot.classList.contains("is-near") || hotspot.classList.contains("is-revealed")) markDiscovered(hotspot);
    });
    observer.observe(hotspot, { attributes: true, attributeFilter: ["class"] });
    hotspot.addEventListener("focus", () => markDiscovered(hotspot));
    hotspot.addEventListener("click", () => markDiscovered(hotspot));
  });

  capabilityMap.querySelector(".ashwood-capability-map__reset")?.addEventListener("click", resetDiscovery);
  window.addEventListener("resize", fitCapabilityMap, { passive: true });

  updateProgress();
  hotspots.forEach((hotspot, index) => hotspot.classList.toggle("is-discovered", discovered.has(ids[index])));

  let rememberedReward = false;
  try { rememberedReward = localStorage.getItem(REWARD_KEY) === "1" && discovered.size === hotspots.length; } catch (_) {}
  if (!coarsePointer && rememberedReward) unlockReward(true);
})();
