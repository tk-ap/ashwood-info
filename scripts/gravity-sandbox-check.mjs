import { chromium, webkit, devices } from "playwright";
import { PNG } from "pngjs";

const base = process.env.GRAVITY_URL || "http://127.0.0.1:4173/";

function ringDifference(a, b, status) {
  const first = PNG.sync.read(a);
  const next = PNG.sync.read(b);
  if (first.width !== next.width || first.height !== next.height)
    throw new Error("frame size changed during sample");
  const w = first.width, h = first.height;
  const cx = status.horizon[0] * w;
  const cy = (1 - status.horizon[1]) * h;
  const radius = status.horizonRadius * Math.min(w, h);
  let count = 0, changed = 0, totalDelta = 0;
  for (let y = Math.max(0, Math.floor(cy - 2.5*radius));
           y < Math.min(h, Math.ceil(cy + 2.5*radius)); y+=2) {
    for (let x = Math.max(0, Math.floor(cx - 2.5*radius));
             x < Math.min(w, Math.ceil(cx + 2.5*radius)); x+=2) {
      const d = Math.hypot(x-cx,y-cy);
      if (d < radius*1.12 || d > radius*2.45) continue;
      const k = (y*w+x)*4;
      const delta = Math.abs(first.data[k]-next.data[k]) +
        Math.abs(first.data[k+1]-next.data[k+1]) +
        Math.abs(first.data[k+2]-next.data[k+2]);
      count++;
      totalDelta += delta;
      if (delta >= 9) changed++;
    }
  }
  return {count,changed,average:count?totalDelta/count:0};
}

async function scenario(name, options, motion, engine=chromium) {
  const browser = await engine.launch({headless:true});
  const context = await browser.newContext({...options,reducedMotion:motion?"no-preference":"reduce"});
  const page = await context.newPage();
  const failures = [];
  page.on("pageerror", e=>failures.push(e.message));
  page.on("console", m=>{if(m.type()==="error") failures.push(m.text());});
  await page.goto(base,{waitUntil:"networkidle",timeout:60000});
  await page.waitForSelector("body.ashwood-gravity-ready",{timeout:15000});

  const initial = await page.evaluate(()=>{
    const canvas = document.querySelector("[data-gravity-canvas]");
    const scene = document.querySelector("[data-site-cosmos]");
    const state = window.__ashwoodGravityRenderer?.status();
    return {
      mounted:canvas?.parentElement===scene,
      canvasRect:canvas?.getBoundingClientRect().toJSON(),
      viewport:[innerWidth,innerHeight],
      mode:document.body.dataset.gravityMode,
      texture:document.body.dataset.gravityTexture,
      zone:document.body.dataset.cosmosZone,
      opacity:Number(getComputedStyle(canvas).opacity),
      plateLoaded:[...scene.querySelectorAll(".ashwood-site-cosmos__plate")]
        .every(img=>img.complete&&img.naturalWidth>1000),
      horizon:state?.horizon,
      radius:state?.horizonRadius,
      overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
    };
  });
  if(!initial.mounted||!initial.plateLoaded||initial.texture!=="ready")
    throw new Error(name+": authored scene failed to mount and load "+JSON.stringify(initial));
  if(initial.mode!=="webgl" && initial.mode!=="canvas2d")
    throw new Error(name+": missing renderer");
  if(initial.zone!=="hero")
    throw new Error(name+": not at hero on initial load");
  if(initial.canvasRect.width<initial.viewport[0]*0.98||
     initial.canvasRect.height<initial.viewport[1]*0.98)
    throw new Error(name+": scene canvas not viewport-fixed");
  if(initial.overflow>2) throw new Error(name+": horizontal overflow "+initial.overflow);

  const sample = async (section)=>{
    await page.waitForTimeout(720);
    const st=await page.evaluate(()=>window.__ashwoodGravityRenderer.status());
    const a=await page.locator("[data-gravity-canvas]").screenshot({scale:"css"});
    await page.waitForTimeout(1500);
    const b=await page.locator("[data-gravity-canvas]").screenshot({scale:"css"});
    const delta=ringDifference(a,b,st);
    console.log(JSON.stringify({name,section,delta,status:st}));
    if(delta.count<100||delta.changed<90||delta.average<0.6)
      throw new Error(name+": "+section+" accretion not visibly changing "+JSON.stringify(delta));
  };
  if(motion) await sample("hero");

  await page.evaluate(()=>{
    const field=document.querySelector(".v3-field");
    const r=field.getBoundingClientRect();
    window.scrollTo({top:scrollY+r.top+(r.height-innerHeight)/2,behavior:"instant"});
    dispatchEvent(new Event("scroll"));
  });
  await page.waitForFunction(()=>{
    const canvas=document.querySelector("[data-gravity-canvas]");
    const r=canvas.getBoundingClientRect();
    return document.body.dataset.cosmosZone==="instinct" &&
      Number(getComputedStyle(canvas).opacity)>0.82 &&
      r.top<innerHeight&&r.bottom>0;
  },null,{timeout:10000});
  const instinct=await page.evaluate(()=>{
    const canvas=document.querySelector("[data-gravity-canvas]");
    const plate=document.querySelector(".ashwood-site-cosmos__plate--base");
    const status=window.__ashwoodGravityRenderer.status();
    return {opacity:+getComputedStyle(canvas).opacity,horizon:status.horizon,
      radius:status.horizonRadius,
      plateRect:plate.getBoundingClientRect().toJSON()};
  });
  if(instinct.radius<0.07||instinct.radius>0.48||
     instinct.horizon.some(v=>v<0.25||v>0.75))
    throw new Error(name+": cover/crop horizon misaligned "+JSON.stringify(instinct));
  if(motion) await sample("instinct");
  else {
    const st=await page.evaluate(()=>window.__ashwoodGravityRenderer.status());
    if(st.motionStrength!==0) throw new Error(name+": reduced motion is not frozen");
  }

  await page.evaluate(()=>document.querySelector("#evidence")?.scrollIntoView({block:"center",behavior:"instant"}));
  await page.waitForFunction(()=>document.body.dataset.cosmosZone==="evidence",{timeout:8000});
  await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector("[data-gravity-canvas]")).opacity)<0.08,null,{timeout:5000});

  if(options.isMobile&&motion){
    await page.setViewportSize({width:844,height:390});
    await page.waitForTimeout(700);
    const resized=await page.evaluate(()=>{
      const r=document.querySelector("[data-gravity-canvas]").getBoundingClientRect();
      return {width:r.width,height:r.height,horizon:window.__ashwoodGravityRenderer.status().horizon};
    });
    if(resized.width<830||resized.height<380)
      throw new Error(name+": orientation resize failed "+JSON.stringify(resized));
  }
  if(failures.length) throw new Error(name+": runtime errors "+failures.join(" | "));
  await page.screenshot({path:"gravity-"+name+".png",fullPage:false});
  console.log(JSON.stringify({name,result:"PASS",initial,instinct}));
  await browser.close();
}

await scenario("desktop",devices["Desktop Chrome"],true);
await scenario("mobile",devices["Pixel 7"],true);
await scenario("mobile-webkit",devices["iPhone 15"],true,webkit);
await scenario("reduced",devices["Desktop Chrome"],false);
