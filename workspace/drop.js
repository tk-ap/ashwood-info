(() => {
  'use strict';

  const root = document.querySelector('#ashwood-drop');
  if (!root) return;

  const form = root.querySelector('#ashwood-drop-form');
  const input = root.querySelector('#ashwood-drop-files');
  const zone = root.querySelector('.ashwood-drop-zone');
  const queue = root.querySelector('#ashwood-drop-queue');
  const status = root.querySelector('#ashwood-drop-status');
  const library = root.querySelector('#ashwood-drop-library');
  const submit = root.querySelector('button[type="submit"]');

  let chosen = [];
  let reviewTrackId = null;
  const UPLOAD_STALL_TIMEOUT_MS = 25000;
  /* A serverless function body is capped around 4.5MB, so only files comfortably under
     that can be posted through our own API. Anything larger has to go browser-to-Blob. */
  const DIRECT_UPLOAD_MAX = 4 * 1024 * 1024;

  const TRACK_PRESETS = {
    withyou: {
      title: 'WITH YOU',
      artist: 't.kap',
      producerCredit: 'prod. sumeetsznn',
      rightsNote: "Non-commercial / demo · stream only. Beat used under the producer's stated free-for-non-profit terms; credit is required for any use; otherwise a license is required.",
      sourceUrl: 'https://youtu.be/thcfrbTLzpw?is=AxuW_FnxLpfHDZam',
      publishToMusic: true,
    },
  };

  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));

  const humanBytes = bytes => {
    const n = Number(bytes || 0);
    if (!n) return '—';
    const units = ['B','KB','MB','GB'];
    let i = 0, value = n;
    while (value >= 1024 && i < units.length - 1) { value /= 1024; i += 1; }
    return `${value >= 10 || i === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[i]}`;
  };

  const slugify = value => String(value || 'track')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'track';

  const presetKeyForFile = file => String(file?.name || '')
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

  function mountMusicIntelligence() {
    if (root.querySelector('#music-intelligence')) return;
    const section = document.createElement('section');
    section.id = 'music-intelligence';
    section.className = 'music-intelligence';
    section.innerHTML = `
      <div class="music-intelligence__head">
        <div>
          <p class="section-kicker">Creative intelligence</p>
          <h3>Music intelligence</h3>
        </div>
        <p>Context for decisions, not a hit score. Your original stays untouched.</p>
      </div>

      <div class="music-intelligence__principles">
        <span>Song DNA</span><span>Creative Mode</span><span>Review Mode</span><span>Market Context</span><span>Catalog Intelligence</span><span>Release Direction</span>
      </div>

      <div class="music-intelligence__grid">
        <article class="music-intelligence__panel" id="music-review-panel">
          <div class="music-intelligence__panel-head">
            <div><p class="section-kicker">Track review</p><h4>Choose a song from your library</h4></div>
            <span class="music-intelligence__mode">Creative Mode</span>
          </div>
          <p class="music-intelligence__copy">Creative Mode keeps optimization advice out of the writing process. When you intentionally review a track, ASHWOOD can surface Song DNA, relevant market context, uncertainties, and small experiments without rewriting the song for you.</p>
          <div class="music-intelligence__judgments" aria-label="Independent track judgments">
            <div><span>Artistic strength</span><strong>Not assessed</strong></div>
            <div><span>Market alignment</span><strong>Not assessed</strong></div>
            <div><span>Release readiness</span><strong>Not assessed</strong></div>
          </div>
          <p class="music-intelligence__state">No fabricated analysis: the audio-analysis engine is not connected yet.</p>
        </article>

        <article class="music-intelligence__panel">
          <div class="music-intelligence__panel-head">
            <div><p class="section-kicker">Across your library</p><h4>Catalog intelligence</h4></div>
          </div>
          <p class="music-intelligence__copy">Once analysis is connected, this layer will help identify what to finish, release, test, revisit, or leave alone. Rankings must show the evidence behind them and may never be based on chart similarity alone.</p>
          <ul class="music-intelligence__catalog">
            <li><span>Most release-ready</span><strong>Awaiting analysis</strong></li>
            <li><span>Strongest identity</span><strong>Awaiting analysis</strong></li>
            <li><span>Strongest hook</span><strong>Awaiting analysis</strong></li>
            <li><span>Most commercially unusual</span><strong>Awaiting analysis</strong></li>
            <li><span>Biggest upside from a small experiment</span><strong>Awaiting analysis</strong></li>
          </ul>
        </article>
      </div>
      <p class="music-intelligence__foot">Market comparisons should use relevant cohorts and permitted chart/catalog data. Protected streaming audio is not assumed available for ingestion or AI analysis.</p>`;
    root.append(section);
    if (window.location.hash === '#music-intelligence') {
      requestAnimationFrame(() => section.scrollIntoView());
    }
  }

  function showReviewShell(item) {
    reviewTrackId = Number(item.id);
    const panel = root.querySelector('#music-review-panel');
    if (!panel) return;
    panel.innerHTML = `
      <div class="music-intelligence__panel-head">
        <div><p class="section-kicker">Track review</p><h4>${escapeHtml(item.title)}</h4><small>${escapeHtml(item.artist || 't.kap')}</small></div>
        <span class="music-intelligence__mode is-review">Review Mode</span>
      </div>
      <p class="music-intelligence__copy">Review Mode is intentional: analyze what is here, protect the strongest creative choices, compare only with a relevant market cohort, and recommend experiments rather than commands.</p>
      <div class="music-intelligence__judgments" aria-label="Independent track judgments">
        <div><span>Artistic strength</span><strong>Pending engine</strong></div>
        <div><span>Market alignment</span><strong>Pending engine</strong></div>
        <div><span>Release readiness</span><strong>Pending engine</strong></div>
      </div>
      <div class="music-intelligence__review-sections">
        <div><strong>Song DNA</strong><span>Tempo, key, sections, energy, dynamics, density, vocals and other owned-audio signals.</span></div>
        <div><strong>Strengths to protect</strong><span>What should not be optimized away.</span></div>
        <div><strong>Market context</strong><span>Relevant cohort, not a blind average of the overall Top 10.</span></div>
        <div><strong>Experiments</strong><span>2–4 smallest useful alternate decisions while preserving the original.</span></div>
        <div><strong>Release direction</strong><span>Including “Release as-is” when changing the song would make it worse.</span></div>
      </div>
      <p class="music-intelligence__state">Analysis requested for this track, but the analysis backend is not connected yet. No score or recommendation has been invented.</p>`;
    panel.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  }

  function applyPresetIfKnown() {
    if (chosen.length !== 1) return;
    const preset = TRACK_PRESETS[presetKeyForFile(chosen[0])];
    if (!preset) return;
    form.elements.title.value = preset.title;
    form.elements.artist.value = preset.artist;
    form.elements.producerCredit.value = preset.producerCredit;
    form.elements.rightsNote.value = preset.rightsNote;
    form.elements.sourceUrl.value = preset.sourceUrl;
    form.elements.publishToMusic.checked = Boolean(preset.publishToMusic);
    status.textContent = `${preset.title} recognized. Producer, usage terms, source link, and Music-page mapping are prefilled.`;
  }

  function setFiles(files) {
    chosen = [...files].filter(file => file.type.startsWith('audio/') || /\.(mp3|m4a|aac|wav|flac)$/i.test(file.name));
    queue.innerHTML = chosen.length
      ? chosen.map(file => `<li><strong>${escapeHtml(file.name)}</strong><span>${humanBytes(file.size)}</span></li>`).join('')
      : '<li class="is-empty">Drop MP3, M4A, AAC, WAV, or FLAC files here.</li>';
    zone.classList.toggle('has-files', Boolean(chosen.length));
    applyPresetIfKnown();
  }

  async function setPublished(id, publishToMusic, button) {
    button.disabled = true;
    const original = button.textContent;
    button.textContent = publishToMusic ? 'Publishing…' : 'Removing…';
    try {
      const res = await fetch('/api/workspace-upload', {
        method:'PATCH',
        credentials:'same-origin',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ id, publishToMusic }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
      status.textContent = publishToMusic
        ? 'Published. The Music page now reads this track from ASHWOOD automatically.'
        : 'Removed from the Music page. The file remains in your private ASHWOOD library.';
      await loadLibrary();
    } catch (error) {
      status.textContent = error?.message || 'Could not update Music page state.';
      button.disabled = false;
      button.textContent = original;
    }
  }

  async function loadLibrary() {
    try {
      const res = await fetch('/api/workspace-upload', { credentials:'same-origin', cache:'no-store' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
      const uploads = body.uploads || [];
      library.innerHTML = uploads.length ? uploads.map(item => `
        <article class="ashwood-drop-item">
          <div>
            <strong>${escapeHtml(item.title)}</strong>
            <small>${escapeHtml(item.artist || 't.kap')}${item.producer_credit ? ` · ${escapeHtml(item.producer_credit)}` : ''}</small>
          </div>
          <div class="ashwood-drop-item__meta">
            <span>${humanBytes(item.size_bytes)}</span>
            <span>${item.publish_to_music ? 'Music page: live' : 'Music page: staged'}</span>
            <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">File ↗</a>
          </div>
          <div class="ashwood-drop-item__actions">
            <button class="ashwood-drop-item__review" type="button" data-review-id="${Number(item.id)}">Review track</button>
            <button class="ashwood-drop-item__publish ${item.publish_to_music ? 'is-live' : ''}" type="button" data-upload-id="${Number(item.id)}" data-publish-next="${item.publish_to_music ? 'false' : 'true'}">${item.publish_to_music ? 'Remove from Music page' : 'Publish to Music page'}</button>
          </div>
        </article>`).join('') : '<p class="ashwood-drop-empty">Nothing uploaded yet.</p>';
      library.dataset.uploads = JSON.stringify(uploads.map(item => ({
        id:item.id,title:item.title,artist:item.artist,producer_credit:item.producer_credit,size_bytes:item.size_bytes,url:item.url,publish_to_music:item.publish_to_music
      })));
      if (reviewTrackId && !uploads.some(item => Number(item.id) === reviewTrackId)) reviewTrackId = null;
    } catch (error) {
      library.innerHTML = `<p class="ashwood-drop-empty">${escapeHtml(error.message)}</p>`;
    }
  }

  /* Post the bytes to our own API, which writes them to Blob server-side. This avoids
     the browser's direct transfer to Blob storage entirely. Returns false rather than
     throwing when it cannot be used, so the caller falls back to the standard path. */
  async function uploadDirect(pathname, file, meta, label) {
    status.textContent = `${label}: uploading…`;
    const params = new URLSearchParams({
      pathname,
      contentType: file.type || '',
      title: meta.title,
      artist: meta.artist,
      producerCredit: meta.producerCredit,
      rightsNote: meta.rightsNote,
      sourceUrl: meta.sourceUrl,
      publishToMusic: String(meta.publishToMusic),
    });
    try {
      const res = await fetch(`/api/workspace-upload-direct?${params}`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: file,
      });
      if (res.ok) return true;
      // 413 means the file is over the function body cap after all; anything else is a
      // real failure of this route. Either way the standard uploader is worth a try.
      return false;
    } catch (_) {
      return false;
    }
  }

  async function uploadWithStallRecovery(upload, pathname, file, baseOptions, label) {
    const runAttempt = async (multipart, retrying = false) => {
      const controller = new AbortController();
      let stallTimer = null;
      let hasTransferredBytes = false;

      const armStallTimer = () => {
        window.clearTimeout(stallTimer);
        stallTimer = window.setTimeout(() => controller.abort(), UPLOAD_STALL_TIMEOUT_MS);
      };

      armStallTimer();
      try {
        return await upload(pathname, file, {
          ...baseOptions,
          multipart,
          abortSignal: controller.signal,
          onUploadProgress: progress => {
            armStallTimer();
            const loaded = Number(progress.loaded || 0);
            const pct = Math.round(Number(progress.percentage || 0));
            if (loaded > 0 || pct > 0) hasTransferredBytes = true;
            status.textContent = hasTransferredBytes
              ? `${label}: ${pct}%`
              : retrying
                ? `${label}: reconnecting to storage…`
                : `${label}: connecting to storage…`;
          },
        });
      } finally {
        window.clearTimeout(stallTimer);
      }
    };

    try {
      return await runAttempt(Boolean(baseOptions.multipart));
    } catch (error) {
      const aborted = error?.name === 'AbortError' || /abort|stalled/i.test(String(error?.message || ''));
      if (!aborted || baseOptions.multipart) throw error;
      status.textContent = `${label}: connection stalled. Retrying with resilient upload…`;
      return runAttempt(true, true);
    }
  }

  library.addEventListener('click', event => {
    const reviewButton = event.target.closest('[data-review-id]');
    if (reviewButton) {
      const uploads = JSON.parse(library.dataset.uploads || '[]');
      const item = uploads.find(candidate => Number(candidate.id) === Number(reviewButton.dataset.reviewId));
      if (item) showReviewShell(item);
      return;
    }

    const button = event.target.closest('[data-upload-id]');
    if (!button) return;
    const id = Number(button.dataset.uploadId);
    const publishToMusic = button.dataset.publishNext === 'true';
    if (Number.isFinite(id)) setPublished(id, publishToMusic, button);
  });

  zone.addEventListener('click', () => input.click());
  zone.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); input.click(); }
  });
  input.addEventListener('change', () => setFiles(input.files || []));
  ['dragenter','dragover'].forEach(type => zone.addEventListener(type, event => {
    event.preventDefault(); zone.classList.add('is-dragging');
  }));
  ['dragleave','drop'].forEach(type => zone.addEventListener(type, event => {
    event.preventDefault(); zone.classList.remove('is-dragging');
  }));
  zone.addEventListener('drop', event => setFiles(event.dataTransfer?.files || []));

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!chosen.length) { status.textContent = 'Choose at least one audio file.'; return; }

    const titleBase = form.elements.title.value.trim();
    if (!titleBase) { status.textContent = 'Add a track title first.'; return; }

    submit.disabled = true;
    status.textContent = 'Preparing secure upload…';

    try {
      const { upload } = await import('https://esm.sh/@vercel/blob@2.8.0/client?bundle');
      const publishToMusic = Boolean(form.elements.publishToMusic.checked);
      const artist = form.elements.artist.value.trim() || 't.kap';
      const producerCredit = form.elements.producerCredit.value.trim();
      const rightsNote = form.elements.rightsNote.value.trim();
      const sourceUrl = form.elements.sourceUrl.value.trim();

      for (let index = 0; index < chosen.length; index += 1) {
        const file = chosen[index];
        const title = chosen.length === 1 ? titleBase : `${titleBase} ${index + 1}`;
        const ext = (file.name.match(/\.[a-z0-9]+$/i)?.[0] || '').toLowerCase();
        const pathname = `ashwood/music/${slugify(title)}${ext}`;
        const label = `Uploading ${index + 1} of ${chosen.length}`;
        status.textContent = `${label}: preparing…`;

        const meta = { title, artist, producerCredit, rightsNote, sourceUrl, publishToMusic };
        const direct = file.size <= DIRECT_UPLOAD_MAX && await uploadDirect(pathname, file, meta, label);
        if (!direct) {
          await uploadWithStallRecovery(upload, pathname, file, {
            access: 'public',
            handleUploadUrl: '/api/workspace-upload',
            multipart: file.size > 8 * 1024 * 1024,
            contentType: file.type || undefined,
            clientPayload: JSON.stringify(meta),
          }, label);
        }
      }

      status.textContent = publishToMusic
        ? 'Uploaded and published. The Music page now reads it automatically.'
        : 'Uploaded. The file is safely staged in ASHWOOD and stays off the Music page.';
      form.reset();
      setFiles([]);
      window.setTimeout(loadLibrary, 900);
    } catch (error) {
      const message = error?.message || 'Upload failed.';
      status.textContent = /abort/i.test(message)
        ? 'Upload stalled twice and was stopped. Your metadata is still here; retry when the connection is stable.'
        : message;
    } finally {
      submit.disabled = false;
    }
  });

  mountMusicIntelligence();
  loadLibrary();
})();

import('/workspace/rights-ledger.js?v=20260908-review-target1').catch(() => {});
