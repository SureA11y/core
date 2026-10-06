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
 *   semantics, leaving no table for headers to describe. Matches ACT
 *   a25f45's applicability.
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
  const { document, helpers, rule } = ctx;

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
    // the native one stands.
    const tableRole = table ? getExplicitRole(table) : '';
    if (tableRole && tableRole !== 'table' && tableRole !== 'grid' && tableRole !== 'treegrid')
      continue;

    applicableCount += 1;

    const invalid = [];

    for (const headerId of ids) {
      let ref;
      try {
        ref = dom.getElementById(document, headerId);
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
        invalid.push({ id: headerId, reason: 'not-a-cell' });
        continue;
      }
      if (table && (!dom.get(ref, 'closest') || dom.closest(ref, 'table') !== table)) {
        invalid.push({ id: headerId, reason: 'different-table' });
      }
    }

    if (!invalid.length) continue;

    const dedupedInvalidIds = [...new Set(invalid.map((i) => i.id))];

    const tag = dom.tagName(el).toLowerCase();

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: 'This cell’s headers attribute references one or more invalid header cells.',
        hint: 'Update the headers attribute so every id refers to a cell (<td> or <th>) within the same table.',
        i18n: {
          summaryKey: 'tableHeadersAttrValid_summary_fail',
          hintKey: 'tableHeadersAttrValid_hint_fail',
          params: { element: tag, invalidIds: dedupedInvalidIds.join(', ') }
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
