'use strict';

// Closed vocabulary for why a cantTell could not be decided. Rules pick a code;
// consumers branch on it. Per-rule `data.details.reasonCode` stays free-form.
const UNCERTAINTY_CODES = Object.freeze({
  NOT_COMPUTABLE: 'not-computable',
  RUNTIME_DEPENDENT: 'runtime-dependent',
  SPEC_ONLY: 'spec-only',
  EQUIVALENCE_UNKNOWN: 'equivalence-unknown',
  JUDGEMENT_REQUIRED: 'judgement-required',
  OUT_OF_SCOPE: 'out-of-scope'
});

const UNCERTAINTY_CODE_VALUES = Object.freeze(Object.values(UNCERTAINTY_CODES));

function isUncertaintyCode(code) {
  return UNCERTAINTY_CODE_VALUES.indexOf(code) !== -1;
}

// Returns null rather than throwing: a malformed payload must not cost the
// occurrence it was attached to.
function normalizeUncertainty(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  if (!isUncertaintyCode(input.code)) return null;

  const out = { code: input.code };
  if (typeof input.needed === 'string' && input.needed.trim()) out.needed = input.needed.trim();
  if (input.evidence && typeof input.evidence === 'object' && !Array.isArray(input.evidence)) {
    out.evidence = { ...input.evidence };
  }
  return out;
}

module.exports = {
  UNCERTAINTY_CODES,
  UNCERTAINTY_CODE_VALUES,
  isUncertaintyCode,
  normalizeUncertainty
};
