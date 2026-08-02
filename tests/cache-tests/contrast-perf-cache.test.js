'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');

const { createContrastHelpers } = require('../../src/core/contrast-helpers.js');

test('contrast perf cache: computeOpacityProduct caches per element per run', () => {
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

  // Spy on getComputedStyle (used by shared.computedStyle)
  const originalGetComputedStyle = window.getComputedStyle.bind(window);
  let gcsCalls = 0;
  window.getComputedStyle = (...args) => {
    gcsCalls++;
    return originalGetComputedStyle(...args);
  };

  // Minimal shared bundle expected by createContrastHelpers
  const shared = {
    trim: (v) => (v == null ? '' : String(v)).trim(),
    computedStyle: (el) => {
      try {
        return window.getComputedStyle(el);
      } catch {
        return {};
      }
    },
    composedParent: (n) => {
      if (!n) return null;
      // enough for this test; match your helpers’ general behavior
      return n.parentNode || (n.assignedSlot ? n.assignedSlot : null);
    },
    buildSimpleSelector: (el) => {
      if (!el || el.nodeType !== 1) return '';
      if (el.id) return `#${el.id}`;
      return el.tagName ? el.tagName.toLowerCase() : '';
    }
  };

  const helpers = createContrastHelpers({ window }, shared);

  const b = document.getElementById('b');

  // First call computes
  const before1 = gcsCalls;
  const o1 = helpers.computeOpacityProduct(b);
  const after1 = gcsCalls;
  assert.ok(after1 > before1, 'first call should compute (getComputedStyle called)');

  // Second call should use cache: no additional getComputedStyle calls
  const before2 = gcsCalls;
  const o2 = helpers.computeOpacityProduct(b);
  const after2 = gcsCalls;

  assert.equal(o1, o2, 'opacity product should be stable');
  assert.equal(
    after2,
    before2,
    'second call should hit cache (no additional getComputedStyle calls)'
  );
});
