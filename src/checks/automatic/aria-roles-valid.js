'use strict';

/**
 * @check a11ycore-aria-roles-valid
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

const id = 'a11ycore-aria-roles-valid';

const meta = {
  title: 'role attribute must be a valid, non-abstract ARIA role',
  description: 'Checks that an explicit role="" attribute resolves to a real, non-abstract WAI-ARIA role.',
  i18n: {
    titleKey: 'a11ycore_ariaRolesValid_title',
    descriptionKey: 'a11ycore_ariaRolesValid_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'aria', 'structure', 'atomic', 'automatic'],
  wcagSc: ['4.1.2'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '4.1.2', title: 'Name, Role, Value', conformanceLevel: 'A' }
  ],
  defaultSeverity: 'serious',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '4.1.2': ['aria-role-valid'] } }
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
    if (!role) continue; // role="" or whitespace-only: not this rule's concern

    applicableCount += 1;

    const isAbstract = ariaHelpers.isAbstractRole(role);
    const isKnown = ariaHelpers.isKnownRole(role);

    if (isKnown && !isAbstract) continue;

    const reasonCode = !isKnown ? 'ARIA_ROLE_INVALID' : 'ARIA_ROLE_ABSTRACT';
    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    occurrences.push({
      selector: stableSelector,
      html,
      summary: !isKnown
        ? 'The role attribute value is not a recognized ARIA role.'
        : 'The role attribute value is an abstract ARIA role, which must not be used directly.',
      hint: !isKnown
        ? 'Use a valid ARIA role token, or remove the role attribute if none applies.'
        : 'Replace this abstract role with a concrete role appropriate for the widget/structure.',
      i18n: {
        summaryKey: !isKnown
          ? 'a11ycore_ariaRolesValid_summary_invalid'
          : 'a11ycore_ariaRolesValid_summary_abstract',
        hintKey: !isKnown
          ? 'a11ycore_ariaRolesValid_hint_invalid'
          : 'a11ycore_ariaRolesValid_hint_abstract',
        params: { role }
      },
      data: {
        details: { reasonCode, role }
      }
    });
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'serious', occurrences };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
