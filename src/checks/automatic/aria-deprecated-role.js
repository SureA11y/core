/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check aria-deprecated-role
 * @atomic true
 * @summary An explicit role attribute should not use a deprecated or author-discouraged ARIA role
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to any element whose role attribute's first (used) token is a
 *   valid, non-abstract ARIA role that authors should not explicitly
 *   declare, either because WAI-ARIA has deprecated it (e.g. "directory",
 *   superseded by role="list") or because it is reserved for user-agent-
 *   internal use (role="generic", which ARIA 1.2 §5.4 says authors SHOULD
 *   NOT use in content).
 * @expectation
 *   The role in use is neither deprecated nor reserved. Graded by the
 *   strength of the rule ARIA states:
 *   - CANTTELL at SHOULD NOT, which leaves the usage conforming, so the
 *     author decides whether it matters: a deprecated role ("directory") or
 *     one reserved for user agents ("generic").
 *   - FAIL at MUST NOT. No ARIA 1.2 or 1.3 role carries an author MUST NOT
 *     outside the abstract roles, so this outcome is reserved for a later
 *     revision promoting a role to that strength.
 *   Distinct, atomic decision from aria-roles-valid (existence/
 *   abstractness): a role can be valid and non-abstract while still being
 *   discouraged in explicit author use.
 */

const id = 'aria-deprecated-role';

const meta = {
  title: 'role attribute should not use a deprecated or author-discouraged ARIA role',
  description:
    'Checks that an explicit role="" attribute does not use a role deprecated by the WAI-ARIA specification, or one reserved for user-agent-internal use (e.g. role="generic").',
  i18n: {
    titleKey: 'ariaDeprecatedRole_title',
    descriptionKey: 'ariaDeprecatedRole_description'
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
  defaultSeverity: 'moderate',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '4.1.2': ['aria-role-not-deprecated'] } }
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

  // A role on an element hidden from assistive technology has no effect, so
  // ACT 674b10 does not apply to it.
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

    if (isHidden(el)) continue;

    const role = ariaHelpers.getExplicitRole(el);
    if (!role) continue;

    // Only applicable to roles that are otherwise valid + concrete;
    // invalid/abstract usage is aria-roles-valid's concern.
    if (!ariaHelpers.isValidConcreteRole(role)) continue;

    applicableCount += 1;

    const deprecated = ariaHelpers.isDeprecatedRole(role);
    const discouraged =
      typeof ariaHelpers.isAuthorDiscouragedRole === 'function' &&
      ariaHelpers.isAuthorDiscouragedRole(role);
    const prohibited =
      typeof ariaHelpers.isAuthorProhibitedRole === 'function' &&
      ariaHelpers.isAuthorProhibitedRole(role);
    if (!deprecated && !discouraged && !prohibited) continue;

    const guidance = ariaHelpers.getDeprecatedRoleGuidance
      ? ariaHelpers.getDeprecatedRoleGuidance(role)
      : {
          key: 'ariaDeprecatedRole_guidance_default',
          text: 'Replace the deprecated role with its recommended replacement.'
        };

    if (prohibited) {
      // Author MUST NOT: the usage is non-conforming, not merely discouraged.
      failOccurrences.push(
        helpers.reportOccurrence(el, {
          summary: `This element uses role="${role}", which authors must not explicitly declare.`,
          hint: guidance.text,
          occurrenceOutcome: 'fail',
          i18n: {
            summaryKey: 'ariaDeprecatedRole_summary_fail',
            hintKey: guidance.key,
            params: { role }
          },
          data: {
            details: { reasonCode: 'ARIA_ROLE_AUTHOR_PROHIBITED', role, guidance: guidance.text }
          }
        })
      );
    } else if (discouraged) {
      // Reserved for user-agent-internal use, at SHOULD NOT strength.
      cantTellOccurrences.push(
        helpers.reportOccurrence(el, {
          summary: `This element uses role="${role}", which is reserved for user agents (still valid, but discouraged).`,
          hint: guidance.text,
          occurrenceOutcome: 'cantTell',
          i18n: {
            summaryKey: 'ariaDeprecatedRole_summary_cantTell_discouraged',
            hintKey: guidance.key,
            params: { role }
          },
          data: {
            details: { reasonCode: 'ARIA_ROLE_AUTHOR_DISCOURAGED', role, guidance: guidance.text }
          }
        })
      );
    } else {
      // Deprecated but still valid: surfaced for the author to decide.
      cantTellOccurrences.push(
        helpers.reportOccurrence(el, {
          summary: `This element uses role="${role}", which is deprecated in WAI-ARIA.`,
          hint: guidance.text,
          occurrenceOutcome: 'cantTell',
          i18n: {
            summaryKey: 'ariaDeprecatedRole_summary_cantTell',
            hintKey: guidance.key,
            params: { role }
          },
          data: {
            details: { reasonCode: 'ARIA_ROLE_DEPRECATED', role, guidance: guidance.text }
          }
        })
      );
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const resolved = helpers.resolveTieredOutcome(
    failOccurrences,
    cantTellOccurrences,
    rule.defaultSeverity || 'moderate'
  );
  return { ruleId: rule.ruleId, ...resolved };
}

module.exports = { id, meta, runInPage };
