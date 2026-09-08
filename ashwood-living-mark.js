(() => {
  "use strict";

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const SELECTOR = '.ashwood-site-header__brand,.wordmark,.journal-wordmark,.site-wordmark';
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  const installStyles = () => {
    if (document.getElementById('ashwood-living-mark-style')) return;
    const style = document.createElement('style');
    style.id = 'ashwood-living-mark-style';
    style.textContent = `
      .ashwood-living-mark{display:inline-block;min-width:8.9ch;white-space:nowrap;font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1;letter-spacing:inherit}
      .ashwood-living-mark::after{content:"";display:inline-block;width:.07em;height:.88em;margin-left:.12em;background:currentColor;vertical-align:-.08em;opacity:.34;animation:ashwood-mark-caret 1.05s steps(1,end) infinite}
      @keyframes ashwood-mark-caret{0%,48%{opacity:.34}49%,100%{opacity:0}}
      @media(prefers-reduced-motion:reduce){.ashwood-living-mark::after{display:none!important}}
    `;
    document.head.appendChild(style);
  };

  const typeTo = async (node, target, delay = 92) => {
    while (node.textContent.length < target.length) {
      node.textContent = target.slice(0, node.textContent.length + 1);
      await sleep(delay);
    }
  };

  const backspaceTo = async (node, targetLength, delay = 68) => {
    while (node.textContent.length > targetLength) {
      node.textContent = node.textContent.slice(0, -1);
      await sleep(delay);
    }
  };

  const run = async node => {
    if (node.dataset.ashwoodLivingMark === '1') return;
    node.dataset.ashwoodLivingMark = '1';
    node.classList.add('ashwood-living-mark');
    node.textContent = 'ASHWOOD';
    node.setAttribute('aria-label', 'ASHWOOD home');
    if (reduced.matches) return;

    for (;;) {
      await sleep(2600);
      await backspaceTo(node, 4);
      await typeTo(node, 'ASHW888D');
      await sleep(2100);
      await backspaceTo(node, 4);
      await typeTo(node, 'ASHWOOD');
      await sleep(2300);
    }
  };

  const mount = () => {
    installStyles();
    document.querySelectorAll(SELECTOR).forEach(node => {
      if (node.closest('.v3-mast')) return; // homepage V3 owns its own identical cycle
      run(node);
    });
  };

  const loadHomepageThesis = () => {
    if (!document.body?.classList.contains('v3-preview')) return;
    if (document.querySelector('script[data-v3-identity-thesis]')) return;
    const script = document.createElement('script');
    script.src = '/v3-identity-thesis.js?v=20260907-thesis1';
    script.defer = true;
    script.dataset.v3IdentityThesis = '1';
    document.head.appendChild(script);
  };

  const start = () => { mount(); loadHomepageThesis(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();

  const observer = new MutationObserver(mount);
  observer.observe(document.documentElement, { childList:true, subtree:true });
  setTimeout(() => observer.disconnect(), 12000);
})();
