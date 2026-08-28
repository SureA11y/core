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
 *   At least one role token names a concrete, non-abstract ARIA role.
 *   Graded by what the element falls back to when none does:
 *   - FAIL on a roleless host (div, span, custom element), which is left
 *     exposed as generic, so the role the author meant reaches no one.
 *   - CANTTELL where the element has a native role (a <button>, <nav>,
 *     <a href>), which the accessibility tree keeps using. ACT 674b10 lists
 *     4.1.2 as a secondary requirement only, "satisfied through the implicit
 *     role," so the bad token is worth reporting but is not itself the
 *     criterion failing.
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

  const failOccurrences = [];
  const cantTellOccurrences = [];
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

    // An unusable role token leaves the element on its native role, when it
    // has one: ACT 674b10 lists 4.1.2 as only a secondary requirement for
    // exactly that reason. A roleless host (div, span, custom element) has
    // nothing to fall back to and is exposed as generic instead.
    const nativeRole =
      typeof ariaHelpers.getNativeRoleForElement === 'function'
        ? ariaHelpers.getNativeRoleForElement(el) || ''
        : '';

    if (nativeRole) {
      cantTellOccurrences.push(
        helpers.reportOccurrence(el, {
          occurrenceOutcome: 'cantTell',
          summary: `The role attribute value is not usable, so this element is still exposed as its native role="${nativeRole}".`,
          hint: 'Fix or remove the role token; assistive technology is using the native role in the meantime.',
          i18n: {
            summaryKey: 'ariaRolesValid_summary_cantTell',
            hintKey: 'ariaRolesValid_hint_cantTell',
            params: { role, nativeRole }
          },
          data: {
            details: { reasonCode, role, nativeRole }
          }
        })
      );
      continue;
    }

    failOccurrences.push(
      helpers.reportOccurrence(el, {
        occurrenceOutcome: 'fail',
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
  const resolved = helpers.resolveTieredOutcome(
    failOccurrences,
    cantTellOccurrences,
    rule.defaultSeverity || 'serious'
  );
  return { ruleId: rule.ruleId, ...resolved };
}

module.exports = { id, meta, runInPage };
