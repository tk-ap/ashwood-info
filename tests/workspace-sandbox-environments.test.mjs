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

test("legacy static projection is not the live Workspace source", () => {
  assert.doesNotMatch(view, /data\/sandbox-environments\.json/);
  assert.match(view, /api\/workspace-environments/);
  assert.match(view, /STALE/);
});

test("workspace exposes stable sandbox link without converting sandbox to production truth", () => {
  assert.match(view, /Open Sandbox/);
  assert.match(view, /projection unavailable/);
  assert.match(deployment, /sandbox-state-never-implies-production-state/);
  assert.match(deployment, /prefer-one-stable-sandbox-url-per-product/);
});


test("Build view links to the dedicated environment detail route", () => {
  assert.match(workspaceViews, /workspace\/build\/environments/);
});


test("Open Sandbox keeps a phone-sized tap target", () => {
  assert.match(sandboxCss, /\.sandbox-primary-link\{[^}]*min-height:44px;/);
});
