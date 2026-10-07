/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Every WCAG 2 Success Criterion, with the version that introduced it, its
 * level in each version that has it, and the version that removed it.
 *
 * Each entry is { sc, tag, introduced, levels, removed }:
 * - sc: the criterion's number ('1.4.12').
 * - tag: its rule tag, the number without dots ('wcag1412').
 * - introduced: the WCAG version that added it ('2.0', '2.1' or '2.2').
 * - levels: its level ('A', 'AA' or 'AAA') in each version that has it, by
 *   version. A criterion's level is read per version, so a level that
 *   changed between versions is written down as such.
 * - removed: the version that removed it, or null.
 *
 * SOURCES
 * -------
 * - WCAG 2.2, W3C Recommendation (https://www.w3.org/TR/WCAG22/), its
 *   success criteria and its "Comparison with WCAG 2.1" section: nine
 *   criteria are new in 2.2 (2.4.11, 2.4.12, 2.4.13, 2.5.7, 2.5.8, 3.2.6,
 *   3.3.7, 3.3.8, 3.3.9), and one, 4.1.1 Parsing, is removed ("Obsolete and
 *   removed", with no level).
 * - WCAG 2.1, W3C Recommendation (https://www.w3.org/TR/WCAG21/), its
 *   success criteria and its "Comparison with WCAG 2.0" section: seventeen
 *   criteria are new in 2.1, and the other 61 are WCAG 2.0's.
 *
 * Read from the source of both Recommendations (github.com/w3c/wcag, the
 * WCAG-2.1 branch and main), numbered by their place in the guidelines.
 * No criterion that two versions share has a different level in them: 2.4.7
 * Focus Visible is AA in 2.0, 2.1 and 2.2 (a draft of 2.2 moved it to A; the
 * Recommendation did not), and 2.5.5, renamed Target Size (Enhanced) in 2.2,
 * is AAA in both.
 *
 * src/coverage/wcag-version-map.js and the levels in src/coverage/wcag-facets.js
 * say the same (tests/coverage/wcag-criteria.test.js checks it); this table
 * is the one that has a level per version.
 *
 * The entries are frozen.
 */

const WCAG_VERSIONS = Object.freeze(['2.0', '2.1', '2.2']);

function sc(number, introduced, levels, removed = null) {
  return Object.freeze({
    sc: number,
    tag: 'wcag' + number.split('.').join(''),
    introduced,
    levels: Object.freeze(levels),
    removed
  });
}

const WCAG_CRITERIA = Object.freeze([
  sc('1.1.1', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('1.2.1', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('1.2.2', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('1.2.3', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('1.2.4', '2.0', { '2.0': 'AA', '2.1': 'AA', '2.2': 'AA' }),
  sc('1.2.5', '2.0', { '2.0': 'AA', '2.1': 'AA', '2.2': 'AA' }),
  sc('1.2.6', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('1.2.7', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('1.2.8', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('1.2.9', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('1.3.1', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('1.3.2', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('1.3.3', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('1.3.4', '2.1', { '2.1': 'AA', '2.2': 'AA' }),
  sc('1.3.5', '2.1', { '2.1': 'AA', '2.2': 'AA' }),
  sc('1.3.6', '2.1', { '2.1': 'AAA', '2.2': 'AAA' }),
  sc('1.4.1', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('1.4.2', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('1.4.3', '2.0', { '2.0': 'AA', '2.1': 'AA', '2.2': 'AA' }),
  sc('1.4.4', '2.0', { '2.0': 'AA', '2.1': 'AA', '2.2': 'AA' }),
  sc('1.4.5', '2.0', { '2.0': 'AA', '2.1': 'AA', '2.2': 'AA' }),
  sc('1.4.6', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('1.4.7', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('1.4.8', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('1.4.9', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('1.4.10', '2.1', { '2.1': 'AA', '2.2': 'AA' }),
  sc('1.4.11', '2.1', { '2.1': 'AA', '2.2': 'AA' }),
  sc('1.4.12', '2.1', { '2.1': 'AA', '2.2': 'AA' }),
  sc('1.4.13', '2.1', { '2.1': 'AA', '2.2': 'AA' }),
  sc('2.1.1', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('2.1.2', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('2.1.3', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('2.1.4', '2.1', { '2.1': 'A', '2.2': 'A' }),
  sc('2.2.1', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('2.2.2', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('2.2.3', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('2.2.4', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('2.2.5', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('2.2.6', '2.1', { '2.1': 'AAA', '2.2': 'AAA' }),
  sc('2.3.1', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('2.3.2', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('2.3.3', '2.1', { '2.1': 'AAA', '2.2': 'AAA' }),
  sc('2.4.1', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('2.4.2', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('2.4.3', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('2.4.4', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('2.4.5', '2.0', { '2.0': 'AA', '2.1': 'AA', '2.2': 'AA' }),
  sc('2.4.6', '2.0', { '2.0': 'AA', '2.1': 'AA', '2.2': 'AA' }),
  sc('2.4.7', '2.0', { '2.0': 'AA', '2.1': 'AA', '2.2': 'AA' }),
  sc('2.4.8', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('2.4.9', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('2.4.10', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('2.4.11', '2.2', { '2.2': 'AA' }),
  sc('2.4.12', '2.2', { '2.2': 'AAA' }),
  sc('2.4.13', '2.2', { '2.2': 'AAA' }),
  sc('2.5.1', '2.1', { '2.1': 'A', '2.2': 'A' }),
  sc('2.5.2', '2.1', { '2.1': 'A', '2.2': 'A' }),
  sc('2.5.3', '2.1', { '2.1': 'A', '2.2': 'A' }),
  sc('2.5.4', '2.1', { '2.1': 'A', '2.2': 'A' }),
  sc('2.5.5', '2.1', { '2.1': 'AAA', '2.2': 'AAA' }),
  sc('2.5.6', '2.1', { '2.1': 'AAA', '2.2': 'AAA' }),
  sc('2.5.7', '2.2', { '2.2': 'AA' }),
  sc('2.5.8', '2.2', { '2.2': 'AA' }),
  sc('3.1.1', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('3.1.2', '2.0', { '2.0': 'AA', '2.1': 'AA', '2.2': 'AA' }),
  sc('3.1.3', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('3.1.4', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('3.1.5', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('3.1.6', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('3.2.1', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('3.2.2', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('3.2.3', '2.0', { '2.0': 'AA', '2.1': 'AA', '2.2': 'AA' }),
  sc('3.2.4', '2.0', { '2.0': 'AA', '2.1': 'AA', '2.2': 'AA' }),
  sc('3.2.5', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('3.2.6', '2.2', { '2.2': 'A' }),
  sc('3.3.1', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('3.3.2', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('3.3.3', '2.0', { '2.0': 'AA', '2.1': 'AA', '2.2': 'AA' }),
  sc('3.3.4', '2.0', { '2.0': 'AA', '2.1': 'AA', '2.2': 'AA' }),
  sc('3.3.5', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('3.3.6', '2.0', { '2.0': 'AAA', '2.1': 'AAA', '2.2': 'AAA' }),
  sc('3.3.7', '2.2', { '2.2': 'A' }),
  sc('3.3.8', '2.2', { '2.2': 'AA' }),
  sc('3.3.9', '2.2', { '2.2': 'AAA' }),
  sc('4.1.1', '2.0', { '2.0': 'A', '2.1': 'A' }, '2.2'),
  sc('4.1.2', '2.0', { '2.0': 'A', '2.1': 'A', '2.2': 'A' }),
  sc('4.1.3', '2.1', { '2.1': 'AA', '2.2': 'AA' }),
]);

module.exports = { WCAG_VERSIONS, WCAG_CRITERIA };
