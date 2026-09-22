import { chromium, devices } from "playwright";

const url = "https://mighty-yoga-pgph.here.now/";

async function exercise(name, contextOptions, out) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const consoleErrors = [];
  const failed = [];
  page.on("console", msg => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
  page.on("requestfailed", req => failed.push({ url:req.url(), error:req.failure()?.errorText || "failed" }));

  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });

  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = Math.max(320, Math.floor((await page.evaluate(() => innerHeight)) * 0.72));
  for (let y = 0; y < height; y += step) {
    await page.evaluate(y => scrollTo(0, y), y);
    await page.waitForTimeout(90);
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
  console.log(JSON.stringify({name,state:{title:state.title,hero:state.hero,revealCount:state.reveals.length,unrevealed:unrevealed.length,sections:state.sections},consoleErrors,failed}, null, 2));

  if (state.title !== "ASHWOOD") throw new Error(name + ": wrong title");
  if (unrevealed.length) throw new Error(name + ": unrevealed sections remain: " + unrevealed.length);
  if (missingSections.length) throw new Error(name + ": missing/empty sections: " + missingSections.map(x=>x.id).join(","));
}

await exercise("desktop", devices["Desktop Chrome"], "herenow-desktop.png");
await exercise("mobile", devices["Pixel 7"], "herenow-mobile.png");
