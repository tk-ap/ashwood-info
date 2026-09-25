// Pure projection: presentation only. Canonical state remains in AgentOS and Workspace APIs.
const ACTIVE = new Set(["active", "in_progress", "running", "executing", "started", "working"]);
const REVIEW = new Set(["waiting_approval", "decision_required", "review", "needs_attention", "approval_required"]);
const BLOCKED = new Set(["blocked", "failed", "error", "governance_unavailable", "route_failed", "parked", "collision", "revoked", "waiting_capacity"]);
const FINISHED = new Set(["completed", "cancelled", "governance_denied", "route_failed"]);

const norm = value => String(value || "").trim().toLowerCase();
export function isAgentRow(row) {
  const source = [row?.source_system, row?.owner, row?.assignee].map(norm).join(" ");
  return ["agentos", "agent os", "agent-os", "milchik"].some(marker => source.includes(marker));
}
export function rowState(row) {
  const status = norm(row?.status || row?.phase);
  const lane = norm(row?.lane);
  if (lane === "review" && !REVIEW.has(status)) return "review";
  if (lane === "stuck" && !BLOCKED.has(status)) return "blocked";
  if (lane === "in_progress" && !ACTIVE.has(status)) return "in_progress";
  return status;
}
export function summarizePulse(board, commands) {
  if (!board || !Array.isArray(board.rows)) return { available:false, underway:[], owner:[], blocked:[], queued:[], observedAt:null };
  const rows = board.rows.filter(isAgentRow);
  const owner = rows.filter(row => REVIEW.has(rowState(row)));
  const blocked = rows.filter(row => BLOCKED.has(rowState(row)));
  const underway = rows.filter(row => ACTIVE.has(rowState(row)));
  const queued = Array.isArray(commands) ? commands.filter(row =>
    (row?.command_kind === "owner_command" || !row?.command_kind) && !FINISHED.has(norm(row?.status))
  ) : [];
  return {
    available:true, underway, owner, blocked, queued,
    observedAt:board.as_of || board.observed_at || board.generated_at || null
  };
}
