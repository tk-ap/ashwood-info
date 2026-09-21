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
      {label:"Build logs", href:"/workspace/build-logs/"},
      {label:"Review checklist", href:"/workspace/v3-playtest/"}
    ]
  },
  work: {
    title: "Work.",
    deck: "Career movement, professional opportunities, and useful public artifacts emerging from real work.",
    eyebrow: "Professional motion",
    tools: [
      {label:"Career ops", href:"/workspace/career-ops/"}
    ]
  },
  network: {
    title: "Network.",
    deck: "Sponsors, design partners, collaborators, and the relationships that can move the work.",
    eyebrow: "Relationships and outbound",
    tools: [
      {label:"Sponsorship page", href:"/sponsor/", external:true},
      {label:"ALVIRA partners", href:"https://alviratech.vercel.app/partners", external:true}
    ]
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
    deck: "Goals, check-ins, personal framing, and the context that should shape the operating system without becoming the whole dashboard.",
    eyebrow: "Personal operating context",
    tools: []
  }
};

const GROUPS = {
  today: [
    "#today"
  ],
  build: [
    "#agentos-board-section",
    "#build",
    "#ashwood-drop",
    "details.ecosystem"
  ],
  work: [
    "#work",
    ".next-action"
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
    "#frame",
    ".goals",
    "#checkin-details"
  ]
};

const VIEW_FOR_HASH = {
  today:"today",
  build:"build",
  "agentos-board-section":"build",
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
function qa(selector){ return [...document.querySelectorAll(selector)]; }

let elitkOpen = false;

function cleanText(value, fallback = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function nodeText(selector, fallback = "") {
  return cleanText(q(selector)?.textContent, fallback);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
  })[char]);
}

function clip(value, limit = 280) {
  const text = cleanText(value);
  return text.length > limit ? text.slice(0, limit - 1).trimEnd() + "…" : text;
}

function boardCounts() {
  return qa("#agentos-board-counts span").map(node => {
    const count = cleanText(node.querySelector("b")?.textContent);
    const label = cleanText(node.textContent).replace(count, "").trim();
    return count && label ? count + " " + label : cleanText(node.textContent);
  }).filter(Boolean).join(" · ");
}

