(() => {
  "use strict";

  const TRACK = Object.freeze({
    id: "in-me",
    title: "IN ME",
    artist: "t.kap feat. Cashden",
    dspUrl: "https://distrokid.com/hyperfollow/tkap/in-me-feat-cashden?ref=release",

    // AUDIO SOURCE: keep the licensed web file isolated here for easy replacement.
    source: "/audio/in-me.mp3"
  });

  const STORAGE_KEY = "ashwood.audio.v1";
  const DEFAULT_STATE = { trackId: TRACK.id, position: 0, volume: 0.8, wasPlaying: false };

  const readState = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return {
        ...DEFAULT_STATE,
        ...saved,
        position: Math.max(0, Number(saved?.position) || 0),
        volume: Math.min(1, Math.max(0, Number(saved?.volume ?? DEFAULT_STATE.volume)))
      };
    } catch (_) {
      return { ...DEFAULT_STATE };
    }
  };

  let state = readState();
  let lastPositionSave = 0;
  const audio = new Audio();
  audio.preload = "metadata";
  audio.volume = state.volume;
  if (TRACK.source) audio.src = TRACK.source;

  const isMusicPage = location.pathname.replace(/\/+$/, "") === "/music";
  document.body.classList.add("ashwood-has-audio");
  if (isMusicPage) document.body.classList.add("ashwood-has-audio-room");
  const player = document.createElement("aside");
  player.className = `ashwood-audio${isMusicPage ? " ashwood-audio--room" : ""}`;
  player.setAttribute("aria-label", "ASHWOOD audio player");
  player.innerHTML = `
    <div class="ashwood-audio__bar">
      <button class="ashwood-audio__toggle" type="button" ${TRACK.source ? "" : "disabled"}>${TRACK.source ? "Sound off" : "Audio pending"}</button>
      <div class="ashwood-audio__identity">
        <p class="ashwood-audio__eyebrow">${isMusicPage ? "Released / Now playing" : "ASHWOOD sound"}</p>
        <p class="ashwood-audio__title">${TRACK.title} — ${TRACK.artist}</p>
      </div>
      <span class="ashwood-audio__time" aria-live="off">0:00 / --:--</span>
    </div>
    <div class="ashwood-audio__room">
      <div class="ashwood-audio__control">
        <label for="ashwood-audio-progress">Position</label>
        <input id="ashwood-audio-progress" type="range" min="0" max="0" step="0.1" value="0" ${TRACK.source ? "" : "disabled"} aria-label="Track position" />
      </div>
      <div class="ashwood-audio__control">
        <label for="ashwood-audio-volume">Volume</label>
        <input id="ashwood-audio-volume" type="range" min="0" max="1" step="0.01" value="${state.volume}" aria-label="Volume" />
      </div>
      <div class="ashwood-audio__footer">
        <p class="ashwood-audio__source-note">${TRACK.source ? "Playback continues across ASHWOOD pages." : "Native audio is ready to connect. Add a licensed web audio source in audio-player.js to enable playback."}</p>
        <a class="ashwood-audio__dsp" href="${TRACK.dspUrl}" target="_blank" rel="noopener noreferrer">Listen on DSPs ↗</a>
      </div>
    </div>`;
  document.body.append(player);

  const toggle = player.querySelector(".ashwood-audio__toggle");
  const time = player.querySelector(".ashwood-audio__time");
  const progress = player.querySelector("#ashwood-audio-progress");
  const volume = player.querySelector("#ashwood-audio-volume");

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return "--:--";
    const rounded = Math.max(0, Math.floor(seconds));
    return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`;
  };

  const saveState = (overrides = {}) => {
    state = {
      ...state,
      trackId: TRACK.id,
      position: Number.isFinite(audio.currentTime) ? audio.currentTime : state.position,
      volume: audio.volume,
      wasPlaying: !audio.paused && !audio.ended,
      ...overrides
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { /* Storage may be unavailable. */ }
  };

  const render = () => {
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    const position = Number.isFinite(audio.currentTime) ? audio.currentTime : state.position;
    time.textContent = `${formatTime(position)} / ${formatTime(duration || NaN)}`;
    progress.max = String(duration);
    progress.value = String(Math.min(position, duration || position));
    if (TRACK.source) toggle.textContent = audio.paused ? (state.wasPlaying ? "Resume" : "Sound off") : "Pause";
  };

  const play = async () => {
    if (!TRACK.source) return;
    try {
      await audio.play();
      saveState({ wasPlaying: true });
    } catch (_) {
      saveState({ wasPlaying: true });
      toggle.textContent = "Resume";
    }
    render();
  };

  toggle.addEventListener("click", () => {
    if (audio.paused) play();
    else {
      audio.pause();
      saveState({ wasPlaying: false });
      render();
    }
  });

  volume.addEventListener("input", () => {
    audio.volume = Number(volume.value);
    saveState();
  });

  progress.addEventListener("input", () => {
    if (Number.isFinite(audio.duration)) audio.currentTime = Number(progress.value);
    saveState();
    render();
  });

  audio.addEventListener("loadedmetadata", () => {
    audio.currentTime = Math.min(state.position, audio.duration || state.position);
    render();
    if (state.wasPlaying) play();
  });
  audio.addEventListener("play", render);
  audio.addEventListener("pause", render);
  audio.addEventListener("timeupdate", () => {
    render();
    if (Math.abs(audio.currentTime - lastPositionSave) >= 5) {
      lastPositionSave = audio.currentTime;
      saveState();
    }
  });
  audio.addEventListener("volumechange", () => { volume.value = String(audio.volume); });
  audio.addEventListener("ended", () => { saveState({ position: 0, wasPlaying: false }); render(); });

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (link && link.origin === location.origin) saveState();
  }, { capture: true });
  window.addEventListener("pagehide", () => saveState());
  document.addEventListener("visibilitychange", () => { if (document.hidden) saveState(); });

  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({ title: TRACK.title, artist: TRACK.artist });
    navigator.mediaSession.setActionHandler("play", play);
    navigator.mediaSession.setActionHandler("pause", () => { audio.pause(); saveState({ wasPlaying: false }); render(); });
  }

  render();
})();
