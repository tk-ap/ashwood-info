(() => {
  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

  function create2DFallback(canvas, state) {
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return null;

    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = state.dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const cx = width * (0.5 + (state.pointer.x - 0.5) * 0.028 * state.pointer.active);
      const cy = height * (0.5 + (state.pointer.y - 0.5) * 0.020 * state.pointer.active);
      const radius = Math.min(width, height) * 0.145;

      const glow = ctx.createRadialGradient(cx, cy, radius * 0.28, cx, cy, radius * 2.9);
      glow.addColorStop(0, "rgba(0,0,0,1)");
      glow.addColorStop(0.31, "rgba(0,0,0,1)");
      glow.addColorStop(0.37, "rgba(255,224,158,.72)");
      glow.addColorStop(0.43, "rgba(180,135,50,.30)");
      glow.addColorStop(0.58, "rgba(40,150,120,.11)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.18);
      ctx.scale(1, 0.21);
      ctx.strokeStyle = `rgba(255,218,138,${0.62 + state.energy * 0.24})`;
      ctx.lineWidth = Math.max(3, radius * 0.085);
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.82, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.strokeStyle = "rgba(255,238,196,.88)";
      ctx.lineWidth = Math.max(1.5, radius * 0.025);
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.03, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "rgba(0,0,0,1)";
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.82, 0, Math.PI * 2);
      ctx.fill();
    };

    return { draw };
  }

  window.createAshwoodGravityRenderer = function createAshwoodGravityRenderer({
    canvas,
    reducedMotion = false,
    dprCap = 1.5
  } = {}) {
    if (!canvas) throw new Error("Gravity renderer requires a canvas");

    const state = {
      disposed: false,
      visible: true,
      reducedMotion,
      dpr: 1,
      pointer: { x: 0.5, y: 0.5, active: 0 },
      scroll: 0,
      energy: 0.18,
      discovery: 0,
      chapter: 0,
      start: performance.now(),
      raf: 0
    };

    let gl = null;
    let fallback = null;
    let program = null;
    let buffer = null;
    let loc = {};
    let observer = null;

    const vertexSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fragmentSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec3 u_pointer;
      uniform float u_scroll;
      uniform float u_energy;
      uniform float u_discovery;
      uniform float u_chapter;

      #define PI 3.14159265359

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash21(i), hash21(i + vec2(1.0,0.0)), f.x),
          mix(hash21(i + vec2(0.0,1.0)), hash21(i + vec2(1.0,1.0)), f.x),
          f.y
        );
      }

      mat2 rot(float a) {
        float c = cos(a), s = sin(a);
        return mat2(c,-s,s,c);
      }

      void main() {
        vec2 frag = gl_FragCoord.xy;
        vec2 uv = (frag - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
        float aspect = u_resolution.x / max(u_resolution.y, 1.0);

        vec2 pointerShift = (u_pointer.xy - 0.5) * vec2(0.035 * aspect, 0.026) * u_pointer.z;
        vec2 p = uv - pointerShift;

        float r = length(p);
        float angle = atan(p.y, p.x);
        float time = u_time * (0.14 + 0.12 * u_energy);

        vec3 night = vec3(0.018, 0.021, 0.018);
        vec3 gold = vec3(0.706, 0.529, 0.196);
        vec3 green = vec3(0.11, 0.45, 0.34);
        vec3 warm = vec3(0.86, 0.68, 0.34);

        vec3 col = night;

        vec2 starUv = uv * 34.0;
        float stars = step(0.988, hash21(floor(starUv)));
        float twinkle = 0.55 + 0.45 * sin(time * 5.0 + hash21(floor(starUv)) * 20.0);
        float starFade = smoothstep(0.35, 1.15, r);
        col += stars * twinkle * starFade * vec3(0.33,0.38,0.34);

        float lens = 0.055 / max(r, 0.055);
        vec2 warped = p * rot(lens * 0.24 + sin(angle * 3.0 + time) * 0.008);
        float wr = length(warped);

        float horizon = 0.145;
        float photon = exp(-pow((wr - horizon * 1.20) / 0.012, 2.0));
        float photonHalo = exp(-pow((wr - horizon * 1.31) / 0.032, 2.0));
        float outerLens = exp(-pow((wr - horizon * 1.70) / 0.075, 2.0));

        vec2 discP = warped * rot(-0.16);
        discP.y *= 5.1;
        float discR = length(discP);
        float discMask = smoothstep(0.62, 0.18, discR) * smoothstep(horizon * 0.88, horizon * 1.08, wr);
        float band = exp(-pow(discP.y / 0.027, 2.0)) + 0.34 * exp(-pow(discP.y / 0.068, 2.0));
        float texture = 0.50 + 0.50 * noise(vec2(discR * 23.0 - time * 1.8, angle * 2.7));
        float swirl = 0.55 + 0.45 * sin(angle * 5.0 - time * 2.2 + discR * 31.0);
        float accretion = band * discMask * mix(texture, swirl, 0.45);

        float front = smoothstep(-0.025, 0.05, discP.y);
        vec3 discColor = mix(green, gold, 0.72 + 0.20 * sin(angle + time));
        discColor = mix(discColor, warm, front * 0.28);
        col += discColor * accretion * (0.76 + 0.86 * u_energy);
        col += vec3(1.0,0.86,0.60) * photon * (0.78 + 0.34 * u_energy);
        col += gold * photonHalo * (0.22 + 0.18 * u_energy);
        col += green * outerLens * (0.045 + 0.10 * u_discovery);

        float shadow = 1.0 - smoothstep(horizon * 0.76, horizon, wr);
        col *= 1.0 - shadow * 0.999;
        float blackCore = 1.0 - smoothstep(horizon * 0.66, horizon * 0.76, wr);
        col = mix(col, vec3(0.0), blackCore);

        float bloom = exp(-r * 4.8) * (0.025 + 0.03 * u_energy);
        col += mix(green, gold, 0.55) * bloom;

        float vignette = smoothstep(1.15, 0.22, length(uv * vec2(0.86, 1.0)));
        col *= mix(0.34, 1.0, vignette);

        float scrollLift = 0.94 + 0.06 * smoothstep(0.12, 0.56, u_scroll);
        col *= scrollLift;

        gl_FragColor = vec4(col, 0.96);
      }
    `;

    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(info || "Gravity shader compile failed");
      }
      return shader;
    };

    const initWebGL = () => {
      gl = canvas.getContext("webgl", {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: "high-performance",
        preserveDrawingBuffer: false
      });
      if (!gl) return false;

      const vs = compile(gl.VERTEX_SHADER, vertexSource);
      const fs = compile(gl.FRAGMENT_SHADER, fragmentSource);
      program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || "Gravity program link failed");
      }

      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);

      loc.position = gl.getAttribLocation(program, "a_position");
      loc.resolution = gl.getUniformLocation(program, "u_resolution");
      loc.time = gl.getUniformLocation(program, "u_time");
      loc.pointer = gl.getUniformLocation(program, "u_pointer");
      loc.scroll = gl.getUniformLocation(program, "u_scroll");
      loc.energy = gl.getUniformLocation(program, "u_energy");
      loc.discovery = gl.getUniformLocation(program, "u_discovery");
      loc.chapter = gl.getUniformLocation(program, "u_chapter");
      return true;
    };

    const resize = () => {
      if (state.disposed) return;
      const rect = canvas.getBoundingClientRect();
      const mobile = matchMedia("(max-width: 700px)").matches;
      state.dpr = Math.min(devicePixelRatio || 1, mobile ? 1.2 : dprCap);
      const width = Math.max(1, Math.floor(rect.width * state.dpr));
      const height = Math.max(1, Math.floor(rect.height * state.dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      if (gl) gl.viewport(0, 0, width, height);
      if (fallback) fallback.draw();
    };

    const render = (now = performance.now()) => {
      if (state.disposed || !state.visible || document.hidden) return;
      resize();

      if (gl && program) {
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(loc.position);
        gl.vertexAttribPointer(loc.position, 2, gl.FLOAT, false, 0, 0);

        gl.uniform2f(loc.resolution, canvas.width, canvas.height);
        gl.uniform1f(loc.time, state.reducedMotion ? 0.0 : (now - state.start) / 1000);
        gl.uniform3f(loc.pointer, state.pointer.x, 1 - state.pointer.y, state.pointer.active);
        gl.uniform1f(loc.scroll, state.scroll);
        gl.uniform1f(loc.energy, state.energy);
        gl.uniform1f(loc.discovery, state.discovery);
        gl.uniform1f(loc.chapter, state.chapter);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      } else if (fallback) {
        fallback.draw();
      }

      if (!state.reducedMotion) state.raf = requestAnimationFrame(render);
    };

    const stop = () => {
      if (state.raf) cancelAnimationFrame(state.raf);
      state.raf = 0;
    };

    const start = () => {
      stop();
      if (state.disposed || !state.visible || document.hidden) return;
      if (state.reducedMotion) render();
      else state.raf = requestAnimationFrame(render);
    };

    const onVisibility = () => document.hidden ? stop() : start();
    document.addEventListener("visibilitychange", onVisibility);

    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      stop();
    });
    canvas.addEventListener("webglcontextrestored", () => {
      try {
        initWebGL();
        start();
      } catch (_) {
        gl = null;
        fallback = create2DFallback(canvas, state);
        start();
      }
    });

    observer = new IntersectionObserver(([entry]) => {
      state.visible = !!entry?.isIntersecting;
      state.visible ? start() : stop();
    }, { rootMargin: "180px 0px" });
    observer.observe(canvas);

    try {
      if (!initWebGL()) fallback = create2DFallback(canvas, state);
    } catch (error) {
      console.warn("[ASHWOOD / GRAVITY] WebGL unavailable; using composed fallback.", error);
      gl = null;
      fallback = create2DFallback(canvas, state);
    }

    resize();
    start();

    return {
      ready: Promise.resolve({ mode: gl ? "webgl" : "canvas2d" }),
      setPointer({ x = 0.5, y = 0.5, active = 1 } = {}) {
        state.pointer.x = clamp(x);
        state.pointer.y = clamp(y);
        state.pointer.active = clamp(active);
        if (state.reducedMotion) render();
      },
      setScroll(progress = 0) {
        state.scroll = clamp(progress);
        if (state.reducedMotion) render();
      },
      setChapter(chapter = "identity") {
        state.chapter = chapter === "instinct" ? 1 : chapter === "evidence" ? 2 : 0;
        if (state.reducedMotion) render();
      },
      setDiscovery(signals = []) {
        state.discovery = clamp((Array.isArray(signals) ? signals.length : 0) / 6);
        if (state.reducedMotion) render();
      },
      setAudioEnergy(value = 0) {
        state.energy = clamp(0.18 + value * 0.82);
        if (state.reducedMotion) render();
      },
      resize,
      dispose() {
        state.disposed = true;
        stop();
        observer?.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        if (gl) {
          if (buffer) gl.deleteBuffer(buffer);
          if (program) gl.deleteProgram(program);
        }
      }
    };
  };
})();