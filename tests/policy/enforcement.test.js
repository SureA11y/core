'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const core = require('../../src/core'); // generated core.js
const { POLICY_CONTRACTS } = require('../../src/policy/contracts');
const { resolvePolicy } = require('../../src/policy/resolvePolicy');

test('normalizeRuleResult: coerces manual fail to cantTell when enabled', () => {
    if (!core.__internal || typeof core.__internal.normalizeRuleResult !== 'function') {
        assert.fail('core.__internal.normalizeRuleResult is not exported (see Option A in instructions)');
    }

    const normalizeRuleResult = core.__internal.normalizeRuleResult;

    const policy = resolvePolicy(POLICY_CONTRACTS, {
        policyContract: 'a11y',
        policy: { coerceManualFailToCantTell: true }
    });

    const def = {
        ruleId: 'a11ycore-test-manual',
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
        assert.fail('core.__internal.normalizeRuleResult is not exported (see Option A in instructions)');
    }

    const normalizeRuleResult = core.__internal.normalizeRuleResult;

    const policy = resolvePolicy(POLICY_CONTRACTS, {
        policyContract: { id: 'custom', allowedOutcomes: ['pass'], allowedConfidence: ['high'] }
    });

    const def = {
        ruleId: 'a11ycore-test-invalid-outcome',
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
