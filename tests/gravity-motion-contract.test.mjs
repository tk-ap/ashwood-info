import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const renderer = readFileSync(new URL("../gravity-renderer.js", import.meta.url), "utf8");
const runtime = readFileSync(new URL("../gravity-sandbox.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../gravity-sandbox.css", import.meta.url), "utf8");

test("gravity shader has no undefined Doppler reference", () => {
  assert.doesNotMatch(renderer, /\bdoppler\b/);
  assert.match(renderer, /float beaming=/);
  assert.match(renderer, /mix\(green\*\.62,hot,\.38\+beaming\*\.25\)/);
});

test("mobile hero animates before Instinct scroll, respecting reduced motion", () => {
  assert.match(runtime, /const reduced = matchMedia/);
  assert.match(runtime, /const motionStrength = reduced \? 0/);
  assert.match(runtime, /heroStrength/);
  assert.match(runtime, /instinctStrength/);
  assert.match(runtime, /--gravity-scene-opacity/);
});

test("WebGL and lifecycle fallbacks remain in place", () => {
  for (const marker of ["webglcontextlost", "webglcontextrestored", "visibilitychange", "create2DFallback", "prefers-reduced-motion"]) {
    assert.ok((renderer + runtime).includes(marker), marker);
  }
});


test("persistent canvas is mounted exactly once inside the authored scene", () => {
  assert.equal((html.match(/data-gravity-canvas/g)||[]).length,1);
  assert.match(html, /data-site-cosmos[\s\S]*data-gravity-canvas[\s\S]*<\/div>/);
  assert.match(runtime, /siteCosmos\?\.querySelector\("\[data-gravity-canvas\]"\)/);
  assert.match(css, /--gravity-scene-opacity/);
});
test("shader and authored plate share exact object-fit cover crop",()=>{
  for(const marker of ["u_cover_scale","u_cover_offset","u_horizon_radius","updateImageMapping","imageElement?.getBoundingClientRect()"]){
    assert.ok(renderer.includes(marker), marker);
  }
  assert.doesNotMatch(css,/V4\.15[\s\S]*rotate\(360deg\)/);
});
