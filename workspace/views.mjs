const VIEW_META = {
  today: {
    title: "Today.",
    deck: "What matters. What is moving. What needs you.",
    eyebrow: "Your private workspace",
    tools: []
  },
  build: {
    title: "Build.",
    deck: "Products, active workstreams, governed execution, and the systems moving them forward.",
    eyebrow: "Operating the portfolio",
    tools: [
      {label:"Design implementation", href:"#design-implementation"},
      {label:"Build logs", href:"/workspace/build-logs/"},
      {label:"Review checklist", href:"/workspace/v3-playtest/"}
    ]
  },
  work: {
    title: "Work.",
    deck: "Career movement, professional opportunities, and useful public artifacts emerging from real work.",
    eyebrow: "Professional motion",
    tools: []
  },
  network: {
    title: "Network.",
    deck: "Sponsors, design partners, collaborators, and the relationships that can move the work.",
    eyebrow: "Relationships and outbound",
    tools: []
  },
  evidence: {
    title: "Evidence.",
    deck: "Signals, proof, decisions, contradictions, and the record behind what the system believes.",
    eyebrow: "Proof before narrative",
    tools: [
      {label:"Build logs", href:"/workspace/build-logs/"},
      {label:"Add evidence", action:"evidence"}
    ]
  },
  self: {
    title: "Self.",
    deck: "Your compass, current thesis, practical constraints, decisions, check-ins, and the evidence shaping what comes next.",
    eyebrow: "Personal operating context",
    tools: []
  }
};

const GROUPS = {
  today: [
    "#today",
    "#operator-actions-section",
    ".actual-priorities"
  ],
  build: [
    "#sprint-directive",
    "#design-implementation",
    "#deployment-budget",
    "#agentos-board-section",
    "#build",
    "#ashwood-drop",
    "details.ecosystem"
  ],
  work: [
    "#work"
  ],
  network: [
    "#network"
  ],
  evidence: [
    "#owner-intelligence",
    ".ecosystem-feed",
    "details.pulse",
    "details.workspace-connections",
    "#evidence-panel",
    "details.attention"
  ],
  self: [
    "#self-operating-model",
    "#frame",
    ".goals",
    "#checkin-details"
  ]
};

const VIEW_FOR_HASH = {
  today:"today",
  build:"build",
  "agentos-board-section":"build",
  "design-implementation":"build",
  "ashwood-drop":"build",
  work:"work",
  network:"network",
  evidence:"evidence",
  "evidence-panel":"evidence",
  self:"self",
  frame:"self",
  checkin:"self"
};

function q(selector){ return document.querySelector(selector); }

function markConnectionsDisclosure(){
  document.querySelectorAll(".workspace-shell > details.disclosure").forEach(details => {
    if (details.querySelector(".visual-pair")) details.classList.add("workspace-connections");
  });
}

function assignSections(){
  markConnectionsDisclosure();

  /* View isolation is fail-closed. Every top-level Workspace content surface
     starts hidden/unassigned, then the explicit map below assigns exactly one view. */
  const shell = q(".workspace-shell");
  const structural = new Set([
    q(".workspace-masthead"),
    q(".workspace-section-nav"),
    q(".workspace-view-intro"),
    q(".workspace-footer")
  ]);
  shell?.querySelectorAll(":scope > section, :scope > details").forEach(node => {
    if (structural.has(node)) return;
    node.dataset.workspaceView = "unassigned";
    node.dataset.workspaceActive = "false";
    node.classList.add("workspace-view-section");
  });

  Object.entries(GROUPS).forEach(([view, selectors]) => {
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(node => {
        node.dataset.workspaceView = view;
        node.dataset.workspaceActive = "false";
        node.classList.add("workspace-view-section");
      });
    });
  });
}

function renderTools(view){
  const host = q("#workspace-view-tools");
  if (!host) return;
  host.replaceChildren();

  const elitkLabel = document.createElement("label");
  elitkLabel.className = "workspace-elitk-switch";
  elitkLabel.innerHTML = '<span>ELITK</span><input type="checkbox" data-elitk-toggle aria-label="Toggle plain language"><span class="workspace-elitk-switch__track" aria-hidden="true"><span></span></span><small>Plain language</small>';
  host.append(elitkLabel);

  (VIEW_META[view]?.tools || []).forEach(tool => {
    if (tool.action === "evidence") {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = tool.label;
      button.addEventListener("click", () => q("#add-evidence")?.click());
      host.append(button);
      return;
    }
    const link = document.createElement("a");
    link.textContent = tool.label;
    link.href = tool.href;
    if (tool.external) {
      link.target = "_blank";
      link.rel = "noopener";
    }
    host.append(link);
  });
}

