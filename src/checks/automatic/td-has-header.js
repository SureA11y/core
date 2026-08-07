'use strict';

/**
 * @check td-has-header
 * @atomic true
 * @summary Data cells in large tables must have an associated header
 * @standard WCAG 2.2
 * @sc 1.3.1
 * @applicability
 *   `<table>` elements with at least 4 rows and at least 4 columns
 *   (a "large" table, where implicit row/column header association is
 *   genuinely useful — small tables are usually self-evident), and with
 *   NO `colspan`/`rowspan` anywhere in the table.
 * @expectation
 *   Every `<td>` has an associated header, via one of:
 *     - a non-empty `headers` attribute (trusted here; whether it
 *       resolves to real `<th>` ids is `table-headers-attr-valid`'s
 *       concern, not this rule's), OR
 *     - an implicit column header: some `<th>` in the same column, in an
 *       earlier row, OR
 *     - an implicit row header: some `<th>` earlier in the same row.
 * @implementation-notes
 * - Closes the gap `table-th-has-data-cells` deliberately deferred (see
 *   that rule's own implementation notes): this is the fuller positional
 *   header-association algorithm, but still intentionally scoped —
 *   tables with any `colspan`/`rowspan` are skipped entirely (marked
 *   `notApplicable`) rather than risk a wrong column-index computation
 *   producing a false `fail`.
 * - The `headers`-attribute branch does not itself validate that the
 *   referenced ids exist or point at `<th>` elements — that's already
 *   `table-headers-attr-valid`'s job.
 */

const id = 'td-has-header';

const meta = {
  title: 'Data cells in large tables must have an associated header',
  description:
    'Checks that every <td> in a large, simple (no colspan/rowspan) table has an associated header — via a headers attribute, an implicit column <th> above it, or an implicit row <th> to its left.',
  i18n: {
    titleKey: 'tdHasHeader_title',
    descriptionKey: 'tdHasHeader_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag131', 'structure', 'atomic', 'automatic'],
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
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '1.3.1': ['td-has-header'] } }
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const MIN_SIZE = 4;

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

  const tables = helpers.queryAllSmart ? helpers.queryAllSmart('table') : helpers.queryAll('table');

  const occurrences = [];
  let applicableCount = 0;

  for (const table of tables) {
    if (!table || !table.rows) continue;

    const rows = Array.from(table.rows);
    if (rows.length < MIN_SIZE) continue;

    const rowCells = rows.map((r) => Array.from(r.cells || []));
    const maxCols = rowCells.reduce((m, cells) => Math.max(m, cells.length), 0);
    if (maxCols < MIN_SIZE) continue;

    const hasSpan = rowCells.some((cells) =>
      cells.some((c) => {
        const cs = Number.parseInt(c.getAttribute('colspan') || '1', 10);
        const rs = Number.parseInt(c.getAttribute('rowspan') || '1', 10);
        return (Number.isFinite(cs) && cs > 1) || (Number.isFinite(rs) && rs > 1);
      })
    );
    if (hasSpan) continue;

    applicableCount += 1;

    // An aria-hidden <th> is removed from the accessibility tree entirely
    // -- a screen reader never announces it, so it can't actually serve as
    // another cell's row/column header, even though it's still structurally
    // a <th>.
    function isHeaderCell(cell) {
      return !!(cell && cell.tagName && cell.tagName.toLowerCase() === 'th' && isEligible(cell));
    }

    function hasColumnHeaderAbove(r, c) {
      for (let ri = 0; ri < r; ri++) {
        const cell = rowCells[ri] && rowCells[ri][c];
        if (isHeaderCell(cell)) return true;
      }
      return false;
    }

    function hasRowHeaderBefore(r, c) {
      const cells = rowCells[r] || [];
      for (let ci = 0; ci < c; ci++) {
        if (isHeaderCell(cells[ci])) return true;
      }
      return false;
    }

    for (let r = 0; r < rowCells.length; r++) {
      const cells = rowCells[r];
      for (let c = 0; c < cells.length; c++) {
        const cell = cells[c];
        if (!cell || isHeaderCell(cell)) continue;

        // An aria-hidden data cell isn't exposed to AT either, so it has
        // no need for an accessible header association.
        if (!isEligible(cell)) continue;

        const headersAttr = trim(cell.getAttribute('headers'));
        if (headersAttr) continue;

        if (hasColumnHeaderAbove(r, c)) continue;
        if (hasRowHeaderBefore(r, c)) continue;

        const stableSelector = helpers.buildSelector ? helpers.buildSelector(cell) : 'html';
        const html = helpers.getOuterHtmlSnippet
          ? helpers.getOuterHtmlSnippet(cell)
          : cell.outerHTML || '';

        occurrences.push({
          selector: stableSelector,
          html,
          summary:
            'This data cell has no associated header (no headers attribute, no column <th> above it, no row <th> to its left).',
          hint: 'Add a headers attribute referencing the relevant <th> id(s), or restructure the table so this cell has an implicit row/column header.',
          i18n: {
            summaryKey: 'tdHasHeader_summary_fail',
            hintKey: 'tdHasHeader_hint_fail',
            params: { row: String(r), column: String(c) }
          },
          data: {
            details: { reasonCode: 'TD_NO_ASSOCIATED_HEADER', row: r, column: c }
          }
        });
      }
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'serious',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
