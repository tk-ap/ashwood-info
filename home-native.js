(() => {
  "use strict";

  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/" && path !== "/index.html") return;

  document.body.classList.add("ashwood-home-native");

  const nav = document.querySelector(".future-nav");
  const shell = document.querySelector(".shell");
  const player = document.querySelector(".ashwood-audio");
  const sourceToggle = player?.querySelector(".ashwood-audio__toggle");
  const sourceTitle = player?.querySelector(".ashwood-audio__title");
  const sourceVolume = player?.querySelector("#ashwood-audio-volume");

  if (!nav || !shell || !player || !sourceToggle || !sourceVolume) return;

  const control = document.createElement("div");
  control.className = "ashwood-home-audio future-nav";
  control.hidden = true;
  control.setAttribute("aria-label", "IN ME playback controls");
  control.innerHTML = `
    <span class="ashwood-home-audio__title">${sourceTitle?.textContent?.split(" — ")[0] || "IN ME"}</span>
    <button class="ashwood-home-audio__toggle" type="button" aria-label="Play IN ME">▶</button>
    <input class="ashwood-home-audio__volume" type="range" min="0" max="1" step="0.01" value="${sourceVolume.value}" aria-label="IN ME volume" />
  `;
  nav.insertAdjacentElement("beforebegin", control);

  const homeToggle = control.querySelector(".ashwood-home-audio__toggle");
  const homeVolume = control.querySelector(".ashwood-home-audio__volume");
  const STORAGE_KEY = "ashwood.audio.v1";
  let wasVisible = false;

  const readState = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (_) {
      return {};
    }
  };

  const sourceIsPlaying = () => sourceToggle.textContent.trim().toLowerCase() === "pause";

  const hasActiveSession = () => {
    const state = readState();
    const position = Number(state.position) || 0;
    return sourceIsPlaying() || state.wasPlaying === true || position > 0.5;
  };

  const render = () => {
    const playing = sourceIsPlaying();
    const visible = hasActiveSession();
    control.hidden = !visible;
    homeToggle.textContent = playing ? "Ⅱ" : "▶";
    homeToggle.setAttribute("aria-label", playing ? "Pause IN ME" : "Play IN ME");
    homeVolume.value = sourceVolume.value;

    if (visible !== wasVisible) {
      wasVisible = visible;
      requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    }
  };

  homeToggle.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    sourceToggle.click();
    requestAnimationFrame(render);
    setTimeout(render, 80);
  });

  homeVolume.addEventListener("input", (event) => {
    event.stopPropagation();
    sourceVolume.value = homeVolume.value;
    sourceVolume.dispatchEvent(new Event("input", { bubbles: true }));
  });

  const observer = new MutationObserver(render);
  observer.observe(sourceToggle, { childList: true, characterData: true, subtree: true });
  sourceVolume.addEventListener("input", () => { homeVolume.value = sourceVolume.value; });
  window.addEventListener("storage", render);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });

  render();
})();
