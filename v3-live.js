(() => {
  const root = document.documentElement;
  const body = document.body;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  const field = document.querySelector('.v3-field');
  const hotspots = [...document.querySelectorAll('.v3-hotspot')];
  const latent = [...document.querySelectorAll('.v3-latent')];
  const products = [...document.querySelectorAll('.v3-product')];
  const heroImage = document.querySelector('.v3-hero__image img');
  const heroCopy = document.querySelector('.v3-hero__copy');
  const doc = document.querySelector('.v3-doc');
  const docPanel = document.querySelector('.v3-doc-panel');
  const docVisual = document.querySelector('.v3-doc-visual');
  const docCopy = docPanel?.querySelector('p');
  const docMeta = docPanel?.querySelector('[data-doc-chapter]');
  const signalCard = document.querySelector('.v3-signal-card');
  const signalName = signalCard?.querySelector('strong');
  const signalCopy = signalCard?.querySelector('p');

  const docNotes = {
    hero: 'Identity first. The interface can stay quiet until you ask more of it.',
    thinking: 'This is the field. Move toward a signal and the interface answers before you click.',
    evidence: 'The work gets visual authority here. The system should recede without becoming inert.',
    depth: 'Deeper paths resolve after the primary story is understood.',
    continue: 'The system settles. One clear invitation remains.'
  };

  const setDocCopy = (copy) => { if (docCopy && copy) docCopy.textContent = copy; };
  const setDocChapter = (name) => { if (docMeta) docMeta.textContent = name.toUpperCase(); };

  const openDoc = (copy) => {
    if (!doc || !docPanel) return;
    setDocCopy(copy);
    docPanel.classList.add('is-open');
    doc.setAttribute('aria-expanded', 'true');
  };

  document.querySelectorAll('[data-doc-note]').forEach((node) => {
    node.addEventListener('click', () => openDoc(node.dataset.docNote));
  });

  const updatePointer = (event) => {
    root.style.setProperty('--v3-mx', `${event.clientX}px`);
    root.style.setProperty('--v3-my', `${event.clientY}px`);

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
        const sx = s.left+s.width/2, sy=s.top+s.height/2;
        const distance = Math.hypot(event.clientX-sx,event.clientY-sy);
        spot.classList.toggle('is-near', distance < 125);
      });
    }

    latent.forEach((node) => {
      const r = node.getBoundingClientRect();
      const cx = r.left+r.width/2, cy=r.top+r.height/2;
      node.classList.toggle('is-near', Math.hypot(event.clientX-cx,event.clientY-cy) < 120);
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
      } else {
        card.style.removeProperty('transform');
      }
    });
  };

  if (finePointer && !reduced) document.addEventListener('pointermove', updatePointer, {passive:true});

  const updateScroll = () => {
    const max = Math.max(1, document.documentElement.scrollHeight-window.innerHeight);
    root.style.setProperty('--v3-scroll', String((window.scrollY/max)*100));
  };
  updateScroll();
  window.addEventListener('scroll', updateScroll, {passive:true});

  const sections = [
    ['hero', document.querySelector('.v3-hero')],
    ['thinking', document.querySelector('#thinking')],
    ['evidence', document.querySelector('#evidence')],
    ['depth', document.querySelector('#depth')],
    ['continue', document.querySelector('#continue')]
  ].filter(([,el])=>el);

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      const active = entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if (!active) return;
      const row=sections.find(([,el])=>el===active.target);
      if (!row) return;
      body.dataset.v3Chapter=row[0];
      setDocChapter(row[0]);
      if (docPanel?.classList.contains('is-open')) setDocCopy(docNotes[row[0]]);
    }, {threshold:[.18,.35,.55,.75]});
    sections.forEach(([,el])=>observer.observe(el));
  }

  const legacyResolve = (hotspot) => {
    const name=hotspot.dataset.signal||'';
    const detail=hotspot.dataset.detail||'';
    hotspot.classList.add('is-found');
    if (signalCard && signalName && signalCopy) {
      signalName.textContent=name;
      signalCopy.textContent=detail;
      signalCard.classList.add('is-open');
      signalCard.setAttribute('aria-hidden','false');
    }
  };
  hotspots.forEach(h=>h.addEventListener('click',()=>legacyResolve(h)));

  if (doc && docPanel) {
    doc.addEventListener('click', () => {
      const opening=!docPanel.classList.contains('is-open');
      docPanel.classList.toggle('is-open', opening);
      doc.setAttribute('aria-expanded', String(opening));
      if (opening) setDocCopy(docNotes[body.dataset.v3Chapter||'hero']);
    });
  }

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    docPanel?.classList.remove('is-open');
    doc?.setAttribute('aria-expanded','false');
    signalCard?.classList.remove('is-open');
    signalCard?.setAttribute('aria-hidden','true');
  });
})();
