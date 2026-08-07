/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check deprecated-elements-not-used
 * @atomic true
 * @summary Obsolete non-stoppable elements must not be used
 * @standard WCAG 2.2
 * @sc 2.2.2
 * @applicability
 *   Applies to any <blink> or <marquee> element present in scope. These are
 *   obsolete, non-standard HTML elements whose defining behavior (blinking
 *   or auto-scrolling text) has no built-in user mechanism to pause, stop,
 *   or hide it.
 * @expectation
 *   Neither element is present. Since their movement can never be paused,
 *   stopped, or hidden by the user, presence is itself the violation — this
 *   rule has no partial-pass case (it reports only when the element is
 *   found).
 * @implementation-notes
 * - Not rule-gated on isAccTreeEligible: presence in markup is itself the
 *   violation, independent of visibility (moving/blinking content inside a
 *   hidden ancestor could still become visible later without a code
 *   change, so hiding it today does not remove the underlying defect).
 *   Engine-level hidden-subtree filtering still applies unless
 *   engineOptions.includeHiddenElements is true.
 */

const id = 'deprecated-elements-not-used';

const meta = {
  title: 'Obsolete non-stoppable elements (<blink>, <marquee>) must not be used',
  description:
    'Checks that deprecated, non-standard HTML elements whose blinking/scrolling content cannot be paused, stopped, or hidden by the user (<blink>, <marquee>) are not present.',
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
    ? helpers.queryAllSmart('blink, marquee')
    : helpers.queryAll('blink, marquee');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.tagName) continue;

    applicableCount += 1;

    const tag = el.tagName.toLowerCase();
    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : el.outerHTML || '';

    occurrences.push({
      selector: stableSelector,
      html,
      summary: 'This element’s content cannot be paused, stopped, or hidden by the user.',
      hint: 'Remove this element; use static content, or an animation with a user-facing pause/stop control, instead.',
      i18n: {
        summaryKey: 'deprecatedElements_summary_fail',
        hintKey: 'deprecatedElements_hint_fail',
        params: { element: tag }
      },
      data: {
        details: { reasonCode: 'DEPRECATED_NON_STOPPABLE_ELEMENT', element: tag }
      }
    });
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

module.exports = { id, meta, runInPage };
