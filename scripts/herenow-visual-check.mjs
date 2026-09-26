import { chromium, devices } from "playwright";

const publicUrl = "https://mighty-yoga-pgph.here.now/";
const deploymentsUrl = "https://mighty-yoga-pgph.here.now/workspace-preview/#deployments";

async function exercisePublic(name, contextOptions, out) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const consoleErrors = [];
  const failed = [];
  page.on("console", msg => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
  page.on("requestfailed", req => failed.push({ url:req.url(), error:req.failure()?.errorText || "failed" }));

  await page.goto(publicUrl, { waitUntil: "networkidle", timeout: 60000 });

  const revealCount = await page.locator(".v3-reveal").count();
  for (let i = 0; i < revealCount; i++) {
    await page.locator(".v3-reveal").nth(i).scrollIntoViewIfNeeded();
    await page.waitForTimeout(160);
  }
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(250);

  const state = await page.evaluate(() => ({
    title: document.title,
    hero: document.querySelector(".v3-hero")?.getBoundingClientRect().height || 0,
    reveals: [...document.querySelectorAll(".v3-reveal")].map(el => ({
      classes: el.className,
      visible: el.classList.contains("is-visible"),
      opacity: getComputedStyle(el).opacity
    })),
    sections: ["thinking","evidence","depth","continue"].map(id => ({
      id,
      exists: !!document.getElementById(id),
      text: (document.getElementById(id)?.innerText || "").trim().slice(0,120)
    }))
  }));

  await page.screenshot({ path: out, fullPage: true });
  await browser.close();

  const unrevealed = state.reveals.filter(x => !x.visible);
  const missingSections = state.sections.filter(x => !x.exists || !x.text);
  console.log(JSON.stringify({name:"public-"+name,state:{title:state.title,hero:state.hero,revealCount:state.reveals.length,unrevealed:unrevealed.length,sections:state.sections},consoleErrors,failed}, null, 2));

  if (state.title !== "ASHWOOD") throw new Error(name + ": wrong public title");
  if (unrevealed.length) throw new Error(name + ": unrevealed public sections remain: " + unrevealed.length);
  if (missingSections.length) throw new Error(name + ": missing/empty public sections: " + missingSections.map(x=>x.id).join(","));
  if (consoleErrors.length) throw new Error(name + ": public console errors: " + consoleErrors.join(" | "));
}

async function exerciseDeployments(name, contextOptions, out) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const consoleErrors = [];
  const failed = [];
  page.on("console", msg => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
  page.on("requestfailed", req => failed.push({ url:req.url(), error:req.failure()?.errorText || "failed" }));

  await page.goto(deploymentsUrl, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector('.preview-view[data-view="deployments"].active');
  await page.waitForTimeout(250);

  const initial = await page.evaluate(() => ({
    title: document.title,
    activeTab: document.querySelector('[data-tab="deployments"]')?.classList.contains("active") || false,
    metricCount: document.querySelectorAll(".deploy-metric").length,
    rowCount: document.querySelectorAll(".deploy-row").length,
    visibleRowCount: [...document.querySelectorAll(".deploy-row")].filter(el => !el.hidden).length,
    attemptCount: document.querySelectorAll(".deploy-attempt").length,
    bodyText: document.querySelector('.preview-view[data-view="deployments"]')?.innerText || "",
    viewportWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    overflowX: document.documentElement.scrollWidth > window.innerWidth + 2
  }));

  await page.getByRole("button", { name: "Preview", exact: true }).click();
  const previewVisible = await page.locator(".deploy-row:not([hidden])").count();
  await page.getByRole("button", { name: "Error / canceled", exact: true }).click();
  const failedVisible = await page.locator(".deploy-row:not([hidden])").count();
  await page.getByRole("button", { name: "All", exact: true }).click();

  await page.screenshot({ path: out, fullPage: true });
  await browser.close();

  console.log(JSON.stringify({
    name:"deployments-"+name,
    state:initial,
    filters:{previewVisible,failedVisible},
    consoleErrors,
    failed
  }, null, 2));

  if (initial.title !== "Deployments — ASHWOOD Workspace Preview") throw new Error(name + ": wrong deployment preview title");
  if (!initial.activeTab) throw new Error(name + ": deployments tab is not active");
  if (initial.metricCount !== 6) throw new Error(name + ": expected 6 deployment metrics");
  if (initial.rowCount !== 5 || initial.visibleRowCount !== 5) throw new Error(name + ": deployment rows did not render");
  if (initial.attemptCount !== 2) throw new Error(name + ": release-attempt fixtures did not render");
  if (!initial.bodyText.includes("One change. How many builds?")) throw new Error(name + ": batching diagnostic missing");
  if (initial.overflowX) throw new Error(name + ": horizontal overflow " + initial.scrollWidth + " > " + initial.viewportWidth);
  if (previewVisible !== 3) throw new Error(name + ": preview filter expected 3 rows, got " + previewVisible);
  if (failedVisible !== 2) throw new Error(name + ": failed filter expected 2 rows, got " + failedVisible);
  if (consoleErrors.length) throw new Error(name + ": deployment console errors: " + consoleErrors.join(" | "));
}

await exercisePublic("desktop", devices["Desktop Chrome"], "herenow-desktop.png");
await exercisePublic("mobile", devices["Pixel 7"], "herenow-mobile.png");
await exerciseDeployments("desktop", devices["Desktop Chrome"], "herenow-deployments-desktop.png");
await exerciseDeployments("mobile", devices["Pixel 7"], "herenow-deployments-mobile.png");
