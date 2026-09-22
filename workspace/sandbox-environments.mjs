const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (c) => ({
  "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
}[c]));

function statusLabel(value = "unknown") {
  return String(value || "unknown").replaceAll("_", " ").toUpperCase();
}

function environmentCard(product) {
  const sandbox = product.sandbox || {};
  const production = product.production || {};
  const hasSandbox = Boolean(sandbox.url);
  const verification = sandbox.verification?.state || "unknown";
  const productionLink = production.url
    ? `<a href="${escapeHtml(production.url)}" target="_blank" rel="noopener">Open production ↗</a>`
    : '<span>Production URL unresolved</span>';
  const sandboxLink = hasSandbox
    ? `<a class="sandbox-primary-link" href="${escapeHtml(sandbox.url)}" target="_blank" rel="noopener">Open Sandbox ↗</a>`
    : '<span class="sandbox-unassigned">Not onboarded</span>';

  return `<article class="sandbox-environment-card" data-product="${escapeHtml(product.product_key)}">
    <div class="sandbox-environment-card__head">
      <div>
        <p class="section-kicker">${escapeHtml(product.label)}</p>
        <h3>${escapeHtml(product.label)}</h3>
      </div>
      <span class="sandbox-state sandbox-state--${escapeHtml(sandbox.lifecycle || "unassigned")}">${escapeHtml(statusLabel(sandbox.lifecycle || "unassigned"))}</span>
    </div>
    <div class="sandbox-environment-grid">
      <div>
        <small>PRODUCTION</small>
        <strong>${escapeHtml(production.provider || "unknown")}</strong>
        <p>${productionLink}</p>
      </div>
      <div>
        <small>SANDBOX</small>
        <strong>${escapeHtml(sandbox.provider || "here-now")}</strong>
        <p>${sandboxLink}</p>
        ${hasSandbox ? `<p><a href="/workspace/sandbox/?product=${encodeURIComponent(product.product_key)}">Review in Studio →</a></p>` : ""}
      </div>
    </div>
    <div class="sandbox-environment-meta">
      <span>verification · ${escapeHtml(statusLabel(verification))}</span>
      <span>version · ${escapeHtml(sandbox.current_version_id || "unassigned")}</span>
      <span>source · ${escapeHtml(sandbox.source_ref || "unassigned")}</span>
    </div>
  </article>`;
}

async function loadSandboxEnvironments() {
  const host = document.querySelector("#sandbox-environment-list");
  const status = document.querySelector("#sandbox-environment-status");
  if (!host) return;
  try {
    const response = await fetch("/data/sandbox-environments.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const products = Array.isArray(data.products) ? data.products : [];
    host.innerHTML = products.length
      ? products.map(environmentCard).join("")
      : '<p class="workstream-empty"><strong>No sandbox mappings published.</strong><span>Products appear here after AgentOS projects their canonical environment topology.</span></p>';
    if (status) {
      const live = products.filter((product) => product?.sandbox?.lifecycle === "live").length;
      status.textContent = `${live} live · ${products.length - live} ready to onboard`;
    }
  } catch (error) {
    host.innerHTML = '<p class="workstream-empty"><strong>Environment projection unavailable.</strong><span>This does not mean production or any sandbox is down.</span></p>';
    if (status) status.textContent = "projection unavailable";
    console.warn("[ASHWOOD] sandbox environment projection unavailable", error);
  }
}

loadSandboxEnvironments();
window.addEventListener("ashwood:refresh-environments", loadSandboxEnvironments);
