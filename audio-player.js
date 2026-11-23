(() => {
  "use strict";

  const TRACK = Object.freeze({
    id: "in-me",
    artwork: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/85/2f/53/852f53d5-dae5-38d3-fac6-38355bb0de55/artwork.jpg/100x100bb.jpg",
    title: "IN ME",
    artist: "t.kap feat. Cashden",
    dspUrl: "https://distrokid.com/hyperfollow/tkap/in-me-feat-cashden?ref=release",
    source: "https://ashwood-info.vercel.app/audio/in-me.mp3"
  });

  /* IN ME stays the canonical first entry, so if the library never loads the player
     behaves exactly as it always has. Anything published from ASHWOOD Drop is appended
     after it, which makes the mini player one continuous playlist across the site
     rather than a single hard-coded song. */
  const demos = document.querySelector("[data-ashwood-demos]");
  const hiddenTracks = new Set(demos?.dataset.hiddenTracks?.split(/\s+/) || []);
  const demoRows = [...(demos?.querySelectorAll("[data-demo-id]") || [])];
  const video = demos?.querySelector("video");
  const videoPanel = video?.closest(".demos__video-panel");
  const videoStatus = videoPanel?.querySelector("[role=status]");
  const demoVideo = demoRows.find(row => row.contains(video));
  const videoSource = video ? () => video.dataset.source : null;
  const demoBase = (row) => ({
    id: `demo-${row.dataset.demoId}`, title: row.dataset.demoTitle,
    artist: "t.kap", artwork: demos.querySelector(".demos__header img").src, dspUrl: demos.dataset.sourceUrl
  });
  const demoTracks = videoSource ? [{ ...demoBase(demoVideo), source: videoSource, video }] : [];
  const nativeDemos = demoRows.filter(row => row.dataset.demoSource);
  for (const row of nativeDemos) {
    demoTracks.push({ ...demoBase(row), source: row.dataset.demoSource });
  }
  let playlist = [TRACK, ...demoTracks];
  let trackIndex = 0;
  const current = () => playlist[trackIndex] || TRACK;
  let siteTracks = [];
  let soundCloudTracks = [];
  const soundCloudRows = new Map();
  const soundCloudQueue = document.querySelector("[data-soundcloud-tracks]");
  const soundCloudStatus = document.querySelector("[data-soundcloud-status]");

  const STORAGE_KEY = "ashwood.audio.v1";
  const UI_STORAGE_KEY = "ashwood.audio.ui.v1";
  const DEFAULT_STATE = { trackId: TRACK.id, position: 0, volume: 0.8, wasPlaying: false };
  const DEFAULT_UI_STATE = { collapsed: true };

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

  const readUiState = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(UI_STORAGE_KEY));
      return {
        collapsed: typeof saved?.collapsed === "boolean" ? saved.collapsed : DEFAULT_UI_STATE.collapsed
      };
    } catch (_) {
      return { ...DEFAULT_UI_STATE };
    }
  };

  const installPreviewPlayerStyles = () => {
    if (!document.body.classList.contains("ashwood-home-native") || document.getElementById("v3-home-audio-player-style")) return;
    const style = document.createElement("style");
    style.id = "v3-home-audio-player-style";
    style.textContent = `
      @media (min-width:761px){
        body.ashwood-home-native.ashwood-has-audio{padding-bottom:164px}
        body.ashwood-home-native .ashwood-audio{
          left:24px!important;right:auto!important;bottom:22px!important;
          width:min(500px,calc(100vw - 48px))!important;max-width:500px!important;
          z-index:82!important;border:1px solid var(--audio-rule)!important;
          background:color-mix(in srgb,var(--audio-paper) 95%,transparent)!important;
          box-shadow:0 14px 44px rgba(0,0,0,.18)!important;opacity:1!important;
        }
        body.ashwood-home-native .ashwood-audio__bar{
          display:grid!important;grid-template-columns:auto minmax(0,1fr) auto!important;
          gap:16px!important;align-items:center!important;min-height:86px!important;
          padding:16px 54px 14px 16px!important;
        }
        body.ashwood-home-native .ashwood-audio .ashwood-audio__toggle{
          min-width:104px!important;padding:11px 12px!important;border:1px solid var(--audio-oxblood)!important;
          color:var(--audio-oxblood)!important;font-size:9px!important;letter-spacing:.12em!important;
        }
        body.ashwood-home-native .ashwood-audio__identity{max-width:none!important;min-width:0!important}
        body.ashwood-home-native .ashwood-audio__eyebrow{display:block!important;margin:0 0 5px!important;font-size:8px!important;letter-spacing:.16em!important}
        body.ashwood-home-native .ashwood-audio__title{margin:0!important;font-size:16px!important;line-height:1.05!important;letter-spacing:.03em!important;text-transform:none!important;white-space:normal!important;overflow:visible!important}
        body.ashwood-home-native .ashwood-audio__artist{margin:4px 0 0;color:var(--audio-ink);opacity:.66;font-size:10px;line-height:1.25;letter-spacing:.06em;text-transform:none}
        body.ashwood-home-native .ashwood-audio__time{display:block!important;font-size:9px!important;letter-spacing:.06em!important}
        body.ashwood-home-native .ashwood-audio__room{display:block!important;padding:0 16px 15px!important;border-top:0!important}
        body.ashwood-home-native .ashwood-audio__control--progress{display:grid!important;grid-template-columns:54px minmax(0,1fr)!important;gap:10px!important;margin:0!important}
        body.ashwood-home-native .ashwood-audio__footer{display:none!important}
        body.ashwood-home-native .ashwood-audio__control--volume{
          display:grid!important;grid-template-columns:54px minmax(0,1fr)!important;
          gap:10px!important;margin:11px 0 0!important;
        }
        body.ashwood-home-native .ashwood-audio__collapse{
          display:inline-flex!important;position:absolute!important;top:14px!important;right:14px!important;
          width:30px!important;height:30px!important;align-items:center!important;justify-content:center!important;
          border:1px solid var(--audio-rule)!important;background:transparent!important;color:inherit!important;cursor:pointer!important;
        }
        body.ashwood-home-native .ashwood-audio.is-collapsed{
          width:auto!important;max-width:none!important;border:0!important;background:transparent!important;box-shadow:none!important;
          display:flex!important;align-items:center!important;gap:6px!important;
        }
        body.ashwood-home-native .ashwood-audio.is-collapsed .ashwood-audio__bar{
          display:block!important;min-height:0!important;padding:0!important;
        }
        body.ashwood-home-native .ashwood-audio.is-collapsed .ashwood-audio__identity,
        body.ashwood-home-native .ashwood-audio.is-collapsed .ashwood-audio__time,
        body.ashwood-home-native .ashwood-audio.is-collapsed .ashwood-audio__room{display:none!important}
        body.ashwood-home-native .ashwood-audio.is-collapsed .ashwood-audio__toggle{
          min-width:0!important;padding:10px 12px!important;border:1px solid var(--audio-rule)!important;
          color:var(--audio-ink)!important;background:color-mix(in srgb,var(--audio-paper) 94%,transparent)!important;
        }
        body.ashwood-home-native .ashwood-audio.is-collapsed .ashwood-audio__collapse{
          position:static!important;width:38px!important;height:38px!important;border-radius:0!important;
          background:color-mix(in srgb,var(--audio-paper) 94%,transparent)!important;
        }
      }
      @media (max-width:760px){
        body.ashwood-home-native .ashwood-audio__artist{font-size:9px;margin:3px 0 0;opacity:.62}
      }
    `;
    document.head.appendChild(style);
  };

  let state = readState();
  let uiState = readUiState();
  let lastPositionSave = 0;
  const audio = new Audio();
  audio.preload = "metadata";
  audio.volume = state.volume;
  if (TRACK.source && (!demos || state.wasPlaying)) audio.src = TRACK.source;

  let media = audio;
  const isMusicPage = document.body.classList.contains("music-page");
  document.body.classList.add("ashwood-has-audio");
  if (isMusicPage) document.body.classList.add("ashwood-has-audio-room");
  installPreviewPlayerStyles();

  const playerIcon = path => `<svg width="19" height="19" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" focusable="false"><path d="${path}"/></svg>`;
  const transport = {
    play: playerIcon("M6 3.5v13l10-6.5z"),
    pause: playerIcon("M5.5 4h3v12h-3zm6 0h3v12h-3z"),
    previous: playerIcon("M4 4h2v12H4zm12 0v12L7 10z"),
    next: playerIcon("M14 4h2v12h-2zM4 4v12l9-6z")
  };
  const themeButton = document.querySelector("[data-music-theme-toggle]");
  if (themeButton) {
    const root = document.documentElement;
    const labelTheme = () => {
      themeButton.textContent = root.dataset.musicTheme === "light" ? "Dark mode" : "Light mode";
    };
    labelTheme();
    themeButton.hidden = false;
    themeButton.addEventListener("click", () => {
      const theme = root.dataset.musicTheme === "light" ? "dark" : "light";
      root.dataset.musicTheme = theme;
      document.querySelector('meta[name="theme-color"]').content = theme === "dark" ? "#121212" : "#ffffff";
      try { localStorage.setItem("ashwood.music.theme", theme); } catch (_) {}
      labelTheme();
    });
  }
  let collectionQueued = Boolean(demos);
  const player = document.createElement("aside");
  player.className = `ashwood-audio${isMusicPage ? " ashwood-audio--room" : ""}`;
  if (demos) player.classList.add("ashwood-audio--demos");
  player.setAttribute("aria-label", "ASHWOOD audio player");
  player.innerHTML = `
    <div class="ashwood-audio__bar">
      <button class="ashwood-audio__step ashwood-audio__step--prev" type="button" aria-label="Previous track" hidden>${demos ? transport.previous : "‹"}</button>
      <button class="ashwood-audio__toggle" type="button" ${TRACK.source ? "" : "disabled"}>${TRACK.source ? "Sound off" : "Audio pending"}</button>
      <button class="ashwood-audio__step ashwood-audio__step--next" type="button" aria-label="Next track" hidden>${demos ? transport.next : "›"}</button>
      <div class="ashwood-audio__identity">
        <p class="ashwood-audio__eyebrow">${isMusicPage ? "Released / Now playing" : "ASHWOOD sound"}</p>
        <p class="ashwood-audio__title">${TRACK.title}</p>
        <p class="ashwood-audio__artist">${TRACK.artist}</p>
      </div>
      <span class="ashwood-audio__time" aria-live="off">0:00 / --:--</span>
    </div>
    <div class="ashwood-audio__room">
      <div class="ashwood-audio__control ashwood-audio__control--progress">
        <label for="ashwood-audio-progress">Position</label>
        <input id="ashwood-audio-progress" type="range" min="0" max="0" step="0.1" value="0" ${TRACK.source ? "" : "disabled"} aria-label="Track position" />
      </div>
      <div class="ashwood-audio__control ashwood-audio__control--volume">
        <label for="ashwood-audio-volume">Volume</label>
        <input id="ashwood-audio-volume" type="range" min="0" max="1" step="0.01" value="${state.volume}" aria-label="Volume" />
      </div>
      <div class="ashwood-audio__footer">
        <p class="ashwood-audio__source-note">${TRACK.source ? "Playback continues across ASHWOOD pages." : "Native audio is ready to connect."}</p>
        <a class="ashwood-audio__dsp" href="${TRACK.dspUrl}" target="_blank" rel="noopener noreferrer">Listen on DSPs ↗</a>
      </div>
    </div>
    <button class="ashwood-audio__collapse" type="button" aria-expanded="true" aria-label="Collapse audio player">−</button>`;
  if (demos) {
    const art = demos.querySelector(".demos__header img").cloneNode();
    art.className = "ashwood-audio__art";
    art.alt = "";
    player.prepend(art);
  }
  document.body.append(player);

  const toggle = player.querySelector(".ashwood-audio__toggle");
  const time = player.querySelector(".ashwood-audio__time");
  const progress = player.querySelector("#ashwood-audio-progress");
  const volume = player.querySelector("#ashwood-audio-volume");
  const collapse = player.querySelector(".ashwood-audio__collapse");
  const prevButton = player.querySelector(".ashwood-audio__step--prev");
  const nextButton = player.querySelector(".ashwood-audio__step--next");
  const titleNode = player.querySelector(".ashwood-audio__title");
  const artistNode = player.querySelector(".ashwood-audio__artist");
  const artworkNode = player.querySelector(".ashwood-audio__art");
  const emptyArtwork = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#292724"/><text x="50" y="57" text-anchor="middle" fill="#eee" font-family="Arial" font-size="16">t.kap</text></svg>');
  if (artworkNode) artworkNode.addEventListener("error", () => {
    if (artworkNode.getAttribute("src") !== emptyArtwork) artworkNode.src = emptyArtwork;
  });
  const dspLink = player.querySelector(".ashwood-audio__dsp");
  const sourceNote = player.querySelector(".ashwood-audio__source-note");
  const mobile = window.matchMedia("(max-width: 760px)");

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return "--:--";
    const rounded = Math.max(0, Math.floor(seconds));
    return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`;
  };

  const saveState = (overrides = {}) => {
    state = {
      ...state,
      trackId: current().id,
      position: Number.isFinite(media.currentTime) ? media.currentTime : state.position,
      volume: media.volume,
      wasPlaying: !media.paused && !media.ended,
      ...overrides
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  };

  const saveUiState = (collapsed) => {
    uiState = { collapsed: Boolean(collapsed) };
    try { localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(uiState)); } catch (_) {}
  };

  const setCollapsed = (collapsed, { persist = false } = {}) => {
    player.classList.toggle("is-collapsed", collapsed);
    collapse.setAttribute("aria-expanded", String(!collapsed));
    collapse.setAttribute("aria-label", collapsed ? "Expand audio player" : "Collapse audio player");
    collapse.textContent = collapsed ? "+" : "−";
    if (persist) saveUiState(collapsed);
  };

  const render = () => {
    const duration = Number.isFinite(media.duration) ? media.duration : 0;
    const position = Number.isFinite(media.currentTime) ? media.currentTime : state.position;
    time.textContent = `${formatTime(position)} / ${formatTime(duration || NaN)}`;
    if (demos) progress.disabled = !duration;
    progress.max = String(duration);
    progress.value = String(Math.min(position, duration || position));
    if (current().source) {
      const label = media.paused ? (demos || current().video || state.wasPlaying ? "Play" : "Sound off") : "Pause";
      if (demos) {
        const icon = media.paused ? "play" : "pause";
        if (toggle.dataset.icon !== icon) {
          toggle.innerHTML = transport[icon];
          toggle.dataset.icon = icon;
        }
        toggle.setAttribute("aria-label", label);
      } else toggle.textContent = label;
    }
    player.classList.toggle("is-playing", !media.paused && !media.ended);
  };

  const play = async () => {
    if (!current().source) return;
    const target = media;
    try {
      if (target.error) target.load();
      if (target === video) videoStatus.hidden = true;
      await target.play();
      if (target !== media) return;
      saveState({ wasPlaying: true });
    } catch (_) {
      if (target !== media) return;
      saveState({ wasPlaying: true });
      if (target === video && !target.error) {
        videoStatus.textContent = "Tap play on the video to start.";
        videoStatus.hidden = false;
      } else if (!demos) toggle.textContent = "Resume";
    }
    render();
  };

  const renderIdentity = () => {
    const track = current();
    for (const [id, row] of soundCloudRows) {
      if (id === track.id) row.setAttribute("aria-current", "true");
      else row.removeAttribute("aria-current");
    }
    titleNode.textContent = collectionQueued ? demos.querySelector("h2").textContent.trim() : track.title;
    artistNode.textContent = collectionQueued ? "t.kap" : track.artist;
    const artwork = collectionQueued ? demos.querySelector(".demos__header img").src : track.artwork;
    if (artworkNode) {
      const source = artwork || emptyArtwork;
      if (artworkNode.getAttribute("src") !== source) artworkNode.src = source;
    }
    sourceNote.textContent = track.video ? "Playing the HLF lyric video." : "Playback continues across ASHWOOD pages.";
    if (track.dspUrl) { dspLink.href = track.dspUrl; dspLink.hidden = false; }
    else dspLink.hidden = true;
    // The stepper is meaningless with a single track, so it stays out of the way
    // entirely until the library actually adds something to step through.
    const many = playlist.length > 1;
    prevButton.hidden = !many;
    nextButton.hidden = !many;
    prevButton.disabled = trackIndex === 0;
    nextButton.disabled = trackIndex >= playlist.length - 1;
    if (navigator.mediaSession && typeof MediaMetadata === "function") {
      navigator.mediaSession.metadata = new MediaMetadata({ title: track.title, artist: track.artist, artwork: artwork ? [{ src: artwork }] : [] });
    }
  };

  const setTrack = (index, { autoplay = false, position = 0 } = {}) => {
    if (index < 0 || index >= playlist.length) return;
    collectionQueued = false;
    const previous = media;
    previous.pause();
    const volumeSetting = previous.volume;
    trackIndex = index;
    const track = current();
    media = track.controller || track.video || audio;
    media.volume = volumeSetting;
    if (soundCloudStatus) soundCloudStatus.hidden = true;
    state = { ...state, trackId: track.id, position, wasPlaying: autoplay };
    lastPositionSave = position;
    const source = typeof track.source === "function" ? track.source() : track.source;
    if (videoPanel) {
      videoPanel.hidden = !track.video;
      demoVideo.querySelector("button").setAttribute("aria-expanded", String(Boolean(track.video)));
      videoStatus.hidden = true;
    }
    if (track.controller) track.controller.select(track, position);
    else media.src = source;
    renderIdentity();
    saveState({ position, wasPlaying: autoplay });
    if (autoplay) play();
    render();
  };

  prevButton.addEventListener("click", () => setTrack(trackIndex - 1, { autoplay: !media.paused }));
  nextButton.addEventListener("click", () => setTrack(trackIndex + 1, { autoplay: !media.paused }));

  /* Published ASHWOOD Drop uploads become the rest of the playlist. This runs on every
     page because the player is rebuilt per page; a failure leaves the single canonical
     track in place rather than breaking playback. */
  const normalize = title => String(title || "").toLowerCase()
    .replace(/\s*\(prod(?:uced)?[.\s][^)]*\).*$/, "").replace(/[^a-z0-9]+/g, "");
  const enableDemo = (row, id) => {
    const button = row.querySelector("[data-demo-select]");
    button.disabled = false;
    button.hidden = false;
    const fallback = row.querySelector("[data-demo-fallback]");
    if (fallback) fallback.hidden = true;
    button.addEventListener("click", () => {
      setCollapsed(false);
      if (current().id === id) {
        if (media.paused) play();
        else { media.pause(); saveState(); render(); }
      } else setTrack(playlist.findIndex(track => track.id === id), { autoplay: true });
      if (row === demoVideo && media === video) video.focus({ preventScroll: true });
    });
  };
  if (demoVideo) enableDemo(demoVideo, "demo-hlf");
  for (const row of nativeDemos) enableDemo(row, `demo-${row.dataset.demoId}`);

  const updatePlaylist = () => {
    const selectedId = current().id;
    playlist = [TRACK, ...demoTracks, ...siteTracks, ...soundCloudTracks];
    trackIndex = Math.max(0, playlist.findIndex(track => track.id === selectedId));
    renderIdentity();
    render();
  };

  const loadSoundCloudQueue = tracks => {
    if (!soundCloudQueue || soundCloudTracks.length) return;
    soundCloudTracks = tracks;
    for (const track of tracks) {
      const row = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.innerHTML = transport.play;
      const title = document.createElement("span");
      title.textContent = track.title;
      const time = document.createElement("span");
      time.className = "music-native-duration";
      time.textContent = formatTime(track.duration);
      button.append(title, time);
      button.addEventListener("click", () => {
        const index = playlist.findIndex(item => item.id === track.id);
        if (current().id !== track.id) setTrack(index, { autoplay: true });
        else if (media.paused) play();
        else media.pause();
      });
      row.append(button);
      soundCloudQueue.append(row);
      soundCloudRows.set(track.id, button);
    }
    soundCloudQueue.hidden = false;
    document.querySelector("[data-soundcloud-drawer]").hidden = true;
    updatePlaylist();
    if (current().id === TRACK.id && state.trackId?.startsWith("soundcloud-")) {
      const index = playlist.findIndex(track => track.id === state.trackId);
      if (index > 0) setTrack(index, { position: state.position });
    }
  };

  const loadPlaylist = async () => {
    try {
      const res = await fetch("/music/published.json", { cache: "no-store" });
      if (!res.ok) return;
      const body = await res.json();
      const seen = new Set([TRACK, ...demoTracks].map(track => normalize(track.title)));
      const added = (Array.isArray(body.tracks) ? body.tracks : []).reduce((list, row) => {
        const key = normalize(row.title);
        if (!row.url || !key || hiddenTracks.has(key) || seen.has(key) || (demoVideo && key === demoVideo.dataset.demoId)) return list;
        seen.add(key);
        list.push({
          id: `upload-${row.id}`,
          title: row.title,
          artist: row.artist || "t.kap",
          artwork: row.artwork_url || row.artwork || "",
          dspUrl: row.source_url || "",
          source: row.url
        });
        return list;
      }, []);
      const availableDemos = demoRows.filter(row => row !== demoVideo).flatMap(row => {
        const match = added.find(track => normalize(track.title) === row.dataset.demoId);
        if (!match) return [];
        const track = { ...match, ...demoBase(row) };
        enableDemo(row, track.id);
        return [track];
      });
      const usedSources = new Set(availableDemos.map(track => track.source));
      siteTracks = [...availableDemos, ...added.filter(track => !usedSources.has(track.source))];
      updatePlaylist();
      const savedIndex = playlist.findIndex(track => track.id === state.trackId);
      if (savedIndex > 0 && current().id === TRACK.id) {
        const { position, wasPlaying } = state;
        setTrack(savedIndex, { autoplay: wasPlaying, position });
      }
      renderIdentity();
      render();
    } catch (_) { /* the canonical track is already playing; nothing to recover */ }
  };

  document.querySelector("[data-play-release]")?.addEventListener("click", () => {
    if (current().id !== TRACK.id || collectionQueued || !audio.getAttribute("src")) {
      setTrack(0, { autoplay: true });
    } else if (media.paused) play();
    else media.pause();
  });

  toggle.addEventListener("click", () => {
    if (collectionQueued) { setTrack(1, { autoplay: true }); return; }
    if (media.paused) play();
    else {
      media.pause();
      saveState({ wasPlaying: false });
      render();
    }
  });

  collapse.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    setCollapsed(!player.classList.contains("is-collapsed"), { persist: true });
  });

  volume.addEventListener("input", () => {
    media.volume = Number(volume.value);
    saveState();
  });

  progress.addEventListener("input", () => {
    if (Number.isFinite(media.duration)) media.currentTime = Number(progress.value);
    saveState();
    render();
  });

  const soundCloudMedia = window.connectAshwoodSoundCloud?.(
    document.querySelector("#soundcloud-playback"), loadSoundCloudQueue
  );
  soundCloudMedia?.addEventListener("error", () => {
    if (media !== soundCloudMedia) return;
    soundCloudStatus.textContent = "SoundCloud could not start playback. You can open the playlist in SoundCloud below.";
    soundCloudStatus.hidden = false;
    saveState({ wasPlaying: false });
    render();
  });

  for (const element of [audio, video, soundCloudMedia].filter(Boolean)) {
    element.addEventListener("loadedmetadata", () => {
      if (element !== media) return;
      if (state.trackId === current().id) {
        media.currentTime = Math.min(state.position, media.duration || state.position);
        if (state.wasPlaying && media.paused) play();
      }
      render();
    });
    for (const event of ["play", "pause"]) element.addEventListener(event, () => {
      if (element !== media || element.ended) return;
      saveState();
      render();
    });
    element.addEventListener("timeupdate", () => {
      if (element !== media) return;
      render();
      if (Math.abs(media.currentTime - lastPositionSave) >= 5) {
        lastPositionSave = media.currentTime;
        saveState();
      }
    });
    element.addEventListener("volumechange", () => {
      if (element === media) volume.value = String(media.volume);
    });
    element.addEventListener("ended", () => {
      if (element !== media) return;
      const next = playlist[trackIndex + 1];
      if (next && (!current().id.startsWith("demo-") || next.id.startsWith("demo-"))) {
        setTrack(trackIndex + 1, { autoplay: true });
        return;
      }
      saveState({ position: 0, wasPlaying: false });
      render();
    });
  }
  video?.addEventListener("error", () => {
    if (media !== video) return;
    videoStatus.hidden = false;
    videoStatus.textContent = "HLF could not load. Try playing it again or open the Untitled collection.";
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (link && link.origin === location.origin) saveState();
  }, { capture: true });
  window.addEventListener("pagehide", () => saveState());
  document.addEventListener("visibilitychange", () => { if (document.hidden) saveState(); });

  if (navigator.mediaSession && typeof MediaMetadata === "function") {
    navigator.mediaSession.metadata = new MediaMetadata({ title: TRACK.title, artist: TRACK.artist });
    navigator.mediaSession.setActionHandler("play", play);
    navigator.mediaSession.setActionHandler("pause", () => { media.pause(); saveState({ wasPlaying: false }); render(); });
  }

  setCollapsed(demos ? false : mobile.matches ? true : uiState.collapsed);
  const handleViewportChange = (event) => {
    if (!demos && event.matches) setCollapsed(true);
  };
  if (mobile.addEventListener) mobile.addEventListener("change", handleViewportChange);
  else mobile.addListener(handleViewportChange);

  if (demos) renderIdentity();
  render();
  queueMicrotask(loadPlaylist);
})();

/* Home-only editorial teaser for the inaugural ASHWOOD Dispatch. */
(() => {
  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/" && path !== "/index.html") return;

  const mount = () => {
    const intro = document.querySelector(".intro");
    if (!intro || document.querySelector(".home-dispatch-teaser")) return;

    const style = document.createElement("style");
    style.textContent = `
      .home-dispatch-teaser{position:relative;z-index:62;width:min(62%,820px);margin:clamp(22px,3.5vh,40px) 0 clamp(18px,3vh,34px);padding:18px 0 20px;border-top:1px solid color-mix(in srgb,var(--ashwood-rule) 72%,transparent);border-bottom:1px solid color-mix(in srgb,var(--ashwood-rule) 48%,transparent)}
      .home-dispatch-teaser__kicker{margin:0 0 10px;color:var(--ashwood-gold);font-size:8px;letter-spacing:.17em;text-transform:uppercase}
      .home-dispatch-teaser h2{margin:0;font-family:Georgia,serif;font-size:clamp(24px,3vw,38px);font-weight:400;line-height:1.02;letter-spacing:-.025em}
      .home-dispatch-teaser__deck{max-width:60ch;margin:10px 0 0;color:var(--ashwood-muted);font-size:10px;line-height:1.55}
      .home-dispatch-teaser__excerpt{max-width:58ch;margin:12px 0 0;font-family:Georgia,serif;font-size:clamp(13px,1.25vw,17px);line-height:1.5;color:var(--ashwood-ink)}
      .home-dispatch-teaser__meta{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:14px}
      .home-dispatch-teaser__date{color:var(--ashwood-muted);font-size:8px;letter-spacing:.09em;text-transform:uppercase}
      .home-dispatch-teaser__link{color:var(--ashwood-ink);font-size:8px;letter-spacing:.14em;text-transform:uppercase;text-decoration:none}
      .home-dispatch-teaser__link:hover,.home-dispatch-teaser__link:focus-visible{color:var(--ashwood-gold);font-style:italic}
      @media(max-width:760px){.home-dispatch-teaser{width:100%;margin:20px 0 28px;padding:17px 0 19px}.home-dispatch-teaser__deck{font-size:9px}.home-dispatch-teaser__excerpt{font-size:14px}.home-dispatch-teaser__link{min-height:44px;display:inline-flex;align-items:center}}
    `;
    document.head.append(style);

    const section = document.createElement("section");
    section.className = "home-dispatch-teaser";
    section.setAttribute("aria-labelledby", "home-dispatch-title");
    section.innerHTML = `
      <p class="home-dispatch-teaser__kicker">INAUGURAL DISPATCH · 001</p>
      <h2 id="home-dispatch-title">THE MIND IS THE MOAT</h2>
      <p class="home-dispatch-teaser__deck">On AI, anti-intellectualism, human context, and why knowledge should create more participants—not more dependents.</p>
      <p class="home-dispatch-teaser__excerpt">“What worries me is anti-intellectualism becoming automated.”</p>
      <div class="home-dispatch-teaser__meta">
        <time class="home-dispatch-teaser__date" datetime="2026-09-02">September 2, 2026</time>
        <a class="home-dispatch-teaser__link" href="/dispatch/001-the-mind-is-the-moat/">Read the inaugural Dispatch →</a>
      </div>`;

    intro.after(section);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
})();