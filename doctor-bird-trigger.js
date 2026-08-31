(() => {
  "use strict";

  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/" && path !== "/index.html") return;

  const field = document.querySelector(".principles-field");
  const finePointer = window.matchMedia("(pointer: fine) and (hover: hover)");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!field || !finePointer.matches || reduceMotion.matches) return;

  /* Creating this node before home-flow.js loads intentionally prevents the
     older automatic Doctor Bird installer from mounting. This bird responds
     only to deliberate signal activation. */
  if (document.querySelector(".ashwood-doctor-bird-cursor")) return;

  const bird = document.createElement("div");
  bird.className = "ashwood-doctor-bird-cursor";
  bird.setAttribute("aria-hidden", "true");
  bird.innerHTML = `
    <svg class="ashwood-doctor-bird-cursor__svg" viewBox="0 0 64 40" focusable="false" aria-hidden="true">
      <defs>
        <linearGradient id="ashwood-doctor-bird-body-explicit" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#21a36a"/>
          <stop offset=".48" stop-color="#0a6847"/>
          <stop offset="1" stop-color="#073827"/>
        </linearGradient>
        <linearGradient id="ashwood-doctor-bird-tail-explicit" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stop-color="#111713"/>
          <stop offset=".68" stop-color="#151a16" stop-opacity=".82"/>
          <stop offset="1" stop-color="#151a16" stop-opacity="0"/>
        </linearGradient>
        <radialGradient id="ashwood-doctor-bird-wing-explicit" cx="48%" cy="50%" r="58%">
          <stop offset="0" stop-color="#86d1a7" stop-opacity=".34"/>
          <stop offset=".55" stop-color="#4e9b72" stop-opacity=".16"/>
          <stop offset="1" stop-color="#4e9b72" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <g class="ashwood-doctor-bird-cursor__tails">
        <path d="M27 21 C18 17 9 12 1 8" fill="none" stroke="url(#ashwood-doctor-bird-tail-explicit)" stroke-width="2.1" stroke-linecap="round"/>
        <path d="M27 23 C18 26 10 31 2 36" fill="none" stroke="url(#ashwood-doctor-bird-tail-explicit)" stroke-width="2.1" stroke-linecap="round"/>
      </g>
      <g class="ashwood-doctor-bird-cursor__wing-field">
        <ellipse cx="34" cy="16" rx="15" ry="7" fill="url(#ashwood-doctor-bird-wing-explicit)" transform="rotate(-26 34 16)"/>
        <ellipse cx="35" cy="25" rx="15" ry="7" fill="url(#ashwood-doctor-bird-wing-explicit)" transform="rotate(26 35 25)"/>
      </g>
      <path class="ashwood-doctor-bird-cursor__body" d="M24 18 C30 12 42 12 49 19 C47 27 36 30 27 25 C23 23 22 20 24 18 Z" fill="url(#ashwood-doctor-bird-body-explicit)"/>
      <path d="M31 17 C35 14 41 14 45 17 C40 18 36 20 33 23 C31 21 30 19 31 17 Z" fill="#69b88c" opacity=".45"/>
      <circle cx="48" cy="19" r="4.2" fill="#073125"/>
      <circle cx="49" cy="18" r=".72" fill="#f7c600"/>
      <path class="ashwood-doctor-bird-cursor__bill" d="M51 19 L63 17.8" fill="none" stroke="#c4262e" stroke-width="1.65" stroke-linecap="round"/>
    </svg>`;
  document.body.appendChild(bird);

  const opened = new Set();
  let firstSightingDone = false;
  let completionDone = false;
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
  let leaveTimer = 0;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const hotspotId = (hotspot) => {
    const namedClass = [...hotspot.classList].find((name) => name.startsWith("principle-hotspot--"));
    return namedClass ? namedClass.replace("principle-hotspot--", "") : hotspot.textContent.trim();
  };
  const pointFor = (hotspot) => {
    const rect = hotspot.getBoundingClientRect();
    return {
      x: clamp(rect.left + Math.min(rect.width * .62, 96), 90, window.innerWidth - 90),
      y: clamp(rect.top + Math.min(rect.height * .34, 34) - 18, 72, window.innerHeight - 80)
    };
  };

  const hide = () => {
    visible = false;
    exiting = false;
    bird.classList.remove("is-visible", "is-guide", "is-resolving");
  };

  const flyOut = (final = false) => {
    window.clearTimeout(leaveTimer);
    exiting = true;
    bird.classList.toggle("is-resolving", final);
    targetX = window.innerWidth + 130;
    targetY = clamp(y - (final ? 110 : 52), 42, window.innerHeight - 60);
    leaveTimer = window.setTimeout(hide, final ? 1450 : 1150);
  };

  const arriveAt = (point, final = false) => {
    if (!point) return;
    window.clearTimeout(leaveTimer);
    exiting = false;
    const enterFromRight = point.x < window.innerWidth * .67;
    x = point.x + (enterFromRight ? 180 : -180);
    y = point.y - 70;
    vx = 0;
    vy = 0;
    targetX = point.x;
    targetY = point.y;
    visible = true;
    bird.classList.add("is-visible");
    bird.classList.toggle("is-resolving", final);
    if (!frame) frame = requestAnimationFrame(tick);
    leaveTimer = window.setTimeout(() => flyOut(final), final ? 760 : 1900);
  };

  function tick(now) {
    frame = 0;
    if (!visible) return;

    const spring = exiting ? .105 : .13;
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
    const hoverY = hovering ? Math.sin(now / 185) * 1.1 : 0;
    const hoverX = hovering ? Math.cos(now / 260) * .45 : 0;

    bird.style.transform = `translate3d(${x - 63 + hoverX}px, ${y - 18 + hoverY}px, 0) rotate(${bank}deg)`;
    bird.style.setProperty("--ashwood-bird-tail-x", `${tailX}px`);
    bird.style.setProperty("--ashwood-bird-tail-y", `${tailY}px`);
    bird.style.setProperty("--ashwood-bird-tail-rotate", `${tailRotate}deg`);
    bird.style.setProperty("--ashwood-bird-speed", String(clamp(speed / 9, 0, 1)));

    frame = requestAnimationFrame(tick);
  }

  field.addEventListener("click", (event) => {
    const hotspot = event.target.closest(".principle-hotspot");
    if (!hotspot || !field.contains(hotspot)) return;

    /* The base hotspot handler runs before this deferred script. If the click
       closed the signal, do nothing. Only opening a signal counts. */
    if (!hotspot.classList.contains("is-revealed")) return;

    const id = hotspotId(hotspot);
    const isNewIntentionalOpen = !opened.has(id);
    opened.add(id);
    if (!isNewIntentionalOpen) return;

    if (!firstSightingDone) {
      firstSightingDone = true;
      arriveAt(pointFor(hotspot), false);
      return;
    }

    if (!completionDone && opened.size >= field.querySelectorAll(".principle-hotspot").length) {
      completionDone = true;
      arriveAt(pointFor(hotspot), true);
    }
  });

  const disableIfNeeded = () => {
    if (finePointer.matches && !reduceMotion.matches) return;
    window.clearTimeout(leaveTimer);
    if (frame) cancelAnimationFrame(frame);
    bird.remove();
  };
  finePointer.addEventListener?.("change", disableIfNeeded);
  reduceMotion.addEventListener?.("change", disableIfNeeded);
})();
