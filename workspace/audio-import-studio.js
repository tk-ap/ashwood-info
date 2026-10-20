(() => {
  'use strict';
  const root = document.querySelector('#ashwood-drop');
  const grid = root && root.querySelector('.ashwood-drop__grid');
  if (!root || !grid || root.querySelector('#audio-import-studio')) return;
  const MAX_BYTES = 40 * 1024 * 1024;
  const MAX_SECONDS = 360;
  const panel = document.createElement('section');
  panel.className = 'audio-import-studio';
  panel.id = 'audio-import-studio';
  panel.setAttribute('aria-labelledby', 'audio-import-title');
  panel.innerHTML = [
    '<div class="audio-import-studio__intro"><div>',
    '<p class="section-kicker">Music / Source tools</p>',
    '<h3 id="audio-import-title">Audio import studio</h3></div>',
    '<p>Convert recordings you own or have permission to process into MP3, on your device. Nothing is published automatically.</p></div>',
    '<div class="audio-import-studio__body"><div class="audio-import-studio__source">',
    '<label for="audio-import-file">Choose an audio file</label>',
    '<input id="audio-import-file" type="file" accept="audio/*,.wav,.flac,.m4a,.aac,.mp3" />',
    '<span class="audio-import-studio__or">Or paste a direct audio file URL</span>',
    '<label for="audio-import-url">Direct HTTPS audio URL</label>',
    '<input id="audio-import-url" type="url" inputmode="url" placeholder="https://example.org/recording.wav" />',
    '<p class="audio-import-studio__help">YouTube/streaming pages are references, not downloadable audio files. Direct links must allow browser access (CORS). Limit: 40 MB / 6 minutes.</p>',
    '<label class="audio-import-studio__rights"><input id="audio-import-rights" type="checkbox" /> I have permission to process and keep this recording.</label>',
    '<button id="audio-import-convert" type="button">Prepare MP3</button>',
    '<p id="audio-import-status" role="status" aria-live="polite">Ready for a source.</p></div>',
    '<div class="audio-import-studio__result" id="audio-import-result" hidden>',
    '<p class="section-kicker">Prepared audio</p>',
    '<strong id="audio-import-filename"></strong>',
    '<audio id="audio-import-preview" controls preload="metadata" aria-label="Converted MP3 preview"></audio>',
    '<div class="audio-import-studio__actions"><a id="audio-import-download" download>Download MP3</a>',
    '<button id="audio-import-stage" type="button">Use in ASHWOOD library</button></div>',
    '<p>The original is never overwritten. Retain or upload your original master separately. “Use in library” only fills the existing upload form; public release remains off by default.</p>',
    '</div></div>'
  ].join('');
  grid.before(panel);
  const find = selector => panel.querySelector(selector);
  const fileInput = find('#audio-import-file');
  const urlInput = find('#audio-import-url');
  const confirmRights = find('#audio-import-rights');
  const convert = find('#audio-import-convert');
  const status = find('#audio-import-status');
  const result = find('#audio-import-result');
  const preview = find('#audio-import-preview');
  const download = find('#audio-import-download');
  let prepared = null, sourceUrl = '', objectUrl = null, busy = false;

  const setStatus = message => { status.textContent = message; };
  const stem = value => String(value || 'recording').replace(/\.[^.]+$/, '').replace(/[^a-z0-9 _-]/gi, '').trim().slice(0, 70) || 'recording';
  const yieldFrame = () => new Promise(resolve => setTimeout(resolve, 0));
  function reset() {
    prepared = null;
    result.hidden = true;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = null;
    preview.removeAttribute('src');
    preview.load();
  }

  async function getAudioUrl(rawUrl) {
    const url = new URL(rawUrl);
    if (url.protocol !== 'https:') throw new Error('Use a direct HTTPS audio URL.');
    if (/(^|\.)youtube\.com$|(^|\.)youtu\.be$|(^|\.)youtube-nocookie\.com$/i.test(url.hostname)) {
      throw new Error('YouTube pages cannot be converted here. Use YouTube Studio to download your own upload, then select the resulting file.');
    }
    const response = await fetch(url.href, { credentials: 'omit', mode: 'cors', redirect: 'follow', cache: 'no-store' });
    if (!response.ok) throw new Error('Audio link failed with HTTP ' + response.status + '.');
    const type = (response.headers.get('content-type') || '').toLowerCase().split(';')[0];
    if (!type.startsWith('audio/')) throw new Error('The link must return an audio file, not a webpage or playlist.');
    const sizeHint = Number(response.headers.get('content-length') || 0);
    if (sizeHint > MAX_BYTES) throw new Error('Linked recording exceeds 40 MB.');
    if (!response.body) throw new Error('This browser cannot stream linked audio.');
    const reader = response.body.getReader(), chunks = [];
    let size = 0;
    try {
      while (true) {
        const piece = await reader.read();
        if (piece.done) break;
        size += piece.value.byteLength;
        if (size > MAX_BYTES) throw new Error('Linked recording exceeds 40 MB.');
        chunks.push(piece.value);
      }
    } catch (error) {
      await reader.cancel().catch(() => {});
      throw error;
    }
    if (!size) throw new Error('Audio file was empty.');
    const ext = type.includes('mpeg') ? '.mp3' : type.includes('wav') ? '.wav' : type.includes('flac') ? '.flac' : type.includes('mp4') ? '.m4a' : '.audio';
    let name = 'linked-recording';
    try { name = stem(decodeURIComponent(url.pathname.split('/').pop() || name)); } catch (_) {}
    return new File(chunks, name + ext, { type });
  }

  async function loadEncoder() {
    if (window.lamejs && window.lamejs.Mp3Encoder) return;
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/workspace/vendor/lame.min.js';
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Bundled MP3 encoder failed to load.'));
      document.head.append(script);
    });
    if (!window.lamejs || !window.lamejs.Mp3Encoder) throw new Error('MP3 encoder unavailable.');
  }

  function pcmChunk(samples, from, to) {
    const out = new Int16Array(to - from);
    for (let j = 0; j < out.length; j++) {
      const n = Math.max(-1, Math.min(1, samples[from + j]));
      out[j] = Math.round(n * (n < 0 ? 32768 : 32767));
    }
    return out;
  }

  async function makeMp3(file) {
    if (file.size > MAX_BYTES) throw new Error('Choose a file smaller than 40 MB.');
    if (/\.mp3$/i.test(file.name) && (/audio\/(mpeg|mp3)/i.test(file.type) || !file.type)) {
      return new File([file], stem(file.name) + '.mp3', { type: 'audio/mpeg' });
    }
    await loadEncoder();
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) throw new Error('Web Audio is unsupported in this browser.');
    let context;
    try {
      context = new Context({ sampleRate: 44100 });
      setStatus('Decoding source on this device…');
      let audio;
      try { audio = await context.decodeAudioData(await file.arrayBuffer()); }
      catch (_) { throw new Error('Browser cannot decode this file. Try WAV or a supported M4A.'); }
      if (!Number.isFinite(audio.duration) || audio.duration <= 0 || audio.duration > MAX_SECONDS) {
        throw new Error('Audio duration must be 6 minutes or less.');
      }
      const channels = Math.min(audio.numberOfChannels, 2);
      if (!channels) throw new Error('No audio channels detected.');
      const encoder = new window.lamejs.Mp3Encoder(channels, audio.sampleRate, 160);
      const left = audio.getChannelData(0), right = channels > 1 ? audio.getChannelData(1) : null;
      const parts = [];
      for (let pos = 0; pos < audio.length; pos += 1152) {
        const end = Math.min(pos + 1152, audio.length);
        const first = pcmChunk(left, pos, end);
        const bytes = channels === 2 ? encoder.encodeBuffer(first, pcmChunk(right, pos, end)) : encoder.encodeBuffer(first);
        if (bytes.length) parts.push(bytes);
        if (pos % (1152 * 192) === 0) {
          setStatus('Encoding locally… ' + Math.floor(end * 100 / audio.length) + '%');
          await yieldFrame();
        }
      }
      const tail = encoder.flush();
      if (tail.length) parts.push(tail);
      return new File(parts, stem(file.name) + '.mp3', { type: 'audio/mpeg' });
    } finally {
      if (context) await context.close().catch(() => {});
    }
  }

  convert.addEventListener('click', async () => {
    if (busy) return;
    reset();
    if (!confirmRights.checked) { setStatus('Confirm processing permission first.'); return; }
    const local = fileInput.files && fileInput.files[0], raw = urlInput.value.trim();
    if (!local && !raw) { setStatus('Choose a file or paste a direct audio URL.'); return; }
    if (local && raw) { setStatus('Use one source at a time. Clear the other field.'); return; }
    busy = true; convert.disabled = true; convert.textContent = 'Processing…';
    try {
      sourceUrl = '';
      let input = local;
      if (!input) {
        setStatus('Downloading permitted direct audio…');
        input = await getAudioUrl(raw); sourceUrl = raw;
      }
      const output = await makeMp3(input);
      prepared = output;
      objectUrl = URL.createObjectURL(output);
      preview.src = objectUrl;
      download.href = objectUrl;
      download.download = output.name;
      find('#audio-import-filename').textContent = output.name + ' · ' + (output.size / 1048576).toFixed(1) + ' MB';
      result.hidden = false;
      setStatus('MP3 prepared locally. Nothing has been uploaded.');
    } catch (error) { setStatus(error && error.message || 'Conversion failed.'); }
    finally { busy = false; convert.disabled = false; convert.textContent = 'Prepare MP3'; }
  });

  find('#audio-import-stage').addEventListener('click', () => {
    if (!prepared) return;
    root.dispatchEvent(new CustomEvent('ashwood:prepared-audio', {
      detail: { file: prepared, sourceUrl, originalName: fileInput.files && fileInput.files[0] && fileInput.files[0].name || '' }
    }));
    setStatus('Prepared for ASHWOOD upload. Review metadata and select Upload to ASHWOOD below.');
    const form = root.querySelector('#ashwood-drop-form');
    if (form) form.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start'
    });
  });
  window.addEventListener('pagehide', () => { if (objectUrl) URL.revokeObjectURL(objectUrl); });
})();