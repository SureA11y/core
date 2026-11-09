/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Core's experimental APIs: what a minor release may still change or remove
 * (docs/API_STABILITY.md, "Experimental"). Each one becomes stable or is
 * removed within two minor releases of the one that brought it, and at the
 * latest at the next major; tests/experimental.test.js holds core to that,
 * and fails a release that still lists one past its date.
 *
 * Each entry:
 *   id      the name it is listed by, such as 'standard.scoring'
 *   since   the version that brought it, such as '1.16.0'
 *   until   the version by which it is stable or removed, at most two minors
 *           after `since` (or the next major)
 *   what    one line on what it is
 *   usedBy  (pack) => boolean, for an API a pack uses: whether this one does
 *
 * A pack that uses one declares a `core` range no wider than `~` (checkPack
 * reports a wider one), and describePacks lists what it uses.
 */
const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

// The rollups a pack's standard writes, or [] when it can't give them.
function rollupsOf(pack) {
  const standard = pack && pack.standard;
  if (!standard || typeof standard.composites !== 'function') return [];
  const rollups = standard.composites();
  return Array.isArray(rollups) ? rollups : [];
}

const EXPERIMENTAL = [
  {
    id: 'skip-link details.lean',
    since: '1.16.0',
    until: '1.18.0',
    what: "skip-link's data.details.lean, the direction of a finding's lean, which a standard's mapping routes by: a lean may change in a minor, so a verdict built on it may too.",
    // A rollup that sends skip-link's findings by their lean.
    usedBy: (pack) =>
      rollupsOf(pack).some((rollup) => {
        const c = isObject(rollup && rollup.meta) && rollup.meta.contributions;
        const entry = isObject(c) && c['skip-link'];
        return (
          isObject(entry) &&
          Array.isArray(entry.findings) &&
          entry.findings.some(
            (f) => isObject(f) && isObject(f.when) && Object.keys(f.when).includes('lean')
          )
        );
      })
  },
  {
    id: 'standard.review dictionary keys',
    since: '1.16.0',
    until: '1.18.0',
    what: "The keys a pack's dictionaries translate its standard's own steps under, <standard key>_standardReview_<rule id>_<CODE>_step<n>, _pass and _fail: they name no version of the standard yet.",
    usedBy: (pack) =>
      isObject(pack && pack.dictionaries) &&
      Object.values(pack.dictionaries).some(
        (dict) => isObject(dict) && Object.keys(dict).some((k) => k.includes('_standardReview_'))
      )
  },
  {
    id: 'standard data',
    since: '1.16.0',
    until: '1.18.0',
    what: 'A standard as data (format surea11y-standard/1, src/schemas/standard.schema.json): checkStandardData, standardFromData and standardDataOf.',
    usedBy: (pack) =>
      !!(pack && pack.standard && pack.standard[Symbol.for('surea11y.standardData')])
  },
  {
    id: 'standard derivation',
    since: '1.16.0',
    until: '1.18.0',
    what: "deriveStandard, a standard built on others through basedOn, and the basedOn its results' entries carry.",
    usedBy: (pack) => {
      const data = pack && pack.standard && pack.standard[Symbol.for('surea11y.standardData')];
      if (!data) return false;
      if ((data.versions || []).some((v) => Array.isArray(v.basedOn))) return true;
      return Object.values(data.data || {}).some((d) =>
        [...Object.values(d.requirements || {}), ...Object.values(d.tests || {})].some((e) =>
          Array.isArray(e.basedOn)
        )
      );
    }
  },
  {
    id: 'standard texts',
    since: '1.16.0',
    until: '1.18.0',
    what: "A standard's translations by id and version (standard.texts), and its own review steps per version (standard.reviewByVersion).",
    usedBy: (pack) =>
      !!(
        pack &&
        pack.standard &&
        (pack.standard.texts !== undefined || pack.standard.reviewByVersion !== undefined)
      )
  },
  {
    id: 'standard laws',
    since: '1.16.0',
    until: '1.18.0',
    what: "The law each profile is used for, identified by name, jurisdiction and official texts (standard.laws, standard.lawTexts), the law of each profile, the laws a requirement is asked for under, lawOf, results' engine.law and listProcedures' profile option.",
    usedBy: (pack) => {
      const st = pack && pack.standard;
      if (!isObject(st)) return false;
      if (st.laws !== undefined || st.lawTexts !== undefined) return true;
      return Object.values(isObject(st.profiles) ? st.profiles : {}).some(
        (p) => isObject(p) && p.law !== undefined
      );
    }
  },
  {
    id: 'pack uses',
    since: '1.17.0',
    until: '1.19.0',
    what: "A pack's uses: the packs it builds on, whose rules its standard maps and its profiles run; a scan runs it only with them, at the version it was made with.",
    usedBy: (pack) => Array.isArray(pack && pack.uses) && pack.uses.length > 0
  },
  {
    id: 'ruleMappedStandard tests',
    since: '1.16.0',
    until: '1.18.0',
    what: "ruleMappedStandard's second level: tests under requirements, many to many, rows naming tests, asks, and wcagCorrespondence.",
    usedBy: (pack) =>
      !!(
        pack &&
        pack.standard &&
        typeof pack.standard.composites === 'function' &&
        pack.standard.composites[Symbol.for('surea11y.twoLevelStandard')]
      )
  }
];

// Whether a pack uses an entry's API; an entry whose check throws counts it
// as unused.
function usedBy(entry, pack) {
  try {
    return typeof entry.usedBy === 'function' && entry.usedBy(pack) === true;
  } catch {
    return false;
  }
}

// The experimental APIs a pack uses, as { id, since, until }.
function experimentalUses(pack) {
  const uses = [];
  for (const entry of EXPERIMENTAL) {
    if (usedBy(entry, pack)) uses.push({ id: entry.id, since: entry.since, until: entry.until });
  }
  return uses;
}

module.exports = { EXPERIMENTAL, experimentalUses };
