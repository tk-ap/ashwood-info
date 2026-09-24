import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const physical = readFileSync(new URL("../gravity-physical.js", import.meta.url), "utf8");
const runtime = readFileSync(new URL("../gravity-sandbox.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../gravity-physical.css", import.meta.url), "utf8");

test("physical hole script parses and registers its factory", () => {
  const window = {};
  new vm.Script(physical); // throws on a syntax error
  vm.runInNewContext(physical, { window, Math });
  assert.equal(typeof window.createAshwoodPhysicalHole, "function");
});

test("without a canvas or WebGL the factory reports unsupported instead of throwing", () => {
  const window = {};
  vm.runInNewContext(physical, { window, Math });
  const none = window.createAshwoodPhysicalHole({});
  assert.equal(none.supported, false);
  const noGl = window.createAshwoodPhysicalHole({ canvas: { getContext: () => null } });
  assert.equal(noGl.supported, false);
  assert.equal(noGl.reason, "webgl-unavailable");
});

test("physical hole exposes the full control surface the page drives", () => {
  for (const method of ["setPointer", "setScroll", "setChapter", "setDiscovery", "setAudioEnergy",
    "setMotionStrength", "setZoneActive", "resize", "pause", "resume", "dispose", "status"]) {
    assert.match(physical, new RegExp(`\\b${method}\\b`), method);
  }
});

test("shader keeps the physics the component is built on", () => {
  for (const marker of ["a = -3/2", "vec3 acc = -1.5 * h2", "float deep = exp(-1.3", "WIND_CYCLE"]) {
    assert.ok(physical.includes(marker) || physical.includes(marker.replace("a = -3/2", "-3/2")), marker);
  }
});

test("lifecycle and fallback safeguards remain in place", () => {
  for (const marker of ["webglcontextlost", "webglcontextrestored", "visibilitychange", "IntersectionObserver",
    "software-renderer", "prefers-reduced-motion", "FRAME_MS"]) {
    assert.ok((physical + runtime).includes(marker), marker);
  }
});

test("page mounts one physical canvas in the cosmos, loaded before the runtime", () => {
  assert.equal((html.match(/data-physical-hole-canvas/g) || []).length, 1);
  assert.match(html, /data-site-cosmos[\s\S]*data-physical-hole-canvas[\s\S]*<\/div>/);
  assert.ok(html.indexOf("/gravity-physical.js") < html.indexOf("/gravity-sandbox.js"));
  assert.equal((html.match(/data-gravity-canvas/g) || []).length, 1, "authored image scene stays mounted as the fallback");
});

test("runtime prefers the physical hole and falls back to the authored image scene", () => {
  assert.match(runtime, /createAshwoodPhysicalHole/);
  assert.match(runtime, /usePhysical \? physical : window\.createAshwoodGravityRenderer/);
  assert.match(runtime, /physicalCanvas\.remove\(\)/);
  assert.match(runtime, /hole=image|holeMode !== "image"/);
});

test("plates are only hidden while the physical hole is running", () => {
  assert.match(css, /body\.ashwood-physical-hole \.ashwood-site-cosmos__plate/);
  assert.doesNotMatch(css.replace(/body\.ashwood-physical-hole[^{]*\{[^}]*\}/g, ""), /ashwood-site-cosmos__plate[^{]*\{[^}]*display:\s*none/);
});
