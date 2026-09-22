const STORAGE_KEY = "ashwood.elitk-mode.v2";

export const EXACT_TRANSLATIONS = new Map([
  ["ELITK · Explain this view", "ELITK"],
  ["ELITK · Explain this page", "ELITK"],
  ["Today · command center", "Today · what needs to move"],
  ["Move the work.", "What should move today."],
  ["Capture or direct your attention", "Tell the system what you want handled"],
  ["AgentOS", "AgentOS · automated work"],
  ["AgentOS · observable execution", "Agent activity you can inspect"],
  ["Current autonomous sessions", "What agents are working on now"],
  ["Next highest-value objective", "Most useful next thing to do"],
  ["Grounding the next objective…", "Figuring out the most useful next step…"],
  ["AgentOS · full operating queue", "Everything the system knows about the work"],
  ["Portfolio work board", "All tracked work"],
  ["Waiting for the private AgentOS snapshot…", "Loading the latest saved work status…"],
  ["All work", "Everything"],
  ["Sprint focus", "Current focus"],
  ["Needs attention", "Needs you"],
  ["In progress", "Being worked on"],
  ["Stuck", "Blocked"],
  ["Review", "Needs checking"],
  ["Orphaned PRs", "Code changes not linked to tracked work"],
  ["Untriaged", "Not sorted yet"],
  ["Backlog", "Saved for later"],
  ["Recently done", "Recently completed"],
  ["Search", "Find"],
  ["Owner", "Responsible"],
  ["Priority", "Importance"],
  ["All products", "Every product"],
  ["All owners", "Everyone"],
  ["All priority", "Any importance"],
  ["P0 only", "Urgent only"],
  ["P1+", "High priority and above"],
  ["P2+", "Normal priority and above"],
  ["Prioritized", "Has a priority"],
  ["Reset", "Clear filters"],
  ["captured backlog", "saved for later"],
  ["coverage gap", "missing tracking"],
  ["runtime intake", "new work found by the system"],
  ["GitHub inventory", "GitHub work found"],
  ["governed work", "controlled agent work"],
  ["freshness unknown", "last update unknown"],
  ["live", "up to date"],
  ["aging", "getting old"],
  ["stale", "out of date"],
  ["Canonical source ↗", "Authoritative record ↗"],
  ["Status", "Current state"],
  ["Last activity", "Last changed"],
  ["Attempts", "Tries"],
  ["Authority", "Permission"],
  ["Operating the portfolio", "Running the products"],
  ["Professional motion", "Job and career progress"],
  ["Relationships and outbound", "People and outreach"],
  ["Proof before narrative", "Check the proof before making a claim"],
  ["Personal operating context", "Personal context that shapes decisions"],
  ["Current work", "Projects being worked on"],
  ["Active workstreams", "Active projects"],
  ["Live evidence → public artifact", "Real work → something you can show publicly"],
  ["From the work", "Things worth sharing from your work"],
  ["Sponsorship / outbound", "Funding and outreach"],
  ["Sponsor pipeline", "Sponsor conversations"],
  ["Owner signal · live", "Things the system thinks you should notice"],
  ["Ecosystem notifications", "Updates from across your products"],
  ["Private · owner review", "Private · for you to review"],
  ["Current pulse", "Recent changes"],
  ["What moved", "What changed"],
  ["Projects → goals", "How projects support your goals"],
  ["The connections", "What connects to what"],
  ["The rhythm", "Recent activity"],
  ["Evidence ledger", "Proof and records"],
  ["Explore the evidence", "See the proof"],
  ["Not just a celebration layer", "Problems count too"],
  ["Attention & contradictions", "Things that need a closer look"],
  ["Actionable opportunities", "Things you could act on"],
  ["The frame", "Big-picture direction"],
  ["Saturn frame", "Long-term life frame"],
  ["The recorded six-check variant", "The saved six-question version"],
  ["Career Ops", "Job search"],
  ["Design Implementation", "Design changes and whether they are really live"],
  ["21st.dev design batch · #149", "The agreed design improvements"],
  ["What we agreed, what is in code, merged, live, and actually checked on production.", "Each design change we agreed on, and how far it has really got."],
  ["In code", "Written"],
  ["Merged", "Accepted into the product"],
  ["Checked live", "Checked on the real site"],
  ["Unfinished", "Not done yet"],
  ["Stale", "Out of date"],
  ["Stale and superseded work", "Old work that was replaced"],
  ["Income & opportunity", "Income and job opportunities"],
  ["Inbox continuity", "Email follow-up"],
  ["Application email monitor", "Application email updates"],
  ["Fresh targets", "New jobs to consider"],
  ["Pipeline", "Application progress"],
  ["Application tracker", "Applications"],
  ["active pipeline", "active applications"],
  ["submitted / screening", "applied or being reviewed"],
  ["recruiter / assessment / interview", "in conversation with employers"],
  ["need action", "need your follow-up"],
  ["Posting snapshot", "Saved job posting"],
  ["Submitted materials", "What you sent"],
  ["Fit decision / why this role", "Why this role may fit"],
  ["Job / requisition ID", "Job ID"],
  ["Work arrangement", "Remote / hybrid / on-site"],
  ["Production Review", "Live-site check"],
  ["Workspace / Production review", "Workspace / Live-site check"],
  ["Private release review", "Private live-site review"],
  ["Historical V3 baseline", "Older V3 review"],
  ["preserved review evidence", "saved review record"],
  ["Primary QA: production review queue", "Main quality check: current live-site review"],
  ["Reported history", "What was recorded at the time"],
  ["The recommendation will use ranked priorities plus confirmed workstream state.", "This suggestion is based on what matters most and work the system can confirm is actually active."],
  ["Objective → why now → assigned owner → current step → next gate. No inferred motion without a synced source.", "What we are trying to do → why it matters now → who is handling it → what is happening → what must happen next. If there is no synced evidence, this page will not pretend the work is moving."],
  ["Commands enter AgentOS as owner directives. Routing remains reviewable, and ledgato must ALLOW the governed dispatch before directed work can enter the execution queue.", "Your instruction is recorded, the system chooses how to handle it, and ledgato checks permission before any agent work starts."],
  ["Read-only ecosystem work ledger: governed execution, Milchik backlog, discovered work, and explicit coverage gaps. Views and filters change what you see; ASHWOOD never moves or authorizes these cards.", "This is a read-only list of work the system knows about: agent work in progress, saved-for-later items, newly found work, and things that may be missing from tracking. Filters only change what you see here; ASHWOOD does not move work or give agents permission."]
]);

