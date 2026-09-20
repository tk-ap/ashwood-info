
const ACTIVE = new Set(["active","in_progress","running","executing","started","working"]);
const NEEDS_OWNER = new Set(["waiting_approval","decision_required","review","needs_attention"]);
const BLOCKED = new Set(["blocked","failed","error"]);
const DONE = new Set(["completed","done","shipped"]);

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, char => ({
  "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
}[char]));

const normalize = value => String(value || "").toLowerCase();
const statusOf = row => {
  const status = normalize(row && row.status);
  const lane = normalize(row && row.lane);
  if (lane === "in_progress" && !ACTIVE.has(status)) return "in_progress";
  if (lane === "review" && !NEEDS_OWNER.has(status)) return "review";
  if (lane === "stuck" && !BLOCKED.has(status)) return "blocked";
  if (lane === "done" && !DONE.has(status)) return "done";
  return status;
};
const isAgent = row => {
  const text = [row && row.source_system,row && row.owner,row && row.assignee].map(normalize).join(" ");
  return text.includes("agentos") || text.includes("agent os") || text.includes("agent-os") || text.includes("milchik");
};

function matchesPriority(row, priority) {
  const haystack = [row && row.product,row && row.title,row && row.summary,row && row.source_system]
    .map(normalize).join(" ");
  return (priority.match || []).some(term => haystack.includes(normalize(term)));
}

function priorityForRow(row, priorities) {
  return priorities.find(priority => matchesPriority(row, priority)) || null;
}

async function readJson(url) {
  const response = await fetch(url, { credentials:"same-origin", cache:"no-store" });
  if (!response.ok) {
    const error = new Error("Request failed (" + response.status + ")");
    error.status = response.status;
    throw error;
  }
  return response.json();
}

function relative(value) {
  const time = Date.parse(value || "");
  if (!Number.isFinite(time)) return "";
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
  if (minutes < 1) return "now";
  if (minutes < 60) return minutes + "m ago";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + "h ago";
  return Math.floor(hours / 24) + "d ago";
}

function renderOwnerList(rows, priorities) {
  const host = document.querySelector("#today-owner-list");
  if (!host) return;
  const decisions = rows.filter(row => isAgent(row) && (NEEDS_OWNER.has(statusOf(row)) || BLOCKED.has(statusOf(row))));
  const commands = (snapshot.commands || []).filter(command => !["completed","cancelled"].includes(normalize(command.status))).slice(0,3);
  const priorityActions = priorities
    .filter(priority => ["NOW","SUPPORT"].includes(String(priority.tier || "").toUpperCase()))
    .filter(priority => !rows.some(row => matchesPriority(row, priority) && ACTIVE.has(statusOf(row))))
    .slice(0, Math.max(0,3 - decisions.length));

  const cards = [];
  decisions.slice(0,3).forEach(row => {
    const priority = priorityForRow(row, priorities);
    cards.push(
      '<article class="today-item">' +
      '<p class="today-item__eyebrow"><b>Needs you</b><span>' + escapeHtml(row.product || "AgentOS") + '</span></p>' +
      '<h4>' + escapeHtml(row.title || "Decision required") + '</h4>' +
      '<p>' + escapeHtml(row.next_gate || row.summary || (priority && priority.owner_next) || "Review the canonical workstream before execution continues.") + '</p>' +
      (row.canonical_url ? '<a href="' + escapeHtml(row.canonical_url) + '" target="_blank" rel="noopener">Open source ↗</a>' : "") +
      '</article>'
    );
  });

  priorityActions.forEach(priority => {
    cards.push(
      '<article class="today-item">' +
      '<p class="today-item__eyebrow"><b>Your next</b><span>' + escapeHtml(priority.tier || "NOW") + '</span></p>' +
      '<h4>' + escapeHtml(priority.product) + '</h4>' +
      '<p>' + escapeHtml(priority.owner_next || priority.outcome || "") + '</p>' +
      '</article>'
    );
  });

  commands.forEach(item => {
    const status = String(item.status || "queued").replaceAll("_"," ");
    const governance = item.governance && item.governance.outcome ? " · ledgato " + String(item.governance.outcome).toLowerCase() : "";
    cards.push(
      '<article class="today-item today-capture">' +
      '<p class="today-item__eyebrow"><b>' + escapeHtml(status) + '</b><span>' + escapeHtml(relative(item.created_at)) + governance + '</span></p>' +
      '<h4>' + escapeHtml(item.command_text) + '</h4>' +
      '<p>' + escapeHtml(item.error || "Submitted to the AgentOS command ingress. Runtime status updates here as routing and governance advance.") + '</p>' +
      '</article>'
    );
  });

  host.innerHTML = cards.join("") || '<p class="today-empty">Nothing currently requires you. That is a real state, not an empty dashboard.</p>';
  const count = document.querySelector("#today-owner-count");
  if (count) count.textContent = String(decisions.length + priorityActions.length + commands.length);
}

