/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check table-th-has-data-cells
 * @atomic true
 * @summary <th> elements must describe at least one data cell
 * @standard WCAG 2.2
 * @sc 1.3.1
 * @applicability
 *   Applies to <table> elements that keep their table semantics and are included
 *   in the accessibility tree, and that contain at least one <th> which is
 *   visible, included in the accessibility tree, and not overridden by an
 *   explicit role other than rowheader/columnheader. Also applies to the
 *   ARIA-only equivalent: an element whose role resolves to grid/treegrid
 *   (no native <table> involved) that contains at least one in-scope
 *   columnheader/rowheader-role element. Roles are resolved as user agents
 *   do: the first token of the role attribute naming a known role, matched
 *   in any case; a role attribute with no known token leaves the implicit
 *   role in place.
 *   In the ARIA-only form, a custom element whose ElementInternals give it
 *   the grid, treegrid, header or cell role (this.attachInternals().role),
 *   with no role attribute naming another, counts as one with that role
 *   attribute does.
 * @expectation
 *   The table also contains at least one <td> somewhere in it, and, in a
 *   table with no colspan or rowspan (or a grid with no aria-colspan,
 *   aria-rowspan or aria-colindex), each header cell has a data cell
 *   assigned to it by the HTML table model: one after it in its column or
 *   row, as its scope allows, with no headers attribute, or one whose
 *   headers attribute names it.
 * @reports
 *   - `row`, `column`: where an unassigned header sits, counting from 0:
 *     rows from the top, cells from the left within the row.
 * @reason-codes
 *   - `TABLE_TH_NO_DATA_CELLS` (fail): the table has header cells but no
 *     data cell at all, so no header describes anything.
 *     Basis: WCAG 1.3.1; H51; ACT d0f69e; HTML table model.
 *   - `TABLE_TH_NO_ASSIGNED_CELL` (cantTell): no data cell is assigned to
 *     the header, so it describes nothing; a person checks whether the
 *     table lacks the cells or leaves them out on purpose. A header with
 *     scope rowgroup or colgroup is left out, and so is the corner where
 *     a row of headers meets a column of them.
 *     It leans fail when no cell follows the header at all where its scope
 *     looks (short rows) and no cell in the table has a headers attribute;
 *     otherwise no lean.
 *     Basis: WCAG 1.3.1 (not settled); H51; H43; ACT d0f69e; HTML table
 *     model.
 * @implementation-notes
 * - SCOPED (see aria-helpers.js file header for the same
 *   conservative-scope rationale used throughout this engine): this rule
 *   does NOT implement the full HTML5 header-association algorithm
 *   (resolving which specific data cells a given <th scope="row"|"col">
 *   describes, accounting for colspan/rowspan and default-scope
 *   inference). That algorithm is one of the more error-prone parts of
 *   the HTML spec to reimplement correctly, and a wrong positional match
 *   would risk a false `fail`, unacceptable for this engine's fail-
 *   integrity bar.
 * - Instead, it fails only the single unambiguous case: a table that has
 *   <th> elements but ZERO <td> elements anywhere. In that case every <th>
 *   in the table trivially describes no data cell, no positional analysis
 *   is needed to know that.
 * - In a table with no spans, where a cell's column is its index in its
 *   row, it asks about a header no data cell is assigned to
 *   (TABLE_TH_NO_ASSIGNED_CELL). The HTML model assigns a cell without a
 *   headers attribute to headers it finds scanning up its column and left
 *   along its row, so a header with no such cell below it or after it has
 *   none; the model's rules that stop a scan only remove assignments, so
 *   this never asks about an assigned header. It passed such a table
 *   before, claiming every header describes a cell, which it hadn't
 *   checked. A table with spans is not read this way, and passes when it
 *   has a data cell.
 * - Applicability IS gated, because the zero-<td> case above turns any
 *   over-broad scope straight into a false fail: a layout table marked
 *   role="presentation" with a stray <th> and no <td> was being failed,
 *   as were tables whose only header was hidden or carried role="cell".
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
  coverage: { facetsBySc: { '1.3.1': ['table-th-has-data-cells'] } },
  // How a person checks each undecided finding: shown with it as
  // howToCheck (docs/OUTPUT_SCHEMA.md).
  review: {
    TABLE_TH_NO_ASSIGNED_CELL: {
      steps: [
        'Find the header cell the report names (its row and column are given, counting from 0).',
        'Look at the cells below it in its column, or after it in its row, as its scope says.',
        'Decide whether the header is meant to label data: if the cells it should head are missing, or are marked up as headers, it labels nothing.',
        "If a screen reader is available, move through the table's data cells and note whether this header is ever announced."
      ],
      passWhen:
        'The header is not meant to label data (it can be a plain cell), or the data it heads is marked up so the header is assigned to it.',
      failWhen:
        'A header that should label data has no data cells assigned to it, so its relationship is not conveyed, which fails WCAG 1.3.1.'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const tables = helpers.queryAllSmart ? helpers.queryAllSmart('table') : helpers.queryAll('table');

  const occurrences = [];
  const askOccurrences = [];
  let applicableCount = 0;

  // The resolved role: the first token of the role fallback list that names
  // a known role, lower-cased, else the role a custom element's internals give
  // it, or '' for neither (the element then keeps its implicit role).
  function explicitRole(el) {
    try {
      return el && helpers.aria && typeof helpers.aria.getAuthorRole === 'function'
        ? helpers.aria.getAuthorRole(el)
        : '';
    } catch {
      return '';
    }
  }

  // Elements under `scope` matching `selector` (token, case-insensitive role
  // selectors) whose resolved explicit role is in `roles`: `[role~="x" i]`
  // alone also matches role="link x", which is a link. Custom elements whose
  // internals give them one of `roles` are found too, in `scope` as well.
  function queryByRole(scope, selector, roles) {
    let found;
    try {
      found = scope
        ? Array.from(dom.querySelectorAll(scope, selector))
        : Array.from(
            (helpers.queryAllSmart
              ? helpers.queryAllSmart(selector, { internalsRoles: true })
              : helpers.queryAll(selector)) || []
          );
      if (scope && typeof helpers.getInternalsRoleElements === 'function') {
        for (const { el, role } of helpers.getInternalsRoleElements()) {
          if (el !== scope && roles.includes(role) && dom.contains(scope, el)) found.push(el);
        }
      }
    } catch {
      found = [];
    }
    return found.filter((el) => roles.includes(explicitRole(el)));
  }

  function isIncludedInTree(el) {
    const fn =
      helpers && typeof helpers.isIncludedInAccessibilityTree === 'function'
        ? helpers.isIncludedInAccessibilityTree
        : null;
    if (!fn) return true;
    try {
      const r = fn(el, ctx);
      return typeof r === 'boolean' ? r : !!(r && r.eligible);
    } catch {
      return true;
    }
  }

  // role="presentation"/"none" removes the table role, and with it every
  // header cell the role would have implied. A table is not focusable, so
  // presentational role conflict resolution does not restore it.
  function hasTableSemantics(table) {
    const role = explicitRole(table);
    if (role === 'presentation' || role === 'none') return false;
    if (role && role !== 'table' && role !== 'grid' && role !== 'treegrid') return false;
    return isIncludedInTree(table);
  }

  // A <th> only carries a rowheader/columnheader role while nothing overrides
  // it, and a hidden header describes nothing to a screen reader either way.
  function isHeaderCellInScope(th) {
    if (!th) return false;
    const role = explicitRole(th);
    if (role && role !== 'rowheader' && role !== 'columnheader') return false;
    if (helpers.isDomVisibleEligible) {
      try {
        if (!helpers.isDomVisibleEligible(th, ctx, { targetSet: 'dom' }).eligible) return false;
      } catch {
        // fall through to the tree check
      }
    }
    return isIncludedInTree(th);
  }

  // A header no data cell is assigned to, by the HTML table model: a cell's
  // headers attribute assigns it to the headers it names and to no other;
  // a cell without one, to the headers above it in its column and before it
  // in its row (scope="col" only the former, scope="row" only the latter).
  // So a header with no such cell after it, and named by no headers
  // attribute, describes nothing (ACT d0f69e). Read only in a table with no
  // colspan or rowspan, where a cell's column is its index in its row, as
  // td-has-header does; a header with scope rowgroup or colgroup is left
  // out, as is a corner header (below). A question, not a failure: the table may lack the cells by
  // mistake, or the column may be meant to be empty.
  const DATA_ROLES = ['cell', 'gridcell'];
  const HEADER_ROLES = ['columnheader', 'rowheader'];

  function spanOf(cell, attr) {
    const n = Number.parseInt(dom.getAttribute(cell, attr) || '1', 10);
    return Number.isFinite(n) ? n : 1;
  }

  function askUnassigned(th, row, column, ragged) {
    askOccurrences.push(
      helpers.reportOccurrence(th, {
        summary: 'No data cell in this table is assigned to this header cell.',
        hint: 'Check whether the table is missing the cells this header describes. Where cells name their headers with a headers attribute, include this header in those it applies to.',
        occurrenceOutcome: 'cantTell',
        i18n: {
          summaryKey: 'tableThHasDataCells_summary_cantTell_unassigned',
          hintKey: 'tableThHasDataCells_hint_cantTell_unassigned',
          params: {}
        },
        uncertainty: {
          code: 'judgement-required',
          needed:
            'Whether the table lacks the cells this header describes, or leaves them out on purpose.',
          evidence: { row, column }
        },
        // A table whose cells name no headers places every cell by
        // position, so a header with no cell at all after it, where its
        // scope looks, is short of the cells it heads.
        ...(ragged
          ? {
              lean: {
                toward: 'fail',
                why: 'No cell follows this header where it applies, and no cell in the table names its headers, so the header describes nothing.',
                signals: [
                  { signal: 'no-cells-after-header', value: true },
                  { signal: 'table-uses-headers-attr', value: false }
                ],
                caution: 'A script may add the missing cells later.',
                i18n: {
                  whyKey: 'tableThHasDataCells_lean_why_unassigned',
                  cautionKey: 'tableThHasDataCells_lean_caution_unassigned'
                }
              }
            }
          : {}),
        data: { details: { reasonCode: 'TABLE_TH_NO_ASSIGNED_CELL', row, column } }
      })
    );
  }

  // `rowCells`: each row's cells, in order. `isHeader` and `isData` tell
  // them apart; `scopeOf(header)` is 'row', 'col', '' for both, or null to
  // leave it out; `named`: the ids headers attributes name.
  function askUnassignedIn(rowCells, inScope, isHeader, isData, scopeOf, named) {
    // A cell with a headers attribute is assigned only to those it names.
    const free = (cell) => !!cell && isData(cell) && !dom.getAttribute(cell, 'headers');
    for (let r = 0; r < rowCells.length; r++) {
      for (let c = 0; c < rowCells[r].length; c++) {
        const th = rowCells[r][c];
        if (!isHeader(th) || !inScope.has(th)) continue;
        const scope = scopeOf(th);
        if (scope === null) continue;
        const headerId = dom.getAttribute(th, 'id');
        if (headerId && named.has(headerId)) continue;
        const after = rowCells[r].slice(c + 1);
        const below = rowCells
          .slice(r + 1)
          .map((cells) => cells[c])
          .filter(Boolean);
        // The corner where a row of headers meets a column of them labels
        // the headers, as tables often do; it is left out.
        if (after.length && below.length && after.concat(below).every(isHeader)) continue;
        const inRow = scope !== 'col' && after.some(free);
        const inColumn = scope !== 'row' && below.some(free);
        if (!inRow && !inColumn) {
          // No cell at all where the header looks: the row ends, or the
          // rows below are shorter, rather than cells marked up as headers.
          const ragged =
            named.size === 0 &&
            (scope === 'col'
              ? !below.length
              : scope === 'row'
                ? !after.length
                : !after.length && !below.length);
          askUnassigned(th, r, c, ragged);
        }
      }
    }
  }

  function askUnassignedInTable(table, headers) {
    const rowCells = Array.from(table.rows || []).map((row) => Array.from(row.cells || []));
    // A rowspan of 0 spans too, as in td-has-header.
    const spans = rowCells.some((cells) =>
      cells.some((c) => spanOf(c, 'colspan') > 1 || spanOf(c, 'rowspan') !== 1)
    );
    if (spans) return;
    const named = new Set();
    for (const cells of rowCells) {
      for (const cell of cells) {
        for (const ref of String(dom.getAttribute(cell, 'headers') || '').split(/\s+/)) {
          if (ref) named.add(ref);
        }
      }
    }
    const tag = (cell) => String(dom.localName(cell) || '').toLowerCase();
    const scopeOf = (th) => {
      const role = explicitRole(th);
      if (role === 'columnheader') return 'col';
      if (role === 'rowheader') return 'row';
      const scope = String(dom.getAttribute(th, 'scope') || '')
        .trim()
        .toLowerCase();
      if (scope === 'row' || scope === 'col') return scope;
      if (scope === 'rowgroup' || scope === 'colgroup') return null;
      return '';
    };
    askUnassignedIn(
      rowCells,
      new Set(headers),
      (cell) => tag(cell) === 'th',
      (cell) => tag(cell) === 'td' && !HEADER_ROLES.includes(explicitRole(cell)),
      scopeOf,
      named
    );
  }

  // The grid, treegrid or table a row belongs to: the nearest around it.
  function nearestGrid(el) {
    for (let cur = dom.parentElement(el); cur; cur = dom.parentElement(cur)) {
      const role = explicitRole(cur);
      if (role === 'grid' || role === 'treegrid' || role === 'table') return cur;
      if (String(dom.localName(cur) || '').toLowerCase() === 'table') return cur;
    }
    return null;
  }

  // An ARIA grid is read only when each of its rows holds only cells and
  // headers, as its own children, and nothing spans, is placed by index or
  // is owned from elsewhere.
  function askUnassignedInGrid(grid, headers) {
    const rows = queryByRole(grid, '[role~="row" i]', ['row']).filter(
      (row) => nearestGrid(row) === grid
    );
    const rowCells = [];
    for (const row of rows) {
      const cells = Array.from(dom.children(row) || []);
      const simple = cells.every((cell) => {
        const role = explicitRole(cell);
        return (
          (DATA_ROLES.includes(role) || HEADER_ROLES.includes(role)) &&
          !dom.getAttribute(cell, 'aria-colindex') &&
          spanOf(cell, 'aria-colspan') === 1 &&
          spanOf(cell, 'aria-rowspan') === 1
        );
      });
      if (!simple || dom.getAttribute(row, 'aria-owns')) return;
      rowCells.push(cells);
    }
    askUnassignedIn(
      rowCells,
      new Set(headers),
      (cell) => HEADER_ROLES.includes(explicitRole(cell)),
      (cell) => DATA_ROLES.includes(explicitRole(cell)),
      (cell) => (explicitRole(cell) === 'columnheader' ? 'col' : 'row'),
      new Set()
    );
  }

  for (const table of tables) {
    if (!table || !dom.get(table, 'querySelectorAll')) continue;

    // A table stripped of its semantics has no header cells to describe
    // anything, so nothing in it is in scope.
    if (!hasTableSemantics(table)) continue;

    let ths;
    try {
      ths = dom.querySelectorAll(table, 'th');
    } catch {
      ths = [];
    }

    const headers = Array.from(ths).filter(isHeaderCellInScope);
    if (!headers.length) continue;

    applicableCount += 1;

    let hasDataCell;
    try {
      hasDataCell = dom.querySelectorAll(table, 'td').length > 0;
    } catch {
      hasDataCell = false;
    }
    if (hasDataCell) {
      askUnassignedInTable(table, headers);
      continue;
    }

    for (const th of headers) {
      if (!th) continue;

      occurrences.push(
        helpers.reportOccurrence(th, {
          summary: 'This table has header cells but no data cells for them to describe.',
          hint: 'Add data cells (<td>) to the table, or remove the header cells if the table has no data.',
          i18n: {
            summaryKey: 'tableThHasDataCells_summary_fail',
            hintKey: 'tableThHasDataCells_hint_fail',
            params: {}
          },
          occurrenceOutcome: 'fail',
          data: {
            details: { reasonCode: 'TABLE_TH_NO_DATA_CELLS' }
          }
        })
      );
    }
  }

  // ARIA-only equivalent: a role="grid"/"treegrid" container with no
  // backing <table> at all. Same trivial "zero data cells anywhere" check,
  // just keyed off ARIA roles instead of native tags -- a genuine
  // columnheader/rowheader with zero gridcell/cell-role elements anywhere
  // in the container is exactly as unambiguous as a <th>-only <table>.
  const grids = queryByRole(null, '[role~="grid" i], [role~="treegrid" i]', ['grid', 'treegrid']);

  for (const grid of grids) {
    if (!grid || !dom.get(grid, 'querySelectorAll')) continue;
    if (dom.tagName(grid) && dom.tagName(grid).toLowerCase() === 'table') continue; // already handled above
    if (!isIncludedInTree(grid)) continue;

    const headerNodes = queryByRole(grid, '[role~="columnheader" i], [role~="rowheader" i]', [
      'columnheader',
      'rowheader'
    ]);
    const headers = headerNodes.filter(isHeaderCellInScope);
    if (!headers.length) continue;

    applicableCount += 1;

    const hasDataCell =
      queryByRole(grid, '[role~="gridcell" i], [role~="cell" i]', ['gridcell', 'cell']).length > 0;
    if (hasDataCell) {
      askUnassignedInGrid(grid, headers);
      continue;
    }

    for (const th of headers) {
      if (!th) continue;

      occurrences.push(
        helpers.reportOccurrence(th, {
          summary: 'This table has header cells but no data cells for them to describe.',
          hint: 'Add data cells (<td>) to the table, or remove the header cells if the table has no data.',
          i18n: {
            summaryKey: 'tableThHasDataCells_summary_fail',
            hintKey: 'tableThHasDataCells_hint_fail',
            params: {}
          },
          occurrenceOutcome: 'fail',
          data: {
            details: { reasonCode: 'TABLE_TH_NO_DATA_CELLS' }
          }
        })
      );
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  const resolved = helpers.resolveTieredOutcome(
    occurrences,
    askOccurrences,
    rule.defaultSeverity || 'moderate'
  );
  return { ruleId: rule.ruleId, ...resolved };
}

module.exports = { id, meta, runInPage };
