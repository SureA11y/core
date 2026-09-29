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
 *   <th>, <thead>, <tfoot> or element with role="rowheader" or
 *   role="columnheader", and none of its <td> cells carries scope, headers
 *   or axis (RGAA 5.8.1). Only the table's own cells count, not those of a
 *   table nested inside it.
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
    'Checks that a table marked as layout (role="presentation" or "none") has no caption, header cells, summary, or scope, headers or axis attributes.',
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

  const tables = helpers.queryAllSmart
    ? helpers.queryAllSmart('table[role]')
    : helpers.queryAll('table[role]');

  const occurrences = [];
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
