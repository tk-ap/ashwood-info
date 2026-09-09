(() => {
  "use strict";

  /* Load the desktop overlap QA patch from the same global-navigation runtime so
     the correction applies without adding another permanent header dependency. */
  if (!document.querySelector('link[data-v3-desktop-qa]')) {
    const qa = document.createElement('link');
    qa.rel = 'stylesheet';
    qa.href = '/v3-desktop-qa.css?v=20260907-desktopqa1';
    qa.dataset.v3DesktopQa = '1';
    document.head.appendChild(qa);
  }

  if (document.querySelector('.v3-global-nav')) return;
  const mast = document.querySelector('.v3-mast');
  if (!mast) return;
  const mastBrand = mast.querySelector('[data-wordmark]') || mast.querySelector('.v3-wordmark');
  if (!mastBrand) return;

  const style = document.createElement('style');
  style.textContent = `
    .v3-mast [data-wordmark],.v3-mast .v3-wordmark{cursor:pointer}
    .v3-mast [data-wordmark]:focus-visible,.v3-mast .v3-wordmark:focus-visible{outline:1px solid currentColor;outline-offset:6px}
    .v3-global-nav{
      position:fixed;inset:0;z-index:950;background:color-mix(in srgb,var(--ashwood-paper) 96%,transparent);
      color:var(--ashwood-ink);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
      opacity:0;visibility:hidden;pointer-events:none;transform:translateY(-8px);
      transition:opacity .22s ease,transform .24s ease,visibility 0s linear .24s;
    }
    .v3-global-nav.is-open{opacity:1;visibility:visible;pointer-events:auto;transform:none;transition-delay:0s}
    .v3-global-nav__bar{display:flex;align-items:center;justify-content:space-between;padding:18px var(--v3-pad);border-bottom:1px solid var(--ashwood-rule)}
    .v3-global-nav__brand{font-size:11px;letter-spacing:.18em;text-transform:uppercase}
    .v3-global-nav__close{border:0;background:none;color:inherit;padding:10px;font-size:26px;line-height:1;cursor:pointer}
    .v3-global-nav__body{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(260px,.6fr);min-height:calc(100svh - 72px)}
    .v3-global-nav__links{display:flex;flex-direction:column;padding:clamp(34px,7vh,80px) var(--v3-pad);overflow:auto}
    .v3-global-nav__links a{display:grid;grid-template-columns:42px minmax(0,1fr) auto;gap:18px;align-items:baseline;padding:16px 0;border-bottom:1px solid var(--ashwood-rule);text-decoration:none}
    .v3-global-nav__links small{font-size:8px;letter-spacing:.14em;color:var(--ashwood-muted)}
    .v3-global-nav__links span{font-family:Georgia,"Times New Roman",serif;font-size:clamp(30px,4.4vw,68px);line-height:1.02}
    .v3-global-nav__links b{font:400 14px/1 Arial,sans-serif}
    .v3-global-nav__aside{border-left:1px solid var(--ashwood-rule);padding:clamp(34px,7vh,80px) var(--v3-pad);display:flex;flex-direction:column;justify-content:space-between;gap:36px}
    .v3-global-nav__aside p{margin:0;max-width:26ch;font-size:13px;line-height:1.55;color:var(--ashwood-muted)}
    .v3-global-nav__secondary{display:flex;gap:18px;flex-wrap:wrap}
    .v3-global-nav__secondary a{font-size:9px;letter-spacing:.13em;text-transform:uppercase;text-decoration:none;border-bottom:1px solid currentColor;padding-bottom:4px}
    .v3-global-nav__private{margin-top:auto;align-self:flex-end;opacity:.32;font-size:8px!important;letter-spacing:.18em!important;border-bottom-color:transparent!important}
    .v3-global-nav__private:hover,.v3-global-nav__private:focus-visible{opacity:1;border-bottom-color:currentColor!important}
    body.v3-global-nav-open{overflow:hidden}
    @media(max-width:900px){
      .v3-global-nav__body{grid-template-columns:1fr}
      .v3-global-nav__aside{border-left:0;border-top:1px solid var(--ashwood-rule);padding-top:24px;padding-bottom:28px}
      .v3-global-nav__links{padding-top:clamp(28px,5vh,48px);padding-bottom:20px}
      .v3-global-nav__links a{grid-template-columns:34px minmax(0,1fr) auto;gap:14px}
      .v3-global-nav__links span{font-size:clamp(28px,8vw,42px)}
      .v3-global-nav__aside p{display:none}
      .v3-global-nav__private{align-self:flex-start}
    }
    @media(prefers-reduced-motion:reduce){.v3-global-nav{transition:none!important}}
  `;
  document.head.appendChild(style);

  const nav = document.createElement('aside');
  nav.className = 'v3-global-nav';
  nav.id = 'v3-global-nav';
  nav.setAttribute('aria-hidden','true');
  nav.innerHTML = `
    <div class="v3-global-nav__bar">
      <span class="v3-global-nav__brand">ASHWOOD / GO ANYWHERE</span>
      <button class="v3-global-nav__close" type="button" aria-label="Close site navigation">×</button>
    </div>
    <div class="v3-global-nav__body">
      <nav class="v3-global-nav__links" aria-label="ASHWOOD pages">
        <a href="/portfolio/"><small>01</small><span>Portfolio</span><b>↗</b></a>
        <a href="/music/"><small>02</small><span>Music</span><b>↗</b></a>
        <a href="/journal/"><small>03</small><span>Build Journal</span><b>↗</b></a>
        <a href="/dispatch/"><small>04</small><span>Dispatch</span><b>↗</b></a>
        <a href="/ai-from-zero/"><small>05</small><span>AI from Zero</span><b>↗</b></a>
        <a href="/about/"><small>06</small><span>About</span><b>↗</b></a>
      </nav>
      <div class="v3-global-nav__aside">
        <p>The homepage is one path through ASHWOOD, not the only path. Jump directly into any manifestation without having to follow the scroll.</p>
        <div class="v3-global-nav__secondary">
          <a href="/connect/">Work together</a>
          <a href="/#thinking">The instinct</a>
          <a href="/#evidence">Current work</a>
        </div>
        <a class="v3-global-nav__private" href="/workspace/" rel="nofollow" aria-label="Private ASHWOOD workspace">workspace ↗</a>
      </div>
    </div>`;
  document.body.appendChild(nav);

  mastBrand.setAttribute('role','button');
  mastBrand.setAttribute('aria-expanded','false');
  mastBrand.setAttribute('aria-controls','v3-global-nav');
  mastBrand.setAttribute('aria-label','Open ASHWOOD navigation');

  const close = () => {
    nav.classList.remove('is-open');
    nav.setAttribute('aria-hidden','true');
    mastBrand.setAttribute('aria-expanded','false');
    document.body.classList.remove('v3-global-nav-open');
  };
  const open = () => {
    nav.classList.add('is-open');
    nav.setAttribute('aria-hidden','false');
    mastBrand.setAttribute('aria-expanded','true');
    document.body.classList.add('v3-global-nav-open');
    nav.querySelector('.v3-global-nav__close')?.focus();
  };
  const toggleNav = () => nav.classList.contains('is-open') ? close() : open();

  mastBrand.addEventListener('click', event => {
    event.preventDefault();
    toggleNav();
  });
  mastBrand.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleNav();
    }
  });
  nav.querySelector('.v3-global-nav__close')?.addEventListener('click', close);
  nav.addEventListener('click', event => { if (event.target.closest('a')) close(); });
  addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('is-open')) close(); });
})();
