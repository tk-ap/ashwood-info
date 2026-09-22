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
      float hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash21(i),hash21(i+vec2(1.,0.)),f.x),mix(hash21(i+vec2(0.,1.)),hash21(i+vec2(1.,1.)),f.x),f.y);}
      float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+vec2(13.1,7.7);a*=.5;}return v;}
      mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
      /* V4.3: one gravitational flow field drives disk, matter, lensing and environmental motion. */
      vec2 gravityFlow(vec2 p,float time,float energy){
        float r=max(length(p),.012);
        vec2 radial=p/r;
        vec2 tangent=vec2(-radial.y,radial.x);
        float spin=(.018+.022*energy)/max(r*.72,.055);
        float infall=.006/max(r*r+.028,.04);
        float wobble=(fbm(vec2(atan(p.y,p.x)*2.4-time*.13,r*18.-time*.22))-.5)*.014;
        return tangent*spin-radial*infall+tangent*wobble;
      }
      float fluxFilament(vec2 p,float time,float seed){
        float r=length(p);
        float a=atan(p.y,p.x);
        float spiral=a+r*(15.+seed*3.)-time*(.55+seed*.09);
        float thread=pow(.5+.5*cos(spiral*3.+fbm(vec2(r*23.,a*2.))*4.),10.);
        return thread*smoothstep(.74,.15,r)*smoothstep(.12,.20,r);
      }

      void main(){
        vec2 frag=gl_FragCoord.xy;
        vec2 uv=(frag-.5*u_resolution.xy)/min(u_resolution.x,u_resolution.y);
        float aspect=u_resolution.x/max(u_resolution.y,1.);
        vec2 shift=(u_pointer.xy-.5)*vec2(.025*aspect,.018)*u_pointer.z;
        vec2 p=uv-shift;
        float r=length(p);
        float a=atan(p.y,p.x);
        float t=u_time*(.08+.08*u_energy);
        vec2 flow=gravityFlow(p,u_time,u_energy);
        vec2 advected=p-flow*(.58+.42*u_energy);
        float ar=length(advected);
        float aa=atan(advected.y,advected.x);

        vec3 night=vec3(.004,.006,.005);
        vec3 gold=vec3(.74,.52,.20);
        vec3 hot=vec3(1.0,.84,.51);
        vec3 green=vec3(.08,.34,.25);
        vec3 col=night;

        /* Sparse distant material; never a conventional star field. */
        vec2 cell=floor(uv*42.);
        float dust=step(.994,hash21(cell))*(.25+.75*sin(hash21(cell)*20.+t*3.)*.5+.5);
        col+=dust*smoothstep(.32,1.05,r)*vec3(.16,.19,.16);

        /* Strong-field lensing: bend coordinates increasingly toward the photon region. */
        float bend=.020/max(r*r,.010);
        vec2 lp=advected*rot(bend*.15);
        lp += normalize(p+vec2(.0001))*bend*.010;
        float lr=length(lp);

        float H=.142;
        float photon=exp(-pow((lr-H*1.10)/.006,2.));
        float photon2=exp(-pow((lr-H*1.24)/.014,2.));
        float lensHalo=exp(-pow((lr-H*1.48)/.045,2.));

        /* Inclined accretion flow with turbulent radial texture and Doppler asymmetry. */
        vec2 d=lp*rot(-.11);
        d.y*=5.8;
        float dr=length(d);
        float band=exp(-pow(d.y/.022,2.))+0.42*exp(-pow(d.y/.052,2.))+0.13*exp(-pow(d.y/.105,2.));
        float inner=smoothstep(H*.96,H*1.12,lr);
        float outer=1.-smoothstep(.58,.78,dr);
        float turbulence=fbm(vec2(dr*31.-u_time*.23,aa*3.2+u_time*.045));
        float filaments=.32+.68*max(fluxFilament(advected,u_time,.2),fluxFilament(advected,u_time,.8));
        float disk=band*inner*outer*mix(turbulence,filaments,.62);

        /* Approaching side is hotter/brighter; receding side falls away. */
        float doppler=smoothstep(-.9,.85,cos(aa+.11));
        float front=smoothstep(-.018,.045,d.y);
        vec3 diskCol=mix(green*.55,gold,.70);
        diskCol=mix(diskCol,hot,doppler*.62);
        col+=diskCol*disk*(.48+1.15*doppler)*(.74+.44*u_energy);

        /* Lensed rear disk arcs above/below the shadow. */
        float rearArc=exp(-pow((lr-H*1.34)/.030,2.))*smoothstep(.02,.24,abs(p.y))*smoothstep(.36,.02,abs(p.y));
        rearArc*=.45+.55*fbm(vec2(aa*5.+u_time*.055,lr*35.));
        col+=mix(gold,hot,.45)*rearArc*(.35+.22*u_energy);

        col+=hot*photon*(1.62+.38*u_energy);
        col+=gold*photon2*(.48+.22*u_energy);
        col+=green*lensHalo*(.035+.08*u_discovery);

        /* Sparse Flux-derived matter shares the exact same velocity field as the accretion flow. */
        vec2 fp=advected*vec2(1.,2.35);
        float fluxA=fluxFilament(fp,u_time,.35);
        float fluxB=fluxFilament(fp*rot(.38),u_time,.73);
        float flux=(fluxA*.72+fluxB*.42)*smoothstep(.72,.18,ar);
        float grains=step(.91,noise(floor((fp+flow*2.)*72.)))*flux;
        col+=mix(green*.62,hot,.38+doppler*.25)*(flux*.065+grains*.16)*(.55+.45*u_energy);

        /* Irregular darkness around the horizon avoids the portal-ring look. */
        float edgeNoise=(fbm(vec2(aa*3.1,u_time*.012))-.5)*.008;
        float shadow=1.-smoothstep(H*.78+edgeNoise,H*1.01+edgeNoise,lr);
        col*=1.-shadow*.9995;
        float core=1.-smoothstep(H*.64,H*.82,lr);
        col=mix(col,vec3(0.),core);

        /* Local bloom is asymmetric and restrained. */
        float bloom=exp(-r*5.4)*(.018+.025*u_energy);
        col+=mix(green,gold,.58)*bloom;
        float vignette=smoothstep(1.12,.18,length(uv*vec2(.82,1.)));
        col*=mix(.24,1.,vignette);
        col*=.93+.07*smoothstep(.12,.56,u_scroll);
        gl_FragColor=vec4(col,.98);
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