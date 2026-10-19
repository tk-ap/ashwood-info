const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
}[character]));

const STATES = new Set(["KNOWN", "INFERRED", "AWAITING VERIFICATION"]);

/** A compact source-first label for Workspace projections. */
export function provenanceChip({ source = "SOURCE", state = "AWAITING VERIFICATION", age = "age unavailable" } = {}) {
  const safeState = STATES.has(String(state).toUpperCase())
    ? String(state).toUpperCase()
    : "AWAITING VERIFICATION";
  return `<span class="provenance-chip" data-provenance-state="${escapeHtml(safeState)}"><span>${escapeHtml(source)}</span><span>${escapeHtml(safeState)}</span><span>${escapeHtml(age)}</span></span>`;
}
