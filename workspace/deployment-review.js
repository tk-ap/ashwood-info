(() => {
  'use strict';

  const mount = document.querySelector('#deployment-review-items');
  if (!mount) return;

  const esc = (value = '') => String(value).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));

  let snapshot = { auto_items: [], deployment_completed_items: [], deployment_notes: {} };
  let unsaved = false;

  function setSaveState(text, failed) {
    const node = mount.querySelector('#deploy-review-save-state');
    if (!node) return;
    node.textContent = text;
    node.classList.toggle('is-error', Boolean(failed));
  }

  function render() {
    const items = Array.isArray(snapshot.auto_items) ? snapshot.auto_items : [];
    const completed = new Set(snapshot.deployment_completed_items || []);
    const pending = items.filter(item => !completed.has(item.id));

    mount.hidden = !items.length;
    if (!items.length) return;

    mount.innerHTML = `
      <div class="v3-checklist__head">
        <div>
          <p class="section-kicker">Production review queue</p>
          <h2>New since your last review</h2>
        </div>
        <div class="v3-checklist__progress"><strong>${pending.length}</strong><span>awaiting review</span></div>
      </div>
      <p class="v3-checklist__note">ASHWOOD adds an unchecked item automatically when a production deployment changes a user-facing site surface. Only you checking it off counts as reviewed.</p>
      <div class="v3-checklist__sections">
        <details class="v3-checklist__section" open>
          <summary><span>Live deployments</span><small>${items.length - pending.length}/${items.length}</small></summary>
          <div class="v3-checklist__items">
            ${items.map(item => {
              const done = completed.has(item.id);
              const files = Array.isArray(item.files) ? item.files : [];
              return `<div class="v3-checklist__item ${done ? 'is-done' : ''}">
                <div>
                <label>
                  <input type="checkbox" data-deploy-review-id="${esc(item.id)}" ${done ? 'checked' : ''}/>
                  <span><strong>${esc(item.label || 'Review production deployment')}</strong><br/><small>${esc(item.detail || '')}${files.length ? `<br/>Changed: ${esc(files.slice(0,8).join(' · '))}${files.length > 8 ? ' …' : ''}` : ''}</small></span>
                </label>
                ${item.review_target === 'ai-from-zero' ? `<a class="v3-checklist__open" href="/api/workspace-review-visit?item=${encodeURIComponent(item.id)}">Review live ↗</a>` : ''}
                <p class="v3-checklist__note">${done ? 'Approved by owner' : snapshot.review_started?.[item.id] ? 'Review started · awaiting your approval' : 'Awaiting owner review'}</p>
                </div>
                <textarea data-deploy-note-id="${esc(item.id)}" rows="1" placeholder="What did you notice?">${esc(snapshot.deployment_notes?.[item.id] || '')}</textarea>
              </div>`;
            }).join('')}
          </div>
        </details>
      </div>
      <div class="v3-checklist__footer"><span id="deploy-review-save-state">${unsaved ? 'Unsaved changes' : 'Saved'}</span></div>`;
  }

  async function load() {
    if (unsaved) return;
    try {
      const res = await fetch('/api/workspace-checklist', { credentials:'same-origin', cache:'no-store' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
      snapshot = body;
      render();
    } catch (error) {
      mount.hidden = false;
      mount.innerHTML = `<p class="v3-checklist__loading">Deployment review queue unavailable: ${esc(error?.message || 'unknown error')}</p>`;
    }
  }

  async function save() {
    const res = await fetch('/api/workspace-checklist', {
      method:'PATCH', credentials:'same-origin', keepalive:true, headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        scope:'deployment',
        deployment_completed_items:snapshot.deployment_completed_items || [],
        deployment_notes:snapshot.deployment_notes || {},
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  }

  mount.addEventListener('change', async event => {
    const box = event.target.closest('[data-deploy-review-id]');
    if (!box) return;
    const completed = new Set(snapshot.deployment_completed_items || []);
    if (box.checked) completed.add(box.dataset.deployReviewId); else completed.delete(box.dataset.deployReviewId);
    snapshot.deployment_completed_items = [...completed];
    unsaved = true;
    render();
    setSaveState('Saving…');
    try {
      await save();
      unsaved = false;
      setSaveState(`Saved ${new Date().toLocaleTimeString([], { hour:'numeric', minute:'2-digit' })}`);
    } catch (error) {
      /* Keep the unsaved edit on screen. Reloading here used to discard the owner's
         review silently, which is worse than an unsaved item they can retry. */
      setSaveState(`Not saved — ${error?.message || 'try again'}`, true);
    }
  });

  let noteTimer = 0;
  mount.addEventListener('input', event => {
    const field = event.target.closest('[data-deploy-note-id]');
    if (!field) return;
    snapshot.deployment_notes = snapshot.deployment_notes || {};
    const value = field.value.trim();
    if (value) snapshot.deployment_notes[field.dataset.deployNoteId] = value;
    else delete snapshot.deployment_notes[field.dataset.deployNoteId];
    unsaved = true;
    clearTimeout(noteTimer);
    noteTimer = setTimeout(async () => {
      setSaveState('Saving…');
      try {
        await save();
        unsaved = false;
        setSaveState(`Saved ${new Date().toLocaleTimeString([], { hour:'numeric', minute:'2-digit' })}`);
      } catch (error) {
        setSaveState(`Not saved — ${error?.message || 'try again'}`, true);
      }
    }, 400);
  });

  async function flush() {
    if (!unsaved) return;
    clearTimeout(noteTimer);
    try {
      await save();
      unsaved = false;
      setSaveState(`Saved ${new Date().toLocaleTimeString([], { hour:'numeric', minute:'2-digit' })}`);
    } catch (error) {
      setSaveState(`Not saved — ${error?.message || 'try again'}`, true);
    }
  }

  /* The checklist is used by navigating out to the live surface and back, so a pending
     edit has to reach the server before the page is hidden — otherwise the Back-navigation
     refresh reads stale state over an edit that never left the browser. */
  window.addEventListener('pagehide', () => { flush(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  window.addEventListener('pageshow', async event => { if (event.persisted) { await flush(); load(); } });
  load();
})();
