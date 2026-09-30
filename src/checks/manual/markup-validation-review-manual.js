/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check markup-validation-review
 * @atomic true
 * @summary The generated source code should be checked with the W3C validator
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to every page: RGAA 8.2 asks, for every page, whether its
 *   generated source code is valid for its document type.
 * @expectation
 *   Always cantTell, never pass or fail. One occurrence at the scan root
 *   asks a person to run the W3C validator (Nu HTML Checker) on the
 *   generated source of the page, as RGAA 8.2.1 step 1 says (« activer
 *   l'option W3C Nu markup checker »), and to check its five conditions:
 *   tags, attributes and values follow the writing rules; tags are nested
 *   correctly; tags are opened and closed correctly; id values are unique;
 *   no attribute appears twice on one element.
 * @implementation-notes
 * - Manual (cantTell): the HTML parser repairs unclosed and misnested tags,
 *   drops a repeated attribute and a stray doctype, and moves misplaced
 *   elements before the engine sees the page, so the DOM cannot show most
 *   of what 8.2.1 checks. The rules that report 8.2.1 failures from the
 *   DOM (duplicate-id, aria-role-conformance, aria-attribute-conformance
 *   and the other validity rules) cover only part of the test, so without
 *   this question a page they all pass would roll 8.2 up to pass.
 * - The question stands even when those rules fail: the validator may
 *   report more.
 * - Opt-in (tag `rgaa`): the question belongs to RGAA's criterion 8.2.
 */

const id = 'markup-validation-review';

const meta = {
  title: 'The generated source code is checked with the W3C validator',
  description:
    'Asks a person to run the W3C validator on the generated source code of the page and check the conditions of RGAA 8.2.1, most of which the engine cannot see once the browser has parsed the page.',
  i18n: {
    titleKey: 'markupValidationReview_title',
    descriptionKey: 'markupValidationReview_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'structure', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'robust',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  const roots = Array.isArray(ctx.root) ? ctx.root : ctx.root ? [ctx.root] : [];
  const scanRoot =
    roots.find((r) => r && r.nodeType === 1) || (document && document.documentElement);
  if (!scanRoot) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrence = helpers.reportOccurrence(scanRoot, {
    summary:
      'Run the W3C validator on the generated source code of this page: the engine cannot see unclosed or misnested tags, repeated attributes and other errors the browser repairs.',
    hint: 'Validate the generated source (for example with the W3C Nu HTML Checker) and check that tags, attributes and values follow the writing rules, tags are nested, opened and closed correctly, id values are unique and no attribute appears twice on one element (RGAA 8.2.1).',
    i18n: {
      summaryKey: 'markupValidationReview_summary_cantTell_page',
      hintKey: 'markupValidationReview_hint_cantTell_page',
      params: {}
    },
    data: {
      details: { reasonCode: 'pageReview' },
      visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
    }
  });

  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'moderate',
    occurrences: [occurrence]
  };
}

module.exports = { id, meta, runInPage };
