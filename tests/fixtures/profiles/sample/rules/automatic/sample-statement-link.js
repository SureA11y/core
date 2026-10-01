/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check sample-statement-link
 * @atomic true
 * @summary The page links to its accessibility statement
 * @standard Sample Standard S6 (no WCAG Success Criterion)
 * @applicability
 *   Applies to a page scanned as a whole.
 * @expectation
 *   A link whose text names the accessibility statement. Version 2.0 of the
 *   standard also asks for it inside the page's <footer>; version 1.0, and a
 *   run that names no version (ctx.standard is null), accept it anywhere.
 */

const id = 'sample-statement-link';

const meta = {
  title: 'Every page links to the accessibility statement',
  description: 'Checks that the page links to its accessibility statement.',
  i18n: {
    titleKey: 'sampleStatementLink_title',
    descriptionKey: 'sampleStatementLink_description'
  },
  helpUrl: null,
  tags: ['sample', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
};

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;
  if (!helpers.isWholeDocumentScope()) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  const inFooter = !!(ctx.standard && ctx.standard.version === '2.0');
  const links = Array.prototype.slice.call(document.querySelectorAll('a[href]'));
  const found = links.some(
    (a) =>
      /accessibility statement/i.test(String(a.textContent || '')) &&
      (!inFooter || !!a.closest('footer'))
  );
  if (found) return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  return {
    ruleId: rule.ruleId,
    outcome: 'fail',
    severity: rule.defaultSeverity || 'moderate',
    occurrences: [
      helpers.reportOccurrence(document.body || document.documentElement, {
        summary: inFooter
          ? 'The page footer has no link to the accessibility statement.'
          : 'The page has no link to the accessibility statement.',
        hint: 'Link to the accessibility statement from every page.',
        i18n: {
          summaryKey: inFooter
            ? 'sampleStatementLink_summary_fail_footer'
            : 'sampleStatementLink_summary_fail',
          hintKey: 'sampleStatementLink_hint_fail',
          params: {}
        },
        data: { details: { reasonCode: inFooter ? 'NOT_IN_FOOTER' : 'MISSING' } }
      })
    ]
  };
}

module.exports = { id, meta, runInPage };
