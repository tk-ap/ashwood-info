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

      body.ashwood-home-native .ashwood-field-guide__actions {
        display:flex;
        align-items:center;
        gap:14px;
        pointer-events:auto;
        white-space:nowrap;
      }

      body.ashwood-home-native .ashwood-field-guide__reveal,
      body.ashwood-home-native .ashwood-field-guide__bird {
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
        opacity:.72;
        transition:color .25s ease,opacity .25s ease,letter-spacing .25s ease;
      }

      body.ashwood-home-native .ashwood-field-guide__bird { color:#009b3a; }

      body.ashwood-home-native .ashwood-field-guide__reveal:hover,
      body.ashwood-home-native .ashwood-field-guide__reveal:focus-visible,
      body.ashwood-home-native .ashwood-field-guide__bird:hover,
      body.ashwood-home-native .ashwood-field-guide__bird:focus-visible {
        color:var(--ashwood-gold);
        opacity:1;
        letter-spacing:.17em;
      }

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
      body.ashwood-home-native .ashwood-field-guide{
        position:relative;
        z-index:245;
        display:grid;
        grid-template-columns:1fr auto;
        gap:8px 12px;
        width:100%;
        margin:0 0 14px;
        padding:0 0 10px;
        border-bottom:1px solid color-mix(in srgb,var(--ashwood-rule) 54%,transparent);
        pointer-events:auto;
      }
      .ashwood-field-guide__count{grid-column:1;color:#009b3a;font-size:8px;letter-spacing:.14em;text-transform:uppercase}
      .ashwood-field-guide__copy{grid-column:1 / -1;color:var(--ashwood-muted);font-family:Georgia,serif;font-size:10px;line-height:1.4;font-style:italic}
      .ashwood-field-guide__actions{grid-column:1 / -1;display:flex;gap:16px;align-items:center;flex-wrap:wrap}
      .ashwood-field-guide__reveal,.ashwood-field-guide__bird{border:0;padding:8px 0;background:none;font-family:inherit;font-size:8px;letter-spacing:.13em;text-transform:uppercase;cursor:pointer}
      .ashwood-field-guide__bird{color:#009b3a}
      .ashwood-field-guide__reveal{color:var(--ashwood-ink)}
      body.has-viewed-capability-map .ashwood-field-guide,
      body.has-found-all-hotspots .ashwood-field-guide{display:none!important}
    }

    @media (prefers-reduced-motion:reduce) {
      .ashwood-field-guide__reveal,.ashwood-field-guide__bird { transition:none !important; }
    }
  `;
  document.head.appendChild(style);

  const guide = document.createElement('div');
  guide.className = 'ashwood-field-guide';
  guide.setAttribute('aria-live', 'polite');
  guide.innerHTML = `
    <span class="ashwood-field-guide__count">0 / 6 SIGNALS</span>
    <span class="ashwood-field-guide__copy">Recurring patterns are hidden in the field. Explore them, or ask the Doctor Bird for the throughline.</span>
    <span class="ashwood-field-guide__actions">
      <button class="ashwood-field-guide__bird" type="button" data-ashwood-bird-guide>Follow the bird →</button>
      <button class="ashwood-field-guide__reveal" type="button">Reveal the pattern →</button>
    </span>
  `;
  field.prepend(guide);

  const countEl = guide.querySelector('.ashwood-field-guide__count');
  const copyEl = guide.querySelector('.ashwood-field-guide__copy');
  const reveal = guide.querySelector('.ashwood-field-guide__reveal');
  const birdGuide = guide.querySelector('.ashwood-field-guide__bird');

  const update = () => {
    const count = hotspots.filter((hotspot) => hotspot.classList.contains('is-discovered')).length;
    countEl.textContent = `${count} / ${hotspots.length} SIGNALS`;

    if (count === 0) {
      copyEl.textContent = 'Recurring patterns are hidden in the field. Explore them, or ask the Doctor Bird for the throughline.';
    } else if (count === 1) {
      copyEl.textContent = 'One signal found. The others are nearby; the Doctor Bird can also walk you through the larger pattern.';
    } else if (count < 4) {
      copyEl.textContent = 'The signals are connected. Keep exploring, reveal the pattern, or follow the bird.';
    } else if (count < hotspots.length) {
      copyEl.textContent = 'The pattern is already visible. Finishing the field is optional.';
    } else {
      copyEl.textContent = 'The pattern is resolved.';
    }
  };

  reveal.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('ashwood:open-capability-map', {
      detail: { entrance: true, trigger: reveal }
    }));
  });

  birdGuide.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('ashwood:start-bird-guide', {
      detail: { trigger: birdGuide }
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
