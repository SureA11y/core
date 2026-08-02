'use strict';

// Hand-built fake scan results matching docs/OUTPUT_SCHEMA.md's shape, used to
// exercise src/explain/'s grouping/attachment logic in isolation from the real
// engine (which rules actually fire, on which fixtures, is exercised
// elsewhere -- this module only cares about the *shape* of a finished result).

function makeOccurrence(overrides = {}) {
  return {
    selector: 'img',
    html: '<img src="x.png">',
    structuralPath: [0, 0],
    summary: 'Image missing alt text.',
    hint: 'Add an alt attribute.',
    i18n: null,
    data: { details: null },
    ...overrides
  };
}

function makeCheckResult(overrides = {}) {
  return {
    ruleId: 'img-alt-present',
    outcome: 'fail',
    outcomeNormalized: 'fail',
    severity: 'serious',
    confidence: 'high',
    type: 'automatic',
    title: '<img> must have an alt attribute',
    description: 'Checks that <img> elements provide an alt attribute.',
    i18n: null,
    meta: {
      ruleId: 'img-alt-present',
      normativeMappings: [
        {
          standard: 'WCAG',
          version: '2.2',
          requirement: '1.1.1',
          title: 'Non-text Content',
          conformanceLevel: 'A'
        }
      ]
    },
    engineOptions: {},
    schemaVersion: '1.0.0',
    occurrences: [makeOccurrence()],
    ...overrides
  };
}

function makeScanResult(checksResults) {
  return {
    engine: { tag: 'a11ycore', schemaVersion: '1.0.0' },
    url: 'https://example.test/',
    title: null,
    timestamp: null,
    perfStats: null,
    contextSelector: null,
    checksResults,
    rulesResults: []
  };
}

module.exports = { makeOccurrence, makeCheckResult, makeScanResult };
