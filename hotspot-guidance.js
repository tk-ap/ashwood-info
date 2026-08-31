(() => {
  "use strict";

  const field = document.querySelector('.principles-field');
  if (!field || field.dataset.ashwoodGuidance === '1') return;
  field.dataset.ashwoodGuidance = '1';

  const hotspots = [...field.querySelectorAll('.principle-hotspot')];
  if (!hotspots.length) return;

  const style = document.createElement('style');
  style.textContent = `
    @media (min-width:761px) {
      body.ashwood-home-native .principles-field {
        --ashwood-guidance-line: color-mix(in srgb, var(--ashwood-v2-field, #536b3d) 32%, transparent);
      }

      body.ashwood-home-native .ashwood-field-guide {
        position:absolute;
        left:0;
        right:0;
        top:0;
        z-index:205;
        display:grid;
        grid-template-columns:auto minmax(0,1fr) auto;
        align-items:center;
        gap:clamp(14px,2vw,28px);
        min-height:42px;
        padding:0 0 10px;
        border-bottom:1px solid var(--ashwood-guidance-line);
        color:var(--ashwood-muted);
        pointer-events:none;
      }

      body.ashwood-home-native .ashwood-field-guide__count {
        color:#009b3a;
        font-size:8px;
        line-height:1.2;
        letter-spacing:.16em;
        text-transform:uppercase;
        white-space:nowrap;
      }

      body.ashwood-home-native .ashwood-field-guide__copy {
        font-family:Georgia,serif;
        font-size:10px;
        line-height:1.35;
        font-style:italic;
        opacity:.72;
      }

      body.ashwood-home-native .ashwood-field-guide__reveal {
        border:0;
        padding:7px 0;
        background:none;
        color:var(--ashwood-ink);
        font-family:inherit;
        font-size:8px;
        line-height:1;
        letter-spacing:.14em;
        text-transform:uppercase;
        cursor:pointer;
        pointer-events:auto;
        opacity:.72;
        transition:color .25s ease,opacity .25s ease,letter-spacing .25s ease;
      }

      body.ashwood-home-native .ashwood-field-guide__reveal:hover,
      body.ashwood-home-native .ashwood-field-guide__reveal:focus-visible {
        color:var(--ashwood-gold);
        opacity:1;
        letter-spacing:.17em;
      }

      /* A visitor should be able to tell that points exist before accidentally
         finding one. The labels remain latent; only the anchor and a faint field
         halo are visible until proximity resolves the thought. */
      body.ashwood-home-native:not(.has-found-all-hotspots):not(.has-viewed-capability-map)
      .principle-hotspot:not(.is-discovered)::before {
        width:6px !important;
        height:6px !important;
        opacity:.34 !important;
        box-shadow:0 0 8px rgba(0,155,58,.34),0 0 18px rgba(0,155,58,.11) !important;
      }

      body.ashwood-home-native:not(.has-found-all-hotspots):not(.has-viewed-capability-map)
      .principle-hotspot:not(.is-near):not(.is-revealed)::after {
        opacity:.16 !important;
        transform:translate(-50%,-50%) scale(.72) !important;
      }

      body.ashwood-home-native:not(.has-found-all-hotspots):not(.has-viewed-capability-map)
      .principle-hotspot {
        width:clamp(128px,15vw,188px) !important;
        min-height:56px !important;
        padding:8px 10px 10px !important;
      }

      body.ashwood-home-native:not(.has-found-all-hotspots):not(.has-viewed-capability-map)
      .principle-hotspot.is-near,
      body.ashwood-home-native:not(.has-found-all-hotspots):not(.has-viewed-capability-map)
      .principle-hotspot.is-revealed {
        width:clamp(190px,21vw,270px) !important;
        min-height:78px !important;
        padding:11px 14px 13px !important;
      }

      body.ashwood-home-native.has-viewed-capability-map .ashwood-field-guide,
      body.ashwood-home-native.has-found-all-hotspots .ashwood-field-guide {
        opacity:0;
        visibility:hidden;
        pointer-events:none;
      }
    }

    @media (max-width:760px), (pointer:coarse) {
      .ashwood-field-guide { display:none !important; }
    }

    @media (prefers-reduced-motion:reduce) {
      .ashwood-field-guide__reveal { transition:none !important; }
    }
  `;
  document.head.appendChild(style);

  const guide = document.createElement('div');
  guide.className = 'ashwood-field-guide';
  guide.setAttribute('aria-live', 'polite');
  guide.innerHTML = `
    <span class="ashwood-field-guide__count">0 / 6 SIGNALS</span>
    <span class="ashwood-field-guide__copy">Recurring patterns are hidden in the field. Move through it and they clarify.</span>
    <button class="ashwood-field-guide__reveal" type="button">Reveal the pattern →</button>
  `;
  field.prepend(guide);

  const countEl = guide.querySelector('.ashwood-field-guide__count');
  const copyEl = guide.querySelector('.ashwood-field-guide__copy');
  const reveal = guide.querySelector('.ashwood-field-guide__reveal');

  const update = () => {
    const count = hotspots.filter((hotspot) => hotspot.classList.contains('is-discovered')).length;
    countEl.textContent = `${count} / ${hotspots.length} SIGNALS`;

    if (count === 0) {
      copyEl.textContent = 'Recurring patterns are hidden in the field. Move through it and they clarify.';
    } else if (count === 1) {
      copyEl.textContent = 'One signal found. The others are nearby.';
    } else if (count < 4) {
      copyEl.textContent = 'The signals are connected. Keep exploring or reveal the pattern.';
    } else if (count < hotspots.length) {
      copyEl.textContent = 'The pattern is already visible. Finish the field only if you want to.';
    } else {
      copyEl.textContent = 'The pattern is resolved.';
    }
  };

  reveal.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('ashwood:open-capability-map', {
      detail: { entrance: true, trigger: reveal }
    }));
  });

  hotspots.forEach((hotspot) => {
    new MutationObserver(update).observe(hotspot, {
      attributes:true,
      attributeFilter:['class']
    });
  });

  update();
})();
