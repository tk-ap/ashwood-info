(() => {
  'use strict';

  const root = document.querySelector('#ashwood-drop-music');
  if (!root) return;

  const list = root.querySelector('[data-ashwood-drop-list]');
  const state = root.querySelector('[data-ashwood-drop-state]');

  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));

  const safeUrl = value => {
    try {
      const url = new URL(String(value || ''), window.location.origin);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch { return ''; }
  };

  const normalizeTitle = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

  function trackPlayer(track) {
    const fileUrl = safeUrl(track.url);
    if (!fileUrl) return '';
    const sourceUrl = safeUrl(track.source_url);
    const rights = String(track.rights_note || '').trim();
    return `
      <div class="listen-track__actions">
        <audio class="listen-track__special-audio" controls controlsList="nodownload noplaybackrate" preload="metadata" oncontextmenu="return false" aria-label="${escapeHtml(track.title || 'Track')} by ${escapeHtml(track.artist || 't.kap')}">
          <source src="${escapeHtml(fileUrl)}"${track.content_type ? ` type="${escapeHtml(track.content_type)}"` : ''} />
          Your browser does not support native audio playback.
        </audio>
        ${rights ? `<p class="listen-track__special-rights">${escapeHtml(rights)}</p>` : ''}
        ${sourceUrl ? `<a class="listen-track__special-source" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">Original beat / license context on YouTube ↗</a>` : ''}
      </div>`;
  }

  function canonicalSlotMarkup(track, index) {
    const producer = String(track.producer_credit || '').trim();
    const title = String(track.title || 'Untitled').trim();
    return `
      <div class="listen-track__identity">
        <span class="listen-track__index">${String(index).padStart(2, '0')}</span>
        <div class="listen-track__special-copy">
          <strong>${escapeHtml(title)} (NON-COMMERCIAL/DEMO) - ${escapeHtml(track.artist || 't.kap')}${producer ? ` (${escapeHtml(producer)})` : ''}</strong>
          <span class="listen-track__special-label">Non-commercial / demo · stream only</span>
        </div>
      </div>
      ${trackPlayer(track)}`;
  }

  function placeCanonicalTracks(tracks) {
    const remaining = [];
    const bodyTwo = document.querySelector('#body-two .listen-queue');
    if (!bodyTwo) return tracks;
    const slots = [...bodyTwo.querySelectorAll('.listen-track')];

    tracks.forEach(track => {
      const key = normalizeTitle(track.title);
      let slot = null;
      let index = 0;
      if (key === 'special') { slot = slots[1]; index = 2; }
      if (key === 'withyou') { slot = slots[2]; index = 3; }

      if (!slot) {
        remaining.push(track);
        return;
      }

      slot.classList.add('listen-track--special', 'listen-track--blob');
      slot.innerHTML = canonicalSlotMarkup(track, index);
    });

    return remaining;
  }

  function renderTrack(track, index) {
    const fileUrl = safeUrl(track.url);
    if (!fileUrl) return '';
    const sourceUrl = safeUrl(track.source_url);
    const artistLine = [track.artist || 't.kap', track.producer_credit].filter(Boolean).join(' · ');
    const rights = String(track.rights_note || '').trim();

    return `
      <article class="drop-music-track">
        <div class="drop-music-track__identity">
          <span class="drop-music-track__index">${String(index + 1).padStart(2, '0')}</span>
          <div>
            <strong>${escapeHtml(track.title || 'Untitled')}</strong>
            <small>${escapeHtml(artistLine)}</small>
          </div>
        </div>
        <div class="drop-music-track__player">
          <audio controls controlsList="nodownload noplaybackrate" preload="metadata" oncontextmenu="return false" aria-label="${escapeHtml(track.title || 'Track')} by ${escapeHtml(track.artist || 't.kap')}">
            <source src="${escapeHtml(fileUrl)}"${track.content_type ? ` type="${escapeHtml(track.content_type)}"` : ''} />
            Your browser does not support native audio playback.
          </audio>
          ${rights ? `<p class="drop-music-track__rights">${escapeHtml(rights)}</p>` : ''}
          ${sourceUrl ? `<a class="drop-music-track__source" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">Source / license context ↗</a>` : ''}
        </div>
      </article>`;
  }

  async function load() {
    try {
      const res = await fetch('/api/music-library', { cache:'no-store' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
      const tracks = Array.isArray(body.tracks) ? body.tracks : [];

      if (!tracks.length) {
        root.hidden = true;
        return;
      }

      const remaining = placeCanonicalTracks(tracks);
      if (!remaining.length) {
        root.hidden = true;
        return;
      }

      root.hidden = false;
      state.textContent = `${remaining.length} ${remaining.length === 1 ? 'track' : 'tracks'} published from ASHWOOD Workspace`;
      list.innerHTML = remaining.map(renderTrack).join('');
    } catch (error) {
      root.hidden = false;
      state.textContent = 'Live ASHWOOD library unavailable';
      list.innerHTML = `<p class="drop-music-empty">${escapeHtml(error.message || 'Could not load tracks.')}</p>`;
    }
  }

  load();
})();
