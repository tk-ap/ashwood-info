(() => {
  const params = new URLSearchParams(window.location.search);
  const requestedDirectView = params.get("capabilities") === "1";
  const directEntrySelector = "[data-capability-entry]";

  const style = document.createElement("style");
  style.textContent = `
    body.has-viewed-capability-map:not(.has-found-all-hotspots) .ashwood-capability-map{
      opacity:1;visibility:visible;pointer-events:auto;filter:blur(0);transform:translateY(0) scale(1);transition-delay:.08s
    }
    .ashwood-capability-evidence{
      position:relative;z-index:181;display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;width:min(62%,820px);margin:4px 0 10px;
      color:var(--ashwood-muted);font-size:8px;line-height:1.45;letter-spacing:.055em
    }
    .ashwood-capability-evidence a{
      color:var(--ashwood-ink);font-size:8px;letter-spacing:.13em;text-transform:uppercase;text-decoration:none
    }
    .ashwood-capability-evidence a:hover,.ashwood-capability-evidence a:focus-visible{color:var(--ashwood-gold);font-style:italic}
    .ashwood-capability-nudge{
      position:fixed;right:clamp(34px,5vw,84px);top:calc(50% + 54px);z-index:72;max-width:150px;margin:0;
      color:var(--ashwood-muted);font-family:Georgia,serif;font-size:9px;line-height:1.35;font-style:italic;
      opacity:0;transform:translateY(4px);transition:opacity .45s ease,transform .45s ease;pointer-events:none
    }
    .ashwood-capability-nudge.is-visible{opacity:.7;transform:translateY(0)}
    .ashwood-capability-map__useful{
      grid-column:2;margin:2px 0 3px;color:var(--ashwood-muted);font-size:8px;line-height:1.38;letter-spacing:.025em
    }
    .ashwood-capability-map__useful strong{
      display:inline;margin-right:5px;color:var(--ashwood-gold);font-size:7px;font-weight:600;letter-spacing:.13em;text-transform:uppercase
    }
    .ashwood-capability-map__practice[data-internal="true"]{color:#009b3a}
    .ashwood-capability-map__practice[data-internal="true"]::after{color:#009b3a}
    .ashwood-capability-map__practice[data-internal="true"]:hover,
    .ashwood-capability-map__practice[data-internal="true"]:focus-visible{color:var(--ashwood-gold)}
    .ashwood-capability-map__practice[data-internal="true"]:hover::after,
    .ashwood-capability-map__practice[data-internal="true"]:focus-visible::after{color:var(--ashwood-gold)}
    .principle-hotspot__useful-for{
      display:block;max-width:290px;margin-top:8px;color:var(--ashwood-muted);font-size:8px;line-height:1.35;
      letter-spacing:.065em;opacity:0;transform:translateY(7px);filter:blur(2px);pointer-events:none;
      transition:opacity .34s ease .18s,transform .38s cubic-bezier(.2,.8,.2,1) .18s,filter .3s ease .18s
    }
    .principle-hotspot__useful-for strong{
      margin-right:5px;color:#009b3a;font-size:7px;font-weight:700;letter-spacing:.14em;text-transform:uppercase
    }
    body.ashwood-home-native .principle-hotspot.is-near:not(.is-revealed) .principle-hotspot__useful-for,
    body.ashwood-home-native .principle-hotspot:focus-visible:not(.is-revealed) .principle-hotspot__useful-for{
      opacity:.82;transform:translateY(0);filter:blur(0)
    }
    body.ashwood-home-native .principle-hotspot.is-revealed .principle-hotspot__useful-for{display:none}
    @media(max-width:760px){
      .ashwood-capability-evidence{width:100%;margin:8px 0 16px}
      .ashwood-capability-evidence a{min-height:44px;display:inline-flex;align-items:center}
      .ashwood-capability-nudge{position:absolute;right:18px;top:auto;margin-top:12px;max-width:130px}
      .ashwood-capability-map__useful{grid-column:2}
      .principle-hotspot__useful-for{max-width:220px;font-size:8px}
      body.has-viewed-capability-map:not(.has-found-all-hotspots) .ashwood-capability-map{margin-top:26px}
    }
    @media(prefers-reduced-motion:reduce){
      .ashwood-capability-nudge,.principle-hotspot__useful-for{transition:none}
    }
  `;
  document.head.append(style);

  const map = () => document.querySelector(".ashwood-capability-map");
  const completedDiscovery = () => document.body.classList.contains("has-found-all-hotspots");

  // Hotspots are the first-person, situational discovery layer. The capability map is
  // the synthesis layer: same underlying evidence, elevated into concise professional
  // language rather than repeating the discovery copy verbatim.
  const capabilitySynthesis = {
    signal: {
      summary: "Strategic judgment that clarifies priorities, anticipates risk, and sharpens the next decision.",
      useful: "High-stakes prioritization, early risk detection, and decisions under noise.",
      cue: "prioritization · risk · ambiguity"
    },
    friction: {
      summary: "Process-improvement instinct that spots avoidable drag and challenges assumptions before they calcify.",
      useful: "Stalled processes, recurring workarounds, or preventable operational friction.",
      cue: "process drag · workarounds · recurring friction"
    },
    translation: {
      summary: "Communication that turns complexity into shared understanding across technical, operational, and executive audiences.",
      useful: "Complex work needs to become clear enough for different audiences to act.",
      cue: "complexity · alignment · decision clarity"
    },
    systems: {
      summary: "Systems thinking that converts recurring problems into durable structures, controls, and repeatable ways of working.",
      useful: "A recurring problem needs durable structure instead of another patch.",
      cue: "recurrence · controls · durable structure"
    },
    resilience: {
      summary: "Reliable adaptation: learning quickly, maintaining rigor, and executing well as conditions change.",
      useful: "Conditions are changing, stakes remain high, and execution still has to hold.",
      cue: "change · handoffs · high-stakes execution"
    },
    range: {
      summary: "Cross-functional influence that connects disciplines, levels, and perspectives without losing trust or momentum.",
      useful: "The work crosses functions, disciplines, or levels and needs someone to connect them.",
      cue: "cross-functional work · ambiguity · coordination"
    }
  };

  const applyCapabilitySynthesis = () => {
    const capabilityMap = map();
    if (!capabilityMap) return;
    capabilityMap.querySelectorAll("[data-capability]").forEach((row) => {
      const synthesis = capabilitySynthesis[row.dataset.capability];
      if (!synthesis) return;

      const description = row.querySelector(".ashwood-capability-map__description");
      if (description) description.textContent = synthesis.summary;

      let useful = row.querySelector(".ashwood-capability-map__useful");
      if (!useful) {
        useful = document.createElement("p");
        useful.className = "ashwood-capability-map__useful";
        row.querySelector(".ashwood-capability-map__authorship")?.before(useful);
      }
      useful.innerHTML = `<strong>Useful when →</strong>${synthesis.useful}`;
    });
  };

  // Essential value should be discoverable before click. Proximity/focus gets a concise
  // application cue; click/tap still earns the richer first-person "Useful when" sentence.
  const installHotspotApplicationCues = () => {
    document.querySelectorAll(".principle-hotspot").forEach((hotspot) => {
      if (hotspot.querySelector(".principle-hotspot__useful-for")) return;
      const idClass = [...hotspot.classList].find((name) => name.startsWith("principle-hotspot--"));
      const id = idClass?.replace("principle-hotspot--", "");
      const synthesis = capabilitySynthesis[id];
      const quote = hotspot.querySelector(".principle-hotspot__quote");
      if (!synthesis?.cue || !quote) return;
      const cue = document.createElement("span");
      cue.className = "principle-hotspot__useful-for";
      cue.setAttribute("aria-hidden", "true");
      cue.innerHTML = `<strong>Useful for →</strong>${synthesis.cue}`;
      quote.after(cue);
    });
  };

  applyCapabilitySynthesis();
  installHotspotApplicationCues();

  const openDirectMap = ({ updateUrl = true } = {}) => {
    const capabilityMap = map();
    if (!capabilityMap) return false;
    applyCapabilitySynthesis();
    document.body.classList.add("has-viewed-capability-map");
    capabilityMap.dataset.entryMode = "direct";

    const reset = capabilityMap.querySelector(".ashwood-capability-map__reset");
    if (reset && !completedDiscovery()) {
      reset.textContent = "Close map";
      reset.setAttribute("aria-label", "Close the capability map and return to discovery");
    }

    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set("capabilities", "1");
      history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }

    requestAnimationFrame(() => {
      if (window.matchMedia("(max-width: 760px)").matches) {
        capabilityMap.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      } else {
        capabilityMap.querySelector("a,button")?.focus({ preventScroll: true });
      }
    });
    return true;
  };

  const closeDirectMap = () => {
    if (completedDiscovery()) return;
    document.body.classList.remove("has-viewed-capability-map");
    const capabilityMap = map();
    if (capabilityMap) {
      delete capabilityMap.dataset.entryMode;
      const reset = capabilityMap.querySelector(".ashwood-capability-map__reset");
      if (reset) {
        reset.textContent = "↺ Reset field";
        reset.setAttribute("aria-label", "Reset the observed strengths map and rediscover the six signals");
      }
    }
    const url = new URL(window.location.href);
    url.searchParams.delete("capabilities");
    url.searchParams.delete("from");
    history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  };

  document.addEventListener("click", (event) => {
    const reset = event.target.closest(".ashwood-capability-map__reset");
    if (!reset || completedDiscovery() || !document.body.classList.contains("has-viewed-capability-map")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    closeDirectMap();
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("has-viewed-capability-map") && !completedDiscovery()) closeDirectMap();
  });

  document.addEventListener("click", (event) => {
    const entry = event.target.closest(directEntrySelector);
    if (!entry) return;
    const onHome = (window.location.pathname.replace(/\/$/, "") || "/") === "/";
    if (!onHome || !map()) return;
    event.preventDefault();
    openDirectMap();
  });

  const installProgressiveRecognition = () => {
    const progress = document.querySelector(".ashwood-curiosity-progress");
    if (!progress) return;
    const nudge = document.createElement("p");
    nudge.className = "ashwood-capability-nudge";
    nudge.setAttribute("aria-hidden", "true");
    document.body.append(nudge);

    const update = () => {
      if (completedDiscovery() || document.body.classList.contains("has-viewed-capability-map")) {
        nudge.classList.remove("is-visible");
        return;
      }
      const count = progress.querySelectorAll(".is-found").length;
      let text = "";
      if (count >= 5) text = "One more thread.";
      else if (count >= 4) text = "There’s a pattern here.";
      else if (count >= 2) text = "These are connected.";
      nudge.textContent = text;
      nudge.classList.toggle("is-visible", Boolean(text));
    };

    new MutationObserver(update).observe(progress, { subtree: true, attributes: true, attributeFilter: ["class"] });
    new MutationObserver(update).observe(document.body, { attributes: true, attributeFilter: ["class"] });
    update();
  };

  installProgressiveRecognition();

  if (requestedDirectView) {
    let attempts = 0;
    const revealWhenReady = () => {
      attempts += 1;
      if (openDirectMap({ updateUrl: false }) || attempts > 24) return;
      requestAnimationFrame(revealWhenReady);
    };
    requestAnimationFrame(revealWhenReady);
  }
})();