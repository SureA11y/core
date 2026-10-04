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
 *   notApplicable. When every set is grouped, the rule passes; under a
 *   scoped scan it reports notApplicable instead, since a set can reach
 *   past the scanned part of the page (ENGINE_OPTIONS.md, "What a scoped
 *   result means").
 * @expectation
 *   Every radio button of the set sits in one <fieldset>, role="group" or
 *   role="radiogroup" element, one of the ways RGAA 11.5.1 accepts. That
 *   element need not be the closest group around each radio: an outer
 *   fieldset holding every radio of the set groups them even when inner
 *   groups split them. A set that is not is flagged: 11.5.1 applies "si
 *   nécessaire", so a person decides whether this set needs grouping.
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

  // True when some grouping ancestor of the first radio contains every radio
  // of the set.
  function hasCommonGroup(set) {
    const parentGroup = (el) => (el.parentElement ? el.parentElement.closest(GROUP) : null);
    for (let g = parentGroup(set[0]); g; g = parentGroup(g)) {
      if (set.every((r) => g.contains(r))) return true;
    }
    return false;
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const set of sets.values()) {
    if (set.length < 2) continue;
    applicableCount += 1;
    if (hasCommonGroup(set)) continue;

    const name = String(set[0].getAttribute('name'));
    occurrences.push(
      helpers.reportOccurrence(set[0], {
        summary: `The ${set.length} radio buttons named "${name}" are not grouped in one fieldset or group.`,
        hint: 'If the buttons answer a question their own labels don\'t state, put them in a <fieldset> with a <legend>, or in an element with role="radiogroup" and a name, so the question is announced with them. A set whose labels already say what they answer, such as a lone yes/no pair, may need no group (RGAA 11.5.1).',
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

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (!occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: helpers.isWholeDocumentScope() ? 'pass' : 'notApplicable',
      severity: 'minor',
      occurrences: []
    };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'moderate',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
