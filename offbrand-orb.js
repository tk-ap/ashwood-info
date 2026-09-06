(() => {
  "use strict";

  // Depends on home-native.js having already tagged <body>; both are deferred and
  // home-native.js precedes this file in index.html. Keep that order.
  if (!document.body || !document.body.classList.contains("ashwood-home-native")) return;
  const params = new URLSearchParams(window.location.search);
  if (params.get("ashwood-orb") !== "1") return;

  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = "/offbrand-orb.css?v=20260905-preview2";
  document.head.appendChild(stylesheet);
  document.body.classList.add("ashwood-orb-preview");

  // Own element rather than body::before: theme.js injects its own body::before rules
  // (a scanline layer for phosphor-cyber, `content: none` elsewhere) at a higher
  // specificity, which would suppress this layer in every theme.
  const wash = document.createElement("div");
  wash.className = "ashwood-orb-wash";
  wash.setAttribute("aria-hidden", "true");
  document.body.prepend(wash);

  const orb = document.createElement("div");
  orb.className = "ashwood-orb";
  orb.innerHTML = [
    '<span class="ashwood-orb__body" aria-hidden="true"></span>',
    '<span class="ashwood-orb__ring" aria-hidden="true"></span>',
    '<span class="ashwood-orb__ring ashwood-orb__ring--outer" aria-hidden="true"></span>',
    '<button type="button" class="ashwood-orb__toggle" aria-expanded="false" aria-controls="ashwood-orb-reveal">',
    '<span class="ashwood-orb__toggle-label">Reveal the ASHWOOD field signal</span></button>',
    '<div class="ashwood-orb__reveal" id="ashwood-orb-reveal" role="group" aria-label="ASHWOOD field signal">',
    '<span class="ashwood-orb__reveal-label">FIELD SIGNAL / 01</span>',
    '<strong>The next build is already here.</strong>',
    '<p>Context. Attention. Permission. The hidden structure behind a useful handoff.</p>',
    '<a href="/ai-from-zero/">Enter AI from ZERO &rarr;</a></div>'
  ].join("");
  // Appended, not prepended: the toggle is an ambient affordance and must not take
  // the first tab stop ahead of the masthead.
  document.body.append(orb);

  const toggle = orb.querySelector(".ashwood-orb__toggle");
  const setOpen = (open) => {
    orb.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  };
  orb.addEventListener("mouseenter", () => orb.classList.add("is-proximate"));
  orb.addEventListener("mouseleave", () => { if (!orb.classList.contains("is-open")) orb.classList.remove("is-proximate"); });
  toggle.addEventListener("click", () => setOpen(!orb.classList.contains("is-open")));
  orb.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !orb.classList.contains("is-open")) return;
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
    orb.style.setProperty("--ashwood-orb-dx", `${currentX.toFixed(2)}px`);
    orb.style.setProperty("--ashwood-orb-dy", `${currentY.toFixed(2)}px`);
    orb.style.setProperty("--ashwood-orb-rotate", `${currentR.toFixed(2)}deg`);
    orb.style.setProperty("--ashwood-orb-inner-x", `${currentInnerX.toFixed(2)}px`);
    orb.style.setProperty("--ashwood-orb-inner-y", `${currentInnerY.toFixed(2)}px`);
    orb.style.setProperty("--ashwood-orb-inner-r", `${currentInnerR.toFixed(2)}deg`);
    orb.style.setProperty("--ashwood-orb-energy", Math.abs(scrollEnergy).toFixed(3));
    frame = (Math.abs(targetX - currentX) + Math.abs(targetY - currentY) + Math.abs(targetR - currentR) > .05)
      ? window.requestAnimationFrame(tick)
      : 0;
  };

  window.addEventListener("pointermove", move, { passive: true });
  window.addEventListener("scroll", scroll, { passive: true });
})();
