(() => {
  "use strict";
  const params = new URLSearchParams(window.location.search);
  if (params.get("ashwood-preview") !== "1") return;

  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = "/reference-preview.css?v=20260905-preview9";
  document.head.appendChild(stylesheet);

  const path = location.pathname.replace(/\/+$/, "") || "/";
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (path === "/" || path === "/index.html") {
    const intro = document.querySelector(".intro");
    if (intro) {
      const panel = document.createElement("section");
      panel.className = "ashwood-preview-panel";
      panel.setAttribute("aria-label", "ASHWOOD motion reference preview");
      panel.innerHTML = '<h2 class="ashwood-preview-panel__title">The work keeps moving.</h2><span class="ashwood-preview-panel__motif" aria-hidden="true"></span>';
      intro.insertAdjacentElement("afterend", panel);
      const updatePanel = () => {
        const rect = panel.getBoundingClientRect();
        const progress = Math.max(0, Math.min(1, (window.innerHeight * .82 - rect.top) / Math.max(1, rect.height * 1.1)));
        panel.style.setProperty("--ashwood-panel-progress", progress.toFixed(3));
        document.body.classList.toggle("ashwood-preview-panel-active", progress > .05 && progress < 1);
      };
      window.addEventListener("scroll", updatePanel, { passive: true });
      updatePanel();
      if (prefersReduced) panel.classList.add("is-static");
    }
  }


  if (path === "/ai-from-zero" || path === "/ai-from-zero/index.html") {
    const hero = document.querySelector(".ai-zero-hero");
    // Derived from the DOM, never hardcoded: the page owns its own 01-07 numbering in
    // .zero-marker, and a second hand-maintained list drifts out of order and drops
    // sections (which blanked the rail on every #handoff crossing).
    const sections = [...document.querySelectorAll(".zero-section")].filter((section) => section.id);
    if (hero && sections.length) {
      const stages = sections.map((section, index) => {
        const marks = [...(section.querySelector(".zero-marker")?.querySelectorAll("span") || [])];
        return {
          id: section.id,
          number: marks[0]?.textContent.trim() || String(index + 1).padStart(2, "0"),
          label: marks[1]?.textContent.trim() || section.id.replace(/-/g, " ")
        };
      });
      const rail = document.createElement("nav");
      rail.className = "ai-zero-preview-rail";
      rail.setAttribute("aria-label", "AI from ZERO path");
      rail.style.setProperty("--ai-zero-rail-count", String(stages.length));
      rail.innerHTML = stages
        .map((stage) => `<a href="#${stage.id}"><span>${stage.number}</span>${stage.label}</a>`)
        .join("");
      hero.insertAdjacentElement("afterend", rail);
      const links = [...rail.querySelectorAll("a")];
      const indexById = new Map(stages.map((stage, index) => [stage.id, index]));
      const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const index = indexById.get(entry.target.id);
        if (index === undefined) return;
        links.forEach((link, i) => {
          const active = i === index;
          link.classList.toggle("is-active", active);
          if (active) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        });
      }), { rootMargin: "-28% 0px -58%", threshold: 0 });
      sections.forEach((section) => observer.observe(section));
    }
  }
})();
