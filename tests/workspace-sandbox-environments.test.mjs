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

test("unassigned products claim no sandbox, and live products carry a stable identity", () => {
  const others = projection.products.filter((product) => product.product_key !== "ashwood");
  assert.ok(others.length >= 3);
  for (const product of others) {
    const sandbox = product.sandbox;
    if (sandbox.lifecycle === "unassigned") {
      assert.equal(sandbox.url, undefined);
      continue;
    }
    assert.equal(sandbox.lifecycle, "live");
    assert.equal(sandbox.url, `https://${sandbox.slug}.here.now/`);
    assert.ok(sandbox.current_version_id);
    assert.ok(sandbox.source_ref);
    // A live sandbox is not verified until evidence says so, and it is never production.
    if (sandbox.verification.state === "passed") assert.ok(sandbox.verification.evidence_ref);
    assert.notEqual(sandbox.url, product.production.url);
  }
});

test("the three ecosystem sites each have a live sandbox", () => {
  for (const key of ["alvira-meos", "ailhat", "ledgato"]) {
    const product = projection.products.find((entry) => entry.product_key === key);
    assert.ok(product, key);
    assert.equal(product.sandbox.lifecycle, "live", key);
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
