'use strict';

const assert = require('node:assert');

function assertRule(result, ruleId, expectedOutcome, opts = {}) {
  const { minOccurrences = 0, maxOccurrences = null } = opts;

  assert.ok(result && typeof result === 'object', 'Expected result to be an object');
  assert.ok(Array.isArray(result.checksResults), 'Expected result.checks to be an array');

  const engineTag =
      result.engine && typeof result.engine.tag === 'string' && result.engine.tag.trim()
          ? result.engine.tag.trim()
          : null;

  const candidates = [ruleId];

  // If caller passed an unprefixed id like "manual-review", also try "a11ycore-manual-review"
  if (engineTag && !ruleId.startsWith(engineTag + '-')) {
    candidates.push(`${engineTag}-${ruleId}`);
  }

  const rule = result.checksResults.find((r) => r && candidates.includes(r.ruleId));
  assert.ok(rule, `Expected to find rule ${ruleId} in result.checksResults`);

  assert.strictEqual(
      rule.outcome,
      expectedOutcome,
      `Expected ${rule.ruleId} outcome to be ${expectedOutcome}, got ${rule.outcome}`
  );

  const occs = Array.isArray(rule.occurrences) ? rule.occurrences : [];
  assert.ok(
      occs.length >= minOccurrences,
      `Expected ${rule.ruleId} to have at least ${minOccurrences} occurrences, got ${occs.length}`
  );

  if (maxOccurrences != null) {
    assert.ok(
        occs.length <= maxOccurrences,
        `Expected ${rule.ruleId} to have <= ${maxOccurrences} occurrences, got ${occs.length}`
    );
  }

  return rule;
}

module.exports = { assertRule };
