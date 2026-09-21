const root = document.querySelector("#operator-actions-list");
const statusNode = document.querySelector("#operator-actions-status");
const copyAllButton = document.querySelector("#operator-actions-copy-all");
const refreshButton = document.querySelector("#operator-actions-refresh");

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, char => ({
  "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
}[char]));

async function copyText(value, button) {
  const text = String(value || "");
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
  if (button) {
    const previous = button.textContent;
    button.textContent = "Copied";
    setTimeout(() => { button.textContent = previous; }, 1200);
  }
}

function activeActions(rows) {
  return (Array.isArray(rows) ? rows : [])
    .filter(row => row?.kind === "operator_action" && ["waiting","blocked"].includes(String(row.status || "")))
    .sort((a, b) => {
      const rank = value => value === "blocked" ? 0 : 1;
      return rank(a.status) - rank(b.status) || Date.parse(b.updated_at || 0) - Date.parse(a.updated_at || 0);
    });
}

function compatibleBatch(rows) {
  const waiting = rows.filter(row => row.status === "waiting");
  if (!waiting.length) return [];
  if (!waiting.every(row => row.metadata?.safe_to_batch === true)) return [];
  const keys = new Set(waiting.map(row => String(row.metadata?.batch_key || "")).filter(Boolean));
  if (keys.size !== 1) return [];
  return waiting;
}

function commandBundle(rows) {
  return rows.map((row, index) => {
    const meta = row.metadata || {};
    const lines = [
      "# " + (row.title || `Omarchy action ${index + 1}`),
      meta.repository ? "# repo: " + meta.repository : null,
      row.workspace ? "# workspace: " + row.workspace : null,
      meta.prerequisite ? "# prerequisite: " + meta.prerequisite : null,
      meta.command_text || "",
      meta.verify_text ? "\n# verify\n" + meta.verify_text : null,
    ].filter(Boolean);
    return lines.join("\n");
  }).join("\n\n");
}

function render(rows) {
  if (!root) return;
  const actions = activeActions(rows);
  const ready = actions.filter(row => row.status === "waiting");
  const blocked = actions.filter(row => row.status === "blocked");
  if (statusNode) statusNode.textContent = `${ready.length} ready · ${blocked.length} blocked`;

  const batch = compatibleBatch(actions);
  if (copyAllButton) {
    copyAllButton.disabled = batch.length === 0;
    copyAllButton.hidden = actions.length === 0;
    copyAllButton.title = batch.length
      ? `Copy ${batch.length} compatible waiting action${batch.length === 1 ? "" : "s"}`
      : "Ready actions are not all in one compatible batch.";
    copyAllButton.dataset.bundle = batch.length ? commandBundle(batch) : "";
  }

  if (!actions.length) {
    root.innerHTML = '<p class="operator-actions-empty">No Omarchy actions are waiting. Agent work has no recorded workstation handoff right now.</p>';
    return;
  }

  root.innerHTML = actions.map(row => {
    const meta = row.metadata || {};
    const flags = [
      row.status === "blocked" ? "Blocked" : "Ready",
      meta.requires_sudo ? "sudo" : null,
      meta.requires_human_interaction ? "interactive" : null,
      meta.safe_to_batch ? "batchable" : "run alone",
      meta.batch_key ? `batch · ${meta.batch_key}` : null,
    ].filter(Boolean);
    const commands = String(meta.command_text || "");
    const verify = String(meta.verify_text || "");
    const source = [meta.source_ref, row.task_id].filter(Boolean).join(" · ");
    return `
      <article class="operator-action-card ${row.status === "blocked" ? "is-blocked" : "is-ready"}">
        <div class="operator-action-card__top">
          <div>
            <div class="operator-action-card__flags">${flags.map(flag => `<span>${escapeHtml(flag)}</span>`).join("")}</div>
            <h3>${escapeHtml(row.title || "Omarchy action")}</h3>
          </div>
          <button type="button" data-copy-command>Copy commands</button>
        </div>
        <p class="operator-action-card__reason">${escapeHtml(row.summary || "Local operator action required.")}</p>
        ${row.blocker ? `<p class="operator-action-card__blocker"><strong>Blocked by</strong> ${escapeHtml(row.blocker)}</p>` : ""}
        ${meta.prerequisite ? `<p class="operator-action-card__prereq"><strong>Before you run it</strong> ${escapeHtml(meta.prerequisite)}</p>` : ""}
        <div class="operator-action-card__meta">
          ${meta.repository ? `<span>${escapeHtml(meta.repository)}</span>` : ""}
          ${row.workspace ? `<span>${escapeHtml(row.workspace)}</span>` : ""}
          ${source ? `<span>${escapeHtml(source)}</span>` : ""}
        </div>
        <details>
          <summary>Terminal commands</summary>
          <pre data-command-text>${escapeHtml(commands)}</pre>
        </details>
        ${verify ? `<details><summary>Verification</summary><pre>${escapeHtml(verify)}</pre></details>` : ""}
        <p class="operator-action-card__note">Run at the Omarchy workstation. Workspace is read-only; completion remains canonical in AgentOS.</p>
      </article>
    `;
  }).join("");

  root.querySelectorAll(".operator-action-card").forEach((card, index) => {
    card.querySelector("[data-copy-command]")?.addEventListener("click", event => {
      const row = actions[index];
      copyText(commandBundle([row]), event.currentTarget);
    });
  });
}

async function load() {
  if (statusNode) statusNode.textContent = "Reading canonical AgentOS state…";
  try {
    const response = await fetch("/api/workspace-board", {
      credentials:"same-origin",
      cache:"no-store",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "AgentOS board unavailable");
    render(data.rows || []);
  } catch (error) {
    if (statusNode) statusNode.textContent = "Unavailable";
    if (root) root.innerHTML = '<p class="operator-actions-empty">Could not read deferred Omarchy actions from AgentOS.</p>';
  }
}

refreshButton?.addEventListener("click", load);
copyAllButton?.addEventListener("click", event => copyText(event.currentTarget.dataset.bundle || "", event.currentTarget));

load();
