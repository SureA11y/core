'use strict';

/**
 * @check avoid-inline-spacing
 * @atomic true
 * @summary Inline style must not force text-spacing properties with !important
 * @standard WCAG 2.2
 * @sc 1.4.12
 * @applicability
 *   Applies to elements with an inline style attribute that sets
 *   line-height, letter-spacing, or word-spacing.
 * @expectation
 *   None of those three properties are declared with `!important` in the
 *   inline style. WCAG 1.4.12 (Text Spacing) requires that users be able
 *   to override these properties via a user stylesheet without losing
 *   content or functionality; `!important` on an inline declaration
 *   defeats that override (inline `!important` wins over nearly every
 *   other origin, including user stylesheets applied the normal way).
 * @implementation-notes
 * - Static text-based parsing of the style attribute string (regex for
 *   the three property names followed by `!important`), not computed
 *   style — matches the property list a widely-used reference engine's avoid-inline-spacing
 *   rule checks.
 */

const id = 'avoid-inline-spacing';

const meta = {
  title: 'Inline style must not force text spacing with !important',
  description:
    'Checks that inline style does not set line-height, letter-spacing, or word-spacing with !important, which blocks user text-spacing overrides.',
  i18n: {
    titleKey: 'avoidInlineSpacing_title',
    descriptionKey: 'avoidInlineSpacing_description'
  },
  helpUrl: null,
  tags: ['wcag21aa', 'wcag1412', 'structure', 'atomic', 'automatic'],
  wcagSc: ['1.4.12'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.4.12',
      title: 'Text Spacing',
      conformanceLevel: 'AA'
    }
  ],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '1.4.12': ['avoid-inline-spacing'] } }
};

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  const SPACING_PROPS = ['line-height', 'letter-spacing', 'word-spacing'];

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('[style]')
    : helpers.queryAll('[style]');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;
    const raw = String(el.getAttribute('style') || '');
    if (!raw.trim()) continue;

    const lower = raw.toLowerCase();
    const hasAnySpacingProp = SPACING_PROPS.some((p) => lower.includes(p));
    if (!hasAnySpacingProp) continue;

    applicableCount += 1;

    const flagged = [];
    for (const prop of SPACING_PROPS) {
      const re = new RegExp(prop.replace('-', '\\-') + '\\s*:[^;]*!important', 'i');
      if (re.test(raw)) flagged.push(prop);
    }

    if (!flagged.length) continue;

    const tag = el.tagName.toLowerCase();
    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : el.outerHTML || '';

    occurrences.push({
      selector: stableSelector,
      html,
      summary: `This element's inline style forces ${flagged.join(', ')} with !important, blocking user text-spacing overrides.`,
      hint: 'Remove !important from line-height/letter-spacing/word-spacing in inline styles so users can override text spacing.',
      i18n: {
        summaryKey: 'avoidInlineSpacing_summary_fail',
        hintKey: 'avoidInlineSpacing_hint_fail',
        params: { element: tag, properties: flagged.join(', ') }
      },
      data: {
        details: { reasonCode: 'INLINE_SPACING_IMPORTANT', element: tag, properties: flagged }
      }
    });
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'moderate',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
