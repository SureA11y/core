/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check dir-attribute-valid
 * @atomic true
 * @summary A dir attribute must be ltr or rtl
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to elements carrying a dir attribute. A page with none is
 *   notApplicable.
 * @expectation
 *   The value is ltr or rtl, case and surrounding spaces ignored (RGAA
 *   8.10.2: « La valeur de l'attribut dir est conforme (rtl ou ltr) »).
 *   dir="auto", which HTML allows, fails with its own reasonCode, since RGAA
 *   names only those two values. Whether the direction is the right one is
 *   the relevance condition of the same test, left to a person.
 * @implementation-notes
 * - Opt-in (tag `rgaa`): WCAG does not restrict the dir values, so the rule
 *   runs only under the rgaa-4.1.2 profile, the `rgaa` tag or its own id.
 */

const id = 'dir-attribute-valid';

const meta = {
  title: 'dir attributes are ltr or rtl',
  description: 'Checks that every dir attribute is ltr or rtl, the two values RGAA accepts.',
  i18n: {
    titleKey: 'dirAttributeValid_title',
    descriptionKey: 'dirAttributeValid_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'language', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'understandable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('[dir]') : helpers.queryAll('[dir]');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;
    applicableCount += 1;
    const raw = String(el.getAttribute('dir'));
    const value = raw.trim().toLowerCase();
    if (value === 'ltr' || value === 'rtl') continue;

    const isAuto = value === 'auto';
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: isAuto
          ? 'This element uses dir="auto"; RGAA accepts only ltr or rtl.'
          : `This element has dir="${raw}", which is neither ltr nor rtl.`,
        hint: 'Set dir to ltr (left to right) or rtl (right to left), whichever the text reads in.',
        i18n: {
          summaryKey: isAuto
            ? 'dirAttributeValid_summary_fail_auto'
            : 'dirAttributeValid_summary_fail_invalid',
          hintKey: 'dirAttributeValid_hint_fail',
          params: { value: raw }
        },
        data: {
          details: { reasonCode: isAuto ? 'autoDir' : 'invalidDir', value: raw },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
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
      severity: rule.defaultSeverity || 'minor',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
