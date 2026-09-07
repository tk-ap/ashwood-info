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

      root.hidden = false;
      state.textContent = `${tracks.length} ${tracks.length === 1 ? 'track' : 'tracks'} published from ASHWOOD Workspace`;
      list.innerHTML = tracks.map(renderTrack).join('');
    } catch (error) {
      root.hidden = false;
      state.textContent = 'Live ASHWOOD library unavailable';
      list.innerHTML = `<p class="drop-music-empty">${escapeHtml(error.message || 'Could not load tracks.')}</p>`;
    }
  }

  load();
})();
