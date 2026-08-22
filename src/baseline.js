/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

// docs/BASELINE.md: identity for one violation occurrence is
// `ruleId + reasonCode + html`, on purpose NOT `selector`/`structuralPath`
// (both position-derived, so they shift when unrelated markup changes
// elsewhere on the page; see buildSelector/buildStructuralPath in
// src/core/dom-helpers.js). Unlike src/explain/group.js's computeGroupKey,
// this does not use a coarse structural signature: that's lossy on purpose
// for AI-explanation dedup (one prompt per shape), which would risk a CI gate
// silently treating an actually new violation as "known" just because it
// shares tag/class shape with an old baselined one -- the wrong failure mode
// here. Content-based matching survives incidental DOM changes elsewhere on
// the page; its known limitation is a flagged element with dynamic content
// in its own markup (a timestamp, a live counter) never matching itself
// twice -- acceptable for v1, see docs/BASELINE.md.
function getReasonCode(occurrence) {
  return (
    (occurrence &&
      occurrence.data &&
      occurrence.data.details &&
      occurrence.data.details.reasonCode) ||
    'DEFAULT'
  );
}

function computeBaselineKey(ruleId, reasonCode, html) {
  return `${ruleId}\u0000${reasonCode}\u0000${html}`;
}

function getOccurrenceOutcome(check, occurrence) {
  const occurrenceOutcome =
    occurrence &&
    (occurrence.occurrenceOutcome === 'fail' || occurrence.occurrenceOutcome === 'cantTell'
      ? occurrence.occurrenceOutcome
      : occurrence.outcome === 'fail' || occurrence.outcome === 'cantTell'
        ? occurrence.outcome
        : null);
  if (occurrenceOutcome) return occurrenceOutcome;
  return check && (check.outcome === 'fail' || check.outcome === 'cantTell') ? check.outcome : null;
}

function isFailOccurrence(check, occurrence) {
  if (!check || check.outcome !== 'fail') return false;
  return getOccurrenceOutcome(check, occurrence) === 'fail';
}

// Read-only: one entry per `fail` occurrence (not pre-deduplicated), so the
// written file is a plain reviewable list -- a new violation shows up as one
// new array row in a PR diff, not a changed count. `selector` is kept only
// for human readability in the committed file; matching never reads it.
function buildBaselineEntries(result) {
  const entries = [];

  for (const check of (result && result.checksResults) || []) {
    if (!check || check.outcome !== 'fail' || !Array.isArray(check.occurrences)) continue;

    for (const occurrence of check.occurrences) {
      if (!occurrence || !isFailOccurrence(check, occurrence)) continue;
      entries.push({
        ruleId: check.ruleId,
        reasonCode: getReasonCode(occurrence),
        selector: typeof occurrence.selector === 'string' ? occurrence.selector : '',
        html: typeof occurrence.html === 'string' ? occurrence.html : ''
      });
    }
  }

  return entries;
}

// Read-only: matches a fresh scan's `fail` occurrences against a baseline's
// entries by multiset (not presence/absence), so N identical repeated
// violations (e.g. the same broken component instantiated 3 times) are
// counted correctly rather than all matching a single baseline entry.
// Never mutates `result` or its occurrences.
function matchBaseline(result, baselineEntries) {
  const remaining = new Map();
  for (const entry of Array.isArray(baselineEntries) ? baselineEntries : []) {
    if (!entry) continue;
    const key = computeBaselineKey(
      entry.ruleId,
      entry.reasonCode || 'DEFAULT',
      typeof entry.html === 'string' ? entry.html : ''
    );
    remaining.set(key, (remaining.get(key) || 0) + 1);
  }

  let totalFail = 0;
  let knownCount = 0;
  const newOccurrences = [];

  for (const check of (result && result.checksResults) || []) {
    if (!check || check.outcome !== 'fail' || !Array.isArray(check.occurrences)) continue;

    for (const occurrence of check.occurrences) {
      if (!occurrence || !isFailOccurrence(check, occurrence)) continue;
      totalFail += 1;

      const reasonCode = getReasonCode(occurrence);
      const html = typeof occurrence.html === 'string' ? occurrence.html : '';
      const key = computeBaselineKey(check.ruleId, reasonCode, html);
      const left = remaining.get(key) || 0;

      if (left > 0) {
        remaining.set(key, left - 1);
        knownCount += 1;
      } else {
        newOccurrences.push({
          ruleId: check.ruleId,
          reasonCode,
          selector: occurrence.selector,
          html: occurrence.html,
          summary: occurrence.summary
        });
      }
    }
  }

  let staleCount = 0;
  for (const left of remaining.values()) {
    if (left > 0) staleCount += left;
  }

  return {
    totalFail,
    knownCount,
    newCount: newOccurrences.length,
    newOccurrences,
    staleCount
  };
}

module.exports = { buildBaselineEntries, matchBaseline, computeBaselineKey, getReasonCode };
