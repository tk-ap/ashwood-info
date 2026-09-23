import { chromium, webkit, devices } from "playwright";

const base = process.env.GRAVITY_URL || "http://127.0.0.1:4173/";

async function check(name, options = {}, reducedMotion = "no-preference", browserType = chromium) {
  const browser = await browserType.launch({ headless: true });
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
      motionActive: text.includes("u_zone_active*u_motion_strength"),
      motionStrengthUniform: text.includes("u_motion_strength"),
      zoneUniform: text.includes("u_zone_active"),
      photonRing: text.includes("photonRing"),
      beaming: text.includes("beaming"),
      diskBand: text.includes("diskBand"),
      authoredTexture: text.includes("sampler2D u_image"),
      authoredWarp: text.includes("differentialRotation"),
      textureReady: text.includes("u_texture_ready")
    };
  });
  if (!source.sharedFlow || !source.fluxFilament || !source.fluxMatter) {
    throw new Error(`${name}: shared gravitational flux field is missing`);
  }
  if (!source.motionActive || !source.motionStrengthUniform || !source.zoneUniform) {
    throw new Error(`${name}: Instinct-scoped motion controls are missing`);
  }
  if (!source.photonRing || !source.beaming || !source.diskBand) {
    throw new Error(`${name}: NASA-informed accretion structures are missing`);
  }
  if (!source.authoredTexture || !source.authoredWarp || !source.textureReady) {
    throw new Error(`${name}: authored-image motion path is missing`);
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
      authoredLayers: document.querySelectorAll(".ashwood-site-cosmos__plate").length,
      authoredLoaded: Array.from(document.querySelectorAll(".ashwood-site-cosmos__plate")).every(img => img.complete && img.naturalWidth > 1000),
      cosmosInField: Boolean(document.querySelector(".v3-field .ashwood-site-cosmos")),
      cosmosPosition: getComputedStyle(document.querySelector("[data-site-cosmos]")).position,
      cosmosPhase: body.dataset.cosmosPhase || null,
      cosmosZone: body.dataset.cosmosZone || null,
      cameraScale: getComputedStyle(document.documentElement).getPropertyValue("--cosmos-base-scale").trim(),
      hotspotOpacity: Number(getComputedStyle(document.querySelector(".v3-hotspot")).opacity),
      hotspotLabelOpacity: Number(getComputedStyle(document.querySelector(".v3-hotspot span")).opacity),
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
  if (Number(initial.cssOpacity) > 0.01) throw new Error(`${name}: motion leaked outside Instinct (${initial.cssOpacity})`);
  if (initial.authoredLayers !== 3 || !initial.authoredLoaded) throw new Error(`${name}: global authored HiFi environment did not load as three depth plates`);
  if (initial.cosmosInField) throw new Error(`${name}: authored universe is still owned by the Instinct field`);
  if (initial.cosmosPosition !== "fixed") throw new Error(`${name}: site cosmos is not persistent/fixed`);
  if (!["ambient","instinct","afterglow"].includes(initial.cosmosPhase)) throw new Error(`${name}: site cosmos phase is missing`);
  if (!["hero","instinct","evidence","depth"].includes(initial.cosmosZone)) throw new Error(`${name}: dimensional zone is missing`);
  if (!initial.cameraScale) throw new Error(`${name}: restrained camera variables were not initialized`);
  if (initial.hotspotOpacity > 0.2 || initial.hotspotLabelOpacity > 0.01) throw new Error(`${name}: discovery markers are too visually assertive by default`);
  if (initial.fieldWidth < initial.viewportWidth * 0.98) throw new Error(`${name}: Instinct activation layer is not full bleed`);
  if (initial.hintDisplay !== "none" || initial.resetDisplay !== "none") throw new Error(`${name}: legacy discovery chrome is still visible`);
  if (initial.docLauncherDisplay !== "none" && initial.docLauncherDisplay !== "missing") throw new Error(`${name}: persistent Doc launcher leaked into V4`);
  if (initial.pointerEvents !== "none") throw new Error(`${name}: canvas intercepted input`);
  if (!initial.canvasInField || initial.heroContainsCanvas) throw new Error(`${name}: Gravity is not isolated to Instinct field`);
  if (initial.overflow > 2) throw new Error(`${name}: horizontal overflow ${initial.overflow}px`);

  await page.evaluate(() => document.querySelector("#thinking")?.scrollIntoView({ block: "center" }));
  await page.waitForFunction(({ reduced }) => {
    const body = document.body;
    const canvas = document.querySelector("[data-gravity-canvas]");
    if (!canvas) return false;
    const opacity = Number(getComputedStyle(canvas).opacity);
    const target = reduced ? 0.65 : 0.90;
    return body.dataset.cosmosZone === "instinct" && opacity >= target;
  }, { reduced: reducedMotion === "reduce" }, { timeout: 4000 });

  const after = await page.evaluate(() => ({
    ready: document.body.classList.contains("ashwood-gravity-ready"),
    canvasWidth: document.querySelector("[data-gravity-canvas]")?.width || 0,
    thinkingExists: Boolean(document.querySelector("#thinking")),
    cosmosPhase: document.body.dataset.cosmosPhase || null,
    cosmosZone: document.body.dataset.cosmosZone || null,
    canvasOpacity: Number(getComputedStyle(document.querySelector("[data-gravity-canvas]")).opacity),
    pageHeight: document.documentElement.scrollHeight,
    viewportHeight: innerHeight
  }));

  if (!after.ready || !after.thinkingExists || after.pageHeight < after.viewportHeight * 2) {
    throw new Error(`${name}: page composition regressed`);
  }
  if (after.cosmosPhase !== "instinct" || after.cosmosZone !== "instinct") {
    throw new Error(`${name}: Instinct did not become the closest-encounter zone (${after.cosmosPhase}/${after.cosmosZone})`);
  }
  if (after.canvasOpacity < (reducedMotion === "reduce" ? 0.65 : 0.90) || after.canvasOpacity > 1.0) {
    throw new Error(`${name}: authored motion layer is not visibly active (${after.canvasOpacity})`);
  }

  // Non-reduced desktop and mobile must prove real temporal change, not just visible canvas opacity.
  if (reducedMotion !== "reduce") {
    const motionCanvas = page.locator("[data-gravity-canvas]");
    const frameA = await motionCanvas.screenshot();
    await page.waitForTimeout(900);
    const frameB = await motionCanvas.screenshot();
    if (Buffer.compare(frameA, frameB) === 0) {
      throw new Error(`${name}: motion canvas did not change between frames`);
    }
  }

  if (pageErrors.length) throw new Error(`${name}: page errors: ${pageErrors.join(" | ")}`);

  await page.screenshot({ path: `gravity-${name}.png`, fullPage: false });
  console.log(JSON.stringify({ name, reducedMotion, initial, after }, null, 2));
  await browser.close();
}

await check("desktop", devices["Desktop Chrome"]);
await check("mobile", devices["Pixel 7"]);
await check("mobile-webkit", devices["iPhone 15"], "no-preference", webkit);
await check("reduced", devices["Desktop Chrome"], "reduce");
