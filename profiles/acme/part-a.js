/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * ACME Part A: the WCAG A and AA criteria each ACME version restates, as
 * requirement `A.<sc>`, read from the WCAG version that ACME version is built
 * on (@surea11y/core/wcag), so 1.0 restates 4.1.1 Parsing at Level A and 2.0
 * does not. ACME is a made-up standard that tests the profile model
 * (DESIGN.md); it never ships.
 */

const { wcagCriteria } = require('../../src/wcag.js');

const ACME_VERSIONS = [
  { version: '1.0', wcagVersion: '2.1' },
  { version: '2.0', wcagVersion: '2.2' }
];

// ACME_PART_A[version][sc] = { requirement, title }
const ACME_PART_A = Object.fromEntries(
  ACME_VERSIONS.map(({ version, wcagVersion }) => [
    version,
    Object.fromEntries(
      wcagCriteria(wcagVersion, { levels: ['A', 'AA'] }).map((c) => [
        c.sc,
        { requirement: `A.${c.sc}`, title: c.title }
      ])
    )
  ])
);

module.exports = { ACME_VERSIONS, ACME_PART_A };