function renderAgentList(rows, priorities) {
  const host = document.querySelector("#today-agent-list");
  if (!host) return;
  const active = rows.filter(row => isAgent(row) && ACTIVE.has(statusOf(row)));
  const blocked = rows.filter(row => isAgent(row) && BLOCKED.has(statusOf(row)));
  const review = rows.filter(row => isAgent(row) && NEEDS_OWNER.has(statusOf(row)));
  const ordered = active.concat(review, blocked).slice(0,5);

  host.innerHTML = ordered.map(row => {
    const priority = priorityForRow(row, priorities);
    return '<article class="today-item">' +
      '<p class="today-item__eyebrow"><b>' + escapeHtml(String(row.status || "active").replaceAll("_"," ")) + '</b><span>' + escapeHtml(row.product || "AgentOS") + '</span></p>' +
      '<h4>' + escapeHtml(row.title || "Autonomous work") + '</h4>' +
      '<p>' + escapeHtml(row.next_gate || row.summary || (priority && priority.outcome) || "Canonical workstream is synced.") + '</p>' +
      '</article>';
  }).join("") || '<p class="today-empty">No autonomous work is confirmed by the synced workstream projection.</p>';

  const count = document.querySelector("#today-agent-count");
  if (count) count.textContent = String(active.length);
}

function chooseNext(rows, priorities) {
  const ranked = priorities.slice().sort((a,b) => Number(a.rank || 99) - Number(b.rank || 99));
  for (const priority of ranked) {
    const matching = rows.filter(row => matchesPriority(row, priority) && isAgent(row));
    const ownerRow = matching.find(row => NEEDS_OWNER.has(statusOf(row)) || BLOCKED.has(statusOf(row)));
    if (ownerRow) {
      return {
        title: ownerRow.title || priority.product,
        reason: "Highest-ranked priority currently waiting on owner judgment or an unblock. " + (ownerRow.next_gate || priority.owner_next || ""),
        row: ownerRow
      };
    }
  }
  for (const priority of ranked) {
    if (!["NOW","SUPPORT"].includes(String(priority.tier || "").toUpperCase())) continue;
    const active = rows.some(row => matchesPriority(row, priority) && isAgent(row) && ACTIVE.has(statusOf(row)));
    if (!active) {
      return {
        title: priority.product + " — " + priority.outcome,
        reason: "Highest-ranked active priority with no confirmed autonomous execution. Your next: " + (priority.owner_next || "Review the next proof gate."),
        row: null
      };
    }
  }
  const underway = rows.find(row => isAgent(row) && ACTIVE.has(statusOf(row)));
  if (underway) {
    return {
      title: underway.title || "Continue current autonomous work",
      reason: underway.next_gate || underway.summary || "All ranked NOW priorities already have confirmed execution; inspect the current next gate.",
      row: underway
    };
  }
  return {
    title: "No next objective can be grounded yet.",
    reason: "The synced data does not support inventing work. Refresh the canonical workstream projection first.",
    row: null
  };
}

function renderNext(rows, priorities) {
  const next = chooseNext(rows, priorities);
  const title = document.querySelector("#today-next-title");
  const reason = document.querySelector("#today-next-reason");
  const link = document.querySelector("#today-next-link");
  if (title) title.textContent = next.title;
  if (reason) reason.textContent = next.reason;
  if (link) {
    if (next.row && next.row.canonical_url) {
      link.hidden = false;
      link.href = next.row.canonical_url;
      link.textContent = "Open canonical source ↗";
    } else {
      link.hidden = true;
      link.removeAttribute("href");
    }
  }
}

function renderSessions(rows, priorities) {
  const host = document.querySelector("#today-sessions");
  if (!host) return;
  const sessions = rows.filter(row => isAgent(row) && (ACTIVE.has(statusOf(row)) || NEEDS_OWNER.has(statusOf(row)) || BLOCKED.has(statusOf(row)))).slice(0,6);
  host.innerHTML = sessions.map(row => {
    const priority = priorityForRow(row, priorities);
    return '<article class="today-session">' +
      '<div class="today-session__title"><span class="today-session__status">' + escapeHtml(String(row.status || "active").replaceAll("_"," ")) + '</span><h4>' + escapeHtml(row.title || "AgentOS workstream") + '</h4></div>' +
      '<div><dl>' +
      '<div><dt>Why now</dt><dd>' + escapeHtml((priority && priority.outcome) || row.summary || "Synced canonical work.") + '</dd></div>' +
      '<div><dt>Assigned</dt><dd>' + escapeHtml(row.owner || row.assignee || row.source_system || "AgentOS") + '</dd></div>' +
      '<div><dt>Current step</dt><dd>' + escapeHtml(row.stage || row.status || "Active") + '</dd></div>' +
      '<div><dt>Next / blocker</dt><dd>' + escapeHtml(row.next_gate || "No explicit gate published.") + '</dd></div>' +
      '</dl>' +
      (row.canonical_url ? '<a class="today-session__source" href="' + escapeHtml(row.canonical_url) + '" target="_blank" rel="noopener">Evidence / canonical source ↗</a>' : "") +
      '</div></article>';
  }).join("") || '<p class="today-empty">No active AgentOS session is currently confirmed. The Workspace will not imply execution without a synced source.</p>';
}

