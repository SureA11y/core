/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check table-headers-attr-valid
 * @atomic true
 * @summary Table cell "headers" attribute must reference real <th> cells in the same table
 * @standard WCAG 2.2
 * @sc 1.3.1
 * @applicability
 *   Applies to <td>/<th> elements that carry a non-empty headers attribute,
 *   within a <table> whose semantic role is still table/grid/treegrid --
 *   an explicit role of anything else (role="presentation"/"none", but
 *   also role="heading" or any other real role) replaces the native table
 *   semantics, leaving no table for headers to describe. A presentational
 *   role on a table with a global ARIA attribute or a tabindex is ignored,
 *   as WAI-ARIA's conflict resolution has it, and the table stays one.
 *   Matches ACT a25f45's applicability.
 * @expectation
 *   Every id token in the headers attribute resolves to an element that:
 *   (a) exists, (b) is a cell (<td> or <th>) of the same <table> as the
 *   referencing cell, and (c) is not the cell itself. A <td> serving as a
 *   header via role="columnheader"/"rowheader" is a valid target, same as
 *   a plain <th> -- ACT a25f45 does not require the native tag.
 * @reports
 *   - `invalid`: one item per id in the headers attribute that does not
 *     point at a valid header: `id`, and `reason`, which is `missing` (no
 *     element has that id), `self-reference` (the cell points at itself),
 *     `not-a-cell` (the element is not a <td> or <th>) or `different-table`
 *     (the cell is in another table).
 * @reason-codes
 *   - `TABLE_HEADERS_ATTR_INVALID` (fail): a cell's headers attribute names
 *     an id that is missing, is the cell itself, is not a cell, or is a cell
 *     of another table.
 *     Basis: WCAG 1.3.1; H43; ACT a25f45; HTML table model headers
 *     attribute (MUST).
 * @implementation-notes
 * - One occurrence per offending cell (not per bad token), listing every
 *   invalid reference.
 * - Not rule-gated on isAccTreeEligible: this remains a static-markup
 *   property, while engine-level hidden-subtree filtering still applies
 *   unless engineOptions.includeHiddenElements is true.
 */

const id = 'table-headers-attr-valid';

