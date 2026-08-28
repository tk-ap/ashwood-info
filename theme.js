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
})();
