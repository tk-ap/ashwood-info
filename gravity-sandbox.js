(() => {
  const field = document.querySelector(".v3-field");
  const canvas = field?.querySelector("[data-gravity-canvas]");
  if (!field || !canvas || typeof window.createAshwoodGravityRenderer !== "function") return;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const stillFrameGate = true; // V4.8: global authored environment must pass before local motion resumes.
  const thinkingStage = document.querySelector("#thinking");
  const siteCosmos = document.querySelector("[data-site-cosmos]");

  // Public Doc is an optical anomaly, not a mascot or persistent assistant control.
  const docAnomaly = document.createElement("span");
  docAnomaly.className = "ashwood-doc-anomaly";
  docAnomaly.setAttribute("aria-hidden", "true");
  field.appendChild(docAnomaly);
  let anomalyTimer = 0;
  const glimpseDoc = () => {
    if (stillFrameGate || reduced || docAnomaly.classList.contains("is-glimpsed")) return;
    window.clearTimeout(anomalyTimer);
    docAnomaly.classList.add("is-glimpsed");
    anomalyTimer = window.setTimeout(() => docAnomaly.classList.remove("is-glimpsed"), 1150);
  };
  const renderer = window.createAshwoodGravityRenderer({ canvas, reducedMotion: reduced });
  let fieldRect = field.getBoundingClientRect();
  let playing = false;
  const clamp = (v) => Math.max(0, Math.min(1, v));

  const syncCosmosPhase = () => {
    if (!thinkingStage || !siteCosmos) return;
    const rect = thinkingStage.getBoundingClientRect();
    let phase = "ambient";
    if (rect.bottom <= innerHeight * 0.12) phase = "afterglow";
    else if (rect.top <= innerHeight * 0.72 && rect.bottom >= innerHeight * 0.22) phase = "instinct";
    document.body.dataset.cosmosPhase = phase;
    siteCosmos.dataset.phase = phase;
  };
  syncCosmosPhase();

  renderer.ready.then(({ mode } = {}) => {
    document.body.classList.add("ashwood-gravity-active", "ashwood-gravity-ready");
    document.body.dataset.gravityMode = mode || "unknown";
    field.dataset.gravityReady = "true";
  }).catch(() => document.body.classList.add("ashwood-gravity-fallback"));

  const refreshRect = () => { fieldRect = field.getBoundingClientRect(); };
  const onPointer = (event) => {
    const x = clamp((event.clientX - fieldRect.left) / Math.max(fieldRect.width, 1));
    const y = clamp((event.clientY - fieldRect.top) / Math.max(fieldRect.height, 1));
    renderer.setPointer({ x, y, active: 1 });
    if (Math.abs(x - 0.5) + Math.abs(y - 0.5) > 0.52) glimpseDoc();
    field.style.setProperty("--gravity-pointer-x", `${x * 100}%`);
    field.style.setProperty("--gravity-pointer-y", `${y * 100}%`);
    // V4.6 still-frame gate: preserve future depth behavior without moving the authored composition yet.
    if (!stillFrameGate) field.querySelectorAll(".v3-hotspot").forEach((body, index) => {
      const depth = [0.45, 0.72, 0.55, 0.82, 0.38, 0.64][index] || 0.5;
      const dx = (x - 0.5) * -18 * depth;
      const dy = (y - 0.5) * -12 * depth;
      body.style.setProperty("--orbit-x", `${dx.toFixed(2)}px`);
      body.style.setProperty("--orbit-y", `${dy.toFixed(2)}px`);
    });
  };
  const onLeave = () => {
    renderer.setPointer({ x: 0.5, y: 0.5, active: 0 });
    field.querySelectorAll(".v3-hotspot").forEach((body) => {
      body.style.setProperty("--orbit-x", "0px");
      body.style.setProperty("--orbit-y", "0px");
    });
  };

  if (!reduced && matchMedia("(hover:hover) and (pointer:fine)").matches) {
    field.addEventListener("pointermove", onPointer, { passive: true });
    field.addEventListener("pointerleave", onLeave, { passive: true });
  }

  const syncScroll = () => {
    const rect = field.getBoundingClientRect();
    const approach = clamp((innerHeight - rect.top) / Math.max(innerHeight + rect.height, 1));
    renderer.setScroll(approach);
    renderer.setChapter("instinct");
  };

  const readDiscovery = () => {
    try {
      const value = JSON.parse(localStorage.getItem("ashwood.v3.discovery") || "[]");
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  };
  const syncDiscovery = () => {
    const found = readDiscovery();
    renderer.setDiscovery(found);
    field.dataset.discoveryCount = String(found.length);
    if (found.length === 2 || found.length === 5) glimpseDoc();
  };

  syncDiscovery();
  document.querySelectorAll(".v3-hotspot").forEach((node) => {
    node.addEventListener("click", () => requestAnimationFrame(syncDiscovery));
  });

  const syncAudio = () => {
    renderer.setAudioEnergy(playing ? 1 : 0);
    field.classList.toggle("is-audio-energized", playing);
  };
  const bindAudio = (player) => {
    if (!player || player.dataset.gravityBound) return;
    player.dataset.gravityBound = "true";
    const sync = () => {
      playing = player.classList.contains("is-playing");
      syncAudio();
    };
    new MutationObserver(sync).observe(player, { attributes: true, attributeFilter: ["class"] });
    sync();
  };

  const existingAudio = document.querySelector(".ashwood-audio");
  if (existingAudio) bindAudio(existingAudio);
  else {
    const observer = new MutationObserver(() => {
      const player = document.querySelector(".ashwood-audio");
      if (!player) return;
      bindAudio(player);
      observer.disconnect();
    });
    observer.observe(document.body, { childList: true });
  }

  const onResize = () => {
    refreshRect();
    renderer.resize();
    syncScroll();
    syncCosmosPhase();
  };
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("scroll", () => {
    syncScroll();
    syncCosmosPhase();
  }, { passive: true });
  syncScroll();
  syncCosmosPhase();

  window.addEventListener("pagehide", () => renderer.dispose(), { once: true });
})();