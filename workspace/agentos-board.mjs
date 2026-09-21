const LANES = [
  { id: "in_progress", label: "In progress", empty: "No current execution is confirmed." },
  { id: "stuck", label: "Stuck", empty: "Nothing is currently classified as stuck." },
  { id: "review", label: "Review", empty: "Nothing is waiting for review or approval." },
  { id: "orphaned_pr", label: "Orphaned PRs", empty: "No open PRs are outside AgentOS/backlog tracking." },
  { id: "untriaged", label: "Untriaged", empty: "No discovered work is waiting for Milchik triage." },
  { id: "backlog", label: "Backlog", empty: "No captured backlog items are waiting." },
  { id: "done", label: "Recently done", empty: "No recent completed work is mirrored." }
];

const VIEW_PRESETS = [
  { id:"all", label:"All work", help:"Every reconciled AgentOS and ecosystem card." },
  { id:"sprint", label:"Sprint focus", help:"Active/review/stuck work plus P0/P1 backlog; done is hidden." },
  { id:"agentos", label:"AgentOS", help:"Work building the AgentOS operating layer." },
  { id:"ecosystem", label:"Ecosystem", help:"Work building ALVIRA, ailhat, ledgato, ASHWOOD, and other products." },
  { id:"attention", label:"Needs attention", help:"Stuck, review, orphaned PR, and untriaged work." }
];

const STORAGE_KEY = "ashwood.agentos-board.view.v2";
let lastData = null;

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, char => ({
  "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
}[char]));

function loadState() {
  const fallback = { view:"all", product:"", owner:"", priority:"", search:"", collapsed:[] };
  if (typeof window === "undefined") return fallback;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      view: VIEW_PRESETS.some(view => view.id === parsed.view) ? parsed.view : "all",
      product: typeof parsed.product === "string" ? parsed.product : "",
      owner: typeof parsed.owner === "string" ? parsed.owner : "",
      priority: typeof parsed.priority === "string" ? parsed.priority : "",
      search: typeof parsed.search === "string" ? parsed.search : "",
      collapsed: Array.isArray(parsed.collapsed) ? parsed.collapsed.filter(value => LANES.some(lane => lane.id === value)) : []
    };
  } catch {
    return fallback;
  }
}

let state = loadState();

