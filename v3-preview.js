(() => {
  const signals = [...document.querySelectorAll('.v3-signal')];
  signals.forEach((signal) => {
    signal.addEventListener('click', () => {
      const open = signal.getAttribute('aria-expanded') === 'true';
      signals.forEach((item) => item.setAttribute('aria-expanded', 'false'));
      signal.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
  });

  const docButton = document.querySelector('.v3-doc');
  const docPanel = document.querySelector('.v3-doc-panel');
  if (docButton && docPanel) {
    docButton.addEventListener('click', () => {
      const open = docPanel.classList.toggle('is-open');
      docButton.setAttribute('aria-expanded', String(open));
    });
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reveals = [...document.querySelectorAll('.v3-reveal')];
  if (reduced || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  reveals.forEach((el) => observer.observe(el));
})();