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
    .v3-manifestations{display:inline-grid;grid-template-columns:1fr;min-width:11.8ch;overflow:hidden;vertical-align:baseline;background:linear-gradient(105deg,var(--ashwood-ink),var(--ashwood-gold),var(--ashwood-field-green),var(--ashwood-ink));background-size:260% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:v3-shimmer 9s ease-in-out infinite}
    .v3-manifestations:hover{filter:saturate(1.2) brightness(1.08)}
    .v3-manifestations__label{display:block;white-space:nowrap}
    .v3-provenance-reveal{display:inline-flex;align-items:baseline;gap:.45em;max-width:0;margin:0;overflow:hidden;opacity:0;transform:translateX(-4px);white-space:nowrap;vertical-align:baseline;transition:max-width .36s ease,opacity .26s ease,transform .3s ease}
    .v3-provenance-reveal.is-open{max-width:min(52vw,560px);margin-left:.55em;margin-right:.35em;opacity:1;transform:none}
    .v3-provenance-reveal__label,.v3-provenance-reveal__throughline{font-family:Arial,Helvetica,sans-serif;text-transform:uppercase;line-height:1.35}
    .v3-provenance-reveal__label{color:var(--ashwood-field-green);font-size:7px;font-weight:700;letter-spacing:.16em}
    .v3-provenance-reveal__throughline{color:var(--ashwood-muted);font-size:7px;font-weight:500;letter-spacing:.09em}
    body.v3-manifestations-awake .v3-product,body.v3-manifestations-awake .v3-depth__links a,body.v3-manifestations-awake .v3-hero__image{border-color:color-mix(in srgb,var(--ashwood-field-green) 42%,var(--ashwood-rule));filter:saturate(1.04)}
    @media(max-width:760px){.v3-identity{display:flex;flex-wrap:wrap}.v3-identity-origin,.v3-manifestations{display:inline}.v3-provenance-reveal{order:0;white-space:normal}.v3-provenance-reveal.is-open{max-width:72vw;margin-left:.5em;margin-right:.2em}.v3-manifestations{min-width:0}.v3-provenance-reveal__throughline{display:none}}
    @media(prefers-reduced-motion:reduce){.v3-manifestations{animation:none}.v3-provenance-reveal{transition:none}}
  `;
  document.head.appendChild(style);

  identity.innerHTML = `
    <button class="v3-identity-origin" type="button" aria-expanded="false">One Identity</button>
    <span class="v3-provenance-reveal" aria-live="polite">
      <span class="v3-provenance-reveal__label">Provenance / Throughline</span>
      <span class="v3-provenance-reveal__throughline">Tahlia Ashwood Peart · TK Ashwood · XAYMACA / Jamaica · ASHWOOD · 888</span>
    </span><span aria-hidden="true">.</span>
    <a class="v3-manifestations" href="/portfolio/" aria-label="Explore an ASHWOOD manifestation"><span class="v3-manifestations__label">Infinite Manifestations</span></a><span aria-hidden="true">.</span>`;

  const origin = identity.querySelector('.v3-identity-origin');
  const manifestations = identity.querySelector('.v3-manifestations');
  const manifestationLabel = identity.querySelector('.v3-manifestations__label');
  const reveal = identity.querySelector('.v3-provenance-reveal');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let pinned = false;
  let reelTimer = 0;
  let reelIndex = 0;

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
    manifestationLabel.textContent = item.label;
    manifestations.href = item.href;
    manifestations.setAttribute('aria-label', `Open ${item.label}`);
  };

  const startReel = () => {
    document.body.classList.add('v3-manifestations-awake');
    if (reduce.matches || reelTimer) return;
    reelIndex = Math.floor(Math.random() * manifestationsList.length);
    setManifestation(manifestationsList[reelIndex]);
    reelTimer = window.setInterval(() => {
      reelIndex = (reelIndex + 1) % manifestationsList.length;
      setManifestation(manifestationsList[reelIndex]);
    }, 260);
  };

  const stopReel = () => {
    document.body.classList.remove('v3-manifestations-awake');
    if (reelTimer) window.clearInterval(reelTimer);
    reelTimer = 0;
    manifestationLabel.textContent = 'Infinite Manifestations';
    manifestations.href = manifestationsList[reelIndex]?.href || '/portfolio/';
    manifestations.setAttribute('aria-label','Explore an ASHWOOD manifestation');
  };

  manifestations.addEventListener('mouseenter', startReel);
  manifestations.addEventListener('mouseleave', stopReel);
  manifestations.addEventListener('click', event => {
    if (!reelTimer) {
      const item = manifestationsList[Math.floor(Math.random() * manifestationsList.length)];
      manifestations.href = item.href;
    }
  });
})();
