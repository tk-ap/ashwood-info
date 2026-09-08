(() => {
  'use strict';

  const ROUTED = new Set([
    'home-wordmark','home-nav','home-workspace-link','home-provenance','home-manifestations','home-wherever','home-in-me','home-audio','home-themes','home-motion',
    'instinct-six','instinct-explain','instinct-progress','instinct-persist','instinct-doc','instinct-instrument',
    'work-modeling','work-music','work-products','work-thesis','work-notes','depth-thread','depth-direct','depth-cta',
    'ws-workstreams','ws-drop','ws-meta','ws-review','ws-modes','ws-judgments','ws-no-fake','ws-catalog','ws-rights','ws-rights-fields','ws-edition','ws-legal-copy',
    'music-runtime','music-rotation','music-special','music-private','music-mobile','gate-open'
  ]);

  const AUTO = new Set(['ws-workstreams','ws-drop','ws-review','ws-rights','music-runtime','gate-open']);
  const mount = document.querySelector('#v3-playtest-checklist');
  if (!mount) return;

  function installLinks() {
    mount.querySelectorAll('[data-check-id]').forEach(box => {
      const id = box.dataset.checkId;
      if (!ROUTED.has(id)) return;
      const item = box.closest('.v3-checklist__item');
      const label = box.closest('label');
      if (!item || !label || item.querySelector(`[data-review-open="${CSS.escape(id)}"]`)) return;
      const link = document.createElement('a');
      link.className = 'v3-checklist__open';
      link.dataset.reviewOpen = id;
      link.href = `/api/workspace-review-visit?item=${encodeURIComponent(id)}`;
      link.textContent = AUTO.has(id) ? 'Open · auto-checks visit ↗' : 'Review live ↗';
      link.title = AUTO.has(id)
        ? 'Reaching this destination is enough to complete this objective visit check.'
        : 'Records review started and opens the relevant surface. Only your explicit checkmark approves this judgment or behavior check.';
      label.append(link);
    });
  }

  const observer = new MutationObserver(installLinks);
  observer.observe(mount, { childList: true, subtree: true });
  installLinks();
})();
