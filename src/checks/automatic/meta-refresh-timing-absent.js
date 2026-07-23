'use strict';

/**
 * @check a11ycore-meta-refresh-timing-absent
 * @atomic true
 * @summary <meta http-equiv="refresh"> must not impose a delayed page refresh
 * @standard WCAG 2.2
 * @sc 2.2.1
 * @applicability
 *   Applies to <meta http-equiv="refresh"> elements that carry a non-empty
 *   content attribute with a parseable leading delay value.
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
 *   a11ycore-meta-refresh-no-exceptions's header comment for why.
 */

const id = 'a11ycore-meta-refresh-timing-absent';

const meta = {
  title: 'Page must not use a timed meta refresh',
  description: 'Checks that <meta http-equiv="refresh"> does not impose a positive delay of 20 hours or less.',
  i18n: {
    titleKey: 'a11ycore_metaRefreshTimingAbsent_title',
    descriptionKey: 'a11ycore_metaRefreshTimingAbsent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag221', 'structure', 'atomic', 'automatic'],
  wcagSc: ['2.2.1'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '2.2.1', title: 'Timing Adjustable', conformanceLevel: 'A' }
  ],
  defaultSeverity: 'serious',
  category: 'operable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '2.2.1': ['meta-refresh-timing-absent'] } }
};

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  // WCAG 2.2.1 Exception 3: time limits longer than 20 hours are exempt.
  const EXEMPT_DELAY_SECONDS = 20 * 60 * 60;

  const nodes = document.querySelectorAll ? document.querySelectorAll('meta[http-equiv="refresh" i]') : [];

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;
    if (el.closest && el.closest('noscript')) continue; // never applies with scripting enabled — see meta-refresh-no-exceptions.js's header comment
    const raw = String(el.getAttribute('content') || '').trim();
    if (!raw) continue;

    const match = raw.match(/^([0-9]*\.?[0-9]+)/);
    if (!match) continue;
    const delay = parseFloat(match[1]);
    if (Number.isNaN(delay)) continue;

    applicableCount += 1;

    if (!(delay > 0)) continue;
    if (delay > EXEMPT_DELAY_SECONDS) continue; // WCAG 2.2.1 Exception 3 (>20 hours)

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    occurrences.push({
      selector: stableSelector,
      html,
      summary: 'This page refreshes itself automatically after a delay.',
      hint: 'Remove the timed meta refresh, or provide a way for users to turn it off, extend it, or pause it before it triggers.',
      i18n: {
        summaryKey: 'a11ycore_metaRefreshTimingAbsent_summary_fail',
        hintKey: 'a11ycore_metaRefreshTimingAbsent_hint_fail',
        params: { delay: String(delay) }
      },
      data: {
        details: { reasonCode: 'META_REFRESH_DELAYED', delay }
      }
    });
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'serious', occurrences };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };