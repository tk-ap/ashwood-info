// Background refreshes wake ASHWOOD's metered Neon database (free plan: 100
// compute-hours a month, suspends after 5 idle minutes). One forgotten tab
// polling every few seconds kept it awake around the clock and exhausted the
// quota in October 2026. Pages refresh in the background only while the tab is
// visible and someone has touched it recently; returning to the tab refreshes.
const IDLE_MS = 15 * 60 * 1000;
let lastActivity = Date.now();
const touch = () => { lastActivity = Date.now(); };

for (const type of ["pointerdown", "keydown", "wheel", "touchstart"]) {
  addEventListener(type, touch, { passive: true, capture: true });
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") touch();
});

export function shouldPoll() {
  return document.visibilityState === "visible" && Date.now() - lastActivity < IDLE_MS;
}
