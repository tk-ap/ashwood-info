(() => {
  "use strict";

  const identity = document.querySelector('.v3-identity');
  if (!identity) return;

  const manifestationsList = [
    { label:'MODELING', href:'/portfolio/' },
    { label:'MUSIC', href:'/music/' },
    { label:'BUILD JOURNAL', href:'/journal/' },
    { label:'DISPATCH', href:'/dispatch/' },
    { label:'AI FROM ZERO', href:'/ai-from-zero/' },
    { label:'CREATIVE DIRECTION', href:'/going/' },
    { label:'ABOUT', href:'/about/' },
    { label:'THE INSTINCT', href:'/dive-deeper/' }
  ];

  document.querySelector('.v3-provenance')?.remove();
  document.querySelector('.v3-manifesto-note')?.remove();

  const style = document.createElement('style');
  style.id = 'v3-identity-thesis-style';
  style.textContent = `
    .v3-identity{position:relative;margin-top:28px}
    .v3-identity-statement{display:inline-flex;align-items:baseline;gap:.18em;max-width:100%;white-space:nowrap}
    .v3-identity-origin,.v3-manifestations{border:0;padding:0;background:none;color:inherit;font:inherit;line-height:inherit;letter-spacing:inherit;text-decoration:none;cursor:pointer}
    .v3-identity-origin{position:relative;flex:0 0 auto}
    .v3-identity-origin::after{content:"";position:absolute;left:0;right:0;bottom:-.14em;height:1px;background:currentColor;transform:scaleX(0);transform-origin:left;opacity:.45;transition:transform .3s ease}
    .v3-identity-origin:hover::after,.v3-identity-origin:focus-visible::after,.v3-identity-origin[aria-expanded="true"]::after{transform:scaleX(1)}

    /* The reel owns a permanently reserved viewport measured from the idle label.
       Labels move inside it; they never change surrounding line geometry. */
    .v3-manifestations{position:relative;display:inline-block;flex:0 0 var(--v3-reel-width,auto);width:var(--v3-reel-width,auto);height:1.08em;overflow:hidden;vertical-align:-.05em;white-space:nowrap;background:linear-gradient(105deg,var(--ashwood-ink),var(--ashwood-gold),var(--ashwood-field-green),var(--ashwood-ink));background-size:260% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:v3-shimmer 9s ease-in-out infinite;contain:layout paint}
    .v3-manifestations:hover{filter:saturate(1.2) brightness(1.08)}
    .v3-manifestations__label{position:absolute;inset:0;display:block;width:100%;white-space:nowrap;transform:translate3d(0,0,0);opacity:1;transition:transform .22s cubic-bezier(.2,.75,.25,1),opacity .18s ease;will-change:transform,opacity}
    .v3-manifestations__label.is-outgoing{transform:translate3d(0,-112%,0);opacity:0}
    .v3-manifestations__label.is-incoming{transform:translate3d(0,112%,0);opacity:0;transition:none}

    /* Provenance is metadata attached to One Identity, not part of the sentence's
       layout. Revealing it cannot push or wrap Infinite Manifestations. */
    .v3-provenance-reveal{position:absolute;left:0;top:calc(100% + .55em);z-index:3;display:inline-flex;align-items:baseline;gap:.45em;max-width:min(72vw,620px);overflow:hidden;opacity:0;transform:translateY(-3px);transition:opacity .22s ease,transform .24s ease;pointer-events:none}
    .v3-provenance-reveal.is-open{opacity:1;transform:none}
    .v3-provenance-reveal__label{color:var(--ashwood-field-green);font:700 7px/1.3 Arial,Helvetica,sans-serif;letter-spacing:.16em;text-transform:uppercase;white-space:nowrap}
    .v3-provenance-reveal__throughline{color:var(--ashwood-muted);font:500 8px/1.45 Arial,Helvetica,sans-serif;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}

    body.v3-manifestations-awake .v3-product,body.v3-manifestations-awake .v3-depth__links a,body.v3-manifestations-awake .v3-hero__image{border-color:color-mix(in srgb,var(--ashwood-field-green) 42%,var(--ashwood-rule));filter:saturate(1.04)}

    @media(max-width:760px){
      .v3-identity-statement{display:flex;flex-wrap:wrap;white-space:normal;row-gap:.04em}
      .v3-manifestations{flex:0 0 var(--v3-reel-width,auto);width:var(--v3-reel-width,auto);max-width:100%}
      .v3-provenance-reveal{position:absolute;left:0;top:calc(100% + .45em);display:flex;max-width:100%;flex-wrap:wrap;gap:.28em .5em}
      .v3-provenance-reveal__throughline{white-space:normal}
    }
    @media(prefers-reduced-motion:reduce){.v3-manifestations{animation:none}.v3-manifestations__label,.v3-provenance-reveal{transition:none}}
  `;
  document.head.appendChild(style);

  identity.innerHTML = `
    <span class="v3-identity-statement">
      <button class="v3-identity-origin" type="button" aria-expanded="false">One Identity</button><span aria-hidden="true">.</span>
      <a class="v3-manifestations" href="/portfolio/" aria-label="Explore an ASHWOOD manifestation">
        <span class="v3-manifestations__label">Infinite Manifestations</span>
      </a><span aria-hidden="true">.</span>
    </span>
    <span class="v3-provenance-reveal" aria-live="polite">
      <span class="v3-provenance-reveal__label">Provenance / Throughline</span>
      <span class="v3-provenance-reveal__throughline">Tahlia Ashwood Peart · TK Ashwood · XAYMACA / Jamaica · ASHWOOD · 888</span>
    </span>`;

  const origin = identity.querySelector('.v3-identity-origin');
  const manifestations = identity.querySelector('.v3-manifestations');
  let manifestationLabel = identity.querySelector('.v3-manifestations__label');
  const reveal = identity.querySelector('.v3-provenance-reveal');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let pinned = false;
  let reelTimer = 0;
  let reelIndex = 0;
  let transitionTimer = 0;
  let swapping = false;

  const lockReelGeometry = () => {
    const previous = manifestations.style.getPropertyValue('--v3-reel-width');
    if (previous) manifestations.style.removeProperty('--v3-reel-width');
    manifestationLabel.textContent = 'Infinite Manifestations';
    manifestationLabel.className = 'v3-manifestations__label';
    const width = Math.ceil(manifestationLabel.getBoundingClientRect().width);
    if (width > 0) manifestations.style.setProperty('--v3-reel-width', `${width}px`);
  };
  requestAnimationFrame(() => requestAnimationFrame(lockReelGeometry));
  if (document.fonts?.ready) document.fonts.ready.then(lockReelGeometry).catch(()=>{});

  const setReveal = open => {
    reveal.classList.toggle('is-open', open);
    origin.setAttribute('aria-expanded', String(open));
  };

  origin.addEventListener('mouseenter', () => setReveal(true));
  origin.addEventListener('mouseleave', () => { if (!pinned) setReveal(false); });
  origin.addEventListener('focus', () => setReveal(true));
  origin.addEventListener('blur', () => { if (!pinned) setReveal(false); });
  origin.addEventListener('click', () => {
    pinned = !pinned;
    setReveal(pinned);
    window.AshwoodDocCharacterV2?.stimulate?.(origin, { force:true, priority:1 });
  });

  const setManifestation = item => {
    manifestations.href = item.href;
    manifestations.setAttribute('aria-label', `Open ${item.label}`);
    if (reduce.matches) return;
    if (swapping) return;
    swapping = true;
    window.clearTimeout(transitionTimer);

    const outgoing = manifestationLabel;
    const incoming = document.createElement('span');
    incoming.className = 'v3-manifestations__label is-incoming';
    incoming.textContent = item.label;
    manifestations.appendChild(incoming);

    requestAnimationFrame(() => requestAnimationFrame(() => {
      outgoing.classList.add('is-outgoing');
      incoming.classList.remove('is-incoming');
    }));

    transitionTimer = window.setTimeout(() => {
      outgoing.remove();
      manifestationLabel = incoming;
      swapping = false;
    }, 250);
  };

  const resetManifestation = () => {
    window.clearTimeout(transitionTimer);
    swapping = false;
    manifestations.querySelectorAll('.v3-manifestations__label').forEach(node => node.remove());
    const idle = document.createElement('span');
    idle.className = 'v3-manifestations__label';
    idle.textContent = 'Infinite Manifestations';
    manifestations.appendChild(idle);
    manifestationLabel = idle;
    manifestations.setAttribute('aria-label','Explore an ASHWOOD manifestation');
  };

  const startReel = () => {
    document.body.classList.add('v3-manifestations-awake');
    if (reduce.matches || reelTimer) return;
    reelIndex = Math.floor(Math.random() * manifestationsList.length);
    setManifestation(manifestationsList[reelIndex]);
    reelTimer = window.setInterval(() => {
      reelIndex = (reelIndex + 1) % manifestationsList.length;
      setManifestation(manifestationsList[reelIndex]);
    }, 560);
  };

  const stopReel = () => {
    document.body.classList.remove('v3-manifestations-awake');
    if (reelTimer) window.clearInterval(reelTimer);
    reelTimer = 0;
    resetManifestation();
  };

  manifestations.addEventListener('mouseenter', startReel);
  manifestations.addEventListener('mouseleave', stopReel);
  manifestations.addEventListener('click', () => {
    if (!reelTimer) {
      const item = manifestationsList[Math.floor(Math.random() * manifestationsList.length)];
      manifestations.href = item.href;
    }
  });
})();
