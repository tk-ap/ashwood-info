(() => {
  "use strict";

  const randomRoutes = [
    "/portfolio/",
    "/music/",
    "/journal/",
    "/dispatch/",
    "/ai-from-zero/",
    "/about/",
    "/dive-deeper/"
  ];

  const pickRoute = () => randomRoutes[Math.floor(Math.random() * randomRoutes.length)];

  const installIridescentDoors = () => {
    const wherever = document.querySelector('.v3-title .v3-shimmer');
    if (wherever && !wherever.dataset.parityIridescent) {
      const door = document.createElement('a');
      door.className = 'v3-shimmer iridescent-word v3-random-door';
      door.href = pickRoute();
      door.textContent = wherever.textContent || 'wherever';
      door.setAttribute('aria-label', 'Feeling curious? Explore a random ASHWOOD section');
      door.dataset.parityIridescent = '1';
      door.addEventListener('click', () => { door.href = pickRoute(); });
      wherever.replaceWith(door);
    }

    const identity = document.querySelector('.v3-identity');
    if (identity && !identity.dataset.parityIridescent) {
      identity.innerHTML = '<span class="iridescent-word iridescent-word--jamaica" tabindex="0">Out of One</span>, Many <a class="iridescent-word v3-random-door" href="/about/" aria-label="Explore another ASHWOOD becoming">Becomings</a>.';
      identity.dataset.parityIridescent = '1';
      const becomingDoor = identity.querySelector('.v3-random-door');
      becomingDoor?.addEventListener('click', () => { becomingDoor.href = pickRoute(); });
    }
  };

  const dedupeDocSurface = () => {
    const launchers = [...document.querySelectorAll('.ashwood-doc-editorial-launcher')];
    launchers.slice(1).forEach(node => node.remove());
    const panels = [...document.querySelectorAll('.ashwood-doc-editorial-panel')];
    panels.slice(1).forEach(node => node.remove());
    document.querySelectorAll('.v3-doc,.v3-doc-panel').forEach(node => node.remove());
  };

  const installDocBridge = () => {
    dedupeDocSurface();
    if (document.querySelector('.ashwood-doc-editorial-launcher')) return;

    document.querySelector('.v3-thinking__intro')?.classList.add('ashwood-home-thesis');

    const launcher = document.createElement('button');
    launcher.className = 'ashwood-doc-editorial-launcher';
    launcher.type = 'button';
    launcher.textContent = matchMedia('(max-width:760px),(pointer:coarse)').matches ? 'DOC / GUIDE' : 'FOLLOW DOC →';
    document.body.appendChild(launcher);

    const panel = document.createElement('aside');
    panel.className = 'ashwood-doc-editorial-panel';
    panel.hidden = true;
    panel.innerHTML = '<p class="ashwood-doc-editorial-panel__eyebrow"></p><h2 class="ashwood-doc-editorial-panel__title"></h2><p class="ashwood-doc-editorial-panel__copy"></p><div class="ashwood-doc-editorial-panel__controls"><span class="count"></span><span></span><button class="back" type="button">Back</button><button class="next" type="button">Next →</button><button class="exit" type="button">Exit</button></div>';
    document.body.appendChild(panel);

    const style = document.createElement('style');
    style.id = 'v3-doc-parity-style';
    style.textContent = `
      .ashwood-doc-editorial-launcher{position:fixed;right:22px;bottom:22px;z-index:620;display:inline-flex;align-items:center;gap:9px;min-height:40px;padding:8px 14px;border:1px solid color-mix(in srgb,var(--ashwood-rule) 82%,transparent);border-radius:999px;background:color-mix(in srgb,var(--ashwood-paper) 94%,transparent);color:var(--ashwood-ink);backdrop-filter:blur(12px);font:700 8px/1 Arial,Helvetica,sans-serif;letter-spacing:.14em;text-transform:uppercase;cursor:pointer}
      .ashwood-doc-editorial-launcher::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--ashwood-field-green,#009b3a);box-shadow:0 0 12px color-mix(in srgb,var(--ashwood-field-green,#009b3a) 55%,transparent)}
      .ashwood-doc-editorial-panel{position:fixed;z-index:630;right:22px;bottom:22px;width:min(390px,calc(100vw - 44px));box-sizing:border-box;padding:16px 17px 14px;border:1px solid var(--ashwood-rule);background:color-mix(in srgb,var(--ashwood-paper) 96%,transparent);backdrop-filter:blur(16px);box-shadow:0 18px 54px #0003}
      .ashwood-doc-editorial-panel[hidden]{display:none!important}
      .ashwood-doc-editorial-panel__eyebrow{margin:0 0 7px;color:var(--ashwood-field-green,#009b3a);font:700 8px/1 Arial,Helvetica,sans-serif;letter-spacing:.16em}
      .ashwood-doc-editorial-panel__title{margin:0 0 7px;color:var(--ashwood-ink);font:500 22px/1.05 Arial,Helvetica,sans-serif;letter-spacing:-.02em}
      .ashwood-doc-editorial-panel__copy{margin:0;color:var(--ashwood-muted);font:400 10px/1.55 Arial,Helvetica,sans-serif}
      .ashwood-doc-editorial-panel__controls{display:grid;grid-template-columns:auto 1fr auto auto auto;gap:10px;align-items:center;margin-top:13px;padding-top:11px;border-top:1px solid var(--ashwood-rule)}
      .ashwood-doc-editorial-panel button{border:0;background:none;color:var(--ashwood-muted);font:700 8px/1 Arial,Helvetica,sans-serif;letter-spacing:.12em;text-transform:uppercase;cursor:pointer}
      .ashwood-doc-editorial-panel .next{color:var(--ashwood-ink)}
      @media(max-width:760px),(pointer:coarse){.ashwood-doc-editorial-launcher{right:14px;bottom:14px}.ashwood-doc-editorial-panel{right:14px;bottom:14px;width:calc(100vw - 28px)}}
    `;
    document.head.appendChild(style);

    const observer = new MutationObserver(dedupeDocSurface);
    observer.observe(document.body, { childList:true, subtree:true });
    window.setTimeout(() => observer.disconnect(), 4000);
  };

  installIridescentDoors();
  installDocBridge();
})();
