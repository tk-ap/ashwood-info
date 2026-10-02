import { chromium } from "playwright";
import fs from "node:fs/promises";

const BASE = "http://127.0.0.1:4174";
const OUT = ".sandbox/content-intelligence-proof";
await fs.mkdir(OUT, { recursive:true });

const evidence = [{
  id:"proof:agentos-e2e-blocked",
  source:"manual",
  source_label:"agent-os",
  title:"E2E proof stops before routing",
  occurred_at:"2026-10-01T23:00:00Z",
  status:"BLOCKED",
  goal_id:"learning",
  secondary_goals:[],
  confidence:.95,
  url:"https://github.com/tk-ap/agent-os",
  notes:"Canonical task → workflow → harness → host → evidence path is not complete."
}];

async function run(name, viewport) {
  const browser = await chromium.launch({ headless:true });
  const page = await browser.newPage({ viewport });
  const feedback = [];
  const errors = [];

  page.on("pageerror", error => errors.push(String(error)));

  await page.route("**/api/workspace-auth", async route => {
    await route.fulfill({ status:200, contentType:"application/json", body:JSON.stringify({authenticated:true,configured:true}) });
  });

  await page.route("**/api/workspace-state", async route => {
    if (route.request().method() === "POST") {
      const body = JSON.parse(route.request().postData() || "{}");
      feedback.push(body);
      await route.fulfill({
        status:200,
        contentType:"application/json",
        body:JSON.stringify({
          ok:true,
          feedback:{
            evidence_id:body.evidence_id,
            decision:body.decision,
            channel:body.channel || null,
            updated_at:new Date().toISOString()
          }
        })
      });
      return;
    }
    await route.fulfill({
      status:200,
      contentType:"application/json",
      body:JSON.stringify({ok:true,evidence,overrides:{},content_feedback:[]})
    });
  });

  await page.route("**/api/workspace-board", async route => {
    await route.fulfill({ status:200, contentType:"application/json", body:JSON.stringify({ok:true,rows:[]}) });
  });

  await page.route("https://api.github.com/**", async route => {
    await route.fulfill({ status:200, contentType:"application/json", body:"[]" });
  });

  await page.route("https://ailhat.vercel.app/api/product-state", async route => {
    await route.fulfill({ status:200, contentType:"application/json", body:JSON.stringify({ok:false}) });
  });

  const allowedModules = new Set([
    "/workspace/overview.mjs",
    "/workspace/frame.mjs",
    "/workspace/content-intelligence.mjs",
    "/workspace/views.mjs",
    "/workspace/content-studio.mjs"
  ]);
  await page.route("**/workspace/**/*.mjs*", async route => {
    const pathname = new URL(route.request().url()).pathname;
    if (allowedModules.has(pathname)) return route.continue();
    await route.fulfill({ status:200, contentType:"text/javascript", body:"export {};" });
  });

  await page.goto(BASE + "/workspace/#content", { waitUntil:"networkidle" });
  const card = page.locator("#from-work-queue .content-opportunity").first();
  await card.waitFor({ state:"visible" });

  const snapshot = await page.evaluate(() => ({
    title:document.querySelector("#workspace-title")?.textContent?.trim(),
    cardCount:document.querySelectorAll("#from-work-queue .content-opportunity").length,
    truth:[...document.querySelectorAll(".content-opportunity__signals span")].map(node=>node.textContent.trim()),
    hook:document.querySelector(".content-opportunity h3")?.textContent?.trim(),
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
  }));

  if (snapshot.title !== "Content.") throw new Error(`${name}: Content view did not activate`);
  if (snapshot.cardCount !== 1) throw new Error(`${name}: expected one grounded recommendation, got ${snapshot.cardCount}`);
  if (!snapshot.truth.includes("truth · observation")) throw new Error(`${name}: unfinished failure was not labeled observation`);
  if (!snapshot.truth.includes("best fit · Gist")) throw new Error(`${name}: Gist was not the recommended developed-thought surface`);
  if (snapshot.overflow > 2) throw new Error(`${name}: horizontal overflow ${snapshot.overflow}px`);
  if (errors.length) throw new Error(`${name}: page error ${errors[0]}`);

  await card.getByRole("button",{name:"Develop thought"}).click();
  await card.locator("textarea").waitFor({ state:"visible" });
  const channel = await card.locator("select").inputValue();
  const draft = await card.locator("textarea").inputValue();

  if (channel !== "Gist") throw new Error(`${name}: Develop did not open the Gist draft`);
  if (!/What happened: E2E proof stops before routing/.test(draft)) throw new Error(`${name}: draft lost source evidence`);
  if (feedback.length !== 1 || feedback[0].action !== "record_content_feedback" || feedback[0].decision !== "DEVELOP") {
    throw new Error(`${name}: Develop did not persist through workspace-state`);
  }

  await page.screenshot({ path:`${OUT}/${name}.png`, fullPage:true });
  console.log(JSON.stringify({name,...snapshot,channel,feedback:feedback[0]},null,2));
  await browser.close();
}

await run("desktop", {width:1440,height:1000});
await run("mobile", {width:390,height:844});
