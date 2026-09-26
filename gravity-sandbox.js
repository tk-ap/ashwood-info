(() => {
  const field = document.querySelector(".v3-field");
  const siteCosmos = document.querySelector("[data-site-cosmos]");
  const canvas = siteCosmos?.querySelector("[data-gravity-canvas]");
  const basePlate = siteCosmos?.querySelector(".ashwood-site-cosmos__plate--base");
  if (!field || !siteCosmos || !canvas || !basePlate ||
      typeof window.createAshwoodGravityRenderer !== "function") return;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const interactionGate = true; // V4.11: physical Instinct motion is active; Doc and hotspot orbit motion remain gated.
  const thinkingStage = document.querySelector("#thinking");
  // Public Doc is an optical anomaly, not a mascot or persistent assistant control.
  const docAnomaly = document.createElement("span");
  docAnomaly.className = "ashwood-doc-anomaly";
  docAnomaly.setAttribute("aria-hidden", "true");
  field.appendChild(docAnomaly);
  let anomalyTimer = 0;
  const glimpseDoc = () => {
    if (interactionGate || reduced || docAnomaly.classList.contains("is-glimpsed")) return;
    window.clearTimeout(anomalyTimer);
    docAnomaly.classList.add("is-glimpsed");
    anomalyTimer = window.setTimeout(() => docAnomaly.classList.remove("is-glimpsed"), 1150);
  };
  // The physical black hole (gravity-physical.js) is the default scene. It falls back
  // to the authored image scene where WebGL is missing or the GPU is a software
  // renderer. ?hole=image forces the image scene; ?hole=physical forces the physical
  // one even on a software renderer, for headless checks.
  const holeMode = new URLSearchParams(location.search).get("hole");
  const physicalCanvas = siteCosmos.querySelector("[data-physical-hole-canvas]");
  const physical = holeMode !== "image" && physicalCanvas &&
    typeof window.createAshwoodPhysicalHole === "function"
    ? window.createAshwoodPhysicalHole({
        canvas: physicalCanvas, reducedMotion: reduced, force: holeMode === "physical"
      })
    : null;
  const usePhysical = !!(physical && physical.supported);
  if (physicalCanvas && !usePhysical) physicalCanvas.remove();
  if (usePhysical) document.body.classList.add("ashwood-physical-hole");
  const renderer = usePhysical ? physical : window.createAshwoodGravityRenderer({
    canvas, imageElement: basePlate, reducedMotion: reduced
  });
  // Read-only diagnostics for browser tests; never credentials or private state.
  window.__ashwoodGravityRenderer = renderer;
  let fieldRect = field.getBoundingClientRect();
  let playing = false;
  const clamp = (v) => Math.max(0, Math.min(1, v));

  const heroStage = document.querySelector(".v3-hero");
  const evidenceStage = document.querySelector("#evidence");
  const depthStage = document.querySelector("#depth");

  // Smoothly overlap the hero approach and local Instinct encounter. The
  // persistent canvas never jumps between unrelated section-local coordinate systems.
  const getApproach = (rect, center, margin) => {
    if (!rect) return 0;
    if (center < rect.top) return clamp((center - rect.top + margin) / margin);
    if (center > rect.bottom) return clamp((rect.bottom + margin - center) / margin);
    return 1;
  };

  const setCamera = (progress, zone) => {
    if (!siteCosmos) return;
    const p = clamp(progress);
    const instinctPull = zone === "instinct" ? 1 : 0;
    const evidenceDrift = zone === "evidence" ? 1 : 0;
    const depthDrift = zone === "depth" ? 1 : 0;

    // V4.12: camera remains restrained; physical motion belongs to the Instinct renderer.
    const baseX = (-1.5 * p) + (evidenceDrift * -0.8) + (depthDrift * -1.5);
    const baseY = (-3 * p) + (instinctPull * 1.2) + (depthDrift * -1);
    const gravityX = (-2.8 * p) + (evidenceDrift * -1.2) + (depthDrift * -2);
    const gravityY = (-4.2 * p) + (instinctPull * 1.8) + (depthDrift * -1.4);
    const foregroundX = (-4.5 * p) + (evidenceDrift * -1.8) + (depthDrift * -2.8);
    const foregroundY = (-6 * p) + (instinctPull * 2.4) + (depthDrift * -1.8);

    const baseScale = zone === "instinct" ? 1.01 : zone === "hero" ? 1.025 : zone === "evidence" ? 1.018 : 1.02;
    const gravityScale = zone === "instinct" ? 1.014 : zone === "hero" ? 1.022 : 1.02;
    const foregroundScale = zone === "instinct" ? 1.022 : zone === "hero" ? 1.03 : 1.026;

    const root = document.documentElement.style;
    root.setProperty("--cosmos-base-x", `${baseX.toFixed(2)}px`);
    root.setProperty("--cosmos-base-y", `${baseY.toFixed(2)}px`);
    root.setProperty("--cosmos-gravity-x", `${gravityX.toFixed(2)}px`);
    root.setProperty("--cosmos-gravity-y", `${gravityY.toFixed(2)}px`);
    root.setProperty("--cosmos-foreground-x", `${foregroundX.toFixed(2)}px`);
    root.setProperty("--cosmos-foreground-y", `${foregroundY.toFixed(2)}px`);
    root.setProperty("--cosmos-base-scale", String(baseScale));
    root.setProperty("--cosmos-gravity-scale", String(gravityScale));
    root.setProperty("--cosmos-foreground-scale", String(foregroundScale));
  };

  let lastZone = null;
  const syncCosmosPhase = () => {
    if (!thinkingStage || !siteCosmos) return;
    const center = innerHeight * 0.5;
    const heroRect = heroStage?.getBoundingClientRect();
    const fieldRect = field.getBoundingClientRect();
    const thinkingRect = thinkingStage.getBoundingClientRect();
    const evidenceRect = evidenceStage?.getBoundingClientRect();
    const depthRect = depthStage?.getBoundingClientRect();
    let zone = "depth";
    let phase = "afterglow";
    if (heroRect && heroRect.bottom > center) {
      zone = "hero"; phase = "ambient";
    } else if (thinkingRect.top <= center && thinkingRect.bottom >= center) {
      zone = "instinct"; phase = "instinct";
    } else if (evidenceRect && evidenceRect.top <= center && evidenceRect.bottom >= center) {
      zone = "evidence"; phase = "afterglow";
    } else if (depthRect && depthRect.top > center) {
      zone = "evidence"; phase = "afterglow";
    }

    const margin = Math.min(340, innerHeight * 0.42);
    const heroStrength = heroRect && center <= heroRect.bottom
      ? clamp((heroRect.bottom + margin - center) / Math.max(margin, heroRect.height * 0.55))
      : 0;
    const instinctStrength = getApproach(fieldRect, center, margin);
    const sceneOpacity = reduced
      ? 0.14 * heroStrength + 0.72 * instinctStrength
      : 0.38 * heroStrength + 0.92 * instinctStrength;
    const motionStrength = reduced ? 0
      : clamp(0.54 * heroStrength + 0.90 * instinctStrength);
    document.body.style.setProperty("--gravity-scene-opacity",
      String(clamp(sceneOpacity).toFixed(3)));
    // The physical hole stays faintly present through the rest of the page, the way
    // the authored plate does, but only draws frames while it is in view and moving.
    document.body.style.setProperty("--physical-hole-opacity",
      String(clamp(Math.max(sceneOpacity, 0.24)).toFixed(3)));
    renderer.setZoneActive(motionStrength > 0.001 ? 1 : 0);
    renderer.setMotionStrength(motionStrength);

    document.body.dataset.cosmosPhase = phase;
    document.body.dataset.cosmosZone = zone;
    siteCosmos.dataset.phase = phase;
    siteCosmos.dataset.zone = zone;
    const maxScroll = Math.max(document.documentElement.scrollHeight - innerHeight, 1);
    setCamera(scrollY / maxScroll, zone);
    if (lastZone !== zone) {
      lastZone = zone;
      renderer.setChapter(zone);
    }
  };
  syncCosmosPhase();

  renderer.ready.then(({ mode, textureLoaded } = {}) => {
    document.body.dataset.gravityMode = mode || "unknown";
    document.body.dataset.gravityTexture = textureLoaded ? "ready" : "failed";
    document.body.classList.add("ashwood-gravity-active", "ashwood-gravity-ready");
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
    if (!interactionGate) field.querySelectorAll(".v3-hotspot").forEach((body, index) => {
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
    // Chapter updates live in the shared scene controller.
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

  // One read/write pass per animation frame, including Safari toolbar resize.
  let framePending = false;
  const syncFrame = () => {
    framePending = false;
    refreshRect();
    syncScroll();
    syncCosmosPhase();
    renderer.resize();
  };
  const scheduleFrame = () => {
    if (framePending) return;
    framePending = true;
    requestAnimationFrame(syncFrame);
  };
  window.addEventListener("resize", scheduleFrame, { passive:true });
  window.visualViewport?.addEventListener("resize", scheduleFrame, { passive:true });
  window.addEventListener("orientationchange", scheduleFrame, { passive:true });
  window.addEventListener("scroll", scheduleFrame, { passive:true });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) renderer.resume();
    scheduleFrame();
  });
  window.addEventListener("pagehide", (event) => {
    if (event.persisted) renderer.pause();
    else renderer.dispose();
  });
  scheduleFrame();
})();