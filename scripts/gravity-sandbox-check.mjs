import { chromium, devices } from "playwright";

const base = process.env.GRAVITY_URL || "http://127.0.0.1:4173/";

async function check(name, options = {}, reducedMotion = "no-preference") {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ...options, reducedMotion });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await page.goto(base, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector("body.ashwood-gravity-ready", { timeout: 15000 });

  const initial = await page.evaluate(() => {
    const canvas = document.querySelector("[data-gravity-canvas]");
    const hero = document.querySelector(".v3-hero");
    const body = document.body;
    const style = canvas ? getComputedStyle(canvas) : null;
    return {
      mode: body.dataset.gravityMode || null,
      canvasWidth: canvas?.width || 0,
      canvasHeight: canvas?.height || 0,
      cssOpacity: style?.opacity || null,
      pointerEvents: style?.pointerEvents || null,
      heroHeight: hero?.getBoundingClientRect().height || 0,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  });

  if (!["webgl", "canvas2d"].includes(initial.mode)) {
    throw new Error(`${name}: renderer mode missing (${initial.mode})`);
  }
  if (initial.canvasWidth < 10 || initial.canvasHeight < 10) {
    throw new Error(`${name}: canvas did not size`);
  }
  if (initial.cssOpacity === "0") throw new Error(`${name}: canvas stayed hidden`);
  if (initial.pointerEvents !== "none") throw new Error(`${name}: canvas intercepted input`);
  if (initial.overflow > 2) throw new Error(`${name}: horizontal overflow ${initial.overflow}px`);

  await page.mouse.move(1100, 360).catch(() => {});
  await page.evaluate(() => scrollTo(0, Math.min(innerHeight * 0.9, document.documentElement.scrollHeight)));
  await page.waitForTimeout(reducedMotion === "reduce" ? 150 : 450);

  const after = await page.evaluate(() => ({
    ready: document.body.classList.contains("ashwood-gravity-ready"),
    canvasWidth: document.querySelector("[data-gravity-canvas]")?.width || 0,
    thinkingExists: Boolean(document.querySelector("#thinking")),
    pageHeight: document.documentElement.scrollHeight,
    viewportHeight: innerHeight
  }));

  if (!after.ready || !after.thinkingExists || after.pageHeight < after.viewportHeight * 2) {
    throw new Error(`${name}: page composition regressed`);
  }
  if (pageErrors.length) throw new Error(`${name}: page errors: ${pageErrors.join(" | ")}`);

  await page.screenshot({ path: `gravity-${name}.png`, fullPage: false });
  console.log(JSON.stringify({ name, reducedMotion, initial, after }, null, 2));
  await browser.close();
}

await check("desktop", devices["Desktop Chrome"]);
await check("mobile", devices["Pixel 7"]);
await check("reduced", devices["Desktop Chrome"], "reduce");
