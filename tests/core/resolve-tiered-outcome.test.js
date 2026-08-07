'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');

const { createDomHelpers } = require('../../src/core/dom-helpers.js');

// Regression coverage for helpers.resolveTieredOutcome.
// A rule that collects two independent confidence tiers in one run (some
// findings confident enough for `fail`, others only `cantTell`) used to
// hand-roll "if failOccurrences.length return fail(failOccurrences); else
// if cantTellOccurrences.length return cantTell(cantTellOccurrences)" —
// which silently discards every cantTell-tier finding whenever at least
// one fail-tier finding also exists on the same page. Found in
// aria-prohibited-attr's roleless-naming widening, then confirmed as the
// same architectural gap in aria-hidden-focus (identical two-bucket shape)
// and target-size-minimum (a worse variant that didn't even build
// occurrence objects for the uncertain tier). This helper centralizes the
// correct behavior so a fourth rule doesn't reintroduce the bug.
function getHelpers() {
  const dom = new JSDOM(`<!doctype html><html><body></body></html>`, { pretendToBeVisual: true });
  const { window } = dom;
  const { document } = window;
  return createDomHelpers({ window, document, root: document });
}

test('resolveTieredOutcome: no occurrences at all => pass, empty occurrences, severity forced to minor', () => {
  const helpers = getHelpers();
  const result = helpers.resolveTieredOutcome([], [], 'serious');
  assert.deepStrictEqual(result, { outcome: 'pass', severity: 'minor', occurrences: [] });
});

test('resolveTieredOutcome: only cantTell occurrences => cantTell, exactly those occurrences, requested severity', () => {
  const helpers = getHelpers();
  const cantTells = [{ id: 'c1' }, { id: 'c2' }];
  const result = helpers.resolveTieredOutcome([], cantTells, 'moderate');
  assert.strictEqual(result.outcome, 'cantTell');
  assert.strictEqual(result.severity, 'moderate');
  assert.deepStrictEqual(result.occurrences, [
    { id: 'c1', occurrenceOutcome: 'cantTell' },
    { id: 'c2', occurrenceOutcome: 'cantTell' }
  ]);
});

test('resolveTieredOutcome: only fail occurrences => fail, exactly those occurrences', () => {
  const helpers = getHelpers();
  const fails = [{ id: 'f1' }];
  const result = helpers.resolveTieredOutcome(fails, [], 'minor');
  assert.strictEqual(result.outcome, 'fail');
  assert.deepStrictEqual(result.occurrences, [{ id: 'f1', occurrenceOutcome: 'fail' }]);
});

test('resolveTieredOutcome: both fail and cantTell occurrences => outcome is fail, but BOTH buckets are present in occurrences (the actual bug being fixed)', () => {
  const helpers = getHelpers();
  const fails = [{ id: 'f1' }, { id: 'f2' }];
  const cantTells = [{ id: 'c1' }];
  const result = helpers.resolveTieredOutcome(fails, cantTells, 'moderate');
  assert.strictEqual(result.outcome, 'fail');
  assert.strictEqual(result.severity, 'moderate');
  assert.strictEqual(result.occurrences.length, 3);
  assert.deepStrictEqual(result.occurrences, [
    { id: 'f1', occurrenceOutcome: 'fail' },
    { id: 'f2', occurrenceOutcome: 'fail' },
    { id: 'c1', occurrenceOutcome: 'cantTell' }
  ]);
});

test('resolveTieredOutcome: preserves an explicit occurrenceOutcome already set by the rule', () => {
  const helpers = getHelpers();
  const fails = [{ id: 'f1', occurrenceOutcome: 'fail' }];
  const cantTells = [{ id: 'c1', occurrenceOutcome: 'cantTell' }];
  const result = helpers.resolveTieredOutcome(fails, cantTells, 'moderate');
  assert.deepStrictEqual(result.occurrences, [
    { id: 'f1', occurrenceOutcome: 'fail' },
    { id: 'c1', occurrenceOutcome: 'cantTell' }
  ]);
});

test('resolveTieredOutcome: non-array inputs are treated as empty, never throw', () => {
  const helpers = getHelpers();
  assert.deepStrictEqual(helpers.resolveTieredOutcome(null, undefined, 'minor'), {
    outcome: 'pass',
    severity: 'minor',
    occurrences: []
  });
  assert.doesNotThrow(() => helpers.resolveTieredOutcome(undefined, [{ id: 'c1' }], 'minor'));
});
