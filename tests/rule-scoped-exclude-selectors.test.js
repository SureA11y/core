'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');
const { runa11yCoreOnHtml, createDom, runa11yCoreOnDom } = require('./helpers/runa11yCoreOnHtml');
const { assertRule } = require('./helpers/assertRule');
const { createDomHelpers } = require('../src/core/dom-helpers.js');

/**
 * Coverage for issue #1: engineOptions.rules[ruleId].excludeSelectors --
 * a rule-scoped exclude list that narrows candidates for exactly one rule,
 * on top of (never instead of) the existing global engineOptions.excludeSelectors.
 *
 * `aria-required-children` and `img-alt-present` are used as the two
 * "different rules" throughout: they query disjoint selectors ([role] vs
 * img), so failures on one never accidentally depend on the other.
 */

// ---------------------------------------------------------------------------
// Engine-level (end-to-end) behavior
// ---------------------------------------------------------------------------

test('rule-scoped excludeSelectors narrows candidates for the targeted rule only, leaving other rules unaffected', () => {
  const html = `
    <!doctype html>
    <html><body>
      <div role="list" class="widget"></div>
      <img class="widget" src="x.png">
    </body></html>
  `;

  const result = runa11yCoreOnHtml(html, {
    rules: {
      'aria-required-children': { excludeSelectors: ['.widget'] }
    }
  });

  // The only [role="list"] candidate is excluded for THIS rule -> no candidates at all.
  assertRule(result, 'aria-required-children', 'notApplicable', { maxOccurrences: 0 });

  // img-alt-present has no rule-scoped exclude configured -- the same .widget
  // element must still be evaluated normally and fail.
  assertRule(result, 'img-alt-present', 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test('a rule whose only would-be-failing element is rule-scoped-excluded reports notApplicable, never fail with empty occurrences', () => {
  const html = `
    <!doctype html>
    <html><body>
      <div role="list" class="matselect"></div>
    </body></html>
  `;

  const result = runa11yCoreOnHtml(html, {
    rules: {
      'aria-required-children': { excludeSelectors: ['.matselect'] }
    }
  });

  const rule = result.checksResults.find((r) => r.ruleId.endsWith('aria-required-children'));
  assert.ok(rule, 'aria-required-children should be present in results');
  assert.notStrictEqual(
    rule.outcome,
    'fail',
    'outcome:"fail" + occurrences:[] is reserved for a thrown rule, never this'
  );
  assert.ok(
    ['pass', 'notApplicable'].includes(rule.outcome),
    `expected pass/notApplicable, got ${rule.outcome}`
  );
  assert.strictEqual(rule.occurrences.length, 0);
});

test('global excludeSelectors and rule-scoped excludeSelectors combine as a union', () => {
  const html = `
    <!doctype html>
    <html><body>
      <img id="g" class="g-exclude" src="g.png">
      <img id="r" class="r-exclude" src="r.png">
      <img id="n" src="n.png">
    </body></html>
  `;

  const result = runa11yCoreOnHtml(html, {
    excludeSelectors: ['.g-exclude'],
    rules: {
      'img-alt-present': { excludeSelectors: ['.r-exclude'] }
    }
  });

  // Both the globally-excluded (#g) and rule-scoped-excluded (#r) images must
  // be dropped -- only #n (excluded by neither) should surface as a failure.
  const rule = assertRule(result, 'img-alt-present', 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.ok(rule.occurrences[0].html.includes('n.png'));
});

test('rule-scoped excludeSelectors accepts a comma-separated string, same as global excludeSelectors', () => {
  const html = `
    <!doctype html>
    <html><body>
      <img class="a" src="a.png">
      <img class="b" src="b.png">
      <img class="n" src="n.png">
    </body></html>
  `;

  const result = runa11yCoreOnHtml(html, {
    rules: {
      'img-alt-present': { excludeSelectors: '.a, .b' }
    }
  });

  const rule = assertRule(result, 'img-alt-present', 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.ok(rule.occurrences[0].html.includes('n.png'));
});

test('omitting engineOptions.rules entirely is fully backward compatible', () => {
  const html = `
    <!doctype html>
    <html><body>
      <div role="list" class="widget"></div>
      <img class="widget" src="x.png">
    </body></html>
  `;

  // No `rules` option at all -- both rules report exactly as before this
  // feature existed. aria-required-children is capped at cantTell in its own
  // right; what matters here is that it still evaluates the element.
  const result = runa11yCoreOnHtml(html);

  assertRule(result, 'aria-required-children', 'cantTell', { minOccurrences: 1 });
  assertRule(result, 'img-alt-present', 'fail', { minOccurrences: 1 });
});

test('engineOptions.rules entries for unrelated rule IDs do not affect a rule with no entry of its own', () => {
  const html = `
    <!doctype html>
    <html><body>
      <img class="widget" src="x.png">
    </body></html>
  `;

  const result = runa11yCoreOnHtml(html, {
    rules: {
      'some-other-rule-id': { excludeSelectors: ['.widget'] }
    }
  });

  // img-alt-present has no entry under engineOptions.rules -- must still fail.
  assertRule(result, 'img-alt-present', 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test('rule-scoped excludeSelectors combines correctly with contextSelector', () => {
  const html = `
    <!doctype html>
    <html><body>
      <main id="app">
        <img class="widget" src="x.png">
        <img id="plain" src="y.png">
      </main>
      <img id="outside" src="z.png">
    </body></html>
  `;

  const result = runa11yCoreOnHtml(html, {
    contextSelector: '#app',
    rules: {
      'img-alt-present': { excludeSelectors: ['.widget'] }
    }
  });

  // #outside is dropped by contextSelector; .widget is dropped by the
  // rule-scoped exclude; only #plain should remain as a failure.
  const rule = assertRule(result, 'img-alt-present', 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.ok(rule.occurrences[0].html.includes('y.png'));
});

test('rule-scoped excludeSelectors reaches into shadow DOM content (shadow-piercing, same as global excludeSelectors)', () => {
  const dom = createDom(`
    <!doctype html>
    <html><body>
      <div id="host"></div>
    </body></html>
  `);

  const host = dom.window.document.getElementById('host');
  host.setAttribute('class', 'widget');
  host.attachShadow({ mode: 'open' }).innerHTML = `<img src="shadow.png">`;

  const result = runa11yCoreOnDom(dom, {
    rules: {
      'img-alt-present': { excludeSelectors: ['.widget'] }
    }
  });

  // The shadow host matches .widget -- the <img> inside its shadow root is a
  // descendant of an excluded subtree and must not be reported.
  assertRule(result, 'img-alt-present', 'notApplicable', { maxOccurrences: 0 });
});

test('two rules with their own distinct rule-scoped excludeSelectors do not cross-contaminate in either direction', () => {
  const html = `
    <!doctype html>
    <html><body>
      <div role="list" class="excl-for-a"></div>
      <div role="list" class="excl-for-b"></div>
      <img class="excl-for-a" src="a.png">
      <img class="excl-for-b" src="b.png">
    </body></html>
  `;

  const result = runa11yCoreOnHtml(html, {
    rules: {
      'aria-required-children': { excludeSelectors: ['.excl-for-a'] },
      'img-alt-present': { excludeSelectors: ['.excl-for-b'] }
    }
  });

  // aria-required-children: .excl-for-a div is excluded FOR THIS RULE; the
  // .excl-for-b div (excluded only for img-alt-present) must still be
  // evaluated and reported here.
  const ruleA = assertRule(result, 'aria-required-children', 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.ok(ruleA.occurrences[0].html.includes('excl-for-b'));

  // img-alt-present: .excl-for-b img is excluded FOR THIS RULE; the
  // .excl-for-a img (excluded only for aria-required-children) must still fail here.
  const ruleB = assertRule(result, 'img-alt-present', 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.ok(ruleB.occurrences[0].html.includes('excl-for-a'));
});

// ---------------------------------------------------------------------------
// Low-level dom-helpers.js unit tests (direct createDomHelpers)
// ---------------------------------------------------------------------------

test('dom helpers: __setActiveRuleExcludeSelectors adds to (unions with), not replaces, the global excludeSelectors', () => {
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <div id="g" class="g-exclude"></div>
      <div id="r" class="r-exclude"></div>
      <div id="n"></div>
    </body></html>`,
    { pretendToBeVisual: true }
  );
  const { window } = dom;
  const { document } = window;

  const helpers = createDomHelpers({
    window,
    document,
    root: document,
    excludeSelectors: ['.g-exclude']
  });

  const g = document.getElementById('g');
  const r = document.getElementById('r');
  const n = document.getElementById('n');

  assert.strictEqual(helpers.isExcluded(g), true, 'globally-excluded element stays excluded');
  assert.strictEqual(
    helpers.isExcluded(r),
    false,
    'not yet excluded before activating a rule-scoped list'
  );
  assert.strictEqual(helpers.isExcluded(n), false);

  helpers.__setActiveRuleExcludeSelectors(['.r-exclude']);

  assert.strictEqual(
    helpers.isExcluded(g),
    true,
    'global exclude still applies once a rule-scoped list is active'
  );
  assert.strictEqual(helpers.isExcluded(r), true, 'rule-scoped exclude now applies');
  assert.strictEqual(helpers.isExcluded(n), false);

  const found = helpers.queryAllSmart('div').map((el) => el.id);
  assert.deepStrictEqual(found.sort(), ['n']);
});

test('dom helpers: __setActiveRuleExcludeSelectors(null) clears rule-scoped excludes back to global-only', () => {
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <div id="r" class="r-exclude"></div>
    </body></html>`,
    { pretendToBeVisual: true }
  );
  const { window } = dom;
  const { document } = window;

  const helpers = createDomHelpers({ window, document, root: document });
  const r = document.getElementById('r');

  helpers.__setActiveRuleExcludeSelectors(['.r-exclude']);
  assert.strictEqual(helpers.isExcluded(r), true);

  helpers.__setActiveRuleExcludeSelectors(null);
  assert.strictEqual(
    helpers.isExcluded(r),
    false,
    'clearing the active rule must fully restore global-only behavior'
  );
});

test('dom helpers: shadow-root discovery cache is bypassed while a rule-scoped exclude is active, even with empty global excludeSelectors', () => {
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <div id="host" class="widget"></div>
    </body></html>`,
    { pretendToBeVisual: true }
  );
  const { window } = dom;
  const { document } = window;

  const host = document.getElementById('host');
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = '<button id="shadowBtn">Shadow</button>';

  let starScans = 0;
  const originalDocQSA = document.querySelectorAll.bind(document);
  document.querySelectorAll = (sel, ...rest) => {
    if (String(sel) === '*') starScans++;
    return originalDocQSA(sel, ...rest);
  };

  // No global excludeSelectors -- only a rule-scoped one, set active below.
  const helpers = createDomHelpers({ window, document, root: document, includeShadowDom: true });
  helpers.__setActiveRuleExcludeSelectors(['.widget']);

  const before1 = starScans;
  helpers.queryAllDeep('button');
  const after1 = starScans;
  assert.ok(after1 > before1, 'first deep query should scan for shadow hosts');

  const before2 = starScans;
  helpers.queryAllDeep('button');
  const after2 = starScans;
  assert.ok(
    after2 > before2,
    'second deep query must scan again -- discovery caching must stay off while a rule-scoped exclude is active'
  );
});

test('dom helpers: switching the active rule (as dom-runner.js does between rules) never leaks a stale shadow-root cache into the next rule', () => {
  // Reproduces dom-runner.js's actual usage pattern: ONE shared helpers
  // instance, __setActiveRuleExcludeSelectors called before each "rule".
  const dom = new JSDOM(
    `<!doctype html><html><body>
      <div id="host" class="widget"></div>
    </body></html>`,
    { pretendToBeVisual: true }
  );
  const { window } = dom;
  const { document } = window;

  const host = document.getElementById('host');
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = '<button id="shadowBtn">Shadow</button>';

  const helpers = createDomHelpers({ window, document, root: document, includeShadowDom: true });

  // "Rule A" excludes .widget -- must not see the shadow button at all.
  helpers.__setActiveRuleExcludeSelectors(['.widget']);
  const foundByRuleA = helpers.queryAllDeep('button').map((el) => el.id);
  assert.deepStrictEqual(
    foundByRuleA,
    [],
    'rule A excludes the shadow host, so it must not see its shadow content'
  );

  // "Rule B" has no rule-scoped exclude -- must see the shadow button,
  // regardless of whatever shadow-root discovery rule A cached (or didn't).
  helpers.__setActiveRuleExcludeSelectors(null);
  const foundByRuleB = helpers.queryAllDeep('button').map((el) => el.id);
  assert.deepStrictEqual(
    foundByRuleB,
    ['shadowBtn'],
    'rule B must independently discover the shadow button -- no leaked cache from rule A'
  );
});
