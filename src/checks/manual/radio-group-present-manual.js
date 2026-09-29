/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check radio-group-present
 * @atomic true
 * @summary Radio buttons sharing a name should be grouped
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to sets of two or more <input type="radio"> with the same name
 *   in the same form (or outside any form). A page with none is
 *   notApplicable.
 * @expectation
 *   Every radio button of the set sits in the same <fieldset>, role="group"
 *   or role="radiogroup" element, one of the ways RGAA 11.5.1 accepts. A set
 *   that is not is flagged: 11.5.1 applies "si nécessaire", so a person
 *   decides whether this set needs grouping.
 * @implementation-notes
 * - Manual (cantTell): a lone yes/no pair with a clear label can be fine.
 * - Custom role="radio" widgets are left out; aria-required-parent reports
 *   one with no radiogroup.
 * - One occurrence per set, reported on its first radio button.
 * - Opt-in (tag `rgaa`).
 */

const id = 'radio-group-present';

const meta = {
  title: 'Radio buttons sharing a name are grouped',
  description:
    'Flags a set of radio buttons with the same name that is not inside one fieldset, role="group" or role="radiogroup", for a person to decide whether it needs grouping.',
  i18n: {
    titleKey: 'radioGroupPresent_title',
    descriptionKey: 'radioGroupPresent_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'forms', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'understandable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const GROUP = 'fieldset, [role="group"], [role="radiogroup"]';

  const radios = helpers.queryAllSmart
    ? helpers.queryAllSmart('input[type="radio" i][name]')
    : helpers.queryAll('input[type="radio" i][name]');

  // Sets keyed by form owner and name, in document order.
  const sets = new Map();
  const formKeys = new Map();
  for (const radio of radios) {
    if (!radio || !radio.getAttribute) continue;
    const name = String(radio.getAttribute('name'));
    if (!name) continue;
    const form = radio.form || null;
    if (!formKeys.has(form)) formKeys.set(form, formKeys.size);
    const key = `${formKeys.get(form)}|${name}`;
    if (!sets.has(key)) sets.set(key, []);
    sets.get(key).push(radio);
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const set of sets.values()) {
    if (set.length < 2) continue;
    applicableCount += 1;
    const groups = set.map((r) => (r.parentElement ? r.parentElement.closest(GROUP) : null));
    if (groups[0] && groups.every((g) => g === groups[0])) continue;

    const name = String(set[0].getAttribute('name'));
    occurrences.push(
      helpers.reportOccurrence(set[0], {
        summary: `The ${set.length} radio buttons named "${name}" are not grouped in one fieldset or group.`,
        hint: 'Put the radio buttons in a <fieldset> with a <legend>, or in an element with role="radiogroup" and a name, so the question they answer is announced with them.',
        i18n: {
          summaryKey: 'radioGroupPresent_summary_cantTell',
          hintKey: 'radioGroupPresent_hint_cantTell',
          params: { count: String(set.length), name }
        },
        data: {
          details: { reasonCode: 'radiosNotGrouped', name, count: set.length },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (applicableCount === 0 || !occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'moderate',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
