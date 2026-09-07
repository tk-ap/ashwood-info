(() => {
  const root = document.documentElement;
  const body = document.body;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const coarsePointer = matchMedia('(pointer:coarse)').matches;
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

  /* V3 extends the live system instead of replacing it. */
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

  /* Living identity: always types/backspaces between ASHWOOD and ASHW888D.
     It is synchronized across masthead and the mobile hero mark. */
  const makeWordmarkMarkup = () => '<span class="v3-wordmark__text" data-wordmark-text>ASHWOOD</span><span class="v3-wordmark__caret" aria-hidden="true"></span>';
  const mastMark = document.querySelector('[data-wordmark]');
  if (mastMark) {
    mastMark.innerHTML = makeWordmarkMarkup();
    mastMark.setAttribute('aria-label', 'ASHWOOD living wordmark');
  }
  if (heroCopy && !heroCopy.querySelector('.v3-wordmark--hero')) {
    const mark = document.createElement('div');
    mark.className = 'v3-wordmark v3-wordmark--hero';
    mark.dataset.wordmark = 'hero';
    mark.setAttribute('aria-label', 'ASHWOOD living wordmark');
    mark.innerHTML = makeWordmarkMarkup();
    heroCopy.prepend(mark);
  }
  const wordmarks = [...document.querySelectorAll('[data-wordmark]')];
  const wordmarkTexts = [...document.querySelectorAll('[data-wordmark-text]')];
  const renderWordmark = (text) => {
    wordmarkTexts.forEach((node) => { node.textContent = text; });
    wordmarks.forEach((node) => node.setAttribute('aria-label', `${text} living wordmark`));
  };
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const typeChars = async (base, chars, delay = 145) => {
    let value = base;
    for (const char of chars) {
      value += char;
      renderWordmark(value);
      await wait(delay);
    }
    return value;
  };
  const backspaceTo = async (value, targetLength, delay = 105) => {
    let next = value;
    while (next.length > targetLength) {
      next = next.slice(0, -1);
      renderWordmark(next);
      await wait(delay);
    }
    return next;
  };
  const runLivingMark = async () => {
    if (reduced) { renderWordmark('ASHWOOD'); return; }
    let value = 'ASHWOOD';
    renderWordmark(value);
    await wait(1700);
    while (document.documentElement.isConnected) {
      value = await backspaceTo(value, 4, 105);          // ASHW
      value = await typeChars(value, '888D', 145);       // ASHW888D
      await wait(2100);
      value = await backspaceTo(value, 4, 105);          // ASHW
      value = await typeChars(value, 'OOD', 145);        // ASHWOOD
      await wait(1800);
    }
  };
  setTimeout(runLivingMark, 650);

  const identityStyle = document.createElement('style');
  identityStyle.id = 'v3-living-identity-style';
  identityStyle.textContent = `
    .v3-wordmark{display:inline-flex!important;align-items:baseline;white-space:nowrap;font-weight:500;letter-spacing:.11em!important;line-height:1;text-decoration:none;text-transform:uppercase;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif}
    .v3-wordmark__text{display:inline-block;min-width:8.8ch;font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1}
    .v3-wordmark__caret{display:none;width:1px;height:.92em;margin-left:.13em;background:currentColor;opacity:.78;animation:v3-wordmark-caret 1.05s steps(1,end) infinite}
    .v3-wordmark--hero{display:none;margin:0 0 24px;color:var(--ashwood-ink);font-size:clamp(22px,7.5vw,34px);letter-spacing:.13em!important}
    html[data-ashwood-theme="phosphor-cyber"] .v3-wordmark__text{color:var(--ashwood-field-green);text-shadow:0 0 10px rgba(var(--ashwood-field-green-rgb),.32)}
    html[data-ashwood-theme="phosphor-cyber"] .v3-wordmark__caret{display:inline-block;color:var(--ashwood-field-green);box-shadow:0 0 7px rgba(var(--ashwood-field-green-rgb),.45)}
    .v3-name-audio{position:relative;z-index:3;margin:0 0 22px!important}
    .v3-name-audio .ashwood-name-audio__trigger.is-touch-revealed .ashwood-name-audio__ashwood{opacity:0;transform:translateY(-2px);animation:none}
    .v3-name-audio .ashwood-name-audio__trigger.is-touch-revealed .ashwood-name-audio__inme{opacity:1;transform:translateY(0)}
    @keyframes v3-wordmark-caret{0%,48%{opacity:.82}49%,100%{opacity:.16}}
    @media(max-width:900px){.v3-wordmark--hero{display:inline-flex}.v3-mast .v3-wordmark{font-size:11px}.v3-hero__copy{padding-top:108px}}
    @media(prefers-reduced-motion:reduce){.v3-wordmark__caret{display:none!important;animation:none!important}}
  `;
  document.head.appendChild(identityStyle);

  /* Restore the live hidden IN ME interaction rather than a conventional music label.
     Same ASHWOOD -> IN ME reveal, same persistent player, same ignition language. */
  let nameAudio = heroCopy?.querySelector('.v3-name-audio');
  if (heroCopy && !nameAudio) {
    nameAudio = document.createElement('p');
    nameAudio.className = 'eyebrow ashwood-name-audio v3-name-audio';
    nameAudio.innerHTML = `
      <span class="ashwood-name-audio__primary">
        <span>TAHLIA </span><button class="ashwood-name-audio__trigger" type="button" aria-label="Play IN ME"><span class="ashwood-name-audio__ashwood">ASHWOOD</span><span class="ashwood-name-audio__inme" aria-hidden="true">IN ME</span></button><span> PEART</span>
      </span>
      <span class="ashwood-name-audio__secondary">TK ASHWOOD / CREATIVE PRACTICE</span>`;
    const heroMark = heroCopy.querySelector('.v3-wordmark--hero');
    if (heroMark) heroMark.insertAdjacentElement('afterend', nameAudio);
    else heroCopy.prepend(nameAudio);
  }

  const audioTrigger = nameAudio?.querySelector('.ashwood-name-audio__trigger');
  const sourceToggle = document.querySelector('.ashwood-audio__toggle');
  if (audioTrigger && sourceToggle) {
    let cinematic = document.querySelector('.ashwood-home-ignition');
    if (!cinematic) {
      cinematic = document.createElement('div');
      cinematic.className = 'ashwood-home-ignition';
      cinematic.setAttribute('aria-hidden', 'true');
      cinematic.innerHTML = '<span class="ashwood-home-ignition__core"></span><span class="ashwood-home-ignition__bloom"></span><span class="ashwood-home-ignition__wave"></span>';
      document.body.appendChild(cinematic);
    }
    let cinematicTimer = 0;
    let touchRevealTimer = 0;
    const sourceIsPlaying = () => sourceToggle.textContent.trim().toLowerCase() === 'pause';
    const setIgnitionOrigin = () => {
      const rect = audioTrigger.getBoundingClientRect();
      root.style.setProperty('--ashwood-ignition-x', `${rect.left + rect.width / 2}px`);
      root.style.setProperty('--ashwood-ignition-y', `${rect.top + rect.height / 2}px`);
    };
    const triggerIgnition = () => {
      clearTimeout(cinematicTimer);
      setIgnitionOrigin();
      body.classList.remove('is-inner-igniting');
      void cinematic.offsetWidth;
      body.classList.add('is-inner-igniting');
      cinematicTimer = setTimeout(() => body.classList.remove('is-inner-igniting'), 6100);
    };
    const renderAudioTrigger = () => {
      const playing = sourceIsPlaying();
      audioTrigger.classList.toggle('is-playing', playing);
      audioTrigger.setAttribute('aria-label', playing ? 'Pause IN ME' : 'Play IN ME');
      audioTrigger.setAttribute('aria-pressed', String(playing));
    };
    audioTrigger.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const wasPlaying = sourceIsPlaying();
      sourceToggle.click();
      if (!wasPlaying) triggerIgnition();
      if (coarsePointer) {
        clearTimeout(touchRevealTimer);
        audioTrigger.classList.add('is-touch-revealed');
        touchRevealTimer = setTimeout(() => audioTrigger.classList.remove('is-touch-revealed'), 1900);
      }
      requestAnimationFrame(renderAudioTrigger);
      setTimeout(renderAudioTrigger, 90);
    });
    new MutationObserver(renderAudioTrigger).observe(sourceToggle, { childList:true, characterData:true, subtree:true });
    addEventListener('resize', setIgnitionOrigin, { passive:true });
    setIgnitionOrigin();
    renderAudioTrigger();
  }

  const saveDiscovery = () => { try { localStorage.setItem(storageKey, JSON.stringify([...found])); } catch (_) {} };
  const updateDiscoveryUI = () => {
    if (fieldHint) fieldHint.textContent = !found.size ? 'There is more here.' : found.size === hotspots.length ? 'You found the field.' : `${found.size} / ${hotspots.length} signals found.`;
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
    updateDiscoveryUI();
    saveDiscovery();
    window.AshwoodDocCharacterV2?.stimulate?.(hotspot,{force:true,priority:1,delay:120});
  };
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(saved)) saved.forEach(name => {
      const h = hotspots.find(x => x.dataset.signal === name);
      if (h) { h.classList.add('is-found'); found.add(name); }
    });
  } catch (_) {}
  updateDiscoveryUI();
  hotspots.forEach(h => h.addEventListener('click', () => resolveSignal(h)));
  document.querySelectorAll('[data-doc-note]').forEach(node => node.addEventListener('click', () => window.AshwoodDocCharacterV2?.stimulate?.(node,{force:true,priority:1,delay:80})));

  const updatePointer = (event) => {
    root.style.setProperty('--v3-mx', `${event.clientX}px`);
    root.style.setProperty('--v3-my', `${event.clientY}px`);
    if (heroCopy) {
      const r=heroCopy.getBoundingClientRect();
      heroCopy.style.setProperty('--hero-x',`${Math.max(0,Math.min(100,((event.clientX-r.left)/Math.max(r.width,1))*100))}%`);
      heroCopy.style.setProperty('--hero-y',`${Math.max(0,Math.min(100,((event.clientY-r.top)/Math.max(r.height,1))*100))}%`);
    }
    if (heroImage) {
      const r=heroImage.getBoundingClientRect();
      if(event.clientY>=r.top&&event.clientY<=r.bottom){
        const nx=((event.clientX-r.left)/Math.max(r.width,1))-.5;
        const ny=((event.clientY-r.top)/Math.max(r.height,1))-.5;
        heroImage.style.setProperty('--hero-pan-x',`${nx*-14}px`);
        heroImage.style.setProperty('--hero-pan-y',`${ny*-10}px`);
      }
    }
    if (field) {
      const r=field.getBoundingClientRect();
      if(event.clientY>=r.top-100&&event.clientY<=r.bottom+100){
        field.style.setProperty('--field-x',`${Math.max(0,Math.min(100,((event.clientX-r.left)/Math.max(r.width,1))*100))}%`);
        field.style.setProperty('--field-y',`${Math.max(0,Math.min(100,((event.clientY-r.top)/Math.max(r.height,1))*100))}%`);
        field.classList.add('is-awake');
      }
      hotspots.forEach(spot=>{
        const s=spot.getBoundingClientRect();
        spot.classList.toggle('is-near',Math.hypot(event.clientX-(s.left+s.width/2),event.clientY-(s.top+s.height/2))<125);
      });
    }
    latent.forEach(node=>{
      const r=node.getBoundingClientRect();
      node.classList.toggle('is-near',Math.hypot(event.clientX-(r.left+r.width/2),event.clientY-(r.top+r.height/2))<120);
    });
    products.forEach((card,i)=>{
      const r=card.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
      const d=Math.hypot(event.clientX-cx,event.clientY-cy);
      const near=d<Math.max(r.width,r.height)*.82;
      card.classList.toggle('is-near',near);
      if(near){
        const nx=(event.clientX-cx)/Math.max(r.width,1),ny=(event.clientY-cy)/Math.max(r.height,1),base=[-1.5,1.4,.6][i]||0;
        card.style.transform=`translate3d(${nx*6}px,${ny*5}px,0) rotate(${base+nx*1.3}deg) rotateX(${ny*-2.4}deg) rotateY(${nx*3.2}deg)`;
      } else card.style.removeProperty('transform');
    });
  };
  if (finePointer && !reduced) document.addEventListener('pointermove',updatePointer,{passive:true});

  const updateScroll = () => {
    const max=Math.max(1,document.documentElement.scrollHeight-innerHeight),progress=(scrollY/max)*100;
    root.style.setProperty('--v3-scroll',String(progress));
  };
  updateScroll();
  addEventListener('scroll',updateScroll,{passive:true});

  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('is-visible');reveal.unobserve(entry.target);}
    }),{threshold:.12,rootMargin:'0px 0px -6% 0px'});
    document.querySelectorAll('.v3-reveal').forEach(el=>reveal.observe(el));
  } else document.querySelectorAll('.v3-reveal').forEach(el=>el.classList.add('is-visible'));

  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){
      signalCard?.classList.remove('is-open');
      signalCard?.setAttribute('aria-hidden','true');
    }
  });
})();