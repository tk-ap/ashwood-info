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

  if (document.querySelector('.v3-global-nav') || window.location.pathname.startsWith('/workspace')) return;
  const mast = document.querySelector('.v3-mast,.ashwood-site-header,.career-mast,.journal-masthead,.dispatch-masthead,.masthead');
  if (!mast) return;
  const mastBrand = mast.querySelector('[data-wordmark],.v3-wordmark,.ashwood-site-header__brand,.journal-wordmark,.dispatch-wordmark,.wordmark,.career-brand a');
  if (!mastBrand) return;

  const style = document.createElement('style');
  style.textContent = `
    .v3-mast [data-wordmark],.v3-mast .v3-wordmark{cursor:pointer}
    .v3-mast [data-wordmark]:focus-visible,.v3-mast .v3-wordmark:focus-visible{outline:1px solid currentColor;outline-offset:6px}
    .v3-global-nav{
      --v3-pad:clamp(20px,3vw,48px);
      position:fixed;inset:0;z-index:950;background:color-mix(in srgb,var(--ashwood-paper) 96%,transparent);
      color:var(--ashwood-ink);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
      opacity:0;visibility:hidden;pointer-events:none;transform:translateY(-8px);
      transition:opacity .22s ease,transform .24s ease,visibility 0s linear .24s;
    }
    .v3-global-nav.is-open{opacity:1;visibility:visible;pointer-events:auto;transform:none;transition-delay:0s}
    .v3-global-nav__bar{display:grid;grid-template-columns:1fr minmax(220px,420px) 1fr;align-items:center;gap:20px;padding:14px var(--v3-pad);border-bottom:1px solid var(--ashwood-rule)}
    .v3-global-nav__brand{font-size:11px;letter-spacing:.18em;text-transform:uppercase}
    .v3-global-nav__close{border:0;background:none;color:inherit;padding:10px;font-size:26px;line-height:1;cursor:pointer}
    .v3-global-nav__close{justify-self:end}
    .v3-global-nav__search{width:100%;border:1px solid var(--ashwood-rule);border-radius:0;background:transparent;color:inherit;padding:10px 12px;font:400 12px/1.2 Arial,sans-serif}
    .v3-global-nav__search-label .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
    .v3-global-nav__search::placeholder{color:var(--ashwood-muted);opacity:1}
    .v3-global-nav__search:focus-visible{outline:1px solid var(--ashwood-ink);outline-offset:3px}
    .v3-global-nav__no-results{grid-column:1/-1;margin:18px 0 0;color:var(--ashwood-muted);font-size:12px;line-height:1.5}
    .v3-global-nav__no-results[hidden]{display:none}
    .v3-global-nav__body{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(260px,.6fr);min-height:calc(100svh - 72px)}
    .v3-global-nav__links{display:flex;flex-direction:column;padding:clamp(34px,7vh,80px) var(--v3-pad);overflow:auto}
    .v3-global-nav__links a{display:grid;grid-template-columns:42px minmax(0,1fr);gap:18px;align-items:baseline;padding:16px 0;border-bottom:1px solid var(--ashwood-rule);text-decoration:none}
    .v3-global-nav__links a:hover span,.v3-global-nav__links a:focus-visible span{text-decoration:underline;text-underline-offset:.12em}
    .v3-global-nav__links small{font-size:8px;letter-spacing:.14em;color:var(--ashwood-muted)}
    .v3-global-nav__links span{font-family:Georgia,"Times New Roman",serif;font-size:clamp(30px,4.4vw,68px);line-height:1.02}
        .v3-global-nav__aside{border-left:1px solid var(--ashwood-rule);padding:clamp(34px,7vh,80px) var(--v3-pad);display:flex;flex-direction:column;justify-content:space-between;gap:36px}
    .v3-global-nav__aside p{margin:0;max-width:26ch;font-size:13px;line-height:1.55;color:var(--ashwood-muted)}
    .v3-global-nav__secondary{display:flex;gap:18px;flex-wrap:wrap}
    .v3-global-nav__secondary a{font-size:9px;letter-spacing:.13em;text-transform:uppercase;text-decoration:none;border-bottom:1px solid currentColor;padding-bottom:4px}
    .v3-global-nav__private{margin-top:auto;align-self:flex-end;opacity:.32;font-size:8px!important;letter-spacing:.18em!important;border-bottom-color:transparent!important}
    .v3-global-nav__private:hover,.v3-global-nav__private:focus-visible{opacity:1;border-bottom-color:currentColor!important}
    body.v3-global-nav-open{overflow:hidden}
    @media(max-width:900px){
      .v3-global-nav__bar{grid-template-columns:1fr auto;gap:10px}
      .v3-global-nav__search{grid-column:1/-1;grid-row:2}
      .v3-global-nav__body{grid-template-columns:1fr}
      .v3-global-nav__aside{border-left:0;border-top:1px solid var(--ashwood-rule);padding-top:24px;padding-bottom:28px}
      .v3-global-nav__links{padding-top:clamp(28px,5vh,48px);padding-bottom:20px}
      .v3-global-nav__links a{grid-template-columns:34px minmax(0,1fr);gap:14px}
      .v3-global-nav__links span{font-size:clamp(28px,8vw,42px)}
      .v3-global-nav__aside p{display:none}
      .v3-global-nav__private{align-self:flex-start}
    }
    @media(prefers-reduced-motion:reduce){.v3-global-nav{transition:none!important}}

    .v3-global-nav__hint{border:0;border-bottom:1px solid var(--ashwood-rule);background:transparent;color:var(--ashwood-ink);padding:3px 0 4px;font:400 8px/1 Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;cursor:pointer}
        .v3-global-nav__hint:hover,.v3-global-nav__hint:focus-visible{border-bottom-color:currentColor}
    .v3-global-nav__hint:focus-visible{outline:1px solid currentColor;outline-offset:4px}
    @media(max-width:620px){.v3-global-nav__hint{font-size:7px}.v3-mast__meta{display:none}}

    /* Full public index: every public landing page stays discoverable without
       turning the first column into an unscannable single list. */
    .v3-global-nav__links{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-content:start;gap:0 34px}
    .v3-global-nav__group{border-top:1px solid var(--ashwood-rule)}
    .v3-global-nav__group summary{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 0;cursor:pointer;list-style:none;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--ashwood-muted)}
    .v3-global-nav__group summary::-webkit-details-marker{display:none}
    .v3-global-nav__group summary::after{content:"+";font-size:16px;font-weight:400;line-height:1}
    .v3-global-nav__group[open] summary::after{content:"−"}
    .v3-global-nav__group a{grid-template-columns:26px minmax(0,1fr);padding:10px 0}
    .v3-global-nav__group a span{font-size:clamp(19px,2.6vw,34px)}
    .v3-global-nav__guide{display:grid;gap:14px}
    .v3-global-nav__guide small{font-size:9px;letter-spacing:.14em;color:var(--ashwood-muted)}
    .v3-global-nav__guide h2{max-width:11ch;margin:0;font:400 clamp(30px,3vw,48px)/.96 Georgia,"Times New Roman",serif;letter-spacing:-.045em}
    .v3-global-nav__guide ul{display:grid;gap:9px;margin:0;padding:0;list-style:none}
    .v3-global-nav__guide a{font-size:12px;line-height:1.45;text-decoration:none;border-bottom:1px solid var(--ashwood-rule);padding:0 0 8px}
    .v3-global-nav__guide a span{display:block;margin-top:2px;color:var(--ashwood-muted);font-size:11px}
    .v3-global-nav__guide > a:last-child{justify-self:start;border-bottom-color:currentColor;font-size:9px;letter-spacing:.12em;text-transform:uppercase}
    @media(max-width:900px){.v3-global-nav__links{grid-template-columns:1fr;gap:0}.v3-global-nav__group a span{font-size:clamp(24px,7vw,36px)}.v3-global-nav__guide h2{font-size:30px}.v3-global-nav__guide ul{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 18px}}
    @media(max-width:560px){.v3-global-nav__guide ul{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const nav = document.createElement('aside');
  nav.className = 'v3-global-nav';
  nav.id = 'v3-global-nav';
  nav.setAttribute('aria-hidden','true');
  nav.innerHTML = `
    <div class="v3-global-nav__bar">
      <span class="v3-global-nav__brand">ASHWOOD / GO ANYWHERE</span>
      <label class="v3-global-nav__search-label"><span class="sr-only">Find a public ASHWOOD page</span><input class="v3-global-nav__search" type="search" autocomplete="off" placeholder="Find a page…" aria-controls="v3-global-nav-links" /></label>
      <button class="v3-global-nav__close" type="button" aria-label="Close site navigation">×</button>
    </div>
    <div class="v3-global-nav__body">
      <nav class="v3-global-nav__links" id="v3-global-nav-links" aria-label="ASHWOOD pages">
        <details class="v3-global-nav__group" open>
          <summary>Start here</summary>
          <a href="/"><small>01</small><span>Home</span></a>
          <a href="/guide/"><small>02</small><span>Visit guide</span></a>
          <a href="/work/"><small>03</small><span>Work overview</span></a>
          <a href="/career/"><small>04</small><span>Career evidence</span></a>
        </details>
        <details class="v3-global-nav__group" open>
          <summary>Creative practice</summary>
          <a href="/modeling/"><small>05</small><span>Modeling</span></a>
          <a href="/music/"><small>06</small><span>Music</span></a>
          <a href="/performance/"><small>07</small><span>Performance</span></a>
          </details>
        <details class="v3-global-nav__group" open>
          <summary>Ideas and builds</summary>
          <a href="/journal/"><small>08</small><span>Build journal</span></a>
          <a href="/dispatch/"><small>09</small><span>Dispatch</span></a>
          <a href="/ai-from-zero/"><small>10</small><span>AI from Zero</span></a>
          <a href="/dive-deeper/"><small>11</small><span>Dive deeper</span></a>
          <a href="/journal-lab/"><small>12</small><span>Journal lab</span></a>
        </details>
        <details class="v3-global-nav__group" open>
          <summary>About and connect</summary>
          <a href="/about/"><small>13</small><span>About</span></a>
          <a href="/connect/"><small>14</small><span>Connect</span></a>
          <a href="/sponsor/"><small>15</small><span>Support</span></a>
          <a href="/partners/"><small>16</small><span>Partners</span></a>
        </details>
        <p class="v3-global-nav__no-results" hidden>No public page matches that search. Try “work,” “career,” “journal,” or “contact.”</p>
      </nav>
      <div class="v3-global-nav__aside">
        <section class="v3-global-nav__guide" aria-labelledby="v3-visit-guide-title">
          <small>VISIT GUIDE</small>
          <h2 id="v3-visit-guide-title">Start where your reason for visiting is clearest.</h2>
          <ul>
            <li><a href="/career/">Hiring or collaborating<span>Start with professional evidence.</span></a></li>
            <li><a href="/work/">Exploring the practice<span>See the work across forms.</span></a></li>
            <li><a href="/journal/">Following the builds<span>Read what changed and why.</span></a></li>
            <li><a href="/connect/">Getting in touch<span>Find the appropriate public route.</span></a></li>
          </ul>
          <a href="/guide/">Full visitor guide</a>
        </section>
        <div class="v3-global-nav__secondary" aria-label="Homepage anchors">
          <a href="/#thinking">The instinct</a>
          <a href="/#evidence">Creative evidence</a>
        </div>
      </div>
    </div>`;
  document.body.appendChild(nav);

  mastBrand.setAttribute('role','button');
  mastBrand.setAttribute('aria-expanded','false');
  mastBrand.setAttribute('aria-controls','v3-global-nav');
  mastBrand.setAttribute('aria-label','Open ASHWOOD navigation');
  const navHint = document.createElement('button');
  navHint.className = 'v3-global-nav__hint';
  navHint.type = 'button';
  navHint.textContent = 'Explore pages';
  navHint.setAttribute('aria-controls','v3-global-nav');
  navHint.setAttribute('aria-expanded','false');
  mastBrand.insertAdjacentElement('afterend', navHint);

  const close = () => {
    nav.classList.remove('is-open');
    nav.setAttribute('aria-hidden','true');
    mastBrand.setAttribute('aria-expanded','false');
    navHint.setAttribute('aria-expanded','false');
    document.body.classList.remove('v3-global-nav-open');
  };
  const open = ({ focusClose = false } = {}) => {
    nav.classList.add('is-open');
    nav.setAttribute('aria-hidden','false');
    mastBrand.setAttribute('aria-expanded','true');
    navHint.setAttribute('aria-expanded','true');
    document.body.classList.add('v3-global-nav-open');
    if (focusClose) nav.querySelector('.v3-global-nav__close')?.focus();
  };
  const toggleNav = () => nav.classList.contains('is-open') ? close() : open({ focusClose:true });

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
  navHint.addEventListener('click', toggleNav);
  const canHover = matchMedia('(hover: hover) and (pointer: fine)');
  mastBrand.addEventListener('mouseenter', () => { if (canHover.matches) open(); });

  const search = nav.querySelector('.v3-global-nav__search');
  const searchLinks = [...nav.querySelectorAll('.v3-global-nav__group a')];
  const groups = [...nav.querySelectorAll('.v3-global-nav__group')];
  const noResults = nav.querySelector('.v3-global-nav__no-results');
  search?.addEventListener('input', () => {
    const query = search.value.trim().toLocaleLowerCase();
    let matches = 0;
    for (const link of searchLinks) {
      const match = !query || link.textContent.toLocaleLowerCase().includes(query);
      link.hidden = !match;
      if (match) matches += 1;
    }
    for (const group of groups) {
      const hasMatch = [...group.querySelectorAll('a')].some(link => !link.hidden);
      group.hidden = !hasMatch;
      if (query && hasMatch) group.open = true;
    }
    noResults.hidden = matches > 0;
  });
  nav.querySelector('.v3-global-nav__close')?.addEventListener('click', close);
  nav.addEventListener('click', event => { if (event.target.closest('a')) close(); });
  addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('is-open')) close(); });
})();