const PHRASE_TRANSLATIONS = [
  [/\bP0\b/g, "urgent"],
  [/\bP1\b/g, "high priority"],
  [/\bP2\b/g, "normal priority"],
  [/\bP3\b/g, "low priority"],
  [/\bIN_PROGRESS\b/g, "being worked on"],
  [/\bSIGNAL\b/g, "needs a look"],
  [/\bACCEPTED\b/g, "kept in focus"],
  [/\bDISMISSED\b/g, "dismissed"],
  [/\bCOMPLETED\b/g, "completed"],
  [/\bPLANNED\b/g, "planned"],
  [/\bTARGET\b/g, "considering"],
  [/\bAPPLIED\b/g, "applied"],
  [/\bSCREENING\b/g, "company is reviewing"],
  [/\bRECRUITER\b/g, "talking to recruiter"],
  [/\bASSESSMENT\b/g, "assessment or test"],
  [/\bINTERVIEW\b/g, "interviewing"],
  [/\bOFFER\b/g, "offer received"],
  [/\bDEFERRED\b/g, "paused"],
  [/\bREJECTED\b/g, "not selected"],
  [/\bDECLINED\b/g, "you declined"],
  [/\bCLOSED\b/g, "closed"],
  [/\bREADY\b/g, "built successfully"],
  [/\bBLOCKED\b/g, "blocked"],
  [/\bConfidence\s+(\d+)%/gi, "How sure the system is: $1%"],
  [/\bGoal\s+([^·\n]+)/gi, "Related goal: $1"],
  [/\bowner\s+([^\s·,]+)/gi, "responsible: $1"],
  [/\bnext gate\b/gi, "what has to happen next"],
  [/\bcanonical source\b/gi, "authoritative record"],
  [/\bactive workstreams?\b/gi, "active projects"],
  [/\borphaned PRs?\b/gi, "code changes not linked to tracked work"],
  [/\buntriaged\b/gi, "not sorted yet"],
  [/\bworkstreams?\b/gi, "projects"],
  [/\bgoverned execution\b/gi, "agent work with rules and permission checks"],
  [/\bgoverned work\b/gi, "agent work with rules and permission checks"],
  [/\bgoverned dispatch\b/gi, "sending approved work to an agent"],
  [/\bowner directives?\b/gi, "your instructions"],
  [/\bdirectives?\b/gi, "instructions"],
  [/\brouting decisions?\b/gi, "decisions about which agent or tool handles the work"],
  [/\brouting\b/gi, "choosing which agent or tool handles the work"],
  [/\bdispatch\b/gi, "sending work to an agent"],
  [/\bexecution queue\b/gi, "agent work queue"],
  [/\bexecution\b/gi, "work being done"],
  [/\bauthorization boundary\b/gi, "permission check"],
  [/\bcontrol plane\b/gi, "system that coordinates the agents"],
  [/\bharness(?:es)?\b/gi, "agent tool"],
  [/\bverifier(?:s)?\b/gi, "independent checker"],
  [/\bruntime\b/gi, "running system"],
  [/\bpersistence\b/gi, "saved state that survives a restart"],
  [/\breconcile(?:s|d|ing)?\b/gi, "sync"],
  [/\bcron jobs?\b/gi, "scheduled tasks"],
  [/\bsnapshot\b/gi, "saved copy"],
  [/\bmirrored\b/gi, "shown as a read-only copy"],
  [/\bledger\b/gi, "record"],
  [/\bauthority expires?\b/gi, "permission expires"],
  [/\bauthority\b/gi, "permission"],
  [/\bcoverage gaps?\b/gi, "missing tracking"],
  [/\bruntime intake\b/gi, "new work found by the system"],
  [/\bGitHub inventory\b/gi, "GitHub work found"],
  [/\bcaptured backlog\b/gi, "saved for later"],
  [/\bbacklog\b/gi, "saved for later"],
  [/\bfreshness unknown\b/gi, "last update unknown"],
  [/\baging\b/gi, "getting old"],
  [/\bstale\b/gi, "out of date"],
  [/\bdeployment review\b/gi, "live-site check"],
  [/\bproduction deployment\b/gi, "live-site release"],
  [/\bproduction-facing\b/gi, "live-site"],
  [/\brelease-specific\b/gi, "for this release"],
  [/\bQA\b/g, "quality check"],
  [/\bposting snapshot\b/gi, "saved job posting"],
  [/\bactive pipeline\b/gi, "active applications"],
  [/\bpublic artifacts?\b/gi, "things you can show publicly"],
  [/\bsignals\b/gi, "system notices"],
  [/\bsignal\b/gi, "system notice"]
];

