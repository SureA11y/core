'use strict';

/**
 * @check label-title-only
 * @atomic true
 * @summary Form controls should not rely on the title attribute as their only label
 * @standard Best Practices (a widely-used reference engine's classification; no formal WCAG Success Criterion — see ROADMAP.md Tier 1b)
 * @applicability
 *   Applies to labelable form controls (input, excluding
 *   hidden/submit/reset/button/image; select; textarea) that have a
 *   non-empty title attribute.
 * @expectation
 *   The control also has a real label — a wrapping/associated <label>,
 *   aria-label, or aria-labelledby — rather than depending on the title
 *   attribute alone. A title-only tooltip is not reliably exposed by all
 *   assistive technology and is not visible at all until hover/focus,
 *   unlike a persistent visible label.
 * @implementation-notes
 * - Not WCAG-normative — authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent.
 * - Distinct from form-control-programmatic-label-present (that
 *   rule accepts title as one of several valid presence mechanisms;
 *   this rule flags the narrower case where title is the ONLY one).
 */

const id = 'label-title-only';

const meta = {
  title: 'Form controls should not use title as their only label',
  description: 'Checks that a form control with a title attribute also has a real label (label element, aria-label, or aria-labelledby).',
  i18n: {
    titleKey: 'labelTitleOnly_title',
    descriptionKey: 'labelTitleOnly_description'
  },
  helpUrl: null,
  tags: ['best-practice', 'forms', 'structure', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'understandable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  const selector = 'input:not([type="hidden"]):not([type="submit"]):not([type="reset"]):not([type="button"]):not([type="image"]),select,textarea';
  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart(selector) : helpers.queryAll(selector);

  const labelsByFor = new Map();
  const allLabels = document.getElementsByTagName ? document.getElementsByTagName('label') : [];
  for (const lab of allLabels) {
    if (!lab || !lab.getAttribute) continue;
    const forValue = String(lab.getAttribute('for') || '').trim();
    if (!forValue) continue;
    if (!labelsByFor.has(forValue)) labelsByFor.set(forValue, []);
    labelsByFor.get(forValue).push(lab);
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;

    const title = String(el.getAttribute('title') || '').trim();
    if (!title) continue;

    applicableCount += 1;

    const ariaLabel = String(el.getAttribute('aria-label') || '').trim();
    if (ariaLabel) continue;
    const ariaLabelledby = String(el.getAttribute('aria-labelledby') || '').trim();
    if (ariaLabelledby) continue;

    const wrappingLabel = el.closest ? el.closest('label') : null;
    if (wrappingLabel) continue;

    const controlId = String(el.getAttribute('id') || '').trim();
    if (controlId && labelsByFor.has(controlId)) continue;

    const tag = el.tagName.toLowerCase();
    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    occurrences.push({
      selector: stableSelector,
      html,
      summary: 'This form control relies on the title attribute as its only label.',
      hint: 'Add a visible <label> (or aria-label/aria-labelledby) in addition to, or instead of, the title attribute.',
      i18n: {
        summaryKey: 'labelTitleOnly_summary_cantTell',
        hintKey: 'labelTitleOnly_hint_cantTell',
        params: { element: tag }
      },
      data: {
        details: { reasonCode: 'LABEL_TITLE_ONLY', element: tag }
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
