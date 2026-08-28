/* SPDX-License-Identifier: MPL-2.0 */

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
 *   Reported at CANTTELL rather than FAIL: an aria-* attribute the spec
 *   does not define is inert, so nothing about the element's exposed name,
 *   role or value changes because it is there. Where the author meant a real
 *   attribute and the element ends up without a name, that absence is the
 *   naming rules' decision, not this one's. ACT 5f99a7 maps 1.3.1/4.1.2 as
 *   secondary requirements, "less strict" than the rule itself.
 * @implementation-notes
 * - Distinct from aria-valid-attr-value (which validates the VALUE
 *   of a recognized attribute), this rule only validates the attribute
 *   NAME.
 * - Not rule-gated on isAccTreeEligible: this remains a static-markup
 *   property, while engine-level hidden-subtree filtering still applies
 *   unless engineOptions.includeHiddenElements is true.
 */

const id = 'aria-valid-attr';

const meta = {
  title: 'aria-* attributes must be real, defined ARIA attributes',
  description:
    'Checks that every aria-* attribute name present in the DOM is a real attribute defined by the WAI-ARIA specification.',
  i18n: {
    titleKey: 'ariaValidAttr_title',
    descriptionKey: 'ariaValidAttr_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'aria', 'structure', 'atomic', 'automatic'],
  wcagSc: ['4.1.2'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '4.1.2',
      title: 'Name, Role, Value',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'serious',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '4.1.2': ['aria-attr-name-valid'] } }
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const ariaHelpers = helpers && helpers.aria ? helpers.aria : null;
  if (!ariaHelpers) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('*') : helpers.queryAll('*');

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

    for (const name of invalidNames) {
      occurrences.push(
        helpers.reportOccurrence(el, {
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
        })
      );
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  const resolved = helpers.resolveTieredOutcome([], occurrences, rule.defaultSeverity || 'serious');
  return { ruleId: rule.ruleId, ...resolved };
}

module.exports = { id, meta, runInPage };
