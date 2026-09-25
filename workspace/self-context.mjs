const esc = (value = '') => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

function list(items) {
  return `<ul>${items.map(item => `<li>${esc(item)}</li>`).join('')}</ul>`;
}

function meta(context) {
  return `<p class="self-context-meta">ALVIRA Context · ${esc(context.sourceVersion)} · source updated ${esc(context.sourceUpdatedAt)} · status Captured · confidence not supplied by ALVIRA</p>`;
}

function renderSource(context) {
  const raw = context.rawAreas || [];
  const source = document.querySelector('#self-context-source');
  if (source) source.innerHTML = `${meta(context)}<details><summary>Recovered ALVIRA fields</summary><div class="self-source-grid">${raw.map(item => `<article><small>${esc(item.label)} · ${esc(item.status)} · confidence ${esc(item.confidence ?? 'not supplied')}</small><p>${esc(item.text)}</p></article>`).join('')}</div><p class="self-context-unavailable">Not recovered from this interview: ${esc((context.unavailableAreas || []).join(', ') || 'none')}.</p></details>`;
  const normalized = context.normalized || {};
  document.querySelector('#self-compass .self-context-body').innerHTML = `${meta(context)}${list(normalized.operatingModel || [])}<p class="self-context-use"><strong>Agent default:</strong> optimize for clear, bounded, evidence-backed progress with visible ownership and a next gate.</p>`;
  document.querySelector('#self-current-context .self-context-body').innerHTML = `${meta(context)}${list(normalized.currentContext || [])}<p class="self-context-time-sensitive">Time-sensitive: confirm against the latest ALVIRA update, career state, and workspace evidence before relying on these conditions.</p>`;
  document.querySelector('#self-patterns .self-context-body').innerHTML = `${meta(context)}${list(normalized.patterns || [])}`;
  document.querySelector('#self-tensions .self-context-body').innerHTML = `${meta(context)}${list(normalized.tensions || [])}`;
  document.querySelector('#self-system-adaptations .self-context-body').innerHTML = `${meta(context)}<div class="self-adaptation-list">${(normalized.systemAdaptations || []).map(item => `<article><strong>${esc(item.context)}</strong><span>→ ${esc(item.implication)}</span><p>${esc(item.behavior)}</p></article>`).join('')}</div>`;
  const review = document.querySelector('#self-corrections .self-context-body');
  if (review) review.innerHTML = `${meta(context)}<p>Confirm, correct, or reject a specific item when ALVIRA changes, evidence contradicts it, or a condition expires. Corrections are recorded against this same normalized projection; routine manual upkeep is not required.</p><form id="self-correction-form"><label for="self-correction-input">Correction<textarea id="self-correction-input" rows="3" placeholder="What is no longer accurate, and what should replace it?"></textarea></label><button type="submit">Submit correction</button><span id="self-correction-status" role="status"></span></form>`;
  document.querySelector('#self-correction-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const input = document.querySelector('#self-correction-input');
    const status = document.querySelector('#self-correction-status');
    if (!input.value.trim()) return;
    status.textContent = 'Saving…';
    const response = await fetch('/api/workspace-self-context', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({context,correction:{text:input.value.trim(),status:'owner_submitted',createdAt:new Date().toISOString()}})});
    status.textContent = response.ok ? 'Correction recorded against the shared context projection.' : 'Could not record correction.';
    if (response.ok) input.value = '';
  });
  document.querySelector('#self-context-import-button')?.addEventListener('click', async () => {
    const input = document.querySelector('#self-context-import-file');
    const status = document.querySelector('#self-context-import-status');
    const file = input?.files?.[0];
    if (!file) { status.textContent = 'Choose the recovered normalized ALVIRA JSON first.'; return; }
    status.textContent = 'Importing…';
    try {
      const imported = JSON.parse(await file.text());
      const response = await fetch('/api/workspace-self-context', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({context:imported})});
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Import failed');
      status.textContent = 'Imported into the shared private context projection.';
      renderSource(imported);
    } catch (error) { status.textContent = error.message || 'Import failed'; }
  });
  document.querySelector('#self-context-loading')?.remove();
}

async function load() {
  const response = await fetch('/api/workspace-self-context', {credentials:'same-origin',cache:'no-store'});
  if (!response.ok) throw new Error('Saved ALVIRA context is unavailable');
  const payload = await response.json();
  renderSource(payload.context);
}

load().catch(error => {
  const host = document.querySelector('#self-context-loading');
  if (host) host.textContent = error.message;
});
