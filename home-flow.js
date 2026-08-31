(() => {
  "use strict";

  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/" && path !== "/index.html") return;

  const body = document.body;
  const root = document.documentElement;

  /* The homepage thesis is one sentence. Remove the authored hard break and let
     responsive CSS decide whether a small screen needs to wrap naturally. */
  const siteTitle = document.getElementById("site-title");
  siteTitle?.querySelectorAll("br").forEach((breakNode) => {
    breakNode.replaceWith(document.createTextNode(" "));
  });

  /* Quiet reading/progress trace. */
  const progress = document.createElement("div");
  progress.className = "ashwood-flow-progress";
  progress.setAttribute("aria-hidden", "true");
  body.appendChild(progress);

  let progressFrame = 0;
  const updateProgress = () => {
    progressFrame = 0;
    const max = Math.max(1, root.scrollHeight - window.innerHeight);
    const pct = Math.max(0, Math.min(100, (window.scrollY / max) * 100));
    progress.style.setProperty("--ashwood-flow-progress", `${pct}%`);
  };

  const requestProgress = () => {
    if (progressFrame) return;
    progressFrame = requestAnimationFrame(updateProgress);
  };

  window.addEventListener("scroll", requestProgress, { passive: true });
  window.addEventListener("resize", requestProgress, { passive: true });
  updateProgress();

  /* One ordinary reveal language across the lower homepage. */
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const observed = new WeakSet();
  const revealObserver = reduceMotion.matches ? null : new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-flow-visible");
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.12,
    rootMargin: "0px 0px -7% 0px"
  });

  const register = (element) => {
    if (!element || observed.has(element)) return;
    observed.add(element);
    element.classList.add("ashwood-flow-reveal");
    if (!revealObserver || reduceMotion.matches) {
      element.classList.add("is-flow-visible");
      return;
    }
    revealObserver.observe(element);
  };

  const registerStaticFlow = () => {
    [
      document.querySelector(".home-entryways"),
      document.querySelector(".ashwood-capability-evidence"),
      document.querySelector(".home-now"),
      document.querySelector(".home-utility")
    ].forEach(register);
  };

  registerStaticFlow();

  /* Capability synthesis is created/mounted by the discovery system later. */
  const registerCapabilityMap = () => {
    const map = document.querySelector('.ashwood-capability-map[data-v2-mounted="discovery-field"], .ashwood-capability-map');
    if (map) register(map);
  };

  registerCapabilityMap();

  const mutationObserver = new MutationObserver(() => {
    registerStaticFlow();
    registerCapabilityMap();
    requestProgress();
  });
  mutationObserver.observe(document.body, { childList: true, subtree: true });

  /* Recalculate when discovery changes document height. */
  document.addEventListener("ashwood:open-capability-map", () => setTimeout(requestProgress, 80));
  document.addEventListener("ashwood:hotspot-found", () => setTimeout(requestProgress, 80));

  /* If the user changes reduced-motion while the page is open, never leave content hidden. */
  const revealEverything = () => {
    if (!reduceMotion.matches) return;
    document.querySelectorAll(".ashwood-flow-reveal").forEach((element) => element.classList.add("is-flow-visible"));
  };
  if (typeof reduceMotion.addEventListener === "function") reduceMotion.addEventListener("change", revealEverything);
})();