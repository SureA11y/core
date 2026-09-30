/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check doctype-present
 * @atomic true
 * @summary The document must declare a doctype before <html>
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to a run over a whole document. A run narrowed by
 *   contextSelector, or by engineOptions.fragment, is notApplicable: a
 *   subtree has no doctype of its own.
 * @expectation
 *   The document has a doctype (RGAA 8.1.1). A doctype written after
 *   <html> is dropped by the HTML parser, so it reads as missing here; the
 *   8.1.1 methodology checks that the doctype comes before <html>.
 * @implementation-notes
 * - Whether a declared doctype is valid (RGAA 8.1.2) is doctype-valid's
 *   question, so any declared doctype passes here.
 * - Opt-in (tag `rgaa`): WCAG does not require a doctype, so the rule runs
 *   only under the rgaa-4.1.2 profile, the `rgaa` tag or its own id.
 */

const id = 'doctype-present';

const meta = {
  title: 'Page declares a doctype',
  description: 'Checks that the document has a doctype, written before the <html> element.',
  i18n: {
    titleKey: 'doctypePresent_title',
    descriptionKey: 'doctypePresent_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'structure', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
};

function applicability(ctx) {
  return ctx.helpers.isWholeDocumentScope ? ctx.helpers.isWholeDocumentScope() : true;
}

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  if (document.doctype) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }

  // A doctype is not an element, so the finding is reported on <html>.
  const occurrence = helpers.reportOccurrence(document.documentElement, {
    selector: 'html',
    html: '<!DOCTYPE>(missing)',
    summary: 'The page has no doctype.',
    hint: 'Start the page with <!DOCTYPE html>, before the <html> element.',
    i18n: {
      summaryKey: 'doctypePresent_summary_fail_missing',
      hintKey: 'doctypePresent_hint_fail',
      params: {}
    },
    data: {
      details: { reasonCode: 'missingDoctype', doctype: '' },
      visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
    }
  });

  return {
    ruleId: rule.ruleId,
    outcome: 'fail',
    severity: rule.defaultSeverity || 'moderate',
    occurrences: [occurrence]
  };
}

module.exports = { id, meta, runInPage, applicability };
