'use strict';

/**
 * profileExclusions (src/coverage/standards.js): what a profile's
 * `exclude: { rules, criteria }` leaves out, and what the build refuses.
 * A stand-in standard is registered for each test and removed after it.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { NORMATIVE_STANDARDS, profileExclusions } = require('../../src/coverage/standards.js');

const RULES = [
  { ruleId: 'only-338', wcagSc: ['3.3.8'] },
  { ruleId: 'both', wcagSc: ['3.3.8', '1.1.1'] },
  { ruleId: 'other', wcagSc: ['1.1.1'] },
  { ruleId: 'mapped', wcagSc: [] }
];
const ROLLUPS = [
  { id: 'wcag-3.3.8-x', wcagSc: ['3.3.8'] },
  { id: 'wcag-1.1.1-x', wcagSc: ['1.1.1'] }
];

function withStandard(exclude, fn) {
  NORMATIVE_STANDARDS.push({
    key: 'stand-in',
    standard: 'Stand-in',
    versions: ['1'],
    profiles: { 'stand-in-1': { version: '1', tags: [], mappedRules: true, exclude } },
    mappingsFor: ({ id }) =>
      id === 'mapped' ? [{ standard: 'Stand-in', version: '1', requirement: 'R', title: 'R', wcagSc: [] }] : []
  });
  try {
    return fn();
  } finally {
    NORMATIVE_STANDARDS.pop();
  }
}

test('a waived criterion takes its rollup and the rules that check nothing else', () => {
  const out = withStandard({ criteria: ['3.3.8'] }, () => profileExclusions(RULES, ROLLUPS));
  assert.deepEqual(out['stand-in-1'], {
    rules: [],
    criteria: ['3.3.8'],
    ruleIds: ['only-338'],
    rollupIds: ['wcag-3.3.8-x']
  });
});

test('named rules are excluded as they are, and profiles without exclude are absent', () => {
  const out = withStandard({ rules: ['other'] }, () => profileExclusions(RULES, ROLLUPS));
  assert.deepEqual(out['stand-in-1'].ruleIds, ['other']);
  assert.deepEqual(out['stand-in-1'].rollupIds, []);
  assert.equal(out['rgaa-4.1.2'], undefined, 'RGAA excludes nothing');
});

test('the build refuses an unknown rule or criterion, and excluding a rule it maps', () => {
  assert.throws(
    () => withStandard({ rules: ['nope'] }, () => profileExclusions(RULES, ROLLUPS)),
    /stand-in-1: exclude\.rules names nope, which is no rule/
  );
  assert.throws(
    () => withStandard({ criteria: ['9.9.9'] }, () => profileExclusions(RULES, ROLLUPS)),
    /stand-in-1: exclude\.criteria names 9\.9\.9, which no rule or rollup checks/
  );
  assert.throws(
    () => withStandard({ rules: ['mapped'] }, () => profileExclusions(RULES, ROLLUPS)),
    /stand-in-1: excludes mapped, which its standard maps for the same version/
  );
});
