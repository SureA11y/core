'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');

const { createContrastHelpers } = require('../../src/core/contrast-helpers.js');

function makeShared(window) {
  let computedStyleCalls = 0;
  let buildSelectorCalls = 0;

  const shared = {
    __contrastSharedCache: {},

    trim: (v) => (v == null ? '' : String(v)).trim(),

    computedStyle: (el) => {
      computedStyleCalls++;
      try {
        return window.getComputedStyle(el);
      } catch {
        return {};
      }
    },

    composedParent: (n) => {
      if (!n) return null;
      // Minimal composed-parent semantics (sufficient for these checks)
      return n.parentNode || (n.assignedSlot ? n.assignedSlot : null);
    },

    buildSimpleSelector: (el) => {
      buildSelectorCalls++;
      if (!el || el.nodeType !== 1) return '';
      if (el.id) return `#${el.id}`;
      return el.tagName ? el.tagName.toLowerCase() : '';
    }
  };

  return {
    shared,
    getCounts: () => ({ computedStyleCalls, buildSelectorCalls })
  };
}

test('contrast cache: computeOpacityProduct memoizes per element per run', () => {
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <div id="a" style="opacity: 0.8">
        <span id="b" style="opacity: 0.9">x</span>
      </div>
    </body></html>`,
    { pretendToBeVisual: true }
  );

  const { window } = dom;
  const { document } = window;

  const { shared, getCounts } = makeShared(window);
  const helpers = createContrastHelpers({ window }, shared);

  const b = document.getElementById('b');

  const before1 = getCounts().computedStyleCalls;
  const o1 = helpers.computeOpacityProduct(b);
  const after1 = getCounts().computedStyleCalls;

  assert.ok(after1 > before1, 'first call should compute at least once');

  const before2 = getCounts().computedStyleCalls;
  const o2 = helpers.computeOpacityProduct(b);
  const after2 = getCounts().computedStyleCalls;

  assert.equal(o1, o2, 'opacity product should be stable');
  assert.equal(after2, before2, 'second call should hit cache (no additional computedStyle calls)');
});

test('contrast cache: parseCssColorToRgba caches repeat calls for identical input', () => {
  const dom = new JSDOM(`<!doctype html><html><body></body></html>`, {
    pretendToBeVisual: true
  });
  const { window } = dom;

  class CountingMap {
    constructor() {
      this._m = new Map();
      this.setCalls = 0;
    }
    has(k) {
      return this._m.has(k);
    }
    get(k) {
      return this._m.get(k);
    }
    set(k, v) {
      this.setCalls++;
      this._m.set(k, v);
      return this;
    }
    get size() {
      return this._m.size;
    }
  }

  const { shared } = makeShared(window);

  const counting = new CountingMap();
  shared.__contrastSharedCache.__colorParseCache = counting;

  const helpers = createContrastHelpers({ window }, shared);

  const input = ' rgb(0, 0, 0) ';

  const c1 = helpers.parseCssColorToRgba(input);
  const setAfter1 = counting.setCalls;

  const c2 = helpers.parseCssColorToRgba(input);
  const setAfter2 = counting.setCalls;

  assert.ok(c1 && c2, 'should parse rgb()');
  assert.deepEqual(c1, c2, 'parsed values should be equal');
  assert.equal(setAfter1, 1, 'first call should populate cache once');
  assert.equal(setAfter2, 1, 'second identical call should not populate again');
  assert.ok(counting.size >= 1, 'cache should have at least one entry');
});

test('contrast cache: getComputabilityBlocker memoizes selector building per element', () => {
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <div id="x" style="background-image: linear-gradient(red, blue); color: black;">t</div>
    </body></html>`,
    { pretendToBeVisual: true }
  );

  const { window } = dom;
  const { document } = window;

  const { shared, getCounts } = makeShared(window);
  const helpers = createContrastHelpers({ window }, shared);

  const x = document.getElementById('x');

  // First call likely needs selector for reporting (depending on blocker path)
  helpers.getComputabilityBlocker(x);
  const after1 = getCounts().buildSelectorCalls;

  // Second call should reuse cached selector if your contrast-helpers caches it,
  // OR at least not rebuild it for the same element.
  helpers.getComputabilityBlocker(x);
  const after2 = getCounts().buildSelectorCalls;

  assert.equal(after2, after1, 'second call should not rebuild selector for the same element');
});

