'use strict';

/**
 * The margin contract (src/core/margin.js): a rule that declares meta.margin
 * hands over the elements that met its threshold as marginCandidates, and the
 * runner reports the closest as the check result's `margin`. A custom rule is
 * the test vehicle, so the contract is pinned without depending on any
 * built-in rule's measurements; the rules have their own tests.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../helpers/runa11yCoreOnHtml');
const core = require('../../src/index.js');
const { MARGIN_UNITS, MARGIN_LIMITS } = require('../../src/core/margin.js');
const { normalizeRuleMeta } = require('../../src/core/rule-meta.js');

const PAGE = `<!doctype html><html lang="en"><head><title>t</title></head><body>
  <p id="a">A</p><p id="b">B</p><p id="c">C</p><p id="d">D</p>
</body></html>`;

// A rule whose candidates and outcome come from the test. Values are by
// element id, so each test states its measurements in one line.
function probe({ margin, values, threshold = 10, outcome = 'pass', measuredCount, extra }) {
  return {
    id: 'margin-probe',
    meta: {
      title: 'Margin probe',
      description: 'Test rule',
      type: 'automatic',
      ...(margin === undefined ? {} : { margin })
    },
    runInPage: new Function(
      'ctx',
      `const values = ${JSON.stringify(values)};
       const candidates = Object.keys(values).map((id) => ({
         el: ctx.document.getElementById(id),
         value: values[id],
         threshold: ${JSON.stringify(threshold)},
         context: { id }
       }));
       const outcome = ${JSON.stringify(outcome)};
       return {
         outcome,
         occurrences: outcome === 'fail'
           ? [ctx.helpers.reportOccurrence(ctx.document.getElementById('d'), { summary: 'x' })]
           : [],
         marginCandidates: candidates,
         ${measuredCount === undefined ? '' : `measuredCount: ${measuredCount},`}
         ${extra || ''}
       };`
    )
  };
}

function scan(rule, engineOptions = {}) {
  const result = runa11yCoreOnHtml(PAGE, {
    runOnly: { includeRuleIds: ['margin-probe'] },
    engineOptions: { customRules: [rule], ...engineOptions }
  });
  return { result, check: result.checksResults.find((r) => r.ruleId === 'margin-probe') };
}

const MIN_PX = { measure: 'test-px', unit: 'px', limit: 'min' };

test('margin: the candidate with the least headroom is reported', () => {
  const { check } = scan(probe({ margin: MIN_PX, values: { a: 30, b: 12.34, c: 18 } }));
  assert.deepEqual(
    { ...check.margin, structuralPath: undefined },
    {
      measure: 'test-px',
      unit: 'px',
      limit: 'min',
      threshold: 10,
      value: 12.3,
      headroom: 2.3,
      measuredCount: 3,
      selector: check.margin.selector,
      structuralPath: undefined,
      context: { id: 'b' }
    }
  );
  assert.equal(check.margin.selector, '#b');
  assert.ok(Array.isArray(check.margin.structuralPath));
});

test('margin: a tie goes to the element first in document order', () => {
  const { check } = scan(probe({ margin: MIN_PX, values: { c: 11, a: 11, b: 11 } }));
  assert.equal(check.margin.context.id, 'a');
});

test('margin: a max limit counts headroom below the threshold', () => {
  const { check } = scan(
    probe({
      margin: { measure: 'overflow-px', unit: 'px', limit: 'max' },
      values: { a: 2, b: 9.96 }
    })
  );
  assert.equal(check.margin.context.id, 'b');
  assert.equal(check.margin.headroom, 0);
  assert.equal(check.margin.value, 10, 'one decimal');
});

test('margin: a ratio is kept unrounded', () => {
  const { check } = scan(
    probe({
      margin: { measure: 'contrast-ratio', unit: 'ratio', limit: 'min' },
      values: { a: 4.50001234 },
      threshold: 4.5
    })
  );
  assert.equal(check.margin.value, 4.50001234);
  assert.ok(check.margin.headroom > 0 && check.margin.headroom < 0.0001);
});

test('margin: candidates that missed the limit are not candidates', () => {
  const { check } = scan(probe({ margin: MIN_PX, values: { a: 3, b: 25 } }));
  assert.equal(check.margin.context.id, 'b');
  const none = scan(probe({ margin: MIN_PX, values: { a: 3, b: 9.9 } })).check;
  assert.ok(!('margin' in none), 'absent when nothing met the limit, never null or zero');
});

test('margin: measuredCount is the rule’s count when it gives one', () => {
  assert.equal(
    scan(probe({ margin: MIN_PX, values: { a: 20 }, measuredCount: 412 })).check.margin
      .measuredCount,
    412
  );
});

test('margin: it never changes the outcome or the occurrences', () => {
  const { check } = scan(probe({ margin: MIN_PX, values: { a: 20 }, outcome: 'fail' }));
  assert.equal(check.outcome, 'fail');
  assert.equal(check.occurrences.length, 1);
  assert.equal(check.margin.context.id, 'a', 'the closest pass is reported beside the failure');
});

test('margin: without meta.margin there is none, and the rule’s raw fields never reach the result', () => {
  const { check } = scan(
    probe({ values: { a: 20 }, measuredCount: 5, extra: "margin: { made: 'up' }," })
  );
  for (const key of ['margin', 'marginCandidates', 'measuredCount']) {
    assert.ok(!(key in check), key);
  }
  const declared = scan(probe({ margin: MIN_PX, values: { a: 20 } })).check;
  for (const key of ['marginCandidates', 'measuredCount']) assert.ok(!(key in declared), key);
});

test('margin: output.includeSelector false leaves the selector out', () => {
  const { check } = scan(probe({ margin: MIN_PX, values: { a: 20 } }), {
    output: { includeSelector: false }
  });
  assert.ok(!('selector' in check.margin));
  assert.ok(Array.isArray(check.margin.structuralPath));
});

test('meta.margin: only a measure, a known unit and a known limit make a declaration', () => {
  const declared = (margin) => normalizeRuleMeta('r', 'r', { margin }, 'a11ycore').margin;
  for (const unit of MARGIN_UNITS) {
    for (const limit of MARGIN_LIMITS) {
      assert.deepEqual(declared({ measure: ' m ', unit, limit }), { measure: 'm', unit, limit });
    }
  }
  for (const bad of [
    null,
    [],
    'x',
    { unit: 'px', limit: 'min' },
    { measure: 'm', unit: 'em', limit: 'min' },
    { measure: 'm', unit: 'px', limit: 'below' }
  ]) {
    assert.equal(declared(bad), null, JSON.stringify(bad));
  }
  const malformed = scan(
    probe({ margin: { measure: 'm', unit: 'em', limit: 'min' }, values: { a: 20 } })
  );
  assert.ok(!('margin' in malformed.check), 'a malformed declaration gives no margin, not a crash');
});

test('getMargins: every margin in a result, by ruleId, on both entries', () => {
  const { result } = scan(probe({ margin: MIN_PX, values: { a: 20 } }));
  const margins = core.getMargins(result);
  assert.equal(margins.length, 1);
  assert.equal(margins[0].ruleId, 'margin-probe');
  assert.equal(margins[0].headroom, 10);
  assert.deepEqual(core.getMargins(null), []);
  assert.deepEqual(
    core
      .getMargins({
        checksResults: [
          { ruleId: 'z', margin: { headroom: 1 } },
          { ruleId: 'a', margin: { headroom: 2 } },
          { ruleId: 'm' }
        ]
      })
      .map((m) => m.ruleId),
    ['a', 'z']
  );
});
