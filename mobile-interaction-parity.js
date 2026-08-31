(() => {
  "use strict";

  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/" && path !== "/index.html") return;

  /* Restore the original hotspot field runtime before layering newer homepage behavior. */
  if (!document.querySelector('script[data-ashwood-hotspot-runtime]')) {
    const hotspotScript = document.createElement("script");
    hotspotScript.src = "/hotspot-runtime-restore.js?v=20260831-restore1";
    hotspotScript.async = false;
    hotspotScript.dataset.ashwoodHotspotRuntime = "1";
    document.head.appendChild(hotspotScript);
  }

  /* Final homepage behavior layer: progress trace, reveal grammar, and event-driven Doctor Bird. */
  if (!document.querySelector('script[data-ashwood-home-flow]')) {
    const flowScript = document.createElement("script");
    flowScript.src = "/home-flow.js?v=20260831-flow3";
    flowScript.async = false;
    flowScript.dataset.ashwoodHomeFlow = "1";
    document.head.appendChild(flowScript);
  }

  if (!window.matchMedia("(max-width: 760px), (pointer: coarse)").matches) return;

  document.documentElement.classList.add("ashwood-mobile-interaction-parity");

  const after = (ms, fn) => window.setTimeout(fn, ms);

  /* XAYMACA: mobile should not require knowledge of a hover target.
     A short masthead dwell reveals the full provenance once, then it collapses
     into a small persistent clue that can be expanded again by touch/focus. */
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

  /* Motto + 1962: earned discovery should briefly reveal the deeper context on touch.
     Afterward it recedes to the quieter earned state already provided by the base UI. */
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

  /* Touch toggles remain available after the one-time automatic reveal. */
  const installTouchToggles = () => {
    const motto = document.querySelector(".iridescent-word--jamaica");
    const mottoContext = document.querySelector(".ashwood-jm-motto-context");
    if (motto && mottoContext && motto.dataset.mobileParity !== "1") {
      motto.dataset.mobileParity = "1";
      motto.addEventListener("click", () => {
        mottoContext.classList.toggle("is-mobile-auto-visible");
      });
    }

    const independence = document.querySelector(".ashwood-jm-1962");
    const independenceContext = document.querySelector(".ashwood-jm-1962-context");
    if (independence && independenceContext && independence.dataset.mobileParity !== "1") {
      independence.dataset.mobileParity = "1";
      independence.addEventListener("click", () => {
        independenceContext.classList.toggle("is-mobile-auto-visible");
      });
    }
  };

  const install = () => {
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
