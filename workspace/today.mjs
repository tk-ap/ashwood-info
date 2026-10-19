
import { provenanceChip } from "./provenance-chip.mjs";

const ACTIVE = new Set(["active","in_progress","running","executing","started","working"]);
const NEEDS_OWNER = new Set(["waiting_approval","decision_required","review","needs_attention"]);
const BLOCKED = new Set(["blocked","failed","error"]);
const DONE = new Set(["completed","done","shipped"]);
const HANDLED_STORAGE_KEY = "ashwood.workspace.today-handled.v1";

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

function provenanceFor(row, state = "KNOWN") {
  return provenanceChip({
    source: row?.source_system || row?.product || "AgentOS",
    state,
    age: relative(row?.updated_at || row?.observed_at || row?.created_at) || "age unavailable"
  });
}

function handledItems() {
  try { return new Set(JSON.parse(localStorage.getItem(HANDLED_STORAGE_KEY) || "[]")); }
  catch { return new Set(); }
}

function writeHandledItems(items) {
  try { localStorage.setItem(HANDLED_STORAGE_KEY, JSON.stringify([...items].slice(-80))); }
  catch { /* A private browser may reject local-only UI state. */ }
}

function ownerItemKey(row, index) {
  return String(row?.id || row?.canonical_url || row?.title || `owner-item-${index}`);
}

