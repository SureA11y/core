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
const EXPERIMENTAL = [];

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
