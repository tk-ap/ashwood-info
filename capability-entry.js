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
    .about-capability-entry{
      display:inline-flex;align-items:center;min-height:40px;margin:2px 0 18px;color:var(--ashwood-ink);
      font-size:9px;letter-spacing:.13em;text-transform:uppercase;text-decoration:none
    }
    .about-capability-entry:hover,.about-capability-entry:focus-visible{color:var(--ashwood-gold);font-style:italic}
    @media(max-width:760px){
      .ashwood-capability-evidence{width:100%;margin:8px 0 16px}
      .ashwood-capability-evidence a{min-height:44px;display:inline-flex;align-items:center}
      .ashwood-capability-nudge{position:absolute;right:18px;top:auto;margin-top:12px;max-width:130px}
      body.has-viewed-capability-map:not(.has-found-all-hotspots) .ashwood-capability-map{margin-top:26px}
    }
    @media(prefers-reduced-motion:reduce){.ashwood-capability-nudge{transition:none}}
  `;
  document.head.append(style);

  const map = () => document.querySelector(".ashwood-capability-map");
  const completedDiscovery = () => document.body.classList.contains("has-found-all-hotspots");

  const openDirectMap = ({ updateUrl = true } = {}) => {
    const capabilityMap = map();
    if (!capabilityMap) return false;
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
    if (capabilityMap) delete capabilityMap.dataset.entryMode;
    const url = new URL(window.location.href);
    url.searchParams.delete("capabilities");
    url.searchParams.delete("from");
    history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  };

  // Direct viewing is intentionally separate from hotspot completion. Intercept the
  // existing reset control so a context/evidence visitor cannot erase discovery progress.
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
      if (completedDiscovery()) {
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
