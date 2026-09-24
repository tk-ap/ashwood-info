import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Owner Constellation is fully retired from Workspace", async () => {
  const [html, hero] = await Promise.all([
    readFile(new URL("../workspace/index.html", import.meta.url), "utf8"),
    readFile(new URL("../workspace/intelligence-hero.js", import.meta.url), "utf8")
  ]);

  assert.match(html, /intelligence-hero\.js\?v=20260924-no-constellation1/);
  assert.doesNotMatch(html, /owner-constellation/);
  assert.doesNotMatch(hero, /appendChild\(script\).*owner-constellation/s);
  assert.match(hero, /Owner Constellation was retired/);
  assert.match(hero, /#owner-constellation/);
});
