import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const renderer = readFileSync(new URL("../gravity-renderer.js", import.meta.url), "utf8");
const runtime = readFileSync(new URL("../gravity-sandbox.js", import.meta.url), "utf8");

test("gravity shader has no undefined Doppler reference", () => {
  assert.doesNotMatch(renderer, /\bdoppler\b/);
  assert.match(renderer, /float beaming=/);
  assert.match(renderer, /mix\(green\*\.62,hot,\.38\+beaming\*\.25\)/);
});

test("mobile hero animates before Instinct scroll, respecting reduced motion", () => {
  assert.match(runtime, /if \(reduced\) return 0;/);
  assert.match(runtime, /if \(zone === "hero"\) return 0\.58;/);
  assert.match(runtime, /zone === "instinct" \|\| zone === "hero" \? 1 : 0/);
});

test("WebGL and lifecycle fallbacks remain in place", () => {
  for (const marker of ["webglcontextlost", "webglcontextrestored", "visibilitychange", "create2DFallback", "prefers-reduced-motion"]) {
    assert.ok((renderer + runtime).includes(marker), marker);
  }
});
