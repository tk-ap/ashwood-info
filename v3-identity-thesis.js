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
    .v3-identity{position:relative;display:flex;flex-wrap:wrap;align-items:baseline;gap:.18em;margin-top:28px}
    .v3-identity-origin,.v3-manifestations{border:0;padding:0;background:none;color:inherit;font:inherit;line-height:inherit;letter-spacing:inherit;text-decoration:none;cursor:pointer}
    .v3-identity-origin{position:relative}
    .v3-identity-origin::after{content:"";position:absolute;left:0;right:0;bottom:-.14em;height:1px;background:currentColor;transform:scaleX(0);transform-origin:left;opacity:.45;transition:transform .3s ease}
    .v3-identity-origin:hover::after,.v3-identity-origin:focus-visible::after,.v3-identity-origin[aria-expanded="true"]::after{transform:scaleX(1)}
    .v3-manifestations{position:relative;display:inline-block;width:22ch;height:1.08em;overflow:hidden;vertical-align:-.05em;white-space:nowrap;background:linear-gradient(105deg,var(--ashwood-ink),var(--ashwood-gold),var(--ashwood-field-green),var(--ashwood-ink));background-size:260% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:v3-shimmer 9s ease-in-out infinite}
    .v3-manifestations:hover{filter:saturate(1.2) brightness(1.08)}
    .v3-manifestations__label{position:absolute;inset:0 auto auto 0;display:block;width:100%;white-space:nowrap;transform:translateY(0);opacity:1;transition:transform .18s cubic-bezier(.2,.75,.25,1),opacity .16s ease;will-change:transform,opacity}
    .v3-manifestations__label.is-outgoing{transform:translateY(-112%);opacity:0}
    .v3-manifestations__label.is-incoming{transform:translateY(112%);opacity:0;transition:none}
    .v3-provenance-reveal{display:inline-flex;align-items:baseline;gap:.45em;margin-left:.55em;max-width:min(52vw,560px);overflow:hidden;opacity:0;transform:translateX(-4px);transition:opacity .22s ease,transform .24s ease;pointer-events:none;vertical-align:baseline}
    .v3-provenance-reveal.is-open{opacity:1;transform:none}
    .v3-provenance-reveal__label{color:var(--ashwood-field-green);font:700 7px/1.3 Arial,Helvetica,sans-serif;letter-spacing:.16em;text-transform:uppercase;white-space:nowrap}
    .v3-provenance-reveal__throughline{color:var(--ashwood-muted);font:500 8px/1.45 Arial,Helvetica,sans-serif;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
    body.v3-manifestations-awake .v3-product,body.v3-manifestations-awake .v3-depth__links a,body.v3-manifestations-awake .v3-hero__image{border-color:color-mix(in srgb,var(--ashwood-field-green) 42%,var(--ashwood-rule));filter:saturate(1.04)}
    @media(max-width:760px){.v3-identity{display:block}.v3-identity-origin,.v3-manifestations{display:inline-block}.v3-manifestations{width:20ch}.v3-provenance-reveal{display:flex;margin:.45em 0 0 0;max-width:100%;flex-wrap:wrap;gap:.28em .5em}.v3-provenance-reveal__throughline{white-space:normal}}
    @media(prefers-reduced-motion:reduce){.v3-manifestations{animation:none}.v3-manifestations__label,.v3-provenance-reveal{transition:none}}
  `;
  document.head.appendChild(style);

  identity.innerHTML = `
    <button class="v3-identity-origin" type="button" aria-expanded="false">One Identity</button>
    <span class="v3-provenance-reveal" aria-live="polite">
      <span class="v3-provenance-reveal__label">Provenance / Throughline</span>
      <span class="v3-provenance-reveal__throughline">Tahlia Ashwood Peart · TK Ashwood · XAYMACA / Jamaica · ASHWOOD · 888</span>
    </span><span aria-hidden="true">.</span>
    <a class="v3-manifestations" href="/portfolio/" aria-label="Explore an ASHWOOD manifestation">
      <span class="v3-manifestations__label">Infinite Manifestations</span>
    </a><span aria-hidden="true">.</span>`;

  const origin = identity.querySelector('.v3-identity-origin');
  const manifestations = identity.querySelector('.v3-manifestations');
  let manifestationLabel = identity.querySelector('.v3-manifestations__label');
  const reveal = identity.querySelector('.v3-provenance-reveal');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let pinned = false;
  let reelTimer = 0;
  let reelIndex = 0;
  let transitionTimer = 0;

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
    if (reduce.matches) {
      manifestationLabel.textContent = item.label;
      return;
    }
    window.clearTimeout(transitionTimer);
    const outgoing = manifestationLabel;
    const incoming = document.createElement('span');
    incoming.className = 'v3-manifestations__label is-incoming';
    incoming.textContent = item.label;
    manifestations.appendChild(incoming);
    requestAnimationFrame(() => {
      outgoing.classList.add('is-outgoing');
      incoming.classList.remove('is-incoming');
    });
    transitionTimer = window.setTimeout(() => {
      outgoing.remove();
      manifestationLabel = incoming;
    }, 210);
  };

  const resetManifestation = () => {
    window.clearTimeout(transitionTimer);
    manifestations.querySelectorAll('.v3-manifestations__label').forEach((node, index) => {
      if (index > 0) node.remove();
    });
    manifestationLabel = manifestations.querySelector('.v3-manifestations__label');
    manifestationLabel.className = 'v3-manifestations__label';
    manifestationLabel.textContent = 'Infinite Manifestations';
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
    }, 460);
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
