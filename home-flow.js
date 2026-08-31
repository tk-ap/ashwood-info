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

  /* Event-driven Doctor Bird.
     It is no longer a hover cursor. A visitor earns the first sighting by finding
     the first signal; later, the bird can act as a guide only when the discovery
     system has already decided the visitor is actively searching and stalled. */
  const finePointer = window.matchMedia("(pointer: fine) and (hover: hover)");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const discoveryField = document.querySelector(".principles-field");

  const installDoctorBird = () => {
    if (!discoveryField || !finePointer.matches || reduceMotion.matches) return;
    if (document.querySelector(".ashwood-doctor-bird-cursor")) return;

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

    let targetX = window.innerWidth * .72;
    let targetY = window.innerHeight * .42;
    let x = targetX + 160;
    let y = targetY - 80;
    let vx = 0;
    let vy = 0;
    let bank = 0;
    let tailX = 0;
    let tailY = 0;
    let tailRotate = 0;
    let frame = 0;
    let visible = false;
    let mode = "sighting";
    let hideTimer = 0;
    let armed = false;
    let lastDiscoveredCount = 0;
    let firstSightingDone = false;
    let lastAssistTarget = null;
    let completionDone = false;

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const centerOf = (element) => {
      const rect = element.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + Math.min(rect.height / 2, 34)
      };
    };

    const currentDiscoveredCount = () => discoveryField.querySelectorAll(".principle-hotspot.is-discovered").length;

    const stopLater = (ms = 2200) => {
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => {
        visible = false;
        bird.classList.remove("is-visible", "is-guide", "is-resolving");
      }, ms);
    };

    const spawnTo = (point, nextMode = "sighting", holdMs = 2200) => {
      if (!point || reduceMotion.matches || !finePointer.matches) return;
      mode = nextMode;
      targetX = point.x;
      targetY = point.y;
      if (!visible) {
        const enterFromRight = point.x < window.innerWidth * .66;
        x = point.x + (enterFromRight ? 150 : -150);
        y = point.y - 68;
        vx = 0;
        vy = 0;
      }
      visible = true;
      bird.classList.add("is-visible");
      bird.classList.toggle("is-guide", nextMode === "guide");
      bird.classList.toggle("is-resolving", nextMode === "resolve");
      if (!frame) frame = requestAnimationFrame(tick);
      stopLater(holdMs);
    };

    const resolveAndExit = () => {
      if (completionDone) return;
      completionDone = true;
      const fieldRect = discoveryField.getBoundingClientRect();
      const startPoint = {
        x: clamp(fieldRect.right - 120, 120, window.innerWidth - 120),
        y: clamp(fieldRect.top + Math.min(fieldRect.height * .45, 150), 90, window.innerHeight - 100)
      };
      spawnTo(startPoint, "resolve", 1900);
      window.setTimeout(() => {
        targetX = window.innerWidth + 110;
        targetY = clamp(startPoint.y - 80, 40, window.innerHeight - 80);
      }, 620);
    };

    const tick = (now) => {
      frame = 0;
      if (!visible) return;

      const spring = mode === "guide" ? 0.105 : mode === "resolve" ? 0.12 : 0.135;
      const damping = mode === "guide" ? 0.75 : 0.77;
      vx = (vx + (targetX - x) * spring) * damping;
      vy = (vy + (targetY - y) * spring) * damping;
      x += vx;
      y += vy;

      const speed = Math.hypot(vx, vy);
      const bankTarget = clamp(vx * 1.2, -12, 12);
      bank += (bankTarget - bank) * 0.18;

      const tailXTarget = clamp(-vx * 0.95, -10, 10);
      const tailYTarget = clamp(-vy * 0.5, -5, 5);
      const tailRotateTarget = clamp(-vy * 0.72 - vx * 0.12, -9, 9);
      tailX += (tailXTarget - tailX) * 0.12;
      tailY += (tailYTarget - tailY) * 0.10;
      tailRotate += (tailRotateTarget - tailRotate) * 0.10;

      const hovering = speed < 0.5;
      const hoverY = hovering ? Math.sin(now / 185) * (mode === "guide" ? .72 : 1.25) : 0;
      const hoverX = hovering ? Math.cos(now / 260) * .5 : 0;

      bird.style.transform = `translate3d(${x - 63 + hoverX}px, ${y - 18 + hoverY}px, 0) rotate(${bank}deg)`;
      bird.style.setProperty("--ashwood-bird-tail-x", `${tailX}px`);
      bird.style.setProperty("--ashwood-bird-tail-y", `${tailY}px`);
      bird.style.setProperty("--ashwood-bird-tail-rotate", `${tailRotate}deg`);
      bird.style.setProperty("--ashwood-bird-speed", String(clamp(speed / 9, 0, 1)));

      frame = requestAnimationFrame(tick);
    };

    /* Let curiosity.js settle remembered discoveries before arming. A returning
       visitor should not get an unearned bird animation on page load. */
    window.setTimeout(() => {
      lastDiscoveredCount = currentDiscoveredCount();
      firstSightingDone = lastDiscoveredCount > 0;
      completionDone = body.classList.contains("has-found-all-hotspots");
      armed = true;
    }, 720);

    const discoveryObserver = new MutationObserver((mutations) => {
      if (!armed) return;

      const count = currentDiscoveredCount();
      if (count > lastDiscoveredCount) {
        const newest = [...discoveryField.querySelectorAll(".principle-hotspot.is-discovered")]
          .find((hotspot) => mutations.some((mutation) => mutation.target === hotspot));

        if (!firstSightingDone && count === 1 && newest) {
          firstSightingDone = true;
          spawnTo(centerOf(newest), "sighting", 2500);
        }
        lastDiscoveredCount = count;
      }

      const assistTarget = discoveryField.querySelector(".principle-hotspot.is-assist-pulse");
      if (assistTarget && assistTarget !== lastAssistTarget) {
        lastAssistTarget = assistTarget;
        spawnTo(centerOf(assistTarget), "guide", 3600);
      } else if (!assistTarget) {
        lastAssistTarget = null;
      }
    });
    discoveryObserver.observe(discoveryField, { attributes: true, attributeFilter: ["class"], subtree: true });

    const completionObserver = new MutationObserver(() => {
      if (!armed || completionDone) return;
      if (body.classList.contains("has-found-all-hotspots")) resolveAndExit();
    });
    completionObserver.observe(body, { attributes: true, attributeFilter: ["class"] });

    const disableIfNeeded = () => {
      if (finePointer.matches && !reduceMotion.matches) return;
      visible = false;
      bird.remove();
      window.clearTimeout(hideTimer);
      if (frame) cancelAnimationFrame(frame);
      discoveryObserver.disconnect();
      completionObserver.disconnect();
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

  document.addEventListener("ashwood:open-capability-map", () => setTimeout(requestProgress, 80));
  document.addEventListener("ashwood:hotspot-found", () => setTimeout(requestProgress, 80));

  const revealEverything = () => {
    if (!reduceMotion.matches) return;
    document.querySelectorAll(".ashwood-flow-reveal").forEach((element) => element.classList.add("is-flow-visible"));
  };
  if (typeof reduceMotion.addEventListener === "function") reduceMotion.addEventListener("change", revealEverything);
})();