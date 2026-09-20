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
    const activeDays = Number(snapshot.review_policy?.active_days || 14);
    const cutoff = Date.now() - (activeDays * 24 * 60 * 60 * 1000);

    const active = [];
    const ignored = [];
    const reviewed = [];

    for (const item of items) {
      if (completed.has(item.id)) {
        reviewed.push(item);
        continue;
      }
      const when = new Date(item.deployed_at || item.occurred_at || item.created_at || 0).getTime();
      if (Number.isFinite(when) && when > 0 && when < cutoff) ignored.push(item);
      else active.push(item);
    }

    mount.hidden = false;

    const itemHtml = (item, bucket) => {
      const done = completed.has(item.id);
      const files = Array.isArray(item.files) ? item.files : [];
      const aging = bucket === 'ignored'
        ? `<p class="v3-checklist__note">Aged out after ${activeDays} days without review. This is not approval; restore it by reviewing and checking it off if it still matters.</p>`
        : '';
      return `<div class="v3-checklist__item ${done ? 'is-done' : bucket === 'ignored' ? 'is-aged' : ''}">
        <div>
        <label>
          <input type="checkbox" data-deploy-review-id="${esc(item.id)}" ${done ? 'checked' : ''}/>
          <span><strong>${esc(item.label || 'Review production deployment')}</strong><br/><small>${esc(item.detail || '')}${files.length ? `<br/>Changed: ${esc(files.slice(0,8).join(' · '))}${files.length > 8 ? ' …' : ''}` : ''}</small></span>
        </label>
        ${item.review_target === 'ai-from-zero' ? `<a class="v3-checklist__open" href="/api/workspace-review-visit?item=${encodeURIComponent(item.id)}">Review live ↗</a>` : item.review_target === 'workspace-cohesion' ? `<a class="v3-checklist__open" href="/workspace/">Review live ↗</a>` : ''}
        <p class="v3-checklist__note">${done ? 'Approved by owner' : snapshot.review_started?.[item.id] ? 'Review started · awaiting your approval' : bucket === 'ignored' ? 'Not acted on' : 'Awaiting owner review'}</p>
        ${aging}
        </div>
        <textarea data-deploy-note-id="${esc(item.id)}" rows="1" placeholder="What did you notice?">${esc(snapshot.deployment_notes?.[item.id] || '')}</textarea>
      </div>`;
    };

    const activeHtml = active.length
      ? `<details class="v3-checklist__section" open><summary><span>Needs review</span><small>${active.length} open</small></summary><div class="v3-checklist__items">${active.map(item => itemHtml(item, 'active')).join('')}</div></details>`
      : '';

    const ignoredHtml = ignored.length
      ? `<details class="v3-checklist__section v3-checklist__section--ignored"><summary><span>Not acted on</span><small>${ignored.length} aged out</small></summary><p class="v3-checklist__note v3-checklist__bucket-note">These releases stayed unreviewed for more than ${activeDays} days, so they no longer occupy the primary queue. Their lack of attention is useful signal about whether this kind of review work is worth generating.</p><div class="v3-checklist__items">${ignored.map(item => itemHtml(item, 'ignored')).join('')}</div></details>`
      : '';

    const reviewedHtml = reviewed.length
      ? `<details class="v3-checklist__section v3-checklist__section--done"><summary><span>Archive</span><small>${reviewed.length} reviewed</small></summary><div class="v3-checklist__items">${reviewed.map(item => itemHtml(item, 'archive')).join('')}</div></details>`
      : '';

    mount.innerHTML = `
      <div class="v3-checklist__head">
        <div>
          <p class="section-kicker">Production review queue</p>
          <h2>${active.length ? 'Review what shipped.' : 'Nothing needs review.'}</h2>
        </div>
        <div class="v3-checklist__progress"><strong>${active.length}</strong><span>needs attention</span></div>
      </div>
      <p class="v3-checklist__note">Current release checks stay here for ${activeDays} days. Reviewed work moves to Archive; untouched work moves to Not acted on instead of aging indefinitely in the main queue.</p>
      <div class="v3-checklist__sections">${activeHtml}${ignoredHtml}${reviewedHtml}</div>
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
