'use strict';

/**
 * @check form-control-single-label
 * @atomic true
 * @summary A form control must not be associated with more than one <label>
 * @standard WCAG 2.2
 * @sc 3.3.2
 * @applicability
 *   Applies to labelable form controls (input, excluding
 *   hidden/submit/reset/button/image; select; textarea).
 * @expectation
 *   At most one <label> is associated with the control — either by
 *   wrapping it, or by a <label for="..."> pointing to its id
 *   (deduplicated: a label that both wraps the control and
 *   self-references it via for counts once). Multiple associated labels
 *   are ambiguous: many screen readers only announce one of them, and it
 *   is not deterministic which.
 * @implementation-notes
 * - Matches a widely-used reference engine's form-field-multiple-labels. Distinct, atomic
 *   decision from form-control-programmatic-label-present (that
 *   rule checks a label exists at all; this one checks there is at most
 *   one).
 */

const id = 'form-control-single-label';

const meta = {
  title: 'Form controls must not have multiple labels',
  description: 'Checks that a form control is associated with at most one <label> (by wrapping or by label[for]).',
  i18n: {
    titleKey: 'formControlSingleLabel_title',
    descriptionKey: 'formControlSingleLabel_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag332', 'forms', 'atomic', 'automatic'],
  wcagSc: ['3.3.2'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '3.3.2', title: 'Labels or Instructions', conformanceLevel: 'A' }
  ],
  defaultSeverity: 'moderate',
  category: 'understandable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '3.3.2': ['form-control-single-label'] } }
};

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  const selector = 'input:not([type="hidden"]):not([type="submit"]):not([type="reset"]):not([type="button"]):not([type="image"]),select,textarea';
  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart(selector) : helpers.queryAll(selector);

  // Build a for-value -> label[] map once (avoids per-control dynamic
  // attribute-selector construction / CSS.escape, which is not guaranteed
  // to exist as a global in every runtime this engine executes in).
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

    applicableCount += 1;

    const labels = new Set();

    const wrappingLabel = el.closest ? el.closest('label') : null;
    if (wrappingLabel) labels.add(wrappingLabel);

    const controlId = String(el.getAttribute('id') || '').trim();
    if (controlId && labelsByFor.has(controlId)) {
      for (const lab of labelsByFor.get(controlId)) labels.add(lab);
    }

    if (labels.size <= 1) continue;

    const tag = el.tagName.toLowerCase();
    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    occurrences.push({
      selector: stableSelector,
      html,
      summary: 'This form control is associated with more than one <label>.',
      hint: 'Keep only one <label> per form control (either wrapping it or referencing it via for/id).',
      i18n: {
        summaryKey: 'formControlSingleLabel_summary_fail',
        hintKey: 'formControlSingleLabel_hint_fail',
        params: { element: tag, labelCount: String(labels.size) }
      },
      data: {
        details: { reasonCode: 'FORM_FIELD_MULTIPLE_LABELS', element: tag, labelCount: labels.size }
      }
    });
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'moderate', occurrences };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };