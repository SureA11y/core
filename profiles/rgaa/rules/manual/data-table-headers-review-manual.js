/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check data-table-headers-review
 * @atomic true
 * @summary A table with no header cells should be checked for headers that are not marked up
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to a <table>, or an element with role="table", that has at
 *   least two rows and two columns and no header cell at all: no <th>
 *   (without another role) and no cell with role="columnheader" or
 *   role="rowheader". Tables with role="presentation" or "none" are left
 *   out, and so is a table with no text in its cells.
 * @expectation
 *   Each such table is asked about (cantTell). RGAA 5.6.1 and 5.6.2 want
 *   each header that applies to a whole column or row marked with <th> or
 *   a columnheader or rowheader role. A data table usually has headers in
 *   its first row or column, but only a person can tell whether this one
 *   does, or whether it is a layout table, which 5.3 and 5.8 cover.
 * @implementation-notes
 * - A table with at least one header cell is not asked about. Whether all
 *   of its headers are marked up is not something the markup shows.
 * - td-has-header fails large headerless tables under WCAG 1.3.1. It is
 *   not linked to 5.6, because a cell with no header does not show that a
 *   header was left unmarked.
 * - Positions account for colspan and rowspan (aria-colspan and
 *   aria-rowspan in an ARIA table). Nested tables are checked on their own.
 * - Manual (cantTell): the rule never passes.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'data-table-headers-review';

const meta = {
  title: 'Tables with no header cells are checked for unmarked headers',
  description:
    'Flags a table of at least two rows and two columns with no <th> and no columnheader or rowheader role, for a person to check whether it is a data table whose headers should be marked up.',
  i18n: {
    titleKey: 'dataTableHeadersReview_title',
    descriptionKey: 'dataTableHeadersReview_description'
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
  const { helpers, rule } = ctx;

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

  function owningTable(el) {
    let cur = el.parentElement;
    while (cur) {
      if (String(cur.tagName).toLowerCase() === 'table') return cur;
      if (ARIA_TABLE_ROLES.includes(firstRole(cur))) return cur;
      cur = cur.parentElement;
    }
    return null;
  }

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

  // Row and column counts, with spans; null once a header cell is found.
  function sizeWithoutHeaders(table) {
    const grid = gridOf(table);
    const taken = [];
    let cols = 0;
    let withText = false;
    for (let r = 0; r < grid.rows.length; r += 1) {
      let c = 0;
      for (const cell of grid.rows[r]) {
        if (isHeader(cell)) return null;
        if (hasText(cell.textContent)) withText = true;
        taken[r] = taken[r] || [];
        while (taken[r][c]) c += 1;
        const colSpan = span(cell, grid.colspan);
        const rowSpan = span(cell, grid.rowspan);
        for (let dr = 0; dr < rowSpan; dr += 1) {
          taken[r + dr] = taken[r + dr] || [];
          for (let dc = 0; dc < colSpan; dc += 1) taken[r + dr][c + dc] = true;
        }
        c += colSpan;
        cols = Math.max(cols, c);
      }
    }
    return { rows: taken.length, cols, withText };
  }

  const tables = helpers.queryAllSmart
    ? helpers.queryAllSmart('table, [role]')
    : helpers.queryAll('table, [role]');

  const occurrences = [];

  for (const table of tables) {
    if (!table || !table.getAttribute) continue;
    const role = firstRole(table);
    const isNative = String(table.tagName).toLowerCase() === 'table';
    if (isNative ? role === 'presentation' || role === 'none' : role !== 'table') continue;

    const size = sizeWithoutHeaders(table);
    if (!size || !size.withText || size.rows < 2 || size.cols < 2) continue;

    occurrences.push(
      helpers.reportOccurrence(table, {
        summary:
          'This table has no header cells. If it is a data table, check whether its first row or column holds headers.',
        hint: 'Mark each header that applies to a whole column or row with <th> (or role="columnheader" or role="rowheader" in an ARIA table). If the table is only used for layout, give it role="presentation" instead.',
        i18n: {
          summaryKey: 'dataTableHeadersReview_summary_cantTell',
          hintKey: 'dataTableHeadersReview_hint_cantTell',
          params: {}
        },
        uncertainty: {
          code: 'judgement-required',
          needed:
            'Whether this is a data table, and whether any of its cells is a header that should be marked up.',
          evidence: { rows: size.rows, columns: size.cols }
        },
        data: {
          details: { reasonCode: 'NO_HEADER_CELLS', rows: size.rows, columns: size.cols },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'moderate',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