export function humanizeText(value) {
  const original = String(value ?? "");
  const match = original.match(/^(\s*)([\s\S]*?)(\s*)$/);
  const leading = match?.[1] || "";
  const core = match?.[2] || "";
  const trailing = match?.[3] || "";
  if (!core.trim()) return original;

  const trimmed = core.trim();
  let translated = EXACT_TRANSLATIONS.get(trimmed);
  if (translated == null) {
    translated = trimmed;
    for (const [pattern, replacement] of PHRASE_TRANSLATIONS) {
      translated = translated.replace(pattern, replacement);
    }
  }

  translated = translated
    .replace(
      /Commands enter AgentOS as your instructions\. Routing remains reviewable, and ledgato must ALLOW the controlled agent work before directed work can enter the execution queue\./i,
      "Your instruction is recorded, the system chooses how to handle it, and ledgato checks permission before any agent work starts."
    )
    .replace(
      /Objective → why now → assigned responsible → current step → what has to happen next\./i,
      "What we are trying to do → why it matters now → who is handling it → what is happening → what must happen next."
    )
    .replace(
      /No inferred motion without a synced source\./i,
      "If there is no synced evidence, the page will not pretend the work is moving."
    )
    .replace(
      /Read-only ecosystem work ledger:/i,
      "Read-only list of tracked work:"
    )
    .replace(
      /Views and filters change what you see; ASHWOOD never moves or authorizes these cards\./i,
      "Filters only change what you see here. ASHWOOD does not move work or give agents permission."
    )
    .replace(
      /ASHWOOD shows the human-facing projection; execution truth stays in AgentOS, ailhat, and the owning repos\./i,
      "ASHWOOD shows the readable view. The actual work status still comes from AgentOS, ailhat, and the product repositories."
    )
    .replace(
      /ASHWOOD checks current GitHub, controlled agent work, private evidence, and ailhat signals on refresh\./i,
      "ASHWOOD checks GitHub, agent work, private records, and ailhat updates when you refresh."
    )
    .replace(
      /A candidate is also a valid result/i,
      "a candidate is automatically a finished result"
    );

  return leading + translated + trailing;
}

let active = false;
let applying = false;
let textState = new WeakMap();
let textNodes = new Set();
let attrState = new WeakMap();
let attrElements = new Set();

function skipTextNode(node) {
  const parent = node.parentElement;
  if (!parent) return true;
  if (parent.closest("script,style,noscript,[data-elitk-toggle]")) return true;
  return false;
}

function transformTextNode(node, forceSource = false) {
  if (!active || skipTextNode(node)) return;
  const current = node.data;
  let state = textState.get(node);

  if (!state || forceSource || current !== state.transformed) {
    state = { original: current, transformed: humanizeText(current) };
    textState.set(node, state);
    textNodes.add(node);
  }

  if (node.data !== state.transformed) {
    applying = true;
    node.data = state.transformed;
    applying = false;
  }
}

