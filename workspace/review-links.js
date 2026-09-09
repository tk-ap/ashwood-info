(() => {
  'use strict';

  // Only arrival-verifiable checks get a live link. Judgment, behavior, and
  // multi-step checks remain manual and intentionally have no shortcut.
  const OBJECTIVE_VISITS = new Set([
    'ws-workstreams','ws-drop','ws-review','ws-rights','music-runtime','gate-open'
  ]);
  const mount = document.querySelector('#v3-playtest-checklist');
  if (!mount) return;

  function installLinks() {
    mount.querySelectorAll('[data-check-id]').forEach(box => {
      const id = box.dataset.checkId;
      if (!OBJECTIVE_VISITS.has(id)) return;
      const item = box.closest('.v3-checklist__item');
      const label = box.closest('label');
      if (!item || !label || item.querySelector(`[data-review-open="${CSS.escape(id)}"]`)) return;
      const link = document.createElement('a');
      link.className = 'v3-checklist__open';
      link.dataset.reviewOpen = id;
      link.href = `/api/workspace-review-visit?item=${encodeURIComponent(id)}`;
      link.textContent = 'Open · auto-checks visit ↗';
      link.title = 'Reaching this destination is enough to complete this objective visit check.';
      label.append(link);
    });
  }

  const observer = new MutationObserver(installLinks);
  observer.observe(mount, { childList: true, subtree: true });
  installLinks();
})();
