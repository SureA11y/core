/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check meta-refresh-timing-absent
 * @atomic true
 * @summary <meta http-equiv="refresh"> must not impose a delayed page refresh
 * @standard WCAG 2.2
 * @sc 2.2.1
 * @applicability
 *   Applies to the first <meta http-equiv="refresh"> element, in document
 *   order, whose content attribute has a parseable leading delay value.
 *   Per HTML's shared declarative refresh steps, a document only ever
 *   acts on its first valid meta refresh; any later one (valid or not)
 *   is inert markup a browser never processes, so it is not evaluated.
 * @expectation
 *   The delay is 0 (an immediate redirect, which users cannot be caught by
 *   mid-read), or exceeds 20 hours. Any other positive delay refreshes or
 *   redirects the page on a timer the user did not initiate and cannot
 *   pause, stop, or extend, which WCAG 2.2.1 (Timing Adjustable) requires
 *   be possible.
 * @implementation-notes
 * - An unparseable content value (no leading numeric delay) is not
 *   flagged — this rule only reports a clearly-detected timed refresh,
 *   matching this engine's no-false-positives policy.
 * - WCAG 2.2.1 Exception 3 exempts time limits longer than 20 hours (the
 *   rationale being that a delay this long gives users enough real-world
 *   time to act, so "adjustable" ceases to be a meaningful requirement).
 *   A delay over 72000 seconds is therefore not flagged.
 * - A <meta> nested inside <noscript> is excluded — see
 *   meta-refresh-no-exceptions's header comment for why.
 */

const id = 'meta-refresh-timing-absent';

const meta = {
  title: 'Page must not use a timed meta refresh',
  description:
    'Checks that <meta http-equiv="refresh"> does not impose a positive delay of 20 hours or less.',
  i18n: {
    titleKey: 'metaRefreshTimingAbsent_title',
    descriptionKey: 'metaRefreshTimingAbsent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag221', 'structure', 'atomic', 'automatic'],
  wcagSc: ['2.2.1'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '2.2.1',
      title: 'Timing Adjustable',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'serious',
  category: 'operable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '2.2.1': ['meta-refresh-timing-absent'] } }
};

// This check is inherently whole-document (does the PAGE have this
// property?), not evaluable per-subtree -- notApplicable when contextSelector
// scoped this run narrower than the whole document, or when
// engineOptions.fragment:true was set (see helpers.isWholeDocumentScope).
function applicability(ctx) {
  return ctx.helpers.isWholeDocumentScope ? ctx.helpers.isWholeDocumentScope() : true;
}

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  // WCAG 2.2.1 Exception 3: time limits longer than 20 hours are exempt.
  const EXEMPT_DELAY_SECONDS = 20 * 60 * 60;

  const nodes = document.querySelectorAll
    ? document.querySelectorAll('meta[http-equiv="refresh" i]')
    : [];

  const occurrences = [];
  let applicableCount = 0;

  // HTML's shared declarative refresh steps. Returns the delay in seconds, or
  // null when the value is not a valid refresh directive, in which case the
  // browser never refreshes and there is nothing to report. Rejects a leading
  // sign ("+72001"), a non-numeric time ("foo"), and a separator other than
  // "," or ";" ("0:1").
  function parseRefreshDelay(input) {
    const s = String(input == null ? '' : input);
    const isSpace = (c) => c === ' ' || c === '\t' || c === '\n' || c === '\f' || c === '\r';
    let i = 0;
    while (i < s.length && isSpace(s[i])) i++;
    let digits = '';
    while (i < s.length && s[i] >= '0' && s[i] <= '9') digits += s[i++];
    if (!digits) return null;
    if (s[i] === '.') {
      i++;
      while (i < s.length && s[i] >= '0' && s[i] <= '9') i++;
    }
    if (i >= s.length) return parseInt(digits, 10);
    let sawSpace = false;
    while (i < s.length && isSpace(s[i])) {
      sawSpace = true;
      i++;
    }
    if (i >= s.length) return parseInt(digits, 10);
    if (s[i] === ';' || s[i] === ',' || sawSpace) return parseInt(digits, 10);
    return null;
  }

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;
    if (el.closest && el.closest('noscript')) continue; // never applies with scripting enabled — see meta-refresh-no-exceptions.js's header comment
    const raw = String(el.getAttribute('content') || '').trim();
    if (!raw) continue;

    const delay = parseRefreshDelay(raw);
    if (delay === null) continue;

    // Only the first valid meta refresh in document order is ever acted
    // on by a browser -- any later one is inert and stops being evaluated
    // entirely once a winner has been found.
    applicableCount += 1;

    if (!(delay > 0)) break;
    if (delay > EXEMPT_DELAY_SECONDS) break; // WCAG 2.2.1 Exception 3 (>20 hours)

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: 'This page refreshes itself automatically after a delay.',
        hint: 'Remove the timed meta refresh, or provide a way for users to turn it off, extend it, or pause it before it triggers.',
        i18n: {
          summaryKey: 'metaRefreshTimingAbsent_summary_fail',
          hintKey: 'metaRefreshTimingAbsent_hint_fail',
          params: { delay: String(delay) }
        },
        data: {
          details: { reasonCode: 'META_REFRESH_DELAYED', delay }
        }
      })
    );
    break;
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'serious',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage, applicability };
