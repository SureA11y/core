'use strict';

/**
 * @check tabindex
 * @atomic true
 * @summary tabindex should not be greater than 0
 * @standard Best Practices (a widely-used reference engine's classification; no formal WCAG Success Criterion — see ROADMAP.md Tier 1b)
 * @applicability
 *   Applies to elements with a tabindex attribute whose value parses as
 *   a valid integer.
 * @expectation
 *   The tabindex value is 0 or negative. A positive tabindex reorders
 *   keyboard tab order explicitly, which is fragile to maintain as a
 *   page changes and usually indicates the natural DOM order should be
 *   fixed instead.
 * @implementation-notes
 * - Not WCAG-normative — authored as an advisory, cantTell-capped
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
  coverage: {}
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('[tabindex]') : helpers.queryAll('[tabindex]');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;
    const raw = String(el.getAttribute('tabindex') || '').trim();
    if (!raw) continue;
    const n = Number(raw);
    if (!Number.isInteger(n)) continue;

    applicableCount += 1;

    if (n <= 0) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    occurrences.push({
      selector: stableSelector,
      html,
      summary: 'This element has a positive tabindex, overriding the natural tab order.',
      hint: 'Use tabindex="0" (or a negative value to remove from tab order) instead of a positive number; fix the DOM order if a different tab order is needed.',
      i18n: {
        summaryKey: 'tabindex_summary_cantTell',
        hintKey: 'tabindex_hint_cantTell',
        params: { value: String(n) }
      },
      data: {
        details: { reasonCode: 'TABINDEX_POSITIVE', value: n }
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
