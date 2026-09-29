/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check complex-table-summary
 * @atomic true
 * @summary A complex data table should have a summary
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to complex data tables, in RGAA's sense: tables whose header
 *   cells are not all in the first row or the first column. A table counts
 *   as complex when a header cell (<th>, role="columnheader" or
 *   role="rowheader") sits outside both the first row and the first column,
 *   or when a cell uses the headers attribute. Tables with
 *   role="presentation" or "none" are left out. A page with none is
 *   notApplicable.
 * @expectation
 *   A complex table without aria-describedby and without a summary
 *   attribute is flagged for a person to check that a summary is available,
 *   as RGAA 5.1.1 asks: in the <caption>, or in a passage near the table.
 * @implementation-notes
 * - Manual (cantTell): the summary can be in the caption or next to the
 *   table, which only a person can judge.
 * - Positions account for colspan and rowspan. Nested tables are checked
 *   on their own.
 * - Opt-in (tag `rgaa`).
 */

const id = 'complex-table-summary';

const meta = {
  title: 'Complex data tables have a summary',
  description:
    'Flags a data table whose headers are not all in the first row or column, and that has no aria-describedby or summary, for a person to check that a summary is available.',
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

  // Why the table is complex: a list of reasons, empty for a simple table.
  function complexity(table) {
    const reasons = [];
    const taken = [];
    const rows = Array.from(table.rows || []);
    let outside = false;
    let headersAttr = false;
    rows.forEach((row, r) => {
      let c = 0;
      for (const cell of Array.from(row.cells || [])) {
        taken[r] = taken[r] || [];
        while (taken[r][c]) c += 1;
        const cols = span(cell, 'colspan');
        const rowsSpanned = span(cell, 'rowspan');
        for (let dr = 0; dr < rowsSpanned; dr += 1) {
          taken[r + dr] = taken[r + dr] || [];
          for (let dc = 0; dc < cols; dc += 1) taken[r + dr][c + dc] = true;
        }
        if (isHeader(cell) && r > 0 && c > 0) outside = true;
        if (hasText(cell.getAttribute('headers'))) headersAttr = true;
        c += cols;
      }
    });
    if (outside) reasons.push('headersOutsideFirstRowAndColumn');
    if (headersAttr) reasons.push('headersAttribute');
    return reasons;
  }

  const tables = helpers.queryAllSmart ? helpers.queryAllSmart('table') : helpers.queryAll('table');

  const occurrences = [];
  let applicableCount = 0;

  for (const table of tables) {
    if (!table || !table.getAttribute) continue;
    const role = firstRole(table);
    if (role === 'presentation' || role === 'none') continue;
    const reasons = complexity(table);
    if (!reasons.length) continue;
    applicableCount += 1;
    if (hasText(table.getAttribute('aria-describedby')) || hasText(table.getAttribute('summary'))) {
      continue;
    }

    const caption = table.caption ? String(table.caption.textContent || '').trim() : '';
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
          details: { reasonCode: 'complexTableNoSummary', reasons, hasCaption: Boolean(caption) },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (applicableCount === 0 || !occurrences.length) {
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
