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

// Where an occurrence goes in a review: 'fail' for a failure; for an
// undecided one, 'leanFail' or 'leanPass' where its lean points one way, and
// 'open' where only a person can judge; null for neither. The HTML report's
// groups ("Likely fails: confirm", "Likely passes: confirm", "Needs a
// person"), so every tool that sorts a review queue sorts it the same way.
function reviewGroupOf(check, occurrence) {
  const outcome = occurrenceOutcome(check, occurrence);
  if (outcome !== 'cantTell') return outcome;
  const toward = occurrence && occurrence.lean && occurrence.lean.toward;
  if (toward === 'fail') return 'leanFail';
  if (toward === 'pass') return 'leanPass';
  return 'open';
}

// The standards a reporter's failOnVerdicts option names, as keys
// ('wai-aria'), from an array or a comma-separated string. `who` names the
// reporter in the error a value of another kind gives.
function verdictStandardsOption(value, who) {
  if (value === undefined || value === null) return [];
  const list = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[\s,]+/)
      : null;
  if (!list || list.some((k) => typeof k !== 'string')) {
    throw new TypeError(
      `${who}: failOnVerdicts must be a standard's key or a list of them, such as ['wai-aria'], not ${JSON.stringify(value)}`
    );
  }
  return list.map((k) => k.trim().toLowerCase()).filter(Boolean);
}

// Whether a finding fails one of the standards named, by the verdicts the
// scan gave it (engineOptions.verdicts): a cantTell for WCAG that is a
// certain failure under WAI-ARIA, say.
function failsVerdictOf(occurrence, standards) {
  const v = occurrence && occurrence.verdicts;
  if (!v || typeof v !== 'object' || !standards || !standards.length) return false;
  return standards.some((k) => v[k] === 'fail');
}

module.exports = {
  tierOf,
  occurrenceOutcome,
  reviewGroupOf,
  verdictStandardsOption,
  failsVerdictOf
};