const meta = {
  title: 'Table cell "headers" attribute must reference valid header cells',
  description:
    'Checks that each id in a <td>/<th> headers attribute resolves to a cell (<td> or <th>) within the same table (not missing, not a non-cell element, not itself).',
  i18n: {
    titleKey: 'tableHeadersAttrValid_title',
    descriptionKey: 'tableHeadersAttrValid_description'
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
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '1.3.1': ['table-headers-attr-valid'] } }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const ariaHelpers = helpers && helpers.aria ? helpers.aria : null;

  // The role attribute holds a fallback list; the first token naming a real
  // role wins (in any case), and unknown tokens are skipped over.
  function getExplicitRole(el) {
    return ariaHelpers && el ? ariaHelpers.getExplicitRole(el) : '';
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('td[headers], th[headers]')
    : helpers.queryAll('td[headers], th[headers]');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;

    const raw = String(dom.getAttribute(el, 'headers') || '').trim();
    if (!raw) continue;
    const ids = raw.split(/\s+/).filter(Boolean);
    if (!ids.length) continue;

    const table = dom.get(el, 'closest') ? dom.closest(el, 'table') : null;

    // An explicit role on the <table> replaces its native table role. Only
    // the three roles that still describe a table keep the cell's headers
    // attribute meaningful; anything else (presentation/none, heading, ...)
    // takes the whole table out of scope. Unknown tokens name no role, so
    // the native one stands. A presentational role is ignored, as WAI-ARIA's
    // conflict resolution has it, on a table with a global ARIA attribute or
    // a tabindex: it stays a table (ACT a25f45 goes by its semantic role).
    let tableRole = table ? getExplicitRole(table) : '';
    if (
      (tableRole === 'presentation' || tableRole === 'none') &&
      ((ariaHelpers && ariaHelpers.hasGlobalAriaAttr(table)) ||
        /^\s*[+-]?\d/.test(dom.getAttribute(table, 'tabindex') || ''))
    )
      tableRole = '';
    if (tableRole && tableRole !== 'table' && tableRole !== 'grid' && tableRole !== 'treegrid')
      continue;

    applicableCount += 1;

    const invalid = [];

    for (const headerId of ids) {
      let ref;
      try {
        ref = helpers.getElementByIdInTree(el, headerId);
      } catch {
        ref = null;
      }

      if (!ref) {
        invalid.push({ id: headerId, reason: 'missing' });
        continue;
      }
      if (ref === el) {
        invalid.push({ id: headerId, reason: 'self-reference' });
        continue;
      }
      const refTag = dom.tagName(ref) ? dom.tagName(ref).toLowerCase() : '';
      if (refTag !== 'th' && refTag !== 'td') {
        // The cell it sits in, when the id is on an element inside a cell.
        const holder = dom.get(ref, 'closest') ? dom.closest(ref, 'th, td') : null;
        invalid.push({
          id: headerId,
          reason: 'not-a-cell',
          element: refTag,
          inCell: holder ? dom.tagName(holder).toLowerCase() : null
        });
        continue;
      }
      if (table && (!dom.get(ref, 'closest') || dom.closest(ref, 'table') !== table)) {
        invalid.push({ id: headerId, reason: 'different-table' });
      }
    }

    if (!invalid.length) continue;

    const dedupedInvalidIds = [...new Set(invalid.map((i) => i.id))];

    const tag = dom.tagName(el).toLowerCase();

    // With one bad id, the hint says what is wrong with it.
    const one = (() => {
      if (dedupedInvalidIds.length !== 1) return null;
      const bad = invalid[0];
      const badId = bad.id;
      if (bad.reason === 'missing') {
        return {
          hint: `No element has the id "${badId}". Give the header cell this id, or point the headers attribute at the id it has.`,
          hintKey: 'tableHeadersAttrValid_hint_fail_missing',
          params: { id: badId }
        };
      }
      if (bad.reason === 'self-reference') {
        return {
          hint: `"${badId}" is this cell's own id, and a cell can't be its own header. Point the headers attribute at a header cell's id.`,
          hintKey: 'tableHeadersAttrValid_hint_fail_self',
          params: { id: badId }
        };
      }
      if (bad.reason === 'different-table') {
        return {
          hint: `"${badId}" is a cell of another <table>, such as the separate header table a fixed-header layout builds, and headers works only within one table. Put the header row in the same table as this cell.`,
          hintKey: 'tableHeadersAttrValid_hint_fail_differentTable',
          params: { id: badId }
        };
      }
      const refElement = bad.element;
      return bad.inCell
        ? {
            hint: `"${badId}" is on a <${refElement}> inside a <${bad.inCell}>, not on the cell itself. Move the id to the <${bad.inCell}>.`,
            hintKey: 'tableHeadersAttrValid_hint_fail_inCell',
            params: { id: badId, refElement, cell: bad.inCell }
          }
        : {
            hint: `"${badId}" is on a <${refElement}>, not on a table cell. Point the headers attribute at a <th>'s id.`,
            hintKey: 'tableHeadersAttrValid_hint_fail_notCell',
            params: { id: badId, refElement }
          };
    })();

    // With several, the hint lists what each id reaches, in markup alone:
    // "h1" (<th> › <span>), "h2" (—) for an id no element has.
    const reached = one
      ? ''
      : dedupedInvalidIds
          .map((badId) => {
            const bad = invalid.find((i) => i.id === badId);
            let where = '—';
            if (bad.reason === 'self-reference' || bad.reason === 'different-table') {
              const ref = helpers.getElementByIdInTree(el, badId);
              where = `<${String(dom.tagName(ref) || '').toLowerCase()}>`;
            } else if (bad.reason === 'not-a-cell') {
              where = bad.inCell ? `<${bad.inCell}> › <${bad.element}>` : `<${bad.element}>`;
            }
            return `"${badId}" (${where})`;
          })
          .join(', ');

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: 'This cell’s headers attribute references one or more invalid header cells.',
        hint: one
          ? one.hint
          : `None of these ids reaches a header cell for it: ${reached}, where — marks an id no element has. Each id must be on another <th> or <td> of this same table: not on an element inside a cell, and not in another table.`,
        i18n: {
          summaryKey: 'tableHeadersAttrValid_summary_fail',
          hintKey: one ? one.hintKey : 'tableHeadersAttrValid_hint_fail_several',
          params: {
            element: tag,
            invalidIds: dedupedInvalidIds.join(', '),
            ...(one ? one.params : { reached })
          }
        },
        data: {
          details: { reasonCode: 'TABLE_HEADERS_ATTR_INVALID', element: tag, invalid }
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
      severity: rule.defaultSeverity || 'serious',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
