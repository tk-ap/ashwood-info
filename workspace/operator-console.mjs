const THREAD_ID = "operator:primary";
const COMMAND_TERMINAL = new Set(["completed","cancelled","governance_denied","route_failed"]);
const TASK_TERMINAL = new Set(["accepted","done","completed","shipped","denied","revoked"]);

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
  if (!payload) return true;
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
    if (row?.metadata?.outcome) return row.metadata.outcome;
    if (row) return row.next_gate || row.blocker || row.summary || "The work is now in the canonical AgentOS lifecycle.";
    return "The directive was dispatched into AgentOS. Waiting for the canonical task projection.";
  }
  if (status === "completed") return "This command reached a completed runtime state.";
  if (status === "cancelled") return "This command was cancelled.";
  return "Waiting for a canonical runtime update.";
}

function stateTone(status) {
  const value = normalize(status);
  if (["governance_denied","route_failed","failed","blocked","denied","revoked"].includes(value)) return "risk";
  if (["governance_approval_required","review","waiting_approval","collision"].includes(value)) return "decision";
  if (["accepted","completed","done","shipped"].includes(value)) return "done";
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

function evidenceMarkup(row) {
  const meta = row?.metadata || {};
  const review = meta.review && typeof meta.review === "object" ? meta.review : null;
  const events = Array.isArray(meta.recent_events) ? meta.recent_events.slice(0, 3) : [];
  if (!review && !events.length && !meta.outcome) return "";

  const reviewHtml = review ? `<div class="operator-evidence__review">
      <strong>Independent review · ${escapeHtml(review.verdict || "unknown")}</strong>
      ${review.finding ? `<p>${escapeHtml(review.finding)}</p>` : ""}
    </div>` : "";
  const eventHtml = events.length ? `<ol>${events.map((event) =>
    `<li><span>${escapeHtml(String(event.kind || "").replaceAll("_"," "))}</span>${event.summary ? `<small>${escapeHtml(event.summary)}</small>` : ""}</li>`
  ).join("")}</ol>` : "";

  return `<details class="operator-evidence">
    <summary>Outcome & evidence</summary>
    ${meta.outcome ? `<p class="operator-evidence__outcome">${escapeHtml(meta.outcome)}</p>` : ""}
    ${reviewHtml}
    ${eventHtml}
  </details>`;
}

function decisionMarkup(row) {
  const decision = row?.metadata?.owner_decision;
  const actions = Array.isArray(decision?.actions) ? decision.actions : [];
  if (!decision?.card_id || !actions.length || !row?.task_id) return "";
  const label = {
    accept:"Accept result",
    pause:"Pause",
    approve:"Approve scoped authority",
    deny:"Deny & cancel",
    resume:"Resume after overlap check",
  };
  return `<div class="operator-decision" data-review-card="${escapeHtml(decision.card_id)}">
    <div>
      <strong>Decision required</strong>
      <p>${escapeHtml(decision.scope || decision.summary || "AgentOS is waiting for your decision.")}</p>
    </div>
    <div class="operator-decision__actions">
      ${actions.map((action) => `<button type="button"
        data-owner-decision="${escapeHtml(action)}"
        data-task-id="${escapeHtml(row.task_id)}"
        data-card-id="${escapeHtml(decision.card_id)}"
        data-observed-snapshot="${escapeHtml(decision.snapshot || "")}">
        ${escapeHtml(label[action] || action)}
      </button>`).join("")}
    </div>
    <small data-owner-decision-status></small>
  </div>`;
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
        <span>${escapeHtml(relative(row?.updated_at || command.updated_at))}</span>
      </div>
      <p>${escapeHtml(systemCopy(command, row))}</p>
      ${taskFacts(row)}
      ${evidenceMarkup(row)}
      ${decisionMarkup(row)}
      <div class="operator-response__links">
        ${ids ? `<code>${ids}</code>` : ""}
        ${sourceLink}
      </div>
    </div>
  </article>`;
}

function commandActive(command, rows) {
  if (COMMAND_TERMINAL.has(normalize(command.status))) return false;
  const row = boardRowFor(command, rows);
  if (row && TASK_TERMINAL.has(normalize(row.status || row.phase))) return false;
  return true;
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

    const active = commands.filter((command) => commandActive(command, rows));
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

async function submitOwnerDecision(button) {
  const host = button.closest(".operator-decision");
  const status = host?.querySelector("[data-owner-decision-status]");
  const buttons = host ? [...host.querySelectorAll("[data-owner-decision]")] : [button];
  buttons.forEach((item) => { item.disabled = true; });
  if (status) status.textContent = "Queuing decision…";
  try {
    const response = await fetch("/api/workspace-state", {
      method:"POST",
      credentials:"same-origin",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        action:"submit_owner_decision",
        task_id:button.dataset.taskId,
        card_id:button.dataset.cardId,
        decision:button.dataset.ownerDecision,
        observed_snapshot:button.dataset.observedSnapshot || null,
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `Decision failed (${response.status})`);
    if (status) status.textContent = body.existing ? "Decision already queued." : "Decision queued through AgentOS.";
    clearTimeout(timer);
    setTimeout(loadOperator, 450);
  } catch (error) {
    buttons.forEach((item) => { item.disabled = false; });
    if (status) status.textContent = error.message || "Decision could not be queued.";
  }
}

document.querySelector("#operator-thread")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-owner-decision]");
  if (button) void submitOwnerDecision(button);
});

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
