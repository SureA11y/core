'use strict';

/**
 * @check aria-allowed-role
 * @atomic true
 * @summary Explicit role must be permitted by the ARIA-in-HTML spec for its host element
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to elements with an explicit, valid, non-abstract role, where
 *   the host element/attribute combination has an asserted permitted-roles
 *   constraint in the ARIA-in-HTML table (src/core/aria-helpers.js
 *   ALLOWED_ROLES_BY_ELEMENT).
 * @expectation
 *   The explicit role is one of the roles the ARIA-in-HTML specification
 *   permits for that host element.
 * @implementation-notes
 * - Deliberately scoped to elements present in ALLOWED_ROLES_BY_ELEMENT;
 *   elements without an asserted constraint are treated as "no constraint"
 *   (not flagged) rather than guessed at — see that table's header comment.
 * - Not gated on isAccTreeEligible: this is a static markup property.
 */

const id = 'aria-allowed-role';

const meta = {
  title: 'Explicit role must be permitted for its host element',
  description: 'Checks that an explicit role="" attribute is one of the roles the ARIA-in-HTML specification permits for the host element (e.g. role="tab" is not permitted on <nav>).',
  i18n: {
    titleKey: 'ariaAllowedRole_title',
    descriptionKey: 'ariaAllowedRole_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'aria', 'structure', 'atomic', 'automatic'],
  wcagSc: ['4.1.2'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '4.1.2', title: 'Name, Role, Value', conformanceLevel: 'A' }
  ],
  defaultSeverity: 'moderate',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '4.1.2': ['aria-role-allowed-for-element'] } }
};

function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const ariaHelpers = helpers && helpers.aria ? helpers.aria : null;
  if (!ariaHelpers) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('[role]', safeRoot) : helpers.queryAll('[role]', safeRoot);

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;

    const role = ariaHelpers.getExplicitRole(el);
    if (!role || !ariaHelpers.isValidConcreteRole(role)) continue; // aria-roles-valid's concern

    const info = ariaHelpers.isRoleAllowedOnElement(el, role);
    if (!info.constrained) continue; // no asserted constraint for this element

    applicableCount += 1;

    if (info.allowed) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');
    const tag = (el.tagName || '').toLowerCase();

    occurrences.push({
      selector: stableSelector,
      html,
      summary: 'This role is not permitted on this element.',
      hint: 'Use a role permitted for this element, or change the host element.',
      i18n: {
        summaryKey: 'ariaAllowedRole_summary_fail',
        hintKey: 'ariaAllowedRole_hint_fail',
        params: { role, element: tag }
      },
      data: {
        details: { reasonCode: 'ARIA_ROLE_NOT_ALLOWED_FOR_ELEMENT', role, element: tag }
      }
    });
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'moderate', occurrences };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };