'use strict';

/**
 * @check table-fake-caption
 * @atomic true
 * @summary A table's first row should not stand in for a real <caption>
 * @standard WCAG 2.2
 * @sc 1.3.1
 * @applicability
 *   `<table>` elements with no `<caption>` child, at least two rows, and
 *   a first row containing exactly one non-empty-text cell while at
 *   least one other row has more than one cell.
 * @expectation
 *   A single lone cell in the first row, sitting above rows that clearly
 *   have multiple columns, strongly suggests the author is using it as a
 *   visual caption/title rather than as a real table cell. Structure
 *   conveyed only through this positional convention is not
 *   programmatically associated with the table the way a real
 *   `<caption>` element is (1.3.1).
 * @implementation-notes
 * - Heuristic (a legitimately narrow first data row is possible, if
 *   uncommon), so authored as `type: 'manual'` (cantTell-capped, never
 *   fail) rather than a hard fail — same conservative posture as
 *   `p-as-heading`.
 * - Does not attempt full colspan/rowspan-aware column counting; "more
 *   than one cell" on another row is used as the multi-column signal,
 *   which is simple, deterministic, and sufficient for the heuristic's
 *   purpose without risking a wrong column-index computation.
 */

const id = 'table-fake-caption';

const meta = {
  title: "A table's first row should not stand in for a real <caption>",
  description:
    'Flags tables with no <caption> whose first row has a single non-empty cell while other rows have multiple cells, for manual review of whether that cell is acting as a fake caption.',
  i18n: {
    titleKey: 'tableFakeCaption_title',
    descriptionKey: 'tableFakeCaption_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag131', 'structure', 'atomic', 'manual'],
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
  defaultSeverity: 'minor',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'low',
  coverage: { facetsBySc: { '1.3.1': ['table-fake-caption-evidence'] } }
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  function trim(v) {
    return (v == null ? '' : String(v)).trim();
  }

  const isAccTreeEligible =
    helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;

  function isEligible(node) {
    if (!isAccTreeEligible) return true;
    try {
      const r = isAccTreeEligible(node, ctx);
      return !!(r && r.eligible);
    } catch {
      return true;
    }
  }

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('table') : helpers.queryAll('table');

  const occurrences = [];
  let applicableCount = 0;

  for (const table of nodes) {
    if (!table || !table.rows) continue;

    const hasCaption = !!(table.querySelector && table.querySelector('caption'));
    if (hasCaption) continue;

    // An aria-hidden row (or cell) isn't part of the AT-perceived table
    // structure at all -- it must not be treated as the table's "first
    // row" (or counted toward a row's cell count) for this positional
    // heuristic.
    const rows = Array.from(table.rows).filter(isEligible);
    if (rows.length < 2) continue;

    applicableCount += 1;

    const firstRow = rows[0];
    const firstRowCells = Array.from(firstRow.cells || []).filter(isEligible);
    if (firstRowCells.length !== 1) continue;

    const candidateCell = firstRowCells[0];
    const candidateText = trim(candidateCell.textContent || '');
    if (!candidateText) continue;

    const hasMultiCellRow = rows
      .slice(1)
      .some((r) => Array.from(r.cells || []).filter(isEligible).length > 1);
    if (!hasMultiCellRow) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(table) : 'html';
    const html = helpers.getOuterHtmlSnippet
      ? helpers.getOuterHtmlSnippet(table)
      : table.outerHTML || '';

    const baseOccurrence = {
      selector: stableSelector,
      html,
      summary:
        'This table has no <caption>, but its first row is a single cell sitting above multi-cell rows — it may be acting as a fake caption.',
      hint: 'If this cell is meant to describe the table, use a real <caption> element instead of a lone first-row cell.',
      i18n: {
        summaryKey: 'tableFakeCaption_summary_cantTell',
        hintKey: 'tableFakeCaption_hint_cantTell',
        params: {}
      },
      data: {
        details: { reasonCode: 'SINGLE_CELL_FIRST_ROW_NO_CAPTION' }
      }
    };

    if (helpers && typeof helpers.reportOccurrence === 'function') {
      occurrences.push(helpers.reportOccurrence(table, baseOccurrence));
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