function summaryFor(view) {
  if (view === "today") {
    const owner = nodeText("#today-owner-count", "0");
    const agent = nodeText("#today-agent-count", "0");
    const objective = nodeText("#today-next-title", "The next objective is still being grounded.");
    const sessions = qa("#today-sessions article, #today-sessions .today-session").length;
    return {
      purpose: "This is the daily control room. It separates work that needs your judgment from work the system can keep moving without you.",
      current: owner + " item(s) currently need you; " + agent + " item(s) are assigned to AgentOS. The current next-focus read is “" + clip(objective, 180) + "”" + (sessions ? ", with " + sessions + " visible autonomous session(s)." : "."),
      read: "A task appearing under AgentOS means it is being tracked or worked, not that it is finished. “Next gate” means the next condition that must be satisfied before the work should move forward."
    };
  }

  if (view === "build") {
    const counts = boardCounts();
    const workstreams = nodeText("#workstream-count", "The workstream count is still loading.");
    const status = nodeText("#agentos-board-status", "The AgentOS snapshot status is not available yet.");
    return {
      purpose: "This is the product-execution view. It combines the portfolio work board with active workstreams so you can see what is moving, stuck, waiting for review, or sitting in backlog.",
      current: (counts ? "Board snapshot: " + counts + ". " : "") + clip(workstreams, 180) + " " + clip(status, 180),
      read: "The board is a mirror of operating state, not an authorization surface. A card in a lane describes where the work currently sits; it does not mean ASHWOOD moved it there or approved the action."
    };
  }

  if (view === "work") {
    const candidates = qa("#from-work-queue article, #from-work-queue .workstream-row").length;
    const opportunities = qa("#opportunity-list .next-card, #opportunity-list article").length;
    return {
      purpose: "This is the professional-motion view. It turns real work and verified evidence into career opportunities, public artifacts, or next actions without mixing those with product execution.",
      current: candidates + " evidence-backed work candidate(s) and " + opportunities + " surfaced opportunity/action item(s) are currently rendered.",
      read: "A surfaced candidate is not the same as a completed result, job lead, or publishable claim. It is material worth reviewing because the underlying work may support a useful professional action."
    };
  }

  if (view === "network") {
    const pipeline = clip(nodeText("#partnership-pipeline", "No sponsor or partner pipeline data is currently rendered."), 260);
    return {
      purpose: "This is the relationship and outbound view. It is for sponsors, design partners, collaborators, and follow-ups that may help move work already in progress.",
      current: pipeline,
      read: "Pipeline status is relationship state, not product progress. A sparse pipeline means the tracker has little recorded data; it does not mean there are no possible partners or sponsors."
    };
  }

  if (view === "evidence") {
    const feed = nodeText("#ecosystem-feed-status", "The ecosystem signal feed is still loading.");
    const attention = qa("#attention-list .attention-row, #attention-list article").length;
    const pulse = qa("#pulse-grid .pulse-card").map(node => cleanText(node.textContent)).filter(Boolean).slice(0, 4).join(" · ");
    return {
      purpose: "This is the proof layer. It collects signals, confidence, contradictions, activity, and source-backed evidence so claims about the ecosystem can be checked before they become narrative.",
      current: clip(feed, 160) + (pulse ? " Current pulse: " + clip(pulse, 220) + "." : "") + " " + attention + " attention/contradiction item(s) are rendered.",
      read: "Confidence is not certainty, activity is not completion, and missing evidence is not proof that nothing happened. This view is meant to show what the system has support for—and where that support is weak."
    };
  }

  const goals = qa(".goal-card, #goal-grid article").length;
  const frame = nodeText("#frame-north-star", "The personal frame is still loading.");
  const streak = nodeText("#checkin-streak", "No check-in streak is currently displayed.");
  return {
    purpose: "This is the personal-context view. It holds goals, check-ins, framing, and patterns that should shape decisions without becoming the entire operating dashboard.",
    current: goals + " goal card(s) are currently rendered. Current frame: “" + clip(frame, 180) + "” " + clip(streak, 140),
    read: "This data is context for judgment, not a score of your life or productivity. Sparse activity in a personal area should be treated as an evidence gap before it is treated as neglect."
  };
}

function ensureElitkPanel() {
  let panel = q("#workspace-elitk-panel");
  if (panel) return panel;
  panel = document.createElement("section");
  panel.id = "workspace-elitk-panel";
  panel.className = "workspace-elitk-panel";
  panel.hidden = true;
  panel.setAttribute("aria-live", "polite");
  panel.setAttribute("aria-label", "ELITK plain-language summary");
  q(".workspace-view-intro")?.insertAdjacentElement("afterend", panel);
  return panel;
}

function syncElitkTrigger() {
  qa("[data-elitk-trigger]").forEach(button => {
    button.setAttribute("aria-expanded", String(elitkOpen));
    button.classList.toggle("is-active", elitkOpen);
  });
}

function renderElitk(view) {
  const panel = ensureElitkPanel();
  if (!panel) return;
  panel.hidden = !elitkOpen;
  syncElitkTrigger();
  if (!elitkOpen) return;

  const summary = summaryFor(view);
  const title = (VIEW_META[view]?.title || "Workspace.").replace(/\.$/, "");
  panel.innerHTML =
    '<div class="workspace-elitk-panel__head">' +
      '<div><p class="section-kicker">ELITK · plain-language layer</p><h2>' + escapeHtml(title) + ', without the jargon.</h2></div>' +
      '<button type="button" class="workspace-elitk-refresh" data-elitk-refresh>Refresh summary</button>' +
    '</div>' +
    '<div class="workspace-elitk-grid">' +
      '<article><strong>What this view is for</strong><p>' + escapeHtml(summary.purpose) + '</p></article>' +
      '<article><strong>What it says right now</strong><p>' + escapeHtml(summary.current) + '</p></article>' +
      '<article><strong>How to read it</strong><p>' + escapeHtml(summary.read) + '</p></article>' +
    '</div>' +
    '<p class="workspace-elitk-grounding">Grounded only in the data currently rendered in this Workspace view. ELITK explains the display; it does not move work, approve actions, or upgrade evidence.</p>';

  q("[data-elitk-refresh]")?.addEventListener("click", () => renderElitk(view));
}

