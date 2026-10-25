/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check aria-conditional-attr
 * @atomic true
 * @summary aria-errormessage is only exposed when aria-invalid is not false/absent
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Elements with a non-empty `aria-errormessage` attribute.
 * @expectation
 *   Per the ARIA specification, `aria-errormessage` is only exposed to
 *   assistive technology when `aria-invalid` is present with a value
 *   other than `"false"` (i.e. `"true"`, `"grammar"`, or `"spelling"`).
 *   An element with `aria-errormessage` but `aria-invalid` absent or
 *   `"false"` silently drops the error message from the accessibility
 *   tree, authors almost always intend it to be exposed.
 *   Reported at CANTTELL rather than FAIL: aria-errormessage is only
 *   exposed once aria-invalid is set, so the reference is currently inert.
 *   Whether that costs the user anything depends on whether the message is
 *   conveyed some other way (visible text next to the field, aria-describedby),
 *   which static markup does not settle.
 * @reports
 *   - `ariaInvalid`: the element's `aria-invalid` value, lowercased; an
 *     empty string when the attribute is absent.
 * @reason-codes
 *   - `ARIA_ERRORMESSAGE_WITHOUT_TRUTHY_INVALID` (cantTell): an element with
 *     aria-errormessage whose aria-invalid is absent or false, so the error
 *     message is not exposed.
 *     Basis: WAI-ARIA 1.2 aria-errormessage; WCAG 4.1.2 (not settled).
 * @implementation-notes
 * - This is narrow: the broader space is a table of many
 *   attribute/condition pairs. This rule implements only the one pairing
 *   (`aria-errormessage` / `aria-invalid`) that is unambiguous and
 *   explicitly stated in the ARIA spec, to keep `fail` high-confidence,
 *   matches this repo's established pattern (see `aria-required-attr`/
 *   `aria-prohibited-attr` for the same "narrow but zero false positives"
 *   trade-off).
 * - Does not check whether the `aria-errormessage` ID reference itself
 *   resolves to an existing element. That's `aria-valid-attr-value`'s
 *   concern, not this rule's.
 */

const id = 'aria-conditional-attr';

const meta = {
  title: 'aria-errormessage requires aria-invalid to be set to a non-false value',
  description:
    'Checks that elements with aria-errormessage also have aria-invalid set to "true", "grammar", or "spelling"; otherwise the error message is dropped from the accessibility tree.',
  i18n: {
    titleKey: 'ariaConditionalAttr_title',
    descriptionKey: 'ariaConditionalAttr_description'
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
  defaultSeverity: 'moderate',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '4.1.2': ['aria-conditional-attr'] } },
  // How a person checks each undecided finding: shown with it as
  // howToCheck (docs/OUTPUT_SCHEMA.md).
  review: {
    ARIA_ERRORMESSAGE_WITHOUT_TRUTHY_INVALID: {
      steps: [
        'Inspect the field the report names and note the id in its aria-errormessage.',
        'Enter an invalid value (or leave a required field empty) and submit or leave the field, so any error appears.',
        'Look whether the element with that id now shows error text, and inspect the field again for aria-invalid="true".',
        'With a screen reader, move back to the field and listen for the error message.'
      ],
      passWhen:
        'When the error is shown, the field gets aria-invalid="true" (or the message is in aria-describedby) and the screen reader announces it; when no error is shown, nothing needs exposing.',
      failWhen:
        'Error text is visible but aria-invalid stays absent or false and the message is not announced, which fails WCAG 3.3.1 / 4.1.2 (see ARIA21).'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  function trim(v) {
    return (v == null ? '' : String(v)).trim();
  }

  const TRUTHY_INVALID_VALUES = new Set(['true', 'grammar', 'spelling']);

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('[aria-errormessage]')
    : helpers.queryAll('[aria-errormessage]');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;

    const errorMessageRef = trim(dom.getAttribute(el, 'aria-errormessage'));
    if (!errorMessageRef) continue;

    applicableCount += 1;

    const invalidValue = trim(dom.getAttribute(el, 'aria-invalid')).toLowerCase();
    if (TRUTHY_INVALID_VALUES.has(invalidValue)) continue;

    const tag = (dom.tagName(el) || '').toLowerCase();

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary:
          'This element has aria-errormessage but aria-invalid is missing or "false", so the error message is not exposed.',
        hint: 'Set aria-invalid to "true" (or "grammar"/"spelling") whenever aria-errormessage should be exposed to assistive technology.',
        i18n: {
          summaryKey: 'ariaConditionalAttr_summary_fail',
          hintKey: 'ariaConditionalAttr_hint_fail',
          params: { element: tag, ariaInvalid: invalidValue || '(absent)' }
        },
        uncertainty: {
          code: 'spec-only',
          needed: 'Whether the field is ever in an invalid state that should expose this message.',
          evidence: { element: tag, ariaInvalid: invalidValue || null }
        },
        data: {
          details: {
            reasonCode: 'ARIA_ERRORMESSAGE_WITHOUT_TRUTHY_INVALID',
            ariaInvalid: invalidValue
          }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  const resolved = helpers.resolveTieredOutcome(
    [],
    occurrences,
    rule.defaultSeverity || 'moderate'
  );
  return { ruleId: rule.ruleId, ...resolved };
}

module.exports = { id, meta, runInPage };
