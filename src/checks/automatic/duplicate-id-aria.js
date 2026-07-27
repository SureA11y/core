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
 *   element in the document carries that id. A duplicated id referenced by
 *   ARIA is ambiguous: assistive technologies cannot reliably determine
 *   which element the reference resolves to (typically the first, silently
 *   dropping the others).
 * @implementation-notes
 * - Scoped deliberately to ids referenced by ARIA (matching a widely-used
 *   reference engine's duplicate-id-aria, not the broader/deprecated page-wide duplicate-id
 *   check — see ROADMAP.md's "Skip" list).
 * - Document-wide by design: id uniqueness and ARIA id references are a
 *   whole-document property, not scoped to a sub-root.
 */

const id = 'duplicate-id-aria';

const meta = {
  title: 'IDs referenced by ARIA must be unique',
  description: 'Checks that any id value referenced by an ARIA ID-reference attribute (aria-labelledby, aria-describedby, aria-owns, aria-controls, aria-activedescendant, aria-flowto, aria-errormessage, aria-details) is unique in the document.',
  i18n: {
    titleKey: 'duplicateIdAria_title',
    descriptionKey: 'duplicateIdAria_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'aria', 'structure', 'atomic', 'automatic'],
  wcagSc: ['4.1.2'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '4.1.2', title: 'Name, Role, Value', conformanceLevel: 'A' }
  ],
  defaultSeverity: 'serious',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '4.1.2': ['duplicate-id-aria'] } }
};

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  // Declared inside runInPage — see scripts/build-core.js header
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

  const occurrences = [];

  for (const refId of referencedIds) {
    const els = idMap.get(refId) || [];
    if (els.length <= 1) continue;

    for (const el of els) {
      const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
      const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

      occurrences.push({
        selector: stableSelector,
        html,
        summary: 'This id is referenced by an ARIA attribute but is used by more than one element.',
        hint: 'Make ids referenced by ARIA attributes unique within the document.',
        i18n: {
          summaryKey: 'duplicateIdAria_summary_fail',
          hintKey: 'duplicateIdAria_hint_fail',
          params: { id: refId, duplicateCount: String(els.length) }
        },
        data: {
          details: { reasonCode: 'DUPLICATE_ID_ARIA_REFERENCED', id: refId, duplicateCount: els.length }
        }
      });
    }
  }

  if (referencedIds.size === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'serious', occurrences };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };