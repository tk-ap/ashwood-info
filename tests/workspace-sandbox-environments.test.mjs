import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const projection = JSON.parse(fs.readFileSync(path.join(ROOT, "data/sandbox-environments.json"), "utf8"));
const deployment = fs.readFileSync(path.join(ROOT, ".agent-os/deployment.yaml"), "utf8");
const view = fs.readFileSync(path.join(ROOT, "workspace/sandbox-environments.mjs"), "utf8");
const workspaceViews = fs.readFileSync(path.join(ROOT, "workspace/views.mjs"), "utf8");
const sandboxCss = fs.readFileSync(path.join(ROOT, "workspace/sandbox-environments.css"), "utf8");

test("sandbox environment projection keeps production and sandbox distinct", () => {
  assert.equal(projection.schema, "ashwood.sandbox-environments/v1");
  const ashwood = projection.products.find((product) => product.product_key === "ashwood");
  assert.ok(ashwood);
  assert.equal(ashwood.production.provider, "vercel");
  assert.equal(ashwood.sandbox.provider, "here-now");
  assert.notEqual(ashwood.production.url, ashwood.sandbox.url);
  assert.equal(ashwood.sandbox.connection_ref, "owner:provider:here-now");
});

test("future products are prepared without claiming sandbox deployment", () => {
  const pending = projection.products.filter((product) => product.product_key !== "ashwood");
  assert.ok(pending.length >= 3);
  for (const product of pending) {
    assert.equal(product.sandbox.lifecycle, "unassigned");
    assert.equal(product.sandbox.url, undefined);
  }
});

test("workspace exposes stable sandbox link without converting sandbox to production truth", () => {
  assert.match(view, /Open Sandbox/);
  assert.match(view, /projection unavailable/);
  assert.match(deployment, /sandbox-state-never-implies-production-state/);
  assert.match(deployment, /prefer-one-stable-sandbox-url-per-product/);
});


test("Build view includes the sandbox environment continuity surface", () => {
  assert.match(workspaceViews, /build:\s*\[[\s\S]*"\.sandbox-environments"/);
});


test("Open Sandbox keeps a phone-sized tap target", () => {
  assert.match(sandboxCss, /\.sandbox-primary-link\{[^}]*min-height:44px;/);
});
