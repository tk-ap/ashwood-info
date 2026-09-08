(() => {
  'use strict';

  const mount = document.querySelector('#deployment-review-items');
  if (!mount) return;

  const esc = (value = '') => String(value).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));

  let snapshot = { completed_items: [], notes: {}, auto_items: [] };

  function render() {
    const items = Array.isArray(snapshot.auto_items) ? snapshot.auto_items : [];
    const completed = new Set(snapshot.completed_items || []);
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
                <label>
                  <input type="checkbox" data-deploy-review-id="${esc(item.id)}" ${done ? 'checked' : ''}/>
                  <span><strong>${esc(item.label || 'Review production deployment')}</strong><br/><small>${esc(item.detail || '')}${files.length ? `<br/>Changed: ${esc(files.slice(0,8).join(' · '))}${files.length > 8 ? ' …' : ''}` : ''}</small></span>
                </label>
                <textarea data-deploy-note-id="${esc(item.id)}" rows="1" placeholder="What did you notice?">${esc(snapshot.notes?.[item.id] || '')}</textarea>
              </div>`;
            }).join('')}
          </div>
        </details>
      </div>`;
  }

  async function load() {
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
      method:'PATCH', credentials:'same-origin', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ completed_items:snapshot.completed_items || [], notes:snapshot.notes || {} }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  }

  mount.addEventListener('change', async event => {
    const box = event.target.closest('[data-deploy-review-id]');
    if (!box) return;
    const completed = new Set(snapshot.completed_items || []);
    if (box.checked) completed.add(box.dataset.deployReviewId); else completed.delete(box.dataset.deployReviewId);
    snapshot.completed_items = [...completed];
    render();
    try { await save(); } catch { await load(); }
  });

  let noteTimer = 0;
  mount.addEventListener('input', event => {
    const field = event.target.closest('[data-deploy-note-id]');
    if (!field) return;
    snapshot.notes = snapshot.notes || {};
    const value = field.value.trim();
    if (value) snapshot.notes[field.dataset.deployNoteId] = value;
    else delete snapshot.notes[field.dataset.deployNoteId];
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => save().catch(() => load()), 400);
  });

  load();
})();
