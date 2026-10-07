/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check complex-table-summary-quality
 * @atomic true
 * @summary The summary of a complex data table must be relevant
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to complex data tables that have a summary. Complex is
 *   decided as complex-table-summary does for 5.1.1: a <table>, or an
 *   element with role="table", where
 *   - a header cell (<th>, role="columnheader" or role="rowheader") sits
 *     outside both the first row and the first column;
 *   - a cell uses the headers attribute;
 *   - a header has scope="rowgroup" or scope="colgroup"; or
 *   - two or more first-row headers each span several columns, or two or
 *     more first-column headers each span several rows.
 *   Tables with role="presentation" or "none" are left out. The summary
 *   is what 5.1.1 step 2 accepts (5.2.1 step 1 refers to it):
 *   - a <caption> with text, on a <table>;
 *   - an aria-describedby that points to an element with text;
 *   - a summary attribute with text on a <table>, only in a document whose
 *     doctype is not HTML5 (« dans les versions de HTML et de XHTML
 *     antérieures à HTML 5 »; glossary "Résumé (de tableau)"). A document
 *     with no doctype is not HTML5.
 *   A page with no such table is notApplicable, including a simple table
 *   and an HTML5 table whose only summary is the summary attribute.
 * @expectation
 *   Each complex table with a summary is asked about (cantTell): RGAA
 *   5.2.1 asks whether the summary is relevant, that is whether it
 *   explains the nature and structure of the table. Only a person can
 *   tell, and a caption may hold only the table's title.
 * @implementation-notes
 * - table-duplicate-name asks about a caption that repeats the summary
 *   attribute on any table. It no longer carries 5.2.1: in HTML5 the
 *   summary attribute is not a summary, and 5.2 concerns only complex
 *   tables.
 * - Positions account for colspan and rowspan (aria-colspan and
 *   aria-rowspan in an ARIA table). Nested tables are checked on their own.
 * - Manual (cantTell): the rule never passes.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'complex-table-summary-quality';

