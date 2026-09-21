// Pure view model for the Workspace deployment tracker.
//
// ASHWOOD does not calculate the deployment budget. AgentOS owns it and
// publishes one canonical board row (kind "deployment_budget"); this module only
// selects that row and formats the values it already holds. No limit constant,
// no window arithmetic, no Vercel calls.

export const BUDGET_KIND = "deployment_budget";
const STALE_DISPLAY_MS = 45 * 60 * 1000; // publisher heartbeat is 15 min

export function selectBudgetRow(rows) {
  return (Array.isArray(rows) ? rows : []).find(row => row?.kind === BUDGET_KIND) || null;
}

function ageLabel(iso, nowMs) {
  if (!iso) return "unknown";
  const minutes = Math.max(0, Math.round((nowMs - Date.parse(iso)) / 60000));
  return minutes < 60 ? `${minutes}m ago` : `${Math.round(minutes / 60)}h ago`;
}

function deploymentLabel(d) {
  if (!d) return "UNKNOWN";
  if (d.state === "READY" && d.target === "production") return "LIVE";
  if (d.state === "READY") return "PREVIEW READY";
  return d.state || "UNKNOWN";
}

export function budgetView(row, nowMs = Date.now()) {
  if (!row) {
    return { available: false, telemetry: "unavailable",
      message: "AgentOS has not published a deployment budget yet. This does not mean production is down." };
  }
  const meta = row.metadata || {};
  const b = meta.deployment_budget || {};
  const t = b.telemetry || { status: "unavailable" };
  const lastOk = t.last_success_at || null;
  const displayStale = !lastOk || nowMs - Date.parse(lastOk) > STALE_DISPLAY_MS;
  const telemetry = t.status !== "ok" ? t.status : (t.stale || displayStale ? "stale" : "ok");
  const ashwood = (b.projects || {}).ASHWOOD || {};
  const hasNumbers = b.used !== null && b.used !== undefined;
  return {
    available: true,
    telemetry,                                   // ok | stale | unavailable
    telemetryNote: telemetry === "ok"
      ? `AgentOS observed Vercel ${ageLabel(lastOk, nowMs)}.`
      : `Deployment telemetry ${telemetry}${t.error ? ` (${t.error})` : ""}. Last good observation ${ageLabel(lastOk, nowMs)}. This is not production downtime.`,
    // Canonical values, displayed exactly as AgentOS holds them.
    limit: b.limit ?? null,
    used: hasNumbers ? b.used : null,
    capacityAvailable: hasNumbers ? b.available : null,
    utilization: b.utilization ?? null,
    band: b.band ? String(b.band).toUpperCase() : "UNKNOWN",
    deployAllowed: Boolean(b.deploy_allowed),
    nextSlotAt: b.next_slot_at || null,
    observedAt: b.observed_at || null,
    limitSource: b.limit_source || "agentos_policy",
    providerLimitVerified: Boolean(b.provider_limit_verified),
    production: ashwood.production
      ? { label: "LIVE", detail: `${ageLabel(ashwood.production.created_at, nowMs)} · ${ashwood.production.state}` }
      : { label: telemetry === "ok" ? "NO READY PRODUCTION OBSERVED" : "UNKNOWN",
          detail: telemetry === "ok" ? "No READY production deployment in the window" : "Telemetry unavailable; production not assessed" },
    latest: ashwood.latest
      ? { label: deploymentLabel(ashwood.latest), detail: `${ashwood.latest.target || "preview"} · ${ageLabel(ashwood.latest.created_at, nowMs)}` }
      : { label: "UNKNOWN", detail: "No deployment observed" },
    parked: Array.isArray(meta.parked_deployments) ? meta.parked_deployments : [],
    projects: Object.entries(b.projects || {}).map(([name, p]) => ({
      name, used24h: p.used_24h ?? 0, latest: deploymentLabel(p.latest),
      age: p.latest ? ageLabel(p.latest.created_at, nowMs) : "no recent deploy",
    })),
  };
}
