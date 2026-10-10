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

  // A list of the known values it holds; one it doesn't know is left out
  // with a warning, and a list left with none is no list (the contract's
  // applies).
  function knownValues(list, known, name) {
    if (!Array.isArray(list)) return null;
    const kept = list.filter((v) => known.includes(v));
    const dropped = list.filter((v) => !known.includes(v));
    if (dropped.length || !kept.length) {
      try {
        console.warn(
          '[surea11y] policy.' +
            name +
            (dropped.length
              ? ': ' +
                dropped
                  .map((v) => JSON.stringify(typeof v === 'string' ? v : String(typeof v)))
                  .join(', ') +
                ' left out, not one of ' +
                known.join(', ')
              : ' is empty') +
            (kept.length ? '.' : "; the contract's list applies.")
        );
      } catch {}
    }
    return kept.length ? kept : null;
  }

  function normalizePolicyOverrides(policy) {
    const p = policy && typeof policy === 'object' ? policy : {};
    return {
      allowedOutcomes: knownValues(
        p.allowedOutcomes,
        ['fail', 'pass', 'cantTell', 'notApplicable'],
        'allowedOutcomes'
      ),
      allowedConfidence: knownValues(
        p.allowedConfidence,
        ['high', 'medium', 'low'],
        'allowedConfidence'
      ),
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
