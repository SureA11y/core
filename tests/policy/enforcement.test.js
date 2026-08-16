'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const core = require('../../src/core'); // generated core.js
const { POLICY_CONTRACTS } = require('../../src/policy/contracts');
const { resolvePolicy } = require('../../src/policy/resolvePolicy');

test('normalizeRuleResult: coerces manual fail to cantTell when enabled', () => {
  if (!core.__internal || typeof core.__internal.normalizeRuleResult !== 'function') {
    assert.fail(
      'core.__internal.normalizeRuleResult is not exported (see Option A in instructions)'
    );
  }

  const normalizeRuleResult = core.__internal.normalizeRuleResult;

  const policy = resolvePolicy(POLICY_CONTRACTS, {
    policyContract: 'a11y',
    policy: { coerceManualFailToCantTell: true }
  });

  const def = {
    ruleId: 'test-manual',
    defaultSeverity: 'moderate',
    defaultConfidence: 'medium',
    type: 'manual',
    ruleInterfaceVersion: '1.0.0',
    ruleVersion: '0.0.0',
    normative: true,
    atomic: true,
    category: null,
    normativeMappings: [],
    standard: null,
    applicability: '',
    expectation: '',
    references: [],
    requirements: null,
    mappings: null
  };

  const raw = { outcome: 'fail', occurrences: [] };

  const out = normalizeRuleResult(def, raw, '1.0.0', policy);

  assert.equal(out.outcome, 'cantTell');
  assert.match(out.error || '', /coerced/i);
});

test('normalizeRuleResult: invalid outcome becomes cantTell', () => {
  if (!core.__internal || typeof core.__internal.normalizeRuleResult !== 'function') {
    assert.fail(
      'core.__internal.normalizeRuleResult is not exported (see Option A in instructions)'
    );
  }

  const normalizeRuleResult = core.__internal.normalizeRuleResult;

  const policy = resolvePolicy(POLICY_CONTRACTS, {
    policyContract: { id: 'custom', allowedOutcomes: ['pass'], allowedConfidence: ['high'] }
  });

  const def = {
    ruleId: 'test-invalid-outcome',
    defaultSeverity: 'moderate',
    defaultConfidence: 'high',
    type: 'automatic',
    ruleInterfaceVersion: '1.0.0',
    ruleVersion: '0.0.0',
    normative: true,
    atomic: true,
    category: null,
    normativeMappings: [],
    standard: null,
    applicability: '',
    expectation: '',
    references: [],
    requirements: null,
    mappings: null
  };

  const raw = { outcome: 'fail', occurrences: [] }; // fail not allowed by this policy

  const out = normalizeRuleResult(def, raw, '1.0.0', policy);

  assert.equal(out.outcome, 'cantTell');
});

// The unit tests above drive normalizeRuleResult directly. These drive the
// engineOptions a caller actually writes, through a real scan, because the
// contract and the override are two separate inputs and one has to win.
const { runa11yCoreOnHtml } = require('../helpers/runa11yCoreOnHtml');

const MANUAL_PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><b id="t">x</b></body></html>';

const MANUAL_RULE_WANTING_TO_FAIL = {
  id: 'probe-manual',
  meta: { title: 'Probe manual', type: 'manual', defaultSeverity: 'moderate' },
  runInPage: function (ctx) {
    return {
      ruleId: ctx.rule.ruleId,
      outcome: 'fail',
      occurrences: [{ selector: 'b', html: '<b>x</b>', summary: 's', hint: 'h' }]
    };
  }.toString()
};

function manualOutcome(engineOptions) {
  const result = runa11yCoreOnHtml(MANUAL_PAGE, {
    engineOptions: { customRules: [MANUAL_RULE_WANTING_TO_FAIL], ...engineOptions }
  });
  return result.checksResults.find((r) => r.ruleId === 'probe-manual').outcome;
}

test('policy: the a11y contract coerces a manual fail, the generic one does not', () => {
  assert.equal(manualOutcome({}), 'cantTell');
  assert.equal(manualOutcome({ policyContract: 'a11y' }), 'cantTell');
  assert.equal(manualOutcome({ policyContract: 'generic' }), 'fail');
});

test('policy: an explicit policy override beats the contract in both directions', () => {
  assert.equal(manualOutcome({ policy: { coerceManualFailToCantTell: false } }), 'fail');
  assert.equal(
    manualOutcome({ policyContract: 'generic', policy: { coerceManualFailToCantTell: true } }),
    'cantTell'
  );
});

test('policy: an inline contract object is honoured', () => {
  assert.equal(manualOutcome({ policyContract: { coerceManualFailToCantTell: false } }), 'fail');
});

test('policy: unusable contract and policy values fall back to the default contract', () => {
  for (const engineOptions of [
    { policyContract: 'no-such-contract' },
    { policyContract: null },
    { policyContract: 42 },
    { policy: 'nonsense' },
    { policy: null }
  ]) {
    assert.equal(
      manualOutcome(engineOptions),
      'cantTell',
      `${JSON.stringify(engineOptions)} should leave the a11y contract in force`
    );
  }
});

// The engine's headline property is that identical input gives identical
// output. perfStats has to keep that; profileRules cannot, because wall-clock
// timings differ every run.
test('perfStats: counters keep a result deterministic, timings do not', () => {
  const page =
    '<!doctype html><html lang="en"><head><title>t</title></head><body><img src="x.png"></body></html>';
  const run = (engineOptions) => runa11yCoreOnHtml(page, { engineOptions });

  assert.equal(JSON.stringify(run({})), JSON.stringify(run({})), 'a plain run is deterministic');
  assert.equal(
    JSON.stringify(run({ perfStats: true })),
    JSON.stringify(run({ perfStats: true })),
    'counters alone stay deterministic'
  );

  const a = run({ perfStats: true, profileRules: true });
  const b = run({ perfStats: true, profileRules: true });
  assert.deepEqual(a.perfStats.counters, b.perfStats.counters, 'counters are still stable');
  assert.ok(Object.keys(a.perfStats.ruleTimings).length > 0, 'timings are produced');
});

test('perfStats: profileRules on its own produces nothing', () => {
  const page =
    '<!doctype html><html lang="en"><head><title>t</title></head><body><img src="x.png"></body></html>';

  assert.equal(runa11yCoreOnHtml(page, { engineOptions: { profileRules: true } }).perfStats, null);
  assert.ok(
    runa11yCoreOnHtml(page, { engineOptions: { perfStats: true, profileRules: true } }).perfStats
      .ruleTimings
  );
});
