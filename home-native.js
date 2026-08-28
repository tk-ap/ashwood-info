(() => {
  "use strict";

  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/" && path !== "/index.html") return;

  document.body.classList.add("ashwood-home-native");

  const shell = document.querySelector(".shell");
  const player = document.querySelector(".ashwood-audio");
  const sourceToggle = player?.querySelector(".ashwood-audio__toggle");
  const eyebrow = document.querySelector(".intro .eyebrow");

  if (!shell || !player || !sourceToggle || !eyebrow) return;

  eyebrow.classList.add("ashwood-name-audio");
  eyebrow.innerHTML = `
    <span class="ashwood-name-audio__primary">
      <span>TAHLIA </span><button class="ashwood-name-audio__trigger" type="button" aria-label="Play IN ME"><span class="ashwood-name-audio__ashwood">ASHWOOD</span><span class="ashwood-name-audio__inme" aria-hidden="true">IN ME</span></button><span> PEART</span>
    </span>
    <span class="ashwood-name-audio__secondary">TK ASHWOOD / CREATIVE PRACTICE</span>
  `;

  const trigger = eyebrow.querySelector(".ashwood-name-audio__trigger");

  const cinematic = document.createElement("div");
  cinematic.className = "ashwood-home-ignition";
  cinematic.setAttribute("aria-hidden", "true");
  cinematic.innerHTML = `<span class="ashwood-home-ignition__core"></span><span class="ashwood-home-ignition__bloom"></span><span class="ashwood-home-ignition__wave"></span>`;
  document.body.appendChild(cinematic);

  let cinematicTimer = 0;

  const sourceIsPlaying = () => sourceToggle.textContent.trim().toLowerCase() === "pause";

  const setIgnitionOrigin = () => {
    const rect = trigger.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    document.documentElement.style.setProperty("--ashwood-ignition-x", `${x}px`);
    document.documentElement.style.setProperty("--ashwood-ignition-y", `${y}px`);
  };

  const triggerIgnition = () => {
    clearTimeout(cinematicTimer);
    setIgnitionOrigin();
    document.body.classList.remove("is-inner-igniting");
    void cinematic.offsetWidth;
    document.body.classList.add("is-inner-igniting");
    cinematicTimer = window.setTimeout(() => document.body.classList.remove("is-inner-igniting"), 6100);
  };

  const render = () => {
    const playing = sourceIsPlaying();
    trigger.classList.toggle("is-playing", playing);
    trigger.setAttribute("aria-label", playing ? "Pause IN ME" : "Play IN ME");
    trigger.setAttribute("aria-pressed", String(playing));
  };

  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const wasPlaying = sourceIsPlaying();
    sourceToggle.click();
    if (!wasPlaying) triggerIgnition();
    requestAnimationFrame(render);
    setTimeout(render, 80);
  });

  window.addEventListener("resize", setIgnitionOrigin, { passive: true });

  const observer = new MutationObserver(render);
  observer.observe(sourceToggle, { childList: true, characterData: true, subtree: true });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });

  setIgnitionOrigin();
  render();
})();
