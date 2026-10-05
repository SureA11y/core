/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check complex-table-summary
 * @atomic true
 * @summary A complex data table should have a summary
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to complex data tables, in RGAA's sense: tables whose header
 *   cells are not all in the first row or the first column, or whose
 *   headers do not apply to a whole row or column. A <table>, or an element
 *   with role="table" (5.1.1 step 1), counts as complex when:
 *   - a header cell (<th>, role="columnheader" or role="rowheader") sits
 *     outside both the first row and the first column;
 *   - a cell uses the headers attribute;
 *   - a header has scope="rowgroup" or scope="colgroup"; or
 *   - two or more first-row headers each span several columns (as in
 *     "2025" and "2026" over their quarters), or two or more first-column
 *     headers each span several rows, so each heads a group of columns or
 *     rows rather than whole ones.
 *   Tables with role="presentation" or "none" are left out. A page with
 *   none is notApplicable. When every complex table has its summary marked
 *   (aria-describedby, or a summary attribute where it counts), the rule
 *   passes: whether that summary is good is complex-table-summary-quality's
 *   question.
 * @expectation
 *   A complex table without aria-describedby, and without a summary
 *   attribute where one still counts, is flagged for a person to check that
 *   a summary is available, as RGAA 5.1.1 asks: in the <caption>, or in a
 *   passage near the table. The summary attribute counts only on a <table>
 *   in a document whose doctype is not HTML5: 5.1.1 step 2 accepts it only
 *   "dans les versions de HTML et de XHTML antérieures à HTML 5". A document
 *   with no doctype is not HTML5. An ARIA table's summary comes only through
 *   aria-describedby.
 * @implementation-notes
 * - Manual (cantTell): the summary can be in the caption or next to the
 *   table, which only a person can judge.
 * - Positions account for colspan and rowspan (aria-colspan and
 *   aria-rowspan in an ARIA table). Nested tables are checked on their own.
 * - Opt-in (tag `rgaa`).
 */

const id = 'complex-table-summary';

