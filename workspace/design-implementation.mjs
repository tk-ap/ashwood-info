// Workspace → Build → Design Implementation (ashwood-info#149).
//
// A read-only projection. The session-protected /api/workspace-design returns a snapshot
// that scripts/reconcile-design-implementation.mjs derived from GitHub, the revision each
// production domain actually serves, and visual-verification records on #149. This module
// only arranges it so the eight questions are answered at a glance; technical evidence
// sits behind progressive disclosure.

export const STEPS = [
  ["discussed", "Agreed"],
  ["designed", "Designed"],
  ["built", "In code"],
  ["merged", "Merged"],
  ["deployed", "Live"],
  ["verified", "Checked live"],
];

export const FILTERS = [
  ["all", "Agreed", s => s.agreed],
  ["inCode", "In code", s => s.inCode],
  ["merged", "Merged", s => s.merged],
  ["live", "Live", s => s.live],
  ["verified", "Checked live", s => s.verified],
  ["unfinished", "Unfinished", s => s.unfinished],
  ["blocked", "Blocked", s => s.blocked],
  ["stale", "Stale", s => s.stale],
];

const STEP_INDEX = Object.fromEntries(STEPS.map(([key], i) => [key, i]));

export function matchesFilter(item, filter) {
  const l = item.lifecycle || {};
  const i = STEP_INDEX[l.state] ?? 0;
  switch (filter) {
    case "inCode": return !l.stale && i >= STEP_INDEX.built;
    case "merged": return !l.stale && i >= STEP_INDEX.merged;
    case "live": return !l.stale && i >= STEP_INDEX.deployed;
    case "verified": return !l.stale && i >= STEP_INDEX.verified;
    case "unfinished": return Boolean(l.unfinished);
    case "blocked": return Boolean(l.blocked);
    case "stale": return Boolean(l.stale);
    default: return !l.stale;
  }
}

/** One plain sentence: what is true now and what happens next. */
export function nextStep(item) {
  const l = item.lifecycle || {};
  if (l.stale) return "Superseded. Kept for the record; do not revive.";
  if (item.blocker) return item.blocker;
  if (l.evidenceUnavailable) return "Some evidence could not be retrieved at the last sync, so this shows only what was confirmed.";
  switch (l.state) {
    case "discussed": return "Agreed, not designed or built yet.";
    case "designed": return item.design_refs?.some(r => r.kind === "prototype")
      ? "A prototype exists as reference. Not built on main yet."
      : "Designed. Not built yet.";
    case "built": return "In code, not merged yet.";
    case "merged": return item.facts?.live?.note || "Merged, not in the revision production is serving yet.";
    case "deployed":
      if (l.verification === "reverify") return "Live, but changed since it was last checked. Check it on production again.";
      if (l.verification === "different-revision") return "Live. The last check was on a different revision; check it again.";
      return "Live. Not visually checked on production yet.";
    case "verified": return "Live and visually checked on production.";
    default: return "State unknown.";
  }
}

export function groupByProduct(items) {
  const groups = new Map();
  for (const item of items) {
    if (!groups.has(item.product)) groups.set(item.product, []);
    groups.get(item.product).push(item);
  }
  return [...groups.entries()];
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else node.setAttribute(key, value === true ? "" : value);
  }
  for (const child of children.flat(Infinity)) if (child !== null && child !== undefined && child !== false && child !== "") node.append(child);
  return node;
}

function link(href, label) {
  return href ? el("a", { href, target: "_blank", rel: "noopener noreferrer", text: label }) : el("span", { text: label });
}

function short(sha) { return sha ? String(sha).slice(0, 7) : "—"; }

