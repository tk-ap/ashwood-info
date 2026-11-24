import { universeEntries, universeGroups } from './content.mjs';

const root = document.querySelector('[data-universe]');

if (root) {
  const controls = root.querySelector('[data-universe-controls]');
  const stage = root.querySelector('[data-universe-stage]');
  const index = root.querySelector('[data-universe-index]');
  const inspector = root.querySelector('[data-universe-inspector]');
  const count = root.querySelector('[data-universe-count]');
  const viewport = root.querySelector('[data-universe-viewport]');
  const resetFieldButton = root.querySelector('[data-universe-reset]');
  const fieldStatus = root.querySelector('[data-universe-view-status]');
  const byId = new Map(universeEntries.map(entry => [entry.id, entry]));
  let activeGroup = 'all';
  let activeId = 'modeling';
  let fieldView = { x: 0, y: 0, scale: 1 };
  let dragState = null;

  const visibleEntries = () => universeEntries.filter(entry => activeGroup === 'all' || entry.group === activeGroup);
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };

  const canNavigateField = () => Boolean(
    viewport &&
    window.matchMedia('(min-width: 721px) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches
  );

  const clamp = (value, limit) => Math.min(limit, Math.max(-limit, value));

  const normalizeFieldView = () => {
    if (!viewport) return;
    fieldView.scale = Math.min(1.65, Math.max(1, fieldView.scale));
    const bounds = viewport.getBoundingClientRect();
    fieldView.x = clamp(fieldView.x, bounds.width * (fieldView.scale - 1) * .46);
    fieldView.y = clamp(fieldView.y, bounds.height * (fieldView.scale - 1) * .46);
  };

  const updateFieldView = ({ announce = false } = {}) => {
    if (!stage) return;
    if (!canNavigateField()) {
      stage.style.removeProperty('transform');
      return;
    }
    normalizeFieldView();
    stage.style.transform = `translate(${fieldView.x}px, ${fieldView.y}px) scale(${fieldView.scale})`;
    if (resetFieldButton) resetFieldButton.disabled = fieldView.scale === 1 && fieldView.x === 0 && fieldView.y === 0;
    if (fieldStatus && announce) fieldStatus.textContent = `Field view · ${Math.round(fieldView.scale * 100)}%`;
  };

  const resetField = ({ announce = false } = {}) => {
    fieldView = { x: 0, y: 0, scale: 1 };
    updateFieldView({ announce });
  };

  const travelTo = (entry) => {
    if (!canNavigateField() || !viewport) return;
    const bounds = viewport.getBoundingClientRect();
    fieldView.scale = Math.max(fieldView.scale, 1.14);
    fieldView.x = -((entry.x / 100) - .5) * bounds.width * fieldView.scale;
    fieldView.y = -((entry.y / 100) - .5) * bounds.height * fieldView.scale;
    updateFieldView({ announce: true });
  };

  const inspect = (id, { focus = false, travel = false } = {}) => {
    const entry = byId.get(id);
    if (!entry) return;
    activeId = id;
    inspector.replaceChildren();
    inspector.append(
      make('p', 'universe-inspector__eyebrow', `${entry.label} · ${entry.status}`),
      make('h2', 'universe-inspector__title', entry.title),
      make('p', 'universe-inspector__summary', entry.summary)
    );
    if (entry.href) {
      const link = make('a', 'universe-inspector__link', 'Open this thread ↗');
      link.href = entry.href;
      inspector.append(link);
    } else {
      inspector.append(make('p', 'universe-inspector__held', 'This thread is intentionally not public yet.'));
    }
    if (entry.previewHref) {
      const preview = make('section', 'universe-preview');
      preview.setAttribute('aria-label', `${entry.title} preview`);
      preview.append(
        make('p', 'universe-preview__eyebrow', 'Live Vercel preview · read-only'),
        make('p', 'universe-preview__title', entry.previewLabel || `${entry.title} preview`)
      );
      const frame = document.createElement('iframe');
      frame.className = 'universe-preview__frame';
      frame.src = entry.previewHref;
      frame.title = `${entry.title} preview render`;
      frame.loading = 'lazy';
      frame.tabIndex = -1;
      frame.setAttribute('aria-hidden', 'true');
      frame.setAttribute('sandbox', 'allow-scripts');
      frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      preview.append(frame);
      preview.append(make('p', 'universe-preview__notice', 'The render is intentionally non-interactive here. Open the preview in a new tab to test the listening-room flow.'));
      const previewLink = make('a', 'universe-preview__link', 'Open live music preview ↗');
      previewLink.href = entry.previewHref;
      previewLink.target = '_blank';
      previewLink.rel = 'noopener noreferrer';
      preview.append(previewLink);
      inspector.append(preview);
    }
    [...stage.querySelectorAll('[data-entry]')].forEach(node => {
      const candidate = byId.get(node.dataset.entry);
      const related = candidate?.related?.includes(id) || entry.related.includes(candidate?.id);
      node.classList.toggle('is-active', node.dataset.entry === id);
      node.classList.toggle('is-related', Boolean(related));
      node.setAttribute('aria-pressed', String(node.dataset.entry === id));
    });
    [...stage.querySelectorAll('[data-connection]')].forEach(line => {
      const [from, to] = line.dataset.connection.split(':');
      line.classList.toggle('is-active', from === id || to === id);
    });
    if (travel) travelTo(entry);
    if (focus) inspector.focus({ preventScroll: true });
  };

  const renderControls = () => {
    controls.replaceChildren();
    universeGroups.forEach(group => {
      const button = make('button', 'universe-filter', group.label);
      button.type = 'button';
      button.dataset.group = group.id;
      button.setAttribute('aria-pressed', String(group.id === activeGroup));
      button.title = group.note;
      button.addEventListener('click', () => {
        activeGroup = group.id;
        const next = visibleEntries()[0];
        if (next) activeId = next.id;
        render();
      });
      controls.append(button);
    });
  };

  const renderMap = () => {
    stage.replaceChildren();
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('universe-constellation__threads');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    const visible = new Set(visibleEntries().map(entry => entry.id));
    universeEntries.forEach(entry => {
      entry.related.forEach(relatedId => {
        if (entry.id > relatedId || !visible.has(entry.id) || !visible.has(relatedId)) return;
        const related = byId.get(relatedId);
        if (!related) return;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', entry.x);
        line.setAttribute('y1', entry.y);
        line.setAttribute('x2', related.x);
        line.setAttribute('y2', related.y);
        line.dataset.connection = `${entry.id}:${related.id}`;
        svg.append(line);
      });
    });
    stage.append(svg);
    visibleEntries().forEach(entry => {
      const button = make('button', `universe-node universe-node--${entry.kind}`);
      button.type = 'button';
      button.dataset.entry = entry.id;
      button.style.setProperty('--node-x', `${entry.x}%`);
      button.style.setProperty('--node-y', `${entry.y}%`);
      button.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-label', `${entry.title}. ${entry.summary}`);
      button.append(
        make('span', 'universe-node__dot'),
        make('span', 'universe-node__label', entry.label),
        make('strong', 'universe-node__title', entry.title)
      );
      button.addEventListener('click', () => inspect(entry.id, { focus: true, travel: true }));
      button.addEventListener('focus', () => inspect(entry.id));
      button.addEventListener('mouseenter', () => inspect(entry.id));
      stage.append(button);
    });
  };

  const renderIndex = () => {
    index.replaceChildren();
    visibleEntries().forEach(entry => {
      const card = entry.href ? document.createElement('a') : document.createElement('article');
      card.className = 'universe-index-card';
      if (entry.href) card.href = entry.href;
      card.append(
        make('p', 'universe-index-card__meta', `${entry.label} · ${entry.status}`),
        make('h3', 'universe-index-card__title', entry.title),
        make('p', 'universe-index-card__summary', entry.summary)
      );
      card.append(make('span', 'universe-index-card__action', entry.href ? 'Follow thread ↗' : 'Held for review'));
      card.addEventListener('mouseenter', () => inspect(entry.id));
      card.addEventListener('focus', () => inspect(entry.id));
      index.append(card);
    });
  };

  const render = () => {
    const entries = visibleEntries();
    const publicCount = entries.filter(entry => entry.href).length;
    const heldCount = entries.length - publicCount;
    renderControls();
    renderMap();
    renderIndex();
    count.textContent = heldCount
      ? `${publicCount} public ${publicCount === 1 ? 'thread' : 'threads'} · ${heldCount} held for review`
      : `${publicCount} public ${publicCount === 1 ? 'thread' : 'threads'}`;
    inspect(activeId);
    updateFieldView();
  };

  if (viewport) {
    viewport.addEventListener('pointerdown', event => {
      if (!canNavigateField() || event.pointerType !== 'mouse' || event.target.closest('[data-entry]')) return;
      dragState = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: fieldView.x, originY: fieldView.y };
      viewport.setPointerCapture(event.pointerId);
      viewport.classList.add('is-dragging');
    });
    viewport.addEventListener('pointermove', event => {
      if (!dragState || event.pointerId !== dragState.pointerId) return;
      fieldView.x = dragState.originX + event.clientX - dragState.startX;
      fieldView.y = dragState.originY + event.clientY - dragState.startY;
      updateFieldView();
    });
    const finishDrag = event => {
      if (!dragState || event.pointerId !== dragState.pointerId) return;
      dragState = null;
      viewport.classList.remove('is-dragging');
      updateFieldView({ announce: true });
    };
    viewport.addEventListener('pointerup', finishDrag);
    viewport.addEventListener('pointercancel', finishDrag);
    viewport.addEventListener('wheel', event => {
      if (!canNavigateField()) return;
      event.preventDefault();
      fieldView.scale += event.deltaY < 0 ? .08 : -.08;
      updateFieldView({ announce: true });
    }, { passive: false });
    window.addEventListener('resize', () => updateFieldView());
  }
  resetFieldButton?.addEventListener('click', () => resetField({ announce: true }));

  render();
}
