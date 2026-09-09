(() => {
  'use strict';

  const drop = document.querySelector('#ashwood-drop');
  if (!drop || document.querySelector('#music-rights-ledger')) return;

  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = '/workspace/rights-ledger.css?v=20260907-rights1';
  document.head.appendChild(css);

  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));

  const section = document.createElement('section');
  section.id = 'music-rights-ledger';
  section.className = 'music-rights-ledger';
  section.innerHTML = `
    <div class="music-rights-ledger__head">
      <div>
        <p class="section-kicker">Music rights control plane</p>
        <h3>Rights &amp; splits</h3>
      </div>
      <p>ASHWOOD records what you understand about each track's rights, agreements, registrations, and commercial readiness. It does not certify legal ownership or replace BMI, SoundExchange, a distributor, or the Copyright Office.</p>
    </div>
    <div class="music-rights-ledger__grid">
      <aside class="music-rights-ledger__tracks">
        <div class="music-rights-ledger__tracks-head"><strong>Your tracks</strong><span id="rights-track-count">Loading…</span></div>
        <div id="rights-track-list"><p class="music-rights-ledger__empty">Loading your private music library…</p></div>
      </aside>
      <div class="music-rights-ledger__editor" id="rights-editor">
        <p class="music-rights-ledger__empty">Choose a track to record its rights and commercial-clearance state.</p>
      </div>
    </div>`;

  const intelligence = document.querySelector('#music-intelligence');
  if (intelligence) intelligence.after(section);
  else drop.appendChild(section);
  if (window.location.hash === '#music-rights-ledger') {
    requestAnimationFrame(() => section.scrollIntoView());
  }

  const list = section.querySelector('#rights-track-list');
  const count = section.querySelector('#rights-track-count');
  const editor = section.querySelector('#rights-editor');
  let uploads = [];
  let activeId = null;

  const statusLabel = value => ({
    'not-cleared':'NOT CLEARED',
    review:'REVIEW',
    cleared:'CLEARED'
  }[value] || 'NOT CLEARED');

  const selectOptions = (values, selected) => values.map(([value,label]) =>
    `<option value="${escapeHtml(value)}" ${value === selected ? 'selected' : ''}>${escapeHtml(label)}</option>`
  ).join('');

  function renderTracks() {
    count.textContent = `${uploads.length} track${uploads.length === 1 ? '' : 's'}`;
    list.innerHTML = uploads.length ? uploads.map(item => {
      const rights = item.rights_ledger || {};
      const state = rights.commercialClearance || 'not-cleared';
      return `<button type="button" class="music-rights-ledger__track ${Number(item.id) === activeId ? 'is-active' : ''}" data-rights-track="${Number(item.id)}">
        <span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.artist || 't.kap')}</small></span>
        <em class="is-${escapeHtml(state)}">${statusLabel(state)}</em>
      </button>`;
    }).join('') : '<p class="music-rights-ledger__empty">Upload a track first. Rights records attach to the existing ASHWOOD music library.</p>';
  }

  function renderEditor(item) {
    activeId = Number(item.id);
    renderTracks();
    const r = item.rights_ledger || {};
    const tkPct = Number.isFinite(Number(r.directTkPct)) ? Number(r.directTkPct) : '';
    editor.innerHTML = `
      <form id="rights-form" class="music-rights-ledger__form">
        <div class="music-rights-ledger__editor-head">
          <div><p class="section-kicker">Recorded rights</p><h4>${escapeHtml(item.title)}</h4><small>${escapeHtml(item.artist || 't.kap')}${item.producer_credit ? ` · ${escapeHtml(item.producer_credit)}` : ''}</small></div>
          <span class="music-rights-ledger__clearance is-${escapeHtml(r.commercialClearance || 'not-cleared')}">${statusLabel(r.commercialClearance)}</span>
        </div>

        <p class="music-rights-ledger__notice"><strong>Recorded source of truth, not legal certification.</strong> Use agreements and external registrations as the evidence behind these entries.</p>

        <div class="music-rights-ledger__fields two-col">
          <label>Composition / songwriter split<textarea name="compositionSplit" placeholder="e.g. TK 50% / Producer 50%">${escapeHtml(r.compositionSplit || '')}</textarea></label>
          <label>Master ownership split<textarea name="masterSplit" placeholder="e.g. TK 75% / Producer 25%">${escapeHtml(r.masterSplit || '')}</textarea></label>
          <label>Direct-sale TK share (%)<input name="directTkPct" type="number" min="0" max="100" step="0.01" value="${escapeHtml(tkPct)}" placeholder="75" /></label>
          <label>Commercial clearance<select name="commercialClearance">${selectOptions([
            ['not-cleared','Not cleared'],['review','Review'],['cleared','Cleared']
          ], r.commercialClearance || 'not-cleared')}</select></label>
          <label>Agreement status<select name="agreementStatus">${selectOptions([
            ['unknown','Not recorded'],['discussion','In discussion'],['draft','Draft'],['signed','Signed']
          ], r.agreementStatus || 'unknown')}</select></label>
          <label>Agreement reference<input name="agreementReference" type="text" value="${escapeHtml(r.agreementReference || '')}" placeholder="Date, filename, DocuSign reference, note" /></label>
          <label>PRO registration<select name="proRegistration">${selectOptions([
            ['not-recorded','Not recorded'],['pending','Pending'],['registered','Registered']
          ], r.proRegistration || 'not-recorded')}</select></label>
          <label>SoundExchange<select name="soundexchangeRegistration">${selectOptions([
            ['not-applicable','Not applicable / unknown'],['pending','Pending'],['registered','Registered']
          ], r.soundexchangeRegistration || 'not-applicable')}</select></label>
          <label>Copyright registration<select name="copyrightRegistration">${selectOptions([
            ['not-recorded','Not recorded'],['pending','Pending'],['registered','Registered']
          ], r.copyrightRegistration || 'not-recorded')}</select></label>
        </div>

        <div class="music-rights-ledger__edition">
          <div><p class="section-kicker">Direct release experiment</p><h5>ASHWOOD Edition economics</h5></div>
          <div class="music-rights-ledger__fields edition-fields">
            <label>Edition size<input name="editionSize" type="number" min="1" step="1" value="${escapeHtml(r.editionSize || '')}" placeholder="88" /></label>
            <label>Price per edition ($)<input name="editionPrice" type="number" min="0" step="0.01" value="${escapeHtml(r.editionPrice || '')}" placeholder="88" /></label>
          </div>
          <div class="music-rights-ledger__economics" id="rights-economics"></div>
        </div>

        <label class="music-rights-ledger__notes">Private rights notes<textarea name="notes" placeholder="Outstanding questions, recoupment terms, sample notes, collaborator follow-up…">${escapeHtml(r.notes || '')}</textarea></label>
        <div class="music-rights-ledger__actions">
          <button type="submit">Save rights record</button>
          <span id="rights-save-status" aria-live="polite">${item.rights_updated_at ? `Last saved ${escapeHtml(new Date(item.rights_updated_at).toLocaleString())}` : 'Not saved yet'}</span>
        </div>
      </form>`;

    const form = editor.querySelector('#rights-form');
    const economics = editor.querySelector('#rights-economics');

    function updateEconomics() {
      const size = Number(form.elements.editionSize.value || 0);
      const price = Number(form.elements.editionPrice.value || 0);
      const tk = Number(form.elements.directTkPct.value || 0);
      if (!(size > 0) || !(price >= 0)) {
        economics.innerHTML = '<span>Add an edition size and price to model the direct-sale gross.</span>';
        return;
      }
      const gross = size * price;
      const validSplit = tk >= 0 && tk <= 100 && form.elements.directTkPct.value !== '';
      economics.innerHTML = `<div><span>Gross</span><strong>$${gross.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</strong></div>` +
        (validSplit ? `<div><span>TK @ ${tk}%</span><strong>$${(gross * tk / 100).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</strong></div><div><span>Collaborators @ ${100 - tk}%</span><strong>$${(gross * (100 - tk) / 100).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</strong></div>` : '') +
        '<small>Planning estimate before processor fees, taxes, recoupment, expenses, or other contractual deductions.</small>';
    }

    ['editionSize','editionPrice','directTkPct'].forEach(name => form.elements[name].addEventListener('input', updateEconomics));
    updateEconomics();

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const saveStatus = form.querySelector('#rights-save-status');
      const submit = form.querySelector('button[type="submit"]');
      const rawTk = form.elements.directTkPct.value;
      const rightsLedger = {
        compositionSplit: form.elements.compositionSplit.value.trim(),
        masterSplit: form.elements.masterSplit.value.trim(),
        directTkPct: rawTk === '' ? null : Number(rawTk),
        commercialClearance: form.elements.commercialClearance.value,
        agreementStatus: form.elements.agreementStatus.value,
        agreementReference: form.elements.agreementReference.value.trim(),
        proRegistration: form.elements.proRegistration.value,
        soundexchangeRegistration: form.elements.soundexchangeRegistration.value,
        copyrightRegistration: form.elements.copyrightRegistration.value,
        editionSize: form.elements.editionSize.value === '' ? null : Number(form.elements.editionSize.value),
        editionPrice: form.elements.editionPrice.value === '' ? null : Number(form.elements.editionPrice.value),
        notes: form.elements.notes.value.trim(),
      };

      if (rightsLedger.directTkPct !== null && (rightsLedger.directTkPct < 0 || rightsLedger.directTkPct > 100)) {
        saveStatus.textContent = 'TK direct-sale share must be between 0 and 100.';
        return;
      }

      submit.disabled = true;
      saveStatus.textContent = 'Saving…';
      try {
        const res = await fetch('/api/workspace-upload', {
          method:'PATCH', credentials:'same-origin', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({ id:Number(item.id), rightsLedger })
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
        const updated = body.upload;
        const idx = uploads.findIndex(candidate => Number(candidate.id) === Number(updated.id));
        if (idx >= 0) uploads[idx] = updated;
        renderEditor(updated);
      } catch (error) {
        saveStatus.textContent = error?.message || 'Could not save rights record.';
        submit.disabled = false;
      }
    });
  }

  list.addEventListener('click', event => {
    const button = event.target.closest('[data-rights-track]');
    if (!button) return;
    const item = uploads.find(candidate => Number(candidate.id) === Number(button.dataset.rightsTrack));
    if (item) renderEditor(item);
  });

  async function load() {
    try {
      const res = await fetch('/api/workspace-upload', { credentials:'same-origin', cache:'no-store' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
      uploads = body.uploads || [];
      renderTracks();
      if (uploads.length) renderEditor(uploads[0]);
    } catch (error) {
      list.innerHTML = `<p class="music-rights-ledger__empty">${escapeHtml(error.message)}</p>`;
      count.textContent = 'Unavailable';
    }
  }

  load();
})();