function editorialState(row) {
  const status = statusOf(row);
  if (ACTIVE.has(status)) return "UNDERWAY · LEAVE ALONE";
  if (NEEDS_OWNER.has(status)) return "NEEDS OWNER";
  if (BLOCKED.has(status)) return "POTENTIALLY STALLED";
  if (DONE.has(status)) return "COMPLETE";
  return "WAITING";
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

let snapshot = { rows:[], priorities:[], commands:[], health:null };

function editorialNode(selector) {
  return document.querySelector(selector);
}

function setEditorialText(selector, value) {
  const node = editorialNode(selector);
  if (node) node.textContent = value;
}

function renderEditorialDateLine() {
  const today = new Intl.DateTimeFormat(undefined, { weekday:"long", month:"long", day:"numeric", year:"numeric" }).format(new Date());
  let visitedAt = 0;
  try { visitedAt = Number(localStorage.getItem("ashwood.workspace.today-last-visit") || 0); } catch { /* no browser storage */ }
  const age = visitedAt ? relative(new Date(visitedAt).toISOString()) : "not recorded on this browser";
  setEditorialText("#today-date-line", today);
  setEditorialText("#today-last-visit", "Last visit " + age + ".");
  try { localStorage.setItem("ashwood.workspace.today-last-visit", String(Date.now())); } catch { /* display-only local preference */ }
}

function renderEditorialHeadline(rows, priorities) {
  const next = chooseNext(rows, priorities);
  setEditorialText("#today-editorial-headline", next.title);
  setEditorialText("#today-editorial-reason", next.reason);
  const evidence = editorialNode("#today-headline-evidence");
  if (evidence) evidence.innerHTML = provenanceFor(next.row || { source_system:"Priority model" }, next.row ? "KNOWN" : "INFERRED");
  const link = editorialNode("#today-editorial-link");
  if (!link) return;
  if (next.row?.canonical_url) {
    link.hidden = false;
    link.href = next.row.canonical_url;
    link.textContent = "Open source ↗";
  } else {
    link.hidden = true;
    link.removeAttribute("href");
  }
}

function renderEditorialSignals(rows, health) {
  const agentRows = rows.filter(isAgent);
  const active = agentRows.filter(row => ACTIVE.has(statusOf(row))).length;
  const needs = agentRows.filter(row => NEEDS_OWNER.has(statusOf(row)) || BLOCKED.has(statusOf(row))).length;
  const deployments = recentDeployments(rows, 24);
  const observed = rows.map(row => Date.parse(row?.updated_at || row?.observed_at || "")).filter(Number.isFinite).sort((a,b) => b - a)[0];

  setEditorialText("#today-editorial-owner-count", String(needs));
  setEditorialText("#today-editorial-owner-note", needs ? "Decision, approval, or unblock" : "No confirmed owner gate");
  setEditorialText("#today-editorial-active-count", String(active));
  setEditorialText("#today-editorial-active-note", active ? "Confirmed autonomous work" : "No active AgentOS work confirmed");
  setEditorialText("#today-editorial-deploys", String(deployments.length));
  setEditorialText("#today-editorial-deploys-note", deployments.length ? "Provider-observed in the last 24h" : "No provider-observed deploys in the last 24h");
  if (health && Number.isFinite(Number(health.overall_score))) {
    setEditorialText("#today-editorial-health", String(health.overall_score));
    setEditorialText("#today-editorial-health-note", "Evidence-weighted · " + (relative(health.assessed_at) || "age unavailable"));
  } else {
    setEditorialText("#today-editorial-health", "—");
    setEditorialText("#today-editorial-health-note", "Health assessment unavailable");
  }
  setEditorialText("#today-editorial-status", observed ? "Canonical state updated " + relative(new Date(observed).toISOString()) + "." : "Canonical state freshness unavailable.");
}

function renderEditorialMatters(rows, priorities) {
  const host = editorialNode("#today-matters-list");
  if (!host) return;
  const ranked = priorities.slice().sort((a,b) => Number(a.rank || 99) - Number(b.rank || 99)).slice(0, 3);
  host.innerHTML = ranked.map(priority => {
    const related = rows.filter(row => isAgent(row) && matchesPriority(row, priority));
    const row = related.find(row => NEEDS_OWNER.has(statusOf(row)) || BLOCKED.has(statusOf(row))) || related.find(row => ACTIVE.has(statusOf(row))) || related[0];
    const status = row && BLOCKED.has(statusOf(row)) ? "AT RISK" : row && ACTIVE.has(statusOf(row)) ? "PROGRESSING" : "WAITING";
    const phase = row?.stage || row?.status || "No confirmed phase";
    const next = row?.next_gate || priority.owner_next || priority.outcome || "No next action is published.";
    const blocker = row && BLOCKED.has(statusOf(row)) ? (row.next_gate || row.summary || "The source reports a block but no detail.") : "No confirmed blocker.";
    return '<article class="today-matter" data-matter-status="' + escapeHtml(status) + '">' +
      '<div><p class="today-item__eyebrow"><b>' + escapeHtml(status) + '</b>' + provenanceFor(row || { source_system:"Priority model" }, row ? "KNOWN" : "INFERRED") + '</p>' +
      '<h4>' + escapeHtml(priority.product || priority.title || "Priority") + '</h4></div>' +
      '<dl><div><dt>Phase</dt><dd>' + escapeHtml(phase) + '</dd></div><div><dt>Next</dt><dd>' + escapeHtml(next) + '</dd></div><div><dt>Blocker</dt><dd>' + escapeHtml(blocker) + '</dd></div></dl></article>';
  }).join("") || '<p class="today-empty">No ranked priority is available from the current source.</p>';
}

function renderEditorialOwner(rows, priorities) {
  const host = editorialNode("#today-editorial-owner-list");
  if (!host) return;
  const decisions = rows.filter(row => isAgent(row) && (NEEDS_OWNER.has(statusOf(row)) || BLOCKED.has(statusOf(row))));
  const suggested = priorities
    .filter(priority => ["NOW", "SUPPORT"].includes(String(priority.tier || "").toUpperCase()))
    .filter(priority => !rows.some(row => matchesPriority(row, priority) && ACTIVE.has(statusOf(row))))
    .map(priority => ({priority}));
  const commands = (snapshot.commands || []).filter(command => !["completed", "cancelled"].includes(normalize(command.status))).map(command => ({command}));
  const items = [...decisions.map(row => ({row})), ...suggested, ...commands].slice(0, 4);
  const handled = handledItems();
  host.innerHTML = items.map((item, index) => {
    const row = item.row;
    const priority = item.priority || (row && priorityForRow(row, priorities));
    const command = item.command;
    const key = ownerItemKey(row || command || priority, index);
    const title = row?.title || command?.command_text || priority?.product || "Owner attention";
    const detail = row?.next_gate || row?.summary || command?.error || priority?.owner_next || priority?.outcome || "Review the source before acting.";
    const source = row || { source_system: command ? "AgentOS command" : "Priority model", created_at: command?.created_at };
    return '<article class="today-item today-owner-item" data-handled="' + String(handled.has(key)) + '">' +
      '<p class="today-item__eyebrow"><b>Needs you</b>' + provenanceFor(source, row || command ? "KNOWN" : "INFERRED") + '</p>' +
      '<h4>' + escapeHtml(title) + '</h4><p class="today-owner-item__due">Due · ' + escapeHtml(relative(row?.due_at || row?.expires_at || command?.created_at) || "not specified") + '</p>' +
      '<details><summary>Explain</summary><p>' + escapeHtml(detail) + '</p></details>' +
      '<label class="today-handled"><input type="checkbox" data-today-handled="' + escapeHtml(key) + '"' + (handled.has(key) ? " checked" : "") + '> <span>Note as handled</span></label>' +
      (row?.canonical_url ? '<a href="' + escapeHtml(row.canonical_url) + '" target="_blank" rel="noopener">Open source ↗</a>' : "") +
      '</article>';
  }).join("") || '<p class="today-empty">Nothing currently requires you. That is a real state, not an empty dashboard.</p>';
  host.querySelectorAll("[data-today-handled]").forEach(input => input.addEventListener("change", () => {
    const next = handledItems();
    if (input.checked) next.add(input.dataset.todayHandled); else next.delete(input.dataset.todayHandled);
    writeHandledItems(next);
    input.closest(".today-owner-item")?.setAttribute("data-handled", String(input.checked));
  }));
  setEditorialText("#today-editorial-owner-total", String(items.length));
}

function renderEditorialAgents(rows, priorities) {
  const host = editorialNode("#today-editorial-agent-list");
  if (!host) return;
  const ordered = rows.filter(isAgent)
    .filter(row => ACTIVE.has(statusOf(row)) || NEEDS_OWNER.has(statusOf(row)) || BLOCKED.has(statusOf(row)) || DONE.has(statusOf(row)))
    .slice(0, 5);
  host.innerHTML = ordered.map(row => {
    const priority = priorityForRow(row, priorities);
    return '<article class="today-item today-agent-item"><p class="today-item__eyebrow"><b>' + escapeHtml(editorialState(row)) + '</b>' + provenanceFor(row) + '</p>' +
      '<h4>' + escapeHtml(row.title || "AgentOS workstream") + '</h4><p>' + escapeHtml(row.next_gate || row.summary || priority?.outcome || "Canonical workstream is synced.") + '</p></article>';
  }).join("") || '<p class="today-empty">No autonomous work is confirmed by the synced workstream projection.</p>';
  setEditorialText("#today-editorial-agent-total", String(ordered.filter(row => ACTIVE.has(statusOf(row))).length));
}

function renderEditorialDecisions(rows) {
  const host = editorialNode("#today-decision-list");
  if (!host) return;
  const decisions = rows.filter(row => isAgent(row) && NEEDS_OWNER.has(statusOf(row))).slice(0, 2);
  host.innerHTML = decisions.map(row => {
    const governance = row.governance || {};
    const willDo = row.next_gate || row.summary || "The canonical decision record did not publish an action summary.";
    const willNot = governance.will_not_do || governance.denial_effect || "No exclusion was published with this projection.";
    const scope = governance.scope || row.product || row.source_system || "Scope unavailable";
    const expiry = governance.expires_at || row.expires_at || "No expiry published";
    return '<article class="today-decision"><div><p class="today-item__eyebrow">' + provenanceFor({...row, source_system:"LEDGATo"}) + '</p><h4>' + escapeHtml(row.title || "Governed decision") + '</h4></div>' +
      '<dl><div><dt>Will do</dt><dd>' + escapeHtml(willDo) + '</dd></div><div><dt>Will not do</dt><dd>' + escapeHtml(willNot) + '</dd></div><div><dt>Scope</dt><dd>' + escapeHtml(scope) + '</dd></div><div><dt>Expiry</dt><dd>' + escapeHtml(expiry) + '</dd></div></dl>' +
      (row.canonical_url ? '<a href="' + escapeHtml(row.canonical_url) + '" target="_blank" rel="noopener">Explain in LEDGATo / Telegram card ↗</a>' : '<p class="today-decision__unavailable">The record link is unavailable in this projection.</p>') + '</article>';
  }).join("") || '<p class="today-empty">No pending LEDGATo decision is visible from the current projection.</p>';
}

function renderEditorialMovement(rows) {
  const host = editorialNode("#today-editorial-movement-list");
  if (!host) return;
  const items = movementRows(rows);
  host.innerHTML = items.length ? items.map(item => '<article class="today-movement__item"><time>' + escapeHtml(relative(item.at)) + '</time><div><strong>' + escapeHtml(item.title) + '</strong><p>' + escapeHtml(item.detail) + '</p>' + provenanceChip({source:item.kind, state:"KNOWN", age:relative(item.at) || "age unavailable"}) + '</div></article>').join("") : '<p class="today-empty">No recent movement is confirmed by the current canonical projection.</p>';
  setEditorialText("#today-editorial-movement-state", items.length ? items.length + " latest confirmed events" : "No confirmed movement");
}

function renderEditorialSessions(rows, priorities) {
  const host = editorialNode("#today-editorial-sessions");
  if (!host) return;
  const sessions = rows.filter(row => isAgent(row) && (ACTIVE.has(statusOf(row)) || NEEDS_OWNER.has(statusOf(row)) || BLOCKED.has(statusOf(row)))).slice(0, 6);
  host.innerHTML = sessions.map(row => '<article class="today-session"><div class="today-session__title"><span class="today-session__status">' + escapeHtml(editorialState(row)) + '</span><h4>' + escapeHtml(row.title || "AgentOS workstream") + '</h4></div><div><dl><div><dt>Why now</dt><dd>' + escapeHtml(priorityForRow(row, priorities)?.outcome || row.summary || "Synced canonical work.") + '</dd></div><div><dt>Next / blocker</dt><dd>' + escapeHtml(row.next_gate || "No explicit gate published.") + '</dd></div></dl>' + provenanceFor(row) + '</div></article>').join("") || '<p class="today-empty">No active AgentOS session is currently confirmed.</p>';
}

function setText(selector, value) {
  const node = document.querySelector(selector);
  if (node) node.textContent = value;
}

function deploymentRows(rows) {
  const budget = rows.find(row => row && row.kind === "deployment_budget");
  const history = budget?.metadata?.deployment_history;
  return Array.isArray(history?.deployments) ? history.deployments : [];
}

function recentDeployments(rows, hours = 24) {
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  return deploymentRows(rows).filter(row => {
    const stamp = Date.parse(row?.created_at || "");
    return Number.isFinite(stamp) && stamp >= cutoff;
  });
}

function renderCockpit(rows, health) {
  const agentRows = rows.filter(isAgent);
  const active = agentRows.filter(row => ACTIVE.has(statusOf(row))).length;
  const needs = agentRows.filter(row => NEEDS_OWNER.has(statusOf(row)) || BLOCKED.has(statusOf(row))).length;
  const deployments = recentDeployments(rows, 24);

  setText("#today-cockpit-owner", String(needs));
  setText("#today-cockpit-owner-note", needs ? "Approval, decision, or unblock required" : "No confirmed owner gate");
  setText("#today-cockpit-active", String(active));
  setText("#today-cockpit-active-note", active ? "Confirmed autonomous work" : "No active AgentOS work confirmed");
  setText("#today-cockpit-deploys", String(deployments.length));
  setText("#today-cockpit-deploys-note", deployments.length ? "Provider-observed events in the last 24h" : "No provider-observed deployments in the last 24h");

  if (health && Number.isFinite(Number(health.overall_score))) {
    const age = relative(health.assessed_at);
    setText("#today-cockpit-health", String(health.overall_score));
    setText("#today-cockpit-health-note", "Theranos / evidence-weighted · " + (age || "assessment age unavailable"));
  } else {
    setText("#today-cockpit-health", "—");
    setText("#today-cockpit-health-note", "Health assessment unavailable");
  }

  const observed = rows.map(row => Date.parse(row?.updated_at || row?.observed_at || "")).filter(Number.isFinite).sort((a,b)=>b-a)[0];
  setText("#today-cockpit-freshness", observed ? "Canonical state updated " + relative(new Date(observed).toISOString()) : "Canonical state freshness unavailable");
}

function movementRows(rows) {
  const done = rows.filter(row => DONE.has(statusOf(row))).map(row => ({
    at: row.updated_at || row.observed_at,
    kind: "Completed",
    title: row.title || row.product || "Work completed",
    detail: row.product || row.source_system || "AgentOS"
  }));
  const deployments = deploymentRows(rows).map(row => ({
    at: row.created_at,
    kind: "Deployment",
    title: row.summary || row.commit_message || row.project || "Deployment event",
    detail: [row.project, row.target, row.state].filter(Boolean).join(" · ")
  }));
  return [...done, ...deployments]
    .filter(item => Number.isFinite(Date.parse(item.at || "")))
    .sort((a,b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0,5);
}

function renderMovement(rows) {
  const host = document.querySelector("#today-movement-list");
  if (!host) return;
  const items = movementRows(rows);
  host.innerHTML = items.length ? items.map(item =>
    '<article class="today-movement__item">' +
      '<time>' + escapeHtml(relative(item.at)) + '</time>' +
      '<div><strong>' + escapeHtml(item.title) + '</strong><p>' + escapeHtml(item.detail) + '</p></div>' +
      '<small>' + escapeHtml(item.kind) + '</small>' +
    '</article>'
  ).join("") : '<p class="today-empty">No recent movement is confirmed by the current canonical projection.</p>';
  setText("#today-movement-state", items.length ? items.length + " latest confirmed events" : "No confirmed movement");
}

async function loadToday() {
  const refresh = document.querySelector("#today-refresh");
  if (refresh) refresh.disabled = true;

  const results = await Promise.allSettled([
    readJson("/api/workspace-board"),
    readJson("/workspace/priorities.json"),
    readJson("/api/workspace-state?view=commands"),
    readJson("/workspace/agentos/health-evidence.json")
  ]);

  const boardResult = results[0];
  const prioritiesResult = results[1];
  const commandsResult = results[2];
  const healthResult = results[3];

  snapshot = {
    rows: boardResult.status === "fulfilled" && Array.isArray(boardResult.value.rows) ? boardResult.value.rows : [],
    priorities: prioritiesResult.status === "fulfilled" && Array.isArray(prioritiesResult.value.priorities) ? prioritiesResult.value.priorities : [],
    commands: commandsResult.status === "fulfilled" && Array.isArray(commandsResult.value.commands) ? commandsResult.value.commands : [],
    health: healthResult.status === "fulfilled" ? healthResult.value : null
  };

  renderEditorialDateLine();
  renderEditorialHeadline(snapshot.rows, snapshot.priorities);
  renderEditorialSignals(snapshot.rows, snapshot.health);
  renderEditorialMatters(snapshot.rows, snapshot.priorities);
  renderEditorialOwner(snapshot.rows, snapshot.priorities);
  renderEditorialAgents(snapshot.rows, snapshot.priorities);
  renderEditorialDecisions(snapshot.rows);
  renderEditorialMovement(snapshot.rows);
  renderEditorialSessions(snapshot.rows, snapshot.priorities);

  renderCockpit(snapshot.rows, snapshot.health);
  renderMovement(snapshot.rows);

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
    setEditorialText("#today-editorial-status", message);
    const editorialAgent = editorialNode("#today-editorial-agent-list");
    if (editorialAgent) editorialAgent.innerHTML = '<p class="today-empty">' + escapeHtml(message) + '</p>';
    const editorialSessions = editorialNode("#today-editorial-sessions");
    if (editorialSessions) editorialSessions.innerHTML = '<p class="today-empty">' + escapeHtml(message) + '</p>';
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
  const editorialRefresh = editorialNode("#today-editorial-refresh");
  if (editorialRefresh) editorialRefresh.disabled = false;

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
        body:JSON.stringify({action:"submit_command",command:text,thread_id:"operator:primary"})
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Command submission failed");
      input.value = "";
      if (note) note.textContent = "Queued for AgentOS. Routing is local; ledgato must ALLOW the governed dispatch before execution is enqueued.";
      window.dispatchEvent(new CustomEvent("ashwood:operator-command-submitted", { detail:{ id:body.id } }));
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
  const editorialRefresh = document.querySelector("#today-editorial-refresh");
  if (editorialRefresh) editorialRefresh.addEventListener("click", loadToday);
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
