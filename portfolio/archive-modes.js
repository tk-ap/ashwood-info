// Archive display modes for the modeling page: Visual, Index, Explore, plus group
// filters and a shuffle for Explore.
//
// Promoted out of reference-preview.js to production. That file returns early without
// ?ashwood-preview=1, so this behaviour never reached visitors while it lived there.
// Only the portfolio block moved; the homepage panel and the ai-from-zero rail are
// still preview-gated experiments.
(() => {
  "use strict";
  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/portfolio" && path !== "/portfolio/index.html") return;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  void prefersReduced;
  const grid = document.querySelector(".archive-grid");
  const work = document.querySelector("#work");
  if (grid && work) {
    // Positions are computed, not hardcoded per nth-child: the archive grows, and a
    // fixed set of rules leaves later frames stacked at the container origin.
    const frames = [...grid.children];
    const cols = Math.max(2, Math.ceil(Math.sqrt(frames.length)));
    const rows = Math.ceil(frames.length / cols);
    const jitter = (n) => { const v = Math.sin(n * 12.9898) * 43758.5453; return v - Math.floor(v); };
    // Seeded rather than random so a reload is stable; Explore's shuffle advances the
    // seed instead, which keeps the board reproducible within a visit.
    let seed = 0;
    const layout = () => {
      frames.forEach((item, index) => {
        item.setAttribute("data-index", String(index + 1).padStart(2, "0"));
        // Index mode hides the image, so without a label the row is a bare number.
        // The alt text already describes the frame, so reuse it.
        const alt = item.querySelector("img")?.alt;
        if (alt) item.setAttribute("data-label", alt);
        const col = index % cols;
        const row = Math.floor(index / cols);
        const s = seed * 101;
        item.style.setProperty("--spatial-left", `${((col + .12 + jitter(index + 1 + s) * .58) / cols * 82).toFixed(2)}%`);
        item.style.setProperty("--spatial-top", `${((row + .1 + jitter(index + 7 + s) * .58) / rows * 78).toFixed(2)}%`);
        item.style.setProperty("--spatial-r", `${(jitter(index + 13 + s) * 9 - 4.5).toFixed(2)}deg`);
      });
    };
    layout();
    const controls = document.createElement("div");
    controls.className = "ashwood-archive-controls";
    controls.innerHTML = '<button type="button" data-archive-mode="visual" aria-pressed="true">Visual</button><button type="button" data-archive-mode="index" aria-pressed="false">Index</button><button type="button" data-archive-mode="spatial" aria-pressed="false">Explore</button><button type="button" data-archive-shuffle hidden>Shuffle</button><span class="ashwood-archive-controls__hint">Same archive, three ways in.</span>';
    grid.before(controls);

    // Filter row. Built from the groups actually present so adding a frame with a new
    // data-group needs no change here, and omitted entirely if nothing is tagged.
    const tagged = frames.filter((item) => item.dataset.group);
    if (tagged.length) {
      const names = [...new Set(tagged.map((item) => item.dataset.group))].sort();
      const filters = document.createElement("div");
      filters.className = "ashwood-archive-filters";
      filters.setAttribute("role", "group");
      filters.setAttribute("aria-label", "Filter selected work");
      filters.innerHTML = ['All', ...names]
        .map((name, i) => `<button type="button" data-archive-filter="${name}" aria-pressed="${i === 0}">${name}</button>`)
        .join("");
      controls.after(filters);
      filters.addEventListener("click", (event) => {
        const button = event.target.closest("[data-archive-filter]");
        if (!button) return;
        const wanted = button.dataset.archiveFilter;
        filters.querySelectorAll("[data-archive-filter]").forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
        frames.forEach((item) => {
          const shown = wanted === "All" || item.dataset.group === wanted;
          item.hidden = !shown;
        });
      });
    }
    const setMode = (mode) => {
      document.body.classList.toggle("ashwood-index-mode", mode === "index");
      document.body.classList.toggle("ashwood-spatial-mode", mode === "spatial");
      controls.querySelectorAll("[data-archive-mode]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.archiveMode === mode)));
      shuffle.hidden = mode !== "spatial";
    };
    const shuffle = controls.querySelector("[data-archive-shuffle]");
    shuffle.addEventListener("click", () => { seed += 1; layout(); });
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
})();