function toggleElitk(view) {
  elitkOpen = !elitkOpen;
  renderElitk(view);
}

function markConnectionsDisclosure(){
  document.querySelectorAll(".workspace-shell > details.disclosure").forEach(details => {
    if (details.querySelector(".visual-pair")) details.classList.add("workspace-connections");
  });
}

function assignSections(){
  markConnectionsDisclosure();
  Object.entries(GROUPS).forEach(([view, selectors]) => {
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(node => {
        node.dataset.workspaceView = view;
        node.classList.add("workspace-view-section");
      });
    });
  });
}

function renderTools(view){
  const host = q("#workspace-view-tools");
  if (!host) return;
  host.replaceChildren();

  const elitk = document.createElement("button");
  elitk.type = "button";
  elitk.className = "workspace-elitk-trigger";
  elitk.dataset.elitkTrigger = "";
  elitk.textContent = "ELITK · Explain this view";
  elitk.setAttribute("aria-controls", "workspace-elitk-panel");
  elitk.setAttribute("aria-expanded", String(elitkOpen));
  elitk.addEventListener("click", () => toggleElitk(view));
  host.append(elitk);

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

function renderIntro(view){
  const meta = VIEW_META[view] || VIEW_META.today;
  const title = q("#workspace-title");
  const deck = q("#workspace-view-deck");
  const eyebrow = q("#workspace-view-eyebrow");
  if (title) title.textContent = meta.title;
  if (deck) deck.textContent = meta.deck;
  if (eyebrow) eyebrow.textContent = meta.eyebrow;
  renderTools(view);
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
    network:"<strong>Network is the relationship view.</strong> Track outreach without turning every contact into a product task.",
    evidence:"<strong>Evidence is the record.</strong> Use it to verify claims, inspect signals, and trace why priorities changed.",
    self:"<strong>Self is context, not the dashboard.</strong> Goals and check-ins inform decisions without crowding Today."
  };
  utility.innerHTML = copy[view] || "";
  first.parentNode.insertBefore(utility, first);
  utility.dataset.workspaceView = view;
  utility.dataset.workspaceActive = "true";
  utility.classList.add("workspace-view-section");
}

function setView(view, {updateHash=true, focus=false} = {}){
  if (!VIEW_META[view]) view = "today";
  document.body.dataset.workspaceCurrentView = view;
  document.querySelectorAll("[data-workspace-view]").forEach(node => {
    node.dataset.workspaceActive = String(node.dataset.workspaceView === view);
  });
  document.querySelectorAll("[data-workspace-nav]").forEach(link => {
    const active = link.dataset.workspaceNav === view;
    if (active) link.setAttribute("aria-current","page");
    else link.removeAttribute("aria-current");
  });
  renderIntro(view);
  renderUtility(view);
  renderElitk(view);
  if (updateHash && location.hash !== "#" + view) history.replaceState(null,"","#" + view);
  if (focus) q("#workspace-title")?.focus?.({preventScroll:true});
  window.scrollTo({top:0,behavior:"smooth"});
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
  window.addEventListener("hashchange", () => setView(initialView(), {updateHash:false}));
}

function start(){
  assignSections();
  bindNavigation();
  document.body.dataset.workspaceViewReady = "true";
  setView(initialView(), {updateHash:false});
  window.addEventListener("ashwood:refresh-feed", () => {
    if (elitkOpen) renderElitk(document.body.dataset.workspaceCurrentView || initialView());
  });
}

start();
