(() => {
  "use strict";

  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/" && path !== "/index.html") return;

  const wordmark = document.querySelector(".wordmark");
  const masthead = document.querySelector(".masthead");
  if (wordmark && masthead) {
    wordmark.classList.add("ashwood-jm-xaymaca");
    wordmark.setAttribute("title", "A deeper layer is hidden here.");
    const inline = document.createElement("p");
    inline.className = "ashwood-jm-xaymaca-inline";
    inline.setAttribute("aria-live", "polite");
    inline.innerHTML = '<span class="ashwood-jm-xaymaca-inline__name">XAYMACA</span><span class="ashwood-jm-xaymaca-inline__meaning">Land of wood and water</span><span class="ashwood-jm-xaymaca-inline__context">Jamaica’s name is believed to derive from the Taíno Xaymaca — a quiet resonance inside ASHWOOD.</span>';
    masthead.appendChild(inline);
    let holdTimer = 0;
    const openXaymaca = () => inline.classList.add("is-visible");
    const closeXaymaca = () => inline.classList.remove("is-visible");
    wordmark.addEventListener("pointerenter", () => { holdTimer = window.setTimeout(openXaymaca, 500); });
    wordmark.addEventListener("pointerleave", () => { window.clearTimeout(holdTimer); closeXaymaca(); });
    wordmark.addEventListener("focus", openXaymaca);
    wordmark.addEventListener("blur", closeXaymaca);
  }

  const motto = document.querySelector(".iridescent-word--jamaica");
  let mottoContext = null;
  if (motto) {
    motto.tabIndex = 0;
    motto.setAttribute("aria-label", "Jamaican provenance behind Out of One");
    mottoContext = document.createElement("span");
    mottoContext.className = "ashwood-jm-motto-context";
    mottoContext.innerHTML = '<span class="ashwood-jm-context-kicker">JAMAICA / PROVENANCE</span><span class="ashwood-jm-context-title">Out of Many, One People.</span><span class="ashwood-jm-context-note">“Out of One, Many Becomings” is a deliberate inversion of Jamaica’s national motto.</span>';
    motto.parentElement?.insertAdjacentElement("afterend", mottoContext);
    let mottoTimer = 0;
    const openMotto = () => { window.clearTimeout(mottoTimer); motto.classList.add("ashwood-jm-active"); mottoContext.classList.add("is-visible"); };
    const closeMotto = () => { motto.classList.remove("ashwood-jm-active"); mottoContext.classList.remove("is-visible"); };
    motto.addEventListener("pointerenter", openMotto);
    motto.addEventListener("pointerleave", () => { mottoTimer = window.setTimeout(closeMotto, 180); });
    motto.addEventListener("focus", openMotto);
    motto.addEventListener("blur", closeMotto);
  }

  const field = document.querySelector(".principles-field");
  let independence = null;
  let independenceContext = null;
  if (field && !field.querySelector(".ashwood-jm-1962")) {
    independence = document.createElement("span");
    independence.className = "ashwood-jm-1962";
    independence.textContent = "06 · 08 · 1962";
    independence.setAttribute("tabindex", "0");
    independence.setAttribute("aria-label", "Jamaica independence date: August 6, 1962");
    independenceContext = document.createElement("span");
    independenceContext.className = "ashwood-jm-1962-context";
    independenceContext.innerHTML = '<span class="ashwood-jm-context-kicker">INDEPENDENCE / JAMAICA</span><span class="ashwood-jm-context-title">6 August 1962.</span><span class="ashwood-jm-context-note">A small coordinate in the field for the year Jamaica became independent.</span>';
    const openIndependence = () => independenceContext.classList.add("is-visible");
    const closeIndependence = () => independenceContext.classList.remove("is-visible");
    independence.addEventListener("pointerenter", openIndependence);
    independence.addEventListener("pointerleave", closeIndependence);
    independence.addEventListener("focus", openIndependence);
    independence.addEventListener("blur", closeIndependence);
    field.appendChild(independence);
    field.appendChild(independenceContext);
  }

  /* Doctor Bird used to have a second, separate portal-to-portal flight system here.
     That duplicate motion grammar is intentionally retired. The rendered Doctor Bird
     is now owned by one autonomous character controller that treats these cultural
     details and page regions as environmental context rather than cursor targets. */
  if (!document.querySelector('script[data-ashwood-doc-character]')) {
    const character = document.createElement("script");
    character.src = "/doc-character.js?v=20260902-character1";
    character.defer = true;
    character.setAttribute("data-ashwood-doc-character", "1");
    document.head.appendChild(character);
  }

  const updateEarnedCulturalSignals = () => {
    const count = Number(document.documentElement.dataset.ashwoodDiscoveryCount || 0);
    mottoContext?.classList.toggle("is-earned", count >= 2);
    independence?.classList.toggle("is-earned", count >= 3);
    independenceContext?.classList.toggle("is-earned", count >= 4);
  };
  updateEarnedCulturalSignals();
  const discoveryObserver = new MutationObserver(updateEarnedCulturalSignals);
  discoveryObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-ashwood-discovery-count"] });
})();