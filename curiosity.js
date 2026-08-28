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
      description: "I prioritize what matters most, anticipate risks, and help leaders move faster with better information.",
      authorship: "FROM IDEA → BUILD",
      practice: "ailhat · Portfolio Intelligence",
      href: "https://ailhat.vercel.app/",
      external: true
    },
    friction: {
      skill: "FRICTION",
      description: "I notice the small things that make a process harder than it needs to be — then I usually can't leave them alone.",
      authorship: "FROM IDEA → BUILD",
      practice: "ALVIRA · Context Experience",
      href: "https://alviratech.vercel.app/",
      external: true
    },
    translation: {
      skill: "TRANSLATION",
      description: "I turn complexity into something people can actually understand, decide from, and act on.",
      authorship: "FROM IDEA → BUILD",
      practice: "Build Journal · Product Storytelling",
      href: "/journal/",
      external: false
    },
    systems: {
      skill: "SYSTEMS",
      description: "I look for the structure underneath the problem. Fixing the symptom is rarely interesting enough.",
      authorship: "FROM IDEA → INFRASTRUCTURE",
      practice: "Agent OS / Workforce · Infrastructure",
      href: "/journal/",
      external: false
    },
    resilience: {
      skill: "RESILIENCE",
      description: "I think about what happens when the plan meets reality — because that's where the interesting problems usually begin.",
      authorship: "FROM IDEA → BUILD",
      practice: "LEDGATo · Operational Reality",
      href: "https://ledgato.vercel.app/",
      external: true
    },
    range: {
      skill: "RANGE",
      description: "I don't fit neatly into one lane. That's less a branding problem than a useful advantage.",
      authorship: "CREATIVE PRACTICE →",
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
    .ashwood-capability-map__authorship-key{grid-column:1;margin:1px 0 0;color:var(--ashwood-muted);font-size:8px;line-height:1.35;letter-spacing:.055em}
    .ashwood-capability-map__reset{grid-column:2;grid-row:1 / span 3;align-self:start;border:0;padding:0;background:none;cursor:pointer;font-family:inherit;font-size:8px;letter-spacing:.13em;text-transform:uppercase;color:var(--ashwood-muted)}
    .ashwood-capability-map__reset:hover,.ashwood-capability-map__reset:focus-visible{color:var(--ashwood-gold);font-style:italic}
    .ashwood-capability-map__list{display:grid;gap:0;margin:0;padding:0;list-style:none}
    .ashwood-capability-map__item{position:relative;display:grid;grid-template-columns:minmax(72px,.25fr) minmax(0,1fr);gap:4px 15px;padding:8px 0 9px;border-bottom:1px solid color-mix(in srgb,var(--ashwood-rule) 60%,transparent)}
    .ashwood-capability-map__skill{font-size:8px;letter-spacing:.15em;text-transform:uppercase;color:var(--ashwood-gold)}
    .ashwood-capability-map__authorship{grid-column:2;display:block;margin:0;color:var(--ashwood-gold);font-size:7px;line-height:1.2;letter-spacing:.14em;text-transform:uppercase;opacity:.78}
    .ashwood-capability-map__practice{grid-column:2;display:inline-flex;align-items:center;gap:6px;width:max-content;max-width:100%;font-size:9px;font-weight:500;letter-spacing:.055em;color:var(--ashwood-ink);text-decoration:none}
    .ashwood-capability-map__practice::after{content:"↗";font-size:8px;color:var(--ashwood-muted);transition:transform .2s ease,color .2s ease}
    .ashwood-capability-map__practice[data-internal="true"]::after{content:"→"}
    .ashwood-capability-map__practice:hover,.ashwood-capability-map__practice:focus-visible{color:var(--ashwood-gold);font-style:italic}
    .ashwood-capability-map__practice:hover::after,.ashwood-capability-map__practice:focus-visible::after{color:var(--ashwood-gold);transform:translateX(2px)}
    .ashwood-capability-map__description{grid-column:2;margin:0;color:var(--ashwood-muted);font-size:9px;line-height:1.38;opacity:.74}
    .ashwood-capability-map__footer{display:flex;justify-content:flex-end;margin-top:10px}
    .ashwood-capability-map__link{font-size:8px;letter-spacing:.14em;text-transform:uppercase;text-decoration:none;color:var(--ashwood-muted)}
    .ashwood-capability-map__link:hover,.ashwood-capability-map__link:focus-visible{color:var(--ashwood-gold);font-style:italic}

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
      .ashwood-capability-map__reset{grid-column:1;grid-row:auto;margin-top:4px;justify-self:start}
      .ashwood-capability-map__item{grid-template-columns:82px 1fr;padding:9px 0 10px}
      .ashwood-capability-map__authorship,.ashwood-capability-map__practice,.ashwood-capability-map__description{grid-column:2}
      body.has-found-all-hotspots .principles-field{min-height:0!important;height:auto!important}
      .ashwood-thread-flash span{left:50%;top:46%;font-size:clamp(20px,7vw,30px)}
    }
    @media(prefers-reduced-motion:reduce){.ashwood-capability-map,.principle-hotspot{transition:none!important}.ashwood-thread-flash{display:none!important}}
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
      <p class="ashwood-capability-map__authorship-key">The product expressions below began as ideas I originated and then started building; creative-practice rows are labeled separately.</p>
      <button class="ashwood-capability-map__reset" type="button" aria-label="Reset the capability map and rediscover the six signals">↺ Reset field</button>
    </div>
    <ol class="ashwood-capability-map__list">
      ${ids.map((id) => {
        const item = practiceMap[id] || {
          skill: id.toUpperCase(),
          description: "A recurring capability across the practice.",
          authorship: "CREATIVE PRACTICE →",
          practice: "ASHWOOD",
          href: "/about/",
          external: false
        };
        const targetAttrs = item.external ? ' target="_blank" rel="noreferrer"' : '';
        return `<li class="ashwood-capability-map__item" data-capability="${id}">
          <span class="ashwood-capability-map__skill">${item.skill}</span>
          <span class="ashwood-capability-map__authorship">${item.authorship}</span>
          <a class="ashwood-capability-map__practice" href="${item.href}" data-internal="${item.external ? "false" : "true"}"${targetAttrs}>${item.practice}</a>
          <p class="ashwood-capability-map__description">${item.description}</p>
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
