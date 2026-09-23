(() => {
  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

  function create2DFallback(canvas, state, imageSrc) {
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return null;
    const source = new Image();
    let loaded = false;
    const ready = new Promise(resolve => {
      source.onload = () => { loaded = true; resolve(true); };
      source.onerror = () => resolve(false);
      source.src = imageSrc;
    });

    // Draw a rotating, clipped annulus from the SAME authored photograph. A lack
    // of WebGL must not silently downgrade mobile to a motionless procedural ring.
    const draw = () => {
      const width = canvas.width / state.dpr;
      const height = canvas.height / state.dpr;
      if (!width || !height) return;
      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (!loaded || !state.geometry || !state.motionStrength) return;
      const { drawX, drawY, drawW, drawH } = state.geometry;
      const cx = state.horizon[0] * width;
      const cy = (1 - state.horizon[1]) * height;
      const radius = state.horizonRadius * Math.min(width, height);
      const gate = state.zoneActive * state.motionStrength;
      if (gate <= 0.001) return;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 2.7, 0, Math.PI * 2);
      ctx.arc(cx, cy, radius * 1.04, 0, Math.PI * 2, true);
      ctx.clip("evenodd");
      ctx.globalAlpha = Math.min(0.94, gate * 0.95);
      ctx.translate(cx, cy);
      ctx.rotate(state.elapsed * 0.075 * gate);
      ctx.translate(-cx, -cy);
      ctx.drawImage(source, drawX, drawY, drawW, drawH);
      ctx.restore();
    };
    return { draw, ready };
  }

  window.createAshwoodGravityRenderer = function createAshwoodGravityRenderer({
    canvas,
    reducedMotion = false,
    dprCap = 1.5,
    imageElement = null,
    imageSrc = "/assets/v4/ashwood-black-hole-environment.png?v=20260922-lens2"
  } = {}) {
    if (!canvas) throw new Error("Gravity renderer requires a canvas");

    const state = {
      // V4.4 visual gate: establish a believable still universe before enabling Flux motion.
      disposed: false,
      visible: true,
      reducedMotion,
      dpr: 1,
      pointer: { x: 0.5, y: 0.5, active: 0 },
      scroll: 0,
      energy: 0.18,
      discovery: 0,
      chapter: 0,
      motionStrength: 0,
      zoneActive: 0,
      imageAspect: 1.5,
      textureReady: 0,
      horizon: [0.5,0.5],
      horizonRadius: 0.145,
      coverScale: [1,1],
      coverOffset: [0,0],
      geometry: null,
      elapsed: 0,
      start: performance.now(),
      raf: 0
    };

    let gl = null;
    let fallback = null;
    let program = null;
    let buffer = null;
    let texture = null;
    let loc = {};
    let observer = null;
    let resizeObserver = null;
    let textureLoadedPromise = Promise.resolve(false);

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
      uniform float u_motion_strength;
      uniform float u_zone_active;
      uniform sampler2D u_image;
      uniform float u_image_aspect;
      uniform float u_texture_ready;
      uniform vec2 u_horizon;
      uniform float u_horizon_radius;
      uniform vec2 u_cover_scale;
      uniform vec2 u_cover_offset;

      #define PI 3.14159265359
      float hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash21(i),hash21(i+vec2(1.,0.)),f.x),mix(hash21(i+vec2(0.,1.)),hash21(i+vec2(1.,1.)),f.x),f.y);}
      float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+vec2(13.1,7.7);a*=.5;}return v;}
      mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
      /* V4.12: NASA-informed differential orbital flow. Motion lives in the
         accretion material; the wider authored universe remains visually stable. */
      vec2 gravityFlow(vec2 p,float time,float energy){
        float r=max(length(p),.012);
        vec2 radial=p/r;
        vec2 tangent=vec2(-radial.y,radial.x);
        float innerPull=1.-smoothstep(.18,.62,r);
        float differential=(.010+.020*energy)/max(r*.82,.095);
        float shear=(fbm(vec2(atan(p.y,p.x)*2.8-time*.045,r*28.-time*.11))-.5)*.005;
        float infall=.0018*innerPull/max(r*r+.05,.08);
        return tangent*(differential+shear)-radial*infall;
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
        vec2 uv=(frag-u_horizon*u_resolution.xy)/min(u_resolution.x,u_resolution.y);
        float aspect=u_resolution.x/max(u_resolution.y,1.);
        vec2 shift=(u_pointer.xy-.5)*vec2(.025*aspect,.018)*u_pointer.z;
        vec2 p=uv-shift;
        float r=length(p);
        float a=atan(p.y,p.x);
        /* V4.12: the renderer evolves only during the Instinct encounter.
           Scroll proximity controls strength; reduced-motion freezes u_time. */
        float motionGate=clamp(u_zone_active*u_motion_strength,0.0,1.0);
        float localTime=u_time*(.42+.12*u_energy)*motionGate;
        float t=localTime;
        vec2 flow=gravityFlow(p,localTime,u_energy)*motionGate;
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

        float H=u_horizon_radius;
        /* Separate the true shadow, thin photon ring, and broader lens halo. */
        float photonRing=exp(-pow((lr-H*1.10)/.0055,2.));
        float photonEcho=exp(-pow((lr-H*1.24)/.013,2.));
        float lensHalo=exp(-pow((lr-H*1.48)/.044,2.));

        /* Inclined accretion flow with turbulent radial texture and Doppler asymmetry. */
        vec2 d=lp*rot(-.11);
        d.y*=5.8;
        float dr=length(d);
        float diskBand=exp(-pow(d.y/.020,2.))
          +0.38*exp(-pow(d.y/.050,2.))
          +0.10*exp(-pow(d.y/.100,2.));
        float inner=smoothstep(H*.98,H*1.14,lr);
        float outer=1.-smoothstep(.56,.76,dr);

        /* Bright knots form, stretch with differential rotation, then dissolve.
           They are continuous gas structure rather than independent particles. */
        float knotShear=.5+.5*sin(aa*4.0+dr*34.0-localTime*.62);
        float knotFine=.5+.5*sin(aa*8.0-dr*21.0+localTime*.31);
        float turbulence=fbm(vec2(dr*29.-localTime*.18,aa*3.4+localTime*.05));
        float filaments=.30+.70*max(fluxFilament(advected,localTime,.2),fluxFilament(advected,localTime,.8));
        float knots=mix(knotShear,knotFine,.34)*(.44+.56*turbulence);
        float disk=diskBand*inner*outer*mix(filaments,knots,.42);

        /* NASA reference behavior: approaching material reads brighter/hotter;
           the receding side remains present but materially dimmer. */
        float beaming=.32+.68*smoothstep(-.92,.86,cos(aa+.11));
        vec3 diskCol=mix(green*.42,gold,.74);
        diskCol=mix(diskCol,hot,beaming*.68);
        col+=diskCol*disk*(.34+1.22*beaming)*(.70+.40*u_energy);

        /* Lensed rear disk arcs above/below the shadow. */
        float rearArc=exp(-pow((lr-H*1.34)/.030,2.))*smoothstep(.02,.24,abs(p.y))*smoothstep(.36,.02,abs(p.y));
        rearArc*=.48+.52*fbm(vec2(aa*5.+localTime*.055,lr*35.));
        col+=mix(gold,hot,.45)*rearArc*(.32+.20*u_energy);

        col+=hot*photonRing*(1.68+.34*u_energy);
        col+=gold*photonEcho*(.44+.20*u_energy);
        col+=green*lensHalo*(.035+.08*u_discovery);

        /* Sparse Flux-derived matter shares the exact same velocity field as the accretion flow. */
        vec2 fp=advected*vec2(1.,2.35);
        float fluxA=fluxFilament(fp,localTime,.35);
        float fluxB=fluxFilament(fp*rot(.38),localTime,.73);
        float flux=(fluxA*.72+fluxB*.42)*smoothstep(.72,.18,ar);
        float grains=step(.91,noise(floor((fp+flow*2.)*72.)))*flux;
        col+=mix(green*.62,hot,.38+beaming*.25)*(flux*.065+grains*.16)*(.55+.45*u_energy);

        /* Irregular darkness around the horizon avoids the portal-ring look. */
        float edgeNoise=(fbm(vec2(aa*3.1,localTime*.012))-.5)*.005;
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

        /* V4.13 visibility correction:
           animate the authored image itself, not merely a procedural glow laid over it.
           Differential rotation shears the source texture around the horizon while the
           true shadow remains untouched. */
        float authoredInner=smoothstep(H*.98,H*1.30,r);
        float authoredOuter=1.-smoothstep(H*2.1,H*3.6,r);
        float authoredMask=authoredInner*authoredOuter*motionGate;
        float differentialRotation=(.075/max(r,H*1.1))*localTime*authoredMask;
        float shearWave=sin(aa*5.0-r*29.0+localTime*.74)*.0045*authoredMask;
        vec2 tangent=normalize(vec2(-p.y,p.x)+vec2(.00001));
        vec2 warpedP=rot(-differentialRotation)*p+tangent*shearWave;

        // Project through the exact object-fit:cover crop of the visible authored plate.
        vec2 warpedScreen=frag/u_resolution.xy+(warpedP-p)*(min(u_resolution.x,u_resolution.y)/u_resolution.xy);
        vec2 texUv=warpedScreen*u_cover_scale+u_cover_offset;
        vec3 authored=texture2D(u_image,clamp(texUv,vec2(.001),vec2(.999))).rgb;

        float authoredAlpha=authoredMask*u_texture_ready*(.72+.20*beaming);
        vec3 authoredLit=authored+col*(.12+.10*beaming);
        vec3 finalColor=mix(col,authoredLit,authoredAlpha);
        float finalAlpha=max(.10*motionGate,authoredAlpha);
        gl_FragColor=vec4(finalColor,finalAlpha);
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
      loc.motionStrength = gl.getUniformLocation(program, "u_motion_strength");
      loc.zoneActive = gl.getUniformLocation(program, "u_zone_active");
      loc.image = gl.getUniformLocation(program, "u_image");
      loc.imageAspect = gl.getUniformLocation(program, "u_image_aspect");
      loc.textureReady = gl.getUniformLocation(program, "u_texture_ready");
      loc.horizon = gl.getUniformLocation(program, "u_horizon");
      loc.horizonRadius = gl.getUniformLocation(program, "u_horizon_radius");
      loc.coverScale = gl.getUniformLocation(program, "u_cover_scale");
      loc.coverOffset = gl.getUniformLocation(program, "u_cover_offset");
      return true;
    };

    // The image is an img with object-fit: cover, centered and transformed by
    // the current camera CSS. Its DOM rect is the only cropping source of truth.
    const updateImageMapping = () => {
      const canvasRect = canvas.getBoundingClientRect();
      const plateRect = imageElement?.getBoundingClientRect();
      if (!plateRect || !canvasRect.width || !canvasRect.height) return;
      const aspect = state.imageAspect;
      const drawW = Math.max(plateRect.width, plateRect.height * aspect);
      const drawH = drawW / aspect;
      const cropX = (drawW - plateRect.width) / 2;
      const cropY = (drawH - plateRect.height) / 2;
      const drawX = plateRect.left - canvasRect.left - cropX;
      const drawY = plateRect.top - canvasRect.top - cropY;
      const cx = drawX + drawW * 0.505;
      const cy = drawY + drawH * 0.468;
      state.horizon = [
        cx / canvasRect.width,
        1 - cy / canvasRect.height
      ];
      state.horizonRadius = (drawW * (150 / 1536)) / Math.min(canvasRect.width, canvasRect.height);
      state.coverScale = [canvasRect.width / drawW, canvasRect.height / drawH];
      state.coverOffset = [
        -drawX / drawW,
        1 - (canvasRect.height - drawY) / drawH
      ];
      state.geometry = { drawX, drawY, drawW, drawH };
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
      updateImageMapping();
      if (fallback) fallback.draw();
    };

    const loadAuthoredTexture = () => new Promise(resolve => {
      if (!gl || !imageSrc) { resolve(false); return; }
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        if (!gl || state.disposed) { resolve(false); return; }
        try {
          if (texture) gl.deleteTexture(texture);
          texture = gl.createTexture();
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
          if (gl.getError() !== gl.NO_ERROR) throw new Error("texture upload failed");
          state.imageAspect = image.naturalWidth / Math.max(image.naturalHeight, 1);
          state.textureReady = 1;
          resize();
          resolve(true);
        } catch (error) {
          console.warn("[ASHWOOD / GRAVITY] Texture unavailable", error.message);
          state.textureReady = 0;
          resolve(false);
        }
      };
      image.onerror = () => { state.textureReady = 0; resolve(false); };
      image.src = imageSrc;
    });

    const render = (now = performance.now()) => {
      if (state.disposed || !state.visible || document.hidden) return;
      state.elapsed = state.reducedMotion ? 0 : (now - state.start) / 1000;

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
        gl.uniform1f(loc.motionStrength, state.motionStrength);
        gl.uniform1f(loc.zoneActive, state.zoneActive);
        gl.uniform1f(loc.imageAspect, state.imageAspect);
        gl.uniform1f(loc.textureReady, state.textureReady);
        gl.uniform2f(loc.horizon, ...state.horizon);
        gl.uniform1f(loc.horizonRadius, state.horizonRadius);
        gl.uniform2f(loc.coverScale, ...state.coverScale);
        gl.uniform2f(loc.coverOffset, ...state.coverOffset);
        if (texture) {
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, texture);
        }
        gl.uniform1i(loc.image, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      } else if (fallback) {
        fallback.draw();
      }

      if (!state.reducedMotion && state.zoneActive > 0.001) state.raf = requestAnimationFrame(render);
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
        textureLoadedPromise = loadAuthoredTexture();
        resize();
        start();
      } catch (_) {
        gl = null;
        fallback = create2DFallback(canvas, state, imageSrc);
        start();
      }
    });

    observer = new IntersectionObserver(([entry]) => {
      state.visible = !!entry?.isIntersecting;
      state.visible ? start() : stop();
    }, { rootMargin: "180px 0px" });
    observer.observe(canvas);
    if ("ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(() => resize());
      resizeObserver.observe(canvas);
    }
    window.addEventListener("resize", resize, { passive: true });
    window.visualViewport?.addEventListener("resize", resize, { passive: true });
    imageElement?.addEventListener("load", resize);

    try {
      if (!initWebGL()) {
        fallback = create2DFallback(canvas, state, imageSrc);
        textureLoadedPromise = fallback?.ready || Promise.resolve(false);
      } else textureLoadedPromise = loadAuthoredTexture();
    } catch (error) {
      console.warn("[ASHWOOD / GRAVITY] WebGL unavailable; using composed fallback.", error);
      gl = null;
      fallback = create2DFallback(canvas, state, imageSrc);
      textureLoadedPromise = fallback?.ready || Promise.resolve(false);
    }

    resize();
    start();

    return {
      ready: textureLoadedPromise.then(textureLoaded => ({ mode: gl ? "webgl" : "canvas2d", textureLoaded })), 
      status() { return {
        mode: gl ? "webgl" : "canvas2d", textureLoaded: !!state.textureReady || !!fallback,
        horizon: state.horizon, horizonRadius: state.horizonRadius,
        coverScale: state.coverScale, coverOffset: state.coverOffset,
        motionStrength: state.motionStrength, zoneActive: state.zoneActive,
        visible: state.visible
      }; },
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
      setMotionStrength(value = 0) {
        state.motionStrength = state.reducedMotion ? 0 : clamp(value);
        if (state.reducedMotion) render();
      },
      setZoneActive(value = 0) {
        const wasActive = state.zoneActive > 0.001;
        state.zoneActive = clamp(value);
        const isActive = state.zoneActive > 0.001;
        if (state.reducedMotion) render();
        else if (!wasActive && isActive) start();
        else if (wasActive && !isActive) stop();
      },
      resize,
      pause: stop,
      resume: start,
      dispose() {
        state.disposed = true;
        stop();
        observer?.disconnect();
        resizeObserver?.disconnect();
        window.removeEventListener("resize", resize);
        window.visualViewport?.removeEventListener("resize", resize);
        imageElement?.removeEventListener("load", resize);
        document.removeEventListener("visibilitychange", onVisibility);
        if (gl) {
          if (buffer) gl.deleteBuffer(buffer);
          if (program) gl.deleteProgram(program);
          if (texture) gl.deleteTexture(texture);
        }
      }
    };
  };
})();