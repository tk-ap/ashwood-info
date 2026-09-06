(() => {
  "use strict";

  // Scroll reveal for the [data-reveal] assembly. Frozen to final state
  // under prefers-reduced-motion (the CSS also handles that statically).
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealEls = [...document.querySelectorAll("[data-reveal]")];

  if (reduced) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12 }
  );

  revealEls.forEach((el) => io.observe(el));
})();