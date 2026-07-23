'use strict';

/**
 * @check a11ycore-aria-required-attr
 * @atomic true
 * @summary Roles with an unambiguous required state/property must carry it
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to elements with an explicit, valid, non-abstract role that is
 *   also one of the small set of roles with a documented, context-
 *   independent required state/property (checkbox, combobox, heading,
 *   menuitemcheckbox, menuitemradio, meter, radio, scrollbar, slider,
 *   switch).
 * @expectation
 *   Every required aria-* attribute for that role is present (and non-empty).
 * @implementation-notes
 * - Deliberately scoped to REQUIRED_PROPS_BY_ROLE in src/core/aria-helpers.js,
 *   which only lists a required property when the spec is unambiguous and
 *   context-independent — see that file's header for the rationale.
 * - Widened 2026-07-21 to add `meter` (`aria-valuenow`), verified against
 *   the reference engine 4.12.1's own `requiredAttrs` table. Deliberately did NOT add
 *   two other entries from that same the reference engine table: `progressbar`'s
 *   `aria-valuenow` (a legitimately indeterminate progressbar omits it —
 *   the reference engine itself excludes progressbar from its own table for this reason)
 *   and `combobox`'s `aria-controls` (confirmed via MDN's combobox role
 *   page to be conditional — only required once the popup is actually
 *   displayed, not unconditionally). See src/core/aria-helpers.js's
 *   REQUIRED_PROPS_BY_ROLE comment for the full reasoning.
 * - Not gated on isAccTreeEligible: this is a static markup property.
 */

const id = 'a11ycore-aria-required-attr';

const meta = {
  title: 'Roles with a required ARIA state/property must carry it',
  description: 'Checks that elements with an explicit role carry every unambiguous, context-independent required aria-* state/property for that role (e.g. role="checkbox" must have aria-checked).',
  i18n: {
    titleKey: 'a11ycore_ariaRequiredAttr_title',
    descriptionKey: 'a11ycore_ariaRequiredAttr_description'
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
  coverage: { facetsBySc: { '4.1.2': ['aria-attr-required-for-role'] } }
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

    const required = ariaHelpers.getRequiredAttrsForRole(role);
    if (!required.length) continue;

    applicableCount += 1;

    const missing = [];
    for (const attr of required) {
      const v = el.getAttribute(attr);
      if (v == null || String(v).trim() === '') missing.push(attr);
    }

    if (!missing.length) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    for (const attr of missing) {
      occurrences.push({
        selector: stableSelector,
        html,
        summary: 'This attribute is required for this element’s role, but is missing.',
        hint: 'Add this attribute with a valid value for this role.',
        i18n: {
          summaryKey: 'a11ycore_ariaRequiredAttr_summary_fail',
          hintKey: 'a11ycore_ariaRequiredAttr_hint_fail',
          params: { attr, role }
        },
        data: {
          details: { reasonCode: 'ARIA_ATTR_REQUIRED_MISSING', attr, role }
        }
      });
    }
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