function saveState() {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

export function workDomain(row) {
  const explicit = String(row?.work_domain || row?.metadata?.work_domain || "").toLowerCase();
  if (explicit === "agentos" || explicit === "ecosystem") return explicit;
  const normalized = String(row?.product || "").toLowerCase().replace(/[\s-]+/g, "");
  return normalized === "agentos" ? "agentos" : "ecosystem";
}

function priorityRank(value) {
  return ({ p0:4, p1:3, p2:2, p3:1 })[String(value || "").toLowerCase()] || 0;
}

export function matchesView(row, view) {
  if (view === "agentos") return workDomain(row) === "agentos";
  if (view === "ecosystem") return workDomain(row) === "ecosystem";
  if (view === "attention") return ["stuck","review","orphaned_pr","untriaged"].includes(row?.lane);
  if (view === "sprint") {
    return row?.lane !== "done" && (
      ["in_progress","stuck","review"].includes(row?.lane) ||
      priorityRank(row?.priority) >= 3
    );
  }
  return true;
}

export function filterRows(rows, filters = state) {
  const query = String(filters.search || "").trim().toLowerCase();
  const minimumPriority = Number(filters.priority || 0);
  return (Array.isArray(rows) ? rows : []).filter(row => {
    const haystack = [
      row.title,row.summary,row.blocker,row.next_gate,row.product,row.assignee,row.source,row.kind,
      row.work_id,row.task_id,workDomain(row)
    ].filter(Boolean).join(" ").toLowerCase();
    return matchesView(row, filters.view || "all") &&
      (!filters.product || row.product === filters.product) &&
      (!filters.owner || row.assignee === filters.owner) &&
      (!minimumPriority || priorityRank(row.priority) >= minimumPriority) &&
      (!query || haystack.includes(query));
  });
}

function relative(value) {
  const ts = Date.parse(value || "");
  if (!Number.isFinite(ts)) return "unknown";
  const mins = Math.max(0, Math.floor((Date.now() - ts) / 60000));
  if (mins < 1) return "now";
  if (mins < 60) return mins + "m ago";
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + "h ago";
  return Math.floor(hours / 24) + "d ago";
}

function freshnessState(value) {
  const ts = Date.parse(value || "");
  if (!Number.isFinite(ts)) return { label:"freshness unknown", cls:"is-stale" };
  const age = Date.now() - ts;
  if (age <= 15 * 60 * 1000) return { label:"live", cls:"is-live" };
  if (age <= 60 * 60 * 1000) return { label:"aging", cls:"is-aging" };
  return { label:"stale", cls:"is-stale" };
}

function kindLabel(row) {
  if (row.kind === "backlog") return "captured backlog";
  if (row.kind === "coverage_gap") return "coverage gap";
  if (row.kind === "ecosystem_intake") return "runtime intake";
  if (String(row.kind || "").startsWith("github_")) return "GitHub inventory";
  return "governed work";
}

function card(row) {
  const freshness = freshnessState(row.observed_at);
  const domain = workDomain(row);
  const meta = [
    row.assignee ? "owner " + row.assignee : null,
    row.source
  ].filter(Boolean);
  const detail = row.blocker || row.next_gate || row.summary || "";
  const identity = [row.work_id, row.task_id].filter(Boolean).join(" · ");
  const priority = String(row.priority || "").toUpperCase();

  let html = '<article class="agentos-board-card" data-kind="' + escapeHtml(row.kind || "") + '" data-domain="' + domain + '">';
  html += '<div class="agentos-board-card__top">';
  html += '<div class="agentos-board-card__badges">';
  html += '<span class="agentos-board-card__domain">' + (domain === "agentos" ? "AgentOS" : "Ecosystem") + '</span>';
  if (row.product) html += '<span class="agentos-board-card__product">' + escapeHtml(row.product) + '</span>';
  if (priority) html += '<span class="agentos-board-card__priority">' + escapeHtml(priority) + '</span>';
  html += '<span class="agentos-board-card__type">' + escapeHtml(kindLabel(row)) + '</span>';
  html += '</div>';
  html += '<span class="agentos-board-card__freshness ' + freshness.cls + '">' + escapeHtml(freshness.label) + '</span>';
  html += '</div>';
  html += '<h4>' + escapeHtml(row.title || "Untitled work") + '</h4>';
  if (meta.length) html += '<p class="agentos-board-card__meta">' + escapeHtml(meta.join(" · ")) + '</p>';
  if (row.metadata?.why_now) html += '<p class="agentos-board-card__why"><strong>Why now</strong> ' + escapeHtml(row.metadata.why_now) + '</p>';
  if (detail) html += '<p class="agentos-board-card__detail">' + escapeHtml(detail) + '</p>';
  html += '<dl>';
  html += '<div><dt>Status</dt><dd>' + escapeHtml(row.status || row.phase || "unknown") + '</dd></div>';
  html += '<div><dt>Last activity</dt><dd>' + escapeHtml(relative(row.updated_at)) + '</dd></div>';
  if (Number(row.attempts || 0)) html += '<div><dt>Attempts</dt><dd>' + Number(row.attempts) + '</dd></div>';
  if (row.authority_expires) html += '<div><dt>Authority</dt><dd>' + escapeHtml(relative(row.authority_expires)) + '</dd></div>';
  html += '</dl>';
  html += '<div class="agentos-board-card__footer"><span>' + escapeHtml(identity) + '</span>';
  if (row.canonical_url) html += '<a href="' + escapeHtml(row.canonical_url) + '" target="_blank" rel="noopener">Canonical source ↗</a>';
  html += '</div></article>';
  return html;
}

function renderControls(data) {
  const host = document.querySelector("#agentos-board-tools");
  if (!host) return;
  const rows = Array.isArray(data.rows) ? data.rows : [];
  const products = [...new Set(rows.map(row => row.product).filter(Boolean))].sort();
  const owners = [...new Set(rows.map(row => row.assignee).filter(Boolean))].sort();

  host.innerHTML =
    '<div class="agentos-board-views" role="group" aria-label="Saved board views">' +
      VIEW_PRESETS.map(view =>
        '<button type="button" data-board-view="' + view.id + '" class="' + (state.view === view.id ? "is-active" : "") + '" title="' + escapeHtml(view.help) + '">' +
        escapeHtml(view.label) + '</button>'
      ).join("") +
    '</div>' +
    '<div class="agentos-board-filters">' +
      '<label><span>Search</span><input type="search" data-board-search value="' + escapeHtml(state.search) + '" placeholder="Title, product, source…" /></label>' +
      '<label><span>Product</span><select data-board-product><option value="">All products</option>' +
        products.map(value => '<option value="' + escapeHtml(value) + '"' + (state.product === value ? " selected" : "") + '>' + escapeHtml(value) + '</option>').join("") +
      '</select></label>' +
      '<label><span>Owner</span><select data-board-owner><option value="">All owners</option>' +
        owners.map(value => '<option value="' + escapeHtml(value) + '"' + (state.owner === value ? " selected" : "") + '>' + escapeHtml(value) + '</option>').join("") +
      '</select></label>' +
      '<label><span>Priority</span><select data-board-priority>' +
        [['','All priority'],['4','P0 only'],['3','P1+'],['2','P2+'],['1','Prioritized']].map(([value,label]) =>
          '<option value="' + value + '"' + (state.priority === value ? " selected" : "") + '>' + label + '</option>'
        ).join("") +
      '</select></label>' +
      '<button class="agentos-board-reset" type="button" data-board-reset>Reset</button>' +
    '</div>' +
    '<p class="agentos-board-filter-summary" id="agentos-board-filter-summary"></p>';

  host.querySelectorAll("[data-board-view]").forEach(button => button.addEventListener("click", () => {
    state.view = button.dataset.boardView || "all";
    saveState();
    renderControls(data);
    renderBoard(data);
  }));
  host.querySelector("[data-board-search]")?.addEventListener("input", event => {
    state.search = event.target.value;
    saveState();
    renderBoard(data);
  });
  host.querySelector("[data-board-product]")?.addEventListener("change", event => {
    state.product = event.target.value;
    saveState();
    renderBoard(data);
  });
  host.querySelector("[data-board-owner]")?.addEventListener("change", event => {
    state.owner = event.target.value;
    saveState();
    renderBoard(data);
  });
  host.querySelector("[data-board-priority]")?.addEventListener("change", event => {
    state.priority = event.target.value;
    saveState();
    renderBoard(data);
  });
  host.querySelector("[data-board-reset]")?.addEventListener("click", () => {
    state = { view:"all", product:"", owner:"", priority:"", search:"", collapsed:state.collapsed };
    saveState();
    renderControls(data);
    renderBoard(data);
  });
}

function renderBoard(data) {
  const host = document.querySelector("#agentos-board");
  const counts = document.querySelector("#agentos-board-counts");
  if (!host) return;

  const allRows = Array.isArray(data.rows) ? data.rows : [];
  const rows = filterRows(allRows);
  const byLane = Object.fromEntries(LANES.map(lane => [lane.id, []]));
  rows.forEach(row => {
    const lane = byLane[row.lane] ? row.lane : "backlog";
    byLane[lane].push(row);
  });
  byLane.done = byLane.done
    .sort((a,b) => Date.parse(b.updated_at || 0) - Date.parse(a.updated_at || 0))
    .slice(0, 12);

  if (counts) {
    counts.innerHTML = LANES.map(lane =>
      '<span><b>' + byLane[lane.id].length + '</b>' + escapeHtml(lane.label) + '</span>'
    ).join("");
  }

  const agentosCount = rows.filter(row => workDomain(row) === "agentos").length;
  const ecosystemCount = rows.length - agentosCount;
  const summary = document.querySelector("#agentos-board-filter-summary");
  if (summary) summary.textContent =
    "Showing " + rows.length + " of " + allRows.length + " · AgentOS " + agentosCount + " · Ecosystem " + ecosystemCount;

  host.innerHTML = LANES.map(lane => {
    const rowsForLane = byLane[lane.id];
    const collapsed = state.collapsed.includes(lane.id);
    const cards = rowsForLane.length
      ? rowsForLane.map(card).join("")
      : '<p class="agentos-board-empty">' + escapeHtml(lane.empty) + '</p>';
    return '<section class="agentos-board-lane' + (collapsed ? ' is-collapsed' : '') + '" data-lane="' + lane.id + '">' +
      '<header><button type="button" class="agentos-board-lane__toggle" data-lane-toggle="' + lane.id + '" aria-expanded="' + (!collapsed) + '">' +
      '<span class="agentos-board-lane__chevron">⌄</span><h3>' + escapeHtml(lane.label) + '</h3><span>' + rowsForLane.length + '</span></button></header>' +
      '<div class="agentos-board-lane__cards">' + cards + '</div></section>';
  }).join("");

  host.querySelectorAll("[data-lane-toggle]").forEach(button => button.addEventListener("click", () => {
    const lane = button.dataset.laneToggle;
    if (!lane) return;
    state.collapsed = state.collapsed.includes(lane)
      ? state.collapsed.filter(value => value !== lane)
      : [...state.collapsed, lane];
    saveState();
    renderBoard(data);
  }));
}

function render(data) {
  lastData = data;
  const status = document.querySelector("#agentos-board-status");
  const rows = Array.isArray(data.rows) ? data.rows : [];
  const observedValues = rows.map(row => row.observed_at).filter(Boolean).sort();
  const observed = data.observed_at || observedValues[observedValues.length - 1] || null;
  const fresh = freshnessState(observed);
  const snapshotId = data.snapshot_id ? String(data.snapshot_id).slice(0, 10) : null;

  if (status) {
    status.textContent = observed
      ? "Last AgentOS snapshot " + relative(observed) + " · " + fresh.label + (snapshotId ? " · " + snapshotId : "")
      : "No AgentOS snapshot has been received yet.";
    status.className = "agentos-board-status " + fresh.cls;
  }

  renderControls(data);
  renderBoard(data);
}

async function load() {
  const host = document.querySelector("#agentos-board");
  const status = document.querySelector("#agentos-board-status");
  if (!host) return false;
  try {
    const response = await fetch("/api/workspace-agentos", {
      credentials:"same-origin",
      cache:"no-store"
    });
    if (response.status === 401) {
      if (status) status.textContent = "Unlock Workspace to load AgentOS.";
      return false;
    }
    if (!response.ok) throw new Error("AgentOS board " + response.status);
    render(await response.json());
    return true;
  } catch (error) {
    if (status) status.textContent = "AgentOS board unavailable: " + error.message;
    host.innerHTML = '<p class="agentos-board-empty">The mirror could not load. Canonical AgentOS state is unchanged.</p>';
    return false;
  }
}

async function start() {
  if (await load()) return;
  let attempts = 0;
  const timer = setInterval(async () => {
    attempts += 1;
    if (await load() || attempts >= 30) clearInterval(timer);
  }, 1500);
}

if (typeof window !== "undefined") {
  window.addEventListener("ashwood:refresh-feed", load);
  window.addEventListener("ashwood:workspace-authenticated", load);
  start();
}
