(() => {
  "use strict";

  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/" && path !== "/index.html") return;

  document.body.classList.add("ashwood-home-native");

  const risoCursor = document.createElement("script");
  risoCursor.src = "/cursor-risograph.js?v=20260901-riso1";
  risoCursor.defer = true;
  document.head.appendChild(risoCursor);

  const interactionState = document.createElement("script");
  interactionState.src = "/interaction-state.js?v=20260830-grammar1";
  interactionState.defer = true;
  document.head.appendChild(interactionState);

  const becomingsStyles = document.createElement("link");
  becomingsStyles.rel = "stylesheet";
  becomingsStyles.href = "/becomings-interaction.css?v=20260830-launch1";
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

  const disclosureFixStyles = document.createElement("link");
  disclosureFixStyles.rel = "stylesheet";
  disclosureFixStyles.href = "/capability-disclosure-fix.css?v=20260831-space1";
  document.head.appendChild(disclosureFixStyles);

  const mobileHotspotDialogStyles = document.createElement("link");
  mobileHotspotDialogStyles.rel = "stylesheet";
  mobileHotspotDialogStyles.href = "/mobile-hotspot-dialog.css?v=20260830-dialog1";
  document.head.appendChild(mobileHotspotDialogStyles);

  const mobileDiscoveryStyles = document.createElement("link");
  mobileDiscoveryStyles.rel = "stylesheet";
  mobileDiscoveryStyles.href = "/mobile-discovery-surface.css?v=20260830-surface2";
  document.head.appendChild(mobileDiscoveryStyles);

  const mobileDiscoveryInteractions = document.createElement("script");
  mobileDiscoveryInteractions.src = "/mobile-discovery-surface.js?v=20260830-surface2";
  mobileDiscoveryInteractions.defer = true;
  document.head.appendChild(mobileDiscoveryInteractions);

  const jamaicaStyles = document.createElement("link");
  jamaicaStyles.rel = "stylesheet";
  jamaicaStyles.href = "/jamaica-easter-eggs.css?v=20260830-jm1";
  document.head.appendChild(jamaicaStyles);

  const jamaicaInteractions = document.createElement("script");
  jamaicaInteractions.src = "/jamaica-easter-eggs.js?v=20260830-jm1";
  jamaicaInteractions.defer = true;
  document.head.appendChild(jamaicaInteractions);

  const mobileParityStyles = document.createElement("link");
  mobileParityStyles.rel = "stylesheet";
  mobileParityStyles.href = "/mobile-interaction-parity.css?v=20260830-parity1";
  document.head.appendChild(mobileParityStyles);

  const mobileParityInteractions = document.createElement("script");
  mobileParityInteractions.src = "/mobile-interaction-parity.js?v=20260830-parity1";
  mobileParityInteractions.defer = true;
  document.head.appendChild(mobileParityInteractions);

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

/* Designer pass: keep Dispatch discoverable without letting it compete with the homepage hero. */
(() => {
  const placeDispatch = () => {
    const teaser = document.querySelector(".home-dispatch-teaser");
    const entryways = document.querySelector(".home-entryways");
    if (!teaser || !entryways) return false;

    entryways.after(teaser);
    teaser.classList.add("home-dispatch-teaser--editorial-strip");

    if (!document.querySelector("#home-dispatch-designer-pass")) {
      const style = document.createElement("style");
      style.id = "home-dispatch-designer-pass";
      style.textContent = `
        .home-dispatch-teaser--editorial-strip{
          width:min(88%,1120px)!important;
          margin:clamp(18px,3vh,34px) auto clamp(18px,3vh,34px)!important;
          padding:16px 0 17px!important;
          display:grid!important;
          grid-template-columns:minmax(180px,.72fr) minmax(0,1.28fr);
          column-gap:clamp(28px,5vw,72px);
          align-items:start;
        }
        .home-dispatch-teaser--editorial-strip .home-dispatch-teaser__kicker{margin-bottom:8px!important}
        .home-dispatch-teaser--editorial-strip h2{font-size:clamp(18px,2vw,28px)!important;line-height:1.04!important}
        .home-dispatch-teaser--editorial-strip .home-dispatch-teaser__deck{margin-top:0!important;font-size:9px!important;max-width:62ch}
        .home-dispatch-teaser--editorial-strip .home-dispatch-teaser__excerpt{margin-top:9px!important;font-size:clamp(12px,1.05vw,15px)!important}
        .home-dispatch-teaser--editorial-strip .home-dispatch-teaser__meta{margin-top:10px!important}
        @media(max-width:760px){
          .home-dispatch-teaser--editorial-strip{width:100%!important;margin:18px 0 26px!important;padding:15px 0 17px!important;display:block!important}
          .home-dispatch-teaser--editorial-strip h2{font-size:22px!important}
          .home-dispatch-teaser--editorial-strip .home-dispatch-teaser__deck{margin-top:10px!important}
          .home-dispatch-teaser--editorial-strip .home-dispatch-teaser__excerpt{font-size:14px!important}
        }
      `;
      document.head.appendChild(style);
    }
    return true;
  };

  if (!placeDispatch()) {
    const observer = new MutationObserver(() => {
      if (placeDispatch()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();