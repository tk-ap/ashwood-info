(() => {
  const key = "ashwood.theme";
  const root = document.documentElement;
  let light = false;
  try { light = localStorage.getItem(key) === "light"; } catch (_) {}
  root.classList.toggle("ashwood-light", light);

  const primaryRoutes = [
    { path: "/portfolio", label: "Modeling" },
    { path: "/music", label: "Music" },
    { path: "/journal", label: "Builds" },
    { path: "/about", label: "About" },
    { path: "/connect", label: "Connect" }
  ];

  const normalizedPath = window.location.pathname.replace(/\/$/, "") || "/";
  if (normalizedPath === "/journal") import("/journal/alvira-current.js").catch(() => {});
  const currentRoute = primaryRoutes.find(({ path }) => normalizedPath === path);

  const ensureSharedHeaderStyles = () => {
    if (!currentRoute || document.querySelector('link[href^="/creative-shell.css"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/creative-shell.css?v=20260828-interior1";
    document.head.append(link);
  };

  const buildSharedHeader = () => {
    if (!currentRoute) return null;
    const existingShared = document.querySelector(".ashwood-site-header");
    if (existingShared) return existingShared;

    const header = document.createElement("header");
    header.className = "ashwood-site-header";
    header.setAttribute("aria-label", "ASHWOOD navigation");
    header.innerHTML = `
      <div class="ashwood-site-header__brand-lockup">
        <a class="ashwood-site-header__brand" href="/" aria-label="ASHWOOD home">ASHWOOD</a>
        <span class="ashwood-site-header__section">/ ${currentRoute.label.toUpperCase()}</span>
      </div>
      <nav class="ashwood-site-header__nav" aria-label="Primary">
        ${primaryRoutes.map(({ path, label }) => `<a${path === currentRoute.path ? ' aria-current="page"' : ''} href="${path}">${label}</a>`).join("")}
      </nav>`;

    const legacyHeader = document.querySelector(".journal-masthead,.masthead,.site-header");
    const main = document.querySelector("main");
    if (legacyHeader) legacyHeader.remove();
    if (main) document.body.insertBefore(header, main);
    else document.body.prepend(header);
    return header;
  };

  ensureSharedHeaderStyles();
  buildSharedHeader();

  const makeButton = () => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "theme-toggle";
    button.setAttribute("aria-label", light ? "Use dark mode" : "Use light mode");
    button.innerHTML = '<span aria-hidden="true">◐</span><span class="theme-toggle__label">Light mode</span>';
    button.addEventListener("click", () => {
      light = !light;
      root.classList.toggle("ashwood-light", light);
      document.querySelectorAll(".theme-toggle").forEach((toggle) => {
        toggle.setAttribute("aria-label", light ? "Use dark mode" : "Use light mode");
        const label = toggle.querySelector(".theme-toggle__label");
        if (label) label.textContent = light ? "Dark mode" : "Light mode";
      });
      try { localStorage.setItem(key, light ? "light" : "dark"); } catch (_) {}
    });
    return button;
  };

  document.querySelectorAll(".masthead,.site-header,.ashwood-site-header,.journal-masthead").forEach((header) => {
    if (!header.querySelector(".theme-toggle")) header.append(makeButton());
  });
  document.querySelectorAll("footer").forEach((footer) => {
    if (!footer.querySelector(".theme-toggle")) footer.append(makeButton());
  });
  document.querySelectorAll(".name-change-cta").forEach((button) => button.addEventListener("click", () => {
    try { localStorage.setItem("ashwood.name-choice", button.dataset.nameChoice || "khlear"); } catch (_) {}
    const response = document.querySelector(".name-change-response");
    if (response) response.textContent = "Noted — khlear is on the table.";
    button.disabled = true;
  }));

  // Borrow AgentMail's responsive-system principle, not its visual language:
  // the background should acknowledge exploration and reveal relationships without
  // competing with the content or becoming motion for motion's sake.
  const installAmbientField = () => {
    if (normalizedPath !== "/" && normalizedPath !== "/about") return;

    const style = document.createElement("style");
    style.id = "ashwood-responsive-field";
    style.textContent = `
      body.ashwood-home-native .principles-field{isolation:isolate}
      body.ashwood-home-native .principles-field::before,
      body.ashwood-home-native .principles-field::after{
        content:"";position:absolute;inset:-18%;z-index:-1;pointer-events:none;
        transform:translateZ(0);transition:opacity .7s ease,filter .7s ease;
      }
      body.ashwood-home-native .principles-field::before{
        background:
          radial-gradient(circle at var(--field-x,68%) var(--field-y,42%),rgba(0,155,58,.085) 0 2%,rgba(0,155,58,.035) 12%,transparent 34%),
          radial-gradient(circle at var(--field-x,68%) var(--field-y,42%),transparent 0 14%,rgba(214,194,74,.04) 14.4%,transparent 15.2% 100%);
        opacity:.34;filter:blur(.2px);animation:ashwood-field-breathe 8s ease-in-out infinite;
      }
      body.ashwood-home-native .principles-field::after{
        background:radial-gradient(circle at var(--field-x,68%) var(--field-y,42%),transparent 0 8%,rgba(0,155,58,.035) 8.4%,transparent 9.2% 100%);
        opacity:.18;transform:scale(.82);transition:opacity .45s ease,transform 1s cubic-bezier(.16,.8,.24,1);
      }
      body.ashwood-home-native .principles-field.is-exploring::before{opacity:.68;filter:blur(0)}
      body.ashwood-home-native .principles-field.is-exploring::after{opacity:.44;transform:scale(1)}
      body.has-found-all-hotspots .principles-field::before,
      body.has-found-all-hotspots .principles-field::after{opacity:.12}
      @keyframes ashwood-field-breathe{0%,100%{transform:scale(.97)}50%{transform:scale(1.025)}}

      .about-page .page-intro{isolation:isolate;--about-x:72%;--about-y:30%}
      .about-page .page-intro::before{
        content:"";position:absolute;inset:-8vh -8vw;z-index:0;pointer-events:none;
        background:
          radial-gradient(circle at var(--about-x) var(--about-y),rgba(214,194,74,.07) 0 3%,rgba(214,194,74,.026) 18%,transparent 39%),
          radial-gradient(circle at 78% 38%,rgba(0,155,58,.04),transparent 28%),
          linear-gradient(90deg,transparent 0 70%,color-mix(in srgb,var(--ashwood-rule) 22%,transparent) 70.08%,transparent 70.16% 100%);
        opacity:.34;transition:opacity .8s ease,filter .8s ease;
      }
      .about-page .page-intro.is-reading-field::before{opacity:.58;filter:saturate(1.08)}
      .about-page .page-intro.is-archive-near::before{opacity:.7}
      .about-page .page-intro > :not(.family-archive){position:relative;z-index:1}

      @media (hover:none),(pointer:coarse){
        body.ashwood-home-native .principles-field::before{animation:none;opacity:.26}
        body.ashwood-home-native .principles-field::after{display:none}
        .about-page .page-intro::before{opacity:.28}
      }
      @media (prefers-reduced-motion:reduce){
        body.ashwood-home-native .principles-field::before,
        body.ashwood-home-native .principles-field::after,
        .about-page .page-intro::before{animation:none!important;transition:none!important}
      }
    `;
    document.head.append(style);

    if (normalizedPath !== "/about") return;
    const intro = document.querySelector(".about-page .page-intro");
    const archive = document.querySelector(".about-page .family-archive");
    if (!intro) return;

    const finePointer = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || reduceMotion) return;

    let leaveTimer;
    document.addEventListener("pointermove", (event) => {
      const rect = intro.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100));
      const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 100));
      intro.style.setProperty("--about-x", `${x}%`);
      intro.style.setProperty("--about-y", `${y}%`);
      intro.classList.add("is-reading-field");

      if (archive) {
        const a = archive.getBoundingClientRect();
        const nearestX = Math.max(a.left, Math.min(event.clientX, a.right));
        const nearestY = Math.max(a.top, Math.min(event.clientY, a.bottom));
        const distance = Math.hypot(event.clientX - nearestX, event.clientY - nearestY);
        intro.classList.toggle("is-archive-near", distance < 150);
      }

      clearTimeout(leaveTimer);
      leaveTimer = setTimeout(() => intro.classList.remove("is-reading-field"), 900);
    }, { passive: true });
  };

  installAmbientField();

  // Home must never make one of the six discovery points impossible to find.
  // The inline randomizer gets first choice; this only rescues hotspots it had to suppress.
  const rescueHomepageHotspots = () => {
    if (normalizedPath !== "/") return;
    const field = document.querySelector(".principles-field");
    const hotspots = [...document.querySelectorAll(".principle-hotspot")];
    if (!field || !hotspots.length || document.body.classList.contains("has-found-all-hotspots")) return;

    const compact = window.matchMedia("(max-width: 760px)").matches;
    const fieldRect = field.getBoundingClientRect();
    const protectedSelectors = [".masthead", ".intro", ".home-entryways", ".home-now", ".home-utility", ".ashwood-home-audio"];
    const protectedRects = protectedSelectors
      .flatMap((selector) => [...document.querySelectorAll(selector)])
      .map((element) => element.getBoundingClientRect())
      .filter((rect) => rect.width > 0 && rect.height > 0);
    const visibleRects = hotspots
      .filter((hotspot) => parseFloat(hotspot.style.left || "0") > -100)
      .map((hotspot) => hotspot.getBoundingClientRect())
      .filter((rect) => rect.width > 0 && rect.height > 0 && rect.right > fieldRect.left && rect.left < fieldRect.right);

    const overlaps = (a, b, padding = 0) => (
      a.left < b.right + padding && a.right > b.left - padding && a.top < b.bottom + padding && a.bottom > b.top - padding
    );

    const desktopSlots = [
      [56, 24], [73, 27], [84, 38], [50, 43], [67, 48], [81, 56],
      [54, 61], [70, 67], [85, 70], [44, 54], [61, 36], [76, 42]
    ];
    const mobileSlots = [[8, 34], [52, 34], [10, 48], [54, 48], [8, 63], [52, 63], [20, 76], [58, 76]];
    const slots = compact ? mobileSlots : desktopSlots;

    hotspots.forEach((hotspot, index) => {
      const left = parseFloat(hotspot.style.left || "0");
      const rect = hotspot.getBoundingClientRect();
      const suppressed = left < -100 || rect.right < fieldRect.left || rect.left > fieldRect.right;
      if (!suppressed) return;

      let placed = false;
      for (const [x, y] of slots) {
        hotspot.style.left = `${x}%`;
        hotspot.style.top = `${y}%`;
        hotspot.style.right = "auto";
        hotspot.style.bottom = "auto";
        const candidate = hotspot.getBoundingClientRect();
        const inside = candidate.left >= fieldRect.left + 4 && candidate.right <= fieldRect.right - 4 && candidate.top >= fieldRect.top + 4 && candidate.bottom <= fieldRect.bottom - 4;
        const blocked = protectedRects.some((area) => overlaps(candidate, area, compact ? 8 : 16));
        const collides = visibleRects.some((area) => overlaps(candidate, area, compact ? 6 : 14));
        if (inside && !blocked && !collides) {
          visibleRects.push(candidate);
          placed = true;
          break;
        }
      }

      if (!placed) {
        // Last-resort visible position: preserving discoverability outranks perfect spacing.
        const x = compact ? 8 + (index % 2) * 48 : 48 + (index % 3) * 16;
        const y = compact ? 36 + Math.floor(index / 2) * 13 : 30 + Math.floor(index / 3) * 25;
        hotspot.style.left = `${x}%`;
        hotspot.style.top = `${y}%`;
        hotspot.style.right = "auto";
        hotspot.style.bottom = "auto";
      }
    });
  };

  if (normalizedPath === "/") {
    requestAnimationFrame(() => requestAnimationFrame(rescueHomepageHotspots));
    window.addEventListener("load", rescueHomepageHotspots, { once: true });
    let rescueTimer;
    window.addEventListener("resize", () => {
      clearTimeout(rescueTimer);
      rescueTimer = setTimeout(rescueHomepageHotspots, 80);
    }, { passive: true });
  }
})();
