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
    signal: { skill: "SIGNAL", practice: "Ailhat · Portfolio Intelligence", note: "Finding the opportunity, risk, drift, or work that deserves attention." },
    friction: { skill: "FRICTION", practice: "ALVIRA · Context Experience", note: "Removing unnecessary work between a person, their context, and useful intelligence." },
    translation: { skill: "TRANSLATION", practice: "Build Journal · Product Storytelling", note: "Making evolving systems and decisions legible enough to act on." },
    systems: { skill: "SYSTEMS", practice: "Agent OS / Workforce · Infrastructure", note: "Designing the structure beneath products, agents, skills, handoffs, and execution." },
    resilience: { skill: "RESILIENCE", practice: "LEDGATo · Operational Reality", note: "Testing whether an interface survives runtime constraints and real deployment." },
    range: { skill: "RANGE", practice: "ASHWOOD · Modeling + Music + Builds", note: "Using one point of view across multiple forms without forcing one lane." }
  };

  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(stored)) discovered = new Set(stored.filter((id) => ids.includes(id)));
  } catch (_) {}

  const style = document.createElement("style");
  style.textContent = `
    .ashwood-curiosity-progress{position:fixed;right:clamp(22px,3vw,48px);top:50%;z-index:73;display:flex;flex-direction:column;gap:7px;transform:translateY(-50%);pointer-events:none;opacity:.38;transition:opacity .28s ease}
    .ashwood-curiosity-progress span{display:block;width:3px;height:3px;border-radius:50%;background:var(--ashwood-muted);transition:background .28s ease,box-shadow .32s ease,transform .28s ease}
    .ashwood-curiosity-progress span.is-found{background:var(--ashwood-gold);box-shadow:0 0 9px rgba(214,194,74,.48);transform:scale(1.45)}

    .ashwood-capability-map{position:fixed;right:clamp(34px,5vw,84px);top:var(--ashwood-capability-top,clamp(146px,20vh,220px));z-index:76;width:min(37vw,520px);max-height:var(--ashwood-capability-max-height,60vh);overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;opacity:0;visibility:hidden;pointer-events:none;transform:translateY(10px);transition:opacity .55s ease,transform .55s cubic-bezier(.2,.8,.2,1),visibility 0s linear .55s;color:var(--ashwood-ink)}
    .ashwood-capability-map__header{position:relative;display:grid;grid-template-columns:1fr auto;align-items:start;gap:12px 22px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid color-mix(in srgb,var(--ashwood-rule) 72%,transparent)}
    .ashwood-capability-map__eyebrow{grid-column:1;margin:0;color:var(--ashwood-gold);font-size:8px;letter-spacing:.18em;text-transform:uppercase}
    .ashwood-capability-map__title{grid-column:1;margin:0;font-family:Georgia,serif;font-size:clamp(20px,2vw,30px);font-weight:400;line-height:1.02;letter-spacing:-.025em}
    .ashwood-capability-map__reset{grid-column:2;grid-row:1 / span 2;align-self:start;border:0;padding:0;background:none;cursor:pointer;font-family:inherit;font-size:8px;letter-spacing:.13em;text-transform:uppercase;color:var(--ashwood-muted)}
    .ashwood-capability-map__reset:hover,.ashwood-capability-map__reset:focus-visible{color:var(--ashwood-gold);font-style:italic}
    .ashwood-capability-map__list{display:grid;gap:0;margin:0;padding:0;list-style:none}
    .ashwood-capability-map__item{position:relative;display:grid;grid-template-columns:minmax(72px,.28fr) minmax(0,1fr);gap:5px 16px;padding:8px 0;border-bottom:1px solid color-mix(in srgb,var(--ashwood-rule) 60%,transparent)}
    .ashwood-capability-map__skill{font-size:8px;letter-spacing:.15em;text-transform:uppercase;color:var(--ashwood-gold)}
    .ashwood-capability-map__practice{font-size:9px;font-weight:500;letter-spacing:.055em;text-transform:uppercase;color:var(--ashwood-ink)}
    .ashwood-capability-map__note{grid-column:2;max-height:0;margin:0;overflow:hidden;opacity:0;color:var(--ashwood-muted);font-size:9px;line-height:1.4;transform:translateY(-2px);transition:max-height .28s ease,opacity .22s ease,transform .28s ease}
    .ashwood-capability-map__item:hover .ashwood-capability-map__note,.ashwood-capability-map__item:focus-within .ashwood-capability-map__note{max-height:42px;opacity:.82;transform:translateY(0)}
    .ashwood-capability-map__footer{display:flex;justify-content:flex-end;margin-top:10px}
    .ashwood-capability-map__link{font-size:8px;letter-spacing:.14em;text-transform:uppercase;text-decoration:none;color:var(--ashwood-muted)}
    .ashwood-capability-map__link:hover,.ashwood-capability-map__link:focus-visible{color:var(--ashwood-gold);font-style:italic}

    body.has-found-all-hotspots .ashwood-capability-map{opacity:1;visibility:visible;pointer-events:auto;transform:translateY(0);transition-delay:.3s}
    body.has-found-all-hotspots .ashwood-curiosity-progress{opacity:0}
    body.has-found-all-hotspots .principle-hotspot{opacity:0!important;pointer-events:none!important;transition:opacity .5s ease!important}
    body.has-found-all-hotspots .principles-field__hint{opacity:0!important}

    .ashwood-thread-flash{position:fixed;inset:0;z-index:77;display:grid;place-items:center;pointer-events:none;opacity:0;visibility:hidden;background:radial-gradient(circle at 68% 42%,rgba(214,194,74,.11) 0%,rgba(180,135,50,.035) 24%,transparent 55%)}
    .ashwood-thread-flash span{position:absolute;left:68%;top:42%;transform:translate(-50%,-50%);font-family:Georgia,serif;font-size:clamp(22px,2.6vw,38px);white-space:nowrap;color:var(--ashwood-ink)}
    .ashwood-thread-flash.is-active{visibility:visible;animation:ashwood-thread-resolve 1.9s ease both}
    @keyframes ashwood-thread-resolve{0%{opacity:0}24%{opacity:1}72%{opacity:.86}100%{opacity:0;visibility:hidden}}

    @media(max-width:760px){
      .ashwood-curiosity-progress{right:13px}
      .ashwood-capability-map{position:relative;right:auto;top:auto;z-index:72;width:100%;max-height:none;margin:30px 0 18px;padding:16px 0 0;transform:translateY(8px)}
      .ashwood-capability-map__header{grid-template-columns:1fr;gap:8px}
      .ashwood-capability-map__reset{grid-column:1;grid-row:auto;margin-top:4px;justify-self:start}
      .ashwood-capability-map__item{grid-template-columns:86px 1fr;padding:9px 0}
      .ashwood-capability-map__note{grid-column:2;max-height:none;opacity:.72;transform:none}
      body.has-found-all-hotspots .principles-field{min-height:0!important;height:auto!important}
      .ashwood-thread-flash span{left:50%;top:46%;font-size:clamp(20px,7vw,30px)}
    }
    @media(prefers-reduced-motion:reduce){.ashwood-capability-map,.principle-hotspot,.ashwood-capability-map__note{transition:none!important}.ashwood-thread-flash{display:none!important}}
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
  capabilityMap.setAttribute("aria-label", "ASHWOOD capability map");
  capabilityMap.innerHTML = `
    <div class="ashwood-capability-map__header">
      <p class="ashwood-capability-map__eyebrow">SIX / SIX · CAPABILITY MAP</p>
      <h2 class="ashwood-capability-map__title">Six signals, in practice.</h2>
      <button class="ashwood-capability-map__reset" type="button" aria-label="Reset the capability map and rediscover the six signals">↺ Reset field</button>
    </div>
    <ol class="ashwood-capability-map__list">
      ${ids.map((id) => {
        const item = practiceMap[id] || { skill: id.toUpperCase(), practice: "ASHWOOD", note: "A recurring capability across the practice." };
        return `<li class="ashwood-capability-map__item" data-capability="${id}">
          <span class="ashwood-capability-map__skill">${item.skill}</span>
          <strong class="ashwood-capability-map__practice">${item.practice}</strong>
          <p class="ashwood-capability-map__note">${item.note}</p>
        </li>`;
      }).join("")}
    </ol>
    <div class="ashwood-capability-map__footer">
      <a class="ashwood-capability-map__link" href="/dive-deeper?found=all-six">Dive deeper →</a>
    </div>`;
  const shell = document.querySelector(".shell") || document.body;
  shell.append(capabilityMap);

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
    const minimumUsableHeight = 210;
    let top = preferredTop;
    let available = nowRect.top - safetyGap - top;

    if (available < minimumUsableHeight) {
      top = Math.max(92, nowRect.top - safetyGap - minimumUsableHeight);
      available = nowRect.top - safetyGap - top;
    }

    capabilityMap.style.setProperty("--ashwood-capability-top", `${Math.round(top)}px`);
    capabilityMap.style.setProperty("--ashwood-capability-max-height", `${Math.max(170, Math.floor(available))}px`);
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
    fitCapabilityMap();
    document.body.classList.add("has-found-all-hotspots");
    requestAnimationFrame(fitCapabilityMap);
    if (!remembered) {
      flash.classList.remove("is-active");
      void flash.offsetWidth;
      flash.classList.add("is-active");
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
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...discovered])); } catch (_) {}
    updateProgress();
    if (discovered.size === hotspots.length) unlockReward(false);
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
  if (rememberedReward) unlockReward(true);
})();
