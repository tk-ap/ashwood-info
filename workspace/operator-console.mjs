const THREAD_ID = "operator:primary";
const TERMINAL = new Set(["completed","cancelled","governance_denied","route_failed"]);

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({
  "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
}[char]));

function relative(value) {
  const time = Date.parse(value || "");
  if (!Number.isFinite(time)) return "";
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function normalize(value) {
  return String(value || "").toLowerCase();
}

function commandBelongs(command) {
  if (command?.command_kind && command.command_kind !== "owner_command") return false;
  const payload = command?.payload;
  if (!payload) return true; // legacy Workspace owner commands belong to the original operator stream
  return payload.thread_id === THREAD_ID;
}

function boardRowFor(command, rows) {
  const taskId = String(command?.runtime_task_id || "");
  if (!taskId) return null;
  return rows.find((row) => String(row?.task_id || "") === taskId) || null;
}

function governanceReason(command) {
  const governance = command?.governance;
  if (!governance || typeof governance !== "object") return "";
  return String(governance.reason || governance.message || governance.outcome || "");
}

function systemCopy(command, row) {
  const status = normalize(command.status);
  if (status === "queued") return "Stored in ASHWOOD. Waiting for the AgentOS continuity tick to claim it.";
  if (status === "claimed") return "AgentOS claimed this directive. Routing has not been projected yet.";
  if (status === "routing") return "AgentOS is routing this through the governed path.";
  if (status === "governance_unavailable") return "Governance is unavailable. The work is parked rather than bypassing the boundary.";
  if (status === "governance_denied") return `ledgato denied dispatch${governanceReason(command) ? ": " + governanceReason(command) : "."}`;
  if (status === "governance_approval_required") return "The request reached a governance gate that requires owner approval before dispatch.";
  if (status === "route_failed") return command.error || "Routing failed before governed execution could begin.";
  if (status === "dispatched") {
    if (row) return row.next_gate || row.blocker || row.summary || "The work is now in the canonical AgentOS lifecycle.";
    return "The directive was dispatched into AgentOS. Waiting for the canonical task projection.";
  }
  if (status === "completed") return "This command reached a completed runtime state.";
  if (status === "cancelled") return "This command was cancelled.";
  return "Waiting for a canonical runtime update.";
}

function stateTone(status) {
  const value = normalize(status);
  if (["governance_denied","route_failed","failed","blocked"].includes(value)) return "risk";
  if (["governance_approval_required","review","waiting_approval"].includes(value)) return "decision";
  if (["completed","done","shipped"].includes(value)) return "done";
  return "active";
}

function taskFacts(row) {
  if (!row) return "";
  const facts = [
    row.assignee || row.owner ? `Assigned · ${escapeHtml(row.assignee || row.owner)}` : null,
    row.stage || row.phase || row.status ? `Stage · ${escapeHtml(row.stage || row.phase || row.status)}` : null,
    row.blocker ? `Blocker · ${escapeHtml(row.blocker)}` : null,
    row.next_gate ? `Next · ${escapeHtml(row.next_gate)}` : null,
  ].filter(Boolean);
  return facts.length ? `<div class="operator-response__facts">${facts.map((fact) => `<span>${fact}</span>`).join("")}</div>` : "";
}

function renderCommand(command, rows) {
  const row = boardRowFor(command, rows);
  const status = row?.status || command.status || "queued";
  const sourceLink = row?.canonical_url
    ? `<a href="${escapeHtml(row.canonical_url)}" target="_blank" rel="noopener">Canonical source ↗</a>`
    : "";
  const ids = [
    command.runtime_task_id ? `task ${escapeHtml(command.runtime_task_id)}` : null,
    command.runtime_directive_id ? `directive ${escapeHtml(command.runtime_directive_id)}` : null,
  ].filter(Boolean).join(" · ");

  return `<article class="operator-exchange" data-command-id="${escapeHtml(command.id)}">
    <div class="operator-message operator-message--owner">
      <div class="operator-message__meta"><span>TK</span><span>${escapeHtml(relative(command.created_at))}</span></div>
      <p>${escapeHtml(command.command_text)}</p>
    </div>
    <div class="operator-response operator-response--${stateTone(status)}">
      <div class="operator-response__meta">
        <span>AgentOS</span>
        <span>${escapeHtml(String(status).replaceAll("_"," "))}</span>
        <span>${escapeHtml(relative(command.updated_at))}</span>
      </div>
      <p>${escapeHtml(systemCopy(command, row))}</p>
      ${taskFacts(row)}
      <div class="operator-response__links">
        ${ids ? `<code>${ids}</code>` : ""}
        ${sourceLink}
      </div>
    </div>
  </article>`;
}

let timer = null;
let loading = false;

async function readJson(url) {
  const response = await fetch(url, { credentials:"same-origin", cache:"no-store" });
  if (!response.ok) {
    const error = new Error(`Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

async function loadOperator() {
  if (loading) return;
  loading = true;
  const thread = document.querySelector("#operator-thread");
  const ingress = document.querySelector("#operator-ingress-state");
  const activeNode = document.querySelector("#operator-active-state");
  try {
    const [commandsPayload, boardPayload] = await Promise.all([
      readJson("/api/workspace-state?view=commands"),
      readJson("/api/workspace-board"),
    ]);
    const commands = (Array.isArray(commandsPayload.commands) ? commandsPayload.commands : [])
      .filter(commandBelongs)
      .slice(0, 12)
      .reverse();
    const rows = Array.isArray(boardPayload.rows) ? boardPayload.rows : [];

    if (thread) {
      thread.innerHTML = commands.length
        ? commands.map((command) => renderCommand(command, rows)).join("")
        : '<p class="operator-thread__empty"><strong>No Operator directives yet.</strong><span>Send a request above; its governed AgentOS state will return here.</span></p>';
      thread.scrollTop = thread.scrollHeight;
    }

    const active = commands.filter((command) => !TERMINAL.has(normalize(command.status)));
    if (activeNode) activeNode.textContent = `${active.length} active`;
    if (ingress) ingress.textContent = "Ingress · connected";

    clearTimeout(timer);
    if (active.length && document.visibilityState === "visible") {
      timer = setTimeout(loadOperator, 5000);
    }
  } catch (error) {
    if (ingress) ingress.textContent = error.status === 401 ? "Ingress · workspace locked" : "Ingress · unavailable";
    if (thread) thread.innerHTML = '<p class="operator-thread__empty"><strong>Operator state unavailable.</strong><span>This does not mean AgentOS or production is down. Unlock or refresh Workspace to retry.</span></p>';
  } finally {
    loading = false;
  }
}

window.addEventListener("ashwood:operator-command-submitted", () => {
  clearTimeout(timer);
  setTimeout(loadOperator, 250);
});
window.addEventListener("ashwood:workspace-authenticated", loadOperator);
window.addEventListener("ashwood:refresh-feed", loadOperator);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") loadOperator();
  else clearTimeout(timer);
});

loadOperator();