const meta = {
  title: 'Complex data table summaries are relevant',
  description:
    'Flags a complex data table that has a summary (caption, aria-describedby, or before HTML5 a summary attribute), for a person to check that it explains the nature and structure of the table.',
  i18n: {
    titleKey: 'complexTableSummaryQuality_title',
    descriptionKey: 'complexTableSummaryQuality_description'
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
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  const doctypeKind = helpers.getDoctypeInfo ? helpers.getDoctypeInfo().kind : 'html5';
  const isHtml5 = doctypeKind === 'html5';

  function hasText(v) {
    return v != null && String(v).trim() !== '';
  }

  // The resolved explicit role: the first token of the role fallback list
  // that names a known role, lower-cased, or '' when none does.
  function explicitRole(el) {
    try {
      return el && helpers.aria && typeof helpers.aria.getExplicitRole === 'function'
        ? helpers.aria.getExplicitRole(el)
        : '';
    } catch {
      return '';
    }
  }

  function isHeader(cell) {
    const role = explicitRole(cell);
    if (role === 'columnheader' || role === 'rowheader') return true;
    // A <th> given another role (role="cell", say) is not a header.
    return String(dom.tagName(cell)).toLowerCase() === 'th' && !role;
  }

  function span(cell, attr) {
    const n = Number.parseInt(dom.getAttribute(cell, attr), 10);
    return Number.isFinite(n) && n > 1 ? Math.min(n, 1000) : 1;
  }

  const ARIA_TABLE_ROLES = ['table', 'grid', 'treegrid'];
  const ARIA_CELL_ROLES = ['cell', 'gridcell', 'columnheader', 'rowheader'];

  function owningTable(el) {
    let cur = dom.parentElement(el);
    while (cur) {
      if (String(dom.tagName(cur)).toLowerCase() === 'table') return cur;
      if (ARIA_TABLE_ROLES.includes(explicitRole(cur))) return cur;
      cur = dom.parentElement(cur);
    }
    return null;
  }

  function gridOf(table) {
    if (String(dom.tagName(table)).toLowerCase() === 'table') {
      return {
        rows: Array.from(table.rows || []).map((row) => Array.from(row.cells || [])),
        colspan: 'colspan',
        rowspan: 'rowspan'
      };
    }
    const rows = Array.from(dom.querySelectorAll(table, '[role]'))
      .filter((el) => explicitRole(el) === 'row' && owningTable(el) === table)
      .map((row) =>
        Array.from(dom.querySelectorAll(row, ':scope > *')).filter((cell) =>
          ARIA_CELL_ROLES.includes(explicitRole(cell))
        )
      );
    return { rows, colspan: 'aria-colspan', rowspan: 'aria-rowspan' };
  }

  // Same test as complex-table-summary (5.1.1 step 1).
  function isComplex(table) {
    const taken = [];
    const grid = gridOf(table);
    const placed = [];
    let complex = false;
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
          if (r > 0 && c > 0) complex = true;
          placed.push({ r, c, cols, rows: rowsSpanned });
          const scope = String(dom.getAttribute(cell, 'scope') || '')
            .trim()
            .toLowerCase();
          if (scope === 'rowgroup' || scope === 'colgroup') complex = true;
        }
        if (hasText(dom.getAttribute(cell, 'headers'))) complex = true;
        c += cols;
      }
    });
    return (
      complex ||
      placed.filter((h) => h.r === 0 && h.cols > 1).length > 1 ||
      placed.filter((h) => h.c === 0 && h.rows > 1).length > 1
    );
  }

  // aria-describedby counts when one of its ids names an element with text,
  // in the table's own tree (document or shadow root).
  function describedByText(table) {
    const raw = String(dom.getAttribute(table, 'aria-describedby') || '').trim();
    if (!raw) return false;
    const rootNode = dom.get(table, 'getRootNode') ? dom.getRootNode(table) : document;
    const scope = rootNode && dom.get(rootNode, 'getElementById') ? rootNode : document;
    return raw.split(/\s+/).some((ref) => {
      const target = dom.getElementById(scope, ref);
      return !!target && hasText(dom.textContent(target));
    });
  }

  const tables = helpers.queryAllSmart
    ? helpers.queryAllSmart('table, [role]')
    : helpers.queryAll('table, [role]');

  const occurrences = [];

  for (const table of tables) {
    if (!table || !dom.get(table, 'getAttribute')) continue;
    const role = explicitRole(table);
    const isNative = String(dom.tagName(table)).toLowerCase() === 'table';
    if (isNative ? role === 'presentation' || role === 'none' : role !== 'table') continue;
    if (!isComplex(table)) continue;

    const sources = [];
    if (isNative && table.caption && hasText(dom.textContent(table.caption)))
      sources.push('caption');
    if (describedByText(table)) sources.push('aria-describedby');
    if (isNative && !isHtml5 && hasText(dom.getAttribute(table, 'summary')))
      sources.push('summary');
    if (!sources.length) continue;

    occurrences.push(
      helpers.reportOccurrence(table, {
        summary:
          'This table looks like a complex data table and has a summary. Check that it explains how the table is organised.',
        hint: 'The summary should say what the table contains and how its headers are arranged, not only repeat its title. It can sit in the <caption>, hidden with CSS if needed, or in a passage linked with aria-describedby.',
        i18n: {
          summaryKey: 'complexTableSummaryQuality_summary_cantTell',
          hintKey: 'complexTableSummaryQuality_hint_cantTell',
          params: {}
        },
        uncertainty: {
          code: 'judgement-required',
          needed: 'Whether the summary explains the nature and structure of the table.',
          evidence: { sources }
        },
        data: {
          details: { reasonCode: 'complexTableSummary', sources, doctype: doctypeKind },
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
