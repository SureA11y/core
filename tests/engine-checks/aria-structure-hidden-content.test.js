'use strict';

// aria-required-children, aria-required-parent and aria-prohibited-children
// judged content under aria-hidden when an aria-labelledby used its text, or
// when it was focusable: isAccTreeEligible lifts aria-hidden for those, so a
// name can be worked out from hidden text. ACT scopes these rules to
// elements included in the accessibility tree, and using an element's text
// for a name doesn't put the element in it, so they now leave such content
// out (isIncludedInAccessibilityTree), as the name rules already do.
//
// The same lift made verdicts depend on rule order: with an aria-labelledby
// cycle in hidden content, an answer worked out inside the cycle was cached
// as final, so whichever element was asked first decided for the rest, and a
// rule gave one verdict alone and another in a full scan. Such an answer is
// no longer cached.

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../../src/testing.js');

const RULES = ['aria-required-children', 'aria-required-parent', 'aria-prohibited-children'];

const page = (body) =>
  `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;

function outcomes(html, runOnly) {
  const result = runa11yCoreOnHtml(html, { runOnly, entryPointParity: false });
  return Object.fromEntries(result.checksResults.map((c) => [c.ruleId, c.outcome]));
}

const CYCLE =
  '<div aria-hidden="true"><dl id="d" role="rowgroup" aria-labelledby="b">I</dl><area id="a">' +
  '<input aria-labelledby="c" id="b"><input aria-labelledby="x a" id="c">' +
  '<span id="x" aria-labelledby="d">T</span></div>';

test('an aria-labelledby cycle in hidden content gives the same verdicts alone as in a full scan', () => {
  const full = outcomes(page(CYCLE));
  for (const ruleId of [...RULES, 'region', 'label-in-name']) {
    assert.equal(outcomes(page(CYCLE), [ruleId])[ruleId], full[ruleId], ruleId);
  }
  for (const ruleId of RULES) assert.equal(full[ruleId], 'notApplicable', ruleId);
});

test('hidden content an aria-labelledby uses is left out of the ARIA structure rules', () => {
  const list =
    '<main><div aria-hidden="true"><div role="list" id="l">Shipping</div></div><input aria-labelledby="l"></main>';
  const item =
    '<main><div aria-hidden="true"><div role="listitem" id="l">Shipping</div></div><input aria-labelledby="l"></main>';
  for (const html of [list, item]) {
    for (const [ruleId, outcome] of Object.entries(outcomes(page(html), RULES))) {
      assert.equal(outcome, 'notApplicable', ruleId);
    }
  }
});

test('the same structure in view is still judged', () => {
  const got = outcomes(
    page('<main><div role="list">Shipping</div><div role="listitem">x</div></main>'),
    RULES
  );
  assert.equal(got['aria-required-children'], 'cantTell');
  assert.equal(got['aria-required-parent'], 'fail');
});
