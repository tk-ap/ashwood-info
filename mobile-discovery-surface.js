(() => {
  "use strict";

  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/" && path !== "/index.html") return;

  const mq = window.matchMedia("(max-width: 760px), (pointer: coarse)");
  if (!mq.matches) return;

  const field = document.querySelector(".principles-field");
  if (!field) return;

  const hotspots = [...field.querySelectorAll(".principle-hotspot")];
  if (!hotspots.length) return;

  const hint = field.querySelector(".principles-field__hint");
  if (hint) hint.textContent = "There is more here.";

  const panel = document.createElement("aside");
  panel.className = "ashwood-mobile-hotspot-panel";
  panel.setAttribute("aria-live", "polite");
  panel.setAttribute("aria-hidden", "true");
  panel.innerHTML = `
    <p class="ashwood-mobile-hotspot-panel__eyebrow"></p>
    <button class="ashwood-mobile-hotspot-panel__close" type="button" aria-label="Close signal detail">×</button>
    <p class="ashwood-mobile-hotspot-panel__quote"></p>
    <div class="ashwood-mobile-hotspot-panel__useful"></div>
  `;
  field.appendChild(panel);

  const eyebrow = panel.querySelector(".ashwood-mobile-hotspot-panel__eyebrow");
  const quote = panel.querySelector(".ashwood-mobile-hotspot-panel__quote");
  const useful = panel.querySelector(".ashwood-mobile-hotspot-panel__useful");
  const closeButton = panel.querySelector(".ashwood-mobile-hotspot-panel__close");

  const close = () => {
    hotspots.forEach((hotspot) => {
      hotspot.classList.remove("is-revealed", "is-near");
      hotspot.setAttribute("aria-pressed", "false");
      hotspot.setAttribute("aria-expanded", "false");
    });
    panel.classList.remove("is-visible");
    panel.setAttribute("aria-hidden", "true");
    document.body.classList.remove("has-mobile-hotspot-detail");
  };

  const open = (hotspot) => {
    const label = hotspot.querySelector(".principle-hotspot__label")?.textContent?.trim() || "SIGNAL";
    const thought = hotspot.querySelector(".principle-hotspot__quote")?.textContent?.trim() || "";
    const usefulSource = hotspot.querySelector(".principle-hotspot__useful");

    hotspots.forEach((item) => {
      item.classList.remove("is-revealed", "is-near");
      item.setAttribute("aria-pressed", "false");
      item.setAttribute("aria-expanded", "false");
    });

    hotspot.classList.add("is-revealed");
    hotspot.setAttribute("aria-pressed", "true");
    hotspot.setAttribute("aria-expanded", "true");

    eyebrow.textContent = label;
    quote.textContent = thought;
    useful.innerHTML = usefulSource ? usefulSource.innerHTML : "";

    panel.classList.add("is-visible");
    panel.setAttribute("aria-hidden", "false");
    document.body.classList.add("has-mobile-hotspot-detail");
  };

  field.addEventListener("click", (event) => {
    const hotspot = event.target.closest(".principle-hotspot");
    if (!hotspot || !field.contains(hotspot)) return;

    /* Capture before legacy hotspot handlers. The signal never becomes navigation. */
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (hotspot.classList.contains("is-revealed") && panel.classList.contains("is-visible")) {
      close();
      return;
    }
    open(hotspot);
  }, true);

  closeButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    close();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && panel.classList.contains("is-visible")) close();
  });

  /* A tap on real navigation remains completely untouched. */
  document.querySelectorAll(".home-entryway, .future-nav a, .ashwood-capability-evidence a").forEach((link) => {
    link.addEventListener("pointerdown", () => close(), { passive: true });
  });
})();
