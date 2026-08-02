'use strict';

const assert = require('node:assert/strict');

function assertCompositeRule(result, compositeId, expectedOutcome) {
  assert.ok(result && typeof result === 'object', 'Expected result to be an object');
  assert.ok(Array.isArray(result.checksResults), 'Expected result.checksResults to be an array');

  const cr = result.checksResults.find((r) => r && r.ruleId === compositeId);
  assert.ok(cr, `Expected composite rule "${compositeId}" to exist in rulesResults`);

  assert.equal(
    cr.outcome,
    expectedOutcome,
    `Expected composite "${compositeId}" outcome=${expectedOutcome}, got=${cr.outcome}`
  );

  return cr;
}

module.exports = { assertCompositeRule };
