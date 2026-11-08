'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../helpers/runa11yCoreOnHtml');

// The walk up from an element reads every ancestor up to 10,000, far past
// any nesting a browser renders. It stopped at 200: an element deeper than
// that was judged without what lies above, and a fail on it became a
// cantTell. Hidden content stays hidden however deep it is, and a fail
// stays a fail.
const SHELL = '<!doctype html><html lang="en"><head><title>t</title></head><body>';
const CONTENT = '<img src="x.png"><button></button><input type="text">';

function scan(depth, wrapperAttrs) {
  const body =
    `<div ${wrapperAttrs}>` + '<div>'.repeat(depth) + CONTENT + '</div>'.repeat(depth) + '</div>';
  const result = runa11yCoreOnHtml(SHELL + body + '</body></html>', {
    engineOptions: { perfStats: true }
  });

  const outcomeOf = (ruleId) => {
    const rule = result.checksResults.find((r) => r.ruleId === ruleId);
    return rule ? rule.outcome : 'absent';
  };

  return {
    outcomeOf,
    result,
    truncations: result.perfStats.counters['ancestorsIncludingSelf.truncated'] || 0
  };
}

test('content hidden from far above is hidden, however deep', () => {
  for (const depth of [10, 250]) {
    const { outcomeOf } = scan(depth, 'aria-hidden="true"');
    for (const ruleId of ['img-alt-present', 'button-name-present']) {
      assert.equal(outcomeOf(ruleId), 'notApplicable', `${ruleId} at ${depth}`);
    }
  }
});

test('depth alone does not weaken a finding', () => {
  const { outcomeOf, result } = scan(250, '');
  for (const ruleId of ['img-alt-present', 'button-name-present']) {
    assert.equal(outcomeOf(ruleId), 'fail', ruleId);
  }
  assert.ok(result.checksResults.every((r) => !r.ancestorWalkLimit));
});

test('a walk of a few hundred levels reaches the root', () => {
  assert.equal(scan(10, '').truncations, 0);
  assert.equal(scan(400, '').truncations, 0);
});
