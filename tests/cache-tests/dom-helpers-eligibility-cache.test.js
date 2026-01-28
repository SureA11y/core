'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');

const { createDomHelpers } = require('../../src/core/dom-helpers.js');

test('dom-helpers eligibility caches: isAccTreeEligible memoizes per element (computedStyle not repeated)', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <div id="a"><span id="b">Hello</span></div>
  </body></html>`);

  const { window } = dom;
  const { document } = window;

  const orig = window.getComputedStyle.bind(window);
  let calls = 0;
  window.getComputedStyle = (el) => { calls++; return orig(el); };

  const helpers = createDomHelpers({ window, document, root: document });

  const b = document.getElementById('b');
  assert.ok(b);

  const r1 = helpers.isAccTreeEligible(b);
  const after1 = calls;

  const r2 = helpers.isAccTreeEligible(b);
  const after2 = calls;

  assert.strictEqual(after2, after1, 'second call should not recompute (computedStyle call count stable)');
  assert.deepStrictEqual(r2, r1);

  r1.reasons.push('mutated');
  const r3 = helpers.isAccTreeEligible(b);
  assert.ok(!r3.reasons.includes('mutated'), 'cache should return a fresh copy of reasons');
});

test('dom-helpers eligibility caches: isDomVisibleEligible memoizes per mode key', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <div id="a"><span id="b">Hello</span></div>
  </body></html>`);

  const { window } = dom;
  const { document } = window;

  const orig = window.getComputedStyle.bind(window);
  let calls = 0;
  window.getComputedStyle = (el) => { calls++; return orig(el); };

  const helpers = createDomHelpers({ window, document, root: document });
  const b = document.getElementById('b');
  assert.ok(b);

  const r1 = helpers.isDomVisibleEligible(b, null, { visibilityMode: 'styleOnly' });
  const after1 = calls;
  const r2 = helpers.isDomVisibleEligible(b, null, { visibilityMode: 'styleOnly' });
  const after2 = calls;

  assert.strictEqual(after2, after1, 'same mode key should memoize');
  assert.deepStrictEqual(r2, r1);

  // Different mode key should not throw and should return a result
  const r3 = helpers.isDomVisibleEligible(b, null, { visibilityMode: 'styleAndGeometry', disableGeometry: true });
  assert.ok(r3 && typeof r3 === 'object' && typeof r3.eligible === 'boolean');

  r1.reasons.push('mutated');
  const r4 = helpers.isDomVisibleEligible(b, null, { visibilityMode: 'styleOnly' });
  assert.ok(!r4.reasons.includes('mutated'), 'cache should return a fresh copy of reasons');
});


test('dom-helpers eligibility caches: ancestor blocker finals short-circuit repeated ancestor scans (dom)', () => {
  const dom = new JSDOM(`<!doctype html><html><body>
    <div id="p"><span id="a">A</span><span id="b">B</span></div>
  </body></html>`);

  const { window } = dom;
  const { document } = window;

  const helpers = createDomHelpers({ window, document, root: document, perfStats: true });

  const a = document.getElementById('a');
  const b = document.getElementById('b');
  assert.ok(a && b);

  helpers.isDomVisibleEligible(a, null, { visibilityMode: 'styleOnly' });
  helpers.isDomVisibleEligible(b, null, { visibilityMode: 'styleOnly' });

  const stats = helpers.getPerfStats ? helpers.getPerfStats() : null;
  const counters = stats && stats.counters ? stats.counters : {};

  // On the second call (sibling), we should be able to stop ancestor scanning early using a cached "no blockers above" proof.
  assert.ok((counters['ancestorBlockerDom.structFinal.hit'] || 0) >= 1, 'should hit structFinal cache at least once');
});
