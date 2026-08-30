(() => {
  "use strict";

  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/" && path !== "/index.html") return;

  document.body.classList.add("ashwood-home-native");

  const interactionState = document.createElement("script");
  interactionState.src = "/interaction-state.js?v=20260830-grammar1";
  interactionState.defer = true;
  document.head.appendChild(interactionState);

  const becomingsStyles = document.createElement("link");
  becomingsStyles.rel = "stylesheet";
  becomingsStyles.href = "/becomings-interaction.css?v=20260829-mobile-entrance";
  document.head.appendChild(becomingsStyles);

  const balanceStyles = document.createElement("link");
  balanceStyles.rel = "stylesheet";
  balanceStyles.href = "/home-balance.css?v=20260828-balance1";
  document.head.appendChild(balanceStyles);

  const polishStyles = document.createElement("link");
  polishStyles.rel = "stylesheet";
  polishStyles.href = "/home-polish.css?v=20260830-field-balance1";
  document.head.appendChild(polishStyles);

  const constellationStyles = document.createElement("link");
  constellationStyles.rel = "stylesheet";
  constellationStyles.href = "/capability-constellation.css?v=20260830-constellation1";
  document.head.appendChild(constellationStyles);

  const readabilityStyles = document.createElement("link");
  readabilityStyles.rel = "stylesheet";
  readabilityStyles.href = "/capability-readability.css?v=20260830-readability1";
  document.head.appendChild(readabilityStyles);

  /* The six-of-six reveal should feel discovered, not like a canned system toast.
     Pick a message per browser session and apply it once curiosity.js creates the flash. */
  const threadMessages = [
    "The pattern is becoming visible.",
    "Different work. Same underlying thread.",
    "The throughline was here all along.",
    "The pieces are starting to connect.",
    "You found a recurring signal.",
    "One practice. Many forms."
  ];
  const threadMessageKey = "ashwood.thread.message.v1";
  let threadMessage = "";
  try { threadMessage = sessionStorage.getItem(threadMessageKey) || ""; } catch (_) {}
  if (!threadMessages.includes(threadMessage)) {
    threadMessage = threadMessages[Math.floor(Math.random() * threadMessages.length)];
    try { sessionStorage.setItem(threadMessageKey, threadMessage); } catch (_) {}
  }

  const applyThreadMessage = () => {
    const copy = document.querySelector(".ashwood-thread-flash span");
    if (!copy) return false;
    copy.textContent = threadMessage;
    return true;
  };
  if (!applyThreadMessage()) {
    const threadObserver = new MutationObserver(() => {
      if (applyThreadMessage()) threadObserver.disconnect();
    });
    threadObserver.observe(document.body, { childList: true, subtree: true });
  }

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

  /* BECO(MINGS): one source revealing the three existing worlds. */
  const identity = document.querySelector(".home-identity");
  const becomingsWord = identity?.querySelector(".iridescent-word:not(.iridescent-word--jamaica)");
  const entryways = [...document.querySelectorAll(".home-entryway")];

  if (identity && becomingsWord && entryways.length >= 3) {
    const becomingsTrigger = document.createElement("button");
    becomingsTrigger.type = "button";
    becomingsTrigger.className = "iridescent-word becomings-trigger";
    becomingsTrigger.textContent = "Becomings";
    becomingsTrigger.setAttribute("aria-label", "Reveal Modeling, Music, and Builds");
    becomingsWord.replaceWith(becomingsTrigger);

    const bloom = document.createElement("div");
    bloom.className = "becomings-bloom";
    bloom.setAttribute("aria-hidden", "true");
    document.body.appendChild(bloom);

    let sequenceTimer = 0;
    const sequenceDelays = [260, 560, 860];

    const setBecomingsOrigin = () => {
      const rect = becomingsTrigger.getBoundingClientRect();
      document.documentElement.style.setProperty("--becomings-x", `${rect.left + rect.width / 2}px`);
      document.documentElement.style.setProperty("--becomings-y", `${rect.top + rect.height / 2}px`);
    };

    const clearSequence = () => {
      window.clearTimeout(sequenceTimer);
      entryways.forEach((entry) => entry.classList.remove("is-becoming-highlight"));
      becomingsTrigger.classList.remove("is-becoming-origin");
      bloom.classList.remove("is-active");
      document.body.classList.remove("is-becomings-sequence");
    };

    const runSequence = () => {
      clearSequence();
      setBecomingsOrigin();
      becomingsTrigger.classList.add("is-becoming-origin");
      bloom.classList.add("is-active");
      document.body.classList.add("is-becomings-sequence");
      entryways.forEach((entry, index) => {
        window.setTimeout(() => entry.classList.add("is-becoming-highlight"), sequenceDelays[index]);
      });
      sequenceTimer = window.setTimeout(() => {
        if (!becomingsTrigger.matches(":hover") && document.activeElement !== becomingsTrigger) clearSequence();
      }, 2100);
    };

    const leaveSequence = () => {
      window.setTimeout(() => {
        if (!becomingsTrigger.matches(":hover") && document.activeElement !== becomingsTrigger) clearSequence();
      }, 120);
    };

    becomingsTrigger.addEventListener("pointerenter", runSequence);
    becomingsTrigger.addEventListener("pointerleave", leaveSequence);
    becomingsTrigger.addEventListener("focus", runSequence);
    becomingsTrigger.addEventListener("blur", leaveSequence);
    becomingsTrigger.addEventListener("click", (event) => {
      event.preventDefault();
      if (window.matchMedia("(max-width: 760px), (pointer: coarse)").matches) {
        document.dispatchEvent(new CustomEvent("ashwood:open-capability-map", {
          detail: { entrance: true, trigger: becomingsTrigger }
        }));
        return;
      }
      runSequence();
    });

    window.addEventListener("resize", setBecomingsOrigin, { passive: true });
    setBecomingsOrigin();
  }

  setIgnitionOrigin();
  render();
})();
