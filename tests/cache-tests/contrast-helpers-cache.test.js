'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require("jsdom");

const {createContrastHelpers } = require("../../src/core/contrast-helpers.js");

function makeShared(window) {
    let computedStyleCalls = 0;
    let buildSelectorCalls = 0;

    const shared = {
        __contrastSharedCache: {},

        trim: (v) => (v == null ? "" : String(v)).trim(),

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
            if (!el || el.nodeType !== 1) return "";
            if (el.id) return `#${el.id}`;
            return el.tagName ? el.tagName.toLowerCase() : "";
        },
    };

    return {
        shared,
        getCounts: () => ({ computedStyleCalls, buildSelectorCalls }),
    };
}

test("contrast cache: computeOpacityProduct memoizes per element per run", () => {
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

    const b = document.getElementById("b");

    const before1 = getCounts().computedStyleCalls;
    const o1 = helpers.computeOpacityProduct(b);
    const after1 = getCounts().computedStyleCalls;

    assert.ok(after1 > before1, "first call should compute at least once");

    const before2 = getCounts().computedStyleCalls;
    const o2 = helpers.computeOpacityProduct(b);
    const after2 = getCounts().computedStyleCalls;

    assert.equal(o1, o2, "opacity product should be stable");
    assert.equal(
        after2,
        before2,
        "second call should hit cache (no additional computedStyle calls)"
    );
});

test("contrast cache: parseCssColorToRgba caches repeat calls for identical input", () => {
    const dom = new JSDOM(`<!doctype html><html><body></body></html>`, {
        pretendToBeVisual: true,
    });
    const { window } = dom;

    class CountingMap {
        constructor() {
            this._m = new Map();
            this.setCalls = 0;
        }
        has(k) { return this._m.has(k); }
        get(k) { return this._m.get(k); }
        set(k, v) {
            this.setCalls++;
            this._m.set(k, v);
            return this;
        }
        get size() { return this._m.size; }
    }

    const { shared } = makeShared(window);

    const counting = new CountingMap();
    shared.__contrastSharedCache.__colorParseCache = counting;

    const helpers = createContrastHelpers({ window }, shared);

    const input = " rgb(0, 0, 0) ";

    const c1 = helpers.parseCssColorToRgba(input);
    const setAfter1 = counting.setCalls;

    const c2 = helpers.parseCssColorToRgba(input);
    const setAfter2 = counting.setCalls;

    assert.ok(c1 && c2, "should parse rgb()");
    assert.deepEqual(c1, c2, "parsed values should be equal");
    assert.equal(setAfter1, 1, "first call should populate cache once");
    assert.equal(setAfter2, 1, "second identical call should not populate again");
    assert.ok(counting.size >= 1, "cache should have at least one entry");
});

test("contrast cache: getComputabilityBlocker memoizes selector building per element", () => {
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

    const x = document.getElementById("x");

    // First call likely needs selector for reporting (depending on blocker path)
    helpers.getComputabilityBlocker(x);
    const after1 = getCounts().buildSelectorCalls;

    // Second call should reuse cached selector if your contrast-helpers caches it,
    // OR at least not rebuild it for the same element.
    helpers.getComputabilityBlocker(x);
    const after2 = getCounts().buildSelectorCalls;

    assert.equal(
        after2,
        after1,
        "second call should not rebuild selector for the same element"
    );
});

test("contrast cache: parseCssColorToRgba normalizes keys so equivalent rgb() strings share cache entry", () => {
    const dom = new JSDOM(`<!doctype html><html><body></body></html>`, {
        pretendToBeVisual: true,
    });
    const { window } = dom;

    class CountingMap {
        constructor() {
            this._m = new Map();
            this.setCalls = 0;
        }
        has(k) { return this._m.has(k); }
        get(k) { return this._m.get(k); }
        set(k, v) {
            this.setCalls++;
            this._m.set(k, v);
            return this;
        }
        get size() { return this._m.size; }
        keys() { return this._m.keys(); }
    }

    const { shared } = makeShared(window);

    const counting = new CountingMap();
    shared.__contrastSharedCache.__colorParseCache = counting;

    const helpers = createContrastHelpers({ window }, shared);

    // These should normalize to the same cache key under your new normalization.
    helpers.parseCssColorToRgba(" rgb(0, 0, 0) ");
    helpers.parseCssColorToRgba("RGB(0,0,0)");
    helpers.parseCssColorToRgba("rgb( 0 ,0 , 0 )");

    // If normalization works, only ONE cache entry should be created.
    assert.equal(counting.setCalls, 1, "equivalent rgb() strings should populate cache once");
    assert.equal(counting.size, 1, "cache should contain exactly one entry for rgb(0,0,0)");
});
