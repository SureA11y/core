/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check duplicate-id-aria
 * @atomic true
 * @summary Any id referenced by an ARIA ID-reference attribute must be unique in the document
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies when the document contains at least one non-empty
 *   aria-labelledby, aria-describedby, aria-owns, aria-controls,
 *   aria-activedescendant, aria-flowto, aria-errormessage, or aria-details
 *   attribute (i.e. at least one ARIA ID reference exists to resolve).
 * @expectation
 *   For every id value referenced by one of those attributes, exactly one
 *   element in the document carries that id. A duplicate does not break the
 *   reference: it resolves to the first element in tree order, so the name is
 *   still computed. Whether that element is the intended target depends on
 *   author intent, which markup does not carry, so the outcome is cantTell.
 * @implementation-notes
 * - Scoped to ids referenced by ARIA. The page-wide check
 *   lives in its own rule, `duplicate-id`, mapped to the WCAG 2.0/2.1 SC
 *   4.1.1 that WCAG 2.2 removed; the two overlap on referenced ids and
 *   answer different questions there (see that rule's header).
 * - Document-wide by design: id uniqueness and ARIA id references are a
 *   whole-document property, not scoped to a sub-root. Reported occurrences are
 *   limited to the scanned scope.
 */

const id = 'duplicate-id-aria';

const meta = {
  title: 'IDs referenced by ARIA must be unique',
  description:
    'Checks that any id value referenced by an ARIA ID-reference attribute (aria-labelledby, aria-describedby, aria-owns, aria-controls, aria-activedescendant, aria-flowto, aria-errormessage, aria-details) is unique in the document.',
  i18n: {
    titleKey: 'duplicateIdAria_title',
    descriptionKey: 'duplicateIdAria_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'aria', 'structure', 'atomic', 'automatic'],
  wcagSc: ['4.1.2'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '4.1.2',
      title: 'Name, Role, Value',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'serious',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '4.1.2': ['duplicate-id-aria'] } }
};

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  // Declared inside runInPage, see scripts/build-core.js header
  // ("runInPage MUST be self-contained").
  const IDREF_ATTRS = [
    'aria-labelledby',
    'aria-describedby',
    'aria-owns',
    'aria-controls',
    'aria-activedescendant',
    'aria-flowto',
    'aria-errormessage',
    'aria-details'
  ];

  const idMap = new Map(); // id -> element[]
  const idNodes = document.querySelectorAll ? document.querySelectorAll('[id]') : [];
  for (const el of idNodes) {
    if (!el || !el.getAttribute) continue;
    const value = String(el.getAttribute('id') || '').trim();
    if (!value) continue;
    if (!idMap.has(value)) idMap.set(value, []);
    idMap.get(value).push(el);
  }

  const referencedIds = new Set();
  for (const attr of IDREF_ATTRS) {
    const selector = `[${attr}]`;
    const nodes = document.querySelectorAll ? document.querySelectorAll(selector) : [];
    for (const el of nodes) {
      if (!el || !el.getAttribute) continue;
      const raw = String(el.getAttribute(attr) || '').trim();
      if (!raw) continue;
      for (const token of raw.split(/\s+/)) {
        if (token) referencedIds.add(token);
      }
    }
  }

  // Detection is document-wide; occurrences are limited to the scanned scope.
  let inScope = null;
  if (helpers && typeof helpers.queryAllSmart === 'function') {
    try {
      const scoped = helpers.queryAllSmart('[id]');
      inScope = new Set(Array.isArray(scoped) ? scoped : Array.from(scoped || []));
    } catch {
      inScope = null;
    }
  }

  const cantTellOccurrences = [];

  for (const refId of referencedIds) {
    const els = idMap.get(refId) || [];
    if (els.length <= 1) continue;

    for (const el of els) {
      if (inScope && !inScope.has(el)) continue;

      cantTellOccurrences.push(
        helpers.reportOccurrence(el, {
          summary:
            'This id is referenced by an ARIA attribute but is used by more than one element; the reference resolves to the first.',
          hint: 'Confirm the first element carrying this id is the intended target, or make the id unique.',
          i18n: {
            summaryKey: 'duplicateIdAria_summary_cantTell',
            hintKey: 'duplicateIdAria_hint_cantTell',
            params: { id: refId, duplicateCount: String(els.length) }
          },
          uncertainty: {
            code: 'judgement-required',
            needed: 'Whether the first element carrying this id is the intended target.',
            evidence: { id: refId, duplicateCount: els.length, resolvesTo: 'first' }
          },
          data: {
            details: {
              reasonCode: 'DUPLICATE_ID_ARIA_REFERENCED',
              id: refId,
              duplicateCount: els.length
            }
          }
        })
      );
    }
  }

  if (referencedIds.size === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const resolved = helpers.resolveTieredOutcome(
    [],
    cantTellOccurrences,
    rule.defaultSeverity || 'serious'
  );
  return { ruleId: rule.ruleId, ...resolved };
}

module.exports = { id, meta, runInPage };
