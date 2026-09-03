/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check iframe-title-unique
 * @atomic true
 * @summary Deprecated since 1.8.0, reports notApplicable; see identical-iframes-same-purpose
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Nothing. The rule is deprecated and reports notApplicable on every
 *   page. Its id stays in the catalog, with meta.deprecated set and
 *   deprecation.replacedBy naming the successor, so a runOnly list, a
 *   stored baseline or an open Code Scanning alert that holds the id keeps
 *   resolving until the file is removed in 2.0.0 (docs/API_STABILITY.md,
 *   "Rule-ID deprecation policy").
 * @expectation
 *   None. The check this rule used to make, that no two frames share a
 *   title attribute, is not a WCAG 4.1.2 requirement: the criterion asks
 *   that a frame's name be programmatically determinable, not unique, and
 *   ACT rule 4b1c6c accepts identical names on frames that embed equivalent
 *   resources. identical-iframes-same-purpose asks the question 4b1c6c does
 *   ask, of the computed accessible name, which for a frame is the title
 *   attribute unless aria-label or aria-labelledby overrides it.
 * @implementation-notes
 * - Reduced to notApplicable rather than only marked deprecated because a
 *   deprecated rule keeps running and reporting normally, and leaving the
 *   old fail alive until 2.0.0 would have kept reporting a violation WCAG
 *   does not define. docs/DESIGN_CHALLENGES.md records the decision.
 * - IFRAME_TITLE_DUPLICATE is no longer emitted. It stays in
 *   scripts/data/finding-ids.json until the rule is removed, since the
 *   inventory records what was shipped, not what is still produced.
 * - The facet this rule covered under SC 4.1.2 is retired; the coverage
 *   entry points at the successor's facet, so the catalog still shows where
 *   the question is answered.
 */

const id = 'iframe-title-unique';

const meta = {
  title: 'Frame titles must be unique (deprecated)',
  description:
    'Deprecated since 1.8.0 and always notApplicable: whether frames sharing a name embed the same resource is checked by identical-iframes-same-purpose.',
  i18n: {
    titleKey: 'iframeTitleUnique_title',
    descriptionKey: 'iframeTitleUnique_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'structure', 'atomic', 'automatic', 'name', 'iframe'],
  wcagSc: ['4.1.2'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '4.1.2',
      title: 'Name, Role, Value',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'moderate',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  deprecated: true,
  deprecation: {
    replacedBy: 'identical-iframes-same-purpose',
    reason:
      'A repeated title attribute is not a WCAG 4.1.2 violation, and identical-iframes-same-purpose already checks what ACT rule 4b1c6c asks: that frames sharing a name embed the same resource.',
    sinceVersion: '1.8.0'
  },
  coverage: { facetsBySc: { '4.1.2': ['identical-iframes-same-purpose'] } }
};

function runInPage(ctx) {
  const { rule } = ctx;
  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
