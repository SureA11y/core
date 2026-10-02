/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check sample-title-length
 * @atomic true
 * @summary The page title is at most 60 characters
 * @standard Sample Standard S5 (no WCAG Success Criterion)
 * @applicability
 *   Applies to a page with a non-empty <title>, scanned as a whole.
 * @expectation
 *   The title, trimmed, is 60 characters or fewer.
 */

const id = 'sample-title-length';

const meta = {
  title: 'Page titles are short',
  description: 'Checks that the page title is at most 60 characters.',
  i18n: {
    titleKey: 'sampleTitleLength_title',
    descriptionKey: 'sampleTitleLength_description'
  },
  helpUrl: null,
  tags: ['sample', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'understandable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
};

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;
  const titleEl = document.querySelector('title');
  const text = titleEl ? String(titleEl.textContent || '').trim() : '';
  if (!helpers.isWholeDocumentScope() || !text) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (text.length <= 60) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'fail',
    severity: rule.defaultSeverity || 'minor',
    occurrences: [
      helpers.reportOccurrence(titleEl, {
        summary: `The page title is ${text.length} characters long.`,
        hint: 'Shorten the title to 60 characters or fewer.',
        i18n: {
          summaryKey: 'sampleTitleLength_summary_fail',
          hintKey: 'sampleTitleLength_hint_fail',
          params: { length: text.length }
        },
        data: { details: { reasonCode: 'TITLE_TOO_LONG', length: text.length } }
      })
    ]
  };
}

module.exports = { id, meta, runInPage };
