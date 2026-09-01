(() => {
  "use strict";

  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/" && path !== "/index.html") return;

  const field = document.querySelector('.principles-field');
  if (!field || field.dataset.ashwoodRuntimeRestored === '2') return;
  field.dataset.ashwoodRuntimeRestored = '2';

  const hotspots = [...field.querySelectorAll('.principle-hotspot')];
  if (!hotspots.length) return;

  const surface = field.closest('.shell') || document.body;
  const isTouchLayout = () => window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;

  /* Six guaranteed anchor zones. The field may still feel organic through a small
     per-load jitter, but no signal is allowed to disappear because a random layout
     solver could not find room for a full hidden card. */
  const anchorSlots = [
    { x: 11, y: 28 },
    { x: 38, y: 20 },
    { x: 68, y: 28 },
    { x: 18, y: 64 },
    { x: 47, y: 60 },
    { x: 75, y: 64 }
  ];

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const placeAnchors = () => {
    if (isTouchLayout()) {
      hotspots.forEach((hotspot) => {
        hotspot.style.removeProperty('left');
        hotspot.style.removeProperty('top');
        hotspot.style.removeProperty('right');
        hotspot.style.removeProperty('bottom');
      });
      return;
    }

    const rect = field.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    hotspots.forEach((hotspot, index) => {
      const slot = anchorSlots[index % anchorSlots.length];
      const jitterX = (Math.random() - .5) * 4.5;
      const jitterY = (Math.random() - .5) * 4;
      const x = clamp(slot.x + jitterX, 7, 79);
      const y = clamp(slot.y + jitterY, 18, 70);
      hotspot.style.left = `${x}%`;
      hotspot.style.top = `${y}%`;
      hotspot.style.right = 'auto';
      hotspot.style.bottom = 'auto';
    });
  };

  const point = (clientX, clientY) => {
    if (isTouchLayout()) return;
    const rect = field.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    field.style.setProperty('--field-x', Math.max(0, Math.min(100, (clientX - rect.left) / rect.width * 100)) + '%');
    field.style.setProperty('--field-y', Math.max(0, Math.min(100, (clientY - rect.top) / rect.height * 100)) + '%');

    const nearest = hotspots
      .filter((hotspot) => hotspot.getBoundingClientRect().width > 0)
      .map((hotspot) => {
        const r = hotspot.getBoundingClientRect();
        return {
          hotspot,
          distance: Math.hypot((r.left + r.width / 2) - clientX, (r.top + 34) - clientY)
        };
      })
      .sort((a, b) => a.distance - b.distance)[0];

    hotspots.forEach((hotspot) => {
      /* Recognition begins before the user has to land precisely on a tiny point. */
      const shouldBeNear = hotspot === nearest?.hotspot && nearest.distance < 235;
      if (!field.classList.contains('is-pinned') || hotspot.classList.contains('is-revealed')) {
        hotspot.classList.toggle('is-near', shouldBeNear || hotspot.classList.contains('is-revealed'));
      }
    });

    field.classList.add('is-exploring');
  };

  let resizeTimer = 0;
  const rerender = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(placeAnchors, 80);
  };

  placeAnchors();
  surface.addEventListener('pointermove', (event) => point(event.clientX, event.clientY), { passive: true });
  surface.addEventListener('pointerenter', (event) => point(event.clientX, event.clientY), { passive: true });
  window.addEventListener('resize', rerender, { passive: true });

  field.addEventListener('pointerleave', () => {
    field.classList.remove('is-exploring');
    hotspots.forEach((hotspot) => {
      if (!hotspot.classList.contains('is-revealed')) hotspot.classList.remove('is-near');
    });
  });

  /* The explanatory layer is separate from the hotspot engine. */
  if (!document.querySelector('script[data-ashwood-hotspot-guidance]')) {
    const guidance = document.createElement('script');
    guidance.src = '/hotspot-guidance.js?v=20260831-guidance1';
    guidance.defer = true;
    guidance.dataset.ashwoodHotspotGuidance = '1';
    document.head.appendChild(guidance);
  }
})();
