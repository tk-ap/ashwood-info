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

  if (path === "/portfolio" || path === "/portfolio/index.html") {
    const grid = document.querySelector(".archive-grid");
    const work = document.querySelector("#work");
    if (grid && work) {
      // Positions are computed, not hardcoded per nth-child: the archive grows, and a
      // fixed set of rules leaves later frames stacked at the container origin.
      const frames = [...grid.children];
      const cols = Math.max(2, Math.ceil(Math.sqrt(frames.length)));
      const rows = Math.ceil(frames.length / cols);
      const jitter = (n) => { const v = Math.sin(n * 12.9898) * 43758.5453; return v - Math.floor(v); };
      frames.forEach((item, index) => {
        item.setAttribute("data-index", String(index + 1).padStart(2, "0"));
        const col = index % cols;
        const row = Math.floor(index / cols);
        item.style.setProperty("--spatial-left", `${((col + .12 + jitter(index + 1) * .58) / cols * 82).toFixed(2)}%`);
        item.style.setProperty("--spatial-top", `${((row + .1 + jitter(index + 7) * .58) / rows * 78).toFixed(2)}%`);
        item.style.setProperty("--spatial-r", `${(jitter(index + 13) * 9 - 4.5).toFixed(2)}deg`);
      });
      const controls = document.createElement("div");
      controls.className = "ashwood-archive-controls";
      controls.innerHTML = '<button type="button" data-archive-mode="visual" aria-pressed="true">Visual</button><button type="button" data-archive-mode="index" aria-pressed="false">Index</button><button type="button" data-archive-mode="spatial" aria-pressed="false">Explore</button><span class="ashwood-archive-controls__hint">Same archive, three ways in.</span>';
      grid.before(controls);
      const setMode = (mode) => {
        document.body.classList.toggle("ashwood-index-mode", mode === "index");
        document.body.classList.toggle("ashwood-spatial-mode", mode === "spatial");
        controls.querySelectorAll("[data-archive-mode]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.archiveMode === mode)));
      };
      controls.addEventListener("click", (event) => {
        const button = event.target.closest("[data-archive-mode]");
        if (button) setMode(button.dataset.archiveMode);
      });
      // Pan is cumulative: each drag resumes from where the last one stopped, rather
      // than snapping the board back to origin.
      const pan = { x: 0, y: 0 };
      let drag = null;
      grid.addEventListener("pointerdown", (event) => {
        if (!document.body.classList.contains("ashwood-spatial-mode")) return;
        drag = { x: event.clientX - pan.x, y: event.clientY - pan.y, pointerId: event.pointerId };
        grid.setPointerCapture(event.pointerId);
      });
      grid.addEventListener("pointermove", (event) => {
        if (!drag || event.pointerId !== drag.pointerId) return;
        pan.x = event.clientX - drag.x;
        pan.y = event.clientY - drag.y;
        grid.style.setProperty("--spatial-pan-x", `${pan.x}px`);
        grid.style.setProperty("--spatial-pan-y", `${pan.y}px`);
      });
      const endDrag = (event) => {
        if (!drag || (event && event.pointerId !== drag.pointerId)) return;
        if (grid.hasPointerCapture(drag.pointerId)) grid.releasePointerCapture(drag.pointerId);
        drag = null;
      };
      grid.addEventListener("pointerup", endDrag);
      grid.addEventListener("pointercancel", endDrag);
      grid.addEventListener("lostpointercapture", endDrag);
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
