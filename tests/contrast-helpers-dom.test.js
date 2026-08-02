'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');

const { createContrastHelpers } = require('../src/core/contrast-helpers.js');

// DOM-facing functions (computeEffectiveForeground/Background,
// getComputabilityBlocker, getTextScan, isInactiveUiComponent) need a real
// document -- pure-function tests live in tests/contrast-helpers.test.js,
// caching-behavior tests in tests/cache-tests/contrast-helpers-cache.test.js.
// This file exercises the real branches neither of those cover.
function makeHelpers(html) {
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
    pretendToBeVisual: true
  });
  const { window } = dom;
  const { document } = window;

  const shared = {
    __contrastSharedCache: {},
    trim: (v) => (v == null ? '' : String(v)).trim(),
    computedStyle: (el) => {
      try {
        return window.getComputedStyle(el);
      } catch {
        return {};
      }
    },
    composedParent: (n) => (n ? n.parentNode || (n.assignedSlot ? n.assignedSlot : null) : null),
    buildSimpleSelector: (el) => {
      if (!el || el.nodeType !== 1) return '';
      if (el.id) return `#${el.id}`;
      return el.tagName ? el.tagName.toLowerCase() : '';
    }
  };

  const helpers = createContrastHelpers({ window, document }, shared);
  return { dom, window, document, helpers };
}

// -------- computeEffectiveForeground --------

test('computeEffectiveForeground: resolves color and multiplies by ancestor opacity product', () => {
  const { document, helpers } = makeHelpers(
    '<div id="a" style="opacity:0.5"><span id="b" style="color:rgb(0,0,0)">t</span></div>'
  );
  const b = document.getElementById('b');
  const out = helpers.computeEffectiveForeground(b);
  assert.ok(out.rgba);
  assert.strictEqual(out.rgba.r, 0);
  assert.ok(Math.abs(out.alpha - 0.5) < 1e-9);
  assert.ok(Math.abs(out.opacityProduct - 0.5) < 1e-9);
});

test('computeEffectiveForeground: unparseable color yields null rgba, alpha 0', () => {
  const { document, window, helpers } = makeHelpers('<span id="b">t</span>');
  const b = document.getElementById('b');
  // jsdom always resolves `color` to some rgb() string via getComputedStyle,
  // so force an unparseable value directly to exercise the !c branch.
  Object.defineProperty(window, 'getComputedStyle', {
    value: (el) => (el === b ? { color: 'not-a-color' } : {}),
    configurable: true
  });
  const out = helpers.computeEffectiveForeground(b);
  assert.strictEqual(out.rgba, null);
  assert.strictEqual(out.alpha, 0);
});

test('computeEffectiveForeground: repeat calls for the same element hit the cache (same reference)', () => {
  const { document, helpers } = makeHelpers('<span id="b" style="color:red">t</span>');
  const b = document.getElementById('b');
  const out1 = helpers.computeEffectiveForeground(b);
  const out2 = helpers.computeEffectiveForeground(b);
  assert.strictEqual(out1, out2);
});

// -------- computeEffectiveBackground --------

test('computeEffectiveBackground: an opaque ancestor background resolves ok:true with no assumptions', () => {
  const { document, helpers } = makeHelpers(
    '<div id="a" style="background-color:rgb(255,255,255)"><span id="b">t</span></div>'
  );
  const b = document.getElementById('b');
  const out = helpers.computeEffectiveBackground(b, {});
  assert.strictEqual(out.ok, true);
  assert.strictEqual(out.reasonCode, null);
  assert.strictEqual(out.alpha, 1);
  assert.deepStrictEqual(out.rgba, { r: 255, g: 255, b: 255, a: 1 });
});

test('computeEffectiveBackground: strictConformance mode reports BACKGROUND_NOT_OPAQUE_AT_ROOT when no ancestor is opaque', () => {
  const { document, helpers } = makeHelpers('<span id="b">t</span>');
  const b = document.getElementById('b');
  const out = helpers.computeEffectiveBackground(b, { contrast: { mode: 'strictConformance' } });
  assert.strictEqual(out.ok, false);
  assert.strictEqual(out.reasonCode, 'BACKGROUND_NOT_OPAQUE_AT_ROOT');
  assert.ok(out.alpha < 1);
});

test('computeEffectiveBackground: auditorAssist mode applies the root canvas fallback and reports ok:true with assumptionsApplied', () => {
  const { document, helpers } = makeHelpers('<span id="b">t</span>');
  const b = document.getElementById('b');
  const out = helpers.computeEffectiveBackground(b, {
    contrast: { mode: 'auditorAssist', rootCanvasFallback: '#123456' }
  });
  assert.strictEqual(out.ok, true);
  assert.strictEqual(out.alpha, 1);
  assert.deepStrictEqual(out.assumptionsApplied, ['ROOT_CANVAS_FALLBACK']);
  assert.strictEqual(out.assumedRootCanvasColor, '#123456');
  assert.deepStrictEqual(out.rgba, { r: 0x12, g: 0x34, b: 0x56, a: 1 });
});

