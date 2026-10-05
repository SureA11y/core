/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

function resolvePolicy(POLICY_CONTRACTS, engineOptions) {
  function normalizePolicyContract(POLICY_CONTRACTS, contract, fallbackId) {
    const fallback = POLICY_CONTRACTS[fallbackId] || POLICY_CONTRACTS.a11y;
    if (typeof contract === 'string') {
      // Own properties only: 'constructor' or 'toString' would otherwise
      // resolve to a function from Object.prototype and crash the scan.
      if (Object.prototype.hasOwnProperty.call(POLICY_CONTRACTS, contract)) {
        return POLICY_CONTRACTS[contract];
      }
      try {
        console.warn(
          '[surea11y] Unknown policyContract "' +
            contract +
            '"; using "' +
            fallback.id +
            '". Use one of: ' +
            Object.keys(POLICY_CONTRACTS).join(', ') +
            ', or an inline contract object.'
        );
      } catch {}
      return fallback;
    }

    if (contract && typeof contract === 'object') {
      const allowedOutcomes = Array.isArray(contract.allowedOutcomes)
        ? contract.allowedOutcomes.slice()
        : fallback.allowedOutcomes.slice();

      const allowedConfidence = Array.isArray(contract.allowedConfidence)
        ? contract.allowedConfidence.slice()
        : fallback.allowedConfidence.slice();

      return {
        id:
          typeof contract.id === 'string' && contract.id.trim()
            ? contract.id.trim()
            : fallback.id || fallbackId || 'custom',
        allowedOutcomes,
        allowedConfidence,
        coerceManualFailToCantTell:
          typeof contract.coerceManualFailToCantTell === 'boolean'
            ? contract.coerceManualFailToCantTell
            : !!fallback.coerceManualFailToCantTell
      };
    }

    return fallback;
  }

  function normalizePolicyOverrides(policy) {
    const p = policy && typeof policy === 'object' ? policy : {};
    return {
      allowedOutcomes: Array.isArray(p.allowedOutcomes) ? p.allowedOutcomes.slice() : null,
      allowedConfidence: Array.isArray(p.allowedConfidence) ? p.allowedConfidence.slice() : null,
      coerceManualFailToCantTell:
        typeof p.coerceManualFailToCantTell === 'boolean' ? p.coerceManualFailToCantTell : null
    };
  }

  const opts = engineOptions && typeof engineOptions === 'object' ? engineOptions : {};
  const contract = normalizePolicyContract(POLICY_CONTRACTS, opts.policyContract, 'a11y');
  const ov = normalizePolicyOverrides(opts.policy);

  return {
    contractId: contract.id,
    allowedOutcomes: ov.allowedOutcomes || contract.allowedOutcomes.slice(),
    allowedConfidence: ov.allowedConfidence || contract.allowedConfidence.slice(),
    coerceManualFailToCantTell:
      ov.coerceManualFailToCantTell !== null
        ? ov.coerceManualFailToCantTell
        : !!contract.coerceManualFailToCantTell
  };
}

module.exports = { resolvePolicy };
