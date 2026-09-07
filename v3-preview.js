(() => {
  const docButton = document.querySelector('.v3-doc');
  const docPanel = document.querySelector('.v3-doc-panel');
  const docCopy = docPanel?.querySelector('p');
  const discoveryCount = document.querySelector('[data-discovery-count]');
  const field = document.querySelector('.v3-field');
  const fieldHint = document.querySelector('.v3-field__hint');
  const card = document.querySelector('.v3-signal-card');
  const cardName = card?.querySelector('strong');
  const cardCopy = card?.querySelector('p');
  const hotspots = [...document.querySelectorAll('.v3-hotspot')];
  const found = new Set();

  const openDoc = (copy) => {
    if (!docPanel || !docButton || !docCopy) return;
    if (copy) docCopy.textContent = copy;
    docPanel.classList.add('is-open');
    docButton.setAttribute('aria-expanded', 'true');
  };

  if (docButton && docPanel) {
    docButton.addEventListener('click', () => {
      const open = docPanel.classList.toggle('is-open');
      docButton.setAttribute('aria-expanded', String(open));
    });
  }

  document.querySelectorAll('[data-doc-note]').forEach((node) => {
    node.addEventListener('click', () => openDoc(node.dataset.docNote));
  });

  const resolveSignal = (hotspot) => {
    const name = hotspot.dataset.signal || '';
    const detail = hotspot.dataset.detail || '';
    hotspot.classList.add('is-found');
    found.add(name);
    if (discoveryCount) discoveryCount.textContent = String(found.size);
    if (fieldHint) fieldHint.textContent = found.size === hotspots.length ? 'You found the field.' : `${found.size} / ${hotspots.length} signals found.`;
    if (field) field.classList.add('is-awake');
    if (card && cardName && cardCopy) {
      cardName.textContent = name;
      cardCopy.textContent = detail;
      card.classList.add('is-open');
      card.setAttribute('aria-hidden', 'false');
    }
    if (found.size === 1) openDoc('You found a signal. The interface can stay understandable without giving away every layer at once.');
    if (found.size === hotspots.length) openDoc('All six resolved. Different disciplines; the same patterns kept returning.');
    try { localStorage.setItem('ashwood.v3.discovery', JSON.stringify([...found])); } catch (_) {}
  };

  try {
    const saved = JSON.parse(localStorage.getItem('ashwood.v3.discovery') || '[]');
    if (Array.isArray(saved)) saved.forEach((name) => {
      const hotspot = hotspots.find((item) => item.dataset.signal === name);
      if (hotspot) { hotspot.classList.add('is-found'); found.add(name); }
    });
    if (discoveryCount) discoveryCount.textContent = String(found.size);
    if (fieldHint && found.size) fieldHint.textContent = found.size === hotspots.length ? 'You found the field.' : `${found.size} / ${hotspots.length} signals found.`;
  } catch (_) {}

  hotspots.forEach((hotspot) => {
    hotspot.addEventListener('click', () => resolveSignal(hotspot));
    hotspot.addEventListener('mouseenter', () => field?.classList.add('is-awake'));
    hotspot.addEventListener('mouseleave', () => { if (!found.size) field?.classList.remove('is-awake'); });
  });

  if (field) {
    field.addEventListener('pointermove', (event) => {
      const rect = field.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      field.style.setProperty('--field-x', `${Math.max(0, Math.min(100, x))}%`);
      field.style.setProperty('--field-y', `${Math.max(0, Math.min(100, y))}%`);
      field.classList.add('is-awake');
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      docPanel?.classList.remove('is-open');
      docButton?.setAttribute('aria-expanded', 'false');
      card?.classList.remove('is-open');
      card?.setAttribute('aria-hidden', 'true');
    }
  });

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