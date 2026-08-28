(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (reduceMotion.matches) return;

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href="#barelysain"]');
    if (!link) return;

    const target = document.getElementById('barelysain');
    if (!target) return;

    event.preventDefault();

    const start = window.scrollY;
    const targetY = target.getBoundingClientRect().top + window.scrollY - 12;
    const distance = targetY - start;
    const duration = Math.min(1700, Math.max(1100, Math.abs(distance) * 0.75));
    const startTime = performance.now();

    const easeInOutCinematic = (t) =>
      t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animate = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = easeInOutCinematic(progress);

      window.scrollTo(0, start + distance * eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        history.replaceState(null, '', '#barelysain');
      }
    };

    requestAnimationFrame(animate);
  });
})();
