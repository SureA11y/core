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

// __contrastComputedStyle (internal) is only reachable with a non-element
// node through computeEffectiveForeground, which calls it with whatever `el`
// it's given with no nodeType guard of its own (every other call site skips
// non-element nodes before ever calling it). That lets us exercise its
// defensive try/catch (an "always no-throw" wrapper around shared.computedStyle)
// via a purpose-built shared.computedStyle mock rather than jsdom internals.
test('computeEffectiveForeground: __contrastComputedStyle recovers when computedStyle throws once but succeeds on retry (non-element node)', () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
  const { document } = dom.window;
  let calls = 0;
  const shared = {
    __contrastSharedCache: {},
    trim: (v) => (v == null ? '' : String(v)).trim(),
    computedStyle: () => {
      calls++;
      if (calls === 1) throw new Error('boom');
      return { color: 'rgb(1,2,3)' };
    },
    composedParent: (n) => (n ? n.parentNode || null : null),
    buildSimpleSelector: () => ''
  };
  const helpers = createContrastHelpers({ window: dom.window, document }, shared);
  const textNode = document.createTextNode('t'); // nodeType 3: not an element
  const out = helpers.computeEffectiveForeground(textNode);
  assert.strictEqual(calls, 2, 'expected the throwing call plus the recovery retry');
  assert.deepStrictEqual(out.rgba, { r: 1, g: 2, b: 3, a: 1 });
});

