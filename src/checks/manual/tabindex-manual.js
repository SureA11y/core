/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check tabindex
 * @atomic true
 * @summary tabindex should not be greater than 0
 * @standard Best Practices (no formal WCAG Success Criterion)
 * @applicability
 *   Applies to elements with a tabindex attribute whose value parses as
 *   a valid integer.
 * @expectation
 *   The tabindex value is 0 or negative. A positive tabindex reorders
 *   keyboard tab order explicitly, which is fragile to maintain as a
 *   page changes and usually indicates the natural DOM order should be
 *   fixed instead.
 * @reports
 *   - `value`: the `tabindex` value, a whole number above 0.
 * @reason-codes
 *   - `TABINDEX_POSITIVE` (cantTell): the element has a tabindex above 0,
 *     which moves it ahead of the page's natural tab order.
 *     Basis: WCAG 2.4.3 (best practice); F44 (not settled).
 * @implementation-notes
 * - Not WCAG-normative, authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent.
 */

const id = 'tabindex';

const meta = {
  title: 'tabindex should not be greater than 0',
  description: 'Checks that tabindex values are 0 or negative, not a positive number.',
  i18n: {
    titleKey: 'tabindex_title',
    descriptionKey: 'tabindex_description'
  },
  helpUrl: null,
  tags: ['best-practice', 'keyboard', 'structure', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {},
  // How a person checks each undecided finding: shown with it as
  // howToCheck (docs/OUTPUT_SCHEMA.md).
  review: {
    TABINDEX_POSITIVE: {
      steps: [
        'Click just before the start of the page, then press Tab repeatedly, watching the focus outline.',
        'Note when the element the report names gets focus, compared with where it sits on screen.',
        'Check whether the focus order still follows the visual and reading order of the page.'
      ],
      passWhen: 'Focus moves through the page in an order that matches its layout and meaning.',
      failWhen:
        'The positive tabindex makes focus jump out of reading order, which can fail WCAG 2.4.3 (F44) and is against best practice.'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('[tabindex]')
    : helpers.queryAll('[tabindex]');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    const raw = String(dom.getAttribute(el, 'tabindex') || '').trim();
    if (!raw) continue;
    const n = Number(raw);
    if (!Number.isInteger(n)) continue;

    applicableCount += 1;

    if (n <= 0) continue;

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: 'This element has a positive tabindex, overriding the natural tab order.',
        hint: 'Use tabindex="0" to add the element to the tab order, or a negative value to take it out. If the tab order needs to change, change the order of the content instead.',
        i18n: {
          summaryKey: 'tabindex_summary_cantTell',
          hintKey: 'tabindex_hint_cantTell',
          params: { value: String(n) }
        },
        data: {
          details: { reasonCode: 'TABINDEX_POSITIVE', value: n }
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
