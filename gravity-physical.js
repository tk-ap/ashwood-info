/*
 * ASHWOOD physical black hole.
 *
 * A plain-JS port of the BlackHoleHeroSection component TK supplied from 21st.dev.
 * The shaders are unchanged: every pixel fires one ray from the camera and walks it
 * through Schwarzschild space until it falls through the horizon, leaves for the
 * stars, or cuts the gas disc. The halo, the lower halo and the thin ring hugging the
 * shadow are the same disc seen again through bent light, so they line up without
 * anyone lining them up. r = 1 is the event horizon.
 *
 * What changed in the port:
 *  - React and Tailwind removed; the renderer draws into a canvas the page owns.
 *  - Sized to the fixed full-viewport cosmos, not to a hero section.
 *  - Exposes the same control surface as createAshwoodGravityRenderer so
 *    gravity-sandbox.js can drive either.
 *  - Draws only while the page says it is in view, and lowers its own render scale
 *    when frames run slow.
 *  - A machine with no GPU (software renderer) is reported unsupported, so the page
 *    keeps the authored image scene instead of a blurred low-step render. Pass
 *    `force: true` (page URL ?hole=physical) to render anyway.
 */
(() => {
  const RAD = Math.PI / 180;
  const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

  const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

  // For a photon, u'' + u = 3M u^2 with u = 1/r. In Cartesian form that is
  //   a = -3/2 * h^2 * r / |r|^5,  h = |r x v| (constant)
  // with the horizon at |r| = 1. Leapfrog it and every arc in the picture follows.
  const SCENE_FRAG = `
precision highp float;

#define MAX_STEPS 460
#define WIND_CYCLE 46.0

varying vec2 vUv;

uniform vec2  uRes;
uniform float uTime;
uniform vec3  uCamPos;
uniform vec3  uRight;
uniform vec3  uUp;
uniform vec3  uFwd;
uniform float uTanHalf;
uniform vec2  uFocus;
uniform float uSteps;
uniform float uSkyR;
uniform float uDiskIn;
uniform float uDiskOut;
uniform float uThick;
uniform float uDensity;
uniform float uSpin;
uniform float uGrain;
uniform float uBright;
uniform float uDoppler;
uniform vec3  uHot;
uniform vec3  uMid;
uniform vec3  uCool;
uniform float uStars;
uniform float uEncode;
uniform vec2  uJitter;
uniform float uSeed;

float hash13(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float vnoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash13(i + vec3(0.0, 0.0, 0.0));
  float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash13(i + vec3(1.0, 1.0, 1.0));
  return mix(
    mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
    mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
    f.z
  );
}

/* lod fades the finest octave out, for rays whose steps are too long to see it. */
float fbm(vec3 p, float lod) {
  float a = 0.5;
  float s = 0.0;
  for (int i = 0; i < 4; i++) {
    s += (i == 3 ? a * lod : a) * vnoise(p);
    p = p * 2.03 + vec3(11.3, 7.1, 3.7);
    a *= 0.5;
  }
  return s;
}

/* Density and colour of the disc at a point. Kepler shear draws the spirals. */
void gasAt(vec3 p, float rd, float dt, out float dens, out vec3 tint, out float heat) {
  float rn = clamp((rd - uDiskIn) / max(0.001, uDiskOut - uDiskIn), 0.0, 1.0);

  float tk = uThick * (0.35 + 1.25 * rn);
  float v = p.y / tk;
  float sheet = exp(-v * v);

  float lod = clamp(1.0 - dt * uGrain * 14.0, 0.0, 1.0);

  float phi = atan(p.z, p.x);
  float omega = uSpin * pow(uDiskIn / rd, 1.5);
  float lr = log(rd) * 1.1 + uSpin * uTime * 0.05;

  // Two copies of the wound-up gas run half a cycle apart and crossfade, so the
  // spiral never winds tighter than one cycle's worth and tears into moire.
  float u = uTime / WIND_CYCLE;
  float fA = fract(u);
  float fB = fract(u + 0.5);
  float w = abs(2.0 * fA - 1.0);

  float cloudsA = fbm(vec3(vec2(cos(phi + omega * fA * WIND_CYCLE),
                                sin(phi + omega * fA * WIND_CYCLE)) * (rd * uGrain), lr), lod);
  float cloudsB = fbm(vec3(vec2(cos(phi + omega * fB * WIND_CYCLE),
                                sin(phi + omega * fB * WIND_CYCLE)) * (rd * uGrain), lr + 40.0), lod);
  float clouds = mix(cloudsA, cloudsB, w);

  float filaments = clouds * clouds * 1.75;

  float inner = smoothstep(0.0, 0.07, rn);
  float outer = 1.0 - smoothstep(0.45, 1.0, rn);
  float prof = inner * outer * pow(uDiskIn / rd, 2.0);

  dens = max(0.0, filaments * 1.5 - 0.30) * sheet * prof * uDensity * 4.6;

  // Shakura-Sunyaev: T falls as r^-3/4. The colour ramp rides it.
  heat = pow(uDiskIn / rd, 0.8) * (0.72 + 0.55 * clouds);
  tint = mix(uCool, uMid, smoothstep(0.10, 0.52, heat));
  tint = mix(tint, uHot, smoothstep(0.52, 1.05, heat));
}

/* Stars on the six faces of a cube, drawn small so lensing does not smear them. */
vec3 starField(vec3 d) {
  vec3 a = abs(d);
  vec2 uv;
  float face;
  if (a.x >= a.y && a.x >= a.z)      { uv = d.yz / a.x; face = d.x > 0.0 ? 0.0 : 1.0; }
  else if (a.y >= a.z)               { uv = d.xz / a.y; face = d.y > 0.0 ? 2.0 : 3.0; }
  else                               { uv = d.xy / a.z; face = d.z > 0.0 ? 4.0 : 5.0; }

  vec3 col = vec3(0.0);
  for (int k = 0; k < 3; k++) {
    float sc = 90.0 * pow(2.2, float(k));
    vec2 p = uv * sc;
    vec2 id = floor(p);
    vec2 f = fract(p) - 0.5;
    float h = hash13(vec3(id, face * 19.0));
    if (h > 0.965) {
      vec2 off = vec2(hash13(vec3(id, face + 11.0)), hash13(vec3(id, face + 23.0)));
      float dd = length(f - (off - 0.5) * 0.7);
      float s = smoothstep(0.055, 0.0, dd);
      float warm = hash13(vec3(id, face + 51.0));
      col += s * (0.6 + 4.5 * fract(h * 97.0))
           * mix(vec3(0.72, 0.82, 1.0), vec3(1.0, 0.88, 0.72), warm)
           / pow(2.2, float(k));
    }
  }
  col += vec3(0.013, 0.017, 0.030) * fbm(d * 2.6, 1.0);
  return col;
}

void main() {
  // Each frame aims from a different point inside the pixel and the frames are
  // averaged; one ray per pixel cannot resolve the shadow's rim on its own.
  vec2 uv = (gl_FragCoord.xy + uJitter - uFocus * uRes) / uRes.y;
  vec3 dir = normalize(uFwd + (uv.x * uRight + uv.y * uUp) * 2.0 * uTanHalf);

  vec3 pos = uCamPos;
  vec3 vel = dir;

  vec3 hv = cross(pos, vel);
  float h2 = dot(hv, hv);
  float h = sqrt(h2);
  float swept = 0.0;

  vec3 col = vec3(0.0);
  float transmit = 1.0;
  bool captured = false;

  float jitter = fract(sin(dot(gl_FragCoord.xy + uSeed, vec2(12.9898, 78.233))) * 43758.5453);

  for (int i = 0; i < MAX_STEPS; i++) {
    if (float(i) >= uSteps) break;

    float r2 = dot(pos, pos);
    float r = sqrt(r2);

    if (r < 1.0) { captured = true; break; }
    if (r > uSkyR && dot(pos, vel) > 0.0) break;
    if (transmit < 0.004) break;

    float dt = clamp(0.14 * (r - 1.0), 0.025, 1.1);

    if (r < uDiskOut * 1.25) {
      float rn = clamp((r - uDiskIn) / max(0.001, uDiskOut - uDiskIn), 0.0, 1.0);
      float tk = uThick * (0.35 + 1.25 * rn);
      dt = min(dt, max(tk * 0.38, abs(pos.y) * 0.5));
    }

    swept += h * dt / r2;

    // Each extra wrap round the photon sphere costs about e^2pi, so deeper images
    // are charged their proper price: a soft rim, not a dotted circle.
    float deep = exp(-1.3 * max(0.0, swept - 4.6));

    jitter = fract(jitter + 0.6180339887);
    vec3 mid = pos + vel * (dt * jitter);
    float rd = length(mid.xz);

    if (rd > uDiskIn && rd < uDiskOut && abs(mid.y) < uThick * 5.0) {
      float dens;
      float heat;
      vec3 tint;
      gasAt(mid, rd, dt, dens, tint, heat);

      if (dens > 0.001) {
        // Beaming: the rim runs at 0.41c, flux goes as g^3, uDoppler dials the exponent.
        vec3 tang = normalize(cross(vec3(0.0, 1.0, 0.0), vec3(mid.x, 0.0, mid.z)));
        float beta = min(0.85, sqrt(0.5 / max(rd, 1.5)));
        float gam = inversesqrt(max(1e-4, 1.0 - beta * beta));
        vec3 toObs = -normalize(vel);
        float g = 1.0 / (gam * (1.0 - beta * dot(tang, toObs)));
        g *= sqrt(max(0.05, 1.0 - 1.0 / rd));
        float boost = pow(max(g, 0.02), 3.0 * uDoppler);

        vec3 shift = mix(
          vec3(1.0),
          g > 1.0 ? vec3(0.86, 0.94, 1.14) : vec3(1.15, 0.82, 0.62),
          clamp(abs(g - 1.0) * 1.6, 0.0, 1.0) * uDoppler
        );

        float emit = uBright * (0.26 + 2.0 * heat * heat);
        col += tint * shift * (emit * boost * dens * transmit * dt * deep);
        transmit *= exp(-dens * 0.30 * dt);
      }
    }

    vec3 acc = -1.5 * h2 * pos / (r2 * r2 * r);
    vel += acc * dt;
    pos += vel * dt;
  }

  if (!captured && uStars > 0.001) {
    vec3 toHole = normalize(-uCamPos);
    float sI = length(cross(normalize(dir), toHole));
    float sS = length(cross(normalize(vel), toHole));
    float stretch = clamp(sI / max(1e-3, sS), 1.0, 40.0);
    col += starField(normalize(vel)) * uStars * transmit / stretch;
  }

  if (uEncode > 0.5) col = col / (1.0 + col);
  gl_FragColor = vec4(col, 1.0);
}
`;

  // The camera never moves, so each frame lines up with the last and the running
  // average needs no reprojection. uAlpha is the price of the moving gas.
  const BLEND_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uCur;
uniform sampler2D uPrev;
uniform float uAlpha;

void main() {
  vec3 c = texture2D(uCur, vUv).rgb;
  vec3 p = texture2D(uPrev, vUv).rgb;
  gl_FragColor = vec4(mix(p, c, uAlpha), 1.0);
}
`;

  const BRIGHT_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uTexel;
uniform float uDecode;
uniform float uPack;
uniform float uThreshold;

void main() {
  vec3 s = texture2D(uTex, vUv + uTexel * vec2(-1.0, -1.0)).rgb
         + texture2D(uTex, vUv + uTexel * vec2( 1.0, -1.0)).rgb
         + texture2D(uTex, vUv + uTexel * vec2(-1.0,  1.0)).rgb
         + texture2D(uTex, vUv + uTexel * vec2( 1.0,  1.0)).rgb;
  s *= 0.25;
  if (uDecode > 0.5) s = s / max(vec3(0.002), 1.0 - s);
  float l = max(s.r, max(s.g, s.b));
  s *= max(0.0, l - uThreshold) / max(0.0001, l);
  gl_FragColor = vec4(s * uPack, 1.0);
}
`;

  const BLUR_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uStep;

void main() {
  vec3 s = texture2D(uTex, vUv).rgb * 0.2270270;
  s += (texture2D(uTex, vUv + uStep * 1.3846154).rgb
      + texture2D(uTex, vUv - uStep * 1.3846154).rgb) * 0.3162162;
  s += (texture2D(uTex, vUv + uStep * 3.2307692).rgb
      + texture2D(uTex, vUv - uStep * 3.2307692).rgb) * 0.0702702;
  gl_FragColor = vec4(s, 1.0);
}
`;

  const COMPOSITE_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform vec2  uRes;
uniform float uDecode;
uniform float uPack;
uniform float uGlow;
uniform float uExposure;
uniform float uVignette;
uniform float uScrimDir;
uniform float uScrimAmt;
uniform float uSeed;

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

void main() {
  vec3 scene = texture2D(uScene, vUv).rgb;
  if (uDecode > 0.5) scene = scene / max(vec3(0.002), 1.0 - scene);
  vec3 bloom = texture2D(uBloom, vUv).rgb / uPack;

  vec3 c = scene + bloom * uGlow;
  c = aces(c * uExposure);
  c = pow(max(c, 0.0), vec3(0.4545));

  vec2 d = vUv - 0.5;
  c *= 1.0 - uVignette * dot(d, d) * 1.9;

  if (uScrimDir > 0.5) {
    float x = uScrimDir < 1.5 ? vUv.x
            : uScrimDir < 2.5 ? 1.0 - vUv.x
            : uScrimDir < 3.5 ? 1.0 - vUv.y
            : vUv.y;
    c *= 1.0 - uScrimAmt * pow(1.0 - clamp(x, 0.0, 1.0), 2.4);
  }

  // A grain of dither, or these long dark ramps band into rings.
  float n = fract(sin(dot(gl_FragCoord.xy + uSeed, vec2(12.9898, 78.233))) * 43758.5453);
  c += (n - 0.5) / 255.0;

  gl_FragColor = vec4(c, 1.0);
}
`;

  /* Settings ---------------------------------------------------------------- */

  // The component's own defaults, plus the two arrangements from its demo: hole off
  // to one side on a wide screen, hole low and whole on a phone. The disc is drawn
  // once, so these only decide where it sits and how much a phone is asked to pay.
  const BASE = {
    distance: 24, azimuth: 0, orbitSpeed: 0, roll: -20,
    diskInner: 3, diskOuter: 15, diskThickness: 0.26, diskDensity: 1,
    brightness: 1, spinSpeed: 0.06, grain: 0.48, doppler: 0.35,
    hotColor: "#FFF3DE", midColor: "#FF9838", coolColor: "#8E3A0B",
    starBrightness: 0, exposure: 0.9, vignette: 0.28,
    scrim: "none", scrimStrength: 0.9
  };
  const WIDE = {
    ...BASE, elevation: -5.5, fov: 42, glow: 1,
    scrim: "left", scrimStrength: 0.55,
    focus: [0.66, 0.47], steps: 220, resolution: 0.5, maxDpr: 1.25
  };
  const NARROW = {
    ...BASE, elevation: -7, fov: 58, glow: 0.85,
    scrim: "top", scrimStrength: 0.6,
    focus: [0.5, 0.6], steps: 170, resolution: 0.45, maxDpr: 1.25
  };

  const hexToLinear = (hex) => {
    const h = hex.trim().replace("#", "");
    const full = h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h.slice(0, 6);
    const n = parseInt(full, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255].map(
      (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))
    );
  };

  // Eight sub-pixel aim points from the Halton 2,3 sequence.
  const HALTON = [
    [0.5, 0.333], [0.25, 0.667], [0.75, 0.111], [0.125, 0.444],
    [0.625, 0.778], [0.375, 0.222], [0.875, 0.556], [0.0625, 0.889]
  ];

  const unsupported = (why) => ({
    supported: false,
    reason: why,
    ready: Promise.resolve({ mode: "unsupported", textureLoaded: false, reason: why }),
    status: () => ({ mode: "unsupported", reason: why }),
    setPointer() {}, setScroll() {}, setChapter() {}, setDiscovery() {},
    setAudioEnergy() {}, setMotionStrength() {}, setZoneActive() {},
    resize() {}, pause() {}, resume() {}, dispose() {}
  });

  window.createAshwoodPhysicalHole = function createAshwoodPhysicalHole({
    canvas,
    reducedMotion = false,
    force = false,
    narrowQuery = "(max-width: 767px)"
  } = {}) {
    if (!canvas) return unsupported("no-canvas");

    const opts = {
      alpha: false, antialias: false, depth: false, stencil: false,
      powerPreference: "high-performance", preserveDrawingBuffer: false
    };
    const gl = canvas.getContext("webgl2", opts) || canvas.getContext("webgl", opts);
    if (!gl) return unsupported("webgl-unavailable");

    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    const rendererName = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || "") : "";
    const software = /swiftshader|llvmpipe|softpipe|software|microsoft basic/i.test(rendererName);
    if (software && !force) return unsupported("software-renderer");

    const isGL2 = typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext;

    /* Shader plumbing ------------------------------------------------------- */

    const compile = (type, src) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error("physical hole: shader failed —", gl.getShaderInfoLog(sh) || "no log (context lost?)");
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };

    const link = (fragSrc) => {
      const vs = compile(gl.VERTEX_SHADER, VERT);
      const fs = compile(gl.FRAGMENT_SHADER, fragSrc);
      if (!vs || !fs) return null;
      const program = gl.createProgram();
      if (!program) return null;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.bindAttribLocation(program, 0, "aPos");
      gl.linkProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("physical hole: link failed —", gl.getProgramInfoLog(program));
        return null;
      }
      const u = {};
      const n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) {
        const info = gl.getActiveUniform(program, i);
        if (info) u[info.name] = gl.getUniformLocation(program, info.name);
      }
      return { program, u };
    };

    /* Render targets: half floats where the GPU has them, packed 8 bit if not. */
    let hdr = true;
    let texType = gl.UNSIGNED_BYTE;
    let internal = gl.RGBA;
    if (isGL2) {
      const ok = gl.getExtension("EXT_color_buffer_half_float") || gl.getExtension("EXT_color_buffer_float");
      if (ok) { texType = gl.HALF_FLOAT; internal = gl.RGBA16F; } else hdr = false;
    } else {
      const hf = gl.getExtension("OES_texture_half_float");
      const cb = gl.getExtension("EXT_color_buffer_half_float");
      if (hf && cb) texType = hf.HALF_FLOAT_OES; else hdr = false;
    }
    if (!hdr) { texType = gl.UNSIGNED_BYTE; internal = gl.RGBA; }
    const linearOK = isGL2 || !!gl.getExtension("OES_texture_half_float_linear") || !hdr;
    const filter = linearOK ? gl.LINEAR : gl.NEAREST;
    const pack = hdr ? 1 : 0.12;

    const makeTarget = (w, h) => {
      const tex = gl.createTexture();
      const fb = gl.createFramebuffer();
      if (!tex || !fb) return null;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, gl.RGBA, texType, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      if (status !== gl.FRAMEBUFFER_COMPLETE) {
        gl.deleteTexture(tex);
        gl.deleteFramebuffer(fb);
        return null;
      }
      return { fb, tex, w, h };
    };

    /* Resources -------------------------------------------------------------- */

    let sceneProg = null, blendProg = null, brightProg = null, blurProg = null, compProg = null;
    let vbo = null;
    let scene = null, histA = null, histB = null, bloomA = null, bloomB = null;
    let settled = 0; // frames folded into the running average since it was thrown away
    let width = 0, height = 0, sceneW = 0, sceneH = 0;
    let lastCss = [0, 0, 0];
    let quality = 1; // multiplied into render scale; lowered when frames run slow

    const build = () => {
      sceneProg = link(SCENE_FRAG);
      blendProg = link(BLEND_FRAG);
      brightProg = link(BRIGHT_FRAG);
      blurProg = link(BLUR_FRAG);
      compProg = link(COMPOSITE_FRAG);
      if (!sceneProg || !blendProg || !brightProg || !blurProg || !compProg) return false;
      // One triangle, big enough to cover the frame.
      vbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      return true;
    };

    if (!build()) return unsupported("shader-build-failed");

    const dropTargets = () => {
      for (const t of [scene, histA, histB, bloomA, bloomB]) {
        if (!t) continue;
        gl.deleteTexture(t.tex);
        gl.deleteFramebuffer(t.fb);
      }
      scene = histA = histB = bloomA = bloomB = null;
      settled = 0;
    };

    const narrowMql = window.matchMedia ? window.matchMedia(narrowQuery) : null;
    const config = () => (narrowMql && narrowMql.matches ? NARROW : WIDE);

    const resize = (forceRealloc = false) => {
      const host = canvas.parentElement || canvas;
      const rect = host.getBoundingClientRect();
      const C = config();
      const dpr = software ? 1 : Math.min(window.devicePixelRatio || 1, Math.max(1, C.maxDpr));
      const cssW = Math.max(1, Math.round(rect.width));
      const cssH = Math.max(1, Math.round(rect.height));
      const scale = software ? 0.34 : clamp(C.resolution * quality, 0.3, 1);
      const w = Math.max(2, Math.round(cssW * dpr));
      const h = Math.max(2, Math.round(cssH * dpr));
      const sw = Math.max(2, Math.round(w * scale));
      const sh = Math.max(2, Math.round(h * scale));
      const narrow = narrowMql && narrowMql.matches ? 1 : 0;
      if (!forceRealloc && w === width && h === height && sw === sceneW && sh === sceneH &&
          narrow === lastCss[2]) return;
      width = w; height = h; sceneW = sw; sceneH = sh;
      lastCss = [cssW, cssH, narrow];
      canvas.width = w;
      canvas.height = h;
      dropTargets();
      scene = makeTarget(sw, sh);
      histA = makeTarget(sw, sh);
      histB = makeTarget(sw, sh);
      const bw = Math.max(2, sw >> 2);
      const bh = Math.max(2, sh >> 2);
      bloomA = makeTarget(bw, bh);
      bloomB = makeTarget(bw, bh);
      if (!scene || !histA || !histB || !bloomA || !bloomB) failed("target-failed");
    };

    /* Drawing ----------------------------------------------------------------- */

    let clock = reducedMotion ? 6 : 0; // simulation seconds; advances only while drawing
    let lastFrame = 0;
    let running = false;
    let visible = true;
    let raf = 0;
    let disposed = false;
    let dead = false;
    let motion = 0;   // 0..1 from the page: how much the scene is asked to move
    let zone = 0;     // 0/1: the scene is in view
    let readyResolve;
    let readyResolved = false;
    const ready = new Promise((r) => { readyResolve = r; });
    const announceReady = () => {
      if (readyResolved) return;
      readyResolved = true;
      readyResolve({ mode: "physical", textureLoaded: true, software });
    };

    function failed(why) {
      dead = true;
      running = false;
      cancelAnimationFrame(raf);
      canvas.dataset.physicalHole = why;
      canvas.style.display = "none";
      if (!readyResolved) {
        readyResolved = true;
        readyResolve({ mode: "unsupported", textureLoaded: false, reason: why });
      }
    }

    const pass = (prog, target) => {
      gl.useProgram(prog.program);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fb : null);
      gl.viewport(0, 0, target ? target.w : width, target ? target.h : height);
    };
    const draw = () => gl.drawArrays(gl.TRIANGLES, 0, 3);
    const bind = (tex, unit) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
    };

    const geometry = (C) => {
      const dist = Math.max(2.2, C.distance);
      const tanHalf = Math.tan(clamp(C.fov, 8, 110) * 0.5 * RAD);
      // Screen radius of the shadow as a fraction of frame height: 2.6 horizon radii
      // seen from `dist`. Reported to status() for diagnostics only.
      return { dist, tanHalf, shadow: 2.6 / dist / (2 * tanHalf) };
    };

    const render = (t) => {
      if (dead || !scene) return;
      const C = config();
      const az = (C.azimuth + C.orbitSpeed * t) * RAD;
      const el = clamp(C.elevation, -88, 88) * RAD;
      const { dist, tanHalf } = geometry(C);
      const ce = Math.cos(el);
      const camX = dist * ce * Math.cos(az);
      const camY = dist * Math.sin(el);
      const camZ = dist * ce * Math.sin(az);

      // Look at the hole, then roll about the line of sight.
      const fx = -camX / dist, fy = -camY / dist, fz = -camZ / dist;
      let rx = fz, ry = 0, rz = -fx;
      const rl = Math.hypot(rx, ry, rz) || 1;
      rx /= rl; ry /= rl; rz /= rl;
      const ux = ry * fz - rz * fy;
      const uy = rz * fx - rx * fz;
      const uz = rx * fy - ry * fx;
      const cr = Math.cos(C.roll * RAD), sr = Math.sin(C.roll * RAD);
      const RX = rx * cr + ux * sr, RY = ry * cr + uy * sr, RZ = rz * cr + uz * sr;
      const UX = -rx * sr + ux * cr, UY = -ry * sr + uy * cr, UZ = -rz * sr + uz * cr;

      const hot = hexToLinear(C.hotColor);
      const mid = hexToLinear(C.midColor);
      const cool = hexToLinear(C.coolColor);
      const outer = Math.max(C.diskInner + 0.5, C.diskOuter);

      /* scene */
      pass(sceneProg, scene);
      const u = sceneProg.u;
      gl.uniform2f(u.uRes, scene.w, scene.h);
      gl.uniform1f(u.uTime, t);
      gl.uniform3f(u.uCamPos, camX, camY, camZ);
      gl.uniform3f(u.uRight, RX, RY, RZ);
      gl.uniform3f(u.uUp, UX, UY, UZ);
      gl.uniform3f(u.uFwd, fx, fy, fz);
      gl.uniform1f(u.uTanHalf, tanHalf);
      gl.uniform2f(u.uFocus, C.focus[0], 1 - C.focus[1]); // gl_FragCoord counts up from the bottom
      gl.uniform1f(u.uSteps, software ? 130 : clamp(Math.round(C.steps), 60, 460));
      gl.uniform1f(u.uSkyR, Math.max(dist * 1.35, outer * 2.4));
      gl.uniform1f(u.uDiskIn, Math.max(1.05, C.diskInner));
      gl.uniform1f(u.uDiskOut, outer);
      gl.uniform1f(u.uThick, Math.max(0.02, C.diskThickness));
      gl.uniform1f(u.uDensity, Math.max(0, C.diskDensity));
      gl.uniform1f(u.uSpin, C.spinSpeed * 6.2831853);
      gl.uniform1f(u.uGrain, Math.max(0.02, C.grain));
      gl.uniform1f(u.uBright, Math.max(0, C.brightness));
      gl.uniform1f(u.uDoppler, clamp(C.doppler));
      gl.uniform3f(u.uHot, hot[0], hot[1], hot[2]);
      gl.uniform3f(u.uMid, mid[0], mid[1], mid[2]);
      gl.uniform3f(u.uCool, cool[0], cool[1], cool[2]);
      gl.uniform1f(u.uStars, Math.max(0, C.starBrightness));
      gl.uniform1f(u.uEncode, hdr ? 0 : 1);
      const j = HALTON[settled % HALTON.length];
      gl.uniform2f(u.uJitter, j[0] - 0.5, j[1] - 0.5);
      gl.uniform1f(u.uSeed, (settled % 64) * 17.13);
      draw();

      /* fold into the running average */
      const alpha = settled === 0 ? 1 : 0.14;
      pass(blendProg, histB);
      bind(scene.tex, 0);
      bind(histA.tex, 1);
      gl.uniform1i(blendProg.u.uCur, 0);
      gl.uniform1i(blendProg.u.uPrev, 1);
      gl.uniform1f(blendProg.u.uAlpha, alpha);
      draw();
      const shown = histB;
      histB = histA;
      histA = shown;
      settled++;

      /* bright pass */
      pass(brightProg, bloomA);
      bind(shown.tex, 0);
      gl.uniform1i(brightProg.u.uTex, 0);
      gl.uniform2f(brightProg.u.uTexel, 1 / shown.w, 1 / shown.h);
      gl.uniform1f(brightProg.u.uDecode, hdr ? 0 : 1);
      gl.uniform1f(brightProg.u.uPack, pack);
      gl.uniform1f(brightProg.u.uThreshold, 0.85);
      draw();

      /* two rounds of blur, the second wider */
      const blurStep = (src, dst, dx, dy) => {
        pass(blurProg, dst);
        bind(src.tex, 0);
        gl.uniform1i(blurProg.u.uTex, 0);
        gl.uniform2f(blurProg.u.uStep, dx / dst.w, dy / dst.h);
        draw();
      };
      blurStep(bloomA, bloomB, 1, 0);
      blurStep(bloomB, bloomA, 0, 1);
      blurStep(bloomA, bloomB, 2.6, 0);
      blurStep(bloomB, bloomA, 0, 2.6);

      /* composite */
      pass(compProg, null);
      bind(shown.tex, 0);
      bind(bloomA.tex, 1);
      gl.uniform1i(compProg.u.uScene, 0);
      gl.uniform1i(compProg.u.uBloom, 1);
      gl.uniform2f(compProg.u.uRes, width, height);
      gl.uniform1f(compProg.u.uDecode, hdr ? 0 : 1);
      gl.uniform1f(compProg.u.uPack, pack);
      gl.uniform1f(compProg.u.uGlow, Math.max(0, C.glow) * 0.26);
      gl.uniform1f(compProg.u.uExposure, Math.max(0.05, C.exposure));
      gl.uniform1f(compProg.u.uVignette, clamp(C.vignette));
      gl.uniform1f(
        compProg.u.uScrimDir,
        C.scrim === "left" ? 1 : C.scrim === "right" ? 2 : C.scrim === "top" ? 3 : C.scrim === "bottom" ? 4 : 0
      );
      gl.uniform1f(compProg.u.uScrimAmt, clamp(C.scrimStrength));
      gl.uniform1f(compProg.u.uSeed, (t * 60) % 1000);
      draw();
    };

    // A still, drawn properly: the frames the average would normally gather over time
    // are taken at once, each aimed at a different point inside the pixel.
    const settle = (passes) => { for (let i = 0; i < passes; i++) render(clock); };

    /* Loop: draws only while the page says the scene is in view and moving. ---- */

    // Frames slower than about 22 per second lower the render scale rather than
    // dropping the effect. The average is taken over 45 frames, so one hitch (a tab
    // switch, a resize) does not count.
    let slowSum = 0, slowN = 0;
    const watchPace = (dt) => {
      slowSum += dt; slowN++;
      if (slowN < 45) return;
      const avg = slowSum / slowN;
      slowSum = 0; slowN = 0;
      if (avg > 0.046 && quality > 0.45 && !software) {
        quality = Math.max(0.45, quality * 0.85);
        resize(true);
      }
    };

    const wantsFrames = () => !dead && !disposed && !reducedMotion && zone > 0 && motion > 0.001 &&
      visible && !document.hidden;

    // The gas turns slowly, so 30 frames a second reads the same as 60 and costs half
    // the GPU time (and battery). Ticks that arrive early are skipped.
    const FRAME_MS = 32;
    const tick = (now) => {
      raf = 0;
      if (!running) return;
      if (!wantsFrames()) { running = false; lastFrame = 0; return; }
      raf = requestAnimationFrame(tick);
      if (lastFrame && now - lastFrame < FRAME_MS - 4) return;
      const dt = lastFrame ? Math.min(0.1, (now - lastFrame) / 1000) : 0;
      lastFrame = now;
      clock += dt;
      if (dt) watchPace(dt);
      render(clock);
    };

    const kick = () => {
      if (running || !wantsFrames()) return;
      running = true;
      lastFrame = 0;
      raf = requestAnimationFrame(tick);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
      raf = 0;
    };

    /* The world ---------------------------------------------------------------- */

    const onVisibility = () => { lastFrame = 0; kick(); };
    const onLost = (e) => {
      // A dead canvas paints white, so hide it until the context comes back working.
      e.preventDefault();
      stop();
      canvas.style.display = "none";
    };
    const onRestored = () => {
      width = height = sceneW = sceneH = 0;
      if (!build()) { failed("lost"); return; }
      canvas.style.display = "";
      resize(true);
      if (reducedMotion) settle(16); else { settle(1); kick(); }
    };
    document.addEventListener("visibilitychange", onVisibility);
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    let io = null;
    if (typeof IntersectionObserver === "function") {
      io = new IntersectionObserver((entries) => {
        visible = entries[0] ? entries[0].isIntersecting : true;
        kick();
      }, { threshold: 0 });
      io.observe(canvas);
    }

    let resizeTimer = 0;
    const scheduleResize = () => {
      // Phone toolbars resize the viewport all the time while scrolling; wait for it to settle.
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        if (reducedMotion) settle(16);
      }, 180);
    };
    let ro = null;
    if (typeof ResizeObserver === "function") {
      ro = new ResizeObserver(scheduleResize);
      ro.observe(canvas.parentElement || canvas);
    }
    if (narrowMql && narrowMql.addEventListener) narrowMql.addEventListener("change", scheduleResize);

    resize(true);
    settle(reducedMotion ? 16 : 1);
    canvas.dataset.physicalHole = "ready";
    announceReady();

    return {
      supported: true,
      ready,
      status() {
        const C = config();
        return {
          mode: "physical", textureLoaded: true, software,
          // Same shape the image renderer reports: horizon in GL coordinates (origin
          // bottom-left), radius as a fraction of the shorter side. Approximate.
          horizon: [C.focus[0], 1 - C.focus[1]],
          horizonRadius: geometry(C).shadow * (height / Math.max(1, Math.min(width, height))),
          coverScale: [1, 1], coverOffset: [0, 0],
          motionStrength: motion, zoneActive: zone, visible,
          renderScale: quality, drawing: running
        };
      },
      // The interface the page drives. Pointer, scroll, chapter, discovery and audio
      // are accepted and ignored: this renderer's motion is the gas, not the camera.
      setPointer() {},
      setScroll() {},
      setChapter() {},
      setDiscovery() {},
      setAudioEnergy() {},
      setMotionStrength(value = 0) {
        motion = reducedMotion ? 0 : clamp(value);
        if (motion > 0.001) kick();
      },
      setZoneActive(value = 0) {
        zone = clamp(value);
        if (zone > 0) kick();
      },
      // For browser tests: draw frames now, advancing the gas by `seconds` in total.
      // Lets a hidden or headless tab, where requestAnimationFrame never fires, still
      // produce a settled frame and prove the picture moves.
      step(frames = 1, seconds = 0) {
        for (let i = 0; i < frames && !dead; i++) {
          clock += seconds / Math.max(1, frames);
          render(clock);
        }
        return clock;
      },
      resize() { scheduleResize(); },
      pause: stop,
      resume() { lastFrame = 0; kick(); },
      dispose() {
        disposed = true;
        stop();
        clearTimeout(resizeTimer);
        ro && ro.disconnect();
        io && io.disconnect();
        if (narrowMql && narrowMql.removeEventListener) narrowMql.removeEventListener("change", scheduleResize);
        document.removeEventListener("visibilitychange", onVisibility);
        canvas.removeEventListener("webglcontextlost", onLost);
        canvas.removeEventListener("webglcontextrestored", onRestored);
        dropTargets();
        if (vbo) gl.deleteBuffer(vbo);
        for (const p of [sceneProg, blendProg, brightProg, blurProg, compProg]) {
          if (p) gl.deleteProgram(p.program);
        }
        // The context is left alive on purpose; it goes with the canvas.
      }
    };
  };
})();
