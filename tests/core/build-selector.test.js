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
// (jsdom does not implement CSS.escape), so this fallback is not
// a rare edge case, it's the one path exercised by every selector this
// engine ever builds. The old fallback only escaped individual disallowed
// characters and didn't handle CSS's "identifier can't start with an
// unescaped digit" rule, so an ID like a UUID produced an
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
// A real-world shape: several role="region" promo cards have a templated
// aria-label ending in a trailing ", " (string-concatenation artifact),
// which degraded 7 otherwise-uniquely-anchorable elements to the bare
// selector "header" — a selector that resolves to the *first* <header> on
// the whole page (the site banner), not any of the 7 actual elements.
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

test('buildSelector: an aria-label anchor with leading/trailing whitespace on an ANCESTOR resolves uniquely', () => {
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

// Regression coverage for the same raw-vs-trimmed class of bug the tests
// above cover for buildSelectorUncached's anchor builders, found while
// extending this suite: buildSimpleSelector (the final bare-tag/attribute
// fallback used once every other anchor strategy fails) independently
// re-implemented id/data-testid/name anchoring and embedded the *trimmed*
// attribute value in the selector string while only checking (not using)
// the trimmed value for id/data-testid — so an element whose id, testid, or
// name attribute had leading/trailing whitespace got a selector that could
// never match it, silently pointing at nothing (or the wrong element) for
// any caller that re-resolves the string via querySelector.
test('buildSimpleSelector: an id with leading/trailing whitespace resolves to the real element', () => {
  const { helpers, document } = helpersFor(`<!doctype html><html><body>
    <div id=" padded-id ">content</div>
  </body></html>`);

  const target = document.querySelector('[id=" padded-id "]');
  const selector = helpers.buildSimpleSelector(target, 'div');
  assert.equal(document.querySelector(selector), target);
});

test('buildSimpleSelector: a data-testid with leading/trailing whitespace resolves to the real element', () => {
  const { helpers, document } = helpersFor(`<!doctype html><html><body>
    <div data-testid=" promo, ">content</div>
  </body></html>`);

  const target = document.querySelector('[data-testid]');
  const selector = helpers.buildSimpleSelector(target, 'div');
  assert.equal(document.querySelector(selector), target);
});

test('buildSimpleSelector: an element with none of id/data-testid/data-test/data-cy/data-qa/name falls back to the bare tag name', () => {
  const { helpers, document } = helpersFor(`<!doctype html><html><body>
    <div class="plain">content</div>
  </body></html>`);

  const target = document.querySelector('.plain');
  const selector = helpers.buildSimpleSelector(target, 'div');
  assert.equal(selector, 'div');
});

test('buildSimpleSelector: a name attribute with leading/trailing whitespace resolves to the real element', () => {
  const { helpers, document } = helpersFor(`<!doctype html><html><body>
    <input name="field, ">
  </body></html>`);

  const target = document.querySelector('input');
  const selector = helpers.buildSimpleSelector(target, 'input');
  assert.equal(document.querySelector(selector), target);
});

// Regression/behavior coverage for buildSelectorUncached's uniqueness-index
// gate (idx.*Count.get(...) === 1): when an id/data-testid/name/aria-label
// value is DUPLICATED across the document (a real, if invalid, pattern --
// duplicate ids in particular are extremely common on real sites despite
// being non-conformant HTML), that attribute must not be used as a
// "this uniquely identifies the element" anchor, since it doesn't.
test('buildSelector: a duplicated id is not used as a unique anchor; the element still resolves via structural fallback', () => {
  const { helpers, document } = helpersFor(`<!doctype html><html><body>
    <section><div id="dup">one</div></section>
    <section><div id="dup">two</div></section>
  </body></html>`);

  const targets = Array.from(document.querySelectorAll('[id="dup"]'));
  assert.equal(targets.length, 2);

  for (const target of targets) {
    const selector = helpers.buildSelector(target);
    assert.notEqual(selector, '#dup', 'a non-unique id must not be used as the anchor');
    const matches = document.querySelectorAll(selector);
    assert.equal(matches.length, 1, `selector "${selector}" should resolve to exactly one element`);
    assert.equal(matches[0], target);
  }
});

test('buildSelector: a duplicated data-testid is not used as a unique anchor', () => {
  const { helpers, document } = helpersFor(`<!doctype html><html><body>
    <section><button data-testid="save">A</button></section>
    <section><button data-testid="save">B</button></section>
  </body></html>`);

  const targets = Array.from(document.querySelectorAll('[data-testid="save"]'));
  for (const target of targets) {
    const selector = helpers.buildSelector(target);
    assert.notEqual(selector, '[data-testid="save"]');
    assert.equal(document.querySelectorAll(selector).length, 1);
    assert.equal(document.querySelector(selector), target);
  }
});

test('buildSelector: a duplicated name (e.g. a real radio-button group) is not used as a unique anchor', () => {
  const { helpers, document } = helpersFor(`<!doctype html><html><body>
    <fieldset>
      <input type="radio" name="plan" id="a" value="basic">
      <input type="radio" name="plan" id="b" value="pro">
    </fieldset>
  </body></html>`);

  const a = document.getElementById('a');
  const b = document.getElementById('b');
  for (const target of [a, b]) {
    const selector = helpers.buildSelector(target);
    assert.notEqual(selector, 'input[name="plan"]');
    assert.equal(document.querySelectorAll(selector).length, 1);
    assert.equal(document.querySelector(selector), target);
  }
});

test('buildSelector: a duplicated aria-label, and a duplicated role+aria-label pair, are not used as unique anchors', () => {
  const { helpers, document } = helpersFor(`<!doctype html><html><body>
    <section><button aria-label="Close">A</button></section>
    <section><button aria-label="Close">B</button></section>
    <section><div role="button" aria-label="Menu">C</div></section>
    <section><div role="button" aria-label="Menu">D</div></section>
  </body></html>`);

  const seen = new Set();
  for (const target of document.querySelectorAll(
    'button[aria-label="Close"], [role="button"][aria-label="Menu"]'
  )) {
    const selector = helpers.buildSelector(target);
    assert.ok(!seen.has(selector), `selector "${selector}" reused across two different elements`);
    seen.add(selector);
    assert.equal(document.querySelectorAll(selector).length, 1);
    assert.equal(document.querySelector(selector), target);
  }
});

// nthOfType's forward-scan (used when this node is the FIRST of its tag among
// siblings) must keep walking past non-matching siblings until it either
// finds a same-tag sibling further along or runs out -- not stop at the
// first sibling it looks at.
test('buildSelector: nthOfType keeps scanning forward past unrelated tags to find a same-tag disambiguating sibling', () => {
  const { helpers, document } = helpersFor(`<!doctype html><html><body>
    <div class="wrap">
      <span>first span</span>
      <p>unrelated</p>
      <em>also unrelated</em>
      <span>second span</span>
    </div>
  </body></html>`);

  // Deliberately no id/data-*/name/aria-label anywhere so buildSelectorUncached
  // is forced all the way down to the nth-of-type structural fallback for the
  // target itself, exercising nthOfType's own forward-scan loop.
  const target = document.querySelector('.wrap span');
  const selector = helpers.buildSelector(target);
  const matches = document.querySelectorAll(selector);
  assert.equal(matches.length, 1, `selector "${selector}" should resolve to exactly one element`);
  assert.equal(matches[0], target);
});

// The ancestor-climbing loop's own anchor builders (id/data-test*/name/
// aria-label on an ANCESTOR, not the target itself) exercise the same
// uniqueness-index lookups as the direct-element anchors above, but via a
// different code path (used once no direct anchor exists on the target).
test('buildSelector: climbs to an ancestor uniquely identified by data-test*/name/aria-label when the target itself has no identifying attributes', () => {
  const { helpers, document } = helpersFor(`<!doctype html><html><body>
    <section data-test="promo-card"><div><span>content</span></div></section>
    <section><div><span>other content</span></div></section>
  </body></html>`);

  const targets = Array.from(document.querySelectorAll('span'));
  assert.equal(targets.length, 2);
  const withAnchor = helpers.buildSelector(targets[0]);
  assert.ok(withAnchor.includes('data-test="promo-card"'));
  assert.equal(document.querySelector(withAnchor), targets[0]);
});

test('buildSelector: climbs to an ancestor uniquely identified by its "name" attribute when no closer anchor exists', () => {
  const { helpers, document } = helpersFor(`<!doctype html><html><body>
    <fieldset name="billing-group"><div><span>content</span></div></fieldset>
    <fieldset><div><span>other content</span></div></fieldset>
  </body></html>`);

  const targets = Array.from(document.querySelectorAll('span'));
  assert.equal(targets.length, 2);
  const withAnchor = helpers.buildSelector(targets[0]);
  assert.ok(withAnchor.includes('fieldset[name="billing-group"]'));
  assert.equal(document.querySelector(withAnchor), targets[0]);
});

// A unique data-test/data-cy/data-qa (NOT data-testid, the first attribute
// tried) used directly as the element's own anchor -- data-testid already has
// dedicated coverage above (including its duplicate-value case); this covers
// the rest of the loop over the four supported test-id-style attributes.
test('buildSelector: a unique data-test attribute (not data-testid) resolves directly as the anchor', () => {
  const { helpers, document } = helpersFor(`<!doctype html><html><body>
    <button data-test="submit-order">Go</button>
    <button>Other</button>
  </body></html>`);

  const target = document.querySelector('[data-test="submit-order"]');
  const selector = helpers.buildSelector(target);
  assert.ok(selector.includes('data-test="submit-order"'));
  assert.equal(document.querySelector(selector), target);
});

// uniqueNameSel/uniqueRoleAriaSel's own unique-vs-duplicate branches, on the
// TARGET element directly (no id anywhere, so id can't short-circuit before
// these anchors are ever consulted).
test('buildSelector: a unique "name" attribute (no id anywhere on the element) resolves directly as the anchor', () => {
  const { helpers, document } = helpersFor(`<!doctype html><html><body>
    <input name="newsletter-opt-in">
    <input name="other-field">
  </body></html>`);

  const target = document.querySelector('input[name="newsletter-opt-in"]');
  const selector = helpers.buildSelector(target);
  assert.equal(selector, 'input[name="newsletter-opt-in"]');
  assert.equal(document.querySelector(selector), target);
});

test('buildSelector: a duplicated "name" attribute with no id anywhere falls through uniqueNameSel to the next anchor strategy', () => {
  const { helpers, document } = helpersFor(`<!doctype html><html><body>
    <input name="dup-field" aria-label="Field A">
    <input name="dup-field" aria-label="Field B">
  </body></html>`);

  const a = document.querySelector('[aria-label="Field A"]');
  const b = document.querySelector('[aria-label="Field B"]');
  for (const target of [a, b]) {
    const selector = helpers.buildSelector(target);
    assert.notEqual(selector, 'input[name="dup-field"]');
    assert.equal(document.querySelector(selector), target);
  }
});

test('buildSelector: a unique role+aria-label pair (no id anywhere) resolves directly via uniqueRoleAriaSel', () => {
  const { helpers, document } = helpersFor(`<!doctype html><html><body>
    <div role="tab" aria-label="Overview">A</div>
    <div role="tab" aria-label="Details">B</div>
  </body></html>`);

  const target = document.querySelector('[aria-label="Overview"]');
  const selector = helpers.buildSelector(target);
  assert.equal(selector, '[role="tab"][aria-label="Overview"]');
  assert.equal(document.querySelector(selector), target);
});

test('buildSelector: repeated calls on the same element hit the per-element selector cache and return the identical string', () => {
  const { helpers, document } = helpersFor(`<!doctype html><html><body>
    <div id="cached">content</div>
  </body></html>`);

  const target = document.getElementById('cached');
  const first = helpers.buildSelector(target);
  const second = helpers.buildSelector(target);
  assert.equal(first, second);
  assert.equal(first, '#cached');
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
