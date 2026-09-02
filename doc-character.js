(() => {
  "use strict";

  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/" && path !== "/index.html") return;
  if (window.AshwoodDocCharacter) return;

  const coarse = matchMedia("(max-width:760px), (pointer:coarse)");
  const fine = matchMedia("(pointer:fine) and (hover:hover)");
  const reduce = matchMedia("(prefers-reduced-motion:reduce)");
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const rand = (min, max) => min + Math.random() * (max - min);
  const chance = (probability) => Math.random() < probability;
  const length = (v) => Math.hypot(v.x, v.y);
  const normalize = (v) => {
    const d = Math.hypot(v.x, v.y) || 1;
    return { x: v.x / d, y: v.y / d };
  };
  const lerp = (a, b, t) => a + (b - a) * t;
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const style = document.createElement("style");
  style.textContent = `
    .ashwood-doctor-bird-cursor.ashwood-doc-character {
      display:block !important;
      position:fixed !important;
      left:0 !important;
      top:0 !important;
      z-index:625 !important;
      width:clamp(148px,14vw,210px) !important;
      aspect-ratio:360/247;
      opacity:0;
      visibility:hidden;
      pointer-events:none !important;
      transform-origin:68% 51%;
      will-change:transform,opacity;
      transition:opacity .34s ease,visibility 0s linear .36s;
      filter:drop-shadow(0 9px 20px rgba(0,0,0,.24));
      contain:layout style;
    }
    .ashwood-doctor-bird-cursor.ashwood-doc-character.is-present {
      opacity:1 !important;
      visibility:visible !important;
      transition-delay:0s;
    }
    .ashwood-doctor-bird-cursor.ashwood-doc-character.can-interact {
      pointer-events:auto !important;
      cursor:help;
    }
    .ashwood-doc-character > img:not(.ashwood-doc-character__wing-trace) {
      display:block;
      width:100%;
      height:100%;
      object-fit:contain;
      animation:none !important;
      transform:none !important;
      filter:saturate(1.03) contrast(1.02);
    }
    .ashwood-doc-character__wing-trace {
      position:absolute !important;
      inset:0 !important;
      width:100% !important;
      height:100% !important;
      object-fit:contain;
      pointer-events:none !important;
      clip-path:polygon(7% 0,83% 0,80% 57%,17% 59%);
      transform-origin:64% 55%;
      opacity:var(--doc-wing-opacity,.07);
      animation:ashwood-doc-character-wing var(--doc-wing-duration,108ms) linear infinite alternate !important;
      filter:blur(.35px);
    }
    .ashwood-doc-character__wing-trace--far {
      opacity:calc(var(--doc-wing-opacity,.07) * .55);
      animation-direction:alternate-reverse !important;
      transform-origin:61% 54%;
    }
    @keyframes ashwood-doc-character-wing {
      from { transform:rotate(-5deg) scaleY(.88); }
      to { transform:rotate(7deg) scaleY(1.04); }
    }
    .ashwood-doc-character-fact {
      position:fixed;
      z-index:646;
      width:min(254px,calc(100vw - 32px));
      box-sizing:border-box;
      padding:10px 12px 11px;
      border:1px solid color-mix(in srgb,var(--ashwood-field-green,#009b3a) 34%,var(--ashwood-rule));
      background:color-mix(in srgb,var(--ashwood-paper) 97%,transparent);
      color:var(--ashwood-ink);
      box-shadow:0 12px 34px #0002;
      opacity:0;
      transform:translateY(5px);
      pointer-events:none;
      transition:opacity .18s ease,transform .22s ease;
      backdrop-filter:blur(12px);
    }
    .ashwood-doc-character-fact.is-visible { opacity:1; transform:none; }
    .ashwood-doc-character-fact__label {
      display:block;
      margin-bottom:5px;
      color:var(--ashwood-field-green,#009b3a);
      font:700 7px/1 Arial,Helvetica,sans-serif;
      letter-spacing:.16em;
      text-transform:uppercase;
    }
    .ashwood-doc-character-fact__copy {
      display:block;
      font:500 10px/1.45 Arial,Helvetica,sans-serif;
    }
    @media (max-width:760px),(pointer:coarse) {
      .ashwood-doctor-bird-cursor.ashwood-doc-character {
        display:block !important;
        width:132px !important;
        pointer-events:none !important;
      }
      .ashwood-doc-character-fact { display:none !important; }
    }
    @media (prefers-reduced-motion:reduce) {
      .ashwood-doctor-bird-cursor.ashwood-doc-character {
        transition:opacity .2s ease !important;
      }
      .ashwood-doc-character__wing-trace { display:none !important; }
    }
  `;
  document.head.appendChild(style);

  const facts = [
    "The Doctor Bird is Jamaica’s national bird — the red-billed streamertail.",
    "The red-billed streamertail is endemic to Jamaica; the island is its wild home.",
    "Male red-billed streamertails grow two long black tail feathers called streamers.",
    "ASHWOOD’s XAYMACA detail points to a Taíno name associated with Jamaica, commonly rendered as ‘land of wood and water.’"
  ];

  let bird = null;
  let launcher = null;
  let panel = null;
  let fact = null;
  let initialized = false;
  let state = "REST";
  let guideActive = false;
  let guideIndex = 0;
  let guideTarget = null;
  let guideMarker = null;
  let behaviorToken = 0;
  let segmentToken = 0;
  let segmentResolve = null;
  let trajectory = null;
  let visible = false;
  let facing = 1;
  let bank = 0;
  let lastFrame = performance.now();
  let lastVelocity = { x: 0, y: 0 };
  let position = { x: innerWidth + 130, y: innerHeight * .28 };
  let velocity = { x: 0, y: 0 };
  let restPoint = { ...position };
  let nextDecisionAt = performance.now() + rand(4500, 8500);
  let reactionTimer = 0;
  let lastStimulusAt = 0;
  let lastPointer = null;
  let pointerSpeed = 0;
  let pointerCooldownUntil = 0;
  let factIndex = 0;
  let factTimer = 0;
  let hiddenUntil = 0;
  const phase = { x: rand(0, Math.PI * 2), y: rand(0, Math.PI * 2), r: rand(0, Math.PI * 2) };

  const semanticAnchors = () => [
    { name: "intro", el: document.querySelector(".intro"), weight: 1.05 },
    { name: "capabilities", el: document.querySelector("#throughline,.principles-field"), weight: 1.15 },
    { name: "portfolio", el: document.querySelector('.home-entryway[data-kind="modeling"]'), weight: .85 },
    { name: "builds", el: document.querySelector('.home-entryway[data-kind="builds"]'), weight: 1 },
    { name: "about", el: document.querySelector('.home-closing a[href*="/about"]')?.closest(".home-closing"), weight: .72 },
    { name: "contact", el: document.querySelector('.home-closing a[href*="/connect"]')?.closest(".home-closing"), weight: .72 }
  ].filter((anchor) => anchor.el && anchor.el.getBoundingClientRect().width > 0);

  const visibleAnchors = () => semanticAnchors().filter(({ el }) => {
    const r = el.getBoundingClientRect();
    return r.bottom > innerHeight * .12 && r.top < innerHeight * .88;
  });

  const weightedPick = (items) => {
    if (!items.length) return null;
    const total = items.reduce((sum, item) => sum + (item.weight || 1), 0);
    let n = Math.random() * total;
    for (const item of items) {
      n -= item.weight || 1;
      if (n <= 0) return item;
    }
    return items[items.length - 1];
  };

  const pointNear = (el, mode = "inspect") => {
    const r = el.getBoundingClientRect();
    const mobile = coarse.matches;
    const marginX = mobile ? 64 : 104;
    const width = bird?.getBoundingClientRect().width || (mobile ? 132 : 180);
    const roomRight = innerWidth - r.right;
    const roomLeft = r.left;
    let side = 1;
    if (roomRight < width * .62 + 26 && roomLeft > roomRight) side = -1;
    if (mode === "rest" && chance(.35)) side *= -1;
    let x;
    if (mobile) {
      x = side > 0 ? innerWidth - 68 : 68;
    } else {
      x = side > 0
        ? r.right + Math.min(68, Math.max(38, roomRight * .42))
        : r.left - Math.min(68, Math.max(38, roomLeft * .42));
    }
    const yFraction = mode === "guide" ? rand(.16, .27) : mode === "rest" ? rand(.12, .25) : rand(.2, .34);
    const y = r.top + Math.min(r.height * yFraction, mode === "guide" ? 116 : 148);
    return {
      x: clamp(x, marginX, innerWidth - marginX),
      y: clamp(y, mobile ? 84 : 92, innerHeight - (mobile ? 118 : 96))
    };
  };

  const neutralPoint = () => {
    const candidates = visibleAnchors();
    const anchor = weightedPick(candidates) || weightedPick(semanticAnchors());
    if (anchor) return pointNear(anchor.el, "rest");
    return { x: innerWidth * .82, y: innerHeight * .24 };
  };

  const setState = (next) => {
    state = next;
    if (!bird) return;
    bird.dataset.docState = next;
    const interactive = fine.matches && ["REST", "OBSERVE", "INSPECT", "GUIDE", "PERCH"].includes(next) && visible;
    bird.classList.toggle("can-interact", interactive);
    document.dispatchEvent(new CustomEvent("ashwood:doc-state", { detail: { state: next } }));
  };

  const showBird = () => {
    if (!bird) return;
    visible = true;
    bird.classList.add("is-present", "is-visible");
  };

  const hideBird = () => {
    if (!bird) return;
    visible = false;
    bird.classList.remove("is-present", "is-visible", "can-interact");
  };

  const cubic = (p0, p1, p2, p3, t) => {
    const u = 1 - t;
    const uu = u * u;
    const tt = t * t;
    return {
      x: uu * u * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + tt * t * p3.x,
      y: uu * u * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + tt * t * p3.y
    };
  };

  const cubicDerivative = (p0, p1, p2, p3, t) => {
    const u = 1 - t;
    return {
      x: 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x),
      y: 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y)
    };
  };

  const sampleTrajectory = (now) => {
    if (!trajectory) return false;
    const t = clamp((now - trajectory.start) / trajectory.duration, 0, 1);
    const p = cubic(trajectory.p0, trajectory.p1, trajectory.p2, trajectory.p3, t);
    const d = cubicDerivative(trajectory.p0, trajectory.p1, trajectory.p2, trajectory.p3, t);
    position = p;
    velocity = { x: d.x / (trajectory.duration / 1000), y: d.y / (trajectory.duration / 1000) };
    if (t >= 1) {
      position = { ...trajectory.p3 };
      const resolve = segmentResolve;
      segmentResolve = null;
      trajectory = null;
      resolve?.(true);
    }
    return true;
  };

  const cancelSegment = () => {
    if (!trajectory) return;
    sampleTrajectory(performance.now());
    trajectory = null;
    segmentResolve?.(false);
    segmentResolve = null;
    segmentToken += 1;
  };

  const segmentTo = (destination, options = {}) => new Promise((resolve) => {
    const now = performance.now();
    sampleTrajectory(now);
    if (segmentResolve) segmentResolve(false);
    const token = ++segmentToken;
    segmentResolve = (value) => { if (token === segmentToken) resolve(value); else resolve(false); };
    const p0 = { ...position };
    const delta = { x: destination.x - p0.x, y: destination.y - p0.y };
    const distance = Math.max(1, length(delta));
    const direction = normalize(delta);
    const perpendicular = { x: -direction.y, y: direction.x };
    const duration = options.duration || clamp(distance * rand(3.1, 4.2), coarse.matches ? 700 : 760, coarse.matches ? 1500 : 1650);
    const seconds = duration / 1000;
    const continuity = { x: velocity.x * seconds / 3, y: velocity.y * seconds / 3 };
    const maxContinuity = Math.min(distance * .32, 118);
    const continuityLength = length(continuity);
    if (continuityLength > maxContinuity) {
      const c = normalize(continuity);
      continuity.x = c.x * maxContinuity;
      continuity.y = c.y * maxContinuity;
    }
    const arc = options.softStop ? rand(4, 12) : rand(Math.min(18, distance * .05), Math.min(72, Math.max(24, distance * .17)));
    const arcSign = options.arcSign || (chance(.5) ? 1 : -1);
    const p1 = { x: p0.x + continuity.x, y: p0.y + continuity.y };
    const endLead = options.softStop ? 0 : Math.min(26, distance * .1);
    const p2 = {
      x: destination.x - direction.x * endLead + perpendicular.x * arc * arcSign,
      y: destination.y - direction.y * endLead + perpendicular.y * arc * arcSign
    };
    if (options.softStop) {
      p2.x = destination.x;
      p2.y = destination.y;
    }
    trajectory = { p0, p1, p2, p3: { ...destination }, start: now, duration };
  });

  const moveToPoint = async (destination, options = {}) => {
    const token = ++behaviorToken;
    clearTimeout(reactionTimer);
    showBird();
    const speed = length(velocity);
    const dx = destination.x - position.x;
    if (speed < 34 && Math.abs(dx) > 18) facing = dx >= 0 ? 1 : -1;
    setState("NOTICE");
    const delay = options.delay ?? rand(options.guide ? 170 : 260, options.guide ? 360 : 760);
    if (delay > 0) await sleep(delay);
    if (token !== behaviorToken) return false;
    setState(options.guide ? "GUIDE" : "APPROACH");
    const delta = { x: destination.x - position.x, y: destination.y - position.y };
    const dir = normalize(delta);
    const overshootDistance = options.guide ? rand(7, 14) : rand(9, 22);
    const overshoot = { x: destination.x + dir.x * overshootDistance, y: destination.y + dir.y * overshootDistance };
    const first = await segmentTo(overshoot, { arcSign: chance(.5) ? 1 : -1 });
    if (!first || token !== behaviorToken) return false;
    setState(options.guide ? "GUIDE" : "INSPECT");
    const corrected = await segmentTo(destination, { duration: rand(260, 390), softStop: true });
    if (!corrected || token !== behaviorToken) return false;
    position = { ...destination };
    restPoint = { ...destination };
    velocity = { x: 0, y: 0 };
    setState(options.guide ? "GUIDE" : (options.perch ? "PERCH" : "INSPECT"));
    return true;
  };

  const stimulate = (anchorEl, options = {}) => {
    if (!anchorEl || !initialized) return Promise.resolve(false);
    const now = performance.now();
    const force = !!options.force;
    const priority = options.priority ?? .5;
    if (!force) {
      if (guideActive || now < hiddenUntil || now - lastStimulusAt < rand(2600, 5200)) return Promise.resolve(false);
      const respondProbability = clamp(priority * rand(.62, .95), .08, .82);
      if (!chance(respondProbability)) return Promise.resolve(false);
    }
    lastStimulusAt = now;
    const point = pointNear(anchorEl, options.guide ? "guide" : "inspect");
    return moveToPoint(point, { guide: !!options.guide, delay: options.delay, perch: !!options.perch });
  };

  const retreat = async (far = false) => {
    if (!initialized || guideActive) return false;
    const token = ++behaviorToken;
    setState("RETREAT");
    const direction = facing > 0 ? 1 : -1;
    const destination = far
      ? { x: direction > 0 ? innerWidth + 110 : -110, y: clamp(position.y - rand(40, 120), 70, innerHeight - 100) }
      : {
          x: clamp(position.x - direction * rand(76, 145), 84, innerWidth - 84),
          y: clamp(position.y + rand(-78, 42), 82, innerHeight - 104)
        };
    const moved = await segmentTo(destination, { arcSign: direction > 0 ? -1 : 1 });
    if (!moved || token !== behaviorToken) return false;
    if (far) {
      hideBird();
      hiddenUntil = performance.now() + rand(7000, 14000);
      setState("REST");
    } else {
      restPoint = { ...destination };
      velocity = { x: 0, y: 0 };
      setState("REST");
    }
    return true;
  };

  const wakeAtNeutral = async () => {
    if (!initialized || guideActive || performance.now() < hiddenUntil) return;
    const point = neutralPoint();
    if (!visible) {
      const side = point.x > innerWidth / 2 ? 1 : -1;
      position = { x: side > 0 ? innerWidth + 96 : -96, y: clamp(point.y - rand(30, 76), 70, innerHeight - 90) };
      restPoint = { ...position };
      velocity = { x: 0, y: 0 };
      facing = side > 0 ? -1 : 1;
    }
    await moveToPoint(point, { delay: rand(120, 340), perch: chance(.35) });
    nextDecisionAt = performance.now() + rand(6500, 12500);
  };

  const autonomousDecision = () => {
    if (!initialized || guideActive || trajectory || reactionTimer || reduce.matches) return;
    const now = performance.now();
    if (now < nextDecisionAt || now < hiddenUntil) return;
    nextDecisionAt = now + rand(6500, 14000);
    const roll = Math.random();
    if (roll < .53) {
      setState(chance(.28) ? "PERCH" : "OBSERVE");
      restPoint = { ...position };
      return;
    }
    if (roll < .76) {
      const anchor = weightedPick(visibleAnchors());
      if (anchor) stimulate(anchor.el, { priority: .72 });
      return;
    }
    if (roll < .91) {
      retreat(false);
      return;
    }
    retreat(true);
  };

  const render = (now) => {
    if (!initialized || !bird) return requestAnimationFrame(render);
    const dt = clamp((now - lastFrame) / 1000, 0, .05);
    lastFrame = now;
    sampleTrajectory(now);

    const speed = length(velocity);
    const acceleration = {
      x: (velocity.x - lastVelocity.x) / Math.max(dt, .001),
      y: (velocity.y - lastVelocity.y) / Math.max(dt, .001)
    };
    lastVelocity = { ...velocity };

    if (!trajectory && visible) {
      const amplitude = state === "INSPECT" || state === "GUIDE" ? 2.7 : state === "OBSERVE" ? 1.6 : state === "PERCH" ? .45 : 1.05;
      position.x = lerp(position.x, restPoint.x, 1 - Math.exp(-dt * 2.4));
      position.y = lerp(position.y, restPoint.y, 1 - Math.exp(-dt * 2.4));
      velocity.x *= Math.exp(-dt * 5.5);
      velocity.y *= Math.exp(-dt * 5.5);
      const driftX = Math.sin(now / 1730 + phase.x) * amplitude + Math.sin(now / 3110 + phase.r) * amplitude * .32;
      const driftY = Math.sin(now / 1310 + phase.y) * amplitude * .72 + Math.cos(now / 2570 + phase.x) * amplitude * .26;
      bird.style.setProperty("--doc-drift-x", `${driftX}px`);
      bird.style.setProperty("--doc-drift-y", `${driftY}px`);
    } else {
      bird.style.setProperty("--doc-drift-x", "0px");
      bird.style.setProperty("--doc-drift-y", "0px");
    }

    if (speed > 42) {
      const desiredFacing = velocity.x >= 0 ? 1 : -1;
      if (desiredFacing !== facing && speed < 86) facing = desiredFacing;
    }
    const desiredBank = clamp(velocity.y * .009 + acceleration.y * .00012 - acceleration.x * .00005 * facing, -5.2, 5.2);
    bank += (desiredBank - bank) * (1 - Math.exp(-dt * 5.4));

    const driftX = parseFloat(bird.style.getPropertyValue("--doc-drift-x")) || 0;
    const driftY = parseFloat(bird.style.getPropertyValue("--doc-drift-y")) || 0;
    const w = bird.getBoundingClientRect().width || 180;
    const h = bird.getBoundingClientRect().height || 124;
    bird.style.transform = `translate3d(${position.x - w * .68 + driftX}px,${position.y - h * .51 + driftY}px,0) rotate(${bank}deg) scaleX(${facing})`;

    const wingDuration = clamp(118 - speed * .07, 64, state === "PERCH" ? 138 : 118);
    const wingOpacity = state === "PERCH" ? .025 : state === "REST" ? .045 : clamp(.055 + speed / 3300, .055, .14);
    bird.style.setProperty("--doc-wing-duration", `${wingDuration}ms`);
    bird.style.setProperty("--doc-wing-opacity", `${wingOpacity}`);

    autonomousDecision();
    requestAnimationFrame(render);
  };

  const hideFact = () => {
    clearTimeout(factTimer);
    fact?.classList.remove("is-visible");
  };

  const positionFact = () => {
    if (!fact || !bird || !fine.matches) return;
    const r = bird.getBoundingClientRect();
    const width = Math.min(254, innerWidth - 32);
    const left = clamp(r.left + r.width * .5 - width * .5, 16, innerWidth - width - 16);
    const below = r.bottom + 10;
    const top = below + 92 < innerHeight ? below : Math.max(16, r.top - 96);
    fact.style.left = `${left}px`;
    fact.style.top = `${top}px`;
  };

  const showFact = () => {
    if (!fact || !fine.matches || !visible) return;
    clearTimeout(factTimer);
    fact.querySelector(".ashwood-doc-character-fact__copy").textContent = facts[factIndex++ % facts.length];
    positionFact();
    fact.classList.add("is-visible");
    if (!guideActive && chance(.48)) {
      factTimer = setTimeout(() => {
        hideFact();
        if (!trajectory && !guideActive) retreat(false);
      }, rand(1500, 2400));
    }
  };

  const clearGuideTarget = () => {
    guideTarget?.classList.remove("ashwood-doc-targeted");
    guideMarker?.remove();
    guideTarget = null;
    guideMarker = null;
  };

  const markGuideTarget = (el) => {
    clearGuideTarget();
    guideTarget = el;
    guideTarget.classList.add("ashwood-doc-targeted");
    if (!coarse.matches) {
      guideMarker = document.createElement("span");
      guideMarker.className = "ashwood-doc-reference-marker";
      guideMarker.textContent = "DOC / HERE";
      guideTarget.appendChild(guideMarker);
    }
  };

  const guideStops = [
    [".intro", "DOC / 01 / ORIENTATION", "Follow the idea.", "ASHWOOD begins with curiosity: modeling, music, products, and systems are different forms the same point of view can take."],
    [".ashwood-home-thesis", "DOC / 02 / INSTINCT", "Notice what should exist next.", "The recurring instinct is to identify the missing condition, then build what lets a different outcome become possible."],
    ["#throughline,.principles-field", "DOC / 03 / THROUGHLINE", "The method keeps returning.", "Anticipation, diagnosis, translation, systems, adaptation, and synthesis describe how the work moves."],
    [".home-entryways", "DOC / 04 / BECOMINGS", "Then the pattern becomes something.", "Modeling, music, and builds are different manifestations — not separate identities competing for space."],
    [".home-now-editorial", "DOC / 05 / NOW", "The practice stays live.", "The Build Journal keeps the beliefs, reversals, evidence, failures, and decisions behind what is being made now."],
    [".home-closing", "DOC / 06 / CONTINUE", "Come make something.", "Choose a thread: collaborate, listen, follow the work, or go deeper into the practice."]
  ];

  const waitForScroll = () => new Promise((resolve) => {
    if (reduce.matches) return resolve();
    let doneTimer = 0;
    let hardTimer = 0;
    const finish = () => {
      clearTimeout(doneTimer);
      clearTimeout(hardTimer);
      removeEventListener("scroll", onScroll);
      resolve();
    };
    const onScroll = () => {
      clearTimeout(doneTimer);
      doneTimer = setTimeout(finish, 135);
    };
    addEventListener("scroll", onScroll, { passive: true });
    doneTimer = setTimeout(finish, coarse.matches ? 480 : 360);
    hardTimer = setTimeout(finish, 1200);
  });

  const showGuidePanel = (stop) => {
    panel.querySelector(".ashwood-doc-editorial-panel__eyebrow").textContent = stop[1];
    panel.querySelector(".ashwood-doc-editorial-panel__title").textContent = stop[2];
    panel.querySelector(".ashwood-doc-editorial-panel__copy").textContent = stop[3];
    panel.querySelector(".count").textContent = `${String(guideIndex + 1).padStart(2, "0")} / 06`;
    panel.querySelector(".back").disabled = guideIndex === 0;
    panel.querySelector(".next").textContent = guideIndex === guideStops.length - 1 ? "Finish →" : "Next →";
    panel.hidden = false;
  };

  const renderGuide = async () => {
    const stop = guideStops[guideIndex];
    const el = document.querySelector(stop[0]);
    if (!el || !guideActive) return;
    panel.hidden = true;
    markGuideTarget(el);
    el.scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth", block: "center" });
    await waitForScroll();
    if (!guideActive) return;
    if (reduce.matches) {
      showBird();
      position = { x: innerWidth - (coarse.matches ? 66 : 104), y: coarse.matches ? 92 : 104 };
      restPoint = { ...position };
      setState("GUIDE");
      showGuidePanel(stop);
      return;
    }
    await stimulate(el, { force: true, guide: true, priority: 1, delay: rand(170, 320) });
    if (!guideActive) return;
    showGuidePanel(stop);
  };

  const startGuide = () => {
    if (!initialized || guideActive) return;
    guideActive = true;
    guideIndex = 0;
    behaviorToken += 1;
    cancelSegment();
    launcher.hidden = true;
    showBird();
    renderGuide();
  };

  const endGuide = () => {
    if (!guideActive) return;
    guideActive = false;
    panel.hidden = true;
    launcher.hidden = false;
    clearGuideTarget();
    hideFact();
    setState("OBSERVE");
    nextDecisionAt = performance.now() + rand(4500, 8500);
    setTimeout(() => {
      if (!guideActive && !trajectory) {
        const point = neutralPoint();
        moveToPoint(point, { delay: rand(160, 420), perch: chance(.4) });
      }
    }, rand(320, 720));
  };

  const nextGuide = () => {
    if (!guideActive) return;
    if (guideIndex >= guideStops.length - 1) return endGuide();
    guideIndex += 1;
    behaviorToken += 1;
    cancelSegment();
    renderGuide();
  };

  const backGuide = () => {
    if (!guideActive || guideIndex === 0) return;
    guideIndex -= 1;
    behaviorToken += 1;
    cancelSegment();
    renderGuide();
  };

  const installEnvironmentalSignals = () => {
    const semanticSelector = '.home-entryway,.ashwood-home-thesis,.principles-field,.ashwood-throughline-native,.home-now-editorial,.home-closing';
    document.addEventListener("pointerdown", (event) => {
      const target = event.target.closest?.(semanticSelector);
      if (!target || guideActive) return;
      stimulate(target, { priority: .76, delay: rand(240, 620) });
    }, { passive: true });

    document.addEventListener("pointerover", (event) => {
      if (!fine.matches || guideActive) return;
      const target = event.target.closest?.(semanticSelector);
      if (!target || target.contains(event.relatedTarget)) return;
      stimulate(target, { priority: .31, delay: rand(420, 900) });
    }, { passive: true });

    document.addEventListener("pointermove", (event) => {
      const now = performance.now();
      if (lastPointer) {
        const dt = Math.max(12, now - lastPointer.t);
        const instantaneous = Math.hypot(event.clientX - lastPointer.x, event.clientY - lastPointer.y) / dt;
        pointerSpeed = pointerSpeed * .78 + instantaneous * .22;
      }
      lastPointer = { x: event.clientX, y: event.clientY, t: now };
      if (!fine.matches || guideActive || !visible || now < pointerCooldownUntil) return;
      const distanceToBird = Math.hypot(event.clientX - position.x, event.clientY - position.y);
      if (distanceToBird < 125 && pointerSpeed > .42 && chance(.17)) {
        pointerCooldownUntil = now + rand(3200, 6200);
        reactionTimer = setTimeout(() => {
          reactionTimer = 0;
          if (!guideActive && !trajectory) retreat(false);
        }, rand(260, 720));
      } else if (pointerSpeed > 1.15 && distanceToBird < 250 && chance(.08)) {
        setState("NOTICE");
        nextDecisionAt = Math.max(nextDecisionAt, now + rand(1600, 3200));
      }
    }, { passive: true });

    const observer = new IntersectionObserver((entries) => {
      if (guideActive || trajectory || reduce.matches) return;
      for (const entry of entries) {
        if (!entry.isIntersecting || entry.intersectionRatio < .52) continue;
        if (chance(.14)) {
          stimulate(entry.target, { priority: .27, delay: rand(650, 1250) });
          break;
        }
      }
    }, { threshold: [.52, .7] });
    semanticAnchors().forEach(({ el }) => observer.observe(el));

    let inactivityTimer = 0;
    const resetInactivity = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        if (!guideActive && !trajectory && visible) {
          setState("PERCH");
          restPoint = { ...position };
          nextDecisionAt = performance.now() + rand(7000, 13000);
        }
      }, 11500);
    };
    ["pointermove", "keydown", "scroll", "touchstart"].forEach((name) => addEventListener(name, resetInactivity, { passive: true }));
    resetInactivity();
  };

  const takeover = () => {
    if (initialized) return true;
    const originalBird = document.querySelector(".ashwood-doctor-bird-cursor");
    const originalLauncher = document.querySelector(".ashwood-doc-editorial-launcher");
    const originalPanel = document.querySelector(".ashwood-doc-editorial-panel");
    if (!originalBird || !originalLauncher || !originalPanel || !originalBird.querySelector("img")) return false;

    bird = originalBird.cloneNode(true);
    bird.querySelectorAll(".ashwood-doc-wing-trace").forEach((node) => node.remove());
    bird.removeAttribute("style");
    bird.className = "ashwood-doctor-bird-cursor ashwood-doc-character";
    bird.removeAttribute("aria-hidden");
    bird.setAttribute("aria-label", "Doctor Bird — ASHWOOD guide. Hover for a Jamaica fact.");
    bird.tabIndex = fine.matches ? 0 : -1;
    const rendered = bird.querySelector("img");
    const near = rendered.cloneNode(true);
    const far = rendered.cloneNode(true);
    near.removeAttribute("id");
    far.removeAttribute("id");
    near.removeAttribute("alt");
    far.removeAttribute("alt");
    near.setAttribute("aria-hidden", "true");
    far.setAttribute("aria-hidden", "true");
    near.className = "ashwood-doc-character__wing-trace ashwood-doc-character__wing-trace--near";
    far.className = "ashwood-doc-character__wing-trace ashwood-doc-character__wing-trace--far";
    bird.append(far, near);
    originalBird.replaceWith(bird);

    launcher = originalLauncher.cloneNode(true);
    originalLauncher.replaceWith(launcher);
    panel = originalPanel.cloneNode(true);
    originalPanel.replaceWith(panel);
    panel.hidden = true;
    document.querySelectorAll(".ashwood-doc-fact").forEach((node) => node.remove());
    document.querySelectorAll("[data-ashwood-bird-guide]").forEach((node) => node.removeAttribute("data-ashwood-bird-guide"));
    document.querySelectorAll(".ashwood-jm-bird").forEach((node) => node.remove());

    fact = document.createElement("aside");
    fact.className = "ashwood-doc-character-fact";
    fact.setAttribute("aria-live", "polite");
    fact.innerHTML = '<span class="ashwood-doc-character-fact__label">DOC’S NOTE / EASTER EGG</span><span class="ashwood-doc-character-fact__copy"></span>';
    if (fine.matches) document.body.appendChild(fact);

    launcher.addEventListener("click", startGuide);
    panel.querySelector(".next").addEventListener("click", nextGuide);
    panel.querySelector(".back").addEventListener("click", backGuide);
    panel.querySelector(".exit").addEventListener("click", endGuide);
    document.addEventListener("keydown", (event) => {
      if (!guideActive) return;
      if (event.key === "Escape") endGuide();
      else if (event.key === "ArrowRight") { event.preventDefault(); nextGuide(); }
      else if (event.key === "ArrowLeft") { event.preventDefault(); backGuide(); }
    });

    if (fine.matches) {
      bird.addEventListener("mouseenter", showFact);
      bird.addEventListener("mouseleave", hideFact);
      bird.addEventListener("focus", showFact);
      bird.addEventListener("blur", hideFact);
    }

    initialized = true;
    window.AshwoodDocCharacter = {
      get state() { return state; },
      get guideActive() { return guideActive; },
      bird,
      stimulate,
      startGuide,
      endGuide,
      retreat,
      wake: wakeAtNeutral
    };
    document.dispatchEvent(new CustomEvent("ashwood:doc-character-ready"));
    installEnvironmentalSignals();

    if (reduce.matches) {
      setState("REST");
      hideBird();
    } else {
      setTimeout(() => {
        if (!guideActive) wakeAtNeutral();
      }, coarse.matches ? rand(1800, 3200) : rand(1250, 2600));
    }
    requestAnimationFrame(render);
    return true;
  };

  if (!takeover()) {
    const observer = new MutationObserver(() => {
      if (takeover()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 8000);
  }
})();