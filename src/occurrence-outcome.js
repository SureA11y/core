/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * An occurrence's outcome as every reporter reads it, in a module of its own
 * with no dependencies, so the browser-safe how-to-check entry reads it the
 * same way scan-result.js does.
 */

// A field of the occurrence's own, never one a script put on
// Object.prototype: Object.prototype.occurrenceOutcome = 'pass' read every
// failure as a pass (round 12, A12-1).
function ownField(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key) ? object[key] : undefined;
}

// An occurrence's tier: occurrenceOutcome, or the outcome an older
// label-in-name wrote; undefined for none.
function tierOf(occurrence) {
  if (!occurrence || typeof occurrence !== 'object') return undefined;
  for (const tier of [ownField(occurrence, 'occurrenceOutcome'), ownField(occurrence, 'outcome')]) {
    if (tier === 'fail' || tier === 'cantTell') return tier;
  }
  return undefined;
}

// Its own tier when that is fail, cantTell or pass, or else its check's outcome
// when that is fail, cantTell or pass (the summary occurrence a passing
// check gives, such as contrast-computable's ALL_TEXT_COMPUTABLE, reads
// pass, as a scan of several profiles gives it); null otherwise.
function occurrenceOutcome(check, occurrence) {
  const own = tierOf(occurrence);
  if (own) return own;
  // One marked as passing passes, whatever its check's outcome: SARIF, JUnit,
  // the report and baselines read a pass-tier occurrence of a failing check
  // as a failure otherwise.
  if (
    occurrence &&
    typeof occurrence === 'object' &&
    ownField(occurrence, 'occurrenceOutcome') === 'pass'
  )
    return 'pass';
  const outcome = check && typeof check === 'object' ? ownField(check, 'outcome') : undefined;
  return outcome === 'fail' || outcome === 'cantTell' || outcome === 'pass' ? outcome : null;
}

// Where an occurrence goes in a review: 'fail' for a failure; for an
// undecided one, 'leanFail' or 'leanPass' where its lean points one way, and
// 'open' where only a person can judge; null for neither. The HTML report's
// groups ("Likely fails: confirm", "Likely passes: confirm", "Needs a
// person"), so every tool that sorts a review queue sorts it the same way.
function reviewGroupOf(check, occurrence) {
  const outcome = occurrenceOutcome(check, occurrence);
  if (outcome === 'pass') return null;
  if (outcome !== 'cantTell') return outcome;
  const lean = occurrence && typeof occurrence === 'object' ? ownField(occurrence, 'lean') : null;
  const toward = lean && typeof lean === 'object' ? ownField(lean, 'toward') : undefined;
  if (toward === 'fail') return 'leanFail';
  if (toward === 'pass') return 'leanPass';
  return 'open';
}

module.exports = { tierOf, occurrenceOutcome, reviewGroupOf };
