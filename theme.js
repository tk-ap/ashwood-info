(() => {
  "use strict";

  const root = document.documentElement;
  const storageKey = "ashwood.theme";
  const normalizedPath = window.location.pathname.replace(/\/$/, "") || "/";
  const themes = [
    { id: "warm-dark", short: "◐", label: "Warm dark", meta: "#0d0e0b" },
    { id: "paper-light", short: "☼", label: "Paper light", meta: "#f5f3ef" },
    { id: "phosphor-cyber", short: ">_", label: "Phosphor cyber", meta: "#020806" }
  ];

  const migrateTheme = value => {
    if (value === "light") return "paper-light";
    if (value === "dark") return "warm-dark";
    return themes.some(theme => theme.id === value) ? value : "warm-dark";
  };

  let currentTheme = "warm-dark";
  try { currentTheme = migrateTheme(localStorage.getItem(storageKey)); } catch (_) {}

  const installThemeStyles = () => {
    if (document.getElementById("ashwood-three-theme-system")) return;
    const style = document.createElement("style");
    style.id = "ashwood-three-theme-system";
    style.textContent = `
      :root{
        --ashwood-field-green:#009b3a;
        --ashwood-field-green-rgb:0,155,58;
        --ashwood-accent-2:#3f7f84;
        --ashwood-surface-elevated:color-mix(in srgb,var(--ashwood-paper) 94%,var(--ashwood-ink) 6%);
        --ashwood-glow:rgba(0,155,58,.12);
      }
      html[data-ashwood-theme="warm-dark"]{
        color-scheme:dark;
        --ashwood-paper:#0d0e0b;
        --ashwood-ink:#f2ecdf;
        --ashwood-muted:rgba(242,236,223,.62);
        --ashwood-rule:rgba(242,236,223,.20);
        --ashwood-oxblood:#bd6571;
        --ashwood-ochre:#c79b4a;
        --ashwood-gold:#e0bd5a;
        --ashwood-field-green:#2aa55e;
        --ashwood-field-green-rgb:42,165,94;
        --ashwood-accent-2:#6e9f9f;
        --ashwood-glow:rgba(42,165,94,.16);
      }
      html[data-ashwood-theme="paper-light"]{
        color-scheme:light;
        --ashwood-paper:#f5f3ef;
        --ashwood-ink:#171717;
        --ashwood-muted:rgba(23,23,23,.58);
        --ashwood-rule:rgba(23,23,23,.22);
        --ashwood-oxblood:#7b2635;
        --ashwood-ochre:#87621f;
        --ashwood-gold:#b48732;
        --ashwood-field-green:#007f36;
        --ashwood-field-green-rgb:0,127,54;
        --ashwood-accent-2:#3f7f84;
        --ashwood-glow:rgba(0,127,54,.10);
      }
      html[data-ashwood-theme="phosphor-cyber"]{
        color-scheme:dark;
        --ashwood-paper:#020806;
        --ashwood-ink:#7dffa5;
        --ashwood-muted:rgba(125,255,165,.58);
        --ashwood-rule:rgba(125,255,165,.20);
        --ashwood-oxblood:#ff61df;
        --ashwood-ochre:#c8ff59;
        --ashwood-gold:#efff55;
        --ashwood-field-green:#42ff8b;
        --ashwood-field-green-rgb:66,255,139;
        --ashwood-accent-2:#ff4ee1;
        --ashwood-glow:rgba(66,255,139,.22);
      }

      html,body{background:var(--ashwood-paper);color:var(--ashwood-ink)}
      html.ashwood-light{--ashwood-paper:#f5f3ef;--ashwood-ink:#171717;--ashwood-muted:rgba(23,23,23,.58);--ashwood-rule:rgba(23,23,23,.22)}
      html[data-ashwood-theme="warm-dark"],html[data-ashwood-theme="phosphor-cyber"]{background:var(--ashwood-paper)}
      html[data-ashwood-theme="phosphor-cyber"] body{background-image:radial-gradient(circle at 72% 14%,rgba(66,255,139,.055),transparent 27%),linear-gradient(rgba(66,255,139,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(66,255,139,.025) 1px,transparent 1px);background-size:auto,52px 52px,52px 52px}
      html[data-ashwood-theme="warm-dark"] body{background-image:radial-gradient(circle at 78% 9%,rgba(224,189,90,.035),transparent 27%),radial-gradient(circle at 18% 24%,rgba(42,165,94,.025),transparent 31%)}
      html[data-ashwood-theme="paper-light"] body{background-image:radial-gradient(circle at 82% 11%,rgba(0,127,54,.025),transparent 29%)}

      html[data-ashwood-theme="phosphor-cyber"] body::before{
        content:"";position:fixed;inset:0;z-index:9998;pointer-events:none;
        background:repeating-linear-gradient(0deg,transparent 0 2px,rgba(66,255,139,.022) 2px 3px);
        mix-blend-mode:screen;opacity:.56
      }
      html:not([data-ashwood-theme="phosphor-cyber"]) body::before{content:none}

      .ashwood-theme-switcher{
        display:inline-flex;align-items:center;gap:2px;margin-left:auto;padding:3px;
        border:1px solid color-mix(in srgb,var(--ashwood-rule) 82%,transparent);border-radius:999px;
        background:color-mix(in srgb,var(--ashwood-paper) 88%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
        box-shadow:0 4px 18px rgba(0,0,0,.05);transition:background-color .6s cubic-bezier(.4,0,.2,1),border-color .6s cubic-bezier(.4,0,.2,1),box-shadow .6s cubic-bezier(.4,0,.2,1)
      }
      .ashwood-theme-switcher__button{
        min-width:31px;height:31px;display:grid;place-items:center;border:0;border-radius:999px;padding:0 9px;
        background:transparent;color:var(--ashwood-muted);cursor:pointer;font:600 9px/1 Arial,Helvetica,sans-serif;letter-spacing:.05em;
        transition:background-color .32s ease,color .32s ease,box-shadow .32s ease,transform .28s ease
      }
      .ashwood-theme-switcher__button:hover,.ashwood-theme-switcher__button:focus-visible{color:var(--ashwood-ink);transform:scale(1.04)}
      .ashwood-theme-switcher__button[aria-pressed="true"]{background:var(--ashwood-gold);color:var(--ashwood-paper);box-shadow:0 0 0 1px color-mix(in srgb,var(--ashwood-gold) 62%,transparent),0 0 16px color-mix(in srgb,var(--ashwood-glow) 84%,transparent)}
      html[data-ashwood-theme="phosphor-cyber"] .ashwood-theme-switcher__button[aria-pressed="true"]{background:var(--ashwood-field-green);color:#020806;box-shadow:0 0 15px rgba(66,255,139,.36)}
      .ashwood-theme-switcher__sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
      .theme-toggle{display:none!important}

      html.ashwood-theme-animating body,
      html.ashwood-theme-animating body *,
      html.ashwood-theme-animating body *::before,
      html.ashwood-theme-animating body *::after{
        transition-property:background-color,color,border-color,box-shadow,fill,stroke,filter,opacity!important;
        transition-duration:.62s!important;
        transition-timing-function:cubic-bezier(.4,0,.2,1)!important
      }

      html[data-ashwood-theme="phosphor-cyber"] ::selection{background:var(--ashwood-field-green);color:#020806}
      html[data-ashwood-theme="paper-light"] ::selection{background:rgba(180,135,50,.28);color:#171717}
      html[data-ashwood-theme="warm-dark"] ::selection{background:rgba(224,189,90,.32);color:#fff8ea}
      html[data-ashwood-theme="phosphor-cyber"] .iridescent-word:hover,
      html[data-ashwood-theme="phosphor-cyber"] .iridescent-word:focus-visible{background:linear-gradient(105deg,#42ff8b,#efff55 34%,#62f9ff 62%,#ff61df);-webkit-background-clip:text;background-clip:text;color:transparent}
      html[data-ashwood-theme="phosphor-cyber"] :focus-visible{outline-color:var(--ashwood-field-green)!important}

      @media(max-width:760px){
        .ashwood-theme-switcher__button{min-width:29px;width:29px;height:29px;padding:0;font-size:8px}
      }
      @media(prefers-reduced-motion:reduce){
        html.ashwood-theme-animating body,html.ashwood-theme-animating body *,html.ashwood-theme-animating body *::before,html.ashwood-theme-animating body *::after{transition:none!important}
      }
    `;
    document.head.appendChild(style);
  };

  const applyTheme = (id, animate = false) => {
    const next = migrateTheme(id);
    currentTheme = next;
    if (animate) {
      root.classList.add("ashwood-theme-animating");
      window.setTimeout(() => root.classList.remove("ashwood-theme-animating"), 700);
    }
    root.dataset.ashwoodTheme = next;
    root.classList.toggle("ashwood-light", next === "paper-light");
    document.querySelectorAll(".ashwood-theme-switcher__button").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.theme === next)));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = themes.find(theme => theme.id === next)?.meta || "#0d0e0b";
    try { localStorage.setItem(storageKey, next); } catch (_) {}
    document.dispatchEvent(new CustomEvent("ashwood:theme-change", { detail: { theme: next } }));
  };

  const createSwitcher = () => {
    const group = document.createElement("div");
    group.className = "ashwood-theme-switcher";
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", "ASHWOOD theme");
    group.innerHTML = themes.map(theme => `<button class="ashwood-theme-switcher__button" type="button" data-theme="${theme.id}" aria-label="${theme.label}" title="${theme.label}" aria-pressed="${theme.id === currentTheme}"><span aria-hidden="true">${theme.short}</span><span class="ashwood-theme-switcher__sr">${theme.label}</span></button>`).join("");
    group.addEventListener("click", event => {
      const button = event.target.closest("[data-theme]");
      if (!button || button.dataset.theme === currentTheme) return;
      applyTheme(button.dataset.theme, true);
    });
    return group;
  };

  const primaryRoutes = [
    { path: "/portfolio", label: "Modeling" },
    { path: "/music", label: "Music" },
    { path: "/journal", label: "Builds" },
    { path: "/about", label: "About" },
    { path: "/connect", label: "Connect" }
  ];
  const currentRoute = primaryRoutes.find(({ path }) => normalizedPath === path);

  const ensureSharedHeaderStyles = () => {
    if (!currentRoute || document.querySelector('link[href^="/creative-shell.css"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/creative-shell.css?v=20260828-interior1";
    document.head.append(link);
  };

  const buildSharedHeader = () => {
    if (!currentRoute) return null;
    const existing = document.querySelector(".ashwood-site-header");
    if (existing) return existing;
    const header = document.createElement("header");
    header.className = "ashwood-site-header";
    header.setAttribute("aria-label", "ASHWOOD navigation");
    header.innerHTML = `<div class="ashwood-site-header__brand-lockup"><a class="ashwood-site-header__brand" href="/" aria-label="ASHWOOD home">ASHWOOD</a><span class="ashwood-site-header__section">/ ${currentRoute.label.toUpperCase()}</span></div><nav class="ashwood-site-header__nav" aria-label="Primary">${primaryRoutes.map(({path,label})=>`<a${path===currentRoute.path?' aria-current="page"':''} href="${path}">${label}</a>`).join("")}</nav>`;
    document.querySelector(".journal-masthead,.masthead,.site-header")?.remove();
    const main = document.querySelector("main");
    if (main) document.body.insertBefore(header, main); else document.body.prepend(header);
    return header;
  };

  const mountSwitchers = () => {
    document.querySelectorAll(".theme-toggle,.ashwood-theme-switcher").forEach(node => node.remove());
    const targets = [...document.querySelectorAll(".masthead,.site-header,.ashwood-site-header,.journal-masthead")];
    targets.forEach(header => header.append(createSwitcher()));
    document.querySelectorAll("footer").forEach(footer => {
      if (!footer.querySelector(".ashwood-theme-switcher")) footer.append(createSwitcher());
    });
  };

  const installAmbientField = () => {
    if (normalizedPath !== "/" && normalizedPath !== "/about") return;
    if (document.getElementById("ashwood-responsive-field")) return;
    const style = document.createElement("style");
    style.id = "ashwood-responsive-field";
    style.textContent = `
      body.ashwood-home-native .principles-field{isolation:isolate}
      body.ashwood-home-native .principles-field::before,body.ashwood-home-native .principles-field::after{content:"";position:absolute;inset:-18%;z-index:-1;pointer-events:none;transform:translateZ(0);transition:opacity .7s ease,filter .7s ease}
      body.ashwood-home-native .principles-field::before{background:radial-gradient(circle at var(--field-x,68%) var(--field-y,42%),rgba(var(--ashwood-field-green-rgb),.10) 0 2%,rgba(var(--ashwood-field-green-rgb),.04) 12%,transparent 34%),radial-gradient(circle at var(--field-x,68%) var(--field-y,42%),transparent 0 14%,color-mix(in srgb,var(--ashwood-gold) 5%,transparent) 14.4%,transparent 15.2% 100%);opacity:.34;filter:blur(.2px);animation:ashwood-field-breathe 8s ease-in-out infinite}
      body.ashwood-home-native .principles-field::after{background:radial-gradient(circle at var(--field-x,68%) var(--field-y,42%),transparent 0 8%,rgba(var(--ashwood-field-green-rgb),.045) 8.4%,transparent 9.2% 100%);opacity:.18;transform:scale(.82);transition:opacity .45s ease,transform 1s cubic-bezier(.16,.8,.24,1)}
      body.ashwood-home-native .principles-field.is-exploring::before{opacity:.7;filter:blur(0)}body.ashwood-home-native .principles-field.is-exploring::after{opacity:.46;transform:scale(1)}body.has-found-all-hotspots .principles-field::before,body.has-found-all-hotspots .principles-field::after{opacity:.12}
      @keyframes ashwood-field-breathe{0%,100%{transform:scale(.97)}50%{transform:scale(1.025)}}
      .about-page .page-intro{isolation:isolate;--about-x:72%;--about-y:30%}.about-page .page-intro::before{content:"";position:absolute;inset:-8vh -8vw;z-index:0;pointer-events:none;background:radial-gradient(circle at var(--about-x) var(--about-y),color-mix(in srgb,var(--ashwood-gold) 8%,transparent) 0 3%,color-mix(in srgb,var(--ashwood-gold) 3%,transparent) 18%,transparent 39%),radial-gradient(circle at 78% 38%,rgba(var(--ashwood-field-green-rgb),.05),transparent 28%);opacity:.34;transition:opacity .8s ease,filter .8s ease}.about-page .page-intro.is-reading-field::before{opacity:.58;filter:saturate(1.08)}.about-page .page-intro.is-archive-near::before{opacity:.7}.about-page .page-intro>:not(.family-archive){position:relative;z-index:1}
      @media(hover:none),(pointer:coarse){body.ashwood-home-native .principles-field::before{animation:none;opacity:.26}body.ashwood-home-native .principles-field::after{display:none}.about-page .page-intro::before{opacity:.28}}
      @media(prefers-reduced-motion:reduce){body.ashwood-home-native .principles-field::before,body.ashwood-home-native .principles-field::after,.about-page .page-intro::before{animation:none!important;transition:none!important}}
    `;
    document.head.append(style);

    if (normalizedPath !== "/about") return;
    const intro = document.querySelector(".about-page .page-intro");
    const archive = document.querySelector(".about-page .family-archive");
    if (!intro || !window.matchMedia("(hover:hover) and (pointer:fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let leaveTimer;
    document.addEventListener("pointermove", event => {
      const rect = intro.getBoundingClientRect();
      const x = Math.max(0,Math.min(100,((event.clientX-rect.left)/Math.max(rect.width,1))*100));
      const y = Math.max(0,Math.min(100,((event.clientY-rect.top)/Math.max(rect.height,1))*100));
      intro.style.setProperty("--about-x",`${x}%`);intro.style.setProperty("--about-y",`${y}%`);intro.classList.add("is-reading-field");
      if (archive) { const a=archive.getBoundingClientRect(); const nearestX=Math.max(a.left,Math.min(event.clientX,a.right)); const nearestY=Math.max(a.top,Math.min(event.clientY,a.bottom)); intro.classList.toggle("is-archive-near",Math.hypot(event.clientX-nearestX,event.clientY-nearestY)<150); }
      clearTimeout(leaveTimer);leaveTimer=setTimeout(()=>intro.classList.remove("is-reading-field"),900);
    },{passive:true});
  };

  const rescueHomepageHotspots = () => {
    if (normalizedPath !== "/") return;
    const field = document.querySelector(".principles-field");
    const hotspots = [...document.querySelectorAll(".principle-hotspot")];
    if (!field || !hotspots.length || document.body.classList.contains("has-found-all-hotspots")) return;
    const compact=window.matchMedia("(max-width:760px)").matches,fieldRect=field.getBoundingClientRect();
    const protectedRects=[".masthead",".intro",".home-entryways",".home-now",".home-utility",".ashwood-home-audio"].flatMap(s=>[...document.querySelectorAll(s)]).map(el=>el.getBoundingClientRect()).filter(r=>r.width>0&&r.height>0);
    const visibleRects=hotspots.filter(h=>parseFloat(h.style.left||"0")>-100).map(h=>h.getBoundingClientRect()).filter(r=>r.width>0&&r.height>0&&r.right>fieldRect.left&&r.left<fieldRect.right);
    const overlaps=(a,b,p=0)=>a.left<b.right+p&&a.right>b.left-p&&a.top<b.bottom+p&&a.bottom>b.top-p;
    const slots=compact?[[8,34],[52,34],[10,48],[54,48],[8,63],[52,63],[20,76],[58,76]]:[[56,24],[73,27],[84,38],[50,43],[67,48],[81,56],[54,61],[70,67],[85,70],[44,54],[61,36],[76,42]];
    hotspots.forEach((hotspot,index)=>{const left=parseFloat(hotspot.style.left||"0"),rect=hotspot.getBoundingClientRect(),suppressed=left<-100||rect.right<fieldRect.left||rect.left>fieldRect.right;if(!suppressed)return;let placed=false;for(const [sx,sy] of slots){hotspot.style.left=`${sx}%`;hotspot.style.top=`${sy}%`;hotspot.style.right="auto";hotspot.style.bottom="auto";const c=hotspot.getBoundingClientRect();const inside=c.left>=fieldRect.left+4&&c.right<=fieldRect.right-4&&c.top>=fieldRect.top+4&&c.bottom<=fieldRect.bottom-4;const blocked=protectedRects.some(a=>overlaps(c,a,compact?8:16));const collides=visibleRects.some(a=>overlaps(c,a,compact?6:14));if(inside&&!blocked&&!collides){visibleRects.push(c);placed=true;break}}if(!placed){hotspot.style.left=`${compact?8+(index%2)*48:48+(index%3)*16}%`;hotspot.style.top=`${compact?36+Math.floor(index/2)*13:30+Math.floor(index/3)*25}%`;hotspot.style.right="auto";hotspot.style.bottom="auto"}});
  };

  installThemeStyles();
  applyTheme(currentTheme, false);
  ensureSharedHeaderStyles();
  buildSharedHeader();
  mountSwitchers();
  installAmbientField();

  if (normalizedPath === "/journal") import("/journal/alvira-current.js").catch(()=>{});
  document.querySelectorAll(".name-change-cta").forEach(button=>button.addEventListener("click",()=>{try{localStorage.setItem("ashwood.name-choice",button.dataset.nameChoice||"khlear")}catch(_){}const response=document.querySelector(".name-change-response");if(response)response.textContent="Noted — khlear is on the table.";button.disabled=true}));

  if (normalizedPath === "/") {
    requestAnimationFrame(()=>requestAnimationFrame(rescueHomepageHotspots));
    window.addEventListener("load",rescueHomepageHotspots,{once:true});
    let timer;window.addEventListener("resize",()=>{clearTimeout(timer);timer=setTimeout(rescueHomepageHotspots,80)},{passive:true});
  }
})();