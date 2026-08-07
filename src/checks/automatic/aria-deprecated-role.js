'use strict';

/**
 * @check aria-deprecated-role
 * @atomic true
 * @summary An explicit role attribute must not use a deprecated or author-prohibited ARIA role
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to any element whose role attribute's first (used) token is a
 *   valid, non-abstract ARIA role that authors must never explicitly
 *   declare — either because WAI-ARIA has deprecated it (e.g. "directory",
 *   superseded by role="list") or because it's reserved for user-agent-
 *   internal use only, not a spec deprecation but the same "valid token,
 *   prohibited for authors" shape (role="generic" — per WAI-ARIA 1.2 and
 *   MDN's "It should not be used by web authors" guidance).
 * @expectation
 *   The role in use is neither deprecated nor author-prohibited. This is a
 *   distinct, atomic decision from aria-roles-valid (existence/
 *   abstractness): a role can be perfectly valid and non-abstract while
 *   still being off-limits for explicit author use.
 */

const id = 'aria-deprecated-role';

const meta = {
  title: 'role attribute must not use a deprecated or author-prohibited ARIA role',
  description:
    'Checks that an explicit role="" attribute does not use a role deprecated by the WAI-ARIA specification, or one reserved for user-agent-internal use only (e.g. role="generic").',
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

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;

    const role = ariaHelpers.getExplicitRole(el);
    if (!role) continue;

    // Only applicable to roles that are otherwise valid + concrete;
    // invalid/abstract usage is aria-roles-valid's concern.
    if (!ariaHelpers.isValidConcreteRole(role)) continue;

    applicableCount += 1;

    if (!ariaHelpers.isDeprecatedRole(role)) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : el.outerHTML || '';
    const guidance = ariaHelpers.getDeprecatedRoleGuidance
      ? ariaHelpers.getDeprecatedRoleGuidance(role)
      : 'Replace the deprecated role with its recommended replacement.';

    occurrences.push({
      selector: stableSelector,
      html,
      summary: `This element uses role="${role}", which authors must not explicitly declare.`,
      hint: guidance,
      i18n: {
        summaryKey: 'ariaDeprecatedRole_summary_fail',
        hintKey: 'ariaDeprecatedRole_hint_fail',
        params: { role, guidance }
      },
      data: {
        details: { reasonCode: 'ARIA_ROLE_DEPRECATED', role, guidance }
      }
    });
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
