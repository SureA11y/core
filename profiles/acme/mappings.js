/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * ACME's entries for a rule or a rollup, its rollups, and the checks the
 * build runs on its tables (index.js passes them to the registry). Part B is
 * mapped rule by rule with core's kit (@surea11y/core/profile-kit); Part A
 * restates WCAG, so its entries come from a rule's WCAG criteria, as EN 301
 * 549's do.
 */

const { ruleMappedStandard } = require('../../src/profile-kit.js');
const { VERSIONS, REQUIREMENTS } = require('./requirements');
const { RULE_REQUIREMENTS } = require('./rule-map');
const { ACME_PART_A } = require('./part-a');

const STANDARD = 'ACME';

const partB = ruleMappedStandard({
  standard: STANDARD,
  tag: 'acme',
  versions: VERSIONS,
  requirements: REQUIREMENTS,
  ruleMap: RULE_REQUIREMENTS
});

function partAFor(version, wcagSc) {
  const out = [];
  for (const sc of Array.isArray(wcagSc) ? wcagSc : []) {
    const row = ACME_PART_A[version][String(sc).trim()];
    if (row) {
      out.push({
        standard: STANDARD,
        version,
        requirement: row.requirement,
        title: row.title,
        wcagSc: [String(sc).trim()]
      });
    }
  }
  return out;
}

// The entries for a rule ({ id, wcagSc }) or, given `checksIds`, for a rollup:
// per version, Part A from its WCAG criteria, then the Part B requirements its
// rules check.
function mappingsFor({ id, wcagSc, checksIds }) {
  const partBEntries = partB.mappingsFor({ id, checksIds });
  return VERSIONS.flatMap(({ version }) => [
    ...partAFor(version, wcagSc),
    ...partBEntries.filter((e) => e.version === version)
  ]);
}

module.exports = {
  mappingsFor,
  composites: partB.composites,
  validate: partB.validate,
  wcagTagsOf: partB.wcagTagsOf
};
