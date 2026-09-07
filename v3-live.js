(() => {
  const root = document.documentElement;
  const body = document.body;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const field = document.querySelector('.v3-field');
  const fieldHint = document.querySelector('.v3-field__hint');
  const hotspots = [...document.querySelectorAll('.v3-hotspot')];
  const latent = [...document.querySelectorAll('.v3-latent')];
  const products = [...document.querySelectorAll('.v3-product')];
  const heroImage = document.querySelector('.v3-hero__image img');
  const heroCopy = document.querySelector('.v3-hero__copy');
  const signalCard = document.querySelector('.v3-signal-card');
  const signalName = signalCard?.querySelector('strong');
  const signalCopy = signalCard?.querySelector('p');
  const storageKey = 'ashwood.v3.discovery';
  const found = new Set();

  /* V3 must extend, not imitate, the live ASHWOOD behavior. Remove the preview-only
     Doc replacement and load the actual Doctor Bird + Doc character runtime. */
  document.querySelector('.v3-doc')?.remove();
  document.querySelector('.v3-doc-panel')?.remove();
  heroCopy?.classList.add('intro');
  field?.classList.add('principles-field');
  document.querySelector('.v3-product-field')?.classList.add('home-entryways');
  document.querySelector('#depth')?.classList.add('home-now-editorial');
  document.querySelector('#continue')?.classList.add('home-closing');

  const loadScript = (src) => new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-v3-runtime="${src}"]`)) return resolve();
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.dataset.v3Runtime = src;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
  loadScript('/doctor-bird-trigger.js?v=20260907-canonical-doc')
    .then(() => loadScript('/doc-character-v2.js?v=20260907-canonical-doc'))
    .catch(() => {});

  const wordmarkMarkup = '<span class="v3-wordmark__prefix">ASHW</span><span class="v3-wordmark__glyph"><span class="v3-wordmark__o">O</span><span class="v3-wordmark__eight">8</span></span><span class="v3-wordmark__glyph"><span class="v3-wordmark__o">O</span><span class="v3-wordmark__eight">8</span></span><span class="v3-wordmark__glyph v3-wordmark__glyph--emergent" aria-hidden="true"><span class="v3-wordmark__eight">8</span></span><span class="v3-wordmark__suffix">D</span>';
  if (heroCopy && !heroCopy.querySelector('.v3-wordmark--hero')) {
    const mark = document.createElement('div');
    mark.className = 'v3-wordmark v3-wordmark--hero';
    mark.dataset.wordmark = 'hero';
    mark.setAttribute('aria-label', 'ASHWOOD living mark');
    mark.innerHTML = wordmarkMarkup;
    heroCopy.prepend(mark);
  }
  const wordmarks = [...document.querySelectorAll('[data-wordmark]')];

  const markStyle = document.createElement('style');
  markStyle.textContent = `
    .v3-wordmark{display:inline-flex;align-items:baseline;white-space:nowrap;font-weight:600;letter-spacing:.16em;text-transform:uppercase}
    .v3-wordmark__glyph{position:relative;display:inline-grid;place-items:center;width:.9em;margin:0 .01em}
    .v3-wordmark__o,.v3-wordmark__eight{grid-area:1/1;transition:opacity .55s ease,transform .7s cubic-bezier(.18,.78,.2,1),filter .55s ease}
    .v3-wordmark__eight{opacity:0;transform:scale(.82) rotate(-8deg);filter:blur(4px)}
    .v3-wordmark__glyph--emergent{width:0;margin:0;opacity:0;overflow:visible;transition:width .7s cubic-bezier(.18,.78,.2,1),opacity .55s ease,margin .7s ease}
    body[data-v3-mark="mutating"] .v3-wordmark__o{opacity:.45;transform:scale(.96)}
    body[data-v3-mark="mutating"] .v3-wordmark__eight{opacity:.58;transform:scale(.94) rotate(-2deg);filter:blur(.7px)}
    body[data-v3-mark="mutating"] .v3-wordmark__glyph--emergent{width:.35em;margin-left:-.25em;opacity:.26}
    body[data-v3-mark="888"] .v3-wordmark__o{opacity:0;transform:scale(.82);filter:blur(3px)}
    body[data-v3-mark="888"] .v3-wordmark__eight{opacity:1;transform:scale(1) rotate(0);filter:blur(0)}
    body[data-v3-mark="888"] .v3-wordmark__glyph--emergent{width:.9em;margin:0 .01em;opacity:1}
    .v3-wordmark--hero{display:none;margin:0 0 22px;color:var(--ashwood-muted);font-size:clamp(18px,6vw,28px);letter-spacing:.2em}
    html[data-ashwood-theme="phosphor-cyber"] .v3-wordmark__eight{color:var(--ashwood-field-green);text-shadow:0 0 12px rgba(var(--ashwood-field-green-rgb),.35)}
    @media(max-width:900px){.v3-wordmark--hero{display:inline-flex}.v3-mast .v3-wordmark{font-size:11px}.v3-hero__copy{padding-top:108px}}
    @media(prefers-reduced-motion:reduce){.v3-wordmark__o,.v3-wordmark__eight,.v3-wordmark__glyph--emergent{transition:none!important}}
  `;
  document.head.appendChild(markStyle);

  const saveDiscovery = () => { try { localStorage.setItem(storageKey, JSON.stringify([...found])); } catch (_) {} };
  const updateDiscoveryUI = () => {
    if (fieldHint) fieldHint.textContent = !found.size ? 'There is more here.' : found.size === hotspots.length ? 'You found the field.' : `${found.size} / ${hotspots.length} signals found.`;
    if (root.dataset.ashwoodTheme === 'phosphor-cyber' || found.size >= 3) body.dataset.v3Mark = '888';
    else if (found.size > 0) body.dataset.v3Mark = 'mutating';
    else body.dataset.v3Mark = 'rest';
  };
  const resolveSignal = (hotspot) => {
    const name = hotspot.dataset.signal || '';
    hotspot.classList.add('is-found');
    found.add(name);
    field?.classList.add('is-awake');
    if (signalCard && signalName && signalCopy) {
      signalName.textContent = name;
      signalCopy.textContent = hotspot.dataset.detail || '';
      signalCard.classList.add('is-open');
      signalCard.setAttribute('aria-hidden','false');
    }
    updateDiscoveryUI(); saveDiscovery();
    window.AshwoodDocCharacterV2?.stimulate?.(hotspot,{force:true,priority:1,delay:120});
  };
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(saved)) saved.forEach(name => { const h = hotspots.find(x => x.dataset.signal === name); if (h) { h.classList.add('is-found'); found.add(name); } });
  } catch (_) {}
  updateDiscoveryUI();
  hotspots.forEach(h => h.addEventListener('click', () => resolveSignal(h)));
  document.querySelectorAll('[data-doc-note]').forEach(node => node.addEventListener('click', () => window.AshwoodDocCharacterV2?.stimulate?.(node,{force:true,priority:1,delay:80})));

  const updatePointer = (event) => {
    root.style.setProperty('--v3-mx', `${event.clientX}px`); root.style.setProperty('--v3-my', `${event.clientY}px`);
    wordmarks.forEach(wordmark => {
      const r = wordmark.getBoundingClientRect();
      const near = Math.hypot(event.clientX-(r.left+r.width/2),event.clientY-(r.top+r.height/2)) < 150;
      wordmark.classList.toggle('is-proximate',near);
      if (near && found.size < 3 && root.dataset.ashwoodTheme !== 'phosphor-cyber') body.dataset.v3Mark='mutating';
    });
    if (heroCopy) { const r=heroCopy.getBoundingClientRect(); heroCopy.style.setProperty('--hero-x',`${Math.max(0,Math.min(100,((event.clientX-r.left)/Math.max(r.width,1))*100))}%`); heroCopy.style.setProperty('--hero-y',`${Math.max(0,Math.min(100,((event.clientY-r.top)/Math.max(r.height,1))*100))}%`); }
    if (heroImage) { const r=heroImage.getBoundingClientRect(); if(event.clientY>=r.top&&event.clientY<=r.bottom){ const nx=((event.clientX-r.left)/Math.max(r.width,1))-.5,ny=((event.clientY-r.top)/Math.max(r.height,1))-.5; heroImage.style.setProperty('--hero-pan-x',`${nx*-14}px`); heroImage.style.setProperty('--hero-pan-y',`${ny*-10}px`);} }
    if (field) {
      const r=field.getBoundingClientRect();
      if(event.clientY>=r.top-100&&event.clientY<=r.bottom+100){ field.style.setProperty('--field-x',`${Math.max(0,Math.min(100,((event.clientX-r.left)/Math.max(r.width,1))*100))}%`); field.style.setProperty('--field-y',`${Math.max(0,Math.min(100,((event.clientY-r.top)/Math.max(r.height,1))*100))}%`); field.classList.add('is-awake'); }
      hotspots.forEach(spot=>{const s=spot.getBoundingClientRect();spot.classList.toggle('is-near',Math.hypot(event.clientX-(s.left+s.width/2),event.clientY-(s.top+s.height/2))<125);});
    }
    latent.forEach(node=>{const r=node.getBoundingClientRect();node.classList.toggle('is-near',Math.hypot(event.clientX-(r.left+r.width/2),event.clientY-(r.top+r.height/2))<120);});
    products.forEach((card,i)=>{const r=card.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,d=Math.hypot(event.clientX-cx,event.clientY-cy),near=d<Math.max(r.width,r.height)*.82;card.classList.toggle('is-near',near);if(near){const nx=(event.clientX-cx)/Math.max(r.width,1),ny=(event.clientY-cy)/Math.max(r.height,1),base=[-1.5,1.4,.6][i]||0;card.style.transform=`translate3d(${nx*6}px,${ny*5}px,0) rotate(${base+nx*1.3}deg) rotateX(${ny*-2.4}deg) rotateY(${nx*3.2}deg)`;}else card.style.removeProperty('transform');});
  };
  if (finePointer && !reduced) document.addEventListener('pointermove',updatePointer,{passive:true});

  const updateScroll = () => {
    const max=Math.max(1,document.documentElement.scrollHeight-innerHeight),progress=(scrollY/max)*100;
    root.style.setProperty('--v3-scroll',String(progress));
    if(root.dataset.ashwoodTheme!=='phosphor-cyber'&&found.size<3){ if(progress>8) body.dataset.v3Mark='mutating'; else updateDiscoveryUI(); }
  };
  updateScroll(); addEventListener('scroll',updateScroll,{passive:true});
  document.addEventListener('ashwood:theme-change',e=>{ if(e.detail?.theme==='phosphor-cyber') body.dataset.v3Mark='888'; else updateDiscoveryUI(); });

  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');reveal.unobserve(entry.target);}}),{threshold:.12,rootMargin:'0px 0px -6% 0px'});
    document.querySelectorAll('.v3-reveal').forEach(el=>reveal.observe(el));
  } else document.querySelectorAll('.v3-reveal').forEach(el=>el.classList.add('is-visible'));

  document.addEventListener('keydown',e=>{if(e.key==='Escape'){signalCard?.classList.remove('is-open');signalCard?.setAttribute('aria-hidden','true');}});
})();