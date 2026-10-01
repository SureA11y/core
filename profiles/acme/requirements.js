/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * ACME's requirements, per version. ACME is a made-up standard that tests
 * the profile model (DESIGN.md); it is never merged.
 *
 * - VERSIONS: [{ version }], oldest first. A version needs a key in
 *   REQUIREMENTS and a profile in index.js.
 * - REQUIREMENTS[version][id]: { title, wcagSc }. `id` is the standard's own
 *   number ('1.2', 'B4'...), `title` its wording, and `wcagSc` the WCAG
 *   criteria the requirement corresponds to, if any (['1.4.3']).
 */

// ACME 1.0 builds on WCAG 2.1, 2.0 on WCAG 2.2 (part-a.js).
const { ACME_VERSIONS: VERSIONS } = require('./part-a');

// Part B, ACME's own requirements. Part A, WCAG renumbered, is in part-a.js.
const REQUIREMENTS = {
  '1.0': {},
  '2.0': {}
};

module.exports = { VERSIONS, REQUIREMENTS };
