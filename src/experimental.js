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

const EXPERIMENTAL = [
  {
    id: 'requirement laws',
    since: '1.18.0',
    until: '1.20.0',
    what: "A requirement asked for under only some of its standard's laws (its laws in standard.procedures; laws on a requirement in standard data): a profile whose law isn't among them, or that serves none, neither lists nor judges it, and engine.profileExcludes.requirements names it. Brought in 1.16.0 with the standard's laws; the scan honours it from 1.18.0, which is listed apart while a pack proves it.",
    usedBy: (pack) => {
      const st = pack && pack.standard;
      if (!isObject(st) || !isObject(st.procedures)) return false;
      return Object.values(st.procedures).some(
        (table) =>
          isObject(table) &&
          Object.values(table).some((entry) => isObject(entry) && entry.laws !== undefined)
      );
    }
  },
  {
    id: 'pack uses',
    since: '1.17.0',
    until: '1.19.0',
    what: "A pack's uses: the packs it builds on, whose rules its standard maps and its profiles run; a scan runs it only with them, at the version it was made with.",
    usedBy: (pack) => Array.isArray(pack && pack.uses) && pack.uses.length > 0
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
