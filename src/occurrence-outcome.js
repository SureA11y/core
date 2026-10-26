/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * An occurrence's outcome as every reporter reads it, in a module of its own
 * with no dependencies, so the browser-safe how-to-check entry reads it the
 * same way scan-result.js does.
 */

// An occurrence's tier: occurrenceOutcome, or the outcome an older
// label-in-name wrote; undefined for none.
function tierOf(occurrence) {
  if (!occurrence || typeof occurrence !== 'object') return undefined;
  for (const tier of [occurrence.occurrenceOutcome, occurrence.outcome]) {
    if (tier === 'fail' || tier === 'cantTell') return tier;
  }
  return undefined;
}

// Its own tier when that is fail or cantTell, or else its check's outcome
// when that is; null otherwise.
function occurrenceOutcome(check, occurrence) {
  const own = tierOf(occurrence);
  if (own) return own;
  return check && (check.outcome === 'fail' || check.outcome === 'cantTell') ? check.outcome : null;
}

module.exports = { tierOf, occurrenceOutcome };
