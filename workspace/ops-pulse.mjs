import { summarizePulse } from "/workspace/ops-pulse-model.mjs";

const q = selector => document.querySelector(selector);
const esc = value => String(value ?? "").replace(/[&<>'"]/g, char =>
  ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);

async function read(url) {
  const response = await fetch(url, { credentials:"same-origin", cache:"no-store" });
  if (!response.ok) throw Object.assign(new Error("HTTP " + response.status), { status:response.status });
  return response.json();
}

function ago(value) {
  const timestamp = Date.parse(value || "");
  if (!Number.isFinite(timestamp)) return "source time unavailable";
  const age = Math.max(0, Date.now() - timestamp);
  if (age < 60000) return "just now";
  if (age < 3600000) return Math.floor(age / 60000) + "m ago";
  return Math.floor(age / 3600000) + "h ago";
}

function miniCard(row, badge) {
  const title = esc(row.title || row.command_text || "AgentOS work");
  const summary = esc(row.next_gate || row.summary || row.blocker || row.error || "Open the canonical board for evidence and next transition.");
  const status = esc(row.status || row.phase || row.lane || "unknown");
  const source = row.canonical_url && /^https:\/\//.test(row.canonical_url)
    ? '<a href="' + esc(row.canonical_url) + '" target="_blank" rel="noopener">Source ↗</a>'
    : '<a href="/workspace/build/agentos/">Open AgentOS detail →</a>';
  return '<article class="ops-pulse-item"><small>' + esc(badge) + ' · ' + status + '</small><strong>' + title + '</strong><p>' + summary + '</p>' + source + '</article>';
}

let loading = false;

async function refresh() {
  if (loading) return;
  const host = q("#ops-pulse");
  if (!host) return;
  loading = true;
  const status = q("#ops-pulse-status");
  const details = q("#ops-pulse-detail");
  status.textContent = "Reading protected Workspace sources…";

  const [board, commands, environments] = await Promise.allSettled([
    read("/api/workspace-agentos"),
    read("/api/workspace-state?view=commands"),
    read("/api/workspace-environments")
  ]);

  const result = summarizePulse(
    board.status === "fulfilled" ? board.value : null,
    commands.status === "fulfilled" ? commands.value.commands : null
  );

  if (!result.available) {
    status.textContent = board.reason?.status === 401 ? "Workspace locked" : "AgentOS projection unavailable";
    details.innerHTML = '<p class="ops-pulse-unavailable">No operational totals shown until the authenticated AgentOS projection responds. This is not evidence that the runtime is down.</p>';
  } else {
    const count = (id, value) => { const node = q(id); if (node) node.textContent = String(value); };
    count("#ops-pulse-underway", result.underway.length);
    count("#ops-pulse-owner", result.owner.length);
    count("#ops-pulse-blocked", result.blocked.length);
    count("#ops-pulse-queued", commands.status === "fulfilled" ? result.queued.length : "—");

    status.textContent = "Workspace fetched " + new Date().toLocaleTimeString([], { hour:"numeric", minute:"2-digit" }) +
      (result.observedAt ? " · source " + ago(result.observedAt) : " · upstream timestamp unavailable");

    const cards = [
      ...result.owner.slice(0, 2).map(row => miniCard(row, "Needs your decision")),
      ...result.blocked.slice(0, 2).map(row => miniCard(row, "Blocked")),
      ...result.underway.slice(0, 2).map(row => miniCard(row, "Underway"))
    ];
    details.innerHTML = cards.join("") || '<p class="ops-pulse-unavailable">No active, blocked, or review-required AgentOS rows confirmed by the current projection.</p>';

    if (commands.status === "rejected") {
      details.insertAdjacentHTML("beforeend", '<p class="ops-pulse-unavailable">Command queue unavailable. Queue count is not a zero.</p>');
    }
  }

  const environment = q("#ops-pulse-deployment");
  if (environments.status === "fulfilled") {
    const own = (environments.value.environments || []).find(item => item.product_key === "ashwood");
    const sandbox = own?.sandbox;
    const observed = sandbox?.observed_at || environments.value.observed_at;
    environment.innerHTML =
      '<strong>' + esc(own?.status || "UNASSIGNED") + '</strong>' +
      '<span>ASHWOOD sandbox · ' + esc(sandbox?.provider_identity || "no provider identity") +
      ' · observed ' + esc(ago(observed)) + '. Environment state is separate from production deployment state.</span>' +
      '<a href="/workspace/build/environments/">Environment details →</a>';
  } else {
    environment.textContent = "Environment registry unavailable; this does not establish deployment failure.";
  }

  loading = false;
}

q("#ops-pulse-refresh")?.addEventListener("click", refresh);
window.addEventListener("ashwood:workspace-authenticated", refresh);
window.addEventListener("ashwood:operator-command-submitted", refresh);
document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
refresh();
