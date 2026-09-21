const q = selector => document.querySelector(selector);
const qa = selector => [...document.querySelectorAll(selector)];
const clean = value => String(value || "").replace(/\s+/g, " ").trim();
const clip = (value, limit = 280) => {
  const text = clean(value);
  return text.length > limit ? text.slice(0, limit - 1).trimEnd() + "…" : text;
};

const CONFIG = {
  "build-logs": {
    title: "Build logs",
    purpose: "This page is the memory of what was tried, decided, failed, learned, or left unresolved while building. It is history and context, not automatic proof that every recorded claim is true.",
    current() {
      const visible = qa("#logs article").length;
      const status = clean(q("#status")?.textContent) || "Build logs are still loading.";
      return status + " " + visible + " log entr" + (visible === 1 ? "y is" : "ies are") + " currently visible after the search filter.";
    },
    read: "A saved log tells you what was recorded at that moment. Use it to understand why a decision was made, then check newer evidence before treating an old conclusion as current truth.",
    observe: ["#status", "#logs"]
  },
  "career-ops": {
    title: "Career Ops",
    purpose: "This page is the job-search operating view. It keeps applications, fresh role targets, inbox signals, compensation, and next actions in one place so the search does not lose context.",
    current() {
      const summary = qa("#career-summary article").map(node => clean(node.textContent)).filter(Boolean).join(" · ");
      const opportunities = qa(".career-opportunity-card").length;
      const applications = qa(".career-row").length;
      const state = clean(q("#career-state")?.textContent) || "Career state is still loading.";
      return (summary ? "Pipeline: " + summary + ". " : "") + applications + " tracked application(s), " + opportunities + " fresh opportunity card(s). " + state;
    },
    read: "A role in Fresh targets is a lead to evaluate, not a recommendation or an application. Pipeline status describes where a recorded application sits; 'needs action' means the tracker sees a follow-up or deadline that deserves review.",
    observe: ["#career-summary", "#career-opportunity-grid", "#career-applications", "#career-state"]
  },
  "production-review": {
    title: "Production review",
    purpose: "This page is the release-checking surface. It turns production-facing changes into concrete things a human should inspect before calling a release fully verified.",
    current() {
      const queue = q("#deployment-review-items");
      const history = q("#v3-playtest-checklist");
      const queueCount = queue ? [...queue.children].filter(node => !node.classList.contains("v3-checklist__loading")).length : 0;
      const historyCount = history ? [...history.children].filter(node => !node.classList.contains("v3-checklist__loading")).length : 0;
      return queueCount + " current release-review item(s) and " + historyCount + " historical baseline item(s) are rendered.";
    },
    read: "A deployment being built or reachable is not the same as a reviewed release. Current checks are the things that still need human verification; the historical V3 baseline is preserved evidence and should not be mistaken for current release work.",
    observe: ["#deployment-review-items", "#v3-playtest-checklist"]
  }
};

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function mount() {
  const page = document.body.dataset.elitkPage;
  const config = CONFIG[page];
  if (!config) return;

  const button = make("button", "elitk-page-trigger", "ELITK · Explain this page");
  button.type = "button";
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", "elitk-page-panel");

  const panel = make("section", "elitk-page-panel");
  panel.id = "elitk-page-panel";
  panel.hidden = true;
  panel.setAttribute("aria-live", "polite");

  const header = make("div", "elitk-page-panel__head");
  const headingWrap = make("div");
  headingWrap.append(make("p", "elitk-page-kicker", "ELITK · plain-language layer"), make("h2", "", config.title + ", without the jargon."));
  const refresh = make("button", "elitk-page-refresh", "Refresh summary");
  refresh.type = "button";
  header.append(headingWrap, refresh);

  const grid = make("div", "elitk-page-grid");
  const fields = [
    ["What this page is for", () => config.purpose],
    ["What it says right now", () => config.current()],
    ["How to read it", () => config.read]
  ];
  const valueNodes = [];
  for (const [label, getter] of fields) {
    const article = make("article");
    article.append(make("strong", "", label));
    const value = make("p", "", getter());
    valueNodes.push([value, getter]);
    article.append(value);
    grid.append(article);
  }

  panel.append(header, grid, make("p", "elitk-page-grounding", "Grounded only in the data currently rendered on this page. ELITK explains the display; it does not move work, approve actions, or upgrade evidence."));

  const host = q(".career-masthead nav") || q(".workspace-actions");
  if (host) host.append(button);
  else q("h1")?.insertAdjacentElement("afterend", button);

  const anchor = q(".career-hero") || q(".production-review-intro") || q("h1");
  anchor?.insertAdjacentElement("afterend", panel);

  let open = false;
  const render = () => valueNodes.forEach(([node, getter]) => { node.textContent = getter(); });
  const toggle = () => {
    open = !open;
    panel.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
    button.classList.toggle("is-active", open);
    if (open) render();
  };

  button.addEventListener("click", toggle);
  refresh.addEventListener("click", render);

  const observer = new MutationObserver(() => { if (open) render(); });
  for (const selector of config.observe) {
    const node = q(selector);
    if (node) observer.observe(node, { childList:true, subtree:true, characterData:true });
  }
}

mount();
