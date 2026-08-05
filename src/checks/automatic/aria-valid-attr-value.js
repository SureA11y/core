'use strict';

/**
 * @check aria-valid-attr-value
 * @atomic true
 * @summary Every recognized aria-* attribute must have a value matching its declared type
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to any element carrying at least one recognized aria-* attribute
 *   (unrecognized attribute names are aria-valid-attr's concern,
 *   not evaluated here).
 * @expectation
 *   Each attribute's value conforms to its WAI-ARIA-declared value type:
 *   boolean ("true"/"false"), tristate ("true"/"false"/"mixed"), a token
 *   from a fixed enumerated set, an integer, a real number, or an empty
 *   value or ID reference (list) that resolves to an existing element in
 *   the document.
 * @implementation-notes
 * - Not rule-gated on isAccTreeEligible: this remains a static-markup
 *   property, while engine-level hidden-subtree filtering still applies
 *   unless engineOptions.includeHiddenElements is true.
 * - ID-reference resolution (see aria-helpers.js's idExists) only flags
 *   idref-list attributes (aria-labelledby, aria-describedby,
 *   aria-controls, aria-owns, etc.) when NONE of the space-separated ids
 *   resolve — a partially-dangling list (some ids exist, some don't) is
 *   left unflagged. This exactly matches a widely-used reference engine's
 *   own `validateAttrValue` source (`idrefs(vNode, attr).some(node =>
 *   !!node)` — that engine itself only invalidates when every token fails
 *   to resolve). Single-idref attributes (aria-activedescendant,
 *   aria-errormessage) are flagged whenever their one id doesn't resolve,
 *   also matching that engine's `idref` case exactly.
 * - An explicitly-EMPTY idref/idref-list value (e.g.
 *   `aria-describedby=""`) is valid, not a violation — matches that same
 *   reference engine's own standards table, which sets `allowEmpty: true`
 *   on every idref/idref-list ARIA attribute with zero exceptions. A
 *   common, deliberate pattern in templated markup (e.g. React
 *   conditionally rendering `aria-describedby={hasError ? errorId :
 *   ''}`); flagging it is a real false positive (e.g. chase.com's login
 *   form ships `aria-describedby=""` unconditionally on its username/
 *   password inputs).
 */

const id = 'aria-valid-attr-value';

const meta = {
  title: 'aria-* attribute values must match their declared type',
  description:
    'Checks that every recognized aria-* attribute has a value conforming to its WAI-ARIA-declared value type (boolean, tristate, token, integer, number, or ID reference).',
  i18n: {
    titleKey: 'ariaValidAttrValue_title',
    descriptionKey: 'ariaValidAttrValue_description'
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
  coverage: { facetsBySc: { '4.1.2': ['aria-attr-value-valid'] } }
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
    if (!el || !el.attributes || !el.getAttribute) continue;

    let invalid = null;
    const attrs = el.attributes;
    for (let i = 0; i < attrs.length; i++) {
      const name = String(attrs[i].name || '').toLowerCase();
      if (name.slice(0, 5) !== 'aria-') continue;
      if (!ariaHelpers.isValidAriaAttrName(name)) continue; // aria-valid-attr's concern

      applicableCount += 1;

      const rawValue = el.getAttribute(name);
      const result = ariaHelpers.validateAttrValue(name, rawValue);
      if (!result.valid) {
        if (!invalid) invalid = [];
        invalid.push({
          name,
          value: rawValue == null ? '' : String(rawValue),
          reason: result.reason
        });
      }
    }

    if (!invalid || !invalid.length) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : el.outerHTML || '';

    for (const item of invalid) {
      occurrences.push({
        selector: stableSelector,
        html,
        summary: 'This element has an ARIA attribute with an invalid value.',
        hint: 'Use a value that matches the attribute’s expected type (see the WAI-ARIA specification for this attribute).',
        i18n: {
          summaryKey: 'ariaValidAttrValue_summary_fail',
          hintKey: 'ariaValidAttrValue_hint_fail',
          params: { attr: item.name, value: item.value }
        },
        data: {
          details: {
            reasonCode: 'ARIA_ATTR_VALUE_INVALID',
            attr: item.name,
            value: item.value,
            valueReason: item.reason
          }
        }
      });
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'serious',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
