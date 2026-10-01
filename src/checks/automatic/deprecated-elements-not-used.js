/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check deprecated-elements-not-used
 * @atomic true
 * @summary Scrolling <marquee> content needs a way to pause, stop, or hide it
 * @standard WCAG 2.2
 * @sc 2.2.2
 * @applicability
 *   Applies to any scan scope; whether it contains a <marquee> element is
 *   always an answerable question. <marquee> is an obsolete, non-standard
 *   HTML element that browsers still render as auto-scrolling text, with no
 *   built-in user mechanism to pause, stop, or hide it.
 * @expectation
 *   Each <marquee> is reported as cantTell: the scrolling itself is certain,
 *   but a page can offer its own pause or stop control (a button calling the
 *   element's stop() method, for example), and then failure F16 does not
 *   apply. Whether such a control exists is for a person to check. A scope
 *   with no <marquee> passes; there is no separate not-applicable case.
 * @implementation-notes
 * - <blink> is not reported. No current browser makes it blink: it renders
 *   as an unknown inline element, so it holds no blinking content for 2.2.2
 *   to govern.
 * - Not rule-gated on isAccTreeEligible: presence in markup is what the rule
 *   asks about, independent of visibility. Engine-level hidden-subtree
 *   filtering still applies unless engineOptions.includeHiddenElements is
 *   true.
 */

const id = 'deprecated-elements-not-used';

const meta = {
  title: 'Scrolling <marquee> content must be possible to pause, stop, or hide',
  description:
    'Asks, for each obsolete <marquee> element, whether the page offers a way to pause, stop, or hide its auto-scrolling content, since the element itself has none.',
  i18n: {
    titleKey: 'deprecatedElements_title',
    descriptionKey: 'deprecatedElements_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag222', 'structure', 'atomic', 'automatic'],
  wcagSc: ['2.2.2'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '2.2.2',
      title: 'Pause, Stop, Hide',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'serious',
  category: 'operable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '2.2.2': ['deprecated-non-stoppable-elements-absent'] } }
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('marquee')
    : helpers.queryAll('marquee');

  const occurrences = [];

  for (const el of nodes) {
    if (!el || !el.tagName) continue;

    const tag = el.tagName.toLowerCase();

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary:
          'This <marquee> scrolls its content, and the element itself gives the user no way to pause, stop, or hide it.',
        hint: 'Check that the page offers a control that pauses, stops, or hides this content. Better: replace it with static content, or with an animation that has a pause/stop control.',
        occurrenceOutcome: 'cantTell',
        i18n: {
          summaryKey: 'deprecatedElements_summary_cantTell',
          hintKey: 'deprecatedElements_hint_cantTell',
          params: { element: tag }
        },
        uncertainty: {
          code: 'runtime-dependent',
          needed:
            'Whether the page provides a control that pauses, stops, or hides the scrolling content.',
          evidence: { element: tag }
        },
        data: {
          details: { reasonCode: 'MARQUEE_PAUSE_MECHANISM_UNKNOWN', element: tag }
        }
      })
    );
  }

  // No <marquee> in scope is itself the passing case (see @expectation above).
  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'serious',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
