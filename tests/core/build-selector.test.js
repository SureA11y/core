'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');

const { createDomHelpers, resolveContextRoots } = require('../../src/core/dom-helpers.js');

function helpersFor(html) {
  const dom = new JSDOM(html, { pretendToBeVisual: true });
  const { window } = dom;
  const { document } = window;
  return { helpers: createDomHelpers({ window, document, root: document }), document };
}

// Multi-region contextSelector support: `root` is an array of matched roots,
// as dom-runner.js passes it (see resolveContextRoots's return value).
function helpersForMultiRoot(html, contextSelector) {
  const dom = new JSDOM(html, { pretendToBeVisual: true });
  const { window } = dom;
  const { document } = window;
  const { roots } = resolveContextRoots(document, contextSelector);
  return { helpers: createDomHelpers({ window, document, root: roots }), document, roots };
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

// Regression test for a bug where, under a multi-region contextSelector
// scan (resolveContextRoots matching more than one element), the
// ancestor-climbing loop stopped as soon as it reached ANY matched root
// instead of only stopping when there was a single, unambiguous root. Two
// structurally-identical regions (e.g. two ".widget" wrappers with the same
// internal markup) then produced the *same* selector string for their
// respective buttons, since the climb stopped at the same relative depth in
// each region — resolving to multiple elements instead of one, and pointing
// at the wrong element for at least one occurrence. The fix keeps climbing
// past a matched root when more than one root is in play, all the way to
// the true (singular) document root, same as the no-contextSelector path.
test('buildSelector: multi-region contextSelector does not collide selectors across structurally-identical regions', () => {
  const html = `<!doctype html><html><body>
    <div class="wrapA">
      <section><div><div class="widget"><button>A1</button></div></div></section>
      <section><div><div class="widget"><button>A2</button></div></div></section>
    </div>
    <div class="wrapB">
      <section><div><div class="widget"><button>B1</button></div></div></section>
      <section><div><div class="widget"><button>B2</button></div></div></section>
    </div>
  </body></html>`;

  const { helpers, document, roots } = helpersForMultiRoot(html, '.widget');
  assert.equal(roots.length, 4, 'contextSelector should match all four .widget regions');

  const buttons = Array.from(document.querySelectorAll('button'));
  assert.equal(buttons.length, 4);

  const seenSelectors = new Set();
  for (const target of buttons) {
    const selector = helpers.buildSelector(target);
    assert.ok(
      !seenSelectors.has(selector),
      `selector "${selector}" was reused across two different buttons`
    );
    seenSelectors.add(selector);

    const matches = document.querySelectorAll(selector);
    assert.equal(matches.length, 1, `selector "${selector}" should resolve to exactly one element`);
    assert.equal(matches[0], target);
  }
});

// Regression test for a bug where every anchor builder (id/data-testid/
// name/aria-label, both the direct-element case and the ancestor-climbing
// case) keyed its uniqueness-index lookup on the *trimmed* attribute value
// but then embedded that same *trimmed* value into the actual CSS selector
// string. A CSS attribute selector requires an exact match against the
// real (untrimmed) DOM attribute, so whenever the real attribute had
// leading/trailing whitespace, the built selector could never match its
// own element — el.matches(candidate) correctly returned false, and the
// element fell through to buildSimpleSelector's bare-tag-name fallback.
// Found 2026-08-02 via the cross-engine comparisons project on Slack's
// real homepage: several role="region" promo cards have a templated
// aria-label ending in a trailing ", " (string-concatenation artifact),
// which degraded 7 otherwise-uniquely-anchorable elements to the bare
// selector "header" — a selector that resolves to the *first* <header> on
// the whole page (the real site banner), not any of the 7 actual elements.
test('buildSelector: an aria-label anchor with leading/trailing whitespace on the target itself resolves uniquely', () => {
  const { helpers, document } = helpersFor(`<!doctype html><html><body>
    <button aria-label=" Save draft ">Save</button>
    <button aria-label="Discard">Discard</button>
  </body></html>`);

  const target = document.querySelector('button[aria-label=" Save draft "]');
  const selector = helpers.buildSelector(target);

  assert.notEqual(selector, 'button', 'must not degrade to the bare, non-unique tag-name fallback');
  const matches = document.querySelectorAll(selector);
  assert.equal(matches.length, 1, `selector "${selector}" should resolve to exactly one element`);
  assert.equal(matches[0], target);
});

test('buildSelector: an aria-label anchor with leading/trailing whitespace on an ANCESTOR resolves uniquely (the Slack promo-card shape)', () => {
  const { helpers, document } = helpersFor(`<!doctype html><html><body>
    <div aria-label="New Feature, Partner Apps MCP Connect your tools., ">
      <figure><img alt=""></figure>
      <header><h3>Partner Apps MCP</h3></header>
    </div>
    <div aria-label="New Feature, Slackbot Memory remembers context., ">
      <figure><img alt=""></figure>
      <header><h3>Slackbot Memory</h3></header>
    </div>
  </body></html>`);

  const headers = Array.from(document.querySelectorAll('header'));
  assert.equal(headers.length, 2);

  const seenSelectors = new Set();
  for (const target of headers) {
    const selector = helpers.buildSelector(target);
    assert.notEqual(
      selector,
      'header',
      'must not degrade to the bare, non-unique tag-name fallback'
    );
    assert.ok(
      !seenSelectors.has(selector),
      `selector "${selector}" was reused across two different headers`
    );
    seenSelectors.add(selector);

    const matches = document.querySelectorAll(selector);
    assert.equal(matches.length, 1, `selector "${selector}" should resolve to exactly one element`);
    assert.equal(matches[0], target);
  }
});

test('buildSelector: an id with leading/trailing whitespace resolves uniquely via the direct id anchor', () => {
  const { helpers, document } = helpersFor(`<!doctype html><html><body>
    <div id=" padded-id "><span id="inner">content</span></div>
  </body></html>`);

  const target = document.querySelector('[id=" padded-id "]');
  const selector = helpers.buildSelector(target);
  const matches = document.querySelectorAll(selector);
  assert.equal(matches.length, 1, `selector "${selector}" should resolve to exactly one element`);
  assert.equal(matches[0], target);
});

test('buildSelector: every generated selector across many repeated sibling groups resolves uniquely', () => {
  // A denser version of the same shape (many repeated <section> groups with
  // no identifying attributes anywhere), exercising every sibling position.
  const sectionsHtml = Array.from(
    { length: 8 },
    (_, i) => `<section><div class="target">item ${i}</div></section>`
  ).join('\n');
  const { helpers, document } = helpersFor(
    `<!doctype html><html><body><div class="grid">${sectionsHtml}</div></body></html>`
  );

  const targets = Array.from(document.querySelectorAll('.target'));
  assert.equal(targets.length, 8);

  for (const target of targets) {
    const selector = helpers.buildSelector(target);
    const matches = document.querySelectorAll(selector);
    assert.equal(matches.length, 1, `selector "${selector}" should resolve to exactly one element`);
    assert.equal(matches[0], target);
  }
});
