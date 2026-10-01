'use strict';

/**
 * validateProfileIndependence (src/coverage/standards.js): a standard maps
 * core's rules and its own, and derives variants from them, never from
 * another standard's opt-in rules. A stand-in standard is registered for each
 * test and removed after it.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  NORMATIVE_STANDARDS,
  validateProfileIndependence
} = require('../../src/coverage/standards.js');

const RULES = [
  { ruleId: 'core-rule', wcagSc: ['1.1.1'], tags: ['wcag2a'] },
  { ruleId: 'rgaa-only', wcagSc: [], tags: ['rgaa'] },
  { ruleId: 'own-rule', wcagSc: [], tags: ['stand-in'] }
];

function withStandard(mapped, fn) {
  NORMATIVE_STANDARDS.push({
    key: 'stand-in',
    standard: 'Stand-in',
    versions: ['1'],
    ruleTag: 'stand-in',
    mappingsFor: ({ id }) =>
      mapped.includes(id)
        ? [{ standard: 'Stand-in', version: '1', requirement: 'R', title: 'R', wcagSc: [] }]
        : []
  });
  try {
    return fn();
  } finally {
    NORMATIVE_STANDARDS.pop();
  }
}

const mine = (problems) => problems.filter((p) => p.startsWith('stand-in'));

test("mapping core's rules and its own is fine", () => {
  assert.deepEqual(
    withStandard(['core-rule', 'own-rule'], () => mine(validateProfileIndependence(RULES))),
    []
  );
});

test("mapping another standard's opt-in rule is refused, naming it", () => {
  assert.deepEqual(
    withStandard(['rgaa-only'], () => mine(validateProfileIndependence(RULES))),
    ['stand-in maps rgaa-only, a rule of the standard tagged rgaa: map a core rule or one of its own']
  );
});

test("a variant of another standard's rule is refused", () => {
  const rules = RULES.concat([
    { ruleId: 'own-variant', wcagSc: [], tags: ['stand-in'], variantOf: 'rgaa-only' },
    { ruleId: 'fine-variant', wcagSc: [], tags: ['stand-in'], variantOf: 'core-rule' }
  ]);
  assert.deepEqual(
    withStandard([], () => mine(validateProfileIndependence(rules))),
    ["stand-in's own-variant is a variant of rgaa-only, a rule of the standard tagged rgaa"]
  );
});

test('the real registry has no cross-profile dependency', () => {
  const core = require('../../src/index.js');
  const rules = core
    .getChecksCatalog()
    .map((r) => ({ ruleId: r.ruleId, wcagSc: r.wcagSc || [], tags: r.tags || [] }));
  assert.deepEqual(validateProfileIndependence(rules), []);
});
