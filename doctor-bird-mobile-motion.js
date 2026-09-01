(() => {
  "use strict";

  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path !== "/" && path !== "/index.html") return;
  if (!matchMedia("(max-width:760px), (pointer:coarse)").matches) return;

  const reduce = matchMedia("(prefers-reduced-motion:reduce)");
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const style = document.createElement("style");
  style.textContent = `
    @media(max-width:760px),(pointer:coarse){
      .ashwood-doctor-bird-cursor.ashwood-rendered-mobile-bird{
        display:block!important;
        width:clamp(108px,30vw,136px)!important;
        height:auto!important;
        aspect-ratio:360/247;
        z-index:524!important;
        overflow:visible!important;
        transform-origin:center!important;
        filter:drop-shadow(0 9px 20px rgba(0,0,0,.3))!important;
      }
      .ashwood-rendered-bird-shell{
        position:relative;
        width:100%;height:100%;
        transform-origin:center;
        transition:transform .24s ease;
      }
      .ashwood-doctor-bird-cursor.is-mobile-reversing .ashwood-rendered-bird-shell{transform:scaleX(-1)}
      .ashwood-rendered-bird-base{
        position:relative!important;inset:auto!important;z-index:2;
        width:100%!important;height:100%!important;object-fit:contain!important;
        animation:ashwood-rendered-hover .92s ease-in-out infinite alternate;
        transform-origin:58% 55%;
      }
      .ashwood-rendered-wing-trace{
        position:absolute!important;inset:0!important;z-index:3;
        width:100%!important;height:100%!important;object-fit:contain!important;
        pointer-events:none!important;
        opacity:.18;
        filter:blur(1.4px) saturate(1.08);
        will-change:transform,opacity;
      }
      .ashwood-rendered-wing-trace--near{
        clip-path:polygon(20% 0,67% 0,72% 48%,48% 54%,24% 38%);
        transform-origin:58% 46%;
        animation:ashwood-rendered-wing-near .085s cubic-bezier(.35,0,.65,1) infinite alternate;
      }
      .ashwood-rendered-wing-trace--far{
        clip-path:polygon(30% 0,78% 0,77% 47%,53% 52%,35% 35%);
        transform-origin:62% 45%;
        opacity:.11;
        animation:ashwood-rendered-wing-far .105s cubic-bezier(.35,0,.65,1) infinite alternate;
      }
      .ashwood-doctor-bird-cursor.is-mobile-flying .ashwood-rendered-wing-trace--near{animation-duration:.06s;opacity:.25}
      .ashwood-doctor-bird-cursor.is-mobile-flying .ashwood-rendered-wing-trace--far{animation-duration:.072s;opacity:.17}
      .ashwood-doctor-bird-cursor.is-mobile-flying .ashwood-rendered-bird-base{animation-duration:.58s}
    }
    @keyframes ashwood-rendered-hover{
      from{transform:translateY(-1.5px) rotate(-.5deg)}
      to{transform:translateY(2px) rotate(.7deg)}
    }
    @keyframes ashwood-rendered-wing-near{
      from{transform:translateY(-7px) rotate(-8deg) scaleY(.88);opacity:.08}
      to{transform:translateY(8px) rotate(9deg) scaleY(1.08);opacity:.28}
    }
    @keyframes ashwood-rendered-wing-far{
      from{transform:translateY(6px) rotate(7deg) scaleY(1.04);opacity:.05}
      to{transform:translateY(-8px) rotate(-9deg) scaleY(.9);opacity:.18}
    }
    @media(prefers-reduced-motion:reduce){
      .ashwood-rendered-bird-base,.ashwood-rendered-wing-trace{animation:none!important}
    }
  `;
  document.head.append(style);

  let installed = false;
  let x = innerWidth + 140;
  let y = 120;
  let reverseNext = false;
  let flight = null;
  let targetTimer = 0;

  const install = () => {
    if (installed) return true;
    const bird = document.querySelector(".ashwood-doctor-bird-cursor");
    const panel = document.querySelector(".ashwood-doctor-guide");
    const image = bird?.querySelector("img");
    if (!bird || !panel || !image) return false;

    installed = true;
    bird.classList.add("ashwood-rendered-mobile-bird");

    const shell = document.createElement("div");
    shell.className = "ashwood-rendered-bird-shell";
    image.replaceWith(shell);
    image.classList.add("ashwood-rendered-bird-base");
    shell.append(image);

    const farWing = image.cloneNode(true);
    farWing.removeAttribute("alt");
    farWing.className = "ashwood-rendered-wing-trace ashwood-rendered-wing-trace--far";
    farWing.setAttribute("aria-hidden", "true");
    const nearWing = image.cloneNode(true);
    nearWing.removeAttribute("alt");
    nearWing.className = "ashwood-rendered-wing-trace ashwood-rendered-wing-trace--near";
    nearWing.setAttribute("aria-hidden", "true");
    shell.prepend(farWing);
    shell.append(nearWing);

    const transform = (px, py, rotate = 0) => `translate3d(${px - 58}px,${py - 42}px,0) rotate(${rotate}deg)`;

    const pointFor = (el) => {
      const rect = el.getBoundingClientRect();
      const panelReserve = Math.min(270, innerHeight * .34);
      return {
        x: clamp(rect.right - Math.min(42, rect.width * .12), 72, innerWidth - 64),
        y: clamp(rect.top + Math.min(Math.max(rect.height * .2, 34), 110), 72, innerHeight - panelReserve)
      };
    };

    const settle = (q) => {
      x = q.x;
      y = q.y;
      bird.style.transform = transform(x, y, 0);
      bird.classList.remove("is-mobile-flying");
    };

    const flyToTarget = () => {
      const target = document.querySelector("[data-ashwood-guide-target=true]");
      if (!target || !document.body.classList.contains("ashwood-bird-guide-active")) return;
      const q = pointFor(target);
      bird.classList.add("is-visible", "is-mobile-flying");
      bird.classList.toggle("is-mobile-reversing", reverseNext);

      if (reduce.matches) {
        settle(q);
        reverseNext = false;
        return;
      }

      flight?.cancel();
      const startX = Number.isFinite(x) ? x : innerWidth + 120;
      const startY = Number.isFinite(y) ? y : q.y - 70;
      const direction = reverseNext ? -1 : 1;
      const midX = (startX + q.x) / 2 + direction * 28;
      const midY = Math.max(64, Math.min(startY, q.y) - 58);
      const rotate = clamp((q.x - startX) * .045, -8, 8);

      flight = bird.animate([
        { transform: transform(startX, startY, 0), offset: 0 },
        { transform: transform(midX, midY, rotate), offset: .52 },
        { transform: transform(q.x, q.y, 0), offset: 1 }
      ], {
        duration: 760,
        easing: "cubic-bezier(.2,.72,.2,1)",
        fill: "forwards"
      });
      flight.onfinish = () => {
        flight = null;
        settle(q);
        reverseNext = false;
      };
    };

    const scheduleTarget = () => {
      clearTimeout(targetTimer);
      targetTimer = setTimeout(flyToTarget, reduce.matches ? 20 : 500);
    };

    const exit = () => {
      clearTimeout(targetTimer);
      if (!bird.classList.contains("is-visible")) return;
      bird.classList.add("is-mobile-flying");
      if (reduce.matches) {
        bird.classList.remove("is-visible", "is-mobile-flying");
        return;
      }
      flight?.cancel();
      flight = bird.animate([
        { transform: transform(x, y, 0), opacity: 1 },
        { transform: transform(innerWidth + 150, Math.max(54, y - 110), 7), opacity: .25 }
      ], { duration: 720, easing: "cubic-bezier(.25,.7,.2,1)", fill: "forwards" });
      flight.onfinish = () => {
        flight = null;
        bird.classList.remove("is-visible", "is-mobile-flying", "is-mobile-reversing");
        bird.style.transform = "";
        x = innerWidth + 140;
        y = 120;
      };
    };

    panel.querySelector(".back")?.addEventListener("click", () => { reverseNext = true; });
    panel.querySelector(".next")?.addEventListener("click", () => { reverseNext = false; });

    const targetObserver = new MutationObserver(() => {
      if (document.body.classList.contains("ashwood-bird-guide-active")) scheduleTarget();
    });
    targetObserver.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["data-ashwood-guide-target"] });

    const activeObserver = new MutationObserver(() => {
      if (document.body.classList.contains("ashwood-bird-guide-active")) {
        if (!bird.classList.contains("is-visible")) {
          x = innerWidth + 130;
          y = Math.max(76, innerHeight * .24);
          bird.style.transform = transform(x, y, 0);
          bird.classList.add("is-visible");
        }
        scheduleTarget();
      } else {
        exit();
      }
    });
    activeObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    addEventListener("resize", () => {
      if (document.body.classList.contains("ashwood-bird-guide-active")) scheduleTarget();
    }, { passive: true });

    return true;
  };

  if (install()) return;
  const observer = new MutationObserver(() => {
    if (install()) observer.disconnect();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();