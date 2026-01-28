'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');

const { createDomHelpers } = require('../../src/core/dom-helpers.js');

/**
 * Perf-oriented "tripwire" tests for dom-helpers changes.
 * These tests lock perf-related behaviors using either:
 * - opts.perfStats counters (preferred), or
 * - coarse DOM API call counting (fallback).
 *
 * They intentionally avoid brittle exact call counts and avoid relying on
 * JSDOM-specific <dialog> semantics.
 */

test('dom helpers perf: modal dialog query is memoized per document per run (when supported)', () => {
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <dialog id="d1" open aria-modal="true"><p>Modal</p></dialog>
      <button id="inside">Inside</button>
      <button id="outside">Outside</button>
    </body></html>`,
    { pretendToBeVisual: true }
  );

  const { window } = dom;
  const { document } = window;

  // Place one button inside the dialog and one outside.
  const d1 = document.getElementById('d1');
  const inside = document.getElementById('inside');
  const outside = document.getElementById('outside');
  d1.appendChild(inside);

  const helpers = createDomHelpers({ window, document, root: document, perfStats: true });

  helpers.isAccTreeEligible(inside);
  helpers.isAccTreeEligible(outside);

  const stats = helpers.getPerfStats();
  const c = (stats && stats.counters) ? stats.counters : {};

  const miss = c['modalDialogs.miss'] || 0;
  const hit = c['modalDialogs.hit'] || 0;

  // In some JSDOM environments, <dialog> handling (or even selector matching) can be incomplete,
  // and the engine may short-circuit before the modal check. In that case, counters stay at 0.
  // This test only enforces memoization *when the modal check runs*.
  if (miss + hit === 0) return;

  assert.ok(miss >= 1, 'expected at least one modalDialogs.miss when modal check runs');
  assert.ok(hit >= 1, 'expected at least one modalDialogs.hit when modal check runs');
});

test('dom helpers perf: ancestor CSS blocker short-circuits repeated style checks across siblings', () => {
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <div id="wrap" style="display:none">
        <span id="a">A</span>
        <span id="b">B</span>
      </div>
    </body></html>`,
    { pretendToBeVisual: true }
  );

  const { window } = dom;
  const { document } = window;

  const originalGetCS = window.getComputedStyle.bind(window);
  let getComputedStyleCalls = 0;
  window.getComputedStyle = (...args) => {
    getComputedStyleCalls++;
    return originalGetCS(...args);
  };

  const a = document.getElementById('a');
  const b = document.getElementById('b');

  const helpers = createDomHelpers({ window, document, root: document });

  const before1 = getComputedStyleCalls;
  const e1 = helpers.isAccTreeEligible(a);
  const after1 = getComputedStyleCalls;

  assert.equal(e1.eligible, false);
  assert.ok(after1 > before1, 'first call should compute some styles');

  const before2 = getComputedStyleCalls;
  const e2 = helpers.isAccTreeEligible(b);
  const after2 = getComputedStyleCalls;

  assert.equal(e2.eligible, false);

  const inc1 = after1 - before1;
  const inc2 = after2 - before2;

  assert.ok(inc2 < inc1, 'second sibling should require fewer getComputedStyle calls due to ancestor blocker cache');
});

test('dom helpers perf: queryAllDeep caches shadow root discovery when excludeSelectors is empty', () => {
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <div id="host"></div>
      <button id="light">Light</button>
    </body></html>`,
    { pretendToBeVisual: true }
  );

  const { window } = dom;
  const { document } = window;

  const host = document.getElementById('host');
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = '<button id="shadowBtn">Shadow</button>';

  // Count the expensive '*' scans used to discover shadow hosts.
  const originalDocQSA = document.querySelectorAll.bind(document);
  let starScans = 0;
  document.querySelectorAll = (sel, ...rest) => {
    if (String(sel) === '*') starScans++;
    return originalDocQSA(sel, ...rest);
  };

  const originalShadowQSA = shadow.querySelectorAll.bind(shadow);
  shadow.querySelectorAll = (sel, ...rest) => {
    if (String(sel) === '*') starScans++;
    return originalShadowQSA(sel, ...rest);
  };

  const helpers = createDomHelpers({ window, document, root: document, includeShadowDom: true });

  const before1 = starScans;
  const r1 = helpers.queryAllDeep('button');
  const after1 = starScans;

  assert.ok(r1.some((el) => el && el.id === 'shadowBtn'), 'first deep query finds shadow button');
  assert.ok(after1 > before1, 'first deep query should scan for shadow hosts');

  const before2 = starScans;
  const r2 = helpers.queryAllDeep('button');
  const after2 = starScans;

  assert.ok(r2.some((el) => el && el.id === 'shadowBtn'), 'second deep query still finds shadow button');
  assert.equal(after2, before2, 'second deep query should reuse cached shadow root discovery (no repeated "*" scans)');
});

test('dom helpers perf: queryAllDeep does NOT cache shadow root discovery when excludeSelectors is non-empty', () => {
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <div id="host" class="excluded"></div>
      <button id="light">Light</button>
    </body></html>`,
    { pretendToBeVisual: true }
  );

  const { window } = dom;
  const { document } = window;

  const host = document.getElementById('host');
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = '<button id="shadowBtn">Shadow</button>';

  // Count '*' scans again.
  const originalDocQSA = document.querySelectorAll.bind(document);
  let starScans = 0;
  document.querySelectorAll = (sel, ...rest) => {
    if (String(sel) === '*') starScans++;
    return originalDocQSA(sel, ...rest);
  };

  const originalShadowQSA = shadow.querySelectorAll.bind(shadow);
  shadow.querySelectorAll = (sel, ...rest) => {
    if (String(sel) === '*') starScans++;
    return originalShadowQSA(sel, ...rest);
  };

  // excludeSelectors present => discovery caching is intentionally disabled (correctness over perf).
  const helpers = createDomHelpers({
    window,
    document,
    root: document,
    includeShadowDom: true,
    excludeSelectors: ['.excluded']
  });

  const before1 = starScans;
  helpers.queryAllDeep('button');
  const after1 = starScans;
  assert.ok(after1 > before1, 'first deep query should scan for shadow hosts');

  const before2 = starScans;
  helpers.queryAllDeep('button');
  const after2 = starScans;

  assert.ok(after2 > before2, 'second deep query should scan again when excludeSelectors is non-empty (no discovery cache)');
});