function renderSummary(rows) {
  const agentRows = rows.filter(isAgent);
  const active = agentRows.filter(row => ACTIVE.has(statusOf(row))).length;
  const needs = agentRows.filter(row => NEEDS_OWNER.has(statusOf(row))).length;
  const blocked = agentRows.filter(row => BLOCKED.has(statusOf(row))).length;
  const done = agentRows.filter(row => DONE.has(statusOf(row))).length;
  const status = document.querySelector("#today-status");
  if (status) status.textContent = active + " underway · " + needs + " need you · " + blocked + " blocked · " + done + " recently complete";
}

let snapshot = { rows:[], priorities:[], commands:[] };

async function loadToday() {
  const refresh = document.querySelector("#today-refresh");
  if (refresh) refresh.disabled = true;

  const results = await Promise.allSettled([
    readJson("/api/workspace-board"),
    readJson("/workspace/priorities.json"),
    readJson("/api/workspace-state?view=commands")
  ]);

  const boardResult = results[0];
  const prioritiesResult = results[1];
  const commandsResult = results[2];

  snapshot = {
    rows: boardResult.status === "fulfilled" && Array.isArray(boardResult.value.rows) ? boardResult.value.rows : [],
    priorities: prioritiesResult.status === "fulfilled" && Array.isArray(prioritiesResult.value.priorities) ? prioritiesResult.value.priorities : [],
    commands: commandsResult.status === "fulfilled" && Array.isArray(commandsResult.value.commands) ? commandsResult.value.commands : []
  };

  renderOwnerList(snapshot.rows, snapshot.priorities);
  renderNext(snapshot.rows, snapshot.priorities);

  if (boardResult.status === "fulfilled") {
    renderSummary(snapshot.rows);
    renderAgentList(snapshot.rows, snapshot.priorities);
    renderSessions(snapshot.rows, snapshot.priorities);
  } else {
    const error = boardResult.reason || new Error("AgentOS board unavailable");
    const locked = error.status === 401;
    const message = locked
      ? "Unlock Workspace to load AgentOS execution."
      : "AgentOS execution could not load from the synced board. The Workspace is not inferring motion.";

    const status = document.querySelector("#today-status");
    if (status) status.textContent = message;

    const agent = document.querySelector("#today-agent-list");
    if (agent) agent.innerHTML = '<p class="today-empty">' + escapeHtml(message) + '</p>';

    const sessions = document.querySelector("#today-sessions");
    if (sessions) sessions.innerHTML = '<p class="today-empty">' + escapeHtml(message) + '</p>';

    const count = document.querySelector("#today-agent-count");
    if (count) count.textContent = "0";
  }

  if (commandsResult.status === "rejected" && commandsResult.reason?.status !== 401) {
    const owner = document.querySelector("#today-owner-list");
    if (owner && !snapshot.commands.length && !snapshot.priorities.length) {
      owner.innerHTML = '<p class="today-empty">Owner actions could not load. Try refreshing Today.</p>';
    }
  }

  if (refresh) {
    refresh.disabled = false;
    refresh.textContent = "Refresh next objective";
  }

  return boardResult.status === "fulfilled";
}

function mountCommand() {
  const form = document.querySelector("#today-command-form");
  const input = document.querySelector("#today-command-input");
  const note = document.querySelector("#today-command-note");
  if (!form || !input) return;
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    const button = form.querySelector("button[type=submit]");
    if (button) button.disabled = true;
    if (note) note.textContent = "Submitting to AgentOS ingress…";
    try {
      const response = await fetch("/api/workspace-state", {
        method:"POST",
        credentials:"same-origin",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action:"submit_command",command:text})
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Command submission failed");
      input.value = "";
      if (note) note.textContent = "Queued for AgentOS. Routing is local; ledgato must ALLOW the governed dispatch before execution is enqueued.";
      await loadToday();
    } catch (error) {
      if (note) note.textContent = error.message;
    } finally {
      if (button) button.disabled = false;
    }
  });
}

function start() {
  mountCommand();
  const refresh = document.querySelector("#today-refresh");
  if (refresh) refresh.addEventListener("click", loadToday);
  loadToday().then(ok => {
    if (ok) return;
    let attempts = 0;
    const timer = setInterval(async () => {
      attempts += 1;
      if (await loadToday() || attempts >= 30) clearInterval(timer);
    },1500);
  });
}

window.addEventListener("ashwood:refresh-feed", () => loadToday());
window.addEventListener("ashwood:workspace-authenticated", () => loadToday());
start();
