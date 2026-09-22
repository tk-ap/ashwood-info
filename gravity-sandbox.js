(() => {
  const hero = document.querySelector(".v3-hero");
  const canvas = document.querySelector("[data-gravity-canvas]");
  if (!hero || !canvas || typeof window.createAshwoodGravityRenderer !== "function") return;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = window.createAshwoodGravityRenderer({ canvas, reducedMotion: reduced });
  let heroRect = hero.getBoundingClientRect();
  let playing = false;

  renderer.ready.then(({ mode } = {}) => {
    document.body.classList.add("ashwood-gravity-active", "ashwood-gravity-ready");
    document.body.dataset.gravityMode = mode || "unknown";
  }).catch(() => {
    document.body.classList.add("ashwood-gravity-fallback");
  });

  const refreshRect = () => { heroRect = hero.getBoundingClientRect(); };
  const onPointer = (event) => {
    const x = (event.clientX - heroRect.left) / Math.max(heroRect.width, 1);
    const y = (event.clientY - heroRect.top) / Math.max(heroRect.height, 1);
    const active = x >= 0 && x <= 1 && y >= 0 && y <= 1 ? 1 : 0;
    renderer.setPointer({ x, y, active });
  };
  const onLeave = () => renderer.setPointer({ x: 0.5, y: 0.5, active: 0 });

  if (!reduced && matchMedia("(hover:hover) and (pointer:fine)").matches) {
    window.addEventListener("pointermove", onPointer, { passive: true });
    hero.addEventListener("pointerleave", onLeave, { passive: true });
  }

  const syncScroll = () => {
    const total = Math.max(document.documentElement.scrollHeight - innerHeight, 1);
    const globalProgress = scrollY / total;
    const heroProgress = Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / Math.max(hero.offsetHeight, innerHeight)));
    renderer.setScroll(Math.max(globalProgress * 0.28, heroProgress));
    if (heroProgress < 0.86) renderer.setChapter("identity");
    else if (document.querySelector("#thinking")?.getBoundingClientRect().top < innerHeight * 0.7) renderer.setChapter("instinct");
    else renderer.setChapter("evidence");
  };

  const readDiscovery = () => {
    try {
      const raw = JSON.parse(localStorage.getItem("ashwood.v3.discovery") || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch (_) {
      return [];
    }
  };

  renderer.setDiscovery(readDiscovery());
  document.querySelectorAll(".v3-hotspot").forEach((node) => {
    node.addEventListener("click", () => {
      requestAnimationFrame(() => renderer.setDiscovery(readDiscovery()));
    });
  });

  const syncAudio = () => renderer.setAudioEnergy(playing ? 1 : 0);
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
    const audioObserver = new MutationObserver(() => {
      const player = document.querySelector(".ashwood-audio");
      if (!player) return;
      bindAudio(player);
      audioObserver.disconnect();
    });
    audioObserver.observe(document.body, { childList: true });
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