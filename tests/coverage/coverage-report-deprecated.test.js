'use strict';

/**
 * The WCAG coverage report (coverage/coverage-report.json, written by
 * scripts/generate-wcag-coverage.js) counts a facet as covered only by rules
 * that still decide something. A deprecated rule may keep its WCAG mapping,
 * and so a facet, until it is removed, but it covers nothing.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { getChecksCatalog } = require('../../src/index.js');
const report = require('../../coverage/coverage-report.json');

test('no deprecated rule is listed as covering a facet', () => {
  const deprecated = new Set(
    getChecksCatalog()
      .filter((r) => r.deprecated)
      .map((r) => r.ruleId)
  );
  assert.ok(deprecated.has('iframe-title-unique'), 'the case this guards still exists');
  const found = Object.values(report.facetSummaries).flatMap((summaries) =>
    summaries.flatMap((s) =>
      s.facets
        .filter((f) => f.coveredBy.some((id) => deprecated.has(id)))
        .map((f) => `${s.sc} ${f.id}: ${f.coveredBy.join(', ')}`)
    )
  );
  assert.deepEqual(found, []);
});
