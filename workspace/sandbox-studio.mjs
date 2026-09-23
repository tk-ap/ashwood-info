const q = (selector) => document.querySelector(selector);
const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({
  "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
}[char]));

let manifest = { products:[] };
let environments = { products:[] };
let product = null;
let version = null;
let review = { completed_items:[], notes:{} };
let saveTimer = 0;

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials:"same-origin",
    headers:{"Content-Type":"application/json", ...(options.headers || {})},
    ...options,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return body;
}

async function ensureAuth() {
  const status = await api("/api/workspace-auth");
  if (status.authenticated) return true;

  return new Promise((resolve) => {
    const gate = document.createElement("div");
    gate.className = "sandbox-auth-gate";
    gate.innerHTML = `<form>
      <p class="eyebrow">ASHWOOD · PRIVATE WORKSPACE</p>
      <h1>Unlock Sandbox Studio</h1>
      <p>Use the same Workspace passphrase. Sandbox review state and change requests stay private.</p>
      <label>Passphrase<input name="passphrase" type="password" autocomplete="current-password" minlength="12" required></label>
      <p class="sandbox-auth-error" aria-live="polite"></p>
      <button type="submit">Unlock</button>
    </form>`;
    document.body.append(gate);
    gate.querySelector("input")?.focus();
    gate.querySelector("form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const error = gate.querySelector(".sandbox-auth-error");
      error.textContent = "";
      const passphrase = new FormData(event.currentTarget).get("passphrase");
      try {
        await api("/api/workspace-auth", {
          method:"POST",
          body:JSON.stringify({action:"login",passphrase}),
        });
        gate.remove();
        resolve(true);
      } catch (err) {
        error.textContent = err.message;
      }
    });
  });
}

function versionsFor(item) {
  // Competing design directions published under sub-paths of the same stable site.
  const variants = (Array.isArray(item.variants) ? item.variants : []).map((variant) => ({
    ...variant, key:`variant-${variant.id}`, label:`Variant · ${variant.label}`,
  }));
  return [
    item.stable ? {...item.stable, key:"stable", label:"Stable sandbox"} : null,
    item.latest_candidate ? {...item.latest_candidate, key:"candidate", label:"Latest candidate"} : null,
    ...variants,
  ].filter(Boolean);
}

function selectedEnvironment(productKey) {
  return (environments.products || []).find((item) => item.product_key === productKey) || null;
}

function renderProductOptions() {
  const select = q("#sandbox-product");
  const products = manifest.products || [];
  select.innerHTML = products.map((item) =>
    `<option value="${escapeHtml(item.product_key)}">${escapeHtml(item.label || item.product_key)}</option>`
  ).join("");
  const requested = new URLSearchParams(location.search).get("product");
  product = products.find((item) => item.product_key === requested) || products[0] || null;
  if (product) select.value = product.product_key;
}

function renderVersionOptions(preferred = null) {
  const select = q("#sandbox-version");
  const versions = versionsFor(product);
  select.innerHTML = versions.map((item) =>
    `<option value="${escapeHtml(item.key)}">${escapeHtml(item.label)}${item.state === "temporary_candidate" ? " · temporary" : ""}</option>`
  ).join("");
  const key = preferred && versions.some((item) => item.key === preferred) ? preferred : (versions.find((item) => item.key === "candidate")?.key || versions[0]?.key);
  select.value = key || "";
  version = versions.find((item) => item.key === key) || versions[0] || null;
}

function updateMeta() {
  const env = selectedEnvironment(product?.product_key);
  q("#sandbox-state").textContent = version
    ? `${version.label} · ${String(version.state || "unknown").replaceAll("_"," ")}`
    : "No sandbox version";
  q("#sandbox-source").textContent = version?.source_ref ? `source · ${version.source_ref.slice(0,12)}` : "source · unresolved";
  const verification = env?.sandbox?.verification?.state || (version?.state === "temporary_candidate" ? "candidate proof recorded" : "unknown");
  q("#sandbox-verification").textContent = `verification · ${verification}`;
}

function changeList() {
  return Array.isArray(version?.changes) ? version.changes : [];
}

function renderChanges() {
  const changes = changeList();
  const host = q("#sandbox-change-list");
  const overlay = q("#sandbox-change-overlay");
  const requestSelect = q("#sandbox-request-change");
  const enabled = q("#sandbox-overlay-toggle").checked;

  host.innerHTML = changes.length ? changes.map((change, index) => `<button type="button" class="sandbox-change-card" data-change-id="${escapeHtml(change.id)}">
    <span>${String(index + 1).padStart(2,"0")}</span>
    <div><strong>${escapeHtml(change.label)}</strong><small>${escapeHtml(change.scope || "")}</small><p>${escapeHtml(change.detail || "")}</p><em>${escapeHtml(change.verification || "")}</em></div>
  </button>`).join("") :
    `<p class="sandbox-empty"><strong>No annotated user-facing delta.</strong><span>${escapeHtml(version?.note || "This version has no change manifest.")}</span></p>`;

  requestSelect.innerHTML = '<option value="">Whole version</option>' + changes.map((change) =>
    `<option value="${escapeHtml(change.id)}">${escapeHtml(change.label)}</option>`
  ).join("");

  overlay.hidden = !enabled;
  overlay.innerHTML = changes.length ? `
    <div class="sandbox-overlay-rail">
      ${changes.map((change,index) => `<button type="button" data-overlay-change="${escapeHtml(change.id)}" title="${escapeHtml(change.label)}">${index + 1}</button>`).join("")}
    </div>
    ${changes.filter((change) => change.rect).map((change,index) => {
      const r = change.rect;
      return `<button class="sandbox-overlay-rect" type="button" data-overlay-change="${escapeHtml(change.id)}"
        style="left:${Number(r.x)||0}%;top:${Number(r.y)||0}%;width:${Number(r.w)||10}%;height:${Number(r.h)||10}%"
        aria-label="${escapeHtml(change.label)}"><span>${index+1}</span></button>`;
    }).join("")}
  ` : "";

  host.querySelectorAll("[data-change-id]").forEach((button) => button.addEventListener("click", () => selectChange(button.dataset.changeId)));
  overlay.querySelectorAll("[data-overlay-change]").forEach((button) => button.addEventListener("click", () => selectChange(button.dataset.overlayChange)));
}

function selectChange(id) {
  q("#sandbox-request-change").value = id || "";
  document.querySelectorAll(".sandbox-change-card").forEach((node) => node.classList.toggle("is-selected", node.dataset.changeId === id));
  document.querySelectorAll("[data-overlay-change]").forEach((node) => node.classList.toggle("is-selected", node.dataset.overlayChange === id));
  const target = document.querySelector(`.sandbox-change-card[data-change-id="${CSS.escape(id)}"]`);
  target?.scrollIntoView({behavior:"smooth",block:"nearest"});
}

async function loadReview() {
  if (!product || !version) return;
  const data = await api(`/api/workspace-sandbox-review?product=${encodeURIComponent(product.product_key)}&version=${encodeURIComponent(version.version_id || "")}`);
  review = data.review || {completed_items:[],notes:{}};
  renderReview();
}

function renderReview() {
  const items = Array.isArray(product?.review_items) ? product.review_items : [];
  const done = new Set(review.completed_items || []);
  const notes = review.notes || {};
  q("#sandbox-review-list").innerHTML = items.map((item) => `<article class="sandbox-review-item ${done.has(item.id) ? "is-done" : ""}">
    <label><input type="checkbox" data-review-id="${escapeHtml(item.id)}" ${done.has(item.id) ? "checked" : ""}/><span><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.detail || "")}</small></span></label>
    <textarea rows="2" data-review-note="${escapeHtml(item.id)}" placeholder="Observation…">${escapeHtml(notes[item.id] || "")}</textarea>
  </article>`).join("");
  const count = items.filter((item) => done.has(item.id)).length;
  q("#sandbox-review-save").textContent = `${count}/${items.length} reviewed for this sandbox version`;
}

async function saveReview() {
  if (!product || !version) return;
  q("#sandbox-review-save").textContent = "Saving review…";
  const body = await api("/api/workspace-sandbox-review", {
    method:"PATCH",
    body:JSON.stringify({
      product_key:product.product_key,
      sandbox_url:version.url,
      version_id:version.version_id || null,
      source_ref:version.source_ref || null,
      completed_items:review.completed_items || [],
      notes:review.notes || {},
    }),
  });
  review = body.review || review;
  q("#sandbox-review-save").textContent = `Saved · ${new Date().toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}`;
}

function scheduleReviewSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => void saveReview().catch((error) => {
    q("#sandbox-review-save").textContent = `Not saved · ${error.message}`;
  }), 350);
}

function renderVersion() {
  if (!version) return;
  q("#sandbox-frame").src = version.url;
  q("#sandbox-open-external").href = version.url;
  q("#sandbox-frame-note").textContent = version.note || "The preview is cross-origin; overlays use recorded AgentOS/GitHub metadata rather than DOM inspection.";
  updateMeta();
  renderChanges();
  void loadReview().catch((error) => {
    q("#sandbox-review-save").textContent = `Review state unavailable · ${error.message}`;
  });
}

async function submitChangeRequest(event) {
  event.preventDefault();
  const status = q("#sandbox-request-status");
  const button = event.currentTarget.querySelector("button[type=submit]");
  const requestText = q("#sandbox-request-text").value.trim();
  if (!requestText || !product || !version) return;
  button.disabled = true;
  status.textContent = "Sending to Operator…";
  try {
    const body = await api("/api/workspace-state", {
      method:"POST",
      body:JSON.stringify({
        action:"submit_sandbox_change_request",
        product_key:product.product_key,
        sandbox_url:version.url,
        version_id:version.version_id || null,
        source_ref:version.source_ref || null,
        change_id:q("#sandbox-request-change").value || null,
        request_text:requestText,
      }),
    });
    q("#sandbox-request-text").value = "";
    status.innerHTML = body.existing
      ? 'This exact request is already in the Operator thread. <a href="/workspace/#operator">Open Operator ↗</a>'
      : 'Queued as governed owner intent. <a href="/workspace/#operator">Follow it in Operator ↗</a>';
  } catch (error) {
    status.textContent = `Not sent · ${error.message}`;
  } finally {
    button.disabled = false;
  }
}

function bind() {
  q("#sandbox-product").addEventListener("change", (event) => {
    product = (manifest.products || []).find((item) => item.product_key === event.target.value) || null;
    renderVersionOptions();
    renderVersion();
  });
  q("#sandbox-version").addEventListener("change", (event) => {
    version = versionsFor(product).find((item) => item.key === event.target.value) || null;
    renderVersion();
  });
  q("#sandbox-overlay-toggle").addEventListener("change", renderChanges);
  document.querySelectorAll("[data-viewport]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-viewport]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    q(".sandbox-frame-shell").dataset.viewport = button.dataset.viewport;
  }));
  q("#sandbox-review-list").addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-review-id]");
    if (!checkbox) return;
    const done = new Set(review.completed_items || []);
    if (checkbox.checked) done.add(checkbox.dataset.reviewId); else done.delete(checkbox.dataset.reviewId);
    review.completed_items = [...done];
    renderReview();
    scheduleReviewSave();
  });
  q("#sandbox-review-list").addEventListener("input", (event) => {
    const note = event.target.closest("[data-review-note]");
    if (!note) return;
    review.notes = review.notes || {};
    const value = note.value.trim();
    if (value) review.notes[note.dataset.reviewNote] = value;
    else delete review.notes[note.dataset.reviewNote];
    scheduleReviewSave();
  });
  q("#sandbox-request-form").addEventListener("submit", submitChangeRequest);
}

async function start() {
  await ensureAuth();
  q(".sandbox-studio-shell").inert = false;
  [manifest, environments] = await Promise.all([
    fetch("/data/sandbox-review-manifest.json",{cache:"no-store"}).then((response) => {
      if (!response.ok) throw new Error("Sandbox review manifest unavailable");
      return response.json();
    }),
    fetch("/data/sandbox-environments.json",{cache:"no-store"}).then((response) => response.ok ? response.json() : ({products:[]})),
  ]);
  renderProductOptions();
  renderVersionOptions();
  bind();
  renderVersion();
}

start().catch((error) => {
  document.body.innerHTML = `<main class="sandbox-fatal"><strong>Sandbox Studio could not load.</strong><p>${escapeHtml(error.message)}</p><a href="/workspace/">Back to Workspace</a></main>`;
});
