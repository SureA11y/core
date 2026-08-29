'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');

const { createDomHelpers } = require('../../src/core/dom-helpers.js');
const { runa11yCoreOnHtml } = require('../../tests/helpers/runDomRulesOnHtml.js');

function helpersFor(html) {
  const dom = new JSDOM(html, { pretendToBeVisual: true });
  const { window } = dom;
  const { document } = window;
  return { helpers: createDomHelpers({ window, document, root: document }), document };
}

// buildStructuralPath is a more robust element-identity mechanism than a CSS
// selector string alone (survives some DOM changes a selector wouldn't --
// e.g. an id/class rename), mirroring the structural-path algorithm used by
// this project's separately-maintained cross-engine diffing tool exactly
// (see dom-helpers.js's own comment for why that's a necessary duplication
// rather than a shared require).

test('buildStructuralPath: computes the sibling-index path from documentElement down to the element', () => {
  const { helpers, document } = helpersFor(`<!doctype html><html><body>
    <div><section><img id="target" src="x.png"></section></div>
  </body></html>`);

  const target = document.getElementById('target');
  const path = helpers.buildStructuralPath(target);

  // html -> body (index 1, after head) -> div (0) -> section (0) -> img (0)
  assert.deepStrictEqual(path, [1, 0, 0, 0]);
});

test('buildStructuralPath: the documentElement itself has an empty path', () => {
  const { helpers, document } = helpersFor(`<!doctype html><html><body></body></html>`);
  assert.deepStrictEqual(helpers.buildStructuralPath(document.documentElement), []);
});

test('buildStructuralPath: two elements at different positions get different paths', () => {
  const { helpers, document } = helpersFor(`<!doctype html><html><body>
    <section><div id="a"></div></section>
    <section><div id="b"></div></section>
  </body></html>`);

  const pathA = helpers.buildStructuralPath(document.getElementById('a'));
  const pathB = helpers.buildStructuralPath(document.getElementById('b'));
  assert.notDeepStrictEqual(pathA, pathB);
});

test('buildStructuralPath: falls back to re-resolving via the given selector when no element reference is passed', () => {
  const { helpers } = helpersFor(`<!doctype html><html><body>
    <div><span id="only"></span></div>
  </body></html>`);

  const path = helpers.buildStructuralPath(null, '#only');
  assert.deepStrictEqual(path, [1, 0, 0]);
});

test('buildStructuralPath: returns null when neither a node nor a resolvable selector is given', () => {
  const { helpers } = helpersFor(`<!doctype html><html><body></body></html>`);
  assert.strictEqual(helpers.buildStructuralPath(null, null), null);
  assert.strictEqual(helpers.buildStructuralPath(null, '#does-not-exist'), null);
});

test('buildStructuralPath: a malformed fallback selector does not throw -- resolves to null like any other non-match', () => {
  const { helpers } = helpersFor(`<!doctype html><html><body><div id="d"></div></body></html>`);
  assert.doesNotThrow(() => helpers.buildStructuralPath(null, '[[[not-a-selector'));
  assert.strictEqual(helpers.buildStructuralPath(null, '[[[not-a-selector'), null);
});

test(`engine integration: every fail/cantTell occurrence carries a structuralPath alongside selector/html`, () => {
  const html = `<!doctype html><html><body><div><section><img src="x.png"></section></div></body></html>`;
  const result = runa11yCoreOnHtml(html, {});
  const rule = result.checksResults.find((r) => r.ruleId === 'img-alt-present');

  assert.strictEqual(rule.outcome, 'fail');
  assert.strictEqual(rule.occurrences.length, 1);
  assert.deepStrictEqual(rule.occurrences[0].structuralPath, [1, 0, 0, 0]);
});

test('buildStructuralPath: a parent chain that never reaches the root yields null rather than looping', () => {
  const { helpers } = helpersFor('<!doctype html><html><body><p>x</p></body></html>');

  // A chain that reports itself as its own parent's child, which a real DOM
  // cannot produce but a proxied or synthetic one can.
  const a = {};
  const b = {};
  a.parentElement = b;
  b.parentElement = a;
  a.children = [b];
  b.children = [a];

  assert.strictEqual(helpers.buildStructuralPath(a), null);
});

test('buildStructuralPath: a legitimately deep document still gets a full path', () => {
  const depth = 400;
  const { helpers, document } = helpersFor(
    `<!doctype html><html><body>${'<div>'.repeat(depth)}<img id="target" src="x.png">${'</div>'.repeat(depth)}</body></html>`
  );

  const path = helpers.buildStructuralPath(document.getElementById('target'));
  assert.ok(Array.isArray(path));
  assert.ok(path.length >= depth, `expected a path at least ${depth} deep, got ${path.length}`);
});
