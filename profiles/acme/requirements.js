/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * ACME's requirements, per version. ACME is a made-up standard that tests
 * the profile model (DESIGN.md); it is never merged.
 *
 * - VERSIONS: [{ version, wcagVersion }], oldest first: ACME's version and
 *   the WCAG version it is built on. A version needs a key in REQUIREMENTS and
 *   a profile in index.js.
 * - REQUIREMENTS[version][id]: { title, wcagSc }. `id` is the standard's own
 *   number ('1.2', 'B4'...), `title` its wording, and `wcagSc` the WCAG
 *   criteria the requirement corresponds to, if any (['1.4.3']).
 */

// ACME 1.0 builds on WCAG 2.1, 2.0 on WCAG 2.2 (part-a.js).
const { ACME_VERSIONS: VERSIONS } = require('./part-a');

// Part B, ACME's own requirements. Part A, WCAG renumbered, is in part-a.js.
const PART_B = {
  B2: {
    title: 'All text, large text included, reaches a contrast ratio of 4.5:1',
    wcagSc: ['1.4.3']
  },
  B3: { title: 'Every page links to the accessibility statement', wcagSc: [] },
  B4: { title: 'Headings are in order and the page has landmarks', wcagSc: [] },
  B5: { title: 'Pages have a skip link', wcagSc: ['2.4.1'] }
};

const REQUIREMENTS = {
  '1.0': { ...PART_B },
  '2.0': { ...PART_B }
};

module.exports = { VERSIONS, REQUIREMENTS };