function transformAttributes(element, forceSource = false) {
  if (!active || !(element instanceof Element) || element.matches("[data-elitk-toggle]")) return;
  const attrs = ["aria-label", "title", "placeholder"];
  let states = attrState.get(element);
  if (!states) {
    states = new Map();
    attrState.set(element, states);
  }

  for (const attr of attrs) {
    if (!element.hasAttribute(attr)) continue;
    const current = element.getAttribute(attr) || "";
    let state = states.get(attr);
    if (!state || forceSource || current !== state.transformed) {
      state = { original: current, transformed: humanizeText(current) };
      states.set(attr, state);
      attrElements.add(element);
    }
    if (current !== state.transformed) {
      applying = true;
      element.setAttribute(attr, state.transformed);
      applying = false;
    }
  }
}

function walk(root) {
  if (!active || !root) return;
  if (root.nodeType === Node.TEXT_NODE) {
    transformTextNode(root);
    return;
  }
  if (!(root instanceof Element || root instanceof Document || root instanceof DocumentFragment)) return;

  if (root instanceof Element) transformAttributes(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.TEXT_NODE) transformTextNode(node);
    else transformAttributes(node);
  }
}

function restore() {
  applying = true;
  for (const node of textNodes) {
    const state = textState.get(node);
    if (state && node.isConnected) node.data = state.original;
  }
  for (const element of attrElements) {
    const states = attrState.get(element);
    if (!states || !element.isConnected) continue;
    for (const [attr, state] of states) element.setAttribute(attr, state.original);
  }
  applying = false;
  textState = new WeakMap();
  textNodes = new Set();
  attrState = new WeakMap();
  attrElements = new Set();
}

function syncButtons() {
  document.querySelectorAll("[data-elitk-toggle]").forEach(control => {
    const isCheckbox = control instanceof HTMLInputElement && control.type === "checkbox";
    if (isCheckbox) {
      control.checked = active;
      control.setAttribute("aria-checked", String(active));
      control.closest(".workspace-elitk-switch")?.classList.toggle("is-active", active);
    } else {
      control.textContent = active ? "ELITK ON · Show original" : "ELITK · Plain language";
      control.setAttribute("aria-pressed", String(active));
      control.classList.toggle("is-active", active);
    }
  });
  document.body.dataset.elitkActive = String(active);
}

function ensureSubpageButton() {
  if (document.querySelector("[data-elitk-toggle]")) return;
  if (!document.body.dataset.elitkPage) return;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "elitk-page-trigger";
  button.dataset.elitkToggle = "";
  const host = document.querySelector(".career-masthead nav, .workspace-actions");
  if (host) host.append(button);
  else document.querySelector("main")?.prepend(button);
}

export function setElitkMode(next) {
  active = Boolean(next);
  try { localStorage.setItem(STORAGE_KEY, active ? "1" : "0"); } catch {}
  if (active) walk(document.body);
  else restore();
  syncButtons();
  window.dispatchEvent(new CustomEvent("ashwood:elitk-mode", { detail:{ active } }));
}

export function getElitkMode() {
  return active;
}

function start() {
  ensureSubpageButton();
  try { active = localStorage.getItem(STORAGE_KEY) === "1"; } catch { active = false; }

  document.addEventListener("click", event => {
    const button = event.target.closest?.("[data-elitk-toggle]:not(input)");
    if (!button) return;
    setElitkMode(!active);
  });
  document.addEventListener("change", event => {
    const toggle = event.target.closest?.('input[type="checkbox"][data-elitk-toggle]');
    if (!toggle) return;
    setElitkMode(toggle.checked);
  });

  const observer = new MutationObserver(records => {
    if (applying) return;
    let shouldSync = false;
    for (const record of records) {
      // MutationObserver callbacks run after `applying` has been reset, so ELITK also
      // sees the rewrites it made itself. Treating those as new source text replaced the
      // stored original with the translation, and toggling off then "restored" the
      // translation. Only genuinely new text (not what ELITK wrote) resets the source.
      if (record.type === "characterData") {
        const state = textState.get(record.target);
        if (active && !(state && record.target.data === state.transformed)) transformTextNode(record.target, true);
        continue;
      }
      if (record.type === "attributes") {
        const state = attrState.get(record.target)?.get(record.attributeName);
        const current = record.target.getAttribute?.(record.attributeName);
        if (active && !(state && current === state.transformed)) transformAttributes(record.target, true);
        continue;
      }
      for (const node of record.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE && (node.matches?.("[data-elitk-toggle]") || node.querySelector?.("[data-elitk-toggle]"))) shouldSync = true;
        if (active) walk(node);
      }
    }
    if (shouldSync) syncButtons();
  });
  observer.observe(document.documentElement, {
    subtree:true,
    childList:true,
    characterData:true,
    attributes:true,
    attributeFilter:["aria-label","title","placeholder"]
  });

  if (active) walk(document.body);
  syncButtons();
}

if (typeof document !== "undefined") start();
