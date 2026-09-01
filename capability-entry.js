(() => {
  const params = new URLSearchParams(window.location.search);
  const requestedDirectView = params.get("capabilities") === "1";
  const directEntrySelector = "[data-capability-entry]";

  const style = document.createElement("style");
  style.textContent = `
    body.has-viewed-capability-map:not(.has-found-all-hotspots) .ashwood-capability-map{
      opacity:1;visibility:visible;pointer-events:auto;filter:blur(0);transform:none;transition-delay:.08s
    }
    .ashwood-capability-evidence{
      position:relative;z-index:61;display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;width:min(62%,820px);margin:4px 0 10px;
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
      margin:5px 0 0;color:var(--ashwood-muted);font-size:9px;line-height:1.45;letter-spacing:.025em
    }
    .ashwood-capability-map__useful strong{
      display:inline;margin-right:5px;color:var(--ashwood-gold);font-size:7px;font-weight:600;letter-spacing:.13em;text-transform:uppercase
    }
    .ashwood-capability-map__practice[data-internal="true"]{color:#009b3a}
    .ashwood-capability-map__practice[data-internal="true"]::after{color:#009b3a}
    .ashwood-capability-map__practice[data-internal="true"]:hover,
    .ashwood-capability-map__practice[data-internal="true"]:focus-visible{color:var(--ashwood-gold)}
    .ashwood-capability-map__provenance{
      width:100%;margin:10px 0 0;padding-top:11px;border-top:1px solid color-mix(in srgb,var(--ashwood-rule) 54%,transparent);
      color:var(--ashwood-muted);font-size:9px;line-height:1.5;letter-spacing:.025em
    }
    .ashwood-capability-map__provenance strong{
      display:block;margin-bottom:5px;color:var(--ashwood-gold);font-size:7px;letter-spacing:.15em;text-transform:uppercase
    }
    .ashwood-capability-map__provenance a{
      display:inline-flex;align-items:center;min-height:36px;margin-top:3px;color:var(--ashwood-ink);font-size:8px;letter-spacing:.12em;text-transform:uppercase;text-decoration:none
    }
    .ashwood-capability-map__provenance a:hover,.ashwood-capability-map__provenance a:focus-visible{color:var(--ashwood-gold);font-style:italic}
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
      .ashwood-capability-map__provenance a{min-height:44px}
      .principle-hotspot__useful-for{max-width:220px;font-size:8px}
    }
    @media(prefers-reduced-motion:reduce){
      .ashwood-capability-nudge,.principle-hotspot__useful-for{transition:none}
    }
  `;
  document.head.append(style);

  const map = () => document.querySelector(".ashwood-capability-map");
  const completedDiscovery = () => document.body.classList.contains("has-found-all-hotspots");

  const mountMapInDiscoveryField = () => {
    const field = document.querySelector(".principles-field");
    const capabilityMap = map();
    if (!field || !capabilityMap) return false;
    if (capabilityMap.parentElement !== field) field.append(capabilityMap);
    capabilityMap.dataset.v2Mounted = "discovery-field";
    return true;
  };

  // Keep internal ids stable so prior discovery state and layout coordinates survive.
  // Public labels express the synthesis without turning the map into a testimonial surface.
  const capabilitySynthesis = {
    signal: {
      label: "SIGNAL",
      summary: "I notice what is starting to matter.",
      useful: "Priorities are unclear and weak signals need separating from noise.",
      cue: "priority · risk · weak signals"
    },
    friction: {
      label: "FRICTION",
      summary: "I look for where intention and reality stop matching.",
      useful: "The same workaround keeps appearing, or the experience is fighting its intent.",
      cue: "workarounds · drag · mismatch"
    },
    translation: {
      label: "TRANSLATION",
      summary: "I turn difficult ideas into forms people can use.",
      useful: "Complex work needs to become clear enough for different people to act.",
      cue: "complexity · clarity · action"
    },
    systems: {
      label: "SYSTEMS",
      summary: "I look for the structure underneath the thing.",
      useful: "A recurring problem needs durable structure rather than another patch.",
      cue: "recurrence · structure · dependencies"
    },
    resilience: {
      label: "ADAPTATION",
      summary: "I let evidence change the approach.",
      useful: "Reality changes the conditions and the approach needs to change with it.",
      cue: "change · evidence · iteration"
    },
    range: {
      label: "SYNTHESIS",
      summary: "I bring separate things into one coherent idea.",
      useful: "The opportunity sits between disciplines, ideas, or mediums.",
      cue: "disciplines · connections · coherence"
    }
  };

  const practiceOverrides = {
    friction: {
      label: "ALVIRA · Context Intelligence",
      href: "https://alviratech.vercel.app/",
      external: true
    },
    translation: {
      label: "BUILD JOURNAL · Field Notes + public proof",
      href: "/journal/",
      external: false
    },
    systems: {
      label: "Builds · Governed execution systems",
      href: "/journal/",
      external: false
    },
    resilience: {
      label: "LEDGATo · Operational reality",
      href: "https://ledgato.vercel.app/",
      external: true
    },
    range: {
      label: "ASHWOOD · Modeling + Music + Builds",
      href: "/about/",
      external: false
    }
  };

  const refreshProvenanceLanguage = () => {
    const evidence = document.querySelector(".ashwood-capability-evidence span");
    if (evidence) evidence.textContent = "Patterns observed across projects, roles, and collaboration.";

    const capabilityMap = map();
    if (!capabilityMap) return;
    capabilityMap.setAttribute("aria-label", "ASHWOOD capabilities map");

    const eyebrow = capabilityMap.querySelector(".ashwood-capability-map__eyebrow");
    if (eyebrow) eyebrow.textContent = "SIX / SIX · CAPABILITIES";

    const title = capabilityMap.querySelector(".ashwood-capability-map__title");
    if (title) title.textContent = "Patterns across the work.";

    const sourceLine = capabilityMap.querySelector(".ashwood-capability-map__authorship-key");
    if (sourceLine) sourceLine.textContent = "Recurring themes across projects, roles, and collaboration. The work below is where they become visible.";
  };

  const refreshHotspotLanguage = () => {
    document.querySelectorAll(".principle-hotspot").forEach((hotspot) => {
      const idClass = [...hotspot.classList].find((name) => name.startsWith("principle-hotspot--"));
      const id = idClass?.replace("principle-hotspot--", "");
      const synthesis = capabilitySynthesis[id];
      if (!synthesis) return;

      const label = hotspot.querySelector(".principle-hotspot__label");
      const quote = hotspot.querySelector(".principle-hotspot__quote");
      const useful = hotspot.querySelector(".principle-hotspot__useful");
      if (label) label.textContent = synthesis.label;
      if (quote) quote.textContent = synthesis.summary;
      if (useful) useful.innerHTML = `<strong>Useful when</strong> ${synthesis.useful}`;
      hotspot.setAttribute("aria-label", `${synthesis.label}. ${synthesis.summary} Useful when ${synthesis.useful}`);
    });
  };

  const applyCapabilitySynthesis = () => {
    const capabilityMap = map();
    if (!capabilityMap) return;
    refreshProvenanceLanguage();
    capabilityMap.querySelectorAll("[data-capability]").forEach((row) => {
      const id = row.dataset.capability;
      const synthesis = capabilitySynthesis[id];
      if (!synthesis) return;

      const skill = row.querySelector(".ashwood-capability-map__skill");
      if (skill) skill.textContent = synthesis.label;

      const description = row.querySelector(".ashwood-capability-map__description");
      if (description) description.textContent = synthesis.summary;

      let useful = row.querySelector(".ashwood-capability-map__useful");
      if (!useful) {
        useful = document.createElement("p");
        useful.className = "ashwood-capability-map__useful";
        row.querySelector(".ashwood-capability-map__authorship")?.before(useful);
      }
      useful.innerHTML = `<strong>Useful when →</strong>${synthesis.useful}`;

      const override = practiceOverrides[id];
      if (!override) return;
      const practice = row.querySelector(".ashwood-capability-map__practice");
      if (!practice) return;
      practice.textContent = override.label;
      practice.href = override.href;
      practice.dataset.internal = String(!override.external);
      if (override.external) {
        practice.target = "_blank";
        practice.rel = "noreferrer";
      } else {
        practice.removeAttribute("target");
        practice.removeAttribute("rel");
      }
    });
  };

  const installProvenanceBridge = () => {
    const capabilityMap = map();
    const footer = capabilityMap?.querySelector(".ashwood-capability-map__footer");
    if (!footer) return;
    let provenance = footer.querySelector(".ashwood-capability-map__provenance");
    if (!provenance) {
      provenance = document.createElement("div");
      provenance.className = "ashwood-capability-map__provenance";
      footer.append(provenance);
    }
    provenance.innerHTML = `
      <strong>FOLLOW THE THREAD</strong>
      See where these patterns become visible across builds, decisions, and field notes.
      <br /><a href="/journal/">Trace the work →</a>`;
  };

  const installCurrentLanguage = () => {
    const label = document.querySelector(".home-now__label");
    if (!label) return;
    const original = label.textContent.trim();
    if (/^CURRENT\s*\/\s*SITREP/i.test(original)) return;
    const datePart = original.includes("/") ? original.split("/").slice(1).join("/").trim() : original.replace(/^NOW\s*/i, "").trim();
    label.textContent = datePart ? `CURRENT / SITREP · ${datePart}` : "CURRENT / SITREP";
  };

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

  const prepareMap = () => {
    mountMapInDiscoveryField();
    refreshHotspotLanguage();
    refreshProvenanceLanguage();
    applyCapabilitySynthesis();
    installProvenanceBridge();
    return Boolean(map());
  };

  prepareMap();
  installCurrentLanguage();
  installHotspotApplicationCues();

  let entranceTrigger = null;
  const openDirectMap = ({ updateUrl = true, entrance = false, trigger = null } = {}) => {
    if (!prepareMap() && !map()) return false;
    const capabilityMap = map();
    document.body.classList.add("has-viewed-capability-map");
    document.body.classList.toggle("is-capability-entrance", entrance);
    entranceTrigger = entrance ? trigger : null;
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
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      capabilityMap.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      capabilityMap.querySelector("a,button")?.focus({ preventScroll: true });
    });
    return true;
  };

  const closeDirectMap = () => {
    if (completedDiscovery()) return;
    document.body.classList.remove("has-viewed-capability-map", "is-capability-entrance");
    const capabilityMap = map();
    if (capabilityMap) {
      delete capabilityMap.dataset.entryMode;
      const reset = capabilityMap.querySelector(".ashwood-capability-map__reset");
      if (reset) {
        reset.textContent = "↺ Reset field";
        reset.setAttribute("aria-label", "Reset the capability map and rediscover the six signals");
      }
    }
    const url = new URL(window.location.href);
    url.searchParams.delete("capabilities");
    url.searchParams.delete("from");
    history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    entranceTrigger?.focus({ preventScroll: true });
    entranceTrigger = null;
  };

  document.addEventListener("ashwood:open-capability-map", (event) => {
    const detail = event.detail || {};
    openDirectMap({ updateUrl: true, entrance: Boolean(detail.entrance), trigger: detail.trigger || null });
  });

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
    openDirectMap({ trigger: entry });
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
    new MutationObserver(() => {
      prepareMap();
      update();
    }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
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