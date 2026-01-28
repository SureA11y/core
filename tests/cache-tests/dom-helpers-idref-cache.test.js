'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');

const { createDomHelpers } = require('../../src/core/dom-helpers.js');

test('dom helpers perf: safeDocGetById is cached within a single resolveIdRefs call (duplicate tokens)', () => {
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <div id="a">A</div>
      <div id="b">B</div>
    </body></html>`,
    { pretendToBeVisual: true }
  );

  const { window } = dom;
  const { document } = window;

  // Spy on getElementById to ensure duplicates are cached
  const orig = document.getElementById.bind(document);
  let calls = 0;
  document.getElementById = (id) => {
    calls++;
    return orig(id);
  };

  const helpers = createDomHelpers({ window, document, root: document });

  const r = helpers.resolveIdRefs('a b a');
  assert.equal(r.refs.length, 2);
  assert.equal(r.missing.length, 0);
  // With caching, we expect getElementById called once per unique id (a, b)
  assert.equal(calls, 2);
});

test('dom helpers perf: resolveIdRefs result is cached across calls within a run', () => {
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <div id="a">A</div>
      <div id="b">B</div>
    </body></html>`,
    { pretendToBeVisual: true }
  );

  const { window } = dom;
  const { document } = window;

  const orig = document.getElementById.bind(document);
  let calls = 0;
  document.getElementById = (id) => {
    calls++;
    return orig(id);
  };

  const helpers = createDomHelpers({ window, document, root: document });

  const r1 = helpers.resolveIdRefs('a b');
  assert.equal(r1.refs.length, 2);
  assert.equal(calls, 2);

  const r2 = helpers.resolveIdRefs('a b');
  assert.equal(r2.refs.length, 2);
  // No additional getElementById calls expected due to resolveIdRefs cache
  assert.equal(calls, 2);
});

test('dom helpers perf: resolveIdRefs cache does not leak truncation between calls (maxRefs)', () => {
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <div id="a">A</div>
      <div id="b">B</div>
      <div id="c">C</div>
    </body></html>`,
    { pretendToBeVisual: true }
  );

  const { window } = dom;
  const { document } = window;

  // Keep getElementById unpatched here; we care about semantics not counts.
  const helpers = createDomHelpers({ window, document, root: document });

  const rTrunc = helpers.resolveIdRefs('a b c', null, { maxRefs: 2 });
  assert.equal(rTrunc.refs.length, 2);
  assert.ok(rTrunc.flags.includes('truncated'));

  const rFull = helpers.resolveIdRefs('a b c');
  assert.equal(rFull.refs.length, 3);
  assert.ok(!rFull.flags.includes('truncated'));
});
