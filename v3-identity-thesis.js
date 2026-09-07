(() => {
  "use strict";

  const identity = document.querySelector('.v3-identity');
  if (!identity) return;

  const routes = ['/portfolio/','/music/','/journal/','/dispatch/','/ai-from-zero/','/going/','/about/','/dive-deeper/'];
  const pickRoute = () => routes[Math.floor(Math.random() * routes.length)];

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
    .v3-manifestations{background:linear-gradient(105deg,var(--ashwood-ink),var(--ashwood-gold),var(--ashwood-field-green),var(--ashwood-ink));background-size:260% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:v3-shimmer 9s ease-in-out infinite}
    .v3-manifestations:hover,.v3-manifestations:focus-visible{filter:saturate(1.2) brightness(1.08)}
    .v3-provenance-reveal{flex-basis:100%;display:grid;grid-template-columns:auto 1fr;gap:10px 16px;max-width:560px;max-height:0;margin:0;overflow:hidden;opacity:0;transform:translateY(-4px);transition:max-height .4s ease,opacity .3s ease,transform .35s ease}
    .v3-provenance-reveal.is-open{max-height:150px;margin-top:10px;opacity:1;transform:none}
    .v3-provenance-reveal small{color:var(--ashwood-field-green);font:700 7px/1.3 Arial,Helvetica,sans-serif;letter-spacing:.16em;text-transform:uppercase}
    .v3-provenance-reveal span{color:var(--ashwood-muted);font:500 9px/1.5 Arial,Helvetica,sans-serif;letter-spacing:.08em;text-transform:uppercase}
    body.v3-manifestations-awake .v3-product,body.v3-manifestations-awake .v3-depth__links a,body.v3-manifestations-awake .v3-hero__image{border-color:color-mix(in srgb,var(--ashwood-field-green) 42%,var(--ashwood-rule));filter:saturate(1.04)}
    @media(max-width:760px){.v3-identity{display:block}.v3-identity-origin,.v3-manifestations{display:inline}.v3-provenance-reveal{grid-template-columns:1fr;gap:5px}.v3-provenance-reveal.is-open{max-height:180px}}
    @media(prefers-reduced-motion:reduce){.v3-manifestations{animation:none}.v3-provenance-reveal{transition:none}}
  `;
  document.head.appendChild(style);

  identity.innerHTML = `
    <button class="v3-identity-origin" type="button" aria-expanded="false">One Identity</button><span aria-hidden="true">.</span>
    <a class="v3-manifestations" href="${pickRoute()}" aria-label="Explore a random ASHWOOD manifestation">Infinite Manifestations</a><span aria-hidden="true">.</span>
    <span class="v3-provenance-reveal" aria-live="polite">
      <small>PROVENANCE / THROUGHLINE</small>
      <span>TAHLIA ASHWOOD PEART · TK ASHWOOD · XAYMACA / JAMAICA · ASHWOOD · 888</span>
    </span>`;

  const origin = identity.querySelector('.v3-identity-origin');
  const manifestations = identity.querySelector('.v3-manifestations');
  const reveal = identity.querySelector('.v3-provenance-reveal');
  let pinned = false;

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

  const wake = () => document.body.classList.add('v3-manifestations-awake');
  const sleep = () => document.body.classList.remove('v3-manifestations-awake');
  manifestations.addEventListener('mouseenter', wake);
  manifestations.addEventListener('mouseleave', sleep);
  manifestations.addEventListener('focus', wake);
  manifestations.addEventListener('blur', sleep);
  manifestations.addEventListener('click', () => { manifestations.href = pickRoute(); });
})();
