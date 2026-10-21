(() => {
  "use strict";

  /* Each public orientation route owns a small, intentional visual pool.
     One image is selected per card at render time, so the orientation page
     keeps the homepage's sense of discovery without changing the route itself. */
  const visualPools = {
    career: [
      "/assets/digitals2026/about-portrait-upright.jpg",
      "/assets/digitals2026/IMG_7201-web.jpg"
    ],
    creative: [
      "/assets/campaigns/barelysain/hero-6729.jpg",
      "/assets/campaigns/barelysain/barelysain-alley.webp",
      "/assets/performance/forthem-poster.jpg"
    ],
    builds: [
      "/assets/social/ashwood-og-1200x630.jpg",
      "/assets/modeling/archive-motion-blur.jpg"
    ],
    connect: [
      "/assets/digitals2026/IMG_7192-hero-web.jpg",
      "/assets/digitals2026/IMG_7202.jpg",
      "/assets/digitals2026/about-portrait-upright.jpg"
    ]
  };

  for (const card of document.querySelectorAll("[data-route-visual]")) {
    const pool = visualPools[card.dataset.routeVisual] ?? [];
    const image = card.querySelector(".work-route-card__visual img");
    if (!image || pool.length === 0) continue;

    const source = pool[Math.floor(Math.random() * pool.length)];
    image.src = source;
    image.dataset.visualSource = source;
  }
})();
