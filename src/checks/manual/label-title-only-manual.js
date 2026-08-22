/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check label-title-only
 * @atomic true
 * @summary Form controls should not rely on the title attribute as their only label
 * @standard Best Practices (no formal WCAG Success Criterion)
 * @applicability
 *   Applies to labelable form controls (input, excluding
 *   hidden/submit/reset/button/image; select; textarea) that have a
 *   non-empty title attribute.
 * @expectation
 *   The control also has a real label (a wrapping/associated <label>,
 *   aria-label, or aria-labelledby), rather than depending on the title
 *   attribute alone. A title-only tooltip is not reliably exposed by all
 *   assistive technology and is not visible at all until hover/focus,
 *   unlike a persistent visible label.
 * @implementation-notes
 * - Not WCAG-normative, authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent.
 * - Distinct from form-control-programmatic-label-present (that
 *   rule accepts title as one of several valid presence mechanisms;
 *   this rule flags the narrower case where title is the ONLY one).
 */

const id = 'label-title-only';

const meta = {
  title: 'Form controls should not use title as their only label',
  description:
    'Checks that a form control with a title attribute also has a real label (label element, aria-label, or aria-labelledby).',
  i18n: {
    titleKey: 'labelTitleOnly_title',
    descriptionKey: 'labelTitleOnly_description'
  },
  helpUrl: null,
  tags: ['best-practice', 'forms', 'structure', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'understandable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const selector =
    'input:not([type="hidden"]):not([type="submit"]):not([type="reset"]):not([type="button"]):not([type="image"]),select,textarea';
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(selector)
    : helpers.queryAll(selector);

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;

    if (helpers.isAccTreeEligible) {
      const elig = (() => {
        try {
          return helpers.isAccTreeEligible(el, ctx);
        } catch {
          return { eligible: true, reasons: [] };
        }
      })();
      if (elig && elig.eligible === false) continue;
    }

    const title = String(el.getAttribute('title') || '').trim();
    if (!title) continue;

    applicableCount += 1;

    // Delegates to the shared helpers.getAccessibleNameInfo (aria ->
    // native <label> -> title, the same precedence every other
    // name-dependent rule in this engine uses) rather than a local,
    // hand-rolled "does a <label for>/wrapping <label> exist" check. A
    // structural-association-only check (for="..."/wrapping) never verifies
    // the label actually contributes a name -- an empty <label for="x">
    // </label> or empty wrapping <label> would exempt the control even
    // though title is functionally its only real label (see
    // dom-helpers.js's hasLabelAssociation/labelContributesAccessibleName).
    // If the resolved mechanism isn't 'title', some higher-priority
    // mechanism (aria-label/aria-labelledby/a real contributing label)
    // already won and this control isn't title-only.
    const nameInfo = helpers.getAccessibleNameInfo ? helpers.getAccessibleNameInfo(el, ctx) : null;
    if (!nameInfo || nameInfo.mechanism !== 'title') continue;

    const tag = el.tagName.toLowerCase();

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: 'This form control relies on the title attribute as its only label.',
        hint: 'Add a visible <label> (or aria-label/aria-labelledby) in addition to, or instead of, the title attribute.',
        i18n: {
          summaryKey: 'labelTitleOnly_summary_cantTell',
          hintKey: 'labelTitleOnly_hint_cantTell',
          params: { element: tag }
        },
        data: {
          details: { reasonCode: 'LABEL_TITLE_ONLY', element: tag }
        }
      })
    );
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
