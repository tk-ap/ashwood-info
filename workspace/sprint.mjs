const state = { source: null, items: [], deferred: [], accepted: null };

const esc = (value = "") => String(value).replace(/[&<>'"]/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
}[c]));

function host() { return document.querySelector("#ailhat-sprint-items"); }
function status(text) {
  const el = document.querySelector("#ailhat-sprint-status");
  if (el) el.textContent = text;
}

function markOverride(item) {
  item.override = true;
  render();
}

function deferItem(index) {
  const [item] = state.items.splice(index, 1);
  if (item) state.deferred.push({ sourceId:item.sourceId, title:item.title, sourceRank:item.sourceRank });
  state.items.forEach((row, i) => { row.ownerRank = i + 1; row.override = true; });
  render();
}

function addOwnerItem() {
  if (state.items.length >= 5) return;
  const title = window.prompt("Replacement sprint item");
  if (!title?.trim()) return;
  const productName = window.prompt("Owning product", "Portfolio") || "Portfolio";
  const outcome = window.prompt("Required outcome", title) || title;
  const whyNow = window.prompt("Why override ailhat now?", "Owner override") || "Owner override";
  state.items.push({
    sourceId:null, sourceRank:null, ownerRank:state.items.length + 1,
    title:title.trim(), outcome:outcome.trim(), productId:"", productName:productName.trim(),
    repository:null, whyNow:whyNow.trim(), evidence:[], dependencies:[], blockers:[],
    acceptanceCriteria:["Deliver the owner-selected outcome without introducing a blocking regression.","Record execution evidence in AgentOS."],
    verification:"Independent verification must confirm the owner-selected outcome.", confidence:"OWNER", score:0, override:true,
  });
  render();
}

function move(index, delta) {
  const target = index + delta;
  if (target < 0 || target >= state.items.length) return;
  const [item] = state.items.splice(index, 1);
  state.items.splice(target, 0, item);
  state.items.forEach((row, i) => {
    row.override = true;
    row.ownerRank = i + 1;
  });
  render();
}

function render() {
  const root = host();
  if (!root) return;
  if (!state.items.length) {
    root.innerHTML = '<p class="ailhat-sprint-empty">No eligible sprint recommendation is available yet.</p>';
    return;
  }
  root.innerHTML = state.items.map((item, index) => `
    <article class="ailhat-sprint-card" data-index="${index}">
      <div class="ailhat-sprint-rank"><span>${index + 1}</span><small>${item.override ? "Owner override" : "ailhat"}</small></div>
      <div class="ailhat-sprint-card__body">
        <label>Item<input data-field="title" value="${esc(item.title)}" /></label>
        <label>Product<input data-field="productName" value="${esc(item.productName)}" /></label>
        <label class="ailhat-sprint-wide">Outcome<input data-field="outcome" value="${esc(item.outcome)}" /></label>
        <label>Why now<textarea data-field="whyNow" rows="2">${esc(item.whyNow)}</textarea></label>
        <p class="ailhat-sprint-evidence"><strong>Evidence</strong> ${esc((item.evidence || []).join(" · ") || "No supporting evidence returned.")}</p>
        <p class="ailhat-sprint-verify"><strong>Verify</strong> ${esc(item.verification || "Independent verification required.")}</p>
      </div>
      <div class="ailhat-sprint-card__controls">
        <button type="button" data-move="-1" aria-label="Move item up" ${index === 0 ? "disabled" : ""}>↑</button>
        <button type="button" data-move="1" aria-label="Move item down" ${index === state.items.length - 1 ? "disabled" : ""}>↓</button>
        <button type="button" data-defer aria-label="Defer this ailhat recommendation">Defer</button>
      </div>
    </article>
  `).join("");

  root.querySelectorAll(".ailhat-sprint-card").forEach(card => {
    const index = Number(card.dataset.index);
    card.querySelectorAll("[data-move]").forEach(button => button.addEventListener("click", () => move(index, Number(button.dataset.move))));
    card.querySelector("[data-defer]")?.addEventListener("click", () => deferItem(index));
    card.querySelectorAll("[data-field]").forEach(input => input.addEventListener("change", () => {
      const item = state.items[index];
      const field = input.dataset.field;
      item[field] = input.value.trim();
      markOverride(item);
    }));
  });

  const accept = document.querySelector("#ailhat-sprint-accept");
  if (accept) accept.disabled = state.items.length !== 5;
  const add = document.querySelector("#ailhat-sprint-add");
  if (add) add.hidden = state.items.length >= 5;
}

