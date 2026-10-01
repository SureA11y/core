/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check optgroup-label-not-empty
 * @atomic true
 * @summary The label of an <optgroup> in a <select> must not be empty
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to every <optgroup> inside a <select> that has a label
 *   attribute (RGAA 11.8.3 step 1: « les listes de sélection […] qui
 *   possèdent des éléments <optgroup> pourvus d'un attribut label »).
 *   An <optgroup> with no label attribute is left to
 *   optgroup-label-present (11.8.2). Option groups hidden by the default
 *   hidden-content policy are not checked. A page with no applicable
 *   option group is notApplicable.
 * @expectation
 *   The label is not empty and not only whitespace. RGAA 11.8.3 asks
 *   whether the content of the label attribute is relevant, and an empty
 *   one names nothing. That is all this rule decides: whether a non-empty
 *   label is relevant is for a person.
 * @implementation-notes
 * - optgroup-label-present passes an empty label, since 11.8.2 asks only
 *   whether the attribute exists. This rule reports it under 11.8.3.
 * - Whitespace is HTML's ASCII whitespace; a label made only of other
 *   spaces (a no-break space, say) is left to a person.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'optgroup-label-not-empty';

const meta = {
  title: 'Option group labels are not empty',
  description:
    'Checks that the label attribute of every <optgroup> in a <select> that has one is not empty.',
  i18n: {
    titleKey: 'optgroupLabelNotEmpty_title',
    descriptionKey: 'optgroupLabelNotEmpty_description'
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
    ? helpers.queryAllSmart('select optgroup[label]')
    : helpers.queryAll('select optgroup[label]');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;
    applicableCount += 1;
    if (/[^ \t\n\f\r]/.test(String(el.getAttribute('label') || ''))) continue;

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: 'This option group has an empty label attribute.',
        hint: 'Write in the label what the options of the group have in common, for example the region that groups a list of cities.',
        i18n: {
          summaryKey: 'optgroupLabelNotEmpty_summary_fail',
          hintKey: 'optgroupLabelNotEmpty_hint_fail',
          params: {}
        },
        data: {
          details: { reasonCode: 'emptyLabel' },
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
