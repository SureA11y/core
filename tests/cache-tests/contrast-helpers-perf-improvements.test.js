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

test("contrast perf: computedStyle cache is shared across helper methods within a run", () => {
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <div id="a" style="mix-blend-mode: multiply; opacity: 0.8">
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

  // First call: walks ancestors and hits getComputedStyle multiple times.
  helpers.computeOpacityProduct(b);
  const afterOpacity = getCounts().computedStyleCalls;
  assert.ok(afterOpacity > 0, "sanity: should call computedStyle at least once");

  // Second call: should reuse cached computed styles for the same elements visited.
  const beforeBlocker = getCounts().computedStyleCalls;
  helpers.getComputabilityBlocker(b);
  const afterBlocker = getCounts().computedStyleCalls;

  assert.equal(
    afterBlocker,
    beforeBlocker,
    "getComputabilityBlocker should not call computedStyle again for the same elements (shared computedStyle cache)"
  );
});

test("contrast perf: computeEffectiveBackground caches per element+opts when collectStack=false", () => {
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <div id="a" style="background-color: rgb(255, 255, 255); opacity: 0.9">
        <span id="b" style="background-color: rgba(0, 0, 0, 0.2);">x</span>
      </div>
    </body></html>`,
    { pretendToBeVisual: true }
  );

  const { window } = dom;
  const { document } = window;

  const { shared, getCounts } = makeShared(window);
  const helpers = createContrastHelpers({ window }, shared);

  const b = document.getElementById("b");
  const opts = { profile: "strictConformance", rootCanvasFallback: "#ffffff", collectStack: false };

  const before1 = getCounts().computedStyleCalls;
  const out1 = helpers.computeEffectiveBackground(b, opts);
  const after1 = getCounts().computedStyleCalls;

  assert.ok(after1 > before1, "first call should compute styles");
  assert.ok(out1 && typeof out1 === "object", "should return an object");

  const before2 = getCounts().computedStyleCalls;
  const out2 = helpers.computeEffectiveBackground(b, opts);
  const after2 = getCounts().computedStyleCalls;

  assert.equal(after2, before2, "second call should hit cache (no additional computedStyle calls)");
  assert.strictEqual(out2, out1, "cached result should be same reference for identical opts when collectStack=false");
});

test("contrast perf: computeEffectiveBackground does not memoize results when collectStack=true", () => {
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <div id="a" style="background-color: rgb(255, 255, 255); opacity: 0.9">
        <span id="b" style="background-color: rgba(0, 0, 0, 0.2);">x</span>
      </div>
    </body></html>`,
    { pretendToBeVisual: true }
  );

  const { window } = dom;
  const { document } = window;

  const { shared } = makeShared(window);
  const helpers = createContrastHelpers({ window }, shared);

  const b = document.getElementById("b");
  const opts = { profile: "strictConformance", rootCanvasFallback: "#ffffff", collectStack: true };

  const out1 = helpers.computeEffectiveBackground(b, opts);
  const out2 = helpers.computeEffectiveBackground(b, opts);

  // We intentionally avoid using computedStyle call counts here:
  // computedStyle caching may be shared across calls for performance.
  assert.notStrictEqual(out2, out1, "should not reuse the same cached object reference when collectStack=true");
  assert.ok(Array.isArray(out1.stack), "collectStack=true should return a stack array");
  assert.ok(Array.isArray(out2.stack), "collectStack=true should return a stack array");
  assert.notStrictEqual(out2.stack, out1.stack, "stack array should be newly allocated each call when collectStack=true");

  // Sanity: stack should contain at least one layer when background colors are present.
  assert.ok(out1.stack.length >= 1, "stack should include at least one background layer");
  assert.ok(out2.stack.length >= 1, "stack should include at least one background layer");
});