async function loadRecommendation() {
  status("Asking ailhat for the next five…");
  const root = host();
  if (root) root.innerHTML = '<p class="ailhat-sprint-empty">Reading Portfolio Intelligence…</p>';
  try {
    const response = await fetch("/api/workspace-state?view=sprint-recommendation", { credentials:"same-origin", cache:"no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Recommendation unavailable");
    state.source = payload;
    state.deferred = [];
    state.items = (payload.recommendations || []).map((item, index) => ({
      sourceId: item.sourceId,
      sourceRank: item.rank,
      ownerRank: index + 1,
      title: item.title,
      outcome: item.outcome,
      productId: item.product?.id || "",
      productName: item.product?.name || "Portfolio",
      repository: item.product?.repository || null,
      whyNow: item.whyNow,
      evidence: item.evidence || [],
      dependencies: item.dependencies || [],
      blockers: item.blockers || [],
      acceptanceCriteria: item.acceptanceCriteria || [],
      verification: item.verification,
      confidence: item.confidence,
      score: item.score,
      override: false,
    }));
    status(state.items.length === 5
      ? "ailhat selected the default sprint. Edit or reorder only if you want to override it."
      : `ailhat returned ${state.items.length} eligible item${state.items.length === 1 ? "" : "s"}; five are required to accept a sprint.`);
    render();
  } catch (error) {
    state.items = [];
    status(error.message || "Recommendation unavailable");
    render();
  }
}

async function acceptSprint() {
  if (state.items.length !== 5 || !state.source) return;
  const button = document.querySelector("#ailhat-sprint-accept");
  button.disabled = true;
  status("Freezing sprint and creating AgentOS directive…");
  try {
    const response = await fetch("/api/workspace-state", {
      method:"POST",
      credentials:"same-origin",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({
        action:"submit_sprint_directive",
        source_generated_at:state.source.generatedAt,
        deferred_source_ids:state.deferred.map(item => item.sourceId).filter(Boolean),
        selections:state.items,
      }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Could not create directive");
    state.accepted = payload;
    status(payload.existing ? "This sprint is already queued for AgentOS." : "Sprint frozen. AgentOS intake is queued.");
    const preview = document.querySelector("#ailhat-sprint-directive-preview");
    if (preview) {
      preview.hidden = false;
      preview.querySelector("pre").textContent = payload.markdown || "";
    }
    await loadHistory();
  } catch (error) {
    status(error.message || "Could not create directive");
  } finally {
    button.disabled = state.items.length !== 5;
  }
}

async function loadHistory() {
  const root = document.querySelector("#ailhat-sprint-history");
  if (!root) return;
  try {
    const response = await fetch("/api/workspace-state?view=sprint-directives", { credentials:"same-origin", cache:"no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error();
    const rows = payload.directives || [];
    root.innerHTML = rows.length ? rows.slice(0, 5).map(row =>
      `<div class="ailhat-sprint-history__row"><span>${esc(row.status)}</span><strong>${esc(row.id)}</strong><small>${esc(new Date(row.created_at).toLocaleString())}</small></div>`
    ).join("") : '<p class="ailhat-sprint-empty">No accepted ailhat sprint directives yet.</p>';
  } catch {
    root.innerHTML = '<p class="ailhat-sprint-empty">Directive history unavailable.</p>';
  }
}

document.querySelector("#ailhat-sprint-refresh")?.addEventListener("click", loadRecommendation);
document.querySelector("#ailhat-sprint-accept")?.addEventListener("click", acceptSprint);
document.querySelector("#ailhat-sprint-add")?.addEventListener("click", addOwnerItem);
loadRecommendation();
loadHistory();
