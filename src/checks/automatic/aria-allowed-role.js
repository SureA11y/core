/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check aria-allowed-role
 * @atomic true
 * @summary Explicit role must be permitted by the ARIA-in-HTML spec for its host element
 * @standard Best Practices (no formal WCAG Success Criterion)
 * @applicability
 *   Applies to elements with an explicit, valid, non-abstract role, where
 *   the host element/attribute combination has an asserted permitted-roles
 *   constraint in the ARIA-in-HTML table (src/core/aria-helpers.js
 *   ALLOWED_ROLES_BY_ELEMENT).
 * @expectation
 *   The explicit role is one of the roles the ARIA-in-HTML specification
 *   permits for that host element.
 *   Reported at CANTTELL rather than FAIL: ARIA-in-HTML's permitted-roles
 *   table is an author conformance requirement with no ACT rule and no WCAG
 *   mapping in any source. The role the author asked for is still the role
 *   assistive technology exposes, so whether the combination harms anyone
 *   depends on the widget, not on the table.
 * @implementation-notes
 * - Not WCAG-normative. ARIA-in-HTML's permitted-roles table is an author
 *   conformance requirement of that specification; no ACT rule covers it and
 *   no source maps it to a Success Criterion, so the rule reports the
 *   violation without claiming a criterion is failed. Deterministic all the
 *   same, so it stays `type: 'automatic'` and keeps deciding rather than
 *   deferring to a reviewer -- see docs/RULE_TAXONOMY.md 1.1.
 * - Scoped to elements present in ALLOWED_ROLES_BY_ELEMENT;
 *   elements without an asserted constraint are treated as "no constraint"
 *   (not flagged) rather than guessed at, see that table's header comment.
 * - Not rule-gated on isAccTreeEligible: this remains a static-markup
 *   property, while engine-level hidden-subtree filtering still applies
 *   unless engineOptions.includeHiddenElements is true.
 */

const id = 'aria-allowed-role';

const meta = {
  title: 'Explicit role must be permitted for its host element',
  description:
    'Checks that an explicit role="" attribute is one of the roles the ARIA-in-HTML specification permits for the host element (e.g. role="tab" is not permitted on <nav>).',
  i18n: {
    titleKey: 'ariaAllowedRole_title',
    descriptionKey: 'ariaAllowedRole_description'
  },
  helpUrl: null,
  tags: ['best-practice', 'aria', 'structure', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
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

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;

    const role = ariaHelpers.getExplicitRole(el);
    if (!role || !ariaHelpers.isValidConcreteRole(role)) continue; // aria-roles-valid's concern

    const info = ariaHelpers.isRoleAllowedOnElement(el, role);
    if (!info.constrained) continue; // no asserted constraint for this element

    applicableCount += 1;

    if (info.allowed) continue;

    const tag = (el.tagName || '').toLowerCase();

    occurrences.push(
      helpers.reportOccurrence(el, {
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
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  const resolved = helpers.resolveTieredOutcome(
    [],
    occurrences,
    rule.defaultSeverity || 'moderate'
  );
  return { ruleId: rule.ruleId, ...resolved };
}

module.exports = { id, meta, runInPage };
