/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check optgroup-label-present
 * @atomic true
 * @summary Every <optgroup> in a <select> must have a label
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to <optgroup> elements inside a <select>. A page with none is
 *   notApplicable.
 * @expectation
 *   The <optgroup> has a label attribute with non-whitespace text (RGAA
 *   11.8.2). Whether that label describes the group is RGAA 11.8.3, a human
 *   judgement this rule does not make.
 * @implementation-notes
 * - Opt-in (tag `rgaa`): WCAG does not require the attribute, so the rule
 *   runs only under the rgaa-4.1.2 profile, the `rgaa` tag or its own id.
 * - An empty label fails with its own reasonCode: RGAA only asks for the
 *   attribute, but an empty one names the group no better than none.
 */

const id = 'optgroup-label-present';

const meta = {
  title: 'Option groups have a label',
  description: 'Checks that every <optgroup> in a <select> has a non-empty label attribute.',
  i18n: {
    titleKey: 'optgroupLabelPresent_title',
    descriptionKey: 'optgroupLabelPresent_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'forms', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'understandable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('select optgroup')
    : helpers.queryAll('select optgroup');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;
    applicableCount += 1;

    const hasLabel = el.hasAttribute('label');
    if (hasLabel && String(el.getAttribute('label')).trim()) continue;

    const reasonCode = hasLabel ? 'emptyLabel' : 'missingLabel';
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: hasLabel
          ? 'This option group has an empty label attribute.'
          : 'This option group has no label attribute.',
        hint: 'Give the <optgroup> a label attribute naming what its options have in common.',
        i18n: {
          summaryKey: hasLabel
            ? 'optgroupLabelPresent_summary_fail_empty'
            : 'optgroupLabelPresent_summary_fail_missing',
          hintKey: 'optgroupLabelPresent_hint_fail',
          params: {}
        },
        data: {
          details: { reasonCode },
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
      severity: rule.defaultSeverity || 'moderate',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
