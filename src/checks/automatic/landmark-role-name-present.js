/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check landmark-role-name-present
 * @atomic true
 * @summary An element given the region or form role must have an accessible name
 * @standard Best Practices (no formal WCAG Success Criterion)
 * @applicability
 *   Applies to elements whose role attribute resolves to region or form
 *   (its first known, non-abstract token, in any case: role="foo region"
 *   counts, role="search region" is a search landmark), and that are
 *   included in the accessibility tree.
 * @expectation
 *   The element has a non-empty accessible name from aria-labelledby,
 *   aria-label or title. WAI-ARIA requires one ("Authors MUST give each
 *   element with role region a brief label", and the same for form), and
 *   without one the element is not exposed as a landmark at all, so the
 *   role the author asked for is lost.
 *   Reported at CANTTELL rather than FAIL: the requirement is WAI-ARIA's,
 *   not a WCAG Success Criterion's. Nothing false reaches assistive
 *   technology, which gets a plain container, so whether losing the
 *   landmark harms anyone depends on the page.
 * @reports
 *   - `role`: the role that needs a name, `region` or `form`.
 * @implementation-notes
 * - Explicit roles only. An unnamed <section> or <form> is simply not a
 *   landmark, which is what HTML intends; only a role attribute asks for
 *   one. Siteimprove Alfa's SIA-R40 and IBM's aria_region_labelled report
 *   the region case the same way; neither checks form, which WAI-ARIA
 *   words identically.
 * - Deterministic, so `type: 'automatic'`, like aria-allowed-role, which
 *   also reports an author requirement that names no criterion; see
 *   docs/RULE_TAXONOMY.md 1.1.
 * - landmark-unique and the other landmark rules do not count these
 *   elements as landmarks (helpers.getLandmarkRole); this rule is where the
 *   missing name is reported.
 */

const id = 'landmark-role-name-present';

const meta = {
  title: 'Region and form roles must have an accessible name',
  description:
    'Checks that an element given role="region" or role="form" has an accessible name, without which it is not exposed as a landmark.',
  i18n: {
    titleKey: 'landmarkRoleNamePresent_title',
    descriptionKey: 'landmarkRoleNamePresent_description'
  },
  helpUrl: null,
  tags: ['best-practice', 'aria', 'landmarks', 'name', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const NAME_REQUIRED_LANDMARK_ROLES = new Set(['region', 'form']);

  const occurrences = [];
  let applicableCount = 0;

  for (const el of helpers.queryAllSmart('[role]')) {
    // The role the attribute resolves to: its first known, non-abstract
    // token, in any case (role="foo REGION" is a region).
    const role = helpers.aria.getExplicitRole(el);
    if (!NAME_REQUIRED_LANDMARK_ROLES.has(role)) continue;

    if (!helpers.isIncludedInAccessibilityTree(el, ctx)) continue;

    applicableCount += 1;
    if (helpers.getLandmarkNameInfo(el, ctx).present) continue;

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: `This element has role="${role}" but no accessible name, so it is not exposed as a landmark.`,
        hint: `Name it with aria-labelledby pointing at its visible heading, or aria-label; or remove role="${role}" if it is not meant to be a landmark.`,
        i18n: {
          summaryKey: 'landmarkRoleNamePresent_summary_cantTell',
          hintKey: 'landmarkRoleNamePresent_hint_cantTell',
          params: { role }
        },
        uncertainty: {
          code: 'spec-only',
          needed: 'Whether losing the landmark matters to people navigating this page by landmark.',
          evidence: { role, source: 'WAI-ARIA 1.2, roles region and form', wcagSc: [] }
        },
        data: {
          details: { reasonCode: 'LANDMARK_ROLE_NAME_MISSING', role }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  const resolved = helpers.resolveTieredOutcome([], occurrences, rule.defaultSeverity || 'minor');
  return { ruleId: rule.ruleId, ...resolved };
}

module.exports = { id, meta, runInPage };
