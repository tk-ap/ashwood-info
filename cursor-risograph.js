(() => {
  "use strict";

  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!finePointer.matches || reducedMotion.matches) return;

  const root = document.documentElement;
  const canvas = document.createElement("canvas");
  canvas.className = "ashwood-riso-cursor-trail";
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100vw",
    height: "100vh",
    zIndex: "340",
    pointerEvents: "none",
    background: "transparent",
    opacity: "1"
  });
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
  if (!ctx) {
    canvas.remove();
    return;
  }

  let width = 0;
  let height = 0;
  let dpr = 1;
  let raf = 0;
  let lastX = null;
  let lastY = null;
  let lastSpawnX = null;
  let lastSpawnY = null;
  let colors = [];
  let baseAlpha = 0.12;
  const particles = [];
  const MAX_PARTICLES = 132;

  const css = name => getComputedStyle(root).getPropertyValue(name).trim();

  const refreshTheme = () => {
    colors = [
      css("--ashwood-field-green") || "#009b3a",
      css("--ashwood-gold") || "#b48732",
      css("--ashwood-accent-2") || "#3f7f84"
    ];
    const theme = root.dataset.ashwoodTheme || "warm-dark";
    if (theme === "paper-light") {
      canvas.style.mixBlendMode = "multiply";
      baseAlpha = 0.15;
    } else if (theme === "phosphor-cyber") {
      canvas.style.mixBlendMode = "screen";
      baseAlpha = 0.14;
    } else {
      canvas.style.mixBlendMode = "screen";
      baseAlpha = 0.105;
    }
  };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const spawnDot = (x, y, strength = 1) => {
    const now = performance.now();
    const dotCount = Math.random() < 0.38 ? 3 : 2;
    const primary = Math.floor(Math.random() * colors.length);

    for (let i = 0; i < dotCount; i += 1) {
      const offset = i === 0 ? 1.6 : 5.2;
      particles.push({
        x: x + (Math.random() - 0.5) * offset,
        y: y + (Math.random() - 0.5) * offset,
        r: (0.9 + Math.random() * 1.5) * (0.84 + strength * 0.2),
        born: now,
        life: 720 + Math.random() * 520,
        alpha: baseAlpha * (i === 0 ? 1 : 0.58) * (0.76 + strength * 0.26),
        color: colors[(primary + i) % colors.length]
      });
    }

    /* Registration echo: a tiny imperfect second pass, never a continuous glow. */
    if (Math.random() < 0.48) {
      particles.push({
        x: x + 1.5 + Math.random() * 2,
        y: y - 1.1 + Math.random() * 1.6,
        r: 0.7 + Math.random() * 0.9,
        born: now,
        life: 620 + Math.random() * 420,
        alpha: baseAlpha * 0.46,
        color: colors[2]
      });
    }

    if (particles.length > MAX_PARTICLES) particles.splice(0, particles.length - MAX_PARTICLES);
    if (!raf) raf = requestAnimationFrame(draw);
  };

  const draw = now => {
    raf = 0;
    ctx.clearRect(0, 0, width, height);

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const particle = particles[i];
      const age = now - particle.born;
      const progress = age / particle.life;
      if (progress >= 1) {
        particles.splice(i, 1);
        continue;
      }

      const fade = Math.pow(1 - progress, 1.32);
      ctx.globalAlpha = particle.alpha * fade;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, Math.max(0.28, particle.r * (1 - progress * 0.22)), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    if (particles.length) raf = requestAnimationFrame(draw);
  };

  const onPointerMove = event => {
    if (event.pointerType && event.pointerType !== "mouse" && event.pointerType !== "pen") return;
    const x = event.clientX;
    const y = event.clientY;

    if (lastX === null) {
      lastX = lastSpawnX = x;
      lastY = lastSpawnY = y;
      return;
    }

    const dx = x - lastX;
    const dy = y - lastY;
    const speed = Math.min(Math.hypot(dx, dy) / 22, 1.8);
    lastX = x;
    lastY = y;

    const sx = lastSpawnX ?? x;
    const sy = lastSpawnY ?? y;
    const distance = Math.hypot(x - sx, y - sy);
    if (distance < 7) return;

    const steps = Math.min(5, Math.max(1, Math.floor(distance / 9)));
    for (let i = 1; i <= steps; i += 1) {
      const t = i / steps;
      spawnDot(sx + (x - sx) * t, sy + (y - sy) * t, speed);
    }
    lastSpawnX = x;
    lastSpawnY = y;
  };

  const clearTrail = () => {
    particles.length = 0;
    lastX = lastY = lastSpawnX = lastSpawnY = null;
    ctx.clearRect(0, 0, width, height);
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  resize();
  refreshTheme();
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("pointermove", onPointerMove, { passive: true, capture: true });
  document.documentElement.addEventListener("mouseleave", clearTrail);
  document.addEventListener("ashwood:theme-change", refreshTheme);

  reducedMotion.addEventListener?.("change", event => {
    if (!event.matches) return;
    clearTrail();
    canvas.remove();
  });
})();
