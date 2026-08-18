'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { POLICY_CONTRACTS } = require('../../src/policy/contracts');
const { resolvePolicy } = require('../../src/policy/resolvePolicy');

test('resolvePolicy: defaults to a11y contract when no engineOptions', () => {
  const pol = resolvePolicy(POLICY_CONTRACTS, null);

  assert.equal(pol.contractId, (POLICY_CONTRACTS.a11y && POLICY_CONTRACTS.a11y.id) || 'a11y');
  assert.deepEqual(pol.allowedOutcomes, POLICY_CONTRACTS.a11y.allowedOutcomes);
  assert.deepEqual(pol.allowedConfidence, POLICY_CONTRACTS.a11y.allowedConfidence);
  assert.equal(pol.coerceManualFailToCantTell, !!POLICY_CONTRACTS.a11y.coerceManualFailToCantTell);
});

test('resolvePolicy: selects contract by id', () => {
  // pick any non-a11y contract if it exists; otherwise skip
  const otherId = Object.keys(POLICY_CONTRACTS).find((k) => k !== 'a11y');
  if (!otherId) return;

  const pol = resolvePolicy(POLICY_CONTRACTS, { policyContract: otherId });

  assert.deepEqual(pol.allowedOutcomes, POLICY_CONTRACTS[otherId].allowedOutcomes);
  assert.deepEqual(pol.allowedConfidence, POLICY_CONTRACTS[otherId].allowedConfidence);
});

test('resolvePolicy: unknown contract id falls back to a11y', () => {
  const pol = resolvePolicy(POLICY_CONTRACTS, { policyContract: 'does-not-exist' });

  assert.deepEqual(pol.allowedOutcomes, POLICY_CONTRACTS.a11y.allowedOutcomes);
  assert.deepEqual(pol.allowedConfidence, POLICY_CONTRACTS.a11y.allowedConfidence);
});

test('resolvePolicy: inline contract object works and sets a stable id', () => {
  const pol = resolvePolicy(POLICY_CONTRACTS, {
    policyContract: {
      id: 'custom-contract',
      allowedOutcomes: ['pass', 'fail'],
      allowedConfidence: ['high'],
      coerceManualFailToCantTell: false
    }
  });

  assert.equal(pol.contractId, 'custom-contract');
  assert.deepEqual(pol.allowedOutcomes, ['pass', 'fail']);
  assert.deepEqual(pol.allowedConfidence, ['high']);
  assert.equal(pol.coerceManualFailToCantTell, false);
});

test('resolvePolicy: policy overrides merge on top of contract', () => {
  const pol = resolvePolicy(POLICY_CONTRACTS, {
    policyContract: 'a11y',
    policy: {
      allowedOutcomes: ['pass'], // override
      allowedConfidence: ['low'], // override
      coerceManualFailToCantTell: false
    }
  });

  assert.deepEqual(pol.allowedOutcomes, ['pass']);
  assert.deepEqual(pol.allowedConfidence, ['low']);
  assert.equal(pol.coerceManualFailToCantTell, false);
});

test('resolvePolicy: a partial custom contract fills every unspecified field from the fallback', () => {
  const pol = resolvePolicy(POLICY_CONTRACTS, {
    policyContract: { allowedOutcomes: ['fail'] }
  });

  assert.deepEqual(pol.allowedOutcomes, ['fail']);
  assert.deepEqual(pol.allowedConfidence, POLICY_CONTRACTS.a11y.allowedConfidence);
  assert.equal(pol.contractId, POLICY_CONTRACTS.a11y.id);
  assert.equal(pol.coerceManualFailToCantTell, POLICY_CONTRACTS.a11y.coerceManualFailToCantTell);
});

test('resolvePolicy: a custom contract may override confidence alone', () => {
  const pol = resolvePolicy(POLICY_CONTRACTS, {
    policyContract: { allowedConfidence: ['high'] }
  });

  assert.deepEqual(pol.allowedConfidence, ['high']);
  assert.deepEqual(pol.allowedOutcomes, POLICY_CONTRACTS.a11y.allowedOutcomes);
});

test('resolvePolicy: a blank custom contract id falls back rather than producing an empty one', () => {
  for (const id of [undefined, null, '', '   ', 42]) {
    assert.equal(
      resolvePolicy(POLICY_CONTRACTS, { policyContract: { id } }).contractId,
      POLICY_CONTRACTS.a11y.id
    );
  }
});

test('resolvePolicy: a named contract that does not exist falls back to a11y', () => {
  const pol = resolvePolicy(POLICY_CONTRACTS, { policyContract: 'no-such-contract' });

  assert.equal(pol.contractId, POLICY_CONTRACTS.a11y.id);
});

test('resolvePolicy: a custom contract keeps its own id and coercion flag when given', () => {
  const pol = resolvePolicy(POLICY_CONTRACTS, {
    policyContract: { id: '  house-style  ', coerceManualFailToCantTell: false }
  });

  assert.equal(pol.contractId, 'house-style');
  assert.equal(pol.coerceManualFailToCantTell, false);
});
