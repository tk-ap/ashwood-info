(() => {
  const routes = ["/portfolio/", "/music/", "/journal/", "/about/"];
  const target = routes[Math.floor(Math.random() * routes.length)];
  const link = document.querySelector(".iridescent-word");
  if (link) {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      try { sessionStorage.setItem("ashwood.curiosity.walkthrough", "1"); } catch (_) {}
      window.location.assign(`${target}?curious=1`);
    });
  }

  const hotspots = [...document.querySelectorAll(".principle-hotspot")];
  if (!hotspots.length) return;

  const STORAGE_KEY = "ashwood.curiosity.hotspots.v1";
  const REWARD_KEY = "ashwood.curiosity.reward.v1";
  const hotspotId = (hotspot, index) => {
    const namedClass = [...hotspot.classList].find((name) => name.startsWith("principle-hotspot--"));
    return namedClass ? namedClass.replace("principle-hotspot--", "") : `hotspot-${index + 1}`;
  };
  const ids = hotspots.map(hotspotId);
  let discovered = new Set();

  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(stored)) discovered = new Set(stored.filter((id) => ids.includes(id)));
  } catch (_) {}

  const style = document.createElement("style");
  style.textContent = `
    .ashwood-curiosity-progress{position:fixed;right:clamp(22px,3vw,48px);top:50%;z-index:73;display:flex;flex-direction:column;gap:7px;transform:translateY(-50%);pointer-events:none;opacity:.38;transition:opacity .28s ease}
    .ashwood-curiosity-progress span{display:block;width:3px;height:3px;border-radius:50%;background:var(--ashwood-muted);box-shadow:0 0 0 rgba(180,135,50,0);transition:background .28s ease,box-shadow .32s ease,transform .28s ease}
    .ashwood-curiosity-progress span.is-found{background:var(--ashwood-gold);box-shadow:0 0 9px rgba(214,194,74,.48);transform:scale(1.45)}
    .ashwood-curiosity-reward{position:fixed;inset:0;z-index:82;display:grid;place-items:center;pointer-events:none;opacity:0;visibility:hidden;transition:opacity .5s ease,visibility 0s linear .5s}
    .ashwood-curiosity-reward::before{content:"";position:absolute;left:62%;top:43%;width:min(54vmax,760px);height:min(54vmax,760px);border-radius:50%;background:radial-gradient(circle,rgba(214,194,74,.12) 0%,rgba(180,135,50,.045) 31%,transparent 68%);transform:translate(-50%,-50%) scale(.12);opacity:0}
    .ashwood-curiosity-reward__constellation{position:absolute;left:62%;top:43%;width:190px;height:190px;transform:translate(-50%,-50%)}
    .ashwood-curiosity-reward__constellation span{position:absolute;left:50%;top:50%;width:5px;height:5px;border-radius:50%;background:var(--ashwood-gold);box-shadow:0 0 14px rgba(214,194,74,.68);opacity:0;transform:translate(-50%,-50%) scale(.15)}
    .ashwood-curiosity-reward__constellation span:nth-child(1){--x:-74px;--y:-35px}.ashwood-curiosity-reward__constellation span:nth-child(2){--x:-22px;--y:-78px}.ashwood-curiosity-reward__constellation span:nth-child(3){--x:62px;--y:-48px}.ashwood-curiosity-reward__constellation span:nth-child(4){--x:76px;--y:31px}.ashwood-curiosity-reward__constellation span:nth-child(5){--x:12px;--y:76px}.ashwood-curiosity-reward__constellation span:nth-child(6){--x:-68px;--y:48px}
    .ashwood-curiosity-reward__offering{position:absolute;left:62%;top:43%;width:min(360px,72vw);padding-top:118px;transform:translate(-50%,-50%);text-align:center;pointer-events:auto;opacity:0}
    .ashwood-curiosity-reward__eyebrow{margin:0 0 10px;color:var(--ashwood-gold);font-size:9px;letter-spacing:.18em;text-transform:uppercase}.ashwood-curiosity-reward__title{margin:0;font-family:Georgia,serif;font-size:clamp(23px,2.7vw,38px);font-weight:400;line-height:1.05}.ashwood-curiosity-reward__copy{max-width:310px;margin:12px auto 0;color:var(--ashwood-muted);font-size:11px;line-height:1.55}.ashwood-curiosity-reward__actions{display:flex;justify-content:center;align-items:center;gap:16px;flex-wrap:wrap;margin-top:16px}.ashwood-curiosity-reward__link,.ashwood-curiosity-reward__reset{display:inline-block;color:inherit;font:inherit;font-size:10px;letter-spacing:.15em;text-decoration:none;text-transform:uppercase}.ashwood-curiosity-reward__reset{border:0;padding:0;background:none;color:var(--ashwood-muted);cursor:pointer}.ashwood-curiosity-reward__link:hover,.ashwood-curiosity-reward__link:focus-visible,.ashwood-curiosity-reward__reset:hover,.ashwood-curiosity-reward__reset:focus-visible{color:var(--ashwood-gold);font-style:italic}
    .ashwood-curiosity-reward.is-earned{opacity:1;visibility:visible;transition-delay:0s}.ashwood-curiosity-reward.is-earned::before{animation:ashwood-curiosity-aura 4.8s cubic-bezier(.16,.8,.24,1) both}.ashwood-curiosity-reward.is-earned .ashwood-curiosity-reward__constellation span{animation:ashwood-curiosity-star 1.15s cubic-bezier(.16,.8,.24,1) both}.ashwood-curiosity-reward.is-earned .ashwood-curiosity-reward__constellation span:nth-child(2){animation-delay:.08s}.ashwood-curiosity-reward.is-earned .ashwood-curiosity-reward__constellation span:nth-child(3){animation-delay:.16s}.ashwood-curiosity-reward.is-earned .ashwood-curiosity-reward__constellation span:nth-child(4){animation-delay:.24s}.ashwood-curiosity-reward.is-earned .ashwood-curiosity-reward__constellation span:nth-child(5){animation-delay:.32s}.ashwood-curiosity-reward.is-earned .ashwood-curiosity-reward__constellation span:nth-child(6){animation-delay:.4s}.ashwood-curiosity-reward.is-earned .ashwood-curiosity-reward__offering{animation:ashwood-curiosity-offering .8s ease 1.1s both}
    .ashwood-curiosity-reward.is-remembered{opacity:1;visibility:visible}.ashwood-curiosity-reward.is-remembered::before{opacity:.34;transform:translate(-50%,-50%) scale(1)}.ashwood-curiosity-reward.is-remembered .ashwood-curiosity-reward__constellation span{opacity:.68;transform:translate(calc(-50% + var(--x)),calc(-50% + var(--y))) scale(.8)}.ashwood-curiosity-reward.is-remembered .ashwood-curiosity-reward__offering{opacity:.72}
    @keyframes ashwood-curiosity-star{0%{opacity:0;transform:translate(-50%,-50%) scale(.15)}55%{opacity:1}100%{opacity:.82;transform:translate(calc(-50% + var(--x)),calc(-50% + var(--y))) scale(1)}}
    @keyframes ashwood-curiosity-aura{0%{opacity:0;transform:translate(-50%,-50%) scale(.12)}30%{opacity:.85}100%{opacity:.22;transform:translate(-50%,-50%) scale(1.28)}}
    @keyframes ashwood-curiosity-offering{from{opacity:0;transform:translate(-50%,calc(-50% + 10px))}to{opacity:1;transform:translate(-50%,-50%)}}
    @media(max-width:760px){.ashwood-curiosity-progress{right:13px}.ashwood-curiosity-reward::before,.ashwood-curiosity-reward__constellation,.ashwood-curiosity-reward__offering{left:50%;top:47%}.ashwood-curiosity-reward__offering{padding-top:106px}}
    @media(prefers-reduced-motion:reduce){.ashwood-curiosity-reward.is-earned::before,.ashwood-curiosity-reward.is-earned .ashwood-curiosity-reward__constellation span,.ashwood-curiosity-reward.is-earned .ashwood-curiosity-reward__offering{animation:none!important}.ashwood-curiosity-reward.is-earned::before{opacity:.25;transform:translate(-50%,-50%) scale(1)}.ashwood-curiosity-reward.is-earned .ashwood-curiosity-reward__constellation span{opacity:.75;transform:translate(calc(-50% + var(--x)),calc(-50% + var(--y))) scale(1)}.ashwood-curiosity-reward.is-earned .ashwood-curiosity-reward__offering{opacity:1}}
  `;
  document.head.append(style);

  const progress = document.createElement("div");
  progress.className = "ashwood-curiosity-progress";
  progress.setAttribute("aria-hidden", "true");
  progress.innerHTML = ids.map((id) => `<span data-hotspot-progress="${id}"></span>`).join("");
  document.body.append(progress);

  const reward = document.createElement("aside");
  reward.className = "ashwood-curiosity-reward";
  reward.setAttribute("aria-live", "polite");
  reward.innerHTML = `
    <div class="ashwood-curiosity-reward__constellation" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span></div>
    <div class="ashwood-curiosity-reward__offering">
      <p class="ashwood-curiosity-reward__eyebrow">SIX / SIX · CURIOSITY REWARDED</p>
      <p class="ashwood-curiosity-reward__title">You found the thread.</p>
      <p class="ashwood-curiosity-reward__copy">There is always another layer. This one is for the people who stayed long enough to notice.</p>
      <div class="ashwood-curiosity-reward__actions">
        <a class="ashwood-curiosity-reward__link" href="/dive-deeper?found=all-six">Dive deeper →</a>
        <button class="ashwood-curiosity-reward__reset" type="button">Reset discovery</button>
      </div>
    </div>`;
  document.body.append(reward);

  const updateProgress = () => {
    progress.querySelectorAll("[data-hotspot-progress]").forEach((dot) => {
      dot.classList.toggle("is-found", discovered.has(dot.dataset.hotspotProgress));
    });
  };

  let rewardedThisVisit = false;
  const unlockReward = (remembered = false) => {
    if (rewardedThisVisit) return;
    rewardedThisVisit = true;
    reward.classList.add(remembered ? "is-remembered" : "is-earned");
    document.body.classList.add("has-found-all-hotspots");
    try { localStorage.setItem(REWARD_KEY, "1"); } catch (_) {}
  };

  const resetDiscovery = () => {
    discovered = new Set();
    rewardedThisVisit = false;
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(REWARD_KEY);
    } catch (_) {}
    hotspots.forEach((hotspot) => hotspot.classList.remove("is-discovered", "is-revealed", "is-near"));
    updateProgress();
    reward.classList.remove("is-earned", "is-remembered");
    document.body.classList.remove("has-found-all-hotspots");
    const field = document.querySelector(".principles-field");
    if (field) field.classList.remove("is-pinned", "is-exploring");
    const firstHotspot = hotspots[0];
    if (firstHotspot) firstHotspot.focus({ preventScroll: true });
  };

  const markDiscovered = (hotspot) => {
    const index = hotspots.indexOf(hotspot);
    if (index < 0) return;
    const id = ids[index];
    if (discovered.has(id)) return;
    discovered.add(id);
    hotspot.classList.add("is-discovered");
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...discovered])); } catch (_) {}
    updateProgress();
    if (discovered.size === hotspots.length) unlockReward(false);
  };

  hotspots.forEach((hotspot) => {
    const observer = new MutationObserver(() => {
      if (hotspot.classList.contains("is-near") || hotspot.classList.contains("is-revealed")) markDiscovered(hotspot);
    });
    observer.observe(hotspot, { attributes: true, attributeFilter: ["class"] });
    hotspot.addEventListener("focus", () => markDiscovered(hotspot));
    hotspot.addEventListener("click", () => markDiscovered(hotspot));
  });

  reward.querySelector(".ashwood-curiosity-reward__reset")?.addEventListener("click", resetDiscovery);

  updateProgress();
  hotspots.forEach((hotspot, index) => hotspot.classList.toggle("is-discovered", discovered.has(ids[index])));

  let rememberedReward = false;
  try { rememberedReward = localStorage.getItem(REWARD_KEY) === "1" && discovered.size === hotspots.length; } catch (_) {}
  if (rememberedReward) unlockReward(true);
})();
