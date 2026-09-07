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

  function setFiles(files) {
    chosen = [...files].filter(file => file.type.startsWith('audio/') || /\.(mp3|m4a|aac|wav|flac)$/i.test(file.name));
    queue.innerHTML = chosen.length
      ? chosen.map(file => `<li><strong>${escapeHtml(file.name)}</strong><span>${humanBytes(file.size)}</span></li>`).join('')
      : '<li class="is-empty">Drop MP3, M4A, AAC, WAV, or FLAC files here.</li>';
    zone.classList.toggle('has-files', Boolean(chosen.length));
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
            <span>${item.publish_to_music ? 'Music page: on' : 'Music page: staged'}</span>
            <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">File ↗</a>
          </div>
        </article>`).join('') : '<p class="ashwood-drop-empty">Nothing uploaded yet.</p>';
    } catch (error) {
      library.innerHTML = `<p class="ashwood-drop-empty">${escapeHtml(error.message)}</p>`;
    }
  }

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
        status.textContent = `Uploading ${index + 1} of ${chosen.length}: ${file.name}`;

        await upload(pathname, file, {
          access: 'public',
          handleUploadUrl: '/api/workspace-upload',
          multipart: file.size > 8 * 1024 * 1024,
          contentType: file.type || undefined,
          clientPayload: JSON.stringify({ title, artist, producerCredit, rightsNote, sourceUrl, publishToMusic }),
          onUploadProgress: progress => {
            const pct = Math.round(Number(progress.percentage || 0));
            status.textContent = `Uploading ${index + 1} of ${chosen.length}: ${pct}%`;
          },
        });
      }

      status.textContent = publishToMusic
        ? 'Uploaded. ASHWOOD now has the source file and it is marked for the music page.'
        : 'Uploaded. The file is safely staged in ASHWOOD and not marked public on the music page.';
      form.reset();
      setFiles([]);
      window.setTimeout(loadLibrary, 900);
    } catch (error) {
      status.textContent = error?.message || 'Upload failed.';
    } finally {
      submit.disabled = false;
    }
  });

  loadLibrary();
})();
