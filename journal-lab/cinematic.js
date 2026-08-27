(() => {
  "use strict";

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const chapters = [...document.querySelectorAll("main > section")];
  const revealTargets = [...document.querySelectorAll(
    ".section-marker, .ecosystem-brief__heading, .brief-grid, .readiness, .professional-signal, .system-brief__heading, .system-map, .journal-now__content, .founder-entry, .journal-feed__heading, .product-threads__intro, .thread-list, .founder-themes__body, .journal-method__body, .journal-closing > *"
  )];

  chapters.forEach((chapter, index) => {
    chapter.classList.add("cinematic-chapter");
    chapter.dataset.chapter = String(index + 1).padStart(2, "0");
  });
  revealTargets.forEach((target) => target.classList.add("cinematic-reveal"));

  const rail = document.createElement("div");
  rail.className = "curiosity-rail";
  rail.setAttribute("aria-hidden", "true");
  rail.innerHTML = '<span class="curiosity-rail__progress"></span><span class="curiosity-rail__label">Follow the thread</span>';
  document.body.append(rail);

  const updateProgress = () => {
    const scrollable = document.documentElement.scrollHeight - innerHeight;
    const progress = scrollable > 0 ? Math.min(100, Math.max(0, scrollY / scrollable * 100)) : 0;
    document.documentElement.style.setProperty("--story-progress", `${progress}%`);
  };

  if (reduceMotion || !("IntersectionObserver" in window)) {
    chapters.forEach((chapter) => chapter.classList.add("is-visible"));
    revealTargets.forEach((target) => target.classList.add("is-visible"));
    document.documentElement.style.setProperty("--readiness-progress", "60%");
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        if (entry.target.classList.contains("readiness")) {
          document.documentElement.style.setProperty("--readiness-progress", "60%");
        }
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12%", threshold: .12 });
    [...chapters, ...revealTargets].forEach((target) => observer.observe(target));
  }

  addEventListener("scroll", updateProgress, { passive: true });
  addEventListener("resize", updateProgress, { passive: true });
  updateProgress();
})();
