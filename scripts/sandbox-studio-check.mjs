import { chromium } from "playwright";
import fs from "node:fs/promises";

const BASE = "http://127.0.0.1:4173";
const OUT = ".sandbox/studio-proof";
await fs.mkdir(OUT, { recursive:true });

async function run(name, viewport) {
  const browser = await chromium.launch({ headless:true });
  const page = await browser.newPage({ viewport });
  const submitted = [];

  await page.route("**/api/workspace-auth", async route => {
    await route.fulfill({ status:200, contentType:"application/json", body:JSON.stringify({authenticated:true,configured:true}) });
  });
  await page.route("**/api/workspace-sandbox-review?*", async route => {
    await route.fulfill({ status:200, contentType:"application/json", body:JSON.stringify({
      ok:true, review:{completed_items:[],notes:{},updated_at:null}
    }) });
  });
  await page.route("**/api/workspace-sandbox-review", async route => {
    if (route.request().method() === "PATCH") {
      await route.fulfill({ status:200, contentType:"application/json", body:JSON.stringify({
        ok:true, review:{completed_items:["mobile"],notes:{},updated_at:new Date().toISOString()}
      }) });
    } else await route.continue();
  });
  await page.route("**/api/workspace-state", async route => {
    if (route.request().method() === "POST") {
      submitted.push(JSON.parse(route.request().postData() || "{}"));
      await route.fulfill({ status:202, contentType:"application/json", body:JSON.stringify({ok:true,id:"sandbox-change:test",status:"queued",thread_id:"operator:primary"}) });
    } else await route.continue();
  });
  await page.route("https://*.here.now/**", async route => {
    await route.fulfill({ status:200, contentType:"text/html", body:"<!doctype html><html><body style='background:#111;color:#ddd;font:16px sans-serif;padding:40px'><h1>Sandbox preview fixture</h1><p>Cross-origin preview placeholder for CI.</p></body></html>" });
  });

  const errors = [];
  page.on("pageerror", error => errors.push(String(error)));
  await page.goto(BASE + "/workspace/sandbox/", { waitUntil:"networkidle" });

  const state = await page.evaluate(() => ({
    shellInert: document.querySelector(".sandbox-studio-shell")?.inert,
    productOptions: document.querySelectorAll("#sandbox-product option").length,
    versionOptions: document.querySelectorAll("#sandbox-version option").length,
    changes: document.querySelectorAll(".sandbox-change-card").length,
    reviewItems: document.querySelectorAll(".sandbox-review-item").length,
    overlayPins: document.querySelectorAll("[data-overlay-change]").length,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    frameWidth: document.querySelector(".sandbox-frame-shell")?.getBoundingClientRect().width || 0,
  }));

  if (state.shellInert) throw new Error(`${name}: shell remained locked`);
  if (state.productOptions < 1 || state.versionOptions < 2) throw new Error(`${name}: product/version selectors incomplete`);
  if (state.changes < 3 || state.overlayPins < 3) throw new Error(`${name}: change annotations missing`);
  if (state.reviewItems < 6) throw new Error(`${name}: review checklist incomplete`);
  if (state.overflow > 2) throw new Error(`${name}: horizontal overflow ${state.overflow}px`);
  if (errors.length) throw new Error(`${name}: page error ${errors[0]}`);

  await page.locator('[data-viewport="mobile"]').click();
  await page.waitForTimeout(350);
  const mobileFrameWidth = await page.locator(".sandbox-frame-shell").evaluate(node => node.getBoundingClientRect().width);
  if (mobileFrameWidth > 400.5) throw new Error(`${name}: mobile preview width ${mobileFrameWidth}`);

  await page.locator(".sandbox-change-card").nth(1).click();
  const selectedChange = await page.locator("#sandbox-request-change").inputValue();
  if (!selectedChange) throw new Error(`${name}: change selection did not anchor request`);

  await page.locator("#sandbox-request-text").fill("Clarify this change on mobile without changing production.");
  await page.locator("#sandbox-request-form button[type=submit]").click();
  await page.waitForFunction(() => document.querySelector("#sandbox-request-status")?.textContent?.includes("Queued"));
  if (submitted.length !== 1 || submitted[0].action !== "submit_sandbox_change_request") {
    throw new Error(`${name}: change request did not use governed Operator ingress`);
  }

  await page.locator('[data-review-id="mobile"]').check();
  await page.waitForTimeout(500);

  await page.screenshot({ path:`${OUT}/${name}.png`, fullPage:true });
  console.log(JSON.stringify({name,...state,mobileFrameWidth,submitted:submitted[0]},null,2));
  await browser.close();
}

await run("desktop", {width:1440,height:1000});
await run("mobile", {width:390,height:844});
