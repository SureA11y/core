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
 * @reason-codes
 *   - `SCOPE_ATTR_INVALID` (cantTell): a th has a scope value that is not
 *     row, col, rowgroup or colgroup, so it declares no header direction.
 *     It leans fail: the page states it.
 *     Basis: HTML table model scope attribute (best practice); H63.
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
  coverage: {},
  // How a person checks each undecided finding: shown with it as
  // howToCheck (docs/OUTPUT_SCHEMA.md).
  review: {
    SCOPE_ATTR_INVALID: {
      steps: [
        'Find the th the report names and read its scope value.',
        'Look at the table and decide whether that header labels a column or a row.',
        'Check that scope is exactly row, col, rowgroup or colgroup, with no extra spaces or other words.'
      ],
      passWhen:
        "The scope value is one of row, col, rowgroup or colgroup and matches the header's direction.",
      failWhen:
        'The scope value is not a recognised keyword, so it declares no header direction (best practice, H63).'
    }
  }
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
        hint: 'Use row, col, rowgroup or colgroup.',
        i18n: {
          summaryKey: 'scopeAttrValid_summary_cantTell',
          hintKey: 'scopeAttrValid_hint_cantTell',
          params: { value: raw }
        },
        // A best practice the page states it breaks: the value is no
        // keyword, whatever direction the auto state then guesses.
        lean: {
          toward: 'fail',
          why: 'The scope value is not one of the four keywords, so it declares no header direction.',
          signals: [{ signal: 'scope-value', value: raw }],
          caution:
            'Browsers then guess the direction, which is usually right for a header in the first row or column.',
          i18n: {
            whyKey: 'scopeAttrValid_lean_why',
            cautionKey: 'scopeAttrValid_lean_caution'
          }
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
