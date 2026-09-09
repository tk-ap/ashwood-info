(() => {
  'use strict';

  const mount = document.querySelector('#v3-playtest-checklist');
  if (!mount) return;

  const sections = [
    ['Homepage / V3 identity', [
      ['home-wordmark','Watch ASHWOOD → ASHW888D → ASHWOOD living wordmark cycle.'],
      ['home-nav','Open the full-screen GO ANYWHERE navigation from the wordmark.'],
      ['home-workspace-link','Find and use the discreet workspace ↗ link in the global navigation.'],
      ['home-provenance','Interact with identity and verify the provenance / throughline reveal.'],
      ['home-manifestations','Hover ∞ manifestations and watch the reel cycle through ASHWOOD disciplines.'],
      ['home-wherever','Click “wherever” multiple times and verify it behaves as a curiosity/random doorway.'],
      ['home-in-me','Use the hidden ASHWOOD → IN ME interaction around the name and start the persistent audio experience.'],
      ['home-audio','Expand/collapse the redesigned audio player and verify playback/state across navigation.'],
      ['home-themes','Check V3 in the available themes and judge whether each still feels intentionally designed.'],
      ['home-motion','On desktop, test cursor/hero image movement, ambient field, risograph cursor, and scroll-progress behavior.'],
    ]],
    ['The Instinct', [
      ['instinct-six','Find all six signals: SIGNAL, FRICTION, TRANSLATION, SYSTEMS, ADAPTATION, SYNTHESIS.'],
      ['instinct-explain','Verify each signal reveals an explanation rather than acting as decoration.'],
      ['instinct-progress','Confirm discovery text progresses to X / 6 and then “You found the field.”'],
      ['instinct-persist','Refresh after finding signals and confirm discovery state persists locally.'],
      ['instinct-doc','Use FOLLOW DOC / Doctor Bird and judge whether it feels like a real guide.'],
      ['instinct-instrument','Notice whether section hover/scroll reactions make V3 feel like an instrument, not a static page.'],
    ]],
    ['The work takes over', [
      ['work-modeling','Review the expanded modeling/photo sequence and whether photography can carry the argument.'],
      ['work-music','Check the dedicated IN ME music moment.'],
      ['work-products','Hover ALVIRA / ailhat / LEDGATo and verify the relationship feels intentional rather than like a SaaS card grid.'],
      ['work-thesis','Judge whether the three products read as one systems thesis while retaining separate identities.'],
      ['work-notes','Try marginal / latent notes and confirm they connect coherently to the Doc layer.'],
    ]],
    ['Depth + navigation', [
      ['depth-thread','Use Follow the thread to open Build Journal, Dispatch, AI from Zero, and About.'],
      ['depth-direct','Confirm those destinations are also reachable directly from global navigation.'],
      ['depth-cta','Reach “Come make something.” and judge whether the page earns the CTA.'],
    ]],
    ['Private Workspace', [
      ['ws-workstreams','Review Active Workstreams: product, status, owner, stage, next gate, goals, canonical source.'],
      ['ws-drop','Use ASHWOOD Drop with a small harmless audio file.'],
      ['ws-stage','Upload without publishing and confirm the file stays private/staged.'],
      ['ws-meta','Check title, artist, producer/credit, rights note, and source/license URL metadata.'],
      ['ws-publish','Publish the staged track and verify the Music page updates without a new deploy.'],
      ['ws-unpublish','Unpublish it and confirm it disappears publicly while staying in the private library.'],
      ['ws-special','If available, test SPECIAL / WITH YOU mapping into the intended sOUNDcLoud slots.'],
      ['ws-review','Open Music Intelligence and use Review track.'],
      ['ws-modes','Confirm Creative Mode → Review Mode framing is clear and intentional.'],
      ['ws-judgments','Verify Artistic Strength / Market Alignment / Release Readiness stay separate.'],
      ['ws-no-fake','Confirm the UI says Pending engine / analysis not connected and does not fabricate results.'],
      ['ws-catalog','Review Catalog Intelligence labels and verify they remain Awaiting analysis for now.'],
      ['ws-rights','Open Rights & Splits / Music Rights Ledger for a track.'],
      ['ws-rights-fields','Check composition split, master split, direct-sale split, agreements, registrations, and clearance controls.'],
      ['ws-rights-persist','Save a dummy rights record, reload Workspace, and confirm it persisted.'],
      ['ws-clearance','Manually test NOT CLEARED → REVIEW → CLEARED and confirm ASHWOOD never promotes status itself.'],
      ['ws-edition','Test ASHWOOD Edition economics, including 88 copies × $88 and a TK percentage.'],
      ['ws-legal-copy','Confirm the ledger clearly says recorded source of truth, not legal certification.'],
    ]],
    ['Public Music', [
      ['music-runtime','Confirm Blob-backed runtime behavior rather than static GitHub audio.'],
      ['music-rotation','Verify ordinary published tracks appear under From the workspace / In rotation.'],
      ['music-special','Verify SPECIAL / WITH YOU use intended sOUNDcLoud slots with native playback and rights context.'],
      ['music-private','Confirm staged/private songs remain invisible publicly.'],
      ['music-mobile','Test public audio behavior on mobile and desktop.'],
    ]],
    ['AI from Zero / Build Gate', [
      ['gate-open','Open /ai-from-zero/build-gate.'],
      ['gate-mixed','Take the 10-question Build Gate once with mixed answers.'],
      ['gate-reasoning','Verify verdict, score explanation, and answer review match the selected responses.'],
      ['gate-strong','Run a very strong answer set and confirm no fake weak dimension is invented.'],
      ['gate-assumption','Check Largest unproven assumption points to a specific low-confidence response.'],
      ['gate-experiment','Check Cheapest next experiment responds to that specific uncertainty.'],
    ]],
    ['End-to-end loop', [
      ['e2e-loop','Homepage → Workspace → staged test song → Review Track → save Rights record → publish → Music playback → unpublish → Homepage.'],
    ]],
  ];

  const allItems = sections.flatMap(([, items]) => items);
  let completed = new Set();
  let notes = {};
  let reviewStarted = {};
  let saveTimer = 0;
  let unsaved = false;

  const esc = (value='') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const itemHtml = (id, label, origin='') => `<div class="v3-checklist__item ${completed.has(id)?'is-done':''}">
            <label><input type="checkbox" data-check-id="${esc(id)}" ${completed.has(id)?'checked':''}/><span>${esc(label)}${origin ? `<br/><small>${esc(origin)}</small>` : ''}${reviewStarted[id] && !completed.has(id) ? '<br/><small>Review started · awaiting your approval</small>' : ''}</span></label>
            <textarea data-note-id="${esc(id)}" rows="1" placeholder="Optional note / bug / thought…">${esc(notes[id] || '')}</textarea>
          </div>`;

  function render() {
    const done = completed.size;
    const total = allItems.length;
    /* Checked items sink out of the working list into one Completed group at the
       bottom, so what is left on screen is only what still needs playing. They keep
       their checkbox and note, so unchecking one returns it to its own section. */
    const doneItems = sections.flatMap(([title, items]) =>
      items.filter(([id]) => completed.has(id)).map(([id, label]) => [id, label, title]));
    const state = mount.querySelector('#v3-checklist-save-state');
    const saveLabel = state ? state.textContent : 'Saved';
    const saveError = state ? state.classList.contains('is-error') : false;

    mount.innerHTML = `
      <div class="v3-checklist__head">
        <div><p class="section-kicker">V3 playtest · 08 Sep 2026</p><h2>Things to check today</h2></div>
        <div class="v3-checklist__progress"><strong>${done}/${total}</strong><span>${Math.round((done/total)*100)}% checked</span></div>
      </div>
      <div class="v3-checklist__bar"><span style="width:${(done/total)*100}%"></span></div>
      <p class="v3-checklist__note">Private, persistent Workspace state. Check items off as you play; progress and notes save automatically and refresh on their own.</p>
      <div class="v3-checklist__sections">
        ${sections.map(([title, items]) => {
          const outstanding = items.filter(([id]) => !completed.has(id));
          if (!outstanding.length) return '';
          return `<details class="v3-checklist__section" open>
          <summary><span>${esc(title)}</span><small>${items.length - outstanding.length}/${items.length}</small></summary>
          <div class="v3-checklist__items">${outstanding.map(([id,label]) => itemHtml(id,label)).join('')}</div>
        </details>`;
        }).join('')}
        ${doneItems.length ? `<details class="v3-checklist__section v3-checklist__section--done">
          <summary><span>Completed</span><small>${doneItems.length}/${total}</small></summary>
          <div class="v3-checklist__items">${doneItems.map(([id,label,title]) => itemHtml(id,label,title)).join('')}</div>
        </details>` : ''}
      </div>
      <div class="v3-checklist__footer"><span id="v3-checklist-save-state" class="${saveError?'is-error':''}">${esc(saveLabel)}</span><button type="button" id="v3-checklist-clear">Reset checklist</button></div>`;
  }

  async function save() {
    const state = mount.querySelector('#v3-checklist-save-state');
    if (state) state.textContent = 'Saving…';
    try {
      const res = await fetch('/api/workspace-checklist', {
        method:'PATCH', credentials:'same-origin', keepalive:true, headers:{'Content-Type':'application/json'},
        body:JSON.stringify({completed_items:[...completed],notes})
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
      unsaved = false;
      if (state) { state.textContent = `Saved ${new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}`; state.classList.remove('is-error'); }
    } catch (error) {
      if (state) { state.textContent = error?.message || 'Could not save'; state.classList.add('is-error'); }
    }
  }

  function queueSave() {
    unsaved = true;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 350);
  }

  /* Playing the checklist means leaving for the live site and coming back, so a debounced
     edit has to be flushed before the page is hidden. Otherwise the pageshow reload below
     replaces a just-checked item with the older server copy. */
  async function flush() {
    if (!unsaved) return;
    clearTimeout(saveTimer);
    await save();
  }

  mount.addEventListener('change', event => {
    const box = event.target.closest('[data-check-id]');
    if (!box) return;
    if (box.checked) completed.add(box.dataset.checkId); else completed.delete(box.dataset.checkId);
    render();
    queueSave();
  });

  mount.addEventListener('input', event => {
    const field = event.target.closest('[data-note-id]');
    if (!field) return;
    const value = field.value.trim();
    if (value) notes[field.dataset.noteId] = value; else delete notes[field.dataset.noteId];
    queueSave();
  });

  mount.addEventListener('click', event => {
    if (event.target.id !== 'v3-checklist-clear') return;
    if (!confirm('Reset all V3 playtest checkmarks and notes?')) return;
    completed.clear(); notes = {}; render(); save();
  });

  async function load() {
    mount.innerHTML = '<p class="v3-checklist__loading">Loading V3 playtest checklist…</p>';
    try {
      const res = await fetch('/api/workspace-checklist', {credentials:'same-origin',cache:'no-store'});
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
      reviewStarted = body.review_started || {};
      completed = new Set(Array.isArray(body.completed_items) ? body.completed_items : []);
      notes = body.notes && typeof body.notes === 'object' ? body.notes : {};
      render();
    } catch (error) {
      mount.innerHTML = `<p class="v3-checklist__loading">${esc(error?.message || 'Checklist unavailable')}</p>`;
    }
  }

  /* The checklist is played across two surfaces at once — this page and the live site
     in another tab — and the deployment review queue writes new items server-side. Poll
     while visible so the list reflects that without a manual reload, and refresh the
     moment the tab is looked at again, which is when returning from the live site. */
  const POLL_MS = 15000;
  const fingerprint = () => JSON.stringify([[...completed].sort(), notes, reviewStarted]);

  function editing() {
    const active = document.activeElement;
    return Boolean(active && mount.contains(active) && active.matches('textarea, input'));
  }

  async function poll() {
    // Never let a server copy overwrite an edit that has not been written back yet,
    // and never rebuild the DOM under a cursor that is mid-note.
    if (document.visibilityState !== 'visible' || unsaved || editing()) return;
    try {
      const res = await fetch('/api/workspace-checklist', {credentials:'same-origin',cache:'no-store'});
      if (!res.ok) return;
      const body = await res.json();
      const before = fingerprint();
      const nextCompleted = new Set(Array.isArray(body.completed_items) ? body.completed_items : []);
      const nextNotes = body.notes && typeof body.notes === 'object' ? body.notes : {};
      const nextStarted = body.review_started || {};
      const after = JSON.stringify([[...nextCompleted].sort(), nextNotes, nextStarted]);
      if (before === after) return;
      completed = nextCompleted; notes = nextNotes; reviewStarted = nextStarted;
      render();
    } catch (_) { /* a failed poll is not worth reporting; the next one retries */ }
  }

  setInterval(poll, POLL_MS);

  window.addEventListener('pagehide', () => { flush(); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush(); else poll();
  });
  window.addEventListener('pageshow', async event => { if (event.persisted) { await flush(); if (!unsaved) load(); } });
  load();
})();
