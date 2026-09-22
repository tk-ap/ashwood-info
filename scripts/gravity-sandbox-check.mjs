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

  const source = await page.evaluate(async () => {
    const text = await fetch("/gravity-renderer.js", { cache: "no-store" }).then(r => r.text());
    return {
      sharedFlow: text.includes("gravityFlow("),
      fluxFilament: text.includes("fluxFilament("),
      fluxMatter: text.includes("Flux-derived matter"),
      motionGated: text.includes("float motionGate=0.0;")
    };
  });
  if (!source.sharedFlow || !source.fluxFilament || !source.fluxMatter) {
    throw new Error(`${name}: shared gravitational flux field is missing`);
  }
  if (!source.motionGated) {
    throw new Error(`${name}: Flux motion gate reopened before authored still approval`);
  }

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
      canvasInField: Boolean(document.querySelector(".v3-field > [data-gravity-canvas]")),
      heroContainsCanvas: Boolean(document.querySelector(".v3-hero [data-gravity-canvas]")),
      fieldBackground: getComputedStyle(document.querySelector(".v3-field")).backgroundColor,
      authoredLayers: document.querySelectorAll(".ashwood-cosmos__authored").length,
      authoredLoaded: Array.from(document.querySelectorAll(".ashwood-cosmos__authored")).every(img => img.complete && img.naturalWidth > 1000),
      fieldWidth: document.querySelector(".v3-field")?.getBoundingClientRect().width || 0,
      viewportWidth: innerWidth,
      hintDisplay: getComputedStyle(document.querySelector(".v3-field__hint")).display,
      resetDisplay: getComputedStyle(document.querySelector(".v3-field__reset")).display,
      docLauncherDisplay: document.querySelector(".ashwood-doc-editorial-launcher") ? getComputedStyle(document.querySelector(".ashwood-doc-editorial-launcher")).display : "missing",
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  });

  if (!["webgl", "canvas2d"].includes(initial.mode)) {
    throw new Error(`${name}: renderer mode missing (${initial.mode})`);
  }
  if (initial.canvasWidth < 10 || initial.canvasHeight < 10) {
    throw new Error(`${name}: canvas did not size`);
  }
  if (Number(initial.cssOpacity) > 0.05) throw new Error(`${name}: procedural canvas is painting over authored still (${initial.cssOpacity})`);
  if (initial.authoredLayers !== 3 || !initial.authoredLoaded) throw new Error(`${name}: authored HiFi environment did not load as three depth plates`);
  if (initial.fieldWidth < initial.viewportWidth * 0.98) throw new Error(`${name}: authored environment is not full bleed`);
  if (initial.hintDisplay !== "none" || initial.resetDisplay !== "none") throw new Error(`${name}: legacy discovery chrome is still visible`);
  if (initial.docLauncherDisplay !== "none" && initial.docLauncherDisplay !== "missing") throw new Error(`${name}: persistent Doc launcher leaked into V4`);
  if (initial.pointerEvents !== "none") throw new Error(`${name}: canvas intercepted input`);
  if (!initial.canvasInField || initial.heroContainsCanvas) throw new Error(`${name}: Gravity is not isolated to Instinct field`);
  if (initial.overflow > 2) throw new Error(`${name}: horizontal overflow ${initial.overflow}px`);

  await page.evaluate(() => document.querySelector(".v3-field")?.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(reducedMotion === "reduce" ? 180 : 520);

  const after = await page.evaluate(() => ({
    ready: document.body.classList.contains("ashwood-gravity-ready"),
    canvasWidth: document.querySelector("[data-gravity-canvas]")?.width || 0,
    thinkingExists: Boolean(document.querySelector("#thinking")),
    cosmosPhase: document.body.dataset.cosmosPhase || null,
    pageHeight: document.documentElement.scrollHeight,
    viewportHeight: innerHeight
  }));

  if (!after.ready || !after.thinkingExists || after.pageHeight < after.viewportHeight * 2) {
    throw new Error(`${name}: page composition regressed`);
  }
  if (after.cosmosPhase !== "instinct") {
    throw new Error(`${name}: Instinct did not activate the site-level cosmos (${after.cosmosPhase})`);
  }
  if (pageErrors.length) throw new Error(`${name}: page errors: ${pageErrors.join(" | ")}`);

  await page.screenshot({ path: `gravity-${name}.png`, fullPage: false });
  console.log(JSON.stringify({ name, reducedMotion, initial, after }, null, 2));
  await browser.close();
}

await check("desktop", devices["Desktop Chrome"]);
await check("mobile", devices["Pixel 7"]);
await check("reduced", devices["Desktop Chrome"], "reduce");
