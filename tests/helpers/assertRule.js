'use strict';

const assert = require('node:assert');

/**
 * Assert a single rule result in a a11yCore result object.
 *
 * Expected shape (minimum):
 *   {
 *     rules: [
 *       { ruleId, outcome, occurrences: [...] }
 *     ]
 *   }
 *
 * @param {object} result - output from runa11yCoreOnHtml(...)
 * @param {string} ruleId - e.g. 'a11yCore-img-alt'
 * @param {string} expectedOutcome - 'fail' | 'pass' | 'cantTell' | 'notApplicable'
 * @param {object} opts
 *   minOccurrences: number (default 0)
 *   maxOccurrences: number (optional)
 * @returns {object} the matching rule result object
 */
function assertRule(result, ruleId, expectedOutcome, opts = {}) {
  const { minOccurrences = 0, maxOccurrences = null } = opts;

  assert.ok(result && typeof result === 'object', 'Expected result to be an object');
  assert.ok(Array.isArray(result.rules), 'Expected result.rules to be an array');

  const rule = result.rules.find((r) => r && r.ruleId === ruleId);
  assert.ok(rule, `Expected to find rule ${ruleId} in result.rules`);

  assert.strictEqual(
    rule.outcome,
    expectedOutcome,
    `Expected ${ruleId} outcome to be ${expectedOutcome}, got ${rule.outcome}`
  );

  const occs = Array.isArray(rule.occurrences) ? rule.occurrences : [];
  assert.ok(
    occs.length >= minOccurrences,
    `Expected ${ruleId} to have at least ${minOccurrences} occurrences, got ${occs.length}`
  );

  if (maxOccurrences != null) {
    assert.ok(
      occs.length <= maxOccurrences,
      `Expected ${ruleId} to have <= ${maxOccurrences} occurrences, got ${occs.length}`
    );
  }

  return rule;
}

module.exports = { assertRule };
