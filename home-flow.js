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

  /* Cursor-following Doctor Bird.
     The browser pointer remains the real hit target; this vector is visual only. */
  const finePointer = window.matchMedia("(pointer: fine) and (hover: hover)");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const discoveryField = document.querySelector(".principles-field");

  const installDoctorBird = () => {
    if (!discoveryField || !finePointer.matches || reduceMotion.matches) return;
    if (document.querySelector(".ashwood-doctor-bird-cursor")) return;

    root.classList.add("has-doctor-bird-cursor");

    const bird = document.createElement("div");
    bird.className = "ashwood-doctor-bird-cursor";
    bird.setAttribute("aria-hidden", "true");
    bird.innerHTML = `
      <svg class="ashwood-doctor-bird-cursor__svg" viewBox="0 0 64 40" focusable="false" aria-hidden="true">
        <defs>
          <linearGradient id="ashwood-doctor-bird-body" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#21a36a"/>
            <stop offset=".48" stop-color="#0a6847"/>
            <stop offset="1" stop-color="#073827"/>
          </linearGradient>
          <linearGradient id="ashwood-doctor-bird-tail" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0" stop-color="#111713"/>
            <stop offset=".68" stop-color="#151a16" stop-opacity=".82"/>
            <stop offset="1" stop-color="#151a16" stop-opacity="0"/>
          </linearGradient>
          <radialGradient id="ashwood-doctor-bird-wing" cx="48%" cy="50%" r="58%">
            <stop offset="0" stop-color="#86d1a7" stop-opacity=".34"/>
            <stop offset=".55" stop-color="#4e9b72" stop-opacity=".16"/>
            <stop offset="1" stop-color="#4e9b72" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <g class="ashwood-doctor-bird-cursor__tails">
          <path d="M27 21 C18 17 9 12 1 8" fill="none" stroke="url(#ashwood-doctor-bird-tail)" stroke-width="2.1" stroke-linecap="round"/>
          <path d="M27 23 C18 26 10 31 2 36" fill="none" stroke="url(#ashwood-doctor-bird-tail)" stroke-width="2.1" stroke-linecap="round"/>
        </g>
        <g class="ashwood-doctor-bird-cursor__wing-field">
          <ellipse cx="34" cy="16" rx="15" ry="7" fill="url(#ashwood-doctor-bird-wing)" transform="rotate(-26 34 16)"/>
          <ellipse cx="35" cy="25" rx="15" ry="7" fill="url(#ashwood-doctor-bird-wing)" transform="rotate(26 35 25)"/>
        </g>
        <path class="ashwood-doctor-bird-cursor__body" d="M24 18 C30 12 42 12 49 19 C47 27 36 30 27 25 C23 23 22 20 24 18 Z" fill="url(#ashwood-doctor-bird-body)"/>
        <path d="M31 17 C35 14 41 14 45 17 C40 18 36 20 33 23 C31 21 30 19 31 17 Z" fill="#69b88c" opacity=".45"/>
        <circle cx="48" cy="19" r="4.2" fill="#073125"/>
        <circle cx="49" cy="18" r=".72" fill="#f7c600"/>
        <path class="ashwood-doctor-bird-cursor__bill" d="M51 19 L63 17.8" fill="none" stroke="#c4262e" stroke-width="1.65" stroke-linecap="round"/>
      </svg>`;
    body.appendChild(bird);

    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let vx = 0;
    let vy = 0;
    let bank = 0;
    let tailX = 0;
    let tailY = 0;
    let tailRotate = 0;
    let lastMoveAt = performance.now();
    let visible = false;
    let frame = 0;
    let peckTimer = 0;
    let hotspotHover = false;

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    const showAt = (clientX, clientY) => {
      targetX = clientX;
      targetY = clientY;
      if (!visible) {
        x = clientX;
        y = clientY;
        vx = 0;
        vy = 0;
      }
      visible = true;
      bird.classList.add("is-visible");
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const hide = () => {
      visible = false;
      hotspotHover = false;
      bird.classList.remove("is-visible", "is-hotspot-hover", "is-pecking");
    };

    const onPointerMove = (event) => {
      if (event.pointerType && event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      const now = performance.now();
      targetX = event.clientX;
      targetY = event.clientY;
      lastMoveAt = now;
      hotspotHover = Boolean(event.target.closest?.(".principle-hotspot"));
      bird.classList.toggle("is-hotspot-hover", hotspotHover);
      showAt(event.clientX, event.clientY);
    };

    const peck = () => {
      window.clearTimeout(peckTimer);
      bird.classList.remove("is-pecking");
      void bird.offsetWidth;
      bird.classList.add("is-pecking");
      peckTimer = window.setTimeout(() => bird.classList.remove("is-pecking"), 220);
    };

    const tick = (now) => {
      frame = 0;
      if (!visible) return;

      /* Critically damped-feeling pursuit: enough lag to feel alive, not enough to
         make the real click position confusing. */
      const spring = hotspotHover ? 0.11 : 0.145;
      const damping = hotspotHover ? 0.73 : 0.76;
      vx = (vx + (targetX - x) * spring) * damping;
      vy = (vy + (targetY - y) * spring) * damping;
      x += vx;
      y += vy;

      const speed = Math.hypot(vx, vy);
      const bankTarget = clamp(vx * 1.25, -11, 11);
      bank += (bankTarget - bank) * 0.18;

      /* Streamertails resist direction changes, then settle behind the body. */
      const tailXTarget = clamp(-vx * 0.95, -9, 9);
      const tailYTarget = clamp(-vy * 0.48, -4, 4);
      const tailRotateTarget = clamp(-vy * 0.75 - vx * 0.12, -8, 8);
      tailX += (tailXTarget - tailX) * 0.12;
      tailY += (tailYTarget - tailY) * 0.10;
      tailRotate += (tailRotateTarget - tailRotate) * 0.10;

      const idleFor = now - lastMoveAt;
      const hovering = speed < 0.55 && idleFor > 70;
      const hoverY = hovering ? Math.sin(now / 190) * (hotspotHover ? 0.7 : 1.45) : 0;
      const hoverX = hovering ? Math.cos(now / 260) * 0.55 : 0;

      /* The bill tip is the visual pointer. */
      bird.style.transform = `translate3d(${x - 63 + hoverX}px, ${y - 18 + hoverY}px, 0) rotate(${bank}deg)`;
      bird.style.setProperty("--ashwood-bird-tail-x", `${tailX}px`);
      bird.style.setProperty("--ashwood-bird-tail-y", `${tailY}px`);
      bird.style.setProperty("--ashwood-bird-tail-rotate", `${tailRotate}deg`);
      bird.style.setProperty("--ashwood-bird-speed", String(clamp(speed / 9, 0, 1)));

      frame = requestAnimationFrame(tick);
    };

    discoveryField.addEventListener("pointerenter", (event) => showAt(event.clientX, event.clientY));
    discoveryField.addEventListener("pointermove", onPointerMove, { passive: true });
    discoveryField.addEventListener("pointerleave", hide);
    discoveryField.addEventListener("pointerdown", peck);

    const disableIfNeeded = () => {
      if (finePointer.matches && !reduceMotion.matches) return;
      hide();
      root.classList.remove("has-doctor-bird-cursor");
      bird.remove();
    };
    finePointer.addEventListener?.("change", disableIfNeeded);
    reduceMotion.addEventListener?.("change", disableIfNeeded);
  };

  installDoctorBird();

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

  /* If reduced-motion changes while the page is open, never leave content hidden. */
  const revealEverything = () => {
    if (!reduceMotion.matches) return;
    document.querySelectorAll(".ashwood-flow-reveal").forEach((element) => element.classList.add("is-flow-visible"));
  };
  if (typeof reduceMotion.addEventListener === "function") reduceMotion.addEventListener("change", revealEverything);
})();