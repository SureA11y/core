'use strict';

/**
 * @check table-th-has-data-cells
 * @atomic true
 * @summary <th> elements must describe at least one data cell
 * @standard WCAG 2.2
 * @sc 1.3.1
 * @applicability
 *   Applies to <table> elements that contain at least one <th>.
 * @expectation
 *   The table also contains at least one <td> somewhere in it.
 * @implementation-notes
 * - DELIBERATELY SCOPED (see aria-helpers.js file header for the same
 *   conservative-scope rationale used throughout this engine): this rule
 *   does NOT implement the full HTML5 header-association algorithm
 *   (resolving which specific data cells a given <th scope="row"|"col">
 *   describes, accounting for colspan/rowspan and default-scope
 *   inference). That algorithm is one of the more error-prone parts of
 *   the HTML spec to reimplement correctly, and a wrong positional match
 *   would risk a false `fail` — unacceptable for this engine's fail-
 *   integrity bar.
 * - Instead, this rule only catches the single unambiguous case: a table
 *   that has <th> elements but ZERO <td> elements anywhere. In that case
 *   every <th> in the table trivially describes no data cell — no
 *   positional analysis is needed to know that. A table that has at
 *   least one <td> somewhere is not evaluated further by this rule, even
 *   if some particular <th> in it doesn't actually describe any cell
 *   (false negative, not a false positive — acceptable under this
 *   engine's philosophy).
 * - Not rule-gated on isAccTreeEligible: this remains a static-markup
 *   property, while engine-level hidden-subtree filtering still applies
 *   unless engineOptions.includeHiddenElements is true.
 */

const id = 'table-th-has-data-cells';

const meta = {
  title: '<th> elements must describe at least one data cell',
  description:
    'Checks that a table containing <th> elements also contains at least one <td> data cell for those headers to describe.',
  i18n: {
    titleKey: 'tableThHasDataCells_title',
    descriptionKey: 'tableThHasDataCells_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag131', 'structure', 'atomic', 'automatic', 'table'],
  wcagSc: ['1.3.1'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.3.1',
      title: 'Info and Relationships',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '1.3.1': ['table-th-has-data-cells'] } }
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const tables = helpers.queryAllSmart ? helpers.queryAllSmart('table') : helpers.queryAll('table');

  const occurrences = [];
  let applicableCount = 0;

  for (const table of tables) {
    if (!table || !table.querySelectorAll) continue;

    let ths;
    try {
      ths = table.querySelectorAll('th');
    } catch {
      ths = [];
    }
    if (!ths.length) continue;

    applicableCount += 1;

    let hasDataCell;
    try {
      hasDataCell = table.querySelectorAll('td').length > 0;
    } catch {
      hasDataCell = false;
    }
    if (hasDataCell) continue;

    for (const th of ths) {
      if (!th) continue;
      const stableSelector = helpers.buildSelector ? helpers.buildSelector(th) : 'html';
      const html = helpers.getOuterHtmlSnippet
        ? helpers.getOuterHtmlSnippet(th)
        : th.outerHTML || '';

      occurrences.push({
        selector: stableSelector,
        html,
        summary: 'This table has header cells but no data cells for them to describe.',
        hint: 'Add data cells (<td>) to the table, or remove the header cells if the table has no data.',
        i18n: {
          summaryKey: 'tableThHasDataCells_summary_fail',
          hintKey: 'tableThHasDataCells_hint_fail',
          params: {}
        },
        data: {
          details: { reasonCode: 'TABLE_TH_NO_DATA_CELLS' }
        }
      });
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'moderate',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
