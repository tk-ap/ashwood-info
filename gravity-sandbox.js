(() => {
  const field = document.querySelector(".v3-field");
  const canvas = field?.querySelector("[data-gravity-canvas]");
  if (!field || !canvas || typeof window.createAshwoodGravityRenderer !== "function") return;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = window.createAshwoodGravityRenderer({ canvas, reducedMotion: reduced });
  let fieldRect = field.getBoundingClientRect();
  let playing = false;
  const clamp = (v) => Math.max(0, Math.min(1, v));

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
    field.style.setProperty("--gravity-pointer-x", `${x * 100}%`);
    field.style.setProperty("--gravity-pointer-y", `${y * 100}%`);
    // Bodies move at different depths; the black hole remains visually anchored.
    field.querySelectorAll(".v3-hotspot").forEach((body, index) => {
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
  };
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("scroll", syncScroll, { passive: true });
  syncScroll();

  window.addEventListener("pagehide", () => renderer.dispose(), { once: true });
})();