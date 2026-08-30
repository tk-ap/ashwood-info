(() => {
  "use strict";

  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/" && path !== "/index.html") return;

  const wordmark = document.querySelector(".wordmark");
  const masthead = document.querySelector(".masthead");
  if (wordmark && masthead) {
    wordmark.classList.add("ashwood-jm-xaymaca");
    wordmark.setAttribute("title", "A deeper layer is hidden here.");
    const inline = document.createElement("p");
    inline.className = "ashwood-jm-xaymaca-inline";
    inline.setAttribute("aria-live", "polite");
    inline.innerHTML = '<span class="ashwood-jm-xaymaca-inline__name">XAYMACA</span><span class="ashwood-jm-xaymaca-inline__meaning">Land of wood and water</span><span class="ashwood-jm-xaymaca-inline__context">Jamaica’s name is believed to derive from the Taíno Xaymaca — a quiet resonance inside ASHWOOD.</span>';
    masthead.appendChild(inline);
    let holdTimer = 0;
    const openXaymaca = () => inline.classList.add("is-visible");
    const closeXaymaca = () => inline.classList.remove("is-visible");
    wordmark.addEventListener("pointerenter", () => { holdTimer = window.setTimeout(openXaymaca, 500); });
    wordmark.addEventListener("pointerleave", () => { window.clearTimeout(holdTimer); closeXaymaca(); });
    wordmark.addEventListener("focus", openXaymaca);
    wordmark.addEventListener("blur", closeXaymaca);
  }

  const motto = document.querySelector(".iridescent-word--jamaica");
  let mottoContext = null;
  if (motto) {
    motto.tabIndex = 0;
    motto.setAttribute("aria-label", "Jamaican provenance behind Out of One");
    mottoContext = document.createElement("span");
    mottoContext.className = "ashwood-jm-motto-context";
    mottoContext.innerHTML = '<span class="ashwood-jm-context-kicker">JAMAICA / PROVENANCE</span><span class="ashwood-jm-context-title">Out of Many, One People.</span><span class="ashwood-jm-context-note">“Out of One, Many Becomings” is a deliberate inversion of Jamaica’s national motto.</span>';
    motto.parentElement?.insertAdjacentElement("afterend", mottoContext);
    let mottoTimer = 0;
    const openMotto = () => { window.clearTimeout(mottoTimer); motto.classList.add("ashwood-jm-active"); mottoContext.classList.add("is-visible"); };
    const closeMotto = () => { motto.classList.remove("ashwood-jm-active"); mottoContext.classList.remove("is-visible"); };
    motto.addEventListener("pointerenter", openMotto);
    motto.addEventListener("pointerleave", () => { mottoTimer = window.setTimeout(closeMotto, 180); });
    motto.addEventListener("focus", openMotto);
    motto.addEventListener("blur", closeMotto);
  }

  const field = document.querySelector(".principles-field");
  let independence = null;
  let independenceContext = null;
  if (field && !field.querySelector(".ashwood-jm-1962")) {
    independence = document.createElement("span");
    independence.className = "ashwood-jm-1962";
    independence.textContent = "06 · 08 · 1962";
    independence.setAttribute("tabindex", "0");
    independence.setAttribute("aria-label", "Jamaica independence date: August 6, 1962");
    independenceContext = document.createElement("span");
    independenceContext.className = "ashwood-jm-1962-context";
    independenceContext.innerHTML = '<span class="ashwood-jm-context-kicker">INDEPENDENCE / JAMAICA</span><span class="ashwood-jm-context-title">6 August 1962.</span><span class="ashwood-jm-context-note">A small coordinate in the field for the year Jamaica became independent.</span>';
    const openIndependence = () => independenceContext.classList.add("is-visible");
    const closeIndependence = () => independenceContext.classList.remove("is-visible");
    independence.addEventListener("pointerenter", openIndependence);
    independence.addEventListener("pointerleave", closeIndependence);
    independence.addEventListener("focus", openIndependence);
    independence.addEventListener("blur", closeIndependence);
    field.appendChild(independence);
    field.appendChild(independenceContext);
  }

  let bird = null;
  let birdContext = null;
  let flightToken = 0;
  let lastLaunchAt = 0;
  const ensureBirdContext = () => {
    if (birdContext) return birdContext;
    birdContext = document.createElement("p");
    birdContext.className = "ashwood-jm-bird-context";
    birdContext.innerHTML = '<span class="ashwood-jm-context-kicker">DOCTOR BIRD / JAMAICA</span><span class="ashwood-jm-context-note">The long twin streamertail feathers, iridescent green body, and red bill are a nod to Jamaica’s national bird.</span>';
    const entryways = document.querySelector(".home-entryways");
    if (entryways) entryways.insertAdjacentElement("afterend", birdContext);
    else document.querySelector(".home-identity")?.appendChild(birdContext);
    return birdContext;
  };
  const ensureBird = () => {
    if (bird) return bird;
    bird = document.createElement("div");
    bird.className = "ashwood-jm-bird";
    bird.setAttribute("aria-hidden", "true");
    bird.innerHTML = '<span class="ashwood-jm-bird__tail ashwood-jm-bird__tail--upper"></span><span class="ashwood-jm-bird__tail ashwood-jm-bird__tail--lower"></span><span class="ashwood-jm-bird__wing ashwood-jm-bird__wing--left"></span><span class="ashwood-jm-bird__wing ashwood-jm-bird__wing--right"></span><span class="ashwood-jm-bird__body"></span><span class="ashwood-jm-bird__bill"></span>';
    document.body.appendChild(bird);
    return bird;
  };
  const center = (el) => { const rect = el.getBoundingClientRect(); return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }; };
  const pause = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  const flyBird = async (trigger) => {
    const destinations = [...document.querySelectorAll(".home-entryway")].filter((el) => { const rect = el.getBoundingClientRect(); return rect.width > 0 && rect.height > 0; });
    if (!trigger || !destinations.length) return;
    const token = ++flightToken;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    destinations.forEach((el) => el.classList.remove("is-doctorbird-visited"));
    if (prefersReducedMotion) {
      for (const destination of destinations) {
        if (token !== flightToken) return;
        destination.classList.add("is-doctorbird-visited");
        await pause(520);
        destination.classList.remove("is-doctorbird-visited");
      }
      return;
    }
    const guide = ensureBird();
    const start = center(trigger);
    guide.getAnimations().forEach((animation) => animation.cancel());
    guide.style.left = `${start.x}px`;
    guide.style.top = `${start.y}px`;
    guide.style.opacity = "1";
    guide.classList.add("is-flying");
    await pause(220);
    let from = start;
    for (let index = 0; index < destinations.length; index += 1) {
      if (token !== flightToken) return;
      const destination = destinations[index];
      const to = center(destination);
      const direction = to.x >= from.x ? 1 : -1;
      const lift = Math.max(44, Math.min(128, Math.abs(to.x - from.x) * .22 + Math.abs(to.y - from.y) * .16));
      const controlX = from.x + (to.x - from.x) * .52;
      const controlY = Math.min(from.y, to.y) - lift;
      const animation = guide.animate([
        { left: `${from.x}px`, top: `${from.y}px`, transform: `translate(-50%,-50%) rotate(${direction > 0 ? -3 : 3}deg) scaleX(${direction})`, opacity: 1, offset: 0 },
        { left: `${controlX}px`, top: `${controlY}px`, transform: `translate(-50%,-50%) rotate(${direction > 0 ? -8 : 8}deg) scaleX(${direction})`, opacity: 1, offset: .52 },
        { left: `${to.x}px`, top: `${to.y - 12}px`, transform: `translate(-50%,-50%) rotate(${direction > 0 ? 2 : -2}deg) scaleX(${direction})`, opacity: 1, offset: .9 },
        { left: `${to.x}px`, top: `${to.y}px`, transform: `translate(-50%,-50%) rotate(0deg) scaleX(${direction})`, opacity: 1, offset: 1 }
      ], { duration: window.innerWidth <= 760 ? 820 : 980, easing: "cubic-bezier(.2,.72,.18,1)", fill: "forwards" });
      await animation.finished.catch(() => {});
      if (token !== flightToken) return;
      guide.style.left = `${to.x}px`;
      guide.style.top = `${to.y}px`;
      destination.classList.add("is-doctorbird-visited");
      const hover = guide.animate([
        { left: `${to.x}px`, top: `${to.y}px`, transform: `translate(-50%,-50%) scaleX(${direction})`, offset: 0 },
        { left: `${to.x - direction * 12}px`, top: `${to.y - 5}px`, transform: `translate(-50%,-50%) scaleX(${direction})`, offset: .42 },
        { left: `${to.x + direction * 4}px`, top: `${to.y + 1}px`, transform: `translate(-50%,-50%) scaleX(${direction})`, offset: .76 },
        { left: `${to.x}px`, top: `${to.y}px`, transform: `translate(-50%,-50%) scaleX(${direction})`, offset: 1 }
      ], { duration: 560, easing: "cubic-bezier(.22,.72,.2,1)", fill: "forwards" });
      await hover.finished.catch(() => {});
      if (token !== flightToken) return;
      await pause(index === destinations.length - 1 ? 520 : 260);
      destination.classList.remove("is-doctorbird-visited");
      from = to;
    }
    if (token !== flightToken) return;
    const exitX = Math.min(window.innerWidth + 100, from.x + Math.max(170, window.innerWidth * .2));
    const exitY = Math.max(30, from.y - 110);
    const exit = guide.animate([{ left: `${from.x}px`, top: `${from.y}px`, opacity: 1 }, { left: `${exitX}px`, top: `${exitY}px`, opacity: 0 }], { duration: 760, easing: "cubic-bezier(.12,.82,.16,1)", fill: "forwards" });
    await exit.finished.catch(() => {});
    if (token === flightToken) { guide.classList.remove("is-flying"); guide.style.opacity = "0"; }
  };

  const doctorBird = () => {
    const bloom = document.querySelector(".becomings-bloom");
    if (!bloom) return false;
    bloom.classList.add("ashwood-jm-doctorbird");
    const trigger = document.querySelector(".becomings-trigger");
    if (trigger && !trigger.dataset.jmDoctorBird) {
      trigger.dataset.jmDoctorBird = "1";
      let activations = 0;
      const launch = () => {
        const now = Date.now();
        if (now - lastLaunchAt < 5200) return;
        lastLaunchAt = now;
        activations += 1;
        window.setTimeout(() => flyBird(trigger), 300);
        if (activations >= 2) {
          const context = ensureBirdContext();
          context.classList.add("is-visible");
          window.setTimeout(() => context.classList.remove("is-visible"), 6200);
        }
      };
      trigger.addEventListener("pointerenter", (event) => { if (event.pointerType === "mouse") launch(); });
      trigger.addEventListener("focus", launch);
      trigger.addEventListener("click", launch);
    }
    return true;
  };
  if (!doctorBird()) {
    const observer = new MutationObserver(() => { if (doctorBird()) observer.disconnect(); });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  const updateEarnedCulturalSignals = () => {
    const count = Number(document.documentElement.dataset.ashwoodDiscoveryCount || 0);
    mottoContext?.classList.toggle("is-earned", count >= 2);
    independence?.classList.toggle("is-earned", count >= 3);
    independenceContext?.classList.toggle("is-earned", count >= 4);
  };
  updateEarnedCulturalSignals();
  const discoveryObserver = new MutationObserver(updateEarnedCulturalSignals);
  discoveryObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-ashwood-discovery-count"] });
})();