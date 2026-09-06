(() => {
  "use strict";

  // Depends on home-native.js having already tagged <body>; both are deferred and
  // home-native.js precedes this file in index.html. Keep that order.
  if (!document.body || !document.body.classList.contains("ashwood-home-native")) return;
  const params = new URLSearchParams(window.location.search);
  if (params.get("ashwood-orb") !== "1") return;

  // The stylesheet is injected, so it lands after these elements exist. Without the
  // boot guard the reveal starts at its default opacity and visibly transitions out.
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = "/offbrand-orb.css?v=20260905-preview6";
  const endBoot = () => document.body.classList.remove("ashwood-orb-booting");
  stylesheet.addEventListener("load", () => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(endBoot));
  }, { once: true });
  // Fallback: a cached or failed stylesheet must never leave transitions disabled.
  window.setTimeout(endBoot, 1200);
  document.head.appendChild(stylesheet);
  document.body.classList.add("ashwood-orb-booting");
  document.body.classList.add("ashwood-orb-preview");

  // Own element rather than body::before: theme.js injects its own body::before rules
  // (a scanline layer for phosphor-cyber, `content: none` elsewhere) at a higher
  // specificity, which would suppress this layer in every theme.
  const wash = document.createElement("div");
  wash.className = "ashwood-orb-wash";
  wash.setAttribute("aria-hidden", "true");
  document.body.prepend(wash);

  // The blob is decoration and stays behind .shell. The control cannot live inside it:
  // .ashwood-orb has z-index 0, which caps every descendant below .shell's z-index 1,
  // so a toggle nested in the orb never receives a hover or a click.
  const orb = document.createElement("div");
  orb.className = "ashwood-orb";
  orb.setAttribute("aria-hidden", "true");
  orb.innerHTML = [
    '<span class="ashwood-orb__body"></span>',
    '<span class="ashwood-orb__ring"></span>',
    '<span class="ashwood-orb__ring ashwood-orb__ring--outer"></span>'
  ].join("");
  document.body.append(orb);

  // Bounded affordance above the content. Deliberately small: a full-size transparent
  // hit area at this depth would swallow clicks across the whole page.
  const signal = document.createElement("div");
  signal.className = "ashwood-orb-signal";
  signal.innerHTML = [
    '<button type="button" class="ashwood-orb-signal__toggle" aria-expanded="false" aria-controls="ashwood-orb-reveal">',
    '<span class="ashwood-orb-signal__dot" aria-hidden="true"></span>',
    '<span class="ashwood-orb-signal__label">Reveal the ASHWOOD field signal</span></button>',
    '<div class="ashwood-orb-signal__reveal" id="ashwood-orb-reveal" role="group" aria-label="ASHWOOD field signal">',
    '<span class="ashwood-orb-signal__eyebrow">FIELD SIGNAL / 01</span>',
    '<strong>The next build is already here.</strong>',
    '<p>Context. Attention. Permission. The hidden structure behind a useful handoff.</p>',
    '<a href="/ai-from-zero/">Enter AI from ZERO &rarr;</a></div>'
  ].join("");
  document.body.append(signal);

  const toggle = signal.querySelector(".ashwood-orb-signal__toggle");
  const setOpen = (open) => {
    signal.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  };
  signal.addEventListener("mouseenter", () => signal.classList.add("is-proximate"));
  signal.addEventListener("mouseleave", () => { if (!signal.classList.contains("is-open")) signal.classList.remove("is-proximate"); });
  toggle.addEventListener("click", () => setOpen(!signal.classList.contains("is-open")));
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !signal.classList.contains("is-open")) return;
    setOpen(false);
    toggle.focus();
  });

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let targetX = 0;
  let targetY = 0;
  let targetR = 0;
  let targetInnerX = 0;
  let targetInnerY = 0;
  let targetInnerR = 0;
  let currentX = 0;
  let currentY = 0;
  let currentR = 0;
  let currentInnerX = 0;
  let currentInnerY = 0;
  let currentInnerR = 0;
  const root = document.documentElement;
  let lastScrollY = window.scrollY;
  let scrollEnergy = 0;
  let frame = 0;

  const move = (event) => {
    const x = event.clientX / window.innerWidth - .5;
    const y = event.clientY / window.innerHeight - .5;
    targetX = x * 110;
    targetY = y * 82;
    targetR = x * 11;
    targetInnerX = x * -26;
    targetInnerY = y * -20;
    targetInnerR = x * 8;
    document.documentElement.style.setProperty("--ashwood-orb-x", `${Math.round(event.clientX / window.innerWidth * 100)}%`);
    document.documentElement.style.setProperty("--ashwood-orb-y", `${Math.round(event.clientY / window.innerHeight * 100)}%`);
    if (!frame) frame = window.requestAnimationFrame(tick);
  };

  const scroll = () => {
    const delta = window.scrollY - lastScrollY;
    lastScrollY = window.scrollY;
    scrollEnergy = Math.max(-1, Math.min(1, delta / 42));
    targetY += scrollEnergy * 30;
    targetR += scrollEnergy * 7;
    if (!frame) frame = window.requestAnimationFrame(tick);
  };

  const tick = () => {
    currentX += (targetX - currentX) * .06;
    currentY += (targetY - currentY) * .06;
    currentR += (targetR - currentR) * .06;
    currentInnerX += (targetInnerX - currentInnerX) * .08;
    currentInnerY += (targetInnerY - currentInnerY) * .08;
    currentInnerR += (targetInnerR - currentInnerR) * .08;
    scrollEnergy *= .9;
    targetY *= .985;
    targetR *= .985;
    root.style.setProperty("--ashwood-orb-dx", `${currentX.toFixed(2)}px`);
    root.style.setProperty("--ashwood-orb-dy", `${currentY.toFixed(2)}px`);
    root.style.setProperty("--ashwood-orb-rotate", `${currentR.toFixed(2)}deg`);
    root.style.setProperty("--ashwood-orb-inner-x", `${currentInnerX.toFixed(2)}px`);
    root.style.setProperty("--ashwood-orb-inner-y", `${currentInnerY.toFixed(2)}px`);
    root.style.setProperty("--ashwood-orb-inner-r", `${currentInnerR.toFixed(2)}deg`);
    root.style.setProperty("--ashwood-orb-energy", Math.abs(scrollEnergy).toFixed(3));
    frame = (Math.abs(targetX - currentX) + Math.abs(targetY - currentY) + Math.abs(targetR - currentR) > .05)
      ? window.requestAnimationFrame(tick)
      : 0;
  };

  window.addEventListener("pointermove", move, { passive: true });
  window.addEventListener("scroll", scroll, { passive: true });
})();
