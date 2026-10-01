/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * WCAG's Success Criteria as each version of WCAG 2 publishes them: number,
 * title and level, the criteria in force in that version only. Published for
 * tools and for standards built on a WCAG version (a profile's tables, such
 * as a standard restating WCAG A and AA), so they read the version they are
 * built on instead of keeping their own copy (docs/WCAG_CONFORMANCE.md).
 *
 * The engine's own tables describe WCAG 2.2, where 4.1.1 Parsing is
 * "Obsolete and removed" and has no level. In 2.0 and 2.1 it was a Level A
 * criterion titled "Parsing", and that is what wcagCriteria('2.1') returns.
 *
 * wcagTags() gives the engine's rule tags for a WCAG version and levels, the
 * tag set a conformance profile on that version selects rules by
 * (docs/ENGINE_OPTIONS.md).
 *
 * The returned objects are frozen.
 */

const { FACETS } = require('./coverage/wcag-facets.js');
const { introducedInVersion, removedInVersion } = require('./coverage/wcag-version-map.js');

const WCAG_VERSIONS = Object.freeze(['2.0', '2.1', '2.2']);
const LEVELS = ['A', 'AA', 'AAA'];

// How a removed criterion read in the versions before its removal.
const BEFORE_REMOVAL = { '4.1.1': { title: 'Parsing', level: 'A' } };

function compareSc(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
  return 0;
}

function checkVersion(version) {
  if (!WCAG_VERSIONS.includes(version)) {
    throw new Error(`unknown WCAG version "${version}"; one of ${WCAG_VERSIONS.join(', ')}`);
  }
}

const cache = new Map();

// The criteria in force in a WCAG version, in numeric order:
// [{ sc, title, level, introduced }]. `levels` keeps only those levels
// (['A', 'AA'] for an A and AA target).
function wcagCriteria(version, { levels } = {}) {
  checkVersion(version);
  if (levels !== undefined) {
    const bad = [].concat(levels).filter((l) => !LEVELS.includes(l));
    if (bad.length) throw new Error(`unknown WCAG level ${bad.join(', ')}; one of A, AA, AAA`);
  }
  if (!cache.has(version)) {
    const at = WCAG_VERSIONS.indexOf(version);
    const list = Object.keys(FACETS)
      .filter((sc) => WCAG_VERSIONS.indexOf(introducedInVersion(sc)) <= at)
      .filter((sc) => {
        const removed = removedInVersion(sc);
        return !(removed && WCAG_VERSIONS.indexOf(removed) <= at);
      })
      .sort(compareSc)
      .map((sc) => {
        const own = removedInVersion(sc) ? BEFORE_REMOVAL[sc] || {} : {};
        return Object.freeze({
          sc,
          title: own.title || FACETS[sc].title,
          level: own.level || FACETS[sc].level,
          introduced: introducedInVersion(sc)
        });
      });
    cache.set(version, Object.freeze(list));
  }
  const all = cache.get(version);
  if (levels === undefined) return all;
  const keep = [].concat(levels);
  return Object.freeze(all.filter((c) => keep.includes(c.level)));
}

// The tag each version adds its criteria under: wcag2a for 2.0's Level A,
// wcag21aa for the AA criteria 2.1 introduced, and so on.
const TAG_PREFIX = { '2.0': 'wcag2', 2.1: 'wcag21', 2.2: 'wcag22' };

// The rule tags that select a WCAG version's criteria at the given levels
// (A and AA by default): those of every version up to it, oldest first.
// ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] for 2.1 A and AA.
function wcagTags(version, levels = ['A', 'AA']) {
  checkVersion(version);
  const keep = [].concat(levels);
  const bad = keep.filter((l) => !LEVELS.includes(l));
  if (bad.length) throw new Error(`unknown WCAG level ${bad.join(', ')}; one of A, AA, AAA`);
  return WCAG_VERSIONS.slice(0, WCAG_VERSIONS.indexOf(version) + 1).flatMap((v) =>
    LEVELS.filter((l) => keep.includes(l)).map((l) => TAG_PREFIX[v] + l.toLowerCase())
  );
}

// One criterion as a WCAG version publishes it, or null when the version has
// no such criterion.
function wcagCriterion(sc, version) {
  return wcagCriteria(version).find((c) => c.sc === String(sc)) || null;
}

module.exports = { WCAG_VERSIONS, wcagCriteria, wcagCriterion, wcagTags };
