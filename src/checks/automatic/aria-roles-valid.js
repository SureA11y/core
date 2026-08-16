/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check aria-roles-valid
 * @atomic true
 * @summary An explicit role attribute must resolve to a real, non-abstract ARIA role
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to any element with a non-empty role="" attribute in the composed DOM.
 * @expectation
 *   The role attribute's first token (the role actually used by assistive technology;
 *   later space-separated tokens are author-supplied fallbacks and are not evaluated
 *   here) must be a real WAI-ARIA role name, and must not be an abstract role
 *   (abstract roles exist only for the specification's own role taxonomy and must
 *   never be used directly in markup).
 * @implementation-notes
 * - Unlike this engine's accessible-name rules, ARIA validity is a static markup
 *   property independent of current visibility/eligibility, so this rule does not
 *   gate on isAccTreeEligible: an invalid role is a defect whether or not the
 *   element happens to be hidden right now.
 */

const id = 'aria-roles-valid';

const meta = {
  title: 'role attribute must be a valid, non-abstract ARIA role',
  description:
    'Checks that an explicit role="" attribute resolves to a real, non-abstract WAI-ARIA role.',
  i18n: {
    titleKey: 'ariaRolesValid_title',
    descriptionKey: 'ariaRolesValid_description'
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
  coverage: { facetsBySc: { '4.1.2': ['aria-role-valid'] } }
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const ariaHelpers = helpers && helpers.aria ? helpers.aria : null;
  if (!ariaHelpers) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('[role]')
    : helpers.queryAll('[role]');

  const occurrences = [];
  let applicableCount = 0;

  // Programmatically hidden per the ACT glossary: display:none, visibility not
  // visible, or aria-hidden on the element or an ancestor. inert is treated
  // the same although the glossary predates it -- an inert subtree is out of
  // the accessibility tree entirely, so a role on it reaches no one.
  function isHidden(el) {
    try {
      if (typeof helpers.isDomVisibleEligible === 'function') {
        if (!helpers.isDomVisibleEligible(el, ctx)) return true;
      }
      // Walk the composed tree, not parentElement: that stops at a shadow
      // root, so a host carrying aria-hidden or inert would never be seen
      // from inside its own shadow content.
      const up =
        typeof helpers.composedParent === 'function'
          ? helpers.composedParent
          : (n) => n.parentElement;

      // A shadow root has no getAttribute, so skip past it rather than
      // stopping: the host one step further up is the node that matters.
      for (let n = el; n; n = up(n)) {
        if (!n.getAttribute) continue;
        if (String(n.getAttribute('aria-hidden') || '').toLowerCase() === 'true') return true;
        if (n.hasAttribute && n.hasAttribute('inert')) return true;
      }
    } catch {
      return false;
    }
    return false;
  }

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;

    // ACT 674b10 is not applicable to a programmatically hidden element.
    if (isHidden(el)) continue;

    // role takes a fallback list and the first token the browser recognises
    // wins, so role="searchfield searchbox" resolves to searchbox. The rule
    // fails only when no token names a concrete role.
    const tokens =
      typeof ariaHelpers.getAllRoleTokens === 'function'
        ? ariaHelpers.getAllRoleTokens(el)
        : [ariaHelpers.getExplicitRole(el)].filter(Boolean);
    if (!tokens.length) continue; // role="" or whitespace-only: not this rule's concern

    applicableCount += 1;

    const usable = tokens.find((t) => ariaHelpers.isKnownRole(t) && !ariaHelpers.isAbstractRole(t));
    if (usable) continue;

    const role = tokens[0];
    const isKnown = tokens.some((t) => ariaHelpers.isKnownRole(t));
    const reasonCode = !isKnown ? 'ARIA_ROLE_INVALID' : 'ARIA_ROLE_ABSTRACT';

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: !isKnown
          ? 'The role attribute value is not a recognized ARIA role.'
          : 'The role attribute value is an abstract ARIA role, which must not be used directly.',
        hint: !isKnown
          ? 'Use a valid ARIA role token, or remove the role attribute if none applies.'
          : 'Replace this abstract role with a concrete role appropriate for the widget/structure.',
        i18n: {
          summaryKey: !isKnown
            ? 'ariaRolesValid_summary_invalid'
            : 'ariaRolesValid_summary_abstract',
          hintKey: !isKnown ? 'ariaRolesValid_hint_invalid' : 'ariaRolesValid_hint_abstract',
          params: { role }
        },
        data: {
          details: { reasonCode, role }
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
