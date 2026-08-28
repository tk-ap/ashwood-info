(() => {
  "use strict";

  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/" && path !== "/index.html") return;

  document.body.classList.add("ashwood-home-native");

  const jamaicaIgnitionStyle = document.createElement("style");
  jamaicaIgnitionStyle.textContent = `
    .ashwood-home-ignition__core {
      background: rgba(0, 155, 58, .96) !important;
      box-shadow: 0 0 18px rgba(0, 155, 58, .72), 0 0 48px rgba(0, 106, 40, .34) !important;
    }
    .ashwood-home-ignition__bloom {
      background: radial-gradient(ellipse at 48% 44%, rgba(0,155,58,.16) 0%, rgba(0,126,47,.09) 22%, rgba(0,78,30,.035) 48%, transparent 72%) !important;
    }
    .ashwood-home-ignition__wave {
      border-color: rgba(0, 155, 58, .22) !important;
    }
    @keyframes ashwood-word-in {
      0% { color: inherit; text-shadow: none; }
      34% { color: #009b3a; text-shadow: 0 0 12px rgba(0,155,58,.36); }
      72%, 100% { color: inherit; text-shadow: none; }
    }
    @keyframes ashwood-word-me {
      0% { color: inherit; text-shadow: none; }
      30% { color: #009b3a; text-shadow: 0 0 16px rgba(0,155,58,.5); }
      72% { color: #009b3a; text-shadow: 0 0 9px rgba(0,155,58,.24); }
      100% { color: inherit; text-shadow: none; }
    }
  `;
  document.head.appendChild(jamaicaIgnitionStyle);

  const nav = document.querySelector(".future-nav");
  const shell = document.querySelector(".shell");
  const player = document.querySelector(".ashwood-audio");
  const sourceToggle = player?.querySelector(".ashwood-audio__toggle");

  if (!nav || !shell || !player || !sourceToggle) return;

  const control = document.createElement("div");
  control.className = "ashwood-home-audio future-nav";
  control.hidden = false;
  control.setAttribute("aria-label", "IN ME playback control");
  control.innerHTML = `
    <button class="ashwood-home-audio__toggle" type="button" aria-label="Play IN ME">
      <span class="ashwood-home-audio__icon">▶</span>
      <span class="ashwood-home-audio__title"><span class="ashwood-home-audio__in">IN</span> <span class="ashwood-home-audio__me">ME</span></span>
    </button>
  `;
  nav.insertAdjacentElement("beforebegin", control);

  const cinematic = document.createElement("div");
  cinematic.className = "ashwood-home-ignition";
  cinematic.setAttribute("aria-hidden", "true");
  cinematic.innerHTML = `<span class="ashwood-home-ignition__core"></span><span class="ashwood-home-ignition__bloom"></span><span class="ashwood-home-ignition__wave"></span>`;
  document.body.appendChild(cinematic);

  const homeToggle = control.querySelector(".ashwood-home-audio__toggle");
  const homeIcon = control.querySelector(".ashwood-home-audio__icon");
  let cinematicTimer = 0;

  const sourceIsPlaying = () => sourceToggle.textContent.trim().toLowerCase() === "pause";

  const triggerIgnition = () => {
    clearTimeout(cinematicTimer);
    document.body.classList.remove("is-inner-igniting");
    void cinematic.offsetWidth;
    document.body.classList.add("is-inner-igniting");
    cinematicTimer = window.setTimeout(() => document.body.classList.remove("is-inner-igniting"), 6100);
  };

  const render = () => {
    const playing = sourceIsPlaying();
    homeIcon.textContent = playing ? "Ⅱ" : "▶";
    homeToggle.setAttribute("aria-label", playing ? "Pause IN ME" : "Play IN ME");
  };

  homeToggle.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const wasPlaying = sourceIsPlaying();
    sourceToggle.click();
    if (!wasPlaying) triggerIgnition();
    requestAnimationFrame(render);
    setTimeout(render, 80);
  });

  const observer = new MutationObserver(render);
  observer.observe(sourceToggle, { childList: true, characterData: true, subtree: true });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });

  render();
})();
