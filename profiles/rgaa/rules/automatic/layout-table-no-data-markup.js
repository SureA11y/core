/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check layout-table-no-data-markup
 * @atomic true
 * @summary A layout table must not use data table markup
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to <table> elements whose role is presentation or none, the only
 *   way markup says a table is for layout. A page with none is
 *   notApplicable.
 * @expectation
 *   The table has no non-empty summary attribute and contains no <caption>,
 *   <th>, <thead>, <tfoot>, <colgroup> or element with role="rowheader" or
 *   role="columnheader", and none of its <td> cells carries scope, headers
 *   or axis (RGAA 5.8.1). Only the table's own cells count, not those of a
 *   table nested inside it.
 *   A table that has such markup and also looks like a data table is
 *   reported as cantTell instead of fail: 5.8.1 applies to layout tables,
 *   and role="presentation" on a real data table is a different defect (its
 *   headers are no longer exposed). It looks like a data table when it has
 *   at least two rows and two columns, a data cell, and a full header row
 *   (every cell of the first row a header) or a full header column (the
 *   first cell of every row a header), headers being <th>,
 *   role="columnheader" or role="rowheader".
 * @implementation-notes
 * - Opt-in (tag `rgaa`): WCAG does not forbid this markup on a layout table,
 *   so the rule runs only under the rgaa-4.1.2 profile, the `rgaa` tag or
 *   its own id.
 * - A table used for layout without a presentation role cannot be told from
 *   a data table by markup; whether a table is for layout is RGAA 5.3's
 *   question for a person.
 */

const id = 'layout-table-no-data-markup';

const meta = {
  title: 'Layout tables use no data table markup',
  description:
    'Checks that a table marked as layout (role="presentation" or "none") has no caption, header cells, colgroup, summary, or scope, headers or axis attributes, and asks when such a table looks like a data table.',
  i18n: {
    titleKey: 'layoutTableNoDataMarkup_title',
    descriptionKey: 'layoutTableNoDataMarkup_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'tables', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const MARKUP = [
    ['caption', 'caption'],
    ['th', 'th'],
    ['thead', 'thead'],
    ['tfoot', 'tfoot'],
    ['colgroup', 'colgroup'],
    ['[role="rowheader"]', 'role="rowheader"'],
    ['[role="columnheader"]', 'role="columnheader"'],
    ['td[scope]', 'td[scope]'],
    ['td[headers]', 'td[headers]'],
    ['td[axis]', 'td[axis]']
  ];

  function isLayout(table) {
    const first = String(table.getAttribute('role') || '')
      .trim()
      .toLowerCase()
      .split(/\s+/)[0];
    return first === 'presentation' || first === 'none';
  }

  function isHeaderCell(cell) {
    const role = String(cell.getAttribute('role') || '')
      .trim()
      .toLowerCase()
      .split(/\s+/)[0];
    if (role === 'columnheader' || role === 'rowheader') return true;
    return String(cell.tagName).toLowerCase() === 'th' && !role;
  }

  // A full header row or column over a real grid of data suggests the
  // table holds data, whatever its role says.
  function looksLikeDataTable(table) {
    const rows = Array.from(table.rows || []).map((row) => Array.from(row.cells || []));
    if (rows.length < 2) return false;
    if (!rows.some((cells) => cells.length >= 2)) return false;
    if (!rows.some((cells) => cells.some((cell) => !isHeaderCell(cell)))) return false;
    const headerRow = rows[0].length >= 2 && rows[0].every(isHeaderCell);
    const headerColumn = rows.every((cells) => cells.length > 0 && isHeaderCell(cells[0]));
    return headerRow || headerColumn;
  }

  const tables = helpers.queryAllSmart
    ? helpers.queryAllSmart('table[role]')
    : helpers.queryAll('table[role]');

  const occurrences = [];
  const cantTellOccurrences = [];
  let applicableCount = 0;

  for (const table of tables) {
    if (!table || !table.getAttribute || !isLayout(table)) continue;
    applicableCount += 1;

    const found = [];
    if (String(table.getAttribute('summary') || '').trim()) found.push('summary');
    for (const [selector, label] of MARKUP) {
      const own = Array.from(table.querySelectorAll(selector)).some(
        (el) => el.closest('table') === table
      );
      if (own) found.push(label);
    }
    if (!found.length) continue;

    const markup = found.join(', ');

    if (looksLikeDataTable(table)) {
      cantTellOccurrences.push(
        helpers.reportOccurrence(table, {
          summary: `This table is marked as layout but looks like a data table, with a full header row or column; it uses data table markup: ${markup}.`,
          hint: 'If the table holds data, remove role="presentation" so that its headers are exposed. If it is for layout, remove the data table markup.',
          occurrenceOutcome: 'cantTell',
          i18n: {
            summaryKey: 'layoutTableNoDataMarkup_summary_cantTell_dataLike',
            hintKey: 'layoutTableNoDataMarkup_hint_cantTell_dataLike',
            params: { markup }
          },
          uncertainty: {
            code: 'judgement-required',
            needed: 'Whether this table lays out content or holds data.',
            evidence: { markup: found.slice() }
          },
          data: {
            details: { reasonCode: 'dataLikeTableMarkedLayout', markup: found },
            visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
          }
        })
      );
      continue;
    }

    occurrences.push(
      helpers.reportOccurrence(table, {
        summary: `This layout table uses data table markup: ${markup}.`,
        hint: 'Remove the data table markup, or, if the table holds data, remove role="presentation" and keep the headers.',
        i18n: {
          summaryKey: 'layoutTableNoDataMarkup_summary_fail',
          hintKey: 'layoutTableNoDataMarkup_hint_fail',
          params: { markup }
        },
        data: {
          details: { reasonCode: 'dataMarkupInLayoutTable', markup: found },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  const resolved = helpers.resolveTieredOutcome(
    occurrences,
    cantTellOccurrences,
    rule.defaultSeverity || 'moderate'
  );
  return { ruleId: rule.ruleId, ...resolved };
}

module.exports = { id, meta, runInPage };