test('computeEffectiveForeground: __contrastComputedStyle degrades to {} when computedStyle always throws (non-element node)', () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
  const { document } = dom.window;
  const shared = {
    __contrastSharedCache: {},
    trim: (v) => (v == null ? '' : String(v)).trim(),
    computedStyle: () => {
      throw new Error('boom');
    },
    composedParent: (n) => (n ? n.parentNode || null : null),
    buildSimpleSelector: () => ''
  };
  const helpers = createContrastHelpers({ window: dom.window, document }, shared);
  const textNode = document.createTextNode('t');
  const out = helpers.computeEffectiveForeground(textNode);
  assert.strictEqual(out.rgba, null);
  assert.strictEqual(out.alpha, 0);
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

test('getComputabilityBlocker: a closer opaque background-color paint-occludes a farther backdrop-filter (not a blocker)', () => {
  const { document, helpers } = makeHelpers(
    '<div id="outer" style="backdrop-filter:blur(10px)">' +
      '<div id="a" style="background-color:white"><span id="b">t</span></div>' +
      '</div>'
  );
  const b = document.getElementById('b');
  const out = helpers.getComputabilityBlocker(b);
  assert.strictEqual(out.ok, true);
});

test('getComputabilityBlocker: a SEMI-TRANSPARENT intervening background does NOT occlude a farther backdrop-filter', () => {
  const { document, helpers } = makeHelpers(
    '<div id="outer" style="backdrop-filter:blur(10px)">' +
      '<div id="a" style="background-color:rgba(255,255,255,0.5)"><span id="b">t</span></div>' +
      '</div>'
  );
  const b = document.getElementById('b');
  const out = helpers.getComputabilityBlocker(b);
  assert.strictEqual(out.ok, false);
  assert.strictEqual(out.reasonCode, 'BACKGROUND_FILTER_OR_BACKDROP_FILTER');
  assert.strictEqual(out.blockerProperty, 'backdrop-filter');
});

test('getComputabilityBlocker: an opaque intervening layer does NOT occlude a farther plain `filter` (compositing-group operation, unlike backdrop-filter)', () => {
  const { document, helpers } = makeHelpers(
    '<div id="outer" style="filter:blur(10px)">' +
      '<div id="a" style="background-color:white"><span id="b">t</span></div>' +
      '</div>'
  );
  const b = document.getElementById('b');
  const out = helpers.getComputabilityBlocker(b);
  assert.strictEqual(out.ok, false);
  assert.strictEqual(out.reasonCode, 'BACKGROUND_FILTER_OR_BACKDROP_FILTER');
  assert.strictEqual(out.blockerProperty, 'filter');
});

test('getComputabilityBlocker: a very long blocker CSS value is truncated to maxLen with an ellipsis', () => {
  const longValue = 'blur(2px) '.repeat(20).trim(); // 199 chars, well over the 80-char default
  const { document, helpers } = makeHelpers(
    `<div id="a" style="filter:${longValue}"><span id="b">t</span></div>`
  );
  const b = document.getElementById('b');
  const out = helpers.getComputabilityBlocker(b);
  assert.strictEqual(out.ok, false);
  assert.strictEqual(out.reasonCode, 'BACKGROUND_FILTER_OR_BACKDROP_FILTER');
  assert.strictEqual(out.blockerValue.length, 80);
  assert.ok(out.blockerValue.endsWith('...'), `expected an ellipsis, got ${out.blockerValue}`);
});

test('getComputabilityBlocker: an unrecognized background-image function (not url()/gradient()/image-set()) classifies as backgroundFillType "unknown"', () => {
  const { document, window, helpers } = makeHelpers('<div id="a">t</div>');
  const a = document.getElementById('a');
  // Real browsers only ever hand computed style strings for background-image
  // (url()/gradient()/image-set()/none/other CSS <image> functions), so this
  // mocks getComputedStyle directly rather than relying on what jsdom's CSS
  // engine happens to accept for exotic functions like paint().
  const cs = {
    mixBlendMode: 'normal',
    filter: 'none',
    backdropFilter: 'none',
    opacity: '1',
    backgroundColor: 'rgba(0, 0, 0, 0)',
    backgroundImage: 'paint(myPainter)'
  };
  Object.defineProperty(window, 'getComputedStyle', {
    value: (el) => (el === a ? cs : {}),
    configurable: true
  });
  const out = helpers.getComputabilityBlocker(a);
  assert.strictEqual(out.ok, false);
  assert.strictEqual(out.reasonCode, 'BACKGROUND_IMAGE_OR_GRADIENT');
  assert.strictEqual(out.backgroundFillType, 'unknown');
});

test('getComputabilityBlocker: a backgroundImage value that throws when re-stringified degrades backgroundFillType to "unknown" (classifyBackgroundImageValue fail-safe)', () => {
  const { document, window, helpers } = makeHelpers('<div id="a">t</div>');
  const a = document.getElementById('a');
  // hasBackgroundImageOrGradient stringifies backgroundImage TWICE
  // (`String(v).trim() && String(v).trim().toLowerCase() !== 'none'`) and
  // truncateCssValue once more (all three must succeed so the
  // BACKGROUND_IMAGE_OR_GRADIENT branch is even reached and blockerValue
  // gets built); this poisons only the FOURTH stringification --
  // classifyBackgroundImageValue's own -- to isolate its internal catch.
  let stringifyCalls = 0;
  const poisoned = {
    toString() {
      stringifyCalls++;
      if (stringifyCalls <= 3) return 'url(evil.png)';
      throw new Error('poison');
    }
  };
  const cs = {
    mixBlendMode: 'normal',
    filter: 'none',
    backdropFilter: 'none',
    opacity: '1',
    backgroundColor: 'rgba(0, 0, 0, 0)',
    backgroundImage: poisoned
  };
  Object.defineProperty(window, 'getComputedStyle', {
    value: (el) => (el === a ? cs : {}),
    configurable: true
  });
  const out = helpers.getComputabilityBlocker(a);
  assert.strictEqual(out.ok, false);
  assert.strictEqual(out.reasonCode, 'BACKGROUND_IMAGE_OR_GRADIENT');
  assert.strictEqual(out.backgroundFillType, 'unknown');
  assert.strictEqual(stringifyCalls, 4);
});

test('getComputabilityBlocker: a buildSimpleSelector that throws degrades blockerSelector to "" instead of crashing', () => {
  const dom = new JSDOM(
    '<!doctype html><html><body>' +
      '<div id="a" style="mix-blend-mode:multiply"><span id="b">t</span></div>' +
      '</body></html>',
    { pretendToBeVisual: true }
  );
  const { window } = dom;
  const { document } = window;
  const shared = {
    __contrastSharedCache: {},
    trim: (v) => (v == null ? '' : String(v)).trim(),
    computedStyle: (el) => window.getComputedStyle(el),
    composedParent: (n) => (n ? n.parentNode || null : null),
    buildSimpleSelector: () => {
      throw new Error('boom');
    }
  };
  const helpers = createContrastHelpers({ window, document }, shared);
  const b = document.getElementById('b');
  const out = helpers.getComputabilityBlocker(b);
  assert.strictEqual(out.ok, false);
  assert.strictEqual(out.reasonCode, 'MIX_BLEND_MODE');
  assert.strictEqual(out.blockerSelector, '');
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

test('getTextScan: excludes text whose own element carries the "clipped" visibility hint (sr-only technique), even when isDomVisibleEligible says eligible', () => {
  const { document, window, helpers } = makeHelpers('<p id="p1">Visible</p><p id="p2">Clipped</p>');
  const p2 = document.getElementById('p2');
  const scan = helpers.getTextScan(
    ctxFor(document, window),
    {
      isDomVisibleEligible: () => true,
      getVisibilityHintsInfo: (el) => ({ hints: el === p2 ? ['clipped'] : [] })
    },
    {}
  );
  assert.strictEqual(scan.eligibleTextCount, 1);
  assert.strictEqual(scan.elements[0].el.id, 'p1');
});

test('getTextScan: excludes text whose ANCESTOR (not the text\'s own element) carries the "clipped" hint', () => {
  const { document, window, helpers } = makeHelpers(
    '<span id="wrapper"><strong id="p1">Warning:</strong> details</span>'
  );
  const wrapper = document.getElementById('wrapper');
  const scan = helpers.getTextScan(
    ctxFor(document, window),
    {
      isDomVisibleEligible: () => true,
      getVisibilityHintsInfo: (el) => ({ hints: el === wrapper ? ['clipped'] : [] })
    },
    {}
  );
  assert.strictEqual(scan.eligibleTextCount, 0);
});

test('getTextScan: text assigned straight to a shadow root is attributed to the host element', () => {
  const { document, window, helpers } = makeHelpers('<p id="host"></p>');
  const host = document.getElementById('host');
  host.attachShadow({ mode: 'open' }).textContent = 'Some text in English';

  const scan = helpers.getTextScan(ctxFor(document, window), {}, {});
  assert.strictEqual(scan.eligibleTextCount, 1);
  assert.strictEqual(scan.elements.length, 1);
  assert.strictEqual(scan.elements[0].el, host);
});

test('getTextScan: a getVisibilityHintsInfo that throws is not treated as clipped (falls back to isDomVisibleEligible)', () => {
  const { document, window, helpers } = makeHelpers('<p id="p1">Hello</p>');
  const scan = helpers.getTextScan(
    ctxFor(document, window),
    {
      isDomVisibleEligible: () => true,
      getVisibilityHintsInfo: () => {
        throw new Error('boom');
      }
    },
    {}
  );
  assert.strictEqual(scan.eligibleTextCount, 1);
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

// -------- getTextScan: visibilityMode resolution via nested candidate shapes --------
//
// __resolveVisibilityMode walks a long list of candidate objects (ctx,
// ctx.options, ctx.policy, ctx.policyOverrides, the same under opts, plus
// window/document globals) checking both `candidate.visibilityMode` directly
// AND `candidate.engineOptions.visibilityMode` / `.options.engineOptions...`
// / `.policy.engineOptions...` / `.policyOverrides.engineOptions...`. Every
// ctx-rooted variant of the nested checks is shadowed by an earlier, simpler
// candidate that already resolves the identical value directly -- so the
// only way to exercise the nested checks themselves is a shape with no
// simpler earlier candidate covering it. The raw 3rd argument to getTextScan
// (`engineOptions`) is the very first candidate checked, with nothing above
// it, so nesting it multiple levels deep hits each nested check for real.
test('getTextScan: visibilityMode resolved via a nested {engineOptions:{visibilityMode}} shape on the raw engineOptions argument', () => {
  const { document, window, helpers } = makeHelpers('<p id="p1">Hello</p>');
  const scan = helpers.getTextScan(
    ctxFor(document, window),
    {},
    {
      engineOptions: { visibilityMode: 'styleAndGeometry' }
    }
  );
  assert.strictEqual(scan.visibilityMode, 'styleAndGeometry');
});

test('getTextScan: visibilityMode resolved via a nested {options:{engineOptions:{visibilityMode}}} shape', () => {
  const { document, window, helpers } = makeHelpers('<p id="p1">Hello</p>');
  const scan = helpers.getTextScan(
    ctxFor(document, window),
    {},
    {
      options: { engineOptions: { visibilityMode: 'styleAndGeometry' } }
    }
  );
  assert.strictEqual(scan.visibilityMode, 'styleAndGeometry');
});

test('getTextScan: visibilityMode resolved via a nested {policy:{engineOptions:{visibilityMode}}} shape', () => {
  const { document, window, helpers } = makeHelpers('<p id="p1">Hello</p>');
  const scan = helpers.getTextScan(
    ctxFor(document, window),
    {},
    {
      policy: { engineOptions: { visibilityMode: 'styleAndGeometry' } }
    }
  );
  assert.strictEqual(scan.visibilityMode, 'styleAndGeometry');
});

test('getTextScan: visibilityMode resolved via a nested {policyOverrides:{engineOptions:{visibilityMode}}} shape', () => {
  const { document, window, helpers } = makeHelpers('<p id="p1">Hello</p>');
  const scan = helpers.getTextScan(
    ctxFor(document, window),
    {},
    {
      policyOverrides: { engineOptions: { visibilityMode: 'styleAndGeometry' } }
    }
  );
  assert.strictEqual(scan.visibilityMode, 'styleAndGeometry');
});

test('getTextScan: isDomVisibleEligible returning a non-boolean, non-{eligible} value is coerced via plain truthiness', () => {
  const { document, window, helpers } = makeHelpers('<p id="p1">Yes</p><p id="p2">No</p>');
  const p1 = document.getElementById('p1');
  const scan = helpers.getTextScan(
    ctxFor(document, window),
    // Neither a boolean nor an {eligible} object -- falls through to `!!v`.
    { isDomVisibleEligible: (el) => (el === p1 ? 1 : 0) },
    {}
  );
  assert.strictEqual(scan.eligibleTextCount, 1);
  assert.strictEqual(scan.elements[0].el.id, 'p1');
});

test('getTextScan: an isDomVisibleEligible that throws fails closed (treated as ineligible) rather than crashing the scan', () => {
  const { document, window, helpers } = makeHelpers('<p id="p1">Hello</p>');
  const scan = helpers.getTextScan(
    ctxFor(document, window),
    {
      isDomVisibleEligible: () => {
        throw new Error('boom');
      }
    },
    {}
  );
  assert.strictEqual(scan.eligibleTextCount, 0);
});

test('getTextScan: isInactiveUiComponent throwing (e.g. a poisoned parentElement) is treated as active rather than crashing the scan', () => {
  const { document, window, helpers } = makeHelpers('<p id="p1">Hello</p>');
  const p1 = document.getElementById('p1');
  Object.defineProperty(p1, 'parentElement', {
    get() {
      throw new Error('boom');
    },
    configurable: true
  });
  const scan = helpers.getTextScan(ctxFor(document, window), {}, {});
  assert.strictEqual(scan.eligibleTextCount, 1);
});

test('getTextScan: a malformed root in ctx.root (not a Node) is skipped gracefully; other roots in the array still scan', () => {
  const { document, window, helpers } = makeHelpers('<p id="p1">Hello</p>');
  const badRoot = {}; // not a Node -- both createTreeWalker(badRoot) and badRoot.querySelectorAll throw
  const scan = helpers.getTextScan(ctxFor(document, window, [document.body, badRoot]), {}, {});
  assert.strictEqual(scan.eligibleTextCount, 1);
  assert.strictEqual(scan.elements[0].el.id, 'p1');
});

test('getTextScan: an element with multiple text-node children (split by a comment) increments textCount instead of double-counting the element', () => {
  const { document, window, helpers } = makeHelpers('<p id="p1">Hello<!--split-->World</p>');
  const scan = helpers.getTextScan(ctxFor(document, window), {}, {});
  assert.strictEqual(scan.eligibleTextCount, 2);
  assert.strictEqual(scan.elements.length, 1);
  assert.strictEqual(scan.elements[0].el.id, 'p1');
  assert.strictEqual(scan.elements[0].textCount, 2);
});

test('getTextScan: an input[type=submit] with both a value attribute and a (non-standard) text-node child counts both without duplicating the element entry', () => {
  const { document, window, helpers } = makeHelpers('');
  const input = document.createElement('input');
  input.type = 'submit';
  input.setAttribute('value', 'Go');
  // Void elements can't get text-node children from HTML *parsing*, but
  // nothing stops direct DOM manipulation from adding one -- confirmed this
  // does not throw in jsdom. That makes the same <input> reachable from
  // BOTH getTextScan loops (the SHOW_TEXT walk and the value-attribute
  // scan), which is the only way elToCount's "already counted" branch is
  // reachable for this second loop.
  input.appendChild(document.createTextNode('extra'));
  document.body.appendChild(input);
  const scan = helpers.getTextScan(ctxFor(document, window), {}, {});
  assert.strictEqual(scan.elements.length, 1);
  assert.strictEqual(scan.elements[0].el, input);
  assert.strictEqual(scan.elements[0].textCount, 2);
  assert.strictEqual(scan.eligibleTextCount, 2);
});

test('getTextScan: an exception thrown while resolving ctx.root degrades to an empty scan instead of throwing', () => {
  const { document, window, helpers } = makeHelpers('<p id="p1">Hello</p>');
  const poisonedRoot = {
    get nodeType() {
      throw new Error('boom');
    }
  };
  const scan = helpers.getTextScan({ document, window, root: poisonedRoot }, {}, {});
  assert.deepStrictEqual(scan, { eligibleTextCount: 0, elements: [], visibilityMode: 'styleOnly' });
});
