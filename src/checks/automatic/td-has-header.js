/* SPDX-License-Identifier: MPL-2.0 */

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
 *   useful; small tables are usually self-evident), and with
 *   NO `colspan`/`rowspan` anywhere in the table (a `rowspan` of 0, which
 *   grows the cell to the end of its row group, is a span; a `colspan` of 0
 *   is 1). A table whose role (the
 *   role attribute's first known, non-abstract token, in any case) is
 *   anything but table, grid or treegrid, such as a layout table with
 *   role="presentation", is left out: it has no data cells.
 * @expectation
 *   A table with no header cell at all is asked about once, on the table:
 *   markup can't tell a layout table, which needs no headers, from a data
 *   table without them. In a table with header cells, every non-empty
 *   `<td>` has an associated header, via one of:
 *     - a non-empty `headers` attribute (trusted here; whether it
 *       resolves to real `<th>` ids is `table-headers-attr-valid`'s
 *       concern, not this rule's), OR
 *     - an implicit column header: a header cell in the same column, in an
 *       earlier row, OR
 *     - an implicit row header: a header cell earlier in the same row.
 *   A header cell is a `<th>` with no other role, or any cell with
 *   role="columnheader" or role="rowheader" (such a `<td>` is a header,
 *   not a data cell). A `<td>` with no text and no content that could carry
 *   a name (an image, a control, an element with an ARIA label) holds no
 *   data, so it needs no header; the empty corner cell above row headers is
 *   the usual case.
 * @reports
 *   - `row`, `column`: where the cell sits in the table, counting from 0:
 *     rows from the top, cells from the left within the row.
 * @reason-codes
 *   - `TD_NO_ASSOCIATED_HEADER` (fail): a non-empty data cell in a large
 *     table that has header cells has no headers attribute and no header
 *     cell above it in its column or before it in its row.
 *     Basis: WCAG 1.3.1; H51; H43; HTML table model.
 *   - `TD_TABLE_NO_HEADERS` (cantTell): a large table with data in it has
 *     no header cell at all; a person checks whether it holds data, which
 *     needs headers, or only lays out content, which needs none (F46).
 *     It leans fail when the table shows signs of data (most body cells
 *     numbers, a caption or thead, a first row or column bold apart from the
 *     rest) and none of layout; it leans pass when its cells hold a nested
 *     table, form controls, images or blocks of prose and nothing marks it
 *     as data; otherwise no lean.
 *     Basis: WCAG 1.3.1 (not settled); H51; F46.
 * @implementation-notes
 * - Closes the gap `table-th-has-data-cells` deferred (see
 *   that rule's own implementation notes): this is the fuller positional
 *   header-association algorithm, but still intentionally scoped,
 *   tables with any `colspan`/`rowspan` are skipped entirely (marked
 *   `notApplicable`) rather than risk a wrong column-index computation
 *   producing a false `fail`.
 * - The `headers`-attribute branch does not itself validate that the
 *   referenced ids exist or point at `<th>` elements, that's already
 *   `table-headers-attr-valid`'s job.
 */

const id = 'td-has-header';

const meta = {
  title: 'Data cells in large tables must have an associated header',
  description:
    'Checks that every <td> in a large, simple (no colspan/rowspan) table has an associated header, via a headers attribute, an implicit column <th> above it, or an implicit row <th> to its left.',
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
  const dom = ctx.helpers.dom;
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

  const TABLE_ROLES = ['table', 'grid', 'treegrid'];

  // The role the attribute resolves to: its first known, non-abstract token,
  // in any case ('' when none is), as user agents read the fallback list.
  function firstRole(el) {
    try {
      return helpers.aria.getExplicitRole(el);
    } catch {
      return '';
    }
  }

  // Content that can carry a name or a value even without text.
  const NAMED_CONTENT =
    'img, svg, canvas, input, select, textarea, button, object, embed, video, audio, iframe, meter, progress, [role], [aria-label], [aria-labelledby], [title]';

  function isEmptyCell(cell) {
    if (trim(dom.textContent(cell))) return false;
    try {
      return !dom.querySelector(cell, NAMED_CONTENT);
    } catch {
      return false;
    }
  }

  // What a table with no header cell holds, read from the page: signs of
  // data (numbers in most of its body, a caption or a thead, a first row or
  // column drawn bold when the rest is not) and signs of layout (a nested
  // table, form controls, images or blocks of prose in its cells). Only
  // one kind of sign gives a direction.
  const NUMBER =
    /^[-+\u2212]?[$\u20ac\u00a3\u00a5]?\s*\d[\d.,\s\u00a0\u202f]*\s*(?:%|[$\u20ac\u00a3\u00a5])?$/;
  const LAYOUT_CONTENT =
    'table, input:not([type="hidden" i]), select, textarea, button, img, p, ul, ol, dl, h1, h2, h3, h4, h5, h6, blockquote';
  const PROSE_LENGTH = 150;

  function weightBold(el) {
    try {
      const cs = helpers.computedStyle(el);
      const w = String((cs && cs.fontWeight) || '');
      return w === 'bold' || w === 'bolder' || Number(w) >= 600;
    } catch {
      return false;
    }
  }
  // A cell drawn bold, itself or through the one element holding its text
  // (<td><b>Name</b></td>).
  function isBold(cell) {
    if (weightBold(cell)) return true;
    const kids = Array.from(dom.children(cell) || []);
    return (
      kids.length === 1 &&
      trim(dom.textContent(kids[0])) === trim(dom.textContent(cell)) &&
      weightBold(kids[0])
    );
  }
  // Every non-empty cell of `cells` bold, and none of `others`.
  function boldApart(cells, others) {
    const full = cells.filter((c) => trim(dom.textContent(c)));
    const rest = others.filter((c) => trim(dom.textContent(c)));
    return full.length >= 2 && rest.length > 0 && full.every(isBold) && !rest.some(isBold);
  }

  function tableKind(table, rowCells) {
    const body = [];
    rowCells.slice(1).forEach((cells) => body.push(...cells.slice(1)));
    const texts = body.map((c) => trim(dom.textContent(c))).filter(Boolean);
    const numericShare = texts.length
      ? texts.filter((t) => NUMBER.test(t)).length / texts.length
      : 0;
    let captionOrHead = false;
    try {
      captionOrHead = !!dom.querySelector(table, ':scope > caption, :scope > thead');
    } catch {}
    const firstColumn = rowCells.map((cells) => cells[0]).filter(Boolean);
    const headerStyled = boldApart(rowCells[0], body) || boldApart(firstColumn.slice(1), body);
    const data = numericShare >= 0.5 || captionOrHead || headerStyled;

    let layoutContent = false;
    for (const cells of rowCells) {
      for (const c of cells) {
        let hit = false;
        try {
          hit = !!dom.querySelector(c, LAYOUT_CONTENT);
        } catch {}
        if (hit || trim(dom.textContent(c)).length > PROSE_LENGTH) layoutContent = true;
      }
    }
    const signals = [
      { signal: 'numeric-cell-share', value: Math.round(numericShare * 100) / 100 },
      { signal: 'caption-or-thead', value: captionOrHead },
      { signal: 'header-styled-first-row-or-column', value: headerStyled },
      { signal: 'layout-content-in-cells', value: layoutContent }
    ];
    if (data && !layoutContent) return { toward: 'fail', signals };
    if (layoutContent && !data) return { toward: 'pass', signals };
    return null;
  }

  const tables = helpers.queryAllSmart ? helpers.queryAllSmart('table') : helpers.queryAll('table');

  const occurrences = [];
  const questions = [];
  let applicableCount = 0;

  for (const table of tables) {
    if (!table || !table.rows) continue;

    const tableRole = firstRole(table);
    if (tableRole && !TABLE_ROLES.includes(tableRole)) continue;

    const rows = Array.from(table.rows);
    if (rows.length < MIN_SIZE) continue;

    const rowCells = rows.map((r) => Array.from(r.cells || []));
    const maxCols = rowCells.reduce((m, cells) => Math.max(m, cells.length), 0);
    if (maxCols < MIN_SIZE) continue;

    // A rowspan of 0 spans too: the cell grows down to the end of its row
    // group (HTML, forming a table). A colspan of 0 is 1. parseInt reads
    // the values as HTML's rules for parsing non-negative integers do:
    // leading space and trailing junk allowed (" 0 ", "0x").
    const hasSpan = rowCells.some((cells) =>
      cells.some((c) => {
        const cs = Number.parseInt(dom.getAttribute(c, 'colspan') || '1', 10);
        const rs = Number.parseInt(dom.getAttribute(c, 'rowspan') || '1', 10);
        return (Number.isFinite(cs) && cs > 1) || (Number.isFinite(rs) && (rs > 1 || rs === 0));
      })
    );
    if (hasSpan) continue;

    applicableCount += 1;

    // An aria-hidden <th> is removed from the accessibility tree entirely
    // -- a screen reader never announces it, so it can't actually serve as
    // another cell's row/column header, even though it's still structurally
    // a <th>.
    function isHeaderCell(cell) {
      if (!cell || !dom.tagName(cell) || !isEligible(cell)) return false;
      const role = firstRole(cell);
      if (role === 'columnheader' || role === 'rowheader') return true;
      return dom.tagName(cell).toLowerCase() === 'th' && !role;
    }

    // "Was there a <th> above this cell's column" and "was there a <th>
    // earlier in this cell's row" are both prefix questions over a scan
    // already in progress (rows top to bottom, cells left to right within a
    // row), so each is tracked incrementally instead of rescanning the
    // rows/columns already passed for every cell: colHasHeaderAbove[c]
    // carries forward across rows, rowHasHeaderBefore resets at the start
    // of each row. One pass over every cell, not one rescan per cell.
    // A table with no header cell at all may be a layout table, which 1.3.1
    // asks no headers of, or a data table that lacks them: markup can't tell
    // which, so it is asked about once, on the table.
    const hasAnyHeader = rowCells.some((cells) => cells.some((c) => isHeaderCell(c)));
    if (!hasAnyHeader) {
      const hasData = rowCells.some((cells) => cells.some((c) => isEligible(c) && !isEmptyCell(c)));
      if (hasData) {
        const kind = tableKind(table, rowCells);
        questions.push(
          helpers.reportOccurrence(table, {
            summary: 'This table has no header cells. If it holds data, its cells have no headers.',
            hint: 'If the table holds data, mark its header cells with <th>, or give its cells a headers attribute. If it only lays out content, give it role="presentation".',
            occurrenceOutcome: 'cantTell',
            i18n: {
              summaryKey: 'tdHasHeader_summary_cantTell_noHeaders',
              hintKey: 'tdHasHeader_hint_cantTell_noHeaders',
              params: {}
            },
            uncertainty: {
              code: 'judgement-required',
              needed: 'Whether the table holds data, which needs headers, or only lays out content.'
            },
            ...(kind
              ? {
                  lean: {
                    toward: kind.toward,
                    why:
                      kind.toward === 'fail'
                        ? 'The table looks like data: most of its cells are numbers, or it has a caption, a table head, or a first row or column drawn as headers.'
                        : 'The table looks like layout: its cells hold a nested table, form controls, images or blocks of text, and nothing marks it as data.',
                    signals: kind.signals,
                    caution:
                      kind.toward === 'fail'
                        ? 'A layout table can also hold numbers, such as prices beside text.'
                        : 'A data table can hold images or controls in its cells, such as a product list.',
                    i18n: {
                      whyKey: `tdHasHeader_lean_why_${kind.toward === 'fail' ? 'data' : 'layout'}`,
                      cautionKey: `tdHasHeader_lean_caution_${kind.toward === 'fail' ? 'data' : 'layout'}`
                    }
                  }
                }
              : {}),
            data: { details: { reasonCode: 'TD_TABLE_NO_HEADERS' } }
          })
        );
      }
      continue;
    }

    const colHasHeaderAbove = new Array(maxCols).fill(false);

    for (let r = 0; r < rowCells.length; r++) {
      const cells = rowCells[r];
      let rowHasHeaderBefore = false;

      for (let c = 0; c < cells.length; c++) {
        const cell = cells[c];
        if (!cell) continue;

        if (isHeaderCell(cell)) {
          colHasHeaderAbove[c] = true;
          rowHasHeaderBefore = true;
          continue;
        }

        // An aria-hidden data cell isn't exposed to AT either, so it has
        // no need for an accessible header association.
        if (!isEligible(cell)) continue;

        const headersAttr = trim(dom.getAttribute(cell, 'headers'));
        if (headersAttr) continue;

        // An empty cell holds no data to associate with a header.
        if (isEmptyCell(cell)) continue;

        if (colHasHeaderAbove[c]) continue;
        if (rowHasHeaderBefore) continue;

        occurrences.push(
          helpers.reportOccurrence(cell, {
            summary:
              'This data cell has no associated header (no headers attribute, no column <th> above it, no row <th> to its left).',
            hint: "Add a headers attribute that points at the right <th> ids, or arrange the table so a <th> sits above this cell's column or at the start of its row.",
            occurrenceOutcome: 'fail',
            i18n: {
              summaryKey: 'tdHasHeader_summary_fail',
              hintKey: 'tdHasHeader_hint_fail',
              params: { row: String(r), column: String(c) }
            },
            data: {
              details: { reasonCode: 'TD_NO_ASSOCIATED_HEADER', row: r, column: c }
            }
          })
        );
      }
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  const resolved = helpers.resolveTieredOutcome(
    occurrences,
    questions,
    rule.defaultSeverity || 'serious'
  );
  return { ruleId: rule.ruleId, ...resolved };
}

module.exports = { id, meta, runInPage };