test('contrast cache: parseCssColorToRgba normalizes keys so equivalent rgb() strings share cache entry', () => {
  const dom = new JSDOM(`<!doctype html><html><body></body></html>`, {
    pretendToBeVisual: true
  });
  const { window } = dom;

  class CountingMap {
    constructor() {
      this._m = new Map();
      this.setCalls = 0;
    }
    has(k) {
      return this._m.has(k);
    }
    get(k) {
      return this._m.get(k);
    }
    set(k, v) {
      this.setCalls++;
      this._m.set(k, v);
      return this;
    }
    get size() {
      return this._m.size;
    }
    keys() {
      return this._m.keys();
    }
  }

  const { shared } = makeShared(window);

  const counting = new CountingMap();
  shared.__contrastSharedCache.__colorParseCache = counting;

  const helpers = createContrastHelpers({ window }, shared);

  // These should normalize to the same cache key under your new normalization.
  helpers.parseCssColorToRgba(' rgb(0, 0, 0) ');
  helpers.parseCssColorToRgba('RGB(0,0,0)');
  helpers.parseCssColorToRgba('rgb( 0 ,0 , 0 )');

  // If normalization works, only ONE cache entry should be created.
  assert.equal(counting.setCalls, 1, 'equivalent rgb() strings should populate cache once');
  assert.equal(counting.size, 1, 'cache should contain exactly one entry for rgb(0,0,0)');
});

// -------- Resilience: shared per-run caches degrading gracefully --------
//
// __getSharedWeakMapCache/__getSharedTextScanCache/__getSharedColorParseCache
// and the small per-element caches built on top of them are documented
// "always no-throw" -- if the shared cache slot itself is unreadable or
// broken, helpers must fall back to an uncached (but still correct) local
// path rather than propagating an exception up to a rule.

test('contrast cache: init-time shared-cache lookups degrade to local caches when shared.__contrastSharedCache access throws', () => {
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <div id="a" style="opacity: 0.5"><span id="b" style="color:red">t</span></div>
    </body></html>`,
    { pretendToBeVisual: true }
  );
  const { window } = dom;
  const { document } = window;

  const shared = {
    trim: (v) => (v == null ? '' : String(v)).trim(),
    computedStyle: (el) => window.getComputedStyle(el),
    composedParent: (n) => (n ? n.parentNode || null : null),
    buildSimpleSelector: (el) => (el && el.id ? `#${el.id}` : '')
  };
  // createContrastHelpers reads shared.__contrastSharedCache repeatedly at
  // init time (once per named cache: __computedStyleCache, __hasBgImgCache,
  // __hasBlendModeCache, __hasFilterCache, __opacityProductCache,
  // __effectiveForegroundCache, __effectiveBackgroundCache,
  // __simpleSelectorCache, __computabilityBlockerCache, plus
  // __colorParseCache) -- each read throws here, exercising
  // __getSharedWeakMapCache's and __getSharedColorParseCache's own
  // catch-and-return-null fallbacks, after which each cache falls back to
  // a fresh local WeakMap/Map instead.
  Object.defineProperty(shared, '__contrastSharedCache', {
    get() {
      throw new Error('boom');
    },
    configurable: true
  });

  const helpers = createContrastHelpers({ window, document }, shared);

  const parsed = helpers.parseCssColorToRgba('rgb(1,2,3)');
  assert.deepEqual(parsed, { r: 1, g: 2, b: 3, a: 1 });

  const b = document.getElementById('b');
  const op = helpers.computeOpacityProduct(b);
  assert.ok(Math.abs(op - 0.5) < 1e-9, `expected opacity product ~0.5, got ${op}`);
});

test('contrast cache: __getSharedTextScanCache falls back to plain assignment when Object.defineProperty on the cache slot is rejected', () => {
  const dom = new JSDOM(`<!doctype html><html><body><p id="p1">Hello</p></body></html>`, {
    pretendToBeVisual: true
  });
  const { window } = dom;
  const { document } = window;

  const { shared } = makeShared(window);
  // A defineProperty trap returning false makes Object.defineProperty throw
  // a TypeError (per the [[DefineOwnProperty]] invariant). Plain property
  // assignment on a Proxy for a not-yet-existing property normally routes
  // through that SAME trap in strict mode (assignment creating a new own
  // property internally calls [[DefineOwnProperty]] on the receiver) --
  // an explicit `set` trap that writes straight to the underlying target
  // bypasses that, so only Object.defineProperty is rejected while the
  // plain-assignment fallback (`sc.__textScanCache = new Map()`) succeeds.
  const target = {};
  shared.__contrastSharedCache = new Proxy(target, {
    defineProperty() {
      return false;
    },
    set(t, prop, value) {
      t[prop] = value;
      return true;
    }
  });

  const helpers = createContrastHelpers({ window, document }, shared);
  const scan = helpers.getTextScan({ document, window, root: document.body }, {}, {});
  assert.strictEqual(scan.eligibleTextCount, 1);
  assert.ok(
    shared.__contrastSharedCache.__textScanCache instanceof Map,
    'expected the plain-assignment fallback to have populated a Map'
  );
});

