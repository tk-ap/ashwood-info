// Full-screen image viewer for the portfolio page.
//
// Every image inside <main> is a viewer trigger, so new frames added to any grid are
// picked up without touching this file. The viewer is a gallery rather than a single
// image: arrow keys, on-screen controls, and swipe move between frames, because the
// archive is large enough that open-close-open per image is the wrong interaction.
//
// Keyboard and screen-reader support is deliberate, not incidental. An <img> is not
// focusable and has no implicit activation, so each trigger is given a button role,
// a tab stop, and Enter/Space handling; without that the entire archive is
// unreachable for anyone not using a mouse.
document.addEventListener("DOMContentLoaded", () => {
  const images = [...document.querySelectorAll("main img")];
  if (!images.length) return;

  // Pre-existing workaround: this asset 404s from a stale cache entry for some
  // visitors, and a cache-busted retry fixes it. Kept as-is.
  images.forEach((img) => {
    if (img.src.includes("/assets/modeling/88800408.jpg") && !img.src.includes("?v=")) {
      img.addEventListener("error", () => {
        if (img.dataset.retried) return;
        img.dataset.retried = "true";
        img.src = "/assets/modeling/88800408.jpg?v=20260827-image4";
      }, { once: true });
    }
  });

  const overlay = document.createElement("div");
  overlay.className = "portfolio-lightbox";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Image viewer");
  overlay.hidden = true;
  overlay.innerHTML = [
    '<button type="button" class="portfolio-lightbox__close" aria-label="Close image viewer">×</button>',
    '<button type="button" class="portfolio-lightbox__nav portfolio-lightbox__nav--prev" aria-label="Previous image">‹</button>',
    '<figure class="portfolio-lightbox__figure"><img alt=""><figcaption class="portfolio-lightbox__caption"></figcaption></figure>',
    '<button type="button" class="portfolio-lightbox__nav portfolio-lightbox__nav--next" aria-label="Next image">›</button>',
    '<p class="portfolio-lightbox__counter" aria-live="polite"></p>',
  ].join("");
  document.body.append(overlay);

  const preview = overlay.querySelector("img");
  const caption = overlay.querySelector(".portfolio-lightbox__caption");
  const counter = overlay.querySelector(".portfolio-lightbox__counter");
  const closeButton = overlay.querySelector(".portfolio-lightbox__close");
  const prevButton = overlay.querySelector(".portfolio-lightbox__nav--prev");
  const nextButton = overlay.querySelector(".portfolio-lightbox__nav--next");
  const focusable = [closeButton, prevButton, nextButton];

  let current = 0;
  let lastTrigger = null;

  // Warming the neighbours means arrowing through the gallery does not flash.
  const warm = (index) => {
    const img = images[(index + images.length) % images.length];
    if (!img) return;
    const pre = new Image();
    pre.src = img.currentSrc || img.src;
  };

  const show = (index) => {
    current = (index + images.length) % images.length;
    const img = images[current];
    preview.src = img.currentSrc || img.src;
    preview.alt = img.alt || "";
    caption.textContent = img.alt || "";
    counter.textContent = `${current + 1} / ${images.length}`;
    warm(current + 1);
    warm(current - 1);
  };

  const open = (index, trigger) => {
    lastTrigger = trigger || null;
    overlay.hidden = false;
    // Reflow before adding the class so the opacity transition actually runs.
    void overlay.offsetWidth;
    overlay.classList.add("is-open");
    document.body.classList.add("lightbox-open");
    show(index);
    closeButton.focus();
  };

  const close = () => {
    overlay.classList.remove("is-open");
    document.body.classList.remove("lightbox-open");
    overlay.hidden = true;
    if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
    lastTrigger = null;
  };

  const isOpen = () => overlay.classList.contains("is-open");

  images.forEach((img, index) => {
    img.style.cursor = "zoom-in";
    img.setAttribute("role", "button");
    img.setAttribute("tabindex", "0");
    if (img.alt) img.setAttribute("aria-label", `View ${img.alt} full screen`);
    img.addEventListener("click", () => open(index, img));
    img.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " " && event.key !== "Spacebar") return;
      event.preventDefault();
      open(index, img);
    });
    // Warm the full view before it is asked for.
    const prefetch = () => warm(index);
    img.addEventListener("pointerenter", prefetch, { once: true });
    img.addEventListener("focus", prefetch, { once: true });
  });

  closeButton.addEventListener("click", close);
  prevButton.addEventListener("click", () => show(current - 1));
  nextButton.addEventListener("click", () => show(current + 1));

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay || event.target.classList.contains("portfolio-lightbox__figure")) close();
  });

  document.addEventListener("keydown", (event) => {
    if (!isOpen()) return;
    if (event.key === "Escape") { close(); return; }
    if (event.key === "ArrowLeft") { event.preventDefault(); show(current - 1); return; }
    if (event.key === "ArrowRight") { event.preventDefault(); show(current + 1); return; }
    if (event.key !== "Tab") return;
    // Keep focus inside the dialog while it is open.
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  // Swipe, with a threshold high enough that a tap or a slight drag does not advance.
  let touchStartX = null;
  overlay.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });
  overlay.addEventListener("touchend", (event) => {
    if (touchStartX === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(delta) < 48) return;
    show(delta < 0 ? current + 1 : current - 1);
  }, { passive: true });
});