function ago(iso, now = Date.now()) {
  if (!iso) return "unknown";
  const minutes = Math.max(0, Math.round((now - Date.parse(iso)) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return hours < 48 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
}

function stepper(item) {
  const current = STEP_INDEX[item.lifecycle?.state] ?? 0;
  return el("ol", { class: "design-impl-steps", "aria-label": `Lifecycle: ${STEPS[current][1]}` },
    STEPS.map(([key, label], i) => el("li", {
      class: `design-impl-step${i <= current ? " is-reached" : ""}${i === current ? " is-current" : ""}`,
      "data-step": key,
      title: label,
    }, el("span", { class: "design-impl-step-label", text: label }))));
}

function evidence(item) {
  const f = item.facts || {};
  const rows = [
    ["Reference", el("span", { text: item.reference })],
    ["Intended change", el("span", { text: item.change })],
    ["Must not regress", el("span", { text: item.regression })],
  ];
  if (f.prs?.length) rows.push(["Pull requests", el("span", {}, f.prs.map((pr, i) => [i ? ", " : "",
    link(pr.url, `#${pr.number} ${pr.merged ? "merged" : pr.state}`)]))]);
  if (f.commitsOnMain?.length) rows.push(["Commits", el("span", { text: f.commitsOnMain.map(c => `${short(c.sha)} ${!c.exists ? "not found on GitHub" : c.onMain === true ? "on main" : c.onMain === false ? "not on main" : "ancestry unknown"}`).join(", ") })]);
  if (item.design_refs?.length) rows.push(["Design refs", el("span", {}, item.design_refs.map((r, i) => [i ? ", " : "",
    link(`https://github.com/${r.repo}/${r.kind === "issue" ? "issues" : "pull"}/${r.number}`, `${r.repo.split("/")[1]} #${r.number} (${r.kind})`)]))]);
  if (item.live?.url) rows.push(["Production", link(item.live.url, item.live.url.replace(/^https?:\/\//, ""))]);
  if (f.live?.revision || f.live?.note) rows.push(["Serving", el("span", {
    text: [f.live?.revision ? `revision ${short(f.live.revision)}${f.live.ref && f.live.ref !== "main" ? ` from ${f.live.ref}` : ""}` : null,
      f.live?.via ? `via ${f.live.via}` : null, f.live?.created_at ? ago(f.live.created_at) : null, f.live?.note].filter(Boolean).join(" · "),
  })]);
  const v = f.verification;
  rows.push(["Visual check", v
    ? el("span", {}, `${short(v.revision)} · ${ago(v.at)}${v.viewports ? ` · ${v.viewports}` : ""} · ${v.exercised || ""} `, link(v.comment, "record"))
    : el("span", { text: "No verification record yet." })]);
  if (item.notes) rows.push(["Notes", el("span", { text: item.notes })]);
  return el("details", { class: "design-impl-evidence" },
    el("summary", { text: "Evidence" }),
    el("dl", {}, rows.map(([term, value]) => [el("dt", { text: term }), el("dd", {}, value)])));
}

function row(item) {
  const l = item.lifecycle || {};
  const tone = l.stale ? "stale" : l.blocked ? "blocked" : l.state === "verified" ? "verified" : l.state === "deployed" ? "live" : "open";
  return el("article", { class: `design-impl-item is-${tone}`, "data-item": item.id },
    el("div", { class: "design-impl-item-head" },
      el("div", {},
        el("h4", { text: item.title }),
        el("p", { class: "design-impl-surface", text: `${item.surface} · ${item.id}` })),
      el("span", { class: "design-impl-state", text: l.stale ? "Stale" : l.blocked ? "Blocked" : STEPS[STEP_INDEX[l.state] ?? 0][1] })),
    stepper(item),
    el("p", { class: "design-impl-next", text: nextStep(item) }),
    evidence(item));
}

export function renderInto(root, snapshot, filter = "all", now = Date.now()) {
  const summaryHost = root.querySelector("#design-impl-summary");
  const listHost = root.querySelector("#design-impl-list");
  const staleHost = root.querySelector("#design-impl-stale-list");
  const reconciled = root.querySelector("#design-impl-reconciled");
  const summary = snapshot.summary || {};

  reconciled.textContent = `Reconciled ${ago(snapshot.reconciled_at, now)} from GitHub, live production revisions, and checks recorded on #149.`;
  summaryHost.replaceChildren(...FILTERS.map(([key, label, pick]) => el("button", {
    type: "button", class: `design-impl-count${key === filter ? " is-active" : ""}`, "data-filter": key,
    "aria-pressed": key === filter ? "true" : "false",
  }, el("strong", { text: String(pick(summary) ?? 0) }), el("span", { text: label }))));

  const items = (snapshot.items || []).filter(item => matchesFilter(item, filter));
  if (filter === "stale" && !items.length) {
    listHost.replaceChildren(el("p", { class: "design-impl-empty", text: "No tracked item is itself stale. Superseded branches and PRs are listed below." }));
  } else if (!items.length) {
    listHost.replaceChildren(el("p", { class: "design-impl-empty", text: "Nothing in this state right now." }));
  } else {
    listHost.replaceChildren(...groupByProduct(items).map(([product, group]) => el("section", { class: "design-impl-product" },
      el("h3", {}, product, el("small", { text: `${group.filter(i => i.lifecycle.state === "verified").length}/${group.length} checked live` })),
      group.map(row))));
  }

  staleHost.replaceChildren(...(snapshot.stale_refs || []).map(ref => el("li", {},
    el("strong", { text: `${ref.repo.split("/")[1]} · ${ref.ref}` }), ` ${ref.reason} `, el("em", { text: `Use: ${ref.replacement}` }))));
  if (filter === "stale") root.querySelector("#design-impl-stale")?.setAttribute("open", "");
}

export async function mount(root = document.getElementById("design-implementation")) {
  if (!root) return;
  const listHost = root.querySelector("#design-impl-list");
  let snapshot = null;
  let filter = "all";
  const draw = () => snapshot && renderInto(root, snapshot, filter);
  root.addEventListener("click", event => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    filter = button.dataset.filter;
    draw();
  });
  try {
    const response = await fetch("/api/workspace-design", { credentials: "same-origin", cache: "no-store" });
    if (response.status === 401) {
      listHost.replaceChildren(el("p", { class: "design-impl-empty", text: "Locked. Unlock the Workspace to see design status." }));
      return;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    snapshot = await response.json();
    draw();
  } catch (error) {
    listHost.replaceChildren(el("p", { class: "design-impl-empty is-error",
      text: "Design status is unavailable right now. This does not affect any product in production." }));
    root.querySelector("#design-impl-reconciled").textContent = "";
  }
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => mount(), { once: true });
  else mount();
}
