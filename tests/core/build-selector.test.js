'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');

const { createDomHelpers } = require('../../src/core/dom-helpers.js');

function helpersFor(html) {
  const dom = new JSDOM(html, { pretendToBeVisual: true });
  const { window } = dom;
  const { document } = window;
  return { helpers: createDomHelpers({ window, document, root: document }), document };
}

// Regression test for a bug where buildSelector's ancestor-anchoring
// omitted the :nth-of-type() index whenever the ancestor was the LAST of
// several same-tag siblings (nthOfType only scanned nextElementSibling to
// decide whether disambiguation was needed, missing same-tag siblings that
// came *before* it). That produced selectors like "div > section > div"
// that matched multiple elements instead of the one they were built for.
test('buildSelector: disambiguates an ancestor that is the last of several same-tag siblings', () => {
  const { helpers, document } = helpersFor(`<!doctype html><html><body>
    <div class="grid">
      <section><div id="a">first section content</div></section>
      <section><div id="b">second section content</div></section>
    </div>
  </body></html>`);

  const target = document.getElementById('b');
  const selector = helpers.buildSelector(target);

  const matches = document.querySelectorAll(selector);
  assert.equal(matches.length, 1, `selector "${selector}" should resolve to exactly one element`);
  assert.equal(matches[0], target);
});

test('buildSelector: disambiguates an ancestor that is the first of several same-tag siblings', () => {
  const { helpers, document } = helpersFor(`<!doctype html><html><body>
    <div class="grid">
      <section><div id="a">first section content</div></section>
      <section><div id="b">second section content</div></section>
    </div>
  </body></html>`);

  const target = document.getElementById('a');
  const selector = helpers.buildSelector(target);

  const matches = document.querySelectorAll(selector);
  assert.equal(matches.length, 1, `selector "${selector}" should resolve to exactly one element`);
  assert.equal(matches[0], target);
});

test('buildSelector: disambiguates an ancestor in the middle of several same-tag siblings', () => {
  const { helpers, document } = helpersFor(`<!doctype html><html><body>
    <div class="grid">
      <section><div id="a">one</div></section>
      <section><div id="b">two</div></section>
      <section><div id="c">three</div></section>
    </div>
  </body></html>`);

  const target = document.getElementById('b');
  const selector = helpers.buildSelector(target);

  const matches = document.querySelectorAll(selector);
  assert.equal(matches.length, 1, `selector "${selector}" should resolve to exactly one element`);
  assert.equal(matches[0], target);
});

// Regression test for a bug in the CSS-identifier-escaping fallback used
// when window.CSS.escape is unavailable — which is jsdom's actual situation
// (confirmed: jsdom does not implement CSS.escape), so this fallback is not
// a rare edge case, it's the one path exercised by every selector this
// engine ever builds. The old fallback only escaped individual disallowed
// characters and didn't handle CSS's "identifier can't start with an
// unescaped digit" rule, so an ID like a UUID (found on a real site —
// Nike's homepage, id="13cbc70d-ca70-4938-9150-5abddc780c24") produced an
// invalid selector fragment. buildSelectorUncached's own el.matches()
// verification then threw (silently caught) and fell back to
// buildSimpleSelector's bare-tag-name selector for every element anchored
// under that ancestor — a near-total loss of selector fidelity, since a
// bare tag name resolves to the *first* matching element on the whole page,
// not the one actually flagged.
test('buildSelector: an ancestor id starting with a digit produces a valid, resolving selector', () => {
  const { helpers, document } = helpersFor(`<!doctype html><html><body>
    <div id="13cbc70d-ca70-4938-9150-5abddc780c24">
      <ul><li><a id="target" href="#x">one</a></li><li><a href="#y">two</a></li></ul>
    </div>
  </body></html>`);

  const target = document.getElementById('target');
  const selector = helpers.buildSelector(target);

  assert.notEqual(selector, 'a', 'must not degrade to the bare, non-unique tag-name fallback');
  const matches = document.querySelectorAll(selector);
  assert.equal(matches.length, 1, `selector "${selector}" should resolve to exactly one element`);
  assert.equal(matches[0], target);
});

test('buildSelector: an id that is itself digit-leading resolves uniquely when used directly as the anchor', () => {
  const { helpers, document } = helpersFor(`<!doctype html><html><body>
    <div id="42-widget"><span id="inner">content</span></div>
  </body></html>`);

  const target = document.getElementById('42-widget');
  const selector = helpers.buildSelector(target);
  const matches = document.querySelectorAll(selector);
  assert.equal(matches.length, 1, `selector "${selector}" should resolve to exactly one element`);
  assert.equal(matches[0], target);
});

test('buildSelector: a hyphen-then-digit-leading id (e.g. "-1foo") resolves uniquely', () => {
  const { helpers, document } = helpersFor(`<!doctype html><html><body>
    <div id="-1foo">content</div>
  </body></html>`);

  const target = document.getElementById('-1foo');
  const selector = helpers.buildSelector(target);
  const matches = document.querySelectorAll(selector);
  assert.equal(matches.length, 1, `selector "${selector}" should resolve to exactly one element`);
  assert.equal(matches[0], target);
});

test('buildSelector: every generated selector across many repeated sibling groups resolves uniquely', () => {
  // A denser version of the same shape (many repeated <section> groups with
  // no identifying attributes anywhere), exercising every sibling position.
  const sectionsHtml = Array.from({ length: 8 }, (_, i) => `<section><div class="target">item ${i}</div></section>`).join('\n');
  const { helpers, document } = helpersFor(`<!doctype html><html><body><div class="grid">${sectionsHtml}</div></body></html>`);

  const targets = Array.from(document.querySelectorAll('.target'));
  assert.equal(targets.length, 8);

  for (const target of targets) {
    const selector = helpers.buildSelector(target);
    const matches = document.querySelectorAll(selector);
    assert.equal(matches.length, 1, `selector "${selector}" should resolve to exactly one element`);
    assert.equal(matches[0], target);
  }
});
