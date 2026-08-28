(() => {
  "use strict";

  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/" && path !== "/index.html") return;

  document.body.classList.add("ashwood-home-native");

  const nav = document.querySelector(".future-nav");
  const player = document.querySelector(".ashwood-audio");
  const sourceToggle = player?.querySelector(".ashwood-audio__toggle");
  const sourceTitle = player?.querySelector(".ashwood-audio__title");
  const musicLink = nav?.querySelector('a[href="/music"]');

  if (!nav || !player || !sourceToggle || !musicLink) return;

  const control = document.createElement("span");
  control.className = "ashwood-home-audio";
  control.hidden = true;
  control.innerHTML = `
    <span class="ashwood-home-audio__title">${sourceTitle?.textContent?.split(" — ")[0] || "IN ME"}</span>
    <button class="ashwood-home-audio__toggle" type="button" aria-label="Play IN ME">▶</button>
  `;
  musicLink.insertAdjacentElement("afterend", control);

  const homeToggle = control.querySelector(".ashwood-home-audio__toggle");
  const STORAGE_KEY = "ashwood.audio.v1";

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
    control.hidden = !hasActiveSession();
    homeToggle.textContent = playing ? "Ⅱ" : "▶";
    homeToggle.setAttribute("aria-label", playing ? "Pause IN ME" : "Play IN ME");
  };

  homeToggle.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    sourceToggle.click();
    requestAnimationFrame(render);
    setTimeout(render, 80);
  });

  const observer = new MutationObserver(render);
  observer.observe(sourceToggle, { childList: true, characterData: true, subtree: true });
  window.addEventListener("storage", render);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });

  render();
})();
