'use strict';

/**
 * @check aria-valid-attr
 * @atomic true
 * @summary Every aria-* attribute present must be a real, defined ARIA attribute
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to any element in the composed DOM that carries at least one
 *   attribute whose name starts with "aria-".
 * @expectation
 *   Each aria-* attribute name is a real attribute defined by the WAI-ARIA
 *   specification (catches typos / made-up attribute names, which are
 *   silently ignored by assistive technology and therefore a real,
 *   deterministic defect).
 * @implementation-notes
 * - Distinct from aria-valid-attr-value (which validates the VALUE
 *   of a recognized attribute) — this rule only validates the attribute
 *   NAME.
 * - Not gated on isAccTreeEligible: this is a static markup property.
 */

const id = 'aria-valid-attr';

const meta = {
  title: 'aria-* attributes must be real, defined ARIA attributes',
  description: 'Checks that every aria-* attribute name present in the DOM is a real attribute defined by the WAI-ARIA specification.',
  i18n: {
    titleKey: 'ariaValidAttr_title',
    descriptionKey: 'ariaValidAttr_description'
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
  coverage: { facetsBySc: { '4.1.2': ['aria-attr-name-valid'] } }
};

function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const ariaHelpers = helpers && helpers.aria ? helpers.aria : null;
  if (!ariaHelpers) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('*', safeRoot) : helpers.queryAll('*', safeRoot);

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.attributes) continue;

    let invalidNames = null;
    const attrs = el.attributes;
    for (let i = 0; i < attrs.length; i++) {
      const name = String(attrs[i].name || '').toLowerCase();
      if (name.slice(0, 5) !== 'aria-') continue;

      applicableCount += 1;

      if (!ariaHelpers.isValidAriaAttrName(name)) {
        if (!invalidNames) invalidNames = [];
        invalidNames.push(name);
      }
    }

    if (!invalidNames || !invalidNames.length) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    for (const name of invalidNames) {
      occurrences.push({
        selector: stableSelector,
        html,
        summary: 'This element has an attribute that is not a recognized ARIA attribute.',
        hint: 'Correct the attribute name (check for typos), or remove it if not needed.',
        i18n: {
          summaryKey: 'ariaValidAttr_summary_fail',
          hintKey: 'ariaValidAttr_hint_fail',
          params: { attr: name }
        },
        data: {
          details: { reasonCode: 'ARIA_ATTR_INVALID', attr: name }
        }
      });
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'serious', occurrences };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
