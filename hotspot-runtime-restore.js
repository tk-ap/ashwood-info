(() => {
  "use strict";

  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/" && path !== "/index.html") return;

  const field = document.querySelector('.principles-field');
  if (!field || field.dataset.ashwoodRuntimeRestored === '1') return;
  field.dataset.ashwoodRuntimeRestored = '1';

  const hotspots = [...field.querySelectorAll('.principle-hotspot')];
  if (!hotspots.length) return;

  const surface = field.closest('.shell') || document.body;
  const protectedSelectors = ['.masthead', '.intro', '.home-entryways', '.home-now', '.future-nav', '.ashwood-home-audio'];
  const isTouchLayout = () => window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;

  const overlapArea = (a, b, padding = 0) => {
    const left = Math.max(a.left, b.left - padding);
    const right = Math.min(a.right, b.right + padding);
    const top = Math.max(a.top, b.top - padding);
    const bottom = Math.min(a.bottom, b.bottom + padding);
    return Math.max(0, right - left) * Math.max(0, bottom - top);
  };

  const protectedRects = () => protectedSelectors
    .flatMap((selector) => [...surface.querySelectorAll(selector)])
    .map((el) => el.getBoundingClientRect())
    .filter((rect) => rect.width > 0 && rect.height > 0);

  const randomize = () => {
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

    const protectedAreas = protectedRects();
    const placed = [];
    const gap = 30;
    const protection = 32;
    const edge = 10;
    const candidates = [];

    for (let i = 0; i < 560; i += 1) {
      const xSeed = Math.random();
      const x = 10 + Math.pow(xSeed, .68) * 82;
      const y = 4 + Math.random() * 88;
      const rightBias = (x / 100) * .24;
      candidates.push({ x, y, score: Math.random() - rightBias });
    }

    hotspots.forEach((hotspot) => {
      let best = null;
      let lowestHotspotPenalty = Number.POSITIVE_INFINITY;
      const ordered = [...candidates].sort((a, b) => a.score - b.score);

      for (const pos of ordered) {
        hotspot.style.left = pos.x + '%';
        hotspot.style.top = pos.y + '%';
        hotspot.style.right = 'auto';
        hotspot.style.bottom = 'auto';

        const candidate = hotspot.getBoundingClientRect();
        const inside = candidate.left >= rect.left + edge
          && candidate.top >= rect.top + edge
          && candidate.right <= rect.right - edge
          && candidate.bottom <= rect.bottom - edge;
        if (!inside) continue;

        const touchesStaticInterface = protectedAreas.some((area) => overlapArea(candidate, area, protection) > 0);
        if (touchesStaticInterface) continue;

        const hotspotPenalty = placed.reduce((sum, area) => sum + overlapArea(candidate, area, gap), 0);
        if (hotspotPenalty === 0) {
          best = candidate;
          break;
        }
        if (hotspotPenalty < lowestHotspotPenalty) {
          lowestHotspotPenalty = hotspotPenalty;
          best = candidate;
        }
      }

      if (best) {
        hotspot.style.left = ((best.left - rect.left) / rect.width * 100) + '%';
        hotspot.style.top = ((best.top - rect.top) / rect.height * 100) + '%';
        placed.push(hotspot.getBoundingClientRect());
      } else {
        hotspot.style.left = '-9999px';
        hotspot.style.top = '-9999px';
      }
    });
  };

  const point = (clientX, clientY) => {
    if (isTouchLayout()) return;
    const rect = field.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    field.style.setProperty('--field-x', Math.max(0, Math.min(100, (clientX - rect.left) / rect.width * 100)) + '%');
    field.style.setProperty('--field-y', Math.max(0, Math.min(100, (clientY - rect.top) / rect.height * 100)) + '%');

    const nearest = hotspots
      .map((hotspot) => {
        const r = hotspot.getBoundingClientRect();
        return {
          hotspot,
          distance: Math.hypot((r.left + r.width / 2) - clientX, (r.top + 34) - clientY)
        };
      })
      .sort((a, b) => a.distance - b.distance)[0];

    hotspots.forEach((hotspot) => {
      const shouldBeNear = hotspot === nearest?.hotspot && nearest.distance < 155;
      if (!field.classList.contains('is-pinned') || hotspot.classList.contains('is-revealed')) {
        hotspot.classList.toggle('is-near', shouldBeNear || hotspot.classList.contains('is-revealed'));
      }
    });

    field.classList.add('is-exploring');
  };

  let resizeTimer = 0;
  const rerender = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(randomize, 80);
  };

  randomize();
  surface.addEventListener('pointermove', (event) => point(event.clientX, event.clientY), { passive: true });
  surface.addEventListener('pointerenter', (event) => point(event.clientX, event.clientY), { passive: true });
  window.addEventListener('resize', rerender, { passive: true });

  field.addEventListener('pointerleave', () => {
    field.classList.remove('is-exploring');
    hotspots.forEach((hotspot) => {
      if (!hotspot.classList.contains('is-revealed')) hotspot.classList.remove('is-near');
    });
  });

  document.addEventListener('ashwood:hotspot-found', () => {
    window.setTimeout(randomize, 40);
  });
})();
