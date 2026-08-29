(() => {
  "use strict";

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const normalizedPath = window.location.pathname.replace(/\/$/, "") || "/";

  const style = document.createElement("style");
  style.id = "ashwood-scroll-core-style";
  style.textContent = `
    html.ashwood-scroll-ready [data-scroll-reveal]{
      opacity:0;
      transform:translateY(18px);
      filter:blur(2px);
      transition:opacity .72s ease,transform .78s cubic-bezier(.16,.8,.24,1),filter .72s ease;
      transition-delay:var(--ashwood-scroll-delay,0ms)
    }
    html.ashwood-scroll-ready [data-scroll-reveal="image"]{
      transform:translateY(20px) scale(.992);
      filter:blur(1.5px)
    }
    html.ashwood-scroll-ready [data-scroll-reveal].is-in-view{
      opacity:1;
      transform:translateY(0) scale(1);
      filter:blur(0)
    }
    [data-scroll-stage].is-scroll-active{--ashwood-stage-presence:1}

    body.ashwood-home-native .intro[data-scroll-stage].is-scroll-past{opacity:.94}
    body.ashwood-home-native .principles-field[data-scroll-stage].is-scroll-active::before{opacity:.58}
    body.ashwood-home-native .ashwood-capability-evidence{transition:opacity .45s ease,transform .45s ease}
    body.ashwood-home-native .ashwood-capability-evidence.is-scroll-active{opacity:1;transform:translateY(0)}
    body.ashwood-home-native .home-now{transition:opacity .45s ease}
    body.ashwood-home-native .home-now.is-scroll-active{opacity:1}

    .about-page .family-archive[data-scroll-stage]{transition:opacity .7s ease,filter .7s ease}
    .about-page .family-archive[data-scroll-stage]:not(.is-scroll-active){opacity:.82;filter:saturate(.9)}
    .about-page .family-archive[data-scroll-stage].is-scroll-active{opacity:1;filter:saturate(1.04)}
    .about-page .note[data-scroll-reveal]{max-width:72ch}

    .portfolio-page [data-scroll-stage].is-scroll-active .section-kicker{opacity:1}
    .portfolio-page .asset-frame[data-scroll-reveal="image"]{will-change:transform,opacity}
    .portfolio-page #work[data-scroll-stage].is-scroll-active .asset-frame,
    .portfolio-page #runway[data-scroll-stage].is-scroll-active .asset-frame{filter:saturate(1)}

    @media(max-width:760px){
      html.ashwood-scroll-ready [data-scroll-reveal]{transform:translateY(12px)}
      html.ashwood-scroll-ready [data-scroll-reveal="image"]{transform:translateY(14px) scale(.996)}
    }
    @media(prefers-reduced-motion:reduce){
      html.ashwood-scroll-ready [data-scroll-reveal]{opacity:1!important;transform:none!important;filter:none!important;transition:none!important}
      [data-scroll-stage]{transition:none!important}
    }
  `;
  document.head.append(style);

  const stageGroups = [];
  const revealTargets = [];

  const markStage = (element, name) => {
    if (!element) return;
    element.dataset.scrollStage = name;
    stageGroups.push(element);
  };

  const markReveal = (element, type = "content", delay = 0) => {
    if (!element) return;
    element.dataset.scrollReveal = type;
    if (delay) element.style.setProperty("--ashwood-scroll-delay", `${delay}ms`);
    revealTargets.push(element);
  };

  const markSequence = (elements, type = "content", step = 70, maxDelay = 420) => {
    [...elements].forEach((element, index) => markReveal(element, type, Math.min(index * step, maxDelay)));
  };

  const configureHome = () => {
    const intro = document.querySelector(".intro");
    const field = document.querySelector(".principles-field");
    const entryways = document.querySelector(".home-entryways");
    const evidence = document.querySelector(".ashwood-capability-evidence");
    const now = document.querySelector(".home-now");

    markStage(intro, "identity");
    markStage(field, "discovery");
    markStage(entryways, "worlds");
    markStage(evidence, "throughline");
    markStage(now, "now");

    // Home is a compact orientation surface. Essential navigation and the six-signal
    // discovery field must remain available at rest. Scroll may change emphasis/state,
    // but must never gate entry into ASHWOOD or alter the field's positioning model.
  };

  const configureAbout = () => {
    const intro = document.querySelector(".about-page .page-intro");
    const archive = document.querySelector(".about-page .family-archive");
    markStage(intro, "lineage");
    markStage(archive, "archive");

    markReveal(document.querySelector(".about-page .eyebrow"));
    markReveal(document.querySelector(".about-page h1"), "content", 70);
    markReveal(document.querySelector(".about-capability-entry"));
    markSequence(document.querySelectorAll(".about-page .note"), "content", 55, 220);
    markSequence(document.querySelectorAll(".about-page .about-memory"), "image", 110, 220);
    markReveal(document.querySelector(".about-page .memory-line"));
    markReveal(document.querySelector(".about-page .easter-egg"));
  };

  const configurePortfolio = () => {
    document.querySelectorAll(".portfolio-page main > section").forEach((section, index) => {
      markStage(section, section.id || `modeling-${index + 1}`);
      markReveal(section.querySelector(".section-kicker"));
      markReveal(section.querySelector(".feature-heading,.split-heading,.about-layout>div:first-child,.details-layout>div:first-child"), "content", 60);
    });

    markReveal(document.querySelector(".portfolio-page .hero-copy"));
    markReveal(document.querySelector(".portfolio-page .hero-media"), "image", 110);
    markReveal(document.querySelector(".portfolio-page .statement p"));
    markSequence(document.querySelectorAll(".portfolio-page .campaign-grid .asset-frame"), "image", 65, 325);
    markSequence(document.querySelectorAll(".portfolio-page .archive-grid .asset-frame"), "image", 85, 255);
    markSequence(document.querySelectorAll(".portfolio-page .runway-strip .asset-frame"), "image", 85, 255);
    markSequence(document.querySelectorAll(".portfolio-page .digitals-grid .asset-frame"), "image", 65, 260);
    markReveal(document.querySelector(".portfolio-page .portrait-frame"), "image", 100);
    markSequence(document.querySelectorAll(".portfolio-page .experience-list > div"), "content", 75, 225);
    markSequence(document.querySelectorAll(".portfolio-page .contact-grid > div"), "content", 75, 225);
  };

  if (normalizedPath === "/") configureHome();
  else if (normalizedPath === "/about") configureAbout();
  else if (normalizedPath === "/portfolio") configurePortfolio();
  else return;

  root.classList.add("ashwood-scroll-ready");

  const updateProgress = () => {
    const scrollable = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const progress = scrollable ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
    root.style.setProperty("--ashwood-scroll-progress", String(progress));
  };

  const updateStages = () => {
    const anchor = window.innerHeight * .42;
    let active = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    stageGroups.forEach((stage) => {
      const rect = stage.getBoundingClientRect();
      const center = rect.top + Math.min(rect.height * .36, 220);
      const distance = Math.abs(center - anchor);
      const past = rect.bottom < anchor;
      stage.classList.toggle("is-scroll-past", past);
      if (rect.bottom > 0 && rect.top < window.innerHeight && distance < bestDistance) {
        bestDistance = distance;
        active = stage;
      }
    });

    stageGroups.forEach((stage) => stage.classList.toggle("is-scroll-active", stage === active));
    if (active) document.body.dataset.scrollStage = active.dataset.scrollStage;
  };

  const update = () => {
    updateProgress();
    updateStages();
  };

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealTargets.forEach((target) => target.classList.add("is-in-view"));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in-view");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -10%", threshold: .08 });
    revealTargets.forEach((target) => observer.observe(target));
  }

  let ticking = false;
  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  };

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate, { passive: true });
  window.addEventListener("load", requestUpdate, { once: true });
  update();
})();
