(() => {
  "use strict";

  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/" && path !== "/index.html") return;

  const field = document.querySelector(".principles-field");
  if (!field) return;

  const finePointer = window.matchMedia("(pointer: fine) and (hover: hover)");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* Mount the bird node before home-flow.js. Its presence deliberately prevents
     the older automatic bird observer from installing. The Doctor Bird now has
     one clear role: an optional guide the visitor explicitly summons. */
  if (document.querySelector(".ashwood-doctor-bird-cursor")) return;

  const bird = document.createElement("div");
  bird.className = "ashwood-doctor-bird-cursor";
  bird.setAttribute("aria-hidden", "true");
  bird.innerHTML = `
    <svg class="ashwood-doctor-bird-cursor__svg" viewBox="0 0 64 40" focusable="false" aria-hidden="true">
      <defs>
        <linearGradient id="ashwood-doctor-bird-body-guide" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#21a36a"/>
          <stop offset=".48" stop-color="#0a6847"/>
          <stop offset="1" stop-color="#073827"/>
        </linearGradient>
        <linearGradient id="ashwood-doctor-bird-tail-guide" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stop-color="#111713"/>
          <stop offset=".68" stop-color="#151a16" stop-opacity=".82"/>
          <stop offset="1" stop-color="#151a16" stop-opacity="0"/>
        </linearGradient>
        <radialGradient id="ashwood-doctor-bird-wing-guide" cx="48%" cy="50%" r="58%">
          <stop offset="0" stop-color="#86d1a7" stop-opacity=".34"/>
          <stop offset=".55" stop-color="#4e9b72" stop-opacity=".16"/>
          <stop offset="1" stop-color="#4e9b72" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <g class="ashwood-doctor-bird-cursor__tails">
        <path d="M27 21 C18 17 9 12 1 8" fill="none" stroke="url(#ashwood-doctor-bird-tail-guide)" stroke-width="2.1" stroke-linecap="round"/>
        <path d="M27 23 C18 26 10 31 2 36" fill="none" stroke="url(#ashwood-doctor-bird-tail-guide)" stroke-width="2.1" stroke-linecap="round"/>
      </g>
      <g class="ashwood-doctor-bird-cursor__wing-field">
        <ellipse cx="34" cy="16" rx="15" ry="7" fill="url(#ashwood-doctor-bird-wing-guide)" transform="rotate(-26 34 16)"/>
        <ellipse cx="35" cy="25" rx="15" ry="7" fill="url(#ashwood-doctor-bird-wing-guide)" transform="rotate(26 35 25)"/>
      </g>
      <path class="ashwood-doctor-bird-cursor__body" d="M24 18 C30 12 42 12 49 19 C47 27 36 30 27 25 C23 23 22 20 24 18 Z" fill="url(#ashwood-doctor-bird-body-guide)"/>
      <path d="M31 17 C35 14 41 14 45 17 C40 18 36 20 33 23 C31 21 30 19 31 17 Z" fill="#69b88c" opacity=".45"/>
      <circle cx="48" cy="19" r="4.2" fill="#073125"/>
      <circle cx="49" cy="18" r=".72" fill="#f7c600"/>
      <path class="ashwood-doctor-bird-cursor__bill" d="M51 19 L63 17.8" fill="none" stroke="#c4262e" stroke-width="1.65" stroke-linecap="round"/>
    </svg>`;
  document.body.appendChild(bird);

  const style = document.createElement("style");
  style.textContent = `
    .ashwood-doctor-guide{
      position:fixed;z-index:525;width:min(320px,calc(100vw - 36px));padding:14px 15px 13px;
      border:1px solid color-mix(in srgb,var(--ashwood-rule) 72%,transparent);
      background:color-mix(in srgb,var(--ashwood-paper,#11130f) 94%,transparent);
      backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
      color:var(--ashwood-ink);opacity:0;visibility:hidden;pointer-events:none;
      transform:translateY(6px);transition:opacity .28s ease,transform .32s ease,visibility 0s linear .32s;
      box-shadow:0 14px 44px rgba(0,0,0,.12)
    }
    .ashwood-doctor-guide.is-visible{opacity:1;visibility:visible;pointer-events:auto;transform:translateY(0);transition-delay:0s}
    .ashwood-doctor-guide__eyebrow{margin:0 0 7px;color:#009b3a;font-size:7.5px;line-height:1;letter-spacing:.16em;text-transform:uppercase}
    .ashwood-doctor-guide__title{margin:0 0 7px;font-family:Georgia,serif;font-size:18px;font-weight:400;line-height:1.08;letter-spacing:-.018em}
    .ashwood-doctor-guide__copy{margin:0;color:var(--ashwood-muted);font-size:9.5px;line-height:1.52;letter-spacing:.02em}
    .ashwood-doctor-guide__controls{display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:8px;margin-top:12px;padding-top:10px;border-top:1px solid color-mix(in srgb,var(--ashwood-rule) 54%,transparent)}
    .ashwood-doctor-guide__count{color:var(--ashwood-muted);font-size:7px;letter-spacing:.14em;text-transform:uppercase}
    .ashwood-doctor-guide button{border:0;padding:7px 0;background:none;color:var(--ashwood-muted);font-family:inherit;font-size:7.5px;letter-spacing:.13em;text-transform:uppercase;cursor:pointer}
    .ashwood-doctor-guide button:hover,.ashwood-doctor-guide button:focus-visible{color:var(--ashwood-gold);font-style:italic}
    .ashwood-doctor-guide button:disabled{opacity:.22;cursor:default;font-style:normal}
    .ashwood-doctor-guide__next{color:var(--ashwood-ink)!important}
    .ashwood-doctor-guide__next:hover,.ashwood-doctor-guide__next:focus-visible{color:var(--ashwood-gold)!important}
    body.ashwood-bird-guide-active [data-ashwood-guide-target="true"]{
      outline:1px solid color-mix(in srgb,#009b3a 32%,transparent);outline-offset:9px;
      transition:outline-color .32s ease
    }
    @media(max-width:760px),(pointer:coarse){
      .ashwood-doctor-guide{left:16px!important;right:16px!important;bottom:16px!important;top:auto!important;width:auto;max-width:none}
      .ashwood-doctor-guide__title{font-size:17px}
      .ashwood-doctor-guide__copy{font-size:10px}
      .ashwood-doctor-guide__controls{grid-template-columns:auto 1fr auto auto}
    }
    @media(prefers-reduced-motion:reduce){
      .ashwood-doctor-guide{transition:none!important}
      body.ashwood-bird-guide-active [data-ashwood-guide-target="true"]{outline-offset:5px}
    }
  `;
  document.head.appendChild(style);

  const panel = document.createElement("aside");
  panel.className = "ashwood-doctor-guide";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "false");
  panel.setAttribute("aria-label", "ASHWOOD homepage guide");
  panel.innerHTML = `
    <p class="ashwood-doctor-guide__eyebrow"></p>
    <h2 class="ashwood-doctor-guide__title"></h2>
    <p class="ashwood-doctor-guide__copy"></p>
    <div class="ashwood-doctor-guide__controls">
      <span class="ashwood-doctor-guide__count"></span>
      <span></span>
      <button class="ashwood-doctor-guide__back" type="button">Back</button>
      <button class="ashwood-doctor-guide__next" type="button">Next →</button>
      <button class="ashwood-doctor-guide__exit" type="button">Exit</button>
    </div>`;
  document.body.appendChild(panel);

  const stops = [
    {
      selectors: ["#site-title", ".intro"],
      eyebrow: "01 / ORIENTATION",
      title: "I follow ideas wherever they go.",
      copy: "ASHWOOD is a living record of one point of view moving across creative work, product building, and the systems underneath both.",
      anchor: [.78, .58]
    },
    {
      selectors: [".principles-field"],
      eyebrow: "02 / THROUGHLINE",
      title: "The work has recurring patterns.",
      copy: "SIGNAL · FRICTION · TRANSLATION · SYSTEMS · ADAPTATION · SYNTHESIS are recurring ways the work tends to move. The field lets you discover them; the map makes them legible.",
      anchor: [.76, .48]
    },
    {
      selectors: [".home-entryways"],
      eyebrow: "03 / MANIFESTATION",
      title: "Different forms. Same point of view.",
      copy: "Modeling, music, and builds sit together because they are not separate identities here. They are different places the same curiosity becomes visible.",
      anchor: [.72, .42]
    },
    {
      selectors: [".home-entryways a[href='/journal/']", ".ashwood-capability-evidence", ".home-entryways"],
      eyebrow: "04 / BUILD JOURNAL",
      title: "The reasoning stays with the work.",
      copy: "The Build Journal records more than what shipped: what I believed, what changed, what failed, the evidence, and the decision that followed.",
      anchor: [.62, .58]
    },
    {
      selectors: [".home-now", "#now"],
      eyebrow: "05 / SITREP",
      title: "This is the live layer.",
      copy: "WHEN · WHERE · WHAT IT IS · WHAT IT IS DOING · WHAT I’M DOING ABOUT IT. SITREP connects the archive to the work happening now.",
      anchor: [.76, .36]
    },
    {
      selectors: [".future-nav", ".home-utility", ".home-entryways"],
      eyebrow: "06 / CONTINUE",
      title: "Choose a thread and follow it.",
      copy: "Explore the creative work, trace the builds, listen, or connect. The homepage is the map; the rest of ASHWOOD is the evidence.",
      anchor: [.72, .5]
    }
  ];

  const resolveTarget = (stop) => stop.selectors.map((selector) => document.querySelector(selector)).find((node) => node && node.getBoundingClientRect().width > 0) || null;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  let active = false;
  let index = 0;
  let currentTarget = null;
  let targetX = window.innerWidth + 120;
  let targetY = window.innerHeight * .35;
  let x = targetX;
  let y = targetY;
  let vx = 0;
  let vy = 0;
  let bank = 0;
  let tailX = 0;
  let tailY = 0;
  let tailRotate = 0;
  let visible = false;
  let exiting = false;
  let frame = 0;
  let settleTimer = 0;

  const pointFor = (element, anchor = [.72, .5]) => {
    const rect = element.getBoundingClientRect();
    return {
      x: clamp(rect.left + rect.width * anchor[0], 82, window.innerWidth - 82),
      y: clamp(rect.top + rect.height * anchor[1], 70, window.innerHeight - 72)
    };
  };

  const positionPanel = (point) => {
    if (window.innerWidth <= 760) return;
    requestAnimationFrame(() => {
      const rect = panel.getBoundingClientRect();
      const gap = 46;
      let left = point.x + gap;
      if (left + rect.width > window.innerWidth - 18) left = point.x - rect.width - 76;
      left = clamp(left, 18, window.innerWidth - rect.width - 18);
      const top = clamp(point.y - rect.height * .44, 74, window.innerHeight - rect.height - 18);
      panel.style.left = `${Math.round(left)}px`;
      panel.style.top = `${Math.round(top)}px`;
      panel.style.right = "auto";
      panel.style.bottom = "auto";
    });
  };

  const hideBird = () => {
    visible = false;
    exiting = false;
    bird.classList.remove("is-visible", "is-guide", "is-resolving");
  };

  const flyOut = () => {
    if (!finePointer.matches || reduceMotion.matches) return hideBird();
    exiting = true;
    targetX = window.innerWidth + 130;
    targetY = clamp(y - 70, 42, window.innerHeight - 60);
    window.setTimeout(hideBird, 1100);
  };

  const moveBird = (point, entering = false) => {
    if (!finePointer.matches || reduceMotion.matches) return;
    exiting = false;
    if (entering || !visible) {
      const enterFromRight = point.x < window.innerWidth * .67;
      x = point.x + (enterFromRight ? 180 : -180);
      y = point.y - 70;
      vx = 0;
      vy = 0;
    }
    targetX = point.x;
    targetY = point.y;
    visible = true;
    bird.classList.add("is-visible", "is-guide");
    bird.classList.remove("is-resolving");
    if (!frame) frame = requestAnimationFrame(tick);
  };

  function tick(now) {
    frame = 0;
    if (!visible) return;

    const spring = exiting ? .105 : .115;
    const damping = exiting ? .78 : .76;
    vx = (vx + (targetX - x) * spring) * damping;
    vy = (vy + (targetY - y) * spring) * damping;
    x += vx;
    y += vy;

    const speed = Math.hypot(vx, vy);
    bank += (clamp(vx * 1.15, -12, 12) - bank) * .18;
    tailX += (clamp(-vx * .95, -10, 10) - tailX) * .12;
    tailY += (clamp(-vy * .5, -5, 5) - tailY) * .10;
    tailRotate += (clamp(-vy * .72 - vx * .12, -9, 9) - tailRotate) * .10;

    const hovering = !exiting && speed < .55;
    const hoverY = hovering ? Math.sin(now / 185) * .9 : 0;
    const hoverX = hovering ? Math.cos(now / 260) * .4 : 0;

    bird.style.transform = `translate3d(${x - 63 + hoverX}px, ${y - 18 + hoverY}px, 0) rotate(${bank}deg)`;
    bird.style.setProperty("--ashwood-bird-tail-x", `${tailX}px`);
    bird.style.setProperty("--ashwood-bird-tail-y", `${tailY}px`);
    bird.style.setProperty("--ashwood-bird-tail-rotate", `${tailRotate}deg`);
    bird.style.setProperty("--ashwood-bird-speed", String(clamp(speed / 9, 0, 1)));

    frame = requestAnimationFrame(tick);
  }

  const clearTarget = () => {
    currentTarget?.removeAttribute("data-ashwood-guide-target");
    currentTarget = null;
  };

  const renderStop = () => {
    const stop = stops[index];
    const target = resolveTarget(stop);
    if (!target) return;

    clearTarget();
    currentTarget = target;
    currentTarget.setAttribute("data-ashwood-guide-target", "true");

    panel.classList.remove("is-visible");
    target.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "center" });

    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      if (!active) return;
      const point = pointFor(target, stop.anchor);
      moveBird(point, index === 0);

      panel.querySelector(".ashwood-doctor-guide__eyebrow").textContent = stop.eyebrow;
      panel.querySelector(".ashwood-doctor-guide__title").textContent = stop.title;
      panel.querySelector(".ashwood-doctor-guide__copy").textContent = stop.copy;
      panel.querySelector(".ashwood-doctor-guide__count").textContent = `${String(index + 1).padStart(2, "0")} / ${String(stops.length).padStart(2, "0")}`;
      panel.querySelector(".ashwood-doctor-guide__back").disabled = index === 0;
      panel.querySelector(".ashwood-doctor-guide__next").textContent = index === stops.length - 1 ? "Finish →" : "Next →";
      positionPanel(point);
      panel.classList.add("is-visible");
    }, reduceMotion.matches ? 30 : 420);
  };

  const endGuide = () => {
    active = false;
    document.body.classList.remove("ashwood-bird-guide-active");
    window.clearTimeout(settleTimer);
    panel.classList.remove("is-visible");
    clearTarget();
    flyOut();
  };

  const startGuide = () => {
    if (active) {
      index = 0;
      renderStop();
      return;
    }
    active = true;
    index = 0;
    document.body.classList.add("ashwood-bird-guide-active");
    renderStop();
  };

  panel.querySelector(".ashwood-doctor-guide__back").addEventListener("click", () => {
    if (!active || index <= 0) return;
    index -= 1;
    renderStop();
  });

  panel.querySelector(".ashwood-doctor-guide__next").addEventListener("click", () => {
    if (!active) return;
    if (index >= stops.length - 1) return endGuide();
    index += 1;
    renderStop();
  });

  panel.querySelector(".ashwood-doctor-guide__exit").addEventListener("click", endGuide);

  document.addEventListener("ashwood:start-bird-guide", startGuide);
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-ashwood-bird-guide]");
    if (!trigger) return;
    event.preventDefault();
    startGuide();
  });

  document.addEventListener("keydown", (event) => {
    if (!active) return;
    if (event.key === "Escape") endGuide();
    if (event.key === "ArrowRight" && index < stops.length - 1) {
      index += 1;
      renderStop();
    }
    if (event.key === "ArrowLeft" && index > 0) {
      index -= 1;
      renderStop();
    }
  });

  window.addEventListener("resize", () => {
    if (!active || !currentTarget) return;
    const stop = stops[index];
    const point = pointFor(currentTarget, stop.anchor);
    targetX = point.x;
    targetY = point.y;
    positionPanel(point);
  }, { passive: true });
})();
