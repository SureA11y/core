/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check aria-list-item-roles
 * @atomic true
 * @summary The items of a role="list" must have role="listitem"
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to every element other than <ul> and <ol> whose role attribute
 *   makes it a list (first token "list") and that has at least one child
 *   element other than <script> and <template>. Lists hidden by the
 *   default hidden-content policy are not checked. A page with none is
 *   notApplicable.
 * @expectation
 *   Every child element has role="listitem". RGAA 9.3.1 and 9.3.2 accept a
 *   list built with <ul> or <ol> and <li>, or with role="list" and
 *   role="listitem" (step 2). A role="list" whose items are <li> elements
 *   without role="listitem", or other elements, is neither.
 *   Such a list is asked about (cantTell), never failed: 9.3.1 and 9.3.2
 *   judge information "regroupées visuellement sous forme de liste", and
 *   whether the list reads as ordered (9.3.2) or unordered (9.3.1) is
 *   visual. A list whose children all have role="listitem" passes.
 * @implementation-notes
 * - aria-required-children asks about the same role="list" for WCAG 1.3.1
 *   and no longer carries 9.3.1 and 9.3.2, since most of its findings are
 *   on widgets (tablist, menu, listbox) that the 9.3 technical note says
 *   are not lists.
 * - An <li> outside <ul>, <ol> or <menu> is also a nesting error, which
 *   RGAA judges under 8.2.1; this rule does not report that test.
 * - Only direct children count; a child wrapper with no role around the
 *   items is reported, for a person to judge.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'aria-list-item-roles';

const meta = {
  title: 'ARIA lists use role="listitem" for their items',
  description:
    'Checks that the children of an element with role="list" have role="listitem", which RGAA requires of a list built with ARIA.',
  i18n: {
    titleKey: 'ariaListItemRoles_title',
    descriptionKey: 'ariaListItemRoles_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'structure', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  // The role the attribute resolves to: its first known, non-abstract token,
  // in any case.
  function firstRole(el) {
    return helpers.aria.getExplicitRole(el);
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('[role]')
    : helpers.queryAll('[role]');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute') || !dom.tagName(el)) continue;
    if (firstRole(el) !== 'list') continue;
    const tag = String(dom.tagName(el)).toLowerCase();
    if (tag === 'ul' || tag === 'ol') continue;

    const items = Array.from(dom.querySelectorAll(el, ':scope > *')).filter((c) => {
      const t = String(dom.tagName(c)).toLowerCase();
      return t !== 'script' && t !== 'template';
    });
    if (!items.length) continue;
    applicableCount += 1;

    const others = items.filter((c) => firstRole(c) !== 'listitem');
    if (!others.length) continue;

    const liOnly = others.every(
      (c) => String(dom.tagName(c)).toLowerCase() === 'li' && !dom.hasAttribute(c, 'role')
    );
    const reasonCode = liOnly ? 'liWithoutListitemRole' : 'childWithoutListitemRole';

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: liOnly
          ? 'This role="list" holds <li> elements without role="listitem".'
          : 'This role="list" has children without role="listitem".',
        hint: 'If the content reads as a list, build it with <ul> or <ol> and <li>, or give each item role="listitem".',
        i18n: {
          summaryKey: liOnly
            ? 'ariaListItemRoles_summary_cantTell_li'
            : 'ariaListItemRoles_summary_cantTell_other',
          hintKey: 'ariaListItemRoles_hint_cantTell',
          params: {}
        },
        uncertainty: {
          code: 'judgement-required',
          needed:
            'Whether the content is visually a list (ordered or unordered) whose items need role="listitem".',
          evidence: { itemsWithoutListitemRole: others.length }
        },
        data: {
          details: { reasonCode, itemsWithoutListitemRole: others.length, items: items.length },
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
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'moderate',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
