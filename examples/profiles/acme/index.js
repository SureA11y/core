/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * ACME: a made-up company standard that tests the profile model (DESIGN.md).
 * It never ships: scripts/test-extra-profiles.js builds an engine with it in
 * a copy of the repository and runs its tests there.
 *
 * Part A restates WCAG's A and AA criteria as `A.<sc>` (part-a.js), as
 * EN 301 549 does, so its entries derive from a rule's WCAG criteria.
 */

const { ACME_VERSIONS, ACME_PART_A } = require('./part-a');

const WCAG21_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const WCAG22_AA_TAGS = WCAG21_AA_TAGS.concat(['wcag22a', 'wcag22aa']);

// The Part A entries for a rule's WCAG criteria, one per version that
// restates each, oldest version first.
function mappingsFor({ wcagSc }) {
  const out = [];
  for (const sc of Array.isArray(wcagSc) ? wcagSc : []) {
    const s = String(sc).trim();
    for (const { version } of ACME_VERSIONS) {
      const row = ACME_PART_A[version][s];
      if (row) {
        out.push({
          standard: 'ACME',
          version,
          requirement: row.requirement,
          title: row.title,
          wcagSc: [s]
        });
      }
    }
  }
  return out;
}

const standard = {
  key: 'acme',
  standard: 'ACME',
  versions: ACME_VERSIONS.map((v) => v.version),
  profiles: {
    'acme-1.0': { version: '1.0', tags: WCAG21_AA_TAGS },
    'acme-2.0': { version: '2.0', tags: WCAG22_AA_TAGS }
  },
  mappingsFor
};

module.exports = { standard };
