/* SPDX-License-Identifier: MPL-2.0 */

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
 *   from a fixed enumerated set, an integer, a real number, or an ID
 *   reference (list) that resolves to an existing element in the document.
 *   Per ACT 6a7281's own applicability ("any state or property that is
 *   NOT empty"), an explicitly empty value, including a bare boolean-style
 *   attribute with no "=value" at all, e.g. `aria-checked` alone, is out
 *   of scope for every value type, not a violation: a common, deliberate
 *   pattern in templated markup (e.g. React conditionally rendering
 *   `aria-describedby={hasError ? errorId : ''}`).
 * @implementation-notes
 * - Not rule-gated on isAccTreeEligible: this remains a static-markup
 *   property, while engine-level hidden-subtree filtering still applies
 *   unless engineOptions.includeHiddenElements is true.
 * - ID-reference resolution (see aria-helpers.js's idExists) only flags
 *   idref-list attributes (aria-labelledby, aria-describedby,
 *   aria-controls, aria-owns, etc.) when NONE of the space-separated ids
 *   resolve, a partially-dangling list (some ids exist, some don't) is
 *   left unflagged (only invalidate when every token fails to resolve).
 *   Of the two single-idref attributes, aria-activedescendant is flagged
 *   whenever its one id doesn't resolve; aria-errormessage's existence is
 *   never checked (format only), ACT 6a7281's own Background
 *   text names it as a non-required property whose target "may be created
 *   in response to an event that may or may not happen" (a validation
 *   error message rendered only once the error actually occurs).
 * - aria-controls is never a fail on a target that doesn't resolve, and
 *   this is the one place the rule reports two tiers. The controlled
 *   element is routinely built when the widget opens, so a static scan
 *   that cannot find it has not found a defect; it has found markup it
 *   cannot decide. A collapsed widget (aria-expanded="false" or
 *   aria-selected="false") passes outright, since the absence is exactly
 *   what that state means; anything else is a `cantTell` for human
 *   review. Every other idref/idref-list attribute keeps its fail: a
 *   dangling aria-labelledby or aria-owns names content that was supposed
 *   to be there already.
 * - Two tiers in one run means helpers.resolveTieredOutcome decides the
 *   aggregate: a real fail elsewhere on the page still reports fail, and
 *   the aria-controls occurrences ride along rather than being dropped.
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

  const failOccurrences = [];
  const cantTellOccurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.attributes || !el.getAttribute) continue;

    let invalid = null;
    let review = null;
    const attrs = el.attributes;
    for (let i = 0; i < attrs.length; i++) {
      const name = String(attrs[i].name || '').toLowerCase();
      if (name.slice(0, 5) !== 'aria-') continue;
      if (!ariaHelpers.isValidAriaAttrName(name)) continue; // aria-valid-attr's concern

      applicableCount += 1;

      const rawValue = el.getAttribute(name);
      const result = ariaHelpers.validateAttrValue(name, rawValue, el);
      if (result.valid) continue;

      const item = {
        name,
        value: rawValue == null ? '' : String(rawValue),
        reason: result.reason
      };

      if (result.review) {
        if (!review) review = [];
        review.push(item);
      } else {
        if (!invalid) invalid = [];
        invalid.push(item);
      }
    }

    for (const item of invalid || []) {
      failOccurrences.push(
        helpers.reportOccurrence(el, {
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
        })
      );
    }

    for (const item of review || []) {
      cantTellOccurrences.push(
        helpers.reportOccurrence(el, {
          summary:
            'No element with this id exists right now, so the engine cannot tell whether this reference is wrong.',
          hint: 'Confirm the controlled element is created when the widget opens; if it never exists, remove or correct the reference.',
          i18n: {
            summaryKey: 'ariaValidAttrValue_summary_cantTell_idref',
            hintKey: 'ariaValidAttrValue_hint_cantTell_idref',
            params: { attr: item.name, value: item.value }
          },
          data: {
            details: {
              reasonCode: 'ARIA_ATTR_VALUE_TARGET_ABSENT',
              attr: item.name,
              value: item.value,
              valueReason: item.reason
            }
          }
        })
      );
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  // See helpers.resolveTieredOutcome's own header comment
  // (src/core/dom-helpers.js): a fail-tier finding never silently discards
  // cantTell-tier findings from the same run.
  const resolved = helpers.resolveTieredOutcome(
    failOccurrences,
    cantTellOccurrences,
    rule.defaultSeverity || 'serious'
  );
  return { ruleId: rule.ruleId, ...resolved };
}

module.exports = { id, meta, runInPage };
