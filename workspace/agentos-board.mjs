const LANES = [
  { id: "in_progress", label: "In progress", empty: "No current execution is confirmed." },
  { id: "stuck", label: "Stuck", empty: "Nothing is currently classified as stuck." },
  { id: "review", label: "Review", empty: "Nothing is waiting for review or approval." },
  { id: "orphaned_pr", label: "Orphaned PRs", empty: "No open PRs are outside AgentOS/backlog tracking." },
  { id: "untriaged", label: "Untriaged", empty: "No discovered GitHub issues are waiting for Milchik triage." },
  { id: "backlog", label: "Backlog", empty: "No captured backlog items are waiting." },
  { id: "done", label: "Recently done", empty: "No recent completed work is mirrored." }
];

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, char => ({
  "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
}[char]));

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

function card(row) {
  const freshness = freshnessState(row.observed_at);
  const meta = [
    row.product,
    row.assignee ? "owner " + row.assignee : null,
    row.priority,
    row.source
  ].filter(Boolean);
  const detail = row.blocker || row.next_gate || row.summary || "";
  const identity = [row.work_id, row.task_id].filter(Boolean).join(" · ");

  let html = '<article class="agentos-board-card" data-kind="' + escapeHtml(row.kind || "") + '">';
  html += '<div class="agentos-board-card__top">';
  const typeLabel = row.kind === "backlog"
    ? "captured backlog"
    : String(row.kind || "").startsWith("github_")
      ? "GitHub inventory"
      : "governed work";
  html += '<span class="agentos-board-card__type">' + escapeHtml(typeLabel) + '</span>';
  html += '<span class="agentos-board-card__freshness ' + freshness.cls + '">' + escapeHtml(freshness.label) + '</span>';
  html += '</div>';
  html += '<h4>' + escapeHtml(row.title || "Untitled work") + '</h4>';
  html += '<p class="agentos-board-card__meta">' + escapeHtml(meta.join(" · ")) + '</p>';
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

function render(data) {
  const host = document.querySelector("#agentos-board");
  const status = document.querySelector("#agentos-board-status");
  const counts = document.querySelector("#agentos-board-counts");
  if (!host) return;

  const rows = Array.isArray(data.rows) ? data.rows : [];
  const observedValues = rows.map(row => row.observed_at).filter(Boolean).sort();
  const observed = data.observed_at || observedValues[observedValues.length - 1] || null;
  const fresh = freshnessState(observed);

  if (status) {
    status.textContent = observed
      ? "Last AgentOS snapshot " + relative(observed) + " · " + fresh.label
      : "No AgentOS snapshot has been received yet.";
    status.className = "agentos-board-status " + fresh.cls;
  }

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

  host.innerHTML = LANES.map(lane => {
    const rowsForLane = byLane[lane.id];
    const cards = rowsForLane.length
      ? rowsForLane.map(card).join("")
      : '<p class="agentos-board-empty">' + escapeHtml(lane.empty) + '</p>';
    return '<section class="agentos-board-lane" data-lane="' + lane.id + '">' +
      '<header><h3>' + escapeHtml(lane.label) + '</h3><span>' + rowsForLane.length + '</span></header>' +
      '<div class="agentos-board-lane__cards">' + cards + '</div></section>';
  }).join("");
}

async function load() {
  const host = document.querySelector("#agentos-board");
  const status = document.querySelector("#agentos-board-status");
  if (!host) return false;
  try {
    const response = await fetch("/api/workspace-board", {
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

window.addEventListener("ashwood:refresh-feed", load);
start();
