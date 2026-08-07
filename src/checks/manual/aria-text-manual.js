/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check aria-text
 * @atomic true
 * @summary role="text" elements should have no focusable descendants
 * @standard Best Practices (no formal WCAG Success Criterion — see ROADMAP.md Tier 1b)
 * @applicability
 *   Elements with an explicit `role="text"`.
 * @expectation
 *   `role="text"` tells assistive technology to treat an element's whole
 *   subtree as a single unit of plain text (e.g. text visually split
 *   across multiple `<span>`s by styling). Per the WAI-ARIA Authoring
 *   Practices, this only makes sense when that subtree contains no
 *   focusable content — a focusable descendant inside a "this is just
 *   text" region is unreachable or confusing for keyboard/AT users.
 * @implementation-notes
 * - Not WCAG-normative — authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule, matching the Tier 1b precedent (see
 *   `landmark-unique`'s header comment for the shared rationale).
 * - "Focusable descendant" is a presence check (link/button/form
 *   control/`[tabindex]`/`iframe`/`[contenteditable]`), the same
 *   conservative selector `scrollable-region-focusable` uses, not a full
 *   focusability computation (disabled state, visibility, etc.).
 */

const id = 'aria-text';

const meta = {
  title: 'role="text" elements should have no focusable descendants',
  description:
    'Checks that elements with role="text" contain no focusable descendant (link, button, form control, tabindex, iframe, or contenteditable).',
  i18n: {
    titleKey: 'ariaText_title',
    descriptionKey: 'ariaText_description'
  },
  helpUrl: null,
  tags: ['best-practice', 'aria', 'structure', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'robust',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const FOCUSABLE_DESCENDANT_SELECTOR =
    'a[href], button, input, select, textarea, [tabindex], iframe, [contenteditable]:not([contenteditable="false"])';

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('[role="text"]')
    : helpers.queryAll('[role="text"]');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.querySelector) continue;

    applicableCount += 1;

    let focusableDescendant;
    try {
      focusableDescendant = el.querySelector(FOCUSABLE_DESCENDANT_SELECTOR);
    } catch {
      focusableDescendant = null;
    }
    if (!focusableDescendant) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : el.outerHTML || '';

    const baseOccurrence = {
      selector: stableSelector,
      html,
      summary: 'This role="text" element contains a focusable descendant.',
      hint: 'Remove role="text" (or remove the focusable descendant) — a "plain text" region should not contain focusable content.',
      i18n: {
        summaryKey: 'ariaText_summary_cantTell',
        hintKey: 'ariaText_hint_cantTell',
        params: {}
      },
      data: {
        details: { reasonCode: 'ROLE_TEXT_HAS_FOCUSABLE_DESCENDANT' }
      }
    };

    if (helpers && typeof helpers.reportOccurrence === 'function') {
      occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
    } else {
      occurrences.push(baseOccurrence);
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'minor',
      occurrences
    };
  }

  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
