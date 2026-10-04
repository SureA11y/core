/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check label-title-only
 * @atomic true
 * @summary Deprecated since 1.10.0, reports notApplicable; see form-control-programmatic-label-quality
 * @standard Best Practices (no formal WCAG Success Criterion)
 * @applicability
 *   Nothing. The rule is deprecated and reports notApplicable on every
 *   page. Its id stays in the catalog, with meta.deprecated set and
 *   deprecation.replacedBy naming the rule that covers it, so a runOnly
 *   list, a stored baseline or code that looks the result up by ruleId
 *   keeps resolving until the file is removed in 2.0.0
 *   (docs/API_STABILITY.md, "Rule-ID deprecation policy").
 * @expectation
 *   None. The case it reported, a form control whose only label is its
 *   title attribute, is reported by form-control-programmatic-label-quality
 *   (label_from_title_primary), which also covers placeholder-only labels,
 *   under SC 3.3.2. Every finding this rule made was a second report of
 *   one that rule makes for the same element.
 * @implementation-notes
 * - Reduced to notApplicable at once, as a duplicate finding is a bug:
 *   the policy keeps a rule reporting until 2.0.0 only when it is being
 *   superseded and its findings are still correct and its own.
 * - LABEL_TITLE_ONLY is no longer emitted. It retires with the duplicate
 *   finding it named, so a stored baseline entry or alert for it closes,
 *   while the same element's label_from_title_primary finding stays.
 */

const id = 'label-title-only';

const meta = {
  title: 'Title-only form labels (deprecated)',
  description:
    'Deprecated since 1.10.0 and always notApplicable: a form control labelled only by its title attribute is reported by form-control-programmatic-label-quality.',
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
  deprecated: true,
  deprecation: {
    replacedBy: 'form-control-programmatic-label-quality',
    reason:
      'Every finding it made duplicated one form-control-programmatic-label-quality makes for the same element, which also covers placeholder-only labels.',
    sinceVersion: '1.10.0'
  },
  coverage: {}
};

function runInPage(ctx) {
  const { rule } = ctx;
  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
