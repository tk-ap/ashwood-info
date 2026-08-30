(() => {
  "use strict";

  const STATE_KEY = "ashwood.interaction.state.v1";
  const LEGACY_DISCOVERY_KEY = "ashwood.curiosity.hotspots.v1";
  const knownSignals = ["signal", "friction", "translation", "systems", "resilience", "range"];
  const normalizePath = (value = location.pathname) => value.replace(/\/$/, "") || "/";

  const readState = () => {
    let state = { discoveries: [], lastSignal: null, lastRoute: null, resolved: false, updatedAt: null };
    try {
      const stored = JSON.parse(localStorage.getItem(STATE_KEY) || "null");
      if (stored && typeof stored === "object") state = { ...state, ...stored };
      const legacy = JSON.parse(localStorage.getItem(LEGACY_DISCOVERY_KEY) || "[]");
      if (Array.isArray(legacy)) {
        state.discoveries = [...new Set([...(state.discoveries || []), ...legacy.filter((id) => knownSignals.includes(id))])];
      }
    } catch (_) {}
    state.resolved = state.discoveries.length >= knownSignals.length;
    return state;
  };

  let state = readState();

  const writeState = (patch = {}) => {
    state = {
      ...state,
      ...patch,
      discoveries: [...new Set((patch.discoveries || state.discoveries || []).filter((id) => knownSignals.includes(id)))],
      updatedAt: new Date().toISOString()
    };
    state.resolved = state.discoveries.length >= knownSignals.length;
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (_) {}
    applyState();
  };

  const signalFromElement = (element) => {
    if (!element) return null;
    if (element.dataset?.capability && knownSignals.includes(element.dataset.capability)) return element.dataset.capability;
    const className = [...(element.classList || [])].find((name) => name.startsWith("principle-hotspot--"));
    const id = className?.replace("principle-hotspot--", "");
    return knownSignals.includes(id) ? id : null;
  };

  const style = document.createElement("style");
  style.id = "ashwood-interaction-state-style";
  style.textContent = `
    .ashwood-thread-carry{display:inline-flex;align-items:center;gap:7px;margin-left:10px;color:var(--ashwood-muted);font-size:7px;line-height:1.2;letter-spacing:.14em;text-transform:uppercase;opacity:.52;white-space:nowrap}
    .ashwood-thread-carry::before{content:"";width:14px;height:1px;background:#009b3a;opacity:.72}
    body[data-ashwood-thread] .ashwood-site-header__section{display:inline-flex;align-items:center}
    body[data-ashwood-thread] .thread-label:first-child,
    body[data-ashwood-thread] .thread-meta{position:relative}
    body[data-ashwood-thread] .thread-meta::after{content:" · carried " attr(data-carried-thread);color:#009b3a;opacity:.72}
    @media(max-width:760px){.ashwood-thread-carry{display:none}}
  `;
  document.head.append(style);

  const ensureCarryMarker = () => {
    const path = normalizePath();
    if (path === "/" || !state.lastSignal || state.discoveries.length < 2) return;
    document.body.dataset.ashwoodThread = state.lastSignal;

    const header = document.querySelector(".ashwood-site-header__brand-lockup");
    if (header && !header.querySelector(".ashwood-thread-carry")) {
      const carry = document.createElement("span");
      carry.className = "ashwood-thread-carry";
      carry.textContent = `thread / ${state.lastSignal}`;
      carry.setAttribute("aria-label", `Carried exploration thread: ${state.lastSignal}`);
      header.append(carry);
    }

    const threadMeta = document.querySelector(".thread-meta");
    if (threadMeta) threadMeta.dataset.carriedThread = state.lastSignal;
  };

  function applyState() {
    document.documentElement.dataset.ashwoodDiscoveryCount = String(state.discoveries.length);
    document.documentElement.classList.toggle("ashwood-has-resolved-thread", Boolean(state.resolved));
    ensureCarryMarker();
  }

  document.addEventListener("click", (event) => {
    const hotspot = event.target.closest?.(".principle-hotspot");
    if (hotspot) {
      const signal = signalFromElement(hotspot);
      if (signal) writeState({ discoveries: [...state.discoveries, signal], lastSignal: signal });
      return;
    }

    const capability = event.target.closest?.("[data-capability]");
    if (capability) {
      const signal = signalFromElement(capability);
      if (signal) writeState({ lastSignal: signal });
    }

    const route = event.target.closest?.(".home-entryway,.future-nav a,.ashwood-capability-evidence a,.thread-links a,.ashwood-capability-map__practice");
    if (route?.href) {
      try {
        const url = new URL(route.href, location.href);
        writeState({ lastRoute: normalizePath(url.pathname) });
      } catch (_) {}
    }
  }, true);

  document.addEventListener("focusin", (event) => {
    const capability = event.target.closest?.("[data-capability]");
    const signal = signalFromElement(capability);
    if (signal) writeState({ lastSignal: signal });
  });

  const bodyObserver = new MutationObserver(() => {
    if (document.body.classList.contains("has-found-all-hotspots") && !state.resolved) {
      writeState({ discoveries: knownSignals, resolved: true });
    }
    ensureCarryMarker();
  });
  bodyObserver.observe(document.body, { attributes: true, attributeFilter: ["class"], childList: true, subtree: true });

  applyState();
})();
