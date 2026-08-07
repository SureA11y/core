/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check table-duplicate-name
 * @atomic true
 * @summary A table's caption must not duplicate its summary attribute
 * @standard Best Practices (no formal WCAG Success Criterion — see ROADMAP.md Tier 1b)
 * @applicability
 *   Applies to <table> elements that have both a <caption> with text
 *   content and a (deprecated but still encountered) summary attribute.
 * @expectation
 *   The caption text and the summary attribute text are not identical
 *   (case-insensitive, normalized). When both are present and say the
 *   same thing, assistive technology that surfaces both announces the
 *   same text twice for one table.
 * @implementation-notes
 * - Not WCAG-normative — authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent.
 * - Narrowly scoped to caption-vs-summary duplication specifically, not a
 *   general "table name quality" check.
 */

const id = 'table-duplicate-name';

const meta = {
  title: 'Table caption must not duplicate its summary attribute',
  description:
    "Checks that a <table>'s <caption> text is not identical to its (deprecated) summary attribute.",
  i18n: {
    titleKey: 'tableDuplicateName_title',
    descriptionKey: 'tableDuplicateName_description'
  },
  helpUrl: null,
  tags: ['best-practice', 'tables', 'structure', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  function normalizeWs(s) {
    return String(s || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('table[summary]')
    : helpers.queryAll('table[summary]');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;
    const summary = normalizeWs(el.getAttribute('summary'));
    if (!summary) continue;

    const captionEl = el.querySelector ? el.querySelector('caption') : null;
    const captionText = captionEl ? normalizeWs(captionEl.textContent) : '';
    if (!captionText) continue;

    applicableCount += 1;

    if (captionText.toLowerCase() !== summary.toLowerCase()) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : el.outerHTML || '';

    occurrences.push({
      selector: stableSelector,
      html,
      summary: "This table's caption duplicates its summary attribute.",
      hint: 'Remove the redundant summary attribute, or make it provide different information than the caption.',
      i18n: {
        summaryKey: 'tableDuplicateName_summary_cantTell',
        hintKey: 'tableDuplicateName_hint_cantTell',
        params: {}
      },
      data: {
        details: { reasonCode: 'TABLE_CAPTION_SUMMARY_DUPLICATE' }
      }
    });
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
