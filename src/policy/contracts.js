'use strict';

module.exports = {
  POLICY_CONTRACTS: {
    a11y: {
      id: 'a11y',
      allowedOutcomes: ['fail', 'pass', 'cantTell', 'notApplicable'],
      allowedConfidence: ['high', 'medium', 'low'],
      coerceManualFailToCantTell: true
    },
    generic: {
      id: 'generic',
      allowedOutcomes: ['fail', 'pass', 'cantTell', 'notApplicable'],
      allowedConfidence: ['high', 'medium', 'low'],
      coerceManualFailToCantTell: false
    }
  }
};
