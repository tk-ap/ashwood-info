import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../portfolio-lightbox.js', import.meta.url), 'utf8');

function viewer() {
  const classes = () => {
    const values = new Set();
    return { add: value => values.add(value), remove: value => values.delete(value), contains: value => values.has(value) };
  };
  const element = (props = {}) => ({
    ...props, style: {}, handlers: {}, classList: classes(),
    setAttribute() {}, focus() {},
    addEventListener(name, callback) { this.handlers[name] = callback; },
  });
  const images = [
    element({ src: '/delivery.webp', currentSrc: '/delivery-720.webp', alt: 'New campaign', dataset: { fullSrc: '/original.webp' } }),
    element({ src: '/legacy.jpg', currentSrc: '/legacy.jpg', alt: 'Existing campaign', dataset: {} }),
  ];
  const preview = element();
  const controls = { img: preview };
  for (const name of ['.portfolio-lightbox__caption', '.portfolio-lightbox__counter', '.portfolio-lightbox__close', '.portfolio-lightbox__nav--prev', '.portfolio-lightbox__nav--next']) controls[name] = element();
  const overlay = element();
  overlay.querySelector = selector => controls[selector];
  const handlers = {};
  const requested = [];
  const document = {
    body: { classList: classes(), append() {} },
    contains: () => true,
    addEventListener: (name, callback) => { handlers[name] = callback; },
    querySelectorAll: () => images,
    createElement: () => overlay,
  };
  class ImageRequest { constructor() { requested.push(this); } }
  vm.runInNewContext(source, { document, Image: ImageRequest });
  handlers.DOMContentLoaded();
  return { images, preview, controls, requested, open: () => images[0].handlers.click(), next: () => controls['.portfolio-lightbox__nav--next'].handlers.click(), close: () => controls['.portfolio-lightbox__close'].handlers.click() };
}

test('viewer displays the already-loaded web image before the original is available', () => {
  const v = viewer();
  v.open();
  assert.equal(v.preview.src, '/delivery-720.webp');
  const original = v.requested.find(request => request.onload);
  assert.equal(original.src, '/original.webp');
  original.onload();
  assert.equal(v.preview.src, '/original.webp');
});

test('an unavailable original leaves a usable image in the viewer', () => {
  const v = viewer();
  v.open();
  // A network failure does not fire load; the web image must remain displayed.
  assert.equal(v.preview.src, '/delivery-720.webp');
  v.close();
  assert.equal(v.preview.src, '/delivery-720.webp');
});

test('a late original cannot overwrite a different campaign image', () => {
  const v = viewer();
  v.open();
  const original = v.requested.find(request => request.onload);
  v.next();
  original.onload();
  assert.equal(v.preview.src, '/legacy.jpg');
  assert.equal(v.preview.alt, 'Existing campaign');
});

test('closing the viewer prevents a pending original from replacing its image', () => {
  const v = viewer();
  v.open();
  const original = v.requested.find(request => request.onload);
  v.close();
  original.onload();
  assert.equal(v.preview.src, '/delivery-720.webp');
});
