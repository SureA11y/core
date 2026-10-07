/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check scope-attr-valid
 * @atomic true
 * @summary The scope attribute must have a valid value
 * @standard Best Practices (no formal WCAG Success Criterion)
 * @applicability
 *   Applies to <th> elements with a non-empty scope attribute. HTML's table
 *   model reads scope on <th> only, and browsers ignore it elsewhere (on a
 *   <td>, or a custom element's own scope attribute).
 * @expectation
 *   The scope value is one of "row", "col", "rowgroup", or "colgroup"
 *   (case-insensitive, and not trimmed: HTML matches the keyword exactly,
 *   so scope=" col " is no column header). An invalid scope value is not
 *   recognized by assistive technology, silently losing the row/column
 *   header association it was meant to declare.
 * @reports
 *   - `value`: the `scope` value as written.
 * @implementation-notes
 * - Not WCAG-normative, authored as an advisory, cantTell-capped
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
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const VALID_SCOPES = new Set(['row', 'col', 'rowgroup', 'colgroup']);

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('th[scope]')
    : helpers.queryAll('th[scope]');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    // An enumerated attribute: matched in any case, never trimmed.
    const raw = String(dom.getAttribute(el, 'scope') || '');
    if (!raw) continue;

    applicableCount += 1;

    if (VALID_SCOPES.has(raw.toLowerCase())) continue;

    occurrences.push(
      helpers.reportOccurrence(el, {
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
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'minor',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
