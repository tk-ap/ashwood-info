// Workspace deployment tracker: a read-only view of the canonical AgentOS
// deployment budget. AgentOS observes Vercel, computes the rolling budget and
// governs deployments; ASHWOOD only renders the snapshot it publishes.
import { budgetView, selectBudgetRow } from "/workspace/deployment-budget-view.mjs";

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function fmt(iso) {
  return iso ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso)) : "—";
}
function card(label, value, detail) {
  return `<article><small>${esc(label)}</small><strong>${esc(value)}</strong><span>${esc(detail)}</span></article>`;
}

function render(view) {
  const summary = document.querySelector("#deployment-budget-summary");
  const projects = document.querySelector("#deployment-budget-projects");
  const availability = document.querySelector("#deployment-availability");
  const note = document.querySelector("#deployment-budget-note");
  if (!summary || !projects) return;
  const section = document.querySelector("#deployment-budget");
  if (!view.available) {
    summary.innerHTML = `<p>${esc(view.message)}</p>`;
    projects.innerHTML = "";
    if (availability) availability.innerHTML = "";
    section?.setAttribute("data-telemetry", "unavailable");
    return;
  }
  if (availability) availability.innerHTML =
    card("ASHWOOD production", view.production.label, view.production.detail) +
    card("Latest deployment", view.latest.label, view.latest.detail) +
    card("Deploy availability", view.deployAllowed ? "AVAILABLE" : "BLOCKED",
      view.capacityAvailable === null ? "capacity unknown" : `${view.capacityAvailable} / ${view.limit} slots`) +
    card("Parked deployments", String(view.parked.length),
      view.parked.length ? view.parked.map(p => p.product || p.work_id).join(", ") : "none waiting for capacity");
  summary.innerHTML =
    card("Rolling capacity used", view.used === null ? "—" : `${view.used} / ${view.limit}`, "deployments, trailing 24h") +
    card("Capacity available", view.capacityAvailable ?? "—", "slots") +
    card("Operating band", view.band, view.deployAllowed ? "deploys allowed by policy" : "deploys parked") +
    card("Next slot", fmt(view.nextSlotAt), "oldest deployment ages out");
  projects.innerHTML = view.projects.map(p =>
    `<article><strong>${esc(p.name)}</strong><span>${esc(p.used24h)} deployments / 24h</span><small>${esc(p.latest)} · ${esc(p.age)}</small></article>`).join("");
  section?.setAttribute("data-capacity-state", view.band.toLowerCase());
  section?.setAttribute("data-telemetry", view.telemetry);
  if (note) note.textContent = `${view.telemetryNote} Canonical AgentOS budget (${view.limitSource === "agentos_policy" ? "AgentOS operating policy" : view.limitSource}` +
    `${view.providerLimitVerified ? "" : "; provider limit not independently verified"}). ASHWOOD displays it; AgentOS governs deployments.`;
}

async function load() {
  const button = document.querySelector("#deployment-budget-refresh");
  if (button) { button.disabled = true; button.textContent = "Refreshing…"; }
  try {
    const response = await fetch("/api/workspace-board", { credentials: "same-origin", cache: "no-store" });
    if (!response.ok) throw new Error("AgentOS board " + response.status);
    const payload = await response.json();
    render(budgetView(selectBudgetRow(payload.rows)));
  } catch (error) {
    const host = document.querySelector("#deployment-availability") || document.querySelector("#deployment-budget-summary");
    if (host) host.innerHTML = `<p>Deployment budget unavailable: ${esc(error.message)}. This does not mean production is down.</p>`;
    document.querySelector("#deployment-budget")?.setAttribute("data-telemetry", "unavailable");
  } finally {
    if (button) { button.disabled = false; button.textContent = "Refresh"; }
  }
}

document.querySelector("#deployment-budget-refresh")?.addEventListener("click", load);
window.addEventListener("ashwood:workspace-authenticated", load);
load();
