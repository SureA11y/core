'use strict';

/**
 * restatedPrefixes (src/coverage/standards.js): a rule-mapped standard's
 * requirements that restate a WCAG criterion one for one, which the build
 * passes to the runner as data. A stand-in standard is registered for each
 * test and removed after it.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { NORMATIVE_STANDARDS, standardsData } = require('../../src/coverage/standards.js');

function dataFor(entry) {
  NORMATIVE_STANDARDS.push({
    key: 'stand-in',
    standard: 'Stand-in',
    versions: ['1'],
    mappingsFor: () => [],
    ...entry
  });
  try {
    return standardsData().find((s) => s.key === 'stand-in');
  } finally {
    NORMATIVE_STANDARDS.pop();
  }
}

test('a rule-mapped standard passes its restated prefixes on', () => {
  const data = dataFor({ ruleMapped: true, restatedPrefixes: ['A.'] });
  assert.equal(data.ruleMapped, true);
  assert.deepEqual(data.restatedPrefixes, ['A.']);
});

test('without ruleMapped, or without prefixes, there is nothing to pass', () => {
  assert.equal(dataFor({ restatedPrefixes: ['A.'] }).restatedPrefixes, undefined);
  assert.equal(dataFor({ ruleMapped: true }).restatedPrefixes, undefined);
});

test('RGAA restates nothing: every RGAA entry is named only for the rules that decided', () => {
  assert.equal(standardsData().find((s) => s.key === 'rgaa').restatedPrefixes, undefined);
});
