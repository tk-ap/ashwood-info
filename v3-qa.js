(() => {
  "use strict";

  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');

  /* Restore the live risograph cursor trail on fine-pointer devices. */
  if (fine.matches && !reduced.matches && !document.querySelector('script[data-v3-riso-cursor]')) {
    const script = document.createElement('script');
    script.src = '/cursor-risograph.js?v=20260907-v3qa1';
    script.defer = true;
    script.dataset.v3RisoCursor = '1';
    document.head.appendChild(script);
  }

  /* Typography / overlap QA guardrails. These are intentionally conservative. */
  const style = document.createElement('style');
  style.id = 'v3-qa-style';
  style.textContent = `
    .v3-preview *{min-width:0}
    .v3-title,.v3-deck,.v3-grounding,.v3-identity,.v3-music__meta p,.v3-product span,.v3-depth__links span,.v3-continuation__title{overflow-wrap:anywhere}
    .v3-mast{gap:clamp(10px,2vw,28px)}
    .v3-mast__meta{max-width:min(52vw,620px);text-align:right;line-height:1.3}
    .v3-wordmark__text{min-width:8.8ch}
    .v3-latent,.v3-image-note,.v3-margin-note,.v3-build-note,.v3-manifesto-note,.v3-provenance{max-width:min(88vw,34ch);white-space:normal;line-height:1.35}
    .v3-photo-stage figure{min-width:0}
    .v3-photo-caption{max-width:100%;overflow-wrap:anywhere}
    .v3-product{overflow:hidden}
    .v3-product strong,.v3-product span{position:relative;z-index:2}
    .v3-depth__links a{grid-template-columns:minmax(0,1fr) auto}
    /* V3 owns one Doc entry point: the editorial FOLLOW DOC launcher. */
    .v3-doc,.v3-doc-panel,.ashwood-doc-launcher{display:none!important}
    .ashwood-doc-editorial-panel{max-height:min(58vh,520px);overflow:auto;overscroll-behavior:contain}
    .ashwood-doc-editorial-panel__title,.ashwood-doc-editorial-panel__copy{overflow-wrap:anywhere}
    .ashwood-doc-reference-marker{max-width:min(40vw,180px);white-space:normal}
    .ashwood-doc-targeted{scroll-margin-top:clamp(84px,12vh,128px)}
    .ashwood-doc-editorial-panel.is-guide-connected{border-color:color-mix(in srgb,var(--ashwood-field-green,#009b3a) 56%,var(--ashwood-rule));box-shadow:0 18px 54px #0003,0 0 0 1px color-mix(in srgb,var(--ashwood-field-green,#009b3a) 18%,transparent),0 0 30px color-mix(in srgb,var(--ashwood-field-green,#009b3a) 11%,transparent)}
    .ashwood-doc-editorial-panel.is-guide-connected::before{content:"DOC → THIS NOTE";display:block;margin:0 0 8px;color:var(--ashwood-field-green,#009b3a);font:700 7px/1 Arial,Helvetica,sans-serif;letter-spacing:.16em;text-transform:uppercase}
    .ashwood-doc-guide-link{position:fixed;inset:0;z-index:624;pointer-events:none;overflow:visible}
    .ashwood-doc-guide-link path{fill:none;stroke:color-mix(in srgb,var(--ashwood-field-green,#009b3a) 48%,transparent);stroke-width:1;stroke-dasharray:4 7;vector-effect:non-scaling-stroke;filter:drop-shadow(0 0 4px color-mix(in srgb,var(--ashwood-field-green,#009b3a) 18%,transparent))}
    .ashwood-doc-guide-link circle{fill:var(--ashwood-field-green,#009b3a);opacity:.78}
    @media(max-width:1100px){
      .v3-mast__meta{font-size:7px;letter-spacing:.11em}
      .v3-title{font-size:clamp(44px,7.7vw,86px)}
      .v3-evidence__lead,.v3-builds__head{gap:clamp(20px,4vw,46px)}
    }
    @media(max-width:900px){
      .v3-mast__meta{display:none!important}
      .v3-hero__copy{padding-top:104px!important}
      .v3-wordmark--hero{margin-bottom:20px!important}
      .v3-latent,.v3-image-note,.v3-margin-note,.v3-build-note,.v3-manifesto-note,.v3-provenance{max-width:78vw}
      .v3-provenance{position:static!important;inset:auto!important;display:block!important;align-self:flex-start;margin:0 0 24px!important;transform:none!important}
      .v3-provenance + .v3-kicker{margin-top:0!important}
      .ashwood-doc-editorial-panel{max-height:52vh}
      .ashwood-doc-guide-link{display:none}
    }
    @media(max-width:520px){
      .v3-provenance{max-width:100%!important;font-size:8px!important;letter-spacing:.12em!important}
      .v3-provenance:before{width:24px!important;margin-right:9px!important}
    }
    @media(max-height:700px) and (min-width:761px){
      .ashwood-doc-editorial-panel{max-height:50vh;bottom:14px}
      .ashwood-doc-editorial-launcher{bottom:14px}
    }
    @media(prefers-reduced-motion:reduce){.ashwood-doc-guide-link{display:none}}
  `;
  document.head.appendChild(style);

  /* doctor-bird-trigger.js still creates a legacy .ashwood-doc-launcher.
     In V3 that is a duplicate of the canonical editorial launcher and can
     overlap the persistent audio player. Remove it whenever it appears. */
  const removeLegacyDocLauncher = () => {
    document.querySelectorAll('.ashwood-doc-launcher,.v3-doc,.v3-doc-panel').forEach(node => node.remove());
  };
  removeLegacyDocLauncher();
  const legacyDocObserver = new MutationObserver(removeLegacyDocLauncher);
  legacyDocObserver.observe(document.documentElement,{childList:true,subtree:true});

  const svgNS = 'http://www.w3.org/2000/svg';
  let connector = null;
  let path = null;
  let startDot = null;
  let endDot = null;
  let raf = 0;

  const ensureConnector = () => {
    if (!fine.matches || reduced.matches) return null;
    if (connector?.isConnected) return connector;
    connector = document.createElementNS(svgNS, 'svg');
    connector.setAttribute('class', 'ashwood-doc-guide-link');
    connector.setAttribute('aria-hidden', 'true');
    connector.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);
    path = document.createElementNS(svgNS, 'path');
    startDot = document.createElementNS(svgNS, 'circle');
    endDot = document.createElementNS(svgNS, 'circle');
    startDot.setAttribute('r', '2.5');
    endDot.setAttribute('r', '2.5');
    connector.append(path, startDot, endDot);
    document.body.appendChild(connector);
    return connector;
  };

  const updateConnector = () => {
    raf = 0;
    const bird = document.querySelector('.ashwood-doctor-bird-cursor.ashwood-doc-character-v2');
    const panel = document.querySelector('.ashwood-doc-editorial-panel');
    const active = !!window.AshwoodDocCharacterV2?.guideActive && panel && !panel.hidden && bird?.classList.contains('is-present');
    panel?.classList.toggle('is-guide-connected', active);
    if (!active || !fine.matches || reduced.matches) {
      connector?.setAttribute('hidden', '');
      return;
    }
    ensureConnector()?.removeAttribute('hidden');
    connector.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);
    const br = bird.getBoundingClientRect();
    const pr = panel.getBoundingClientRect();
    const x1 = br.left + br.width * .55;
    const y1 = br.top + br.height * .58;
    const x2 = pr.left;
    const y2 = pr.top + Math.min(54, pr.height * .18);
    const bend = Math.max(38, Math.min(150, Math.abs(x2 - x1) * .34));
    const d = `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${(x1 + bend).toFixed(1)} ${y1.toFixed(1)}, ${(x2 - bend).toFixed(1)} ${y2.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    path.setAttribute('d', d);
    startDot.setAttribute('cx', x1); startDot.setAttribute('cy', y1);
    endDot.setAttribute('cx', x2); endDot.setAttribute('cy', y2);
  };

  const scheduleConnector = () => {
    if (raf) return;
    raf = requestAnimationFrame(updateConnector);
  };

  const installDocConnection = () => {
    const panel = document.querySelector('.ashwood-doc-editorial-panel');
    const bird = document.querySelector('.ashwood-doctor-bird-cursor.ashwood-doc-character-v2');
    if (!panel || !bird || !window.AshwoodDocCharacterV2) return false;
    if (panel.dataset.v3QaConnected === '1') return true;
    panel.dataset.v3QaConnected = '1';
    new MutationObserver(scheduleConnector).observe(panel,{attributes:true,attributeFilter:['hidden','class']});
    new MutationObserver(scheduleConnector).observe(bird,{attributes:true,attributeFilter:['class','style']});
    addEventListener('resize',scheduleConnector,{passive:true});
    addEventListener('scroll',scheduleConnector,{passive:true});
    document.addEventListener('pointermove',scheduleConnector,{passive:true});
    scheduleConnector();
    return true;
  };

  if (!installDocConnection()) {
    const observer = new MutationObserver(() => { if (installDocConnection()) observer.disconnect(); });
    observer.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(() => observer.disconnect(),12000);
  }
})();
