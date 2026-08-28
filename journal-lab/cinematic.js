(() => {
  "use strict";

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const injectOpenBuilds = () => {
    const now = document.querySelector("#now");
    if (!now || document.querySelector("#open-builds")) return;

    const nav = document.querySelector(".journal-index");
    if (nav && !nav.querySelector('a[href="#open-builds"]')) {
      const link = document.createElement("a");
      link.href = "#open-builds";
      link.textContent = "Open Builds";
      const systemLink = nav.querySelector('a[href="#system"]');
      nav.insertBefore(link, systemLink || null);
    }

    const section = document.createElement("section");
    section.id = "open-builds";
    section.className = "open-builds";
    section.setAttribute("aria-labelledby", "open-builds-title");
    section.innerHTML = `
      <div class="section-marker"><span>00A</span><span>OPEN BUILDS / BUILD SPONSORSHIP</span></div>
      <div class="open-builds__heading">
        <p class="journal-kicker">SOME THINGS ARE WAITING TO BE BUILT.</p>
        <h2 id="open-builds-title">Choose something you want to see exist.</h2>
        <p>Selected roadmap items are open for sponsorship. A contribution funds a bounded piece of execution—not unrestricted autonomous-agent spending—and the resulting work stays visible in the Build Journal from sponsorship through shipped evidence.</p>
      </div>
      <div class="open-builds__loop" aria-label="Build sponsorship lifecycle">
        <span>IDEA</span><span>→</span><span>OPEN BUILD</span><span>→</span><span>SPONSORED</span><span>→</span><span>AGENTS EXECUTE</span><span>→</span><span>TK OVERSEES</span><span>→</span><span>SHIPPED</span><span>→</span><span>JOURNAL EVIDENCE</span>
      </div>
      <div class="open-builds__grid">
        <article class="open-build">
          <div class="open-build__eyebrow"><span>ALVIRA</span><span>READY TO BUILD</span></div>
          <h3>Context portability</h3>
          <p>Make an ALVIRA context profile portable between compatible AI environments without collapsing the context model into a generic export file.</p>
          <dl>
            <div><dt>Agent execution</dt><dd>$18–35</dd></div>
            <div><dt>Human oversight</dt><dd>~1–2 hrs</dd></div>
            <div><dt>Complexity</dt><dd>Medium</dd></div>
            <div><dt>Confidence</dt><dd>High</dd></div>
          </dl>
          <a class="open-build__cta" href="/connect?intent=sponsor-alvira-context-portability">Sponsor this build <span aria-hidden="true">→</span></a>
        </article>
        <article class="open-build">
          <div class="open-build__eyebrow"><span>AILHAT</span><span>SCOPE READY</span></div>
          <h3>First-value portfolio loop</h3>
          <p>Tighten the path from account creation to adding products, connecting a source, receiving a first scan, and seeing one grounded recommendation.</p>
          <dl>
            <div><dt>Agent execution</dt><dd>$28–55</dd></div>
            <div><dt>Human oversight</dt><dd>~2–3 hrs</dd></div>
            <div><dt>Complexity</dt><dd>Medium</dd></div>
            <div><dt>Confidence</dt><dd>Medium–high</dd></div>
          </dl>
          <a class="open-build__cta" href="/connect?intent=sponsor-ailhat-first-value-loop">Sponsor this build <span aria-hidden="true">→</span></a>
        </article>
        <article class="open-build">
          <div class="open-build__eyebrow"><span>LEDGATO</span><span>NEEDS PROOF</span></div>
          <h3>Operational engine path</h3>
          <p>Move beyond the serverless “engine unavailable” boundary toward one narrow, demonstrably live enforcement path with observable execution evidence.</p>
          <dl>
            <div><dt>Agent execution</dt><dd>$45–90</dd></div>
            <div><dt>Human oversight</dt><dd>~3–5 hrs</dd></div>
            <div><dt>Complexity</dt><dd>High</dd></div>
            <div><dt>Confidence</dt><dd>Medium</dd></div>
          </dl>
          <a class="open-build__cta" href="/connect?intent=sponsor-ledgato-engine-path">Sponsor this build <span aria-hidden="true">→</span></a>
        </article>
      </div>
      <p class="open-builds__note"><strong>PILOT ESTIMATES.</strong> Cost and oversight ranges are working estimates for bounded execution. Scope is confirmed before sponsorship is accepted. Completed work becomes part of the permanent record: <span>Sponsored → Built → Shipped → Evidence.</span></p>
    `;
    now.insertAdjacentElement("afterend", section);

    const style = document.createElement("style");
    style.id = "open-builds-style";
    style.textContent = `
      .open-builds{border-top:1px solid var(--journal-rule);padding:clamp(64px,9vw,132px) 0}
      .open-builds__heading{display:grid;grid-template-columns:minmax(0,.34fr) minmax(0,1fr);column-gap:clamp(36px,7vw,120px);align-items:start}
      .open-builds__heading .journal-kicker{grid-column:1}
      .open-builds__heading h2{grid-column:2;margin:0;font-size:clamp(50px,7.5vw,118px);font-weight:500;line-height:.86;letter-spacing:-.06em}
      .open-builds__heading>p:last-child{grid-column:2;max-width:780px;margin:32px 0 0;color:var(--journal-muted);font-size:15px;line-height:1.65}
      .open-builds__loop{display:flex;flex-wrap:wrap;gap:8px 14px;margin:clamp(52px,7vw,92px) 0 24px;padding:14px 0;border-top:1px solid var(--journal-rule);border-bottom:1px solid var(--journal-rule);color:var(--journal-muted);font-size:9px;letter-spacing:.13em;text-transform:uppercase}
      .open-builds__loop span:nth-child(even){color:var(--journal-acid)}
      .open-builds__grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-top:1px solid var(--journal-rule);border-left:1px solid var(--journal-rule)}
      .open-build{display:flex;min-width:0;flex-direction:column;padding:24px;border-right:1px solid var(--journal-rule);border-bottom:1px solid var(--journal-rule)}
      .open-build__eyebrow{display:flex;justify-content:space-between;gap:18px;color:var(--journal-muted);font-size:9px;letter-spacing:.14em;text-transform:uppercase}
      .open-build__eyebrow span:last-child{color:var(--journal-acid);text-align:right}
      .open-build h3{margin:72px 0 18px;font-size:clamp(34px,4vw,62px);font-weight:500;line-height:.9;letter-spacing:-.05em}
      .open-build>p{min-height:96px;margin:0;color:var(--journal-muted);font-size:13px;line-height:1.55}
      .open-build dl{margin:36px 0 0;border-top:1px solid var(--journal-rule)}
      .open-build dl div{display:grid;grid-template-columns:1fr auto;gap:18px;padding:10px 0;border-bottom:1px solid var(--journal-rule)}
      .open-build dt{color:var(--journal-muted);font-size:9px;letter-spacing:.12em;text-transform:uppercase}
      .open-build dd{margin:0;font-size:12px}
      .open-build__cta{display:inline-flex;align-items:center;gap:10px;align-self:flex-start;margin-top:34px;text-decoration:none;font-size:10px;font-weight:700;letter-spacing:.13em;text-transform:uppercase}
      .open-build__cta span{color:var(--journal-acid);transition:transform .25s ease}
      .open-build__cta:hover span,.open-build__cta:focus-visible span{transform:translateX(5px)}
      .open-builds__note{max-width:900px;margin:26px 0 0;color:var(--journal-muted);font-size:11px;line-height:1.6}
      .open-builds__note strong{color:var(--journal-paper);letter-spacing:.1em}
      .open-builds__note span{color:var(--journal-acid)}
      @media(max-width:980px){.open-builds__heading{grid-template-columns:1fr}.open-builds__heading .journal-kicker,.open-builds__heading h2,.open-builds__heading>p:last-child{grid-column:1}.open-builds__grid{grid-template-columns:1fr}.open-build>p{min-height:0}.open-build h3{margin-top:44px}}
      @media(max-width:680px){.open-build{padding:20px 16px}.open-builds__loop{gap:7px 10px}.open-build__eyebrow{flex-direction:column;gap:6px}.open-build__eyebrow span:last-child{text-align:left}}
    `;
    document.head.appendChild(style);
  };

  injectOpenBuilds();

  const chapters = [...document.querySelectorAll("main > section")];
  const revealTargets = [...document.querySelectorAll(
    ".section-marker, .ecosystem-brief__heading, .brief-grid, .readiness, .professional-signal, .open-builds__heading, .open-builds__loop, .open-builds__grid, .open-builds__note, .system-brief__heading, .system-map, .journal-now__content, .founder-entry, .journal-feed__heading, .product-threads__intro, .thread-list, .founder-themes__body, .journal-method__body, .journal-closing > *"
  )];

  chapters.forEach((chapter, index) => {
    chapter.classList.add("cinematic-chapter");
    chapter.dataset.chapter = String(index + 1).padStart(2, "0");
  });
  revealTargets.forEach((target) => target.classList.add("cinematic-reveal"));

  const rail = document.createElement("div");
  rail.className = "curiosity-rail";
  rail.setAttribute("aria-hidden", "true");
  rail.innerHTML = '<span class="curiosity-rail__progress"></span><span class="curiosity-rail__label">Follow the thread</span>';
  document.body.append(rail);

  const updateProgress = () => {
    const scrollable = document.documentElement.scrollHeight - innerHeight;
    const progress = scrollable > 0 ? Math.min(100, Math.max(0, scrollY / scrollable * 100)) : 0;
    document.documentElement.style.setProperty("--story-progress", `${progress}%`);
  };

  if (reduceMotion || !("IntersectionObserver" in window)) {
    chapters.forEach((chapter) => chapter.classList.add("is-visible"));
    revealTargets.forEach((target) => target.classList.add("is-visible"));
    document.documentElement.style.setProperty("--readiness-progress", "60%");
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        if (entry.target.classList.contains("readiness")) {
          document.documentElement.style.setProperty("--readiness-progress", "60%");
        }
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12%", threshold: .12 });
    [...chapters, ...revealTargets].forEach((target) => observer.observe(target));
  }

  addEventListener("scroll", updateProgress, { passive: true });
  addEventListener("resize", updateProgress, { passive: true });
  updateProgress();
})();