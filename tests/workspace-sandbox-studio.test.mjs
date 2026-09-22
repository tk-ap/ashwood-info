import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const html = await readFile(new URL("../workspace/sandbox/index.html", import.meta.url), "utf8");
const studio = await readFile(new URL("../workspace/sandbox-studio.mjs", import.meta.url), "utf8");
const studioCss = await readFile(new URL("../workspace/sandbox-studio.css", import.meta.url), "utf8");
const manifest = JSON.parse(await readFile(new URL("../data/sandbox-review-manifest.json", import.meta.url), "utf8"));

test("Sandbox Studio is static-first and keeps visual review separate from production", () => {
  assert.match(html, /id="sandbox-frame"/);
  assert.match(html, /data-viewport="desktop"/);
  assert.match(html, /data-viewport="mobile"/);
  assert.match(html, /id="sandbox-change-overlay"/);
  assert.match(html, /id="sandbox-review-list"/);
  assert.match(html, /id="sandbox-request-form"/);
  assert.match(studio, /cross-origin/i);
  assert.match(studio, /submit_sandbox_change_request/);
  assert.match(studio, /workspace-sandbox-review/);
});

test("ASHWOOD manifest promotes the reviewed visual candidate into the owned stable sandbox", () => {
  const ashwood = manifest.products.find((item) => item.product_key === "ashwood");
  assert.ok(ashwood);
  assert.equal(ashwood.stable.slug, "mighty-yoga-pgph");
  assert.equal(ashwood.stable.state, "stable");
  assert.equal(ashwood.latest_candidate, undefined);
  assert.ok(ashwood.stable.changes.length >= 3);
  assert.equal(ashwood.stable.version_id, "01M359HV4JJ4JKVWBRM2EXBAKM");
  assert.ok(ashwood.review_items.some((item) => item.id === "mobile"));
  assert.ok(ashwood.review_items.some((item) => item.id === "production-boundary"));
});

async function fixture() {
  const db = new PGlite();
  const sql = async (strings, ...values) => (await db.query(
    strings.reduce((query, part, index) => query + (index ? `$${index}` : "") + part, ""), values,
  )).rows;
  const source = (await readFile(new URL("../api/workspace-sandbox-review.mjs", import.meta.url), "utf8"))
    .replace(/^import .*;\n/gm, "")
    .replace("export default async function handler", "async function handler");
  const deps = {
    getSql: () => sql,
    json: (res, status, body) => { res.statusCode = status; res.body = body; },
    parseBody: (req) => req.body || {},
    requireSession: async (req) => req.owner ? { token:"owner" } : null,
    sameOrigin: (req) => req.origin !== "foreign",
  };
  const handler = Function(...Object.keys(deps), `${source}\nreturn handler;`)(...Object.values(deps));
  async function call(req = {}) {
    const res = { headers:{}, setHeader(key,value){ this.headers[key]=value; }, end(){} };
    await handler({method:"GET",headers:{},query:{},...req}, res);
    return res;
  }
  return {db,call};
}

test("sandbox checklist state is version-scoped and rejects non-here.now targets", async (t) => {
  const f = await fixture(); t.after(() => f.db.close());

  const saved = await f.call({
    method:"PATCH", owner:true,
    body:{
      product_key:"ashwood",
      sandbox_url:"https://mighty-yoga-pgph.here.now/",
      version_id:"v1",
      source_ref:"abc",
      completed_items:["mobile"],
      notes:{mobile:"Checked on narrow viewport"},
    },
  });
  assert.equal(saved.statusCode, 200);
  assert.deepEqual(saved.body.review.completed_items, ["mobile"]);

  const read = await f.call({owner:true,query:{product:"ashwood",version:"v1"}});
  assert.equal(read.statusCode, 200);
  assert.equal(read.body.review.notes.mobile, "Checked on narrow viewport");

  const rejected = await f.call({
    method:"PATCH", owner:true,
    body:{product_key:"ashwood",sandbox_url:"https://example.com/",version_id:"v2"},
  });
  assert.equal(rejected.statusCode, 400);

  const foreign = await f.call({
    method:"PATCH", owner:true, origin:"foreign",
    body:{product_key:"ashwood",sandbox_url:"https://mighty-yoga-pgph.here.now/",version_id:"v2"},
  });
  assert.equal(foreign.statusCode, 403);
});


test("Sandbox Studio keeps primary phone controls at least 44px tall", () => {
  assert.match(studioCss, /\.sandbox-studio-toolbar>a\{[^}]*min-height:44px;/);
  assert.match(studioCss, /\.sandbox-studio-viewports button,\.sandbox-studio-toggle\{[^}]*min-width:44px;[^}]*min-height:44px;/);
  assert.match(studioCss, /\.sandbox-overlay-rail button\{width:44px;height:44px;/);
  assert.match(studioCss, /\.sandbox-request button\{[^}]*min-width:44px;[^}]*min-height:44px;/);
});
