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
    signal: { skill: "SIGNAL", practice: "Ailhat · Portfolio Intelligence", note: "Finding the opportunity, risk, drift, or work that actually deserves attention." },
    friction: { skill: "FRICTION", practice: "ALVIRA · Context Experience", note: "Removing the unnecessary work between a person, their context, and useful intelligence." },
    translation: { skill: "TRANSLATION", practice: "Build Journal · Product Storytelling", note: "Turning complicated systems and evolving decisions into something another person can understand and act on." },
    systems: { skill: "SYSTEMS", practice: "Agent OS / Workforce · Ecosystem Infrastructure", note: "Designing the shared structure underneath products, agents, skills, handoffs, and governed execution." },
    resilience: { skill: "RESILIENCE", practice: "LEDGATo · Operational Reality", note: "Testing whether the interface survives contact with runtime constraints, enforcement, and real deployment." },
    range: { skill: "RANGE", practice: "ASHWOOD · Modeling + Music + Builds", note: "Using one point of view across different forms instead of forcing the practice into one lane." }
  };

  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(stored)) discovered = new Set(stored.filter((id) => ids.includes(id)));
  } catch (_) {}

  const style = document.createElement("style");
  style.textContent = `
    .ashwood-curiosity-progress{position:fixed;right:clamp(22px,3vw,48px);top:50%;z-index:73;display:flex;flex-direction:column;gap:7px;transform:translateY(-50%);pointer-events:none;opacity:.38;transition:opacity .28s ease}
    .ashwood-curiosity-progress span{display:block;width:3px;height:3px;border-radius:50%;background:var(--ashwood-muted);box-shadow:0 0 0 rgba(180,135,50,0);transition:background .28s ease,box-shadow .32s ease,transform .28s ease}
    .ashwood-curiosity-progress span.is-found{background:var(--ashwood-gold);box-shadow:0 0 9px rgba(214,194,74,.48);transform:scale(1.45)}

    .ashwood-capability-map{position:fixed;right:clamp(34px,5vw,84px);top:clamp(138px,19vh,210px);z-index:76;width:min(42vw,620px);max-height:68vh;overflow:auto;opacity:0;visibility:hidden;pointer-events:none;transform:translateY(12px);transition:opacity .65s ease,transform .65s cubic-bezier(.2,.8,.2,1),visibility 0s linear .65s;color:var(--ashwood-ink)}
    .ashwood-capability-map::before{content:"";position:absolute;left:9px;top:82px;bottom:64px;width:1px;background:linear-gradient(to bottom,transparent,var(--ashwood-rule) 10%,var(--ashwood-gold) 50%,var(--ashwood-rule) 90%,transparent);opacity:.72}
    .ashwood-capability-map__header{position:relative;padding-right:118px}
    .ashwood-capability-map__eyebrow{margin:0 0 8px;color:var(--ashwood-gold);font-size:9px;letter-spacing:.18em;text-transform:uppercase}
    .ashwood-capability-map__title{margin:0;font-family:Georgia,serif;font-size:clamp(27px,3.1vw,46px);font-weight:400;line-height:1.02;letter-spacing:-.03em}
    .ashwood-capability-map__intro{max-width:46ch;margin:10px 0 22px;color:var(--ashwood-muted);font-size:11px;line-height:1.55}
    .ashwood-capability-map__reset{position:absolute;right:0;top:0;border:0;padding:0;background:none;cursor:pointer;font-family:inherit;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--ashwood-muted)}
    .ashwood-capability-map__reset:hover,.ashwood-capability-map__reset:focus-visible{color:var(--ashwood-gold);font-style:italic}
    .ashwood-capability-map__list{display:grid;gap:0;margin:0;padding:0;list-style:none}
    .ashwood-capability-map__item{position:relative;display:grid;grid-template-columns:minmax(92px,.32fr) minmax(0,1fr);gap:14px 22px;padding:12px 0 13px 27px;border-top:1px solid color-mix(in srgb,var(--ashwood-rule) 78%,transparent)}
    .ashwood-capability-map__item::before{content:"";position:absolute;left:6px;top:17px;width:7px;height:7px;border-radius:50%;background:var(--ashwood-gold);box-shadow:0 0 12px rgba(214,194,74,.45)}
    .ashwood-capability-map__skill{font-size:9px;letter-spacing:.15em;text-transform:uppercase;color:var(--ashwood-gold)}
    .ashwood-capability-map__practice{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--ashwood-ink)}
    .ashwood-capability-map__note{grid-column:2;margin:-6px 0 0;color:var(--ashwood-muted);font-size:10px;line-height:1.45}
    .ashwood-capability-map__footer{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-top:17px;padding-top:13px;border-top:1px solid var(--ashwood-rule)}
    .ashwood-capability-map__link{font-size:9px;letter-spacing:.14em;text-transform:uppercase;text-decoration:none;color:var(--ashwood-muted)}
    .ashwood-capability-map__link:hover,.ashwood-capability-map__link:focus-visible{color:var(--ashwood-gold);font-style:italic}

    body.has-found-all-hotspots .ashwood-capability-map{opacity:1;visibility:visible;pointer-events:auto;transform:translateY(0);transition-delay:.42s}
    body.has-found-all-hotspots .ashwood-curiosity-progress{opacity:0}
    body.has-found-all-hotspots .principle-hotspot{opacity:0!important;pointer-events:none!important;transition:opacity .5s ease!important}
    body.has-found-all-hotspots .principles-field__hint{opacity:0!important}

    .ashwood-thread-flash{position:fixed;inset:0;z-index:77;display:grid;place-items:center;pointer-events:none;opacity:0;visibility:hidden;background:radial-gradient(circle at 68% 42%,rgba(214,194,74,.13) 0%,rgba(180,135,50,.045) 24%,transparent 55%)}
    .ashwood-thread-flash span{position:absolute;left:68%;top:42%;transform:translate(-50%,-50%);font-family:Georgia,serif;font-size:clamp(22px,2.6vw,38px);white-space:nowrap;color:var(--ashwood-ink)}
    .ashwood-thread-flash.is-active{visibility:visible;animation:ashwood-thread-resolve 1.9s ease both}
    @keyframes ashwood-thread-resolve{0%{opacity:0}24%{opacity:1}72%{opacity:.86}100%{opacity:0;visibility:hidden}}

    @media(max-width:760px){
      .ashwood-curiosity-progress{right:13px}
      .ashwood-capability-map{position:relative;right:auto;top:auto;z-index:72;width:100%;max-height:none;margin:34px 0 18px;padding:20px 0 0;transform:translateY(8px)}
      .ashwood-capability-map::before{left:7px;top:112px;bottom:54px}
      .ashwood-capability-map__header{padding-right:0}
      .ashwood-capability-map__reset{position:relative;right:auto;top:auto;margin:13px 0 4px}
      .ashwood-capability-map__item{grid-template-columns:1fr;padding-left:25px}
      .ashwood-capability-map__note{grid-column:1;margin:0}
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
      <p class="ashwood-capability-map__intro">Each discovered capability has a visible expression in the work—across products, systems, and creative practice.</p>
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

  const updateProgress = () => {
    progress.querySelectorAll("[data-hotspot-progress]").forEach((dot) => {
      dot.classList.toggle("is-found", discovered.has(dot.dataset.hotspotProgress));
    });
  };

  let rewardedThisVisit = false;
  const unlockReward = (remembered = false) => {
    if (rewardedThisVisit) return;
    rewardedThisVisit = true;
    document.body.classList.add("has-found-all-hotspots");
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

    // Use the page's native initialization path for reset. Reloading after clearing
    // completion state guarantees the original randomized placement, hover/proximity
    // reveal, click-to-pin, Escape dismissal, and mobile behavior all return exactly
    // as they do on a first visit, rather than approximating that engine here.
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

  updateProgress();
  hotspots.forEach((hotspot, index) => hotspot.classList.toggle("is-discovered", discovered.has(ids[index])));

  let rememberedReward = false;
  try { rememberedReward = localStorage.getItem(REWARD_KEY) === "1" && discovered.size === hotspots.length; } catch (_) {}
  if (rememberedReward) unlockReward(true);
})();
