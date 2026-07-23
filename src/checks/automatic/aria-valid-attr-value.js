'use strict';

/**
 * @check a11ycore-aria-valid-attr-value
 * @atomic true
 * @summary Every recognized aria-* attribute must have a value matching its declared type
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to any element carrying at least one recognized aria-* attribute
 *   (unrecognized attribute names are a11ycore-aria-valid-attr's concern,
 *   not evaluated here).
 * @expectation
 *   Each attribute's value conforms to its WAI-ARIA-declared value type:
 *   boolean ("true"/"false"), tristate ("true"/"false"/"mixed"), a token
 *   from a fixed enumerated set, an integer, a real number, or a non-empty
 *   ID reference (list) that resolves to an existing element in the
 *   document.
 * @implementation-notes
 * - Not gated on isAccTreeEligible: this is a static markup property.
 * - ID-reference resolution (added 2026-07-20, see aria-helpers.js's
 *   idExists) only flags idref-list attributes (aria-labelledby,
 *   aria-describedby, aria-controls, aria-owns, etc.) when NONE of the
 *   space-separated ids resolve — a partially-dangling list (some ids
 *   exist, some don't) is left unflagged. Verified 2026-07-21 directly
 *   against the reference engine 4.12.1's own `validateAttrValue` source: this is not
 *   a conservative guess, it's an exact match for the reference engine's own behavior
 *   (`idrefs(vNode, attr).some(node => !!node)` — the reference engine itself only
 *   invalidates when every token fails to resolve). Single-idref
 *   attributes (aria-activedescendant, aria-errormessage) are flagged
 *   whenever their one id doesn't resolve, also matching the reference engine's `idref`
 *   case exactly.
 */

const id = 'a11ycore-aria-valid-attr-value';

const meta = {
  title: 'aria-* attribute values must match their declared type',
  description: 'Checks that every recognized aria-* attribute has a value conforming to its WAI-ARIA-declared value type (boolean, tristate, token, integer, number, or ID reference).',
  i18n: {
    titleKey: 'a11ycore_ariaValidAttrValue_title',
    descriptionKey: 'a11ycore_ariaValidAttrValue_description'
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
  coverage: { facetsBySc: { '4.1.2': ['aria-attr-value-valid'] } }
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
    if (!el || !el.attributes || !el.getAttribute) continue;

    let invalid = null;
    const attrs = el.attributes;
    for (let i = 0; i < attrs.length; i++) {
      const name = String(attrs[i].name || '').toLowerCase();
      if (name.slice(0, 5) !== 'aria-') continue;
      if (!ariaHelpers.isValidAriaAttrName(name)) continue; // a11ycore-aria-valid-attr's concern

      applicableCount += 1;

      const rawValue = el.getAttribute(name);
      const result = ariaHelpers.validateAttrValue(name, rawValue);
      if (!result.valid) {
        if (!invalid) invalid = [];
        invalid.push({ name, value: rawValue == null ? '' : String(rawValue), reason: result.reason });
      }
    }

    if (!invalid || !invalid.length) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    for (const item of invalid) {
      occurrences.push({
        selector: stableSelector,
        html,
        summary: 'This element has an ARIA attribute with an invalid value.',
        hint: 'Use a value that matches the attribute’s expected type (see the WAI-ARIA specification for this attribute).',
        i18n: {
          summaryKey: 'a11ycore_ariaValidAttrValue_summary_fail',
          hintKey: 'a11ycore_ariaValidAttrValue_hint_fail',
          params: { attr: item.name, value: item.value }
        },
        data: {
          details: { reasonCode: 'ARIA_ATTR_VALUE_INVALID', attr: item.name, value: item.value, valueReason: item.reason }
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
