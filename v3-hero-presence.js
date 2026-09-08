(() => {
  'use strict';

  const hero = document.querySelector('.v3-hero');
  if (!hero) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (reduced || !finePointer) return;

  let frame = 0;
  let nextX = 0;
  let nextY = 0;
  let active = false;

  const commit = () => {
    frame = 0;
    hero.style.setProperty('--hero-presence-x', nextX.toFixed(4));
    hero.style.setProperty('--hero-presence-y', nextY.toFixed(4));
    hero.style.setProperty('--hero-presence-energy', active ? '1' : '0');
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(commit);
  };

  const update = (event) => {
    const rect = hero.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    nextX = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - .5) * 2));
    nextY = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - .5) * 2));
    if (!active) {
      active = true;
      hero.classList.add('is-presence-active');
    }
    schedule();
  };

  const settle = () => {
    nextX = 0;
    nextY = 0;
    active = false;
    hero.classList.remove('is-presence-active');
    schedule();
  };

  hero.addEventListener('pointermove', update, { passive: true });
  hero.addEventListener('pointerenter', update, { passive: true });
  hero.addEventListener('pointerleave', settle, { passive: true });
  window.addEventListener('blur', settle, { passive: true });
})();
