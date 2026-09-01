(() => {
  "use strict";

  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/" && path !== "/index.html") return;

  const mobile = window.matchMedia("(max-width: 760px), (pointer: coarse)");
  const isMobile = mobile.matches;

  /* Desktop keeps the latent discovery field. Mobile no longer loads the hotspot
     restore/guidance layer: the capability chapter itself is the interaction. */
  if (!isMobile && !document.querySelector('script[data-ashwood-hotspot-runtime]')) {
    const hotspotScript = document.createElement("script");
    hotspotScript.src = "/hotspot-runtime-restore.js?v=20260831-restore2";
    hotspotScript.async = false;
    hotspotScript.dataset.ashwoodHotspotRuntime = "1";
    document.head.appendChild(hotspotScript);
  }

  if (!isMobile && !document.querySelector('script[data-ashwood-hotspot-guidance]')) {
    const guidanceScript = document.createElement("script");
    guidanceScript.src = "/hotspot-guidance.js?v=20260831-guide2";
    guidanceScript.async = false;
    guidanceScript.dataset.ashwoodHotspotGuidance = "1";
    document.head.appendChild(guidanceScript);
  }

  if (!document.querySelector('script[data-ashwood-doctor-bird-trigger]')) {
    const birdScript = document.createElement("script");
    birdScript.src = "/doctor-bird-trigger.js?v=20260901-flight2";
    birdScript.async = false;
    birdScript.dataset.ashwoodDoctorBirdTrigger = "1";
    document.head.appendChild(birdScript);
  }

  if (!document.querySelector('script[data-ashwood-home-flow]')) {
    const flowScript = document.createElement("script");
    flowScript.src = "/home-flow.js?v=20260831-flow3";
    flowScript.async = false;
    flowScript.dataset.ashwoodHomeFlow = "1";
    document.head.appendChild(flowScript);
  }

  if (!isMobile) return;

  document.documentElement.classList.add("ashwood-mobile-interaction-parity");
  document.body.classList.add("ashwood-mobile-capability-native");

  const after = (ms, fn) => window.setTimeout(fn, ms);

  const installCapabilityChapter = () => {
    const field = document.querySelector(".principles-field");
    const map = document.querySelector(".ashwood-capability-map");
    if (!field || !map || map.dataset.mobileNative === "1") return false;

    map.dataset.mobileNative = "1";
    if (map.parentElement !== field) field.appendChild(map);

    const header = map.querySelector(".ashwood-capability-map__header");
    const eyebrow = map.querySelector(".ashwood-capability-map__eyebrow");
    const title = map.querySelector(".ashwood-capability-map__title");
    const authorship = map.querySelector(".ashwood-capability-map__authorship-key");
    const reset = map.querySelector(".ashwood-capability-map__reset");

    if (eyebrow) eyebrow.textContent = "THE THROUGHLINE · SIX PATTERNS";
    if (title) title.textContent = "Different work. Same underlying patterns.";
    if (authorship) authorship.textContent = "Scroll the field. Each pattern is one way the work tends to move — and where it becomes useful now.";
    if (reset) {
      reset.tabIndex = -1;
      reset.setAttribute("aria-hidden", "true");
    }

    if (header && !map.querySelector(".ashwood-mobile-capability-intro")) {
      const intro = document.createElement("p");
      intro.className = "ashwood-mobile-capability-intro";
      intro.textContent = "Different roles. Different people. The same patterns kept showing up.";
      header.before(intro);
    }

    const items = [...map.querySelectorAll(".ashwood-capability-map__item")];
    let frame = 0;
    const updateReadingState = () => {
      frame = 0;
      if (!items.length) return;
      const readingLine = window.innerHeight * .46;
      let closest = null;
      let closestDistance = Infinity;
      items.forEach((item) => {
        const rect = item.getBoundingClientRect();
        const center = rect.top + Math.min(rect.height * .34, 72);
        const distance = Math.abs(center - readingLine);
        if (distance < closestDistance) {
          closest = item;
          closestDistance = distance;
        }
      });
      items.forEach((item) => item.classList.toggle("is-mobile-reading", item === closest));
    };

    const scheduleReadingState = () => {
      if (frame) return;
      frame = requestAnimationFrame(updateReadingState);
    };

    window.addEventListener("scroll", scheduleReadingState, { passive: true });
    window.addEventListener("resize", scheduleReadingState, { passive: true });
    requestAnimationFrame(updateReadingState);
    return true;
  };

  /* XAYMACA remains an earned inline clue on touch. */
  const installXaymaca = () => {
    const masthead = document.querySelector(".masthead");
    const inline = document.querySelector(".ashwood-jm-xaymaca-inline");
    if (!masthead || !inline || inline.dataset.mobileParity === "1") return false;

    inline.dataset.mobileParity = "1";
    inline.classList.add("ashwood-mobile-parity");
    inline.tabIndex = 0;
    inline.setAttribute("role", "button");
    inline.setAttribute("aria-label", "Reveal Xaymaca, the Jamaica name reference inside ASHWOOD");
    inline.setAttribute("aria-expanded", "false");

    let expanded = false;
    let teased = false;
    let teaseTimer = 0;

    const collapse = () => {
      expanded = false;
      inline.classList.remove("is-mobile-expanded", "is-mobile-tease");
      inline.classList.add("is-mobile-earned");
      inline.setAttribute("aria-expanded", "false");
    };

    const expand = () => {
      expanded = true;
      inline.classList.remove("is-mobile-tease");
      inline.classList.add("is-mobile-earned", "is-mobile-expanded");
      inline.setAttribute("aria-expanded", "true");
    };

    const tease = () => {
      if (teased || expanded) return;
      teased = true;
      inline.classList.add("is-mobile-earned", "is-mobile-tease");
      inline.setAttribute("aria-expanded", "true");
      teaseTimer = after(5200, collapse);
    };

    inline.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      window.clearTimeout(teaseTimer);
      expanded ? collapse() : expand();
    });
    inline.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      window.clearTimeout(teaseTimer);
      expanded ? collapse() : expand();
    });

    const dwellObserver = new IntersectionObserver((entries) => {
      const visible = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= .55);
      if (!visible || teased) return;
      after(1500, () => {
        const rect = masthead.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight) tease();
      });
    }, { threshold: [.55] });
    dwellObserver.observe(masthead);
    return true;
  };

  const autoRevealEarned = () => {
    const count = Number(document.documentElement.dataset.ashwoodDiscoveryCount || 0);
    const mottoContext = document.querySelector(".ashwood-jm-motto-context");
    const independenceContext = document.querySelector(".ashwood-jm-1962-context");

    if (count >= 2 && mottoContext && mottoContext.dataset.mobileAutoShown !== "1") {
      mottoContext.dataset.mobileAutoShown = "1";
      mottoContext.classList.add("is-mobile-auto-visible");
      after(5200, () => mottoContext.classList.remove("is-mobile-auto-visible"));
    }

    if (count >= 4 && independenceContext && independenceContext.dataset.mobileAutoShown !== "1") {
      independenceContext.dataset.mobileAutoShown = "1";
      independenceContext.classList.add("is-mobile-auto-visible");
      after(5200, () => independenceContext.classList.remove("is-mobile-auto-visible"));
    }
  };

  const installTouchToggles = () => {
    const motto = document.querySelector(".iridescent-word--jamaica");
    const mottoContext = document.querySelector(".ashwood-jm-motto-context");
    if (motto && mottoContext && motto.dataset.mobileParity !== "1") {
      motto.dataset.mobileParity = "1";
      motto.addEventListener("click", () => mottoContext.classList.toggle("is-mobile-auto-visible"));
    }

    const independence = document.querySelector(".ashwood-jm-1962");
    const independenceContext = document.querySelector(".ashwood-jm-1962-context");
    if (independence && independenceContext && independence.dataset.mobileParity !== "1") {
      independence.dataset.mobileParity = "1";
      independence.addEventListener("click", () => independenceContext.classList.toggle("is-mobile-auto-visible"));
    }
  };

  const install = () => {
    installCapabilityChapter();
    installXaymaca();
    installTouchToggles();
    autoRevealEarned();
  };

  install();

  const observer = new MutationObserver(install);
  observer.observe(document.body, { childList: true, subtree: true });

  const discoveryObserver = new MutationObserver(autoRevealEarned);
  discoveryObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-ashwood-discovery-count"]
  });
})();