function syncDataHero(view){
  const hero = q("#workspace-view-data-hero");
  if (!hero) return;
  hero.hidden = !["work","network"].includes(view);
  hero.dataset.heroView = view;
}

function renderIntro(view){
  const meta = VIEW_META[view] || VIEW_META.today;
  const title = q("#workspace-title");
  const deck = q("#workspace-view-deck");
  const eyebrow = q("#workspace-view-eyebrow");
  if (title) title.textContent = meta.title;
  if (deck) deck.textContent = meta.deck;
  if (eyebrow) eyebrow.textContent = meta.eyebrow;
  renderTools(view);
  syncDataHero(view);
}

function renderUtility(view){
  document.querySelectorAll(".workspace-view-utility").forEach(node => node.remove());
  const first = document.querySelector('[data-workspace-view="' + view + '"][data-workspace-active="true"]');
  if (!first || view === "today") return;
  const utility = document.createElement("div");
  utility.className = "workspace-view-utility";
  const copy = {
    build:"<strong>Build is the execution view.</strong> AgentOS state is mirrored here; authority remains in AgentOS and ledgato.",
    work:"<strong>Work is the professional view.</strong> Keep career motion and public artifacts separate from product execution.",
    network:"<strong>Network is the relationship control center.</strong> Sponsorship, invitations, referrals, collaborators, introductions, and design partners enter here; payment is only one possible relationship.",
    evidence:"<strong>Evidence is the record.</strong> Use it to verify claims, inspect signals, and trace why priorities changed.",
    self:"<strong>Self is your decision context.</strong> Define what matters, test it against evidence, compare real paths, and let the result shape Today without turning reflection into fact."
  };
  utility.innerHTML = copy[view] || "";
  first.parentNode.insertBefore(utility, first);
  utility.dataset.workspaceView = view;
  utility.dataset.workspaceActive = "true";
  utility.classList.add("workspace-view-section");
}

function setView(view, {updateHash=true, focus=false, anchor=null} = {}){
  if (!VIEW_META[view]) view = "today";
  document.body.dataset.workspaceCurrentView = view;
  document.querySelectorAll(".workspace-view-section[data-workspace-view]").forEach(node => {
    node.dataset.workspaceActive = String(node.dataset.workspaceView === view);
  });
  document.querySelectorAll("[data-workspace-nav]").forEach(link => {
    const active = link.dataset.workspaceNav === view;
    if (active) link.setAttribute("aria-current","page");
    else link.removeAttribute("aria-current");
  });
  renderIntro(view);
  renderUtility(view);
  if (updateHash && location.hash !== "#" + view) history.replaceState(null,"","#" + view);
  if (focus) q("#workspace-title")?.focus?.({preventScroll:true});
  // A hash naming a section (e.g. #design-implementation) opens its view and then lands
  // on that section, instead of scrolling back to the top of the view.
  const target = anchor && document.getElementById(anchor);
  if (target) {
    // Sections above keep growing as their data arrives, so land again once layout settles.
    const land = () => target.scrollIntoView({behavior:"instant", block:"start"});
    requestAnimationFrame(land);
    setTimeout(() => { if (location.hash === "#" + anchor) land(); }, 900);
  }
  else window.scrollTo({top:0,behavior:"smooth"});
}

function hashAnchor(){
  const raw = location.hash.replace(/^#/,"");
  return raw && !VIEW_META[raw] && VIEW_FOR_HASH[raw] ? raw : null;
}

function initialView(){
  const raw = location.hash.replace(/^#/,"");
  return VIEW_FOR_HASH[raw] || (VIEW_META[raw] ? raw : "today");
}

function bindNavigation(){
  document.querySelectorAll("[data-workspace-nav]").forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      setView(link.dataset.workspaceNav);
    });
  });
  window.addEventListener("hashchange", () => setView(initialView(), {updateHash:false, anchor:hashAnchor()}));
}

function start(){
  assignSections();
  bindNavigation();
  document.body.dataset.workspaceViewReady = "true";
  setView(initialView(), {updateHash:false, anchor:hashAnchor()});
}

start();