test('computeEffectiveBackground: collectStack:true returns a per-ancestor layer stack and is not cached', () => {
  const { document, helpers } = makeHelpers(
    '<div id="a" style="background-color:rgba(0,0,0,0.5)"><span id="b">t</span></div>'
  );
  const b = document.getElementById('b');
  const out = helpers.computeEffectiveBackground(b, { collectStack: true });
  assert.ok(Array.isArray(out.stack));
  // The walk starts at el itself, and every ancestor with a *parseable*
  // background-color is pushed -- including el's own default (fully
  // transparent) computed background-color -- so #a is not necessarily
  // stack[0]; assert it's present with the right layer instead of assuming
  // an index.
  const aLayer = out.stack.find((s) => s.selector === '#a');
  assert.ok(aLayer, 'expected a stack entry for #a');
  assert.deepStrictEqual(aLayer.bg, { r: 0, g: 0, b: 0, a: 0.5 });
});

// -------- getComputabilityBlocker --------

test('getComputabilityBlocker: ok:true (no blocker) for a plain opaque-background element', () => {
  const { document, helpers } = makeHelpers(
    '<div id="a" style="background-color:white"><span id="b">t</span></div>'
  );
  const b = document.getElementById('b');
  const out = helpers.getComputabilityBlocker(b);
  assert.strictEqual(out.ok, true);
  assert.strictEqual(out.reasonCode, null);
});

test('getComputabilityBlocker: mix-blend-mode on an ancestor blocks computability', () => {
  const { document, helpers } = makeHelpers(
    '<div id="a" style="mix-blend-mode:multiply"><span id="b">t</span></div>'
  );
  const b = document.getElementById('b');
  const out = helpers.getComputabilityBlocker(b);
  assert.strictEqual(out.ok, false);
  assert.strictEqual(out.reasonCode, 'MIX_BLEND_MODE');
  assert.strictEqual(out.blockerSelector, '#a');
});

test('getComputabilityBlocker: filter on an ancestor blocks computability (reasonCode reflects filter vs backdrop-filter)', () => {
  const { document, helpers } = makeHelpers(
    '<div id="a" style="filter:blur(2px)"><span id="b">t</span></div>'
  );
  const b = document.getElementById('b');
  const out = helpers.getComputabilityBlocker(b);
  assert.strictEqual(out.ok, false);
  assert.strictEqual(out.reasonCode, 'BACKGROUND_FILTER_OR_BACKDROP_FILTER');
  assert.strictEqual(out.blockerProperty, 'filter');
});

test('getComputabilityBlocker: backdrop-filter on an ancestor reports blockerProperty backdrop-filter', () => {
  const { document, helpers } = makeHelpers(
    '<div id="a" style="backdrop-filter:blur(2px)"><span id="b">t</span></div>'
  );
  const b = document.getElementById('b');
  const out = helpers.getComputabilityBlocker(b);
  assert.strictEqual(out.ok, false);
  assert.strictEqual(out.reasonCode, 'BACKGROUND_FILTER_OR_BACKDROP_FILTER');
  assert.strictEqual(out.blockerProperty, 'backdrop-filter');
});

test('getComputabilityBlocker: a background-image/gradient on an ancestor blocks computability, classified by fill type', () => {
  const { document, helpers } = makeHelpers(
    '<div id="a" style="background-image:url(x.png)"><span id="b">t</span></div>'
  );
  const b = document.getElementById('b');
  const out = helpers.getComputabilityBlocker(b);
  assert.strictEqual(out.ok, false);
  assert.strictEqual(out.reasonCode, 'BACKGROUND_IMAGE_OR_GRADIENT');
  assert.strictEqual(out.backgroundFillType, 'image');
});

test('getComputabilityBlocker: fractional opacity on an ancestor (not el itself) blocks computability', () => {
  const { document, helpers } = makeHelpers(
    '<div id="a" style="opacity:0.6"><span id="b">t</span></div>'
  );
  const b = document.getElementById('b');
  const out = helpers.getComputabilityBlocker(b);
  assert.strictEqual(out.ok, false);
  assert.strictEqual(out.reasonCode, 'ANCESTOR_OPACITY');
  assert.strictEqual(out.blockerSelector, '#a');
});

test("getComputabilityBlocker: el's OWN fractional opacity is not a blocker (only ancestors are)", () => {
  const { document, helpers } = makeHelpers(
    '<span id="b" style="opacity:0.6;background-color:white">t</span>'
  );
  const b = document.getElementById('b');
  const out = helpers.getComputabilityBlocker(b);
  assert.strictEqual(out.ok, true);
});

test('getComputabilityBlocker: a closer opaque background-color paint-occludes a farther background-image (not a blocker)', () => {
  const { document, helpers } = makeHelpers(
    '<div id="outer" style="background-image:url(hero.jpg)">' +
      '<div id="a" style="background-color:white"><span id="b">t</span></div>' +
      '</div>'
  );
  const b = document.getElementById('b');
  const out = helpers.getComputabilityBlocker(b);
  assert.strictEqual(out.ok, true);
});

