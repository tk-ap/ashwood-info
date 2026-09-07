(() => {
  "use strict";

  const body = document.body;
  if (!body?.classList.contains('v3-preview')) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state = {
    mode: 'rest',
    manifestation: '',
    mark: 'ASHWOOD'
  };

  const style = document.createElement('style');
  style.id = 'v3-instrument-style';
  style.textContent = `
    body.v3-preview{--instrument-energy:0;--instrument-x:50%;--instrument-y:50%}
    body.v3-preview::after{content:"";position:fixed;inset:0;z-index:1;pointer-events:none;background:radial-gradient(circle at var(--instrument-x) var(--instrument-y),rgba(var(--ashwood-field-green-rgb),calc(var(--instrument-energy)*.055)) 0,transparent 28%);opacity:.9;transition:background .35s ease}
    body.v3-preview [data-instrument-target]{transition:filter .35s ease,opacity .35s ease,transform .35s ease,border-color .35s ease,box-shadow .35s ease}
    body.v3-preview[data-ashwood-mode="possibility"] [data-instrument-target].is-instrument-active,
    body.v3-preview[data-ashwood-mode="trajectory"] [data-instrument-target].is-instrument-active,
    body.v3-preview[data-ashwood-mode="evidence"] [data-instrument-target].is-instrument-active,
    body.v3-preview[data-ashwood-mode="method"] [data-instrument-target].is-instrument-active{
      filter:saturate(1.08) brightness(1.035);
      border-color:color-mix(in srgb,var(--ashwood-field-green) 34%,var(--ashwood-rule));
    }
    body.v3-preview[data-ashwood-mode="form"] .ashwood-audio{box-shadow:0 0 0 1px color-mix(in srgb,var(--ashwood-gold) 34%,transparent),0 12px 42px rgba(0,0,0,.12)}
    body.v3-preview[data-ashwood-mode="relationships"] .ashwood-doc-editorial-launcher,
    body.v3-preview[data-ashwood-mode="relationships"] .doc-character-v2{filter:saturate(1.08) brightness(1.04)}
    body.v3-preview[data-ashwood-mode="provenance"] .v3-wordmark,
    body.v3-preview[data-ashwood-mode="provenance"] .v3-wordmark--hero{filter:saturate(1.04)}
    @media(prefers-reduced-motion:reduce){body.v3-preview::after,body.v3-preview [data-instrument-target]{transition:none!important}}
  `;
  document.head.appendChild(style);

  const setMode = (mode, origin) => {
    state.mode = mode || 'rest';
    body.dataset.ashwoodMode = state.mode;
    body.style.setProperty('--instrument-energy', state.mode === 'rest' ? '0' : '1');
    if (origin?.getBoundingClientRect) {
      const r = origin.getBoundingClientRect();
      const x = ((r.left + r.width / 2) / Math.max(innerWidth, 1)) * 100;
      const y = ((r.top + r.height / 2) / Math.max(innerHeight, 1)) * 100;
      body.style.setProperty('--instrument-x', `${Math.max(0, Math.min(100, x))}%`);
      body.style.setProperty('--instrument-y', `${Math.max(0, Math.min(100, y))}%`);
    }
    document.dispatchEvent(new CustomEvent('ashwood:instrument', { detail: { ...state } }));
  };

  const clearTargets = () => document.querySelectorAll('.is-instrument-active').forEach(node => node.classList.remove('is-instrument-active'));
  const activate = (...nodes) => {
    clearTargets();
    nodes.filter(Boolean).forEach(node => {
      node.dataset.instrumentTarget = '1';
      node.classList.add('is-instrument-active');
    });
  };

  const identity = document.querySelector('.v3-identity');
  const origin = () => identity?.querySelector('.v3-identity-origin');
  const manifestations = () => identity?.querySelector('.v3-manifestations');
  const manifestationLabel = () => identity?.querySelector('.v3-manifestations__label');

  const bindIdentity = () => {
    const node = origin();
    if (!node || node.dataset.instrumentBound) return;
    node.dataset.instrumentBound = '1';
    node.addEventListener('mouseenter', () => setMode('provenance', node));
    node.addEventListener('focus', () => setMode('provenance', node));
    node.addEventListener('mouseleave', () => setMode('rest', node));
    node.addEventListener('blur', () => setMode('rest', node));
  };

  const manifestationTargets = {
    MODELING: () => [document.querySelector('.v3-photo-stage'), document.querySelector('.v3-hero__image')],
    MUSIC: () => [document.querySelector('#music-moment'), document.querySelector('.ashwood-audio')],
    'BUILD JOURNAL': () => [document.querySelector('.v3-builds'), document.querySelector('.v3-depth__links a[href="/journal/"]')],
    DISPATCH: () => [document.querySelector('.v3-depth__links a[href="/dispatch/"]')],
    'AI FROM ZERO': () => [document.querySelector('.v3-depth__links a[href="/ai-from-zero/"]')],
    'CREATIVE DIRECTION': () => [document.querySelector('.v3-depth__links a[href="/going/"]')],
    ABOUT: () => [document.querySelector('.v3-depth__links a[href="/about/"]')],
    'THE INSTINCT': () => [document.querySelector('#thinking')]
  };

  const syncManifestation = () => {
    const label = manifestationLabel()?.textContent?.trim() || '';
    state.manifestation = label;
    const targets = manifestationTargets[label]?.() || [];
    activate(...targets);
    if (label && label !== '∞ manifestations' && label !== 'Infinite Manifestations') setMode('possibility', manifestations());
  };

  const bindManifestations = () => {
    const node = manifestations();
    if (!node || node.dataset.instrumentBound) return;
    node.dataset.instrumentBound = '1';
    node.addEventListener('mouseenter', () => {
      setMode('possibility', node);
      syncManifestation();
    });
    node.addEventListener('mouseleave', () => {
      state.manifestation = '';
      clearTargets();
      setMode('rest', node);
    });
    const label = manifestationLabel();
    if (label) new MutationObserver(syncManifestation).observe(node, { childList:true, subtree:true, characterData:true });
  };

  const markText = () => document.querySelector('[data-wordmark-text]')?.textContent?.trim() || 'ASHWOOD';
  const syncMark = () => {
    state.mark = markText();
    body.dataset.ashwoodMark = state.mark === 'ASHW888D' ? 'mutation' : state.mark === 'ASHWOOD' ? 'rest' : 'transition';
    document.dispatchEvent(new CustomEvent('ashwood:identity-state', { detail: { mark: state.mark } }));
  };
  const markNode = document.querySelector('[data-wordmark]');
  if (markNode) {
    new MutationObserver(syncMark).observe(markNode, { childList:true, subtree:true, characterData:true });
    syncMark();
  }

  document.addEventListener('click', event => {
    const hotspot = event.target.closest('.v3-hotspot');
    if (hotspot) {
      activate(document.querySelector('#thinking'), hotspot);
      setMode('method', hotspot);
      return;
    }
    const doc = event.target.closest('.ashwood-doc-editorial-launcher,.doc-character-v2,[data-doc-note]');
    if (doc) {
      setMode('relationships', doc);
      window.setTimeout(() => { if (state.mode === 'relationships') setMode('rest', doc); }, 1800);
    }
  });

  document.addEventListener('pointerover', event => {
    const creative = event.target.closest('.v3-depth__links a[href="/going/"]');
    if (creative) {
      activate(creative, document.querySelector('#depth'));
      setMode('trajectory', creative);
    }
  });
  document.addEventListener('pointerout', event => {
    if (event.target.closest?.('.v3-depth__links a[href="/going/"]')) {
      clearTargets();
      setMode('rest');
    }
  });

  const audioToggle = document.querySelector('.ashwood-audio__toggle');
  if (audioToggle) {
    const syncAudio = () => {
      const playing = audioToggle.textContent.trim().toLowerCase() === 'pause';
      body.dataset.ashwoodAudio = playing ? 'playing' : 'paused';
      if (playing) {
        activate(document.querySelector('#music-moment'), document.querySelector('.ashwood-audio'));
        setMode('form', audioToggle);
      } else if (state.mode === 'form') {
        clearTargets();
        setMode('rest', audioToggle);
      }
    };
    new MutationObserver(syncAudio).observe(audioToggle, { childList:true, subtree:true, characterData:true });
    syncAudio();
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting || entry.intersectionRatio < .42) return;
        if (entry.target.matches('#thinking')) {
          activate(entry.target);
          setMode('method', entry.target);
        } else if (entry.target.matches('#evidence')) {
          activate(entry.target);
          setMode('evidence', entry.target);
        } else if (entry.target.matches('#depth')) {
          const creative = entry.target.querySelector('.v3-depth__links a[href="/going/"]');
          activate(creative || entry.target);
          setMode('trajectory', creative || entry.target);
        }
      });
    }, { threshold:[.42,.58] });
    ['#thinking','#evidence','#depth'].forEach(selector => {
      const node = document.querySelector(selector);
      if (node) observer.observe(node);
    });
  }

  const lateBind = new MutationObserver(() => { bindIdentity(); bindManifestations(); });
  lateBind.observe(document.documentElement, { childList:true, subtree:true });
  window.setTimeout(() => lateBind.disconnect(), 12000);
  bindIdentity();
  bindManifestations();
  setMode('rest');
})();
