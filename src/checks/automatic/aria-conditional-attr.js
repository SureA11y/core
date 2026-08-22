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
  defaultSeverity: 'serious',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '4.1.2': ['aria-conditional-attr'] } }
};

function runInPage(ctx) {
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
    if (!el || !el.getAttribute) continue;

    const errorMessageRef = trim(el.getAttribute('aria-errormessage'));
    if (!errorMessageRef) continue;

    applicableCount += 1;

    const invalidValue = trim(el.getAttribute('aria-invalid')).toLowerCase();
    if (TRUTHY_INVALID_VALUES.has(invalidValue)) continue;

    const tag = (el.tagName || '').toLowerCase();

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