test('contrast cache: __getSharedTextScanCache degrades to no caching (but still correct results) when shared.__contrastSharedCache access throws', () => {
  const dom = new JSDOM(`<!doctype html><html><body><p id="p1">Hello</p></body></html>`, {
    pretendToBeVisual: true
  });
  const { window } = dom;
  const { document } = window;

  const shared = {
    trim: (v) => (v == null ? '' : String(v)).trim(),
    computedStyle: (el) => window.getComputedStyle(el),
    composedParent: (n) => (n ? n.parentNode || null : null),
    buildSimpleSelector: (el) => (el && el.id ? `#${el.id}` : '')
  };
  Object.defineProperty(shared, '__contrastSharedCache', {
    get() {
      throw new Error('boom');
    },
    configurable: true
  });

  const helpers = createContrastHelpers({ window, document }, shared);
  const ctx = { document, window, root: document.body };
  const scan1 = helpers.getTextScan(ctx, {}, {});
  const scan2 = helpers.getTextScan(ctx, {}, {});
  assert.strictEqual(scan1.eligibleTextCount, 1);
  assert.strictEqual(scan2.eligibleTextCount, 1);
  // Without a working cache, each call recomputes a fresh (but equal)
  // result object rather than returning the same cached reference (compare
  // against the "results ... are cached" test in contrast-helpers-dom.test.js,
  // where scan1 === scan2 when the shared cache works).
  assert.notStrictEqual(scan1, scan2);
});

test('contrast cache: computeOpacityProduct fails safe to 1 when its cache is broken', () => {
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <div id="a" style="opacity: 0.5"><span id="b">t</span></div>
    </body></html>`,
    { pretendToBeVisual: true }
  );
  const { window } = dom;
  const { document } = window;

  const { shared } = makeShared(window);
  shared.__contrastSharedCache.__opacityProductCache = {
    has() {
      throw new Error('boom');
    },
    get() {
      return undefined;
    },
    set() {
      return this;
    }
  };

  const helpers = createContrastHelpers({ window }, shared);
  const b = document.getElementById('b');
  const op = helpers.computeOpacityProduct(b);
  assert.strictEqual(
    op,
    1,
    'a broken opacity-product cache should fail safe to 1 rather than throw'
  );
});

function brokenHasCache() {
  return {
    has() {
      throw new Error('boom');
    },
    get() {
      return undefined;
    },
    set() {
      return this;
    }
  };
}

test('contrast cache: getComputabilityBlocker still resolves ok:true for a plain element when __hasBlendModeCache is broken', () => {
  const dom = new JSDOM(
    `<!doctype html><html><body><div id="a" style="background-color:white">t</div></body></html>`,
    { pretendToBeVisual: true }
  );
  const { window } = dom;
  const { document } = window;

  const { shared } = makeShared(window);
  shared.__contrastSharedCache.__hasBlendModeCache = brokenHasCache();

  const helpers = createContrastHelpers({ window }, shared);
  const a = document.getElementById('a');
  const out = helpers.getComputabilityBlocker(a);
  assert.strictEqual(out.ok, true);
});

test('contrast cache: getComputabilityBlocker still resolves ok:true for a plain element when __hasFilterCache is broken', () => {
  const dom = new JSDOM(
    `<!doctype html><html><body><div id="a" style="background-color:white">t</div></body></html>`,
    { pretendToBeVisual: true }
  );
  const { window } = dom;
  const { document } = window;

  const { shared } = makeShared(window);
  shared.__contrastSharedCache.__hasFilterCache = brokenHasCache();

  const helpers = createContrastHelpers({ window }, shared);
  const a = document.getElementById('a');
  const out = helpers.getComputabilityBlocker(a);
  assert.strictEqual(out.ok, true);
});

test('contrast cache: getComputabilityBlocker still resolves ok:true for a plain element when __hasBgImgCache is broken', () => {
  const dom = new JSDOM(
    `<!doctype html><html><body><div id="a" style="background-color:white">t</div></body></html>`,
    { pretendToBeVisual: true }
  );
  const { window } = dom;
  const { document } = window;

  const { shared } = makeShared(window);
  shared.__contrastSharedCache.__hasBgImgCache = brokenHasCache();

  const helpers = createContrastHelpers({ window }, shared);
  const a = document.getElementById('a');
  const out = helpers.getComputabilityBlocker(a);
  assert.strictEqual(out.ok, true);
});
