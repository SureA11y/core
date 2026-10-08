'use strict';

/**
 * A margin is not a finding (docs/OUTPUT_SCHEMA.md): the output formats built
 * from findings ignore it. The same scan result, with and without a margin on
 * a passing and on a failing check, renders to the same SARIF, JUnit and EARL,
 * and gives the same baseline entries and baseline matches.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { renderSarifReport } = require('../../src/sarif.js');
const { renderJunitReport } = require('../../src/junit.js');
const { renderEarlReport } = require('../../src/earl.js');
const { buildBaselineEntries, matchBaseline } = require('../../src/baseline.js');
const { makeCheckResult, makeScanResult } = require('../helpers/fake-result');

function scanResult(withMargin) {
  const margin = (measure, unit, limit, threshold, value) => ({
    measure,
    unit,
    limit,
    threshold,
    value,
    headroom: Math.round(Math.abs(threshold - value) * 10) / 10,
    measuredCount: 3,
    selector: '#closest',
    structuralPath: [0, 1, 2],
    context: { text: 'Opening hours' }
  });
  const passing = makeCheckResult({
    ruleId: 'text-spacing-content-loss',
    outcome: 'pass',
    occurrences: []
  });
  const failing = makeCheckResult({ ruleId: 'contrast-minimum' });
  if (withMargin) {
    passing.margin = margin('overflow-px', 'px', 'max', 7.5, 6.9);
    failing.margin = margin('contrast-ratio', 'ratio', 'min', 4.5, 4.52);
  }
  return makeScanResult([passing, failing]);
}

test('margin: SARIF, JUnit and EARL render the same with or without one', () => {
  const plain = scanResult(false);
  const withMargin = scanResult(true);
  assert.equal(renderSarifReport(withMargin, {}), renderSarifReport(plain, {}));
  assert.equal(renderJunitReport(withMargin, {}), renderJunitReport(plain, {}));
  assert.deepEqual(renderEarlReport(withMargin, {}), renderEarlReport(plain, {}));
});

test('margin: baseline entries and matches are the same with or without one', () => {
  const plain = scanResult(false);
  const withMargin = scanResult(true);
  const entries = buildBaselineEntries(plain);
  assert.ok(entries.length > 0, 'the failing check gives a baseline entry');
  assert.deepEqual(buildBaselineEntries(withMargin), entries);
  assert.deepEqual(matchBaseline(withMargin, entries), matchBaseline(plain, entries));
});
