(() => {
  "use strict";

  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/" && path !== "/index.html") return;

  const field = document.querySelector(".principles-field");
  if (!field) return;

  // Stability guard: reserve the Doctor Bird runtime slot so older automatic
  // bird observers do not mount while the high-detail animation is being rebuilt.
  if (!document.querySelector(".ashwood-doctor-bird-cursor")) {
    const sentinel = document.createElement("span");
    sentinel.className = "ashwood-doctor-bird-cursor ashwood-doctor-bird-cursor--stability-guard";
    sentinel.hidden = true;
    sentinel.setAttribute("aria-hidden", "true");
    document.body.appendChild(sentinel);
  }

  const labelDoc = () => {
    document.querySelectorAll("[data-ashwood-bird-guide]").forEach((element) => {
      const nextLabel = "Follow Doc →";
      if (element.textContent.trim() !== nextLabel) element.textContent = nextLabel;
      if (element.getAttribute("aria-label") !== "Follow Doc, ASHWOOD guide") {
        element.setAttribute("aria-label", "Follow Doc, ASHWOOD guide");
      }
    });
  };

  labelDoc();

  // Do not observe childList here. The previous implementation watched the
  // same subtree it rewrote, creating a self-triggering MutationObserver loop.
  // A single deferred pass catches the field-guide control after it mounts.
  requestAnimationFrame(() => requestAnimationFrame(labelDoc));
  window.addEventListener("load", labelDoc, { once: true });

  const revealPattern = () => {
    const reveal = document.querySelector(".ashwood-field-guide__reveal");
    if (reveal) {
      reveal.click();
      return;
    }
    const entry = document.querySelector("[data-capability-entry]");
    if (entry) entry.click();
  };

  document.addEventListener("ashwood:start-bird-guide", revealPattern);
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-ashwood-bird-guide]");
    if (!trigger) return;
    event.preventDefault();
    revealPattern();
  });
})();