// -------- isInactiveUiComponent --------

test('isInactiveUiComponent: a disabled ancestor button marks nested text as inactive', () => {
  const { document, helpers } = makeHelpers(
    '<button id="btn" disabled><span id="b">t</span></button>'
  );
  const b = document.getElementById('b');
  assert.strictEqual(helpers.isInactiveUiComponent(b), true);
});

test('isInactiveUiComponent: aria-disabled="true" on an ancestor marks nested text as inactive', () => {
  const { document, helpers } = makeHelpers(
    '<div id="a" aria-disabled="true"><span id="b">t</span></div>'
  );
  const b = document.getElementById('b');
  assert.strictEqual(helpers.isInactiveUiComponent(b), true);
});

test('isInactiveUiComponent: an ordinary enabled element is not inactive', () => {
  const { document, helpers } = makeHelpers('<span id="b">t</span>');
  const b = document.getElementById('b');
  assert.strictEqual(helpers.isInactiveUiComponent(b), false);
});

// -------- getTextScan --------

function ctxFor(document, window, root) {
  return { document, window, root: root || document.body };
}

test('getTextScan: counts eligible text nodes and their owning elements', () => {
  const { document, window, helpers } = makeHelpers('<p id="p1">Hello world</p><p id="p2">   </p>');
  const scan = helpers.getTextScan(ctxFor(document, window), {}, {});
  assert.strictEqual(scan.eligibleTextCount, 1);
  assert.strictEqual(scan.elements.length, 1);
  assert.strictEqual(scan.elements[0].el.id, 'p1');
});

test('getTextScan: respects helpers.isDomVisibleEligible and helpers.isExcluded', () => {
  const { document, window, helpers } = makeHelpers(
    '<p id="p1">Visible</p><p id="p2">Excluded</p>'
  );
  const excludedEl = document.getElementById('p2');
  const scan = helpers.getTextScan(
    ctxFor(document, window),
    {
      isDomVisibleEligible: () => true,
      isExcluded: (el) => el === excludedEl
    },
    {}
  );
  assert.strictEqual(scan.eligibleTextCount, 1);
  assert.strictEqual(scan.elements[0].el.id, 'p1');
});

test('getTextScan: excludes text inside an inactive (disabled) UI component', () => {
  const { document, window, helpers } = makeHelpers(
    '<button disabled>Disabled label</button><p id="p1">Active</p>'
  );
  const scan = helpers.getTextScan(ctxFor(document, window), {}, {});
  assert.strictEqual(scan.eligibleTextCount, 1);
  assert.strictEqual(scan.elements[0].el.id, 'p1');
});

test('getTextScan: counts an <input type="submit"> value attribute as its own text (not reachable via SHOW_TEXT)', () => {
  const { document, window, helpers } = makeHelpers('<input type="submit" value="Get a quote">');
  const scan = helpers.getTextScan(ctxFor(document, window), {}, {});
  assert.strictEqual(scan.eligibleTextCount, 1);
  assert.strictEqual(scan.elements[0].el.tagName.toLowerCase(), 'input');
});

test('getTextScan: an <input type="button"> with an empty value contributes nothing', () => {
  const { document, window, helpers } = makeHelpers('<input type="button" value="">');
  const scan = helpers.getTextScan(ctxFor(document, window), {}, {});
  assert.strictEqual(scan.eligibleTextCount, 0);
});

test('getTextScan: results for a given visibilityMode are cached on the shared per-run cache', () => {
  const { document, window, helpers } = makeHelpers('<p id="p1">Hello</p>');
  const scan1 = helpers.getTextScan(ctxFor(document, window), {}, { visibilityMode: 'styleOnly' });
  const scan2 = helpers.getTextScan(ctxFor(document, window), {}, { visibilityMode: 'styleOnly' });
  assert.strictEqual(scan1, scan2);
});

test('getTextScan: visibilityMode can be resolved from ctx.engineOptions instead of the engineOptions argument', () => {
  const { document, window, helpers } = makeHelpers('<p id="p1">Hello</p>');
  const ctx = {
    document,
    window,
    root: document.body,
    engineOptions: { visibilityMode: 'styleAndGeometry' }
  };
  const scan = helpers.getTextScan(ctx, {}, {});
  assert.strictEqual(scan.visibilityMode, 'styleAndGeometry');
});

test('getTextScan: returns an empty scan when the document has no createTreeWalker', () => {
  const { document, window, helpers } = makeHelpers('<p id="p1">Hello</p>');
  const fakeDoc = { body: document.body };
  const scan = helpers.getTextScan({ document: fakeDoc, window, root: document.body }, {}, {});
  assert.strictEqual(scan.eligibleTextCount, 0);
  assert.deepStrictEqual(scan.elements, []);
});
