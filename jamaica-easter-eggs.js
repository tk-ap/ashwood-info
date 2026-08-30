(() => {
  "use strict";

  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/" && path !== "/index.html") return;

  const reveal = document.createElement("div");
  reveal.className = "ashwood-jm-reveal";
  reveal.setAttribute("role", "status");
  reveal.setAttribute("aria-live", "polite");
  document.body.appendChild(reveal);

  let revealTimer = 0;
  const show = ({ anchor, kicker, title, note, duration = 4200 }) => {
    window.clearTimeout(revealTimer);
    reveal.innerHTML = `<span class="ashwood-jm-reveal__kicker">${kicker}</span><span class="ashwood-jm-reveal__title">${title}</span><span class="ashwood-jm-reveal__note">${note}</span>`;
    const rect = anchor?.getBoundingClientRect?.();
    if (rect && window.innerWidth > 760) {
      reveal.style.left = `${Math.min(window.innerWidth - 350, Math.max(18, rect.left))}px`;
      reveal.style.top = `${Math.min(window.innerHeight - 150, rect.bottom + 14)}px`;
      reveal.style.right = "auto";
      reveal.style.bottom = "auto";
    }
    reveal.classList.add("is-visible");
    revealTimer = window.setTimeout(() => reveal.classList.remove("is-visible"), duration);
  };

  const wordmark = document.querySelector(".wordmark");
  const masthead = document.querySelector(".masthead");
  if (wordmark && masthead) {
    wordmark.classList.add("ashwood-jm-xaymaca");
    wordmark.setAttribute("title", "A deeper layer is hidden here.");

    const inline = document.createElement("p");
    inline.className = "ashwood-jm-xaymaca-inline";
    inline.setAttribute("aria-live", "polite");
    inline.innerHTML = '<span class="ashwood-jm-xaymaca-inline__name">XAYMACA</span><span class="ashwood-jm-xaymaca-inline__meaning">Land of wood and water</span><span class="ashwood-jm-xaymaca-inline__context">Jamaica’s name is believed to derive from the Taíno Xaymaca — a quiet resonance inside ASHWOOD.</span>';
    masthead.appendChild(inline);

    let holdTimer = 0;
    const openXaymaca = () => inline.classList.add("is-visible");
    const closeXaymaca = () => inline.classList.remove("is-visible");
    wordmark.addEventListener("pointerenter", () => { holdTimer = window.setTimeout(openXaymaca, 500); });
    wordmark.addEventListener("pointerleave", () => { window.clearTimeout(holdTimer); closeXaymaca(); });
    wordmark.addEventListener("focus", openXaymaca);
    wordmark.addEventListener("blur", closeXaymaca);
  }

  const motto = document.querySelector(".iridescent-word--jamaica");
  if (motto) {
    motto.tabIndex = 0;
    motto.setAttribute("role", "button");
    motto.setAttribute("aria-label", "Reveal the Jamaican motto reference behind Out of One");
    const openMotto = () => {
      motto.classList.add("ashwood-jm-active");
      show({
        anchor: motto,
        kicker: "PROVENANCE / JAMAICA",
        title: "Out of Many, One People.",
        note: "ASHWOOD’s “Out of One, Many Becomings” is a deliberate inversion of Jamaica’s national motto.",
        duration: 5000
      });
      window.setTimeout(() => motto.classList.remove("ashwood-jm-active"), 1800);
    };
    motto.addEventListener("click", openMotto);
    motto.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openMotto(); }
    });
  }

  const field = document.querySelector(".principles-field");
  if (field && !field.querySelector(".ashwood-jm-1962")) {
    const independence = document.createElement("button");
    independence.type = "button";
    independence.className = "ashwood-jm-1962";
    independence.textContent = "06 · 08 · 1962";
    independence.setAttribute("aria-label", "Jamaica independence date: August 6, 1962");
    independence.addEventListener("click", () => show({
      anchor: independence,
      kicker: "INDEPENDENCE / JAMAICA",
      title: "6 August 1962.",
      note: "A small coordinate in the field for the year Jamaica became independent."
    }));
    field.appendChild(independence);
  }

  const doctorBird = () => {
    const bloom = document.querySelector(".becomings-bloom");
    if (!bloom) return false;
    bloom.classList.add("ashwood-jm-doctorbird");
    const trigger = document.querySelector(".becomings-trigger");
    if (trigger && !trigger.dataset.jmDoctorBird) {
      trigger.dataset.jmDoctorBird = "1";
      let activations = 0;
      trigger.addEventListener("click", () => {
        activations += 1;
        if (activations === 3) show({
          anchor: trigger,
          kicker: "NATURE / JAMAICA",
          title: "Doctor Bird.",
          note: "The opening wing-pair is a quiet nod to Jamaica’s national bird, the swallow-tail hummingbird."
        });
      });
    }
    return true;
  };

  if (!doctorBird()) {
    const observer = new MutationObserver(() => { if (doctorBird()) observer.disconnect(); });
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
