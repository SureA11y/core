/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check listbox-option-groups-absent
 * @atomic true
 * @summary Options that need grouping must use <select> and <optgroup>, not an ARIA listbox
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to every element other than <select> whose role attribute
 *   makes it a listbox (first token "listbox"). Listboxes hidden by the
 *   default hidden-content policy are not checked. A page with none is
 *   notApplicable.
 * @expectation
 *   The listbox contains no element with role="group". RGAA 11.8's
 *   technical note: « il est impossible de créer des groupes d'options via
 *   l'utilisation de WAI-ARIA. De ce fait, une liste nécessitant un
 *   regroupement d'options structurée à l'aide d'une balise ayant un
 *   attribut WAI-ARIA role="listbox" sera considérée comme non conforme au
 *   critère 11.8 ». A role="group" inside the listbox shows that its
 *   author grouped the options, so the list needs grouping and fails.
 * @implementation-notes
 * - WAI-ARIA allows role="group" inside a listbox, so WCAG has nothing
 *   against it; RGAA judges it non-conforming.
 * - The note names the criterion, not a test. The rule is linked to 11.8.1,
 *   the test on grouping options, and the rollup is per criterion.
 * - A listbox whose options would need grouping but are not grouped at all
 *   cannot be told from one that needs none, and is not reported.
 * - Only the listbox's own descendants are searched; options brought in
 *   with aria-owns or placed in a shadow root are not.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'listbox-option-groups-absent';

const meta = {
  title: 'ARIA listboxes do not group options',
  description:
    'Checks that no element with role="listbox" groups its options with role="group", which RGAA does not accept in place of <select> and <optgroup>.',
  i18n: {
    titleKey: 'listboxOptionGroupsAbsent_title',
    descriptionKey: 'listboxOptionGroupsAbsent_description'
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
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  function firstRole(el) {
    return String(dom.getAttribute(el, 'role') || '')
      .trim()
      .toLowerCase()
      .split(/\s+/)[0];
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('[role]')
    : helpers.queryAll('[role]');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute') || !dom.tagName(el)) continue;
    if (firstRole(el) !== 'listbox') continue;
    if (String(dom.tagName(el)).toLowerCase() === 'select') continue;
    applicableCount += 1;

    const groups = Array.from(dom.querySelectorAll(el, '[role]')).filter(
      (d) => firstRole(d) === 'group'
    );
    if (!groups.length) continue;

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: 'This listbox groups its options with role="group".',
        hint: 'Use a <select> with <optgroup> elements, each with a label, when the options need grouping. ARIA cannot convey option groups.',
        i18n: {
          summaryKey: 'listboxOptionGroupsAbsent_summary_fail',
          hintKey: 'listboxOptionGroupsAbsent_hint_fail',
          params: {}
        },
        data: {
          details: { reasonCode: 'ariaOptionGroups', groupCount: groups.length },
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
