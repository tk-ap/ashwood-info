import { provenanceChip } from "./provenance-chip.mjs";

document.querySelectorAll("[data-demo-chip]").forEach(node => {
  const [source, state, age] = node.dataset.demoChip.split("|");
  node.innerHTML = provenanceChip({ source, state, age });
});

document.querySelectorAll("[data-demo-handled]").forEach(input => input.addEventListener("change", () => {
  input.closest("article")?.toggleAttribute("data-handled", input.checked);
}));

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const validViews = new Set(["today", "build", "work", "network", "evidence", "self"]);
const selectView = (view, { writeHash = true } = {}) => {
  document.querySelectorAll("[data-demo-view]").forEach(node => node.classList.toggle("is-active", node.dataset.demoView === view));
  document.querySelectorAll("[data-demo-nav]").forEach(link => link.toggleAttribute("aria-current", link.dataset.demoNav === view));
  if (writeHash) history.replaceState(null, "", "#" + view);
  if (!reducedMotion) document.querySelector(".demo-workspace")?.scrollIntoView({ behavior:"smooth", block:"start" });
};

document.querySelectorAll("[data-demo-nav]").forEach(link => link.addEventListener("click", event => {
  event.preventDefault();
  selectView(link.dataset.demoNav);
}));

const selectFromHash = () => {
  const view = location.hash.slice(1);
  if (validViews.has(view)) selectView(view, { writeHash:false });
};
addEventListener("hashchange", selectFromHash);
selectFromHash();
queueMicrotask(selectFromHash);
