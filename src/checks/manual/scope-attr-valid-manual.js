'use strict';

/**
 * @check scope-attr-valid
 * @atomic true
 * @summary The scope attribute must have a valid value
 * @standard Best Practices (a widely-used reference engine's classification; no formal WCAG Success Criterion — see ROADMAP.md Tier 1b)
 * @applicability
 *   Applies to elements with a non-empty scope attribute.
 * @expectation
 *   The scope value is one of "row", "col", "rowgroup", or "colgroup"
 *   (case-insensitive). An invalid scope value is not recognized by
 *   assistive technology, silently losing the row/column header
 *   association it was meant to declare.
 * @implementation-notes
 * - Not WCAG-normative — authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent.
 */

const id = 'scope-attr-valid';

const meta = {
  title: 'scope attribute must have a valid value',
  description: 'Checks that scope="..." is one of row, col, rowgroup, or colgroup.',
  i18n: {
    titleKey: 'scopeAttrValid_title',
    descriptionKey: 'scopeAttrValid_description'
  },
  helpUrl: null,
  tags: ['best-practice', 'tables', 'structure', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const VALID_SCOPES = new Set(['row', 'col', 'rowgroup', 'colgroup']);

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('[scope]') : helpers.queryAll('[scope]');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;
    const raw = String(el.getAttribute('scope') || '').trim();
    if (!raw) continue;

    applicableCount += 1;

    if (VALID_SCOPES.has(raw.toLowerCase())) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    occurrences.push({
      selector: stableSelector,
      html,
      summary: 'This scope attribute value is not recognized.',
      hint: 'Use one of row, col, rowgroup, or colgroup for the scope attribute.',
      i18n: {
        summaryKey: 'scopeAttrValid_summary_cantTell',
        hintKey: 'scopeAttrValid_hint_cantTell',
        params: { value: raw }
      },
      data: {
        details: { reasonCode: 'SCOPE_ATTR_INVALID', value: raw }
      }
    });
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'cantTell', severity: rule.defaultSeverity || 'minor', occurrences };
  }
  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
