(() => {
  "use strict";

  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/" && path !== "/index.html") return;

  const reveal = document.createElement("div");
  reveal.className = "ashwood-jm-reveal";
  reveal.setAttribute("role", "status");
  reveal.setAttribute("aria-live", "polite");
  document.body.appendChild(reveal);

  let revealTimer = 0;
  const show = ({ anchor, kicker, title, note, duration = 4200 }) => {
    window.clearTimeout(revealTimer);
    reveal.innerHTML = `<span class="ashwood-jm-reveal__kicker">${kicker}</span><span class="ashwood-jm-reveal__title">${title}</span><span class="ashwood-jm-reveal__note">${note}</span>`;
    const rect = anchor?.getBoundingClientRect?.();
    if (rect && window.innerWidth > 760) {
      reveal.style.left = `${Math.min(window.innerWidth - 350, Math.max(18, rect.left))}px`;
      reveal.style.top = `${Math.min(window.innerHeight - 150, rect.bottom + 14)}px`;
      reveal.style.right = "auto";
      reveal.style.bottom = "auto";
    }
    reveal.classList.add("is-visible");
    revealTimer = window.setTimeout(() => reveal.classList.remove("is-visible"), duration);
  };

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
  if (motto) {
    motto.tabIndex = 0;
    motto.setAttribute("role", "button");
    motto.setAttribute("aria-label", "Reveal the Jamaican motto reference behind Out of One");
    const openMotto = () => {
      motto.classList.add("ashwood-jm-active");
      show({
        anchor: motto,
        kicker: "PROVENANCE / JAMAICA",
        title: "Out of Many, One People.",
        note: "ASHWOOD’s “Out of One, Many Becomings” is a deliberate inversion of Jamaica’s national motto.",
        duration: 5000
      });
      window.setTimeout(() => motto.classList.remove("ashwood-jm-active"), 1800);
    };
    motto.addEventListener("click", openMotto);
    motto.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openMotto(); }
    });
  }

  const field = document.querySelector(".principles-field");
  if (field && !field.querySelector(".ashwood-jm-1962")) {
    const independence = document.createElement("button");
    independence.type = "button";
    independence.className = "ashwood-jm-1962";
    independence.textContent = "06 · 08 · 1962";
    independence.setAttribute("aria-label", "Jamaica independence date: August 6, 1962");
    independence.addEventListener("click", () => show({
      anchor: independence,
      kicker: "INDEPENDENCE / JAMAICA",
      title: "6 August 1962.",
      note: "A small coordinate in the field for the year Jamaica became independent."
    }));
    field.appendChild(independence);
  }

  let bird = null;
  let flightToken = 0;
  let lastLaunchAt = 0;
  const ensureBird = () => {
    if (bird) return bird;
    bird = document.createElement("div");
    bird.className = "ashwood-jm-bird";
    bird.setAttribute("aria-hidden", "true");
    bird.innerHTML = '<span class="ashwood-jm-bird__tail ashwood-jm-bird__tail--upper"></span><span class="ashwood-jm-bird__tail ashwood-jm-bird__tail--lower"></span><span class="ashwood-jm-bird__wing ashwood-jm-bird__wing--left"></span><span class="ashwood-jm-bird__wing ashwood-jm-bird__wing--right"></span><span class="ashwood-jm-bird__body"></span><span class="ashwood-jm-bird__bill"></span>';
    document.body.appendChild(bird);
    return bird;
  };

  const center = (el) => {
    const rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  };

  const pause = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  const flyBird = async (trigger) => {
    const destinations = [...document.querySelectorAll(".home-entryway")].filter((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
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
      ], {
        duration: window.innerWidth <= 760 ? 820 : 980,
        easing: "cubic-bezier(.2,.72,.18,1)",
        fill: "forwards"
      });
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
    const exit = guide.animate([
      { left: `${from.x}px`, top: `${from.y}px`, opacity: 1 },
      { left: `${exitX}px`, top: `${exitY}px`, opacity: 0 }
    ], { duration: 760, easing: "cubic-bezier(.12,.82,.16,1)", fill: "forwards" });
    await exit.finished.catch(() => {});
    if (token === flightToken) {
      guide.classList.remove("is-flying");
      guide.style.opacity = "0";
    }
  };

  const doctorBird = () => {
    const bloom = document.querySelector(".becomings-bloom");
    if (!bloom) return false;
    bloom.classList.add("ashwood-jm-doctorbird");
    const trigger = document.querySelector(".becomings-trigger");
    if (trigger && !trigger.dataset.jmDoctorBird) {
      trigger.dataset.jmDoctorBird = "1";
      let activations = 0;

      const launch = ({ explain = false } = {}) => {
        const now = Date.now();
        if (now - lastLaunchAt < 5200) return;
        lastLaunchAt = now;
        activations += 1;
        window.setTimeout(() => flyBird(trigger), 300);
        if (explain || activations === 3) show({
          anchor: trigger,
          kicker: "NATURE / JAMAICA",
          title: "Doctor Bird.",
          note: "The long twin streamertail feathers, iridescent green body, and red bill turn the Becomings guide into a specific nod to Jamaica’s Doctor Bird."
        });
      };

      trigger.addEventListener("pointerenter", (event) => {
        if (event.pointerType === "mouse") launch();
      });
      trigger.addEventListener("focus", () => launch());
      trigger.addEventListener("click", () => launch());
    }
    return true;
  };

  if (!doctorBird()) {
    const observer = new MutationObserver(() => { if (doctorBird()) observer.disconnect(); });
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();