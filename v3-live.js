(() => {
  const root = document.documentElement;
  const body = document.body;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  const field = document.querySelector('.v3-field');
  const fieldHint = document.querySelector('.v3-field__hint');
  const hotspots = [...document.querySelectorAll('.v3-hotspot')];
  const latent = [...document.querySelectorAll('.v3-latent')];
  const products = [...document.querySelectorAll('.v3-product')];
  const heroImage = document.querySelector('.v3-hero__image img');
  const heroCopy = document.querySelector('.v3-hero__copy');
  const wordmark = document.querySelector('[data-wordmark]');
  const doc = document.querySelector('.v3-doc');
  const docPanel = document.querySelector('.v3-doc-panel');
  const docVisual = document.querySelector('.v3-doc-visual');
  const docCopy = docPanel?.querySelector('p');
  const docMeta = docPanel?.querySelector('[data-doc-chapter]');
  const discoveryCount = docPanel?.querySelector('[data-discovery-count]');
  const signalCard = document.querySelector('.v3-signal-card');
  const signalName = signalCard?.querySelector('strong');
  const signalCopy = signalCard?.querySelector('p');
  const storageKey = 'ashwood.v3.discovery';
  const found = new Set();

  const docNotes = {
    hero: 'One person can hold many forms. The interface begins with identity, not taxonomy.',
    thinking: 'Move toward a signal. The field answers before you click; discovery is part of the meaning.',
    evidence: 'Modeling, music, writing, and systems are not competing identities. They are manifestations of the same practice.',
    depth: 'Nothing has been removed for being “too much.” Deeper material simply reveals itself in layers.',
    continue: 'The system can settle without becoming empty. You leave with one invitation and many possible paths.'
  };

  const setDocCopy = (copy) => { if (docCopy && copy) docCopy.textContent = copy; };
  const setDocChapter = (name) => { if (docMeta) docMeta.textContent = name.toUpperCase(); };
  const openDoc = (copy) => {
    if (!doc || !docPanel) return;
    if (copy) setDocCopy(copy);
    docPanel.classList.add('is-open');
    doc.setAttribute('aria-expanded', 'true');
  };

  const saveDiscovery = () => {
    try { localStorage.setItem(storageKey, JSON.stringify([...found])); } catch (_) {}
  };

  const updateDiscoveryUI = () => {
    if (discoveryCount) discoveryCount.textContent = String(found.size);
    if (fieldHint) {
      if (!found.size) fieldHint.textContent = 'There is more here.';
      else if (found.size === hotspots.length) fieldHint.textContent = 'You found the field.';
      else fieldHint.textContent = `${found.size} / ${hotspots.length} signals found.`;
    }
    if (found.size >= 3) body.dataset.v3Mark = '888';
    else if (found.size > 0) body.dataset.v3Mark = 'mutating';
    else body.dataset.v3Mark = 'rest';
  };

  const resolveSignal = (hotspot, announce = true) => {
    const name = hotspot.dataset.signal || '';
    const detail = hotspot.dataset.detail || '';
    hotspot.classList.add('is-found');
    found.add(name);
    if (field) field.classList.add('is-awake');
    if (signalCard && signalName && signalCopy) {
      signalName.textContent = name;
      signalCopy.textContent = detail;
      signalCard.classList.add('is-open');
      signalCard.setAttribute('aria-hidden', 'false');
    }
    updateDiscoveryUI();
    saveDiscovery();
    if (announce && found.size === 1) openDoc('You found one. ASHWOOD rewards curiosity because there is always another layer underneath the obvious one.');
    if (announce && found.size === hotspots.length) openDoc('All six resolved. The pattern is not simplification; it is coherence across range.');
  };

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(saved)) saved.forEach((name) => {
      const hotspot = hotspots.find((item) => item.dataset.signal === name);
      if (hotspot) { hotspot.classList.add('is-found'); found.add(name); }
    });
  } catch (_) {}
  updateDiscoveryUI();

  document.querySelectorAll('[data-doc-note]').forEach((node) => node.addEventListener('click', () => openDoc(node.dataset.docNote)));
  hotspots.forEach((hotspot) => hotspot.addEventListener('click', () => resolveSignal(hotspot)));

  if (doc && docPanel) {
    doc.addEventListener('click', () => {
      const opening = !docPanel.classList.contains('is-open');
      docPanel.classList.toggle('is-open', opening);
      doc.setAttribute('aria-expanded', String(opening));
      if (opening) setDocCopy(docNotes[body.dataset.v3Chapter || 'hero']);
    });
  }

  const updatePointer = (event) => {
    root.style.setProperty('--v3-mx', `${event.clientX}px`);
    root.style.setProperty('--v3-my', `${event.clientY}px`);

    if (wordmark) {
      const r = wordmark.getBoundingClientRect();
      const near = Math.hypot(event.clientX - (r.left + r.width / 2), event.clientY - (r.top + r.height / 2)) < 150;
      wordmark.classList.toggle('is-proximate', near);
      if (near && found.size < 3) body.dataset.v3Mark = 'mutating';
      else if (!near && found.size === 0 && root.dataset.ashwoodTheme !== 'phosphor-cyber') body.dataset.v3Mark = 'rest';
      else if (!near && found.size > 0 && found.size < 3 && root.dataset.ashwoodTheme !== 'phosphor-cyber') body.dataset.v3Mark = 'mutating';
    }

    if (docVisual) {
      const r = docVisual.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((event.clientX-r.left)/Math.max(r.width,1))*100));
      const y = Math.max(0, Math.min(100, ((event.clientY-r.top)/Math.max(r.height,1))*100));
      docVisual.style.setProperty('--doc-x', `${x}%`);
      docVisual.style.setProperty('--doc-y', `${y}%`);
    }

    if (heroCopy) {
      const r = heroCopy.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((event.clientX-r.left)/Math.max(r.width,1))*100));
      const y = Math.max(0, Math.min(100, ((event.clientY-r.top)/Math.max(r.height,1))*100));
      heroCopy.style.setProperty('--hero-x', `${x}%`);
      heroCopy.style.setProperty('--hero-y', `${y}%`);
    }

    if (heroImage) {
      const r = heroImage.getBoundingClientRect();
      if (event.clientY >= r.top && event.clientY <= r.bottom) {
        const nx = ((event.clientX-r.left)/Math.max(r.width,1))-.5;
        const ny = ((event.clientY-r.top)/Math.max(r.height,1))-.5;
        heroImage.style.setProperty('--hero-pan-x', `${nx*-14}px`);
        heroImage.style.setProperty('--hero-pan-y', `${ny*-10}px`);
      }
    }

    if (field) {
      const r = field.getBoundingClientRect();
      if (event.clientY >= r.top-100 && event.clientY <= r.bottom+100) {
        const x = Math.max(0, Math.min(100, ((event.clientX-r.left)/Math.max(r.width,1))*100));
        const y = Math.max(0, Math.min(100, ((event.clientY-r.top)/Math.max(r.height,1))*100));
        field.style.setProperty('--field-x', `${x}%`);
        field.style.setProperty('--field-y', `${y}%`);
        field.classList.add('is-awake');
      }
      hotspots.forEach((spot) => {
        const s = spot.getBoundingClientRect();
        const distance = Math.hypot(event.clientX-(s.left+s.width/2),event.clientY-(s.top+s.height/2));
        spot.classList.toggle('is-near', distance < 125);
      });
    }

    latent.forEach((node) => {
      const r = node.getBoundingClientRect();
      node.classList.toggle('is-near', Math.hypot(event.clientX-(r.left+r.width/2),event.clientY-(r.top+r.height/2)) < 120);
    });

    products.forEach((card, i) => {
      const r = card.getBoundingClientRect();
      const cx=r.left+r.width/2, cy=r.top+r.height/2;
      const distance=Math.hypot(event.clientX-cx,event.clientY-cy);
      const near=distance < Math.max(r.width,r.height)*.82;
      card.classList.toggle('is-near', near);
      if (near) {
        const nx=(event.clientX-cx)/Math.max(r.width,1);
        const ny=(event.clientY-cy)/Math.max(r.height,1);
        const base=[-1.5,1.4,.6][i]||0;
        card.style.transform=`translate3d(${nx*6}px,${ny*5}px,0) rotate(${base + nx*1.3}deg) rotateX(${ny*-2.4}deg) rotateY(${nx*3.2}deg)`;
      } else card.style.removeProperty('transform');
    });
  };
  if (finePointer && !reduced) document.addEventListener('pointermove', updatePointer, {passive:true});

  const updateScroll = () => {
    const max = Math.max(1, document.documentElement.scrollHeight-window.innerHeight);
    const progress = (window.scrollY/max)*100;
    root.style.setProperty('--v3-scroll', String(progress));
    if (found.size < 3 && root.dataset.ashwoodTheme !== 'phosphor-cyber') {
      if (progress > 11) body.dataset.v3Mark = 'mutating';
      else if (!found.size && !wordmark?.classList.contains('is-proximate')) body.dataset.v3Mark = 'rest';
    }
  };
  updateScroll();
  window.addEventListener('scroll', updateScroll, {passive:true});

  document.addEventListener('ashwood:theme-change', (event) => {
    if (event.detail?.theme === 'phosphor-cyber') body.dataset.v3Mark = '888';
    else updateDiscoveryUI();
  });
  if (root.dataset.ashwoodTheme === 'phosphor-cyber') body.dataset.v3Mark = '888';

  const sections = [
    ['hero', document.querySelector('.v3-hero')],
    ['thinking', document.querySelector('#thinking')],
    ['evidence', document.querySelector('#evidence')],
    ['depth', document.querySelector('#depth')],
    ['continue', document.querySelector('#continue')]
  ].filter(([,el])=>el);

  if ('IntersectionObserver' in window) {
    const chapterObserver = new IntersectionObserver((entries) => {
      const active = entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if (!active) return;
      const row=sections.find(([,el])=>el===active.target);
      if (!row) return;
      body.dataset.v3Chapter=row[0];
      setDocChapter(row[0]);
      if (docPanel?.classList.contains('is-open')) setDocCopy(docNotes[row[0]]);
    }, {threshold:[.18,.35,.55,.75]});
    sections.forEach(([,el])=>chapterObserver.observe(el));

    const revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }), {threshold:.12,rootMargin:'0px 0px -6% 0px'});
    document.querySelectorAll('.v3-reveal').forEach((el) => revealObserver.observe(el));
  } else document.querySelectorAll('.v3-reveal').forEach((el) => el.classList.add('is-visible'));

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    docPanel?.classList.remove('is-open');
    doc?.setAttribute('aria-expanded','false');
    signalCard?.classList.remove('is-open');
    signalCard?.setAttribute('aria-hidden','true');
  });
})();