const meta = {
  title: 'Complex data tables have a summary',
  description:
    'Flags a data table whose headers are not all in the first row or column, or head only a group of rows or columns, and that has no aria-describedby (nor, before HTML5, a summary attribute), for a person to check that a summary is available.',
  i18n: {
    titleKey: 'complexTableSummary_title',
    descriptionKey: 'complexTableSummary_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'tables', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  // The HTML5 doctype: name html, no public id, no system id or
  // about:legacy-compat. Same test as presentational-elements-absent.
  const isHtml5 = (() => {
    const doctype = document && document.doctype;
    return (
      !!doctype &&
      String(doctype.name || '').toLowerCase() === 'html' &&
      !doctype.publicId &&
      (!doctype.systemId || doctype.systemId === 'about:legacy-compat')
    );
  })();

  function hasText(v) {
    return v != null && String(v).trim() !== '';
  }

  function firstRole(el) {
    return String(el.getAttribute('role') || '')
      .trim()
      .toLowerCase()
      .split(/\s+/)[0];
  }

  function isHeader(cell) {
    const role = firstRole(cell);
    if (role === 'columnheader' || role === 'rowheader') return true;
    // A <th> given another role (role="cell", say) is not a header.
    return String(cell.tagName).toLowerCase() === 'th' && !role;
  }

  function span(cell, attr) {
    const n = Number.parseInt(cell.getAttribute(attr), 10);
    return Number.isFinite(n) && n > 1 ? Math.min(n, 1000) : 1;
  }

  const ARIA_TABLE_ROLES = ['table', 'grid', 'treegrid'];
  const ARIA_CELL_ROLES = ['cell', 'gridcell', 'columnheader', 'rowheader'];

  // The table an ARIA row or native row belongs to: the nearest ancestor
  // that is a <table> or has a table role.
  function owningTable(el) {
    let cur = el.parentElement;
    while (cur) {
      if (String(cur.tagName).toLowerCase() === 'table') return cur;
      if (ARIA_TABLE_ROLES.includes(firstRole(cur))) return cur;
      cur = cur.parentElement;
    }
    return null;
  }

  // Rows as arrays of cells, with the attribute names that carry spans.
  function gridOf(table) {
    if (String(table.tagName).toLowerCase() === 'table') {
      return {
        rows: Array.from(table.rows || []).map((row) => Array.from(row.cells || [])),
        colspan: 'colspan',
        rowspan: 'rowspan'
      };
    }
    const rows = Array.from(table.querySelectorAll('[role]'))
      .filter((el) => firstRole(el) === 'row' && owningTable(el) === table)
      .map((row) =>
        Array.from(row.querySelectorAll(':scope > *')).filter((cell) =>
          ARIA_CELL_ROLES.includes(firstRole(cell))
        )
      );
    return { rows, colspan: 'aria-colspan', rowspan: 'aria-rowspan' };
  }

  // Why the table is complex: a list of reasons, empty for a simple table.
  function complexity(table) {
    const reasons = [];
    const taken = [];
    const grid = gridOf(table);
    const placed = [];
    let outside = false;
    let headersAttr = false;
    let groupScope = false;
    grid.rows.forEach((cells, r) => {
      let c = 0;
      for (const cell of cells) {
        taken[r] = taken[r] || [];
        while (taken[r][c]) c += 1;
        const cols = span(cell, grid.colspan);
        const rowsSpanned = span(cell, grid.rowspan);
        for (let dr = 0; dr < rowsSpanned; dr += 1) {
          taken[r + dr] = taken[r + dr] || [];
          for (let dc = 0; dc < cols; dc += 1) taken[r + dr][c + dc] = true;
        }
        if (isHeader(cell)) {
          if (r > 0 && c > 0) outside = true;
          placed.push({ r, c, cols, rows: rowsSpanned });
          const scope = String(cell.getAttribute('scope') || '')
            .trim()
            .toLowerCase();
          if (scope === 'rowgroup' || scope === 'colgroup') groupScope = true;
        }
        if (hasText(cell.getAttribute('headers'))) headersAttr = true;
        c += cols;
      }
    });
    const groupSpan =
      placed.filter((h) => h.r === 0 && h.cols > 1).length > 1 ||
      placed.filter((h) => h.c === 0 && h.rows > 1).length > 1;
    if (outside) reasons.push('headersOutsideFirstRowAndColumn');
    if (headersAttr) reasons.push('headersAttribute');
    if (groupScope) reasons.push('groupScope');
    if (groupSpan) reasons.push('groupSpanningHeader');
    return reasons;
  }

  const tables = helpers.queryAllSmart
    ? helpers.queryAllSmart('table, [role]')
    : helpers.queryAll('table, [role]');

  const occurrences = [];
  let applicableCount = 0;

  for (const table of tables) {
    if (!table || !table.getAttribute) continue;
    const role = firstRole(table);
    const isNative = String(table.tagName).toLowerCase() === 'table';
    if (isNative ? role === 'presentation' || role === 'none' : role !== 'table') continue;
    const reasons = complexity(table);
    if (!reasons.length) continue;
    applicableCount += 1;
    if (hasText(table.getAttribute('aria-describedby'))) continue;
    // summary is a résumé only on a <table> before HTML5 (5.1.1 step 2).
    const hasSummaryAttr = isNative && hasText(table.getAttribute('summary'));
    if (hasSummaryAttr && !isHtml5) continue;

    const caption = isNative && table.caption ? String(table.caption.textContent || '').trim() : '';
    occurrences.push(
      helpers.reportOccurrence(table, {
        summary:
          'This table looks like a complex data table, and nothing marks a summary of its structure.',
        hint: 'Check that a summary explains how the table is organised, in its <caption> or in a passage next to it, ideally linked with aria-describedby.',
        i18n: {
          summaryKey: 'complexTableSummary_summary_cantTell',
          hintKey: 'complexTableSummary_hint_cantTell',
          params: {}
        },
        data: {
          details: {
            reasonCode: 'complexTableNoSummary',
            reasons,
            hasCaption: Boolean(caption),
            ...(hasSummaryAttr ? { summaryAttributeIgnored: true } : {})
          },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'moderate',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
