'use strict';

/**
 * @check aria-required-attr
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
 *   a widely-used reference engine's own `requiredAttrs` table. Deliberately
 *   did NOT add two other entries from that same table: `progressbar`'s
 *   `aria-valuenow` (a legitimately indeterminate progressbar omits it —
 *   that engine itself excludes progressbar from its own table for this reason)
 *   and `combobox`'s `aria-controls` (confirmed via MDN's combobox role
 *   page to be conditional — only required once the popup is actually
 *   displayed, not unconditionally). See src/core/aria-helpers.js's
 *   REQUIRED_PROPS_BY_ROLE comment for the full reasoning.
 * - Gated on isAccTreeEligible for the element itself: unlike a syntax-
 *   level check (attribute name/value validity), "does this element
 *   currently carry its required state attribute" is not fixed once
 *   written — checkbox/switch/radio's aria-checked and slider/scrollbar's
 *   aria-valuenow are exactly the kind of live-widget-state attribute
 *   component libraries set during hydration/mount, at the same moment
 *   the element becomes exposed. Same false-positive shape as
 *   aria-required-children; an element that isn't currently exposed to
 *   the accessibility tree is skipped (notApplicable), not failed.
 * - Also treats aria-busy="true" as an exemption, same as
 *   aria-required-children. Note this is an extension by analogy, not a
 *   literal reading of the spec: WAI-ARIA's aria-busy carve-out text names
 *   "required owned elements" specifically, not required state attributes.
 *   The underlying rationale (a widget mid-initialization shouldn't be
 *   flagged for not yet reflecting state the same initialization step is
 *   about to set) applies equally here, so the exemption is extended by
 *   analogy rather than by explicit spec text.
 */

const id = 'aria-required-attr';

const meta = {
  title: 'Roles with a required ARIA state/property must carry it',
  description:
    'Checks that elements with an explicit role carry every unambiguous, context-independent required aria-* state/property for that role (e.g. role="checkbox" must have aria-checked).',
  i18n: {
    titleKey: 'ariaRequiredAttr_title',
    descriptionKey: 'ariaRequiredAttr_description'
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
  coverage: { facetsBySc: { '4.1.2': ['aria-attr-required-for-role'] } }
};

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  const ariaHelpers = helpers && helpers.aria ? helpers.aria : null;
  if (!ariaHelpers) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  function isEligibleAcc(el) {
    const fn =
      helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;
    if (!fn) return true;
    try {
      const r = fn(el, ctx);
      if (typeof r === 'boolean') return r;
      return !!(r && r.eligible);
    } catch {
      return true;
    }
  }

  function isMarkedBusy(el) {
    const v = el.getAttribute('aria-busy');
    return v != null && String(v).trim().toLowerCase() === 'true';
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

    const required = ariaHelpers.getRequiredAttrsForRole(role);
    if (!required.length) continue;

    if (!isEligibleAcc(el)) continue; // not currently exposed to the accessibility tree
    if (isMarkedBusy(el)) continue; // author has signaled transient incompleteness per WAI-ARIA

    applicableCount += 1;

    const missing = [];
    for (const attr of required) {
      const v = el.getAttribute(attr);
      if (v == null || String(v).trim() === '') missing.push(attr);
    }

    if (!missing.length) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : el.outerHTML || '';

    for (const attr of missing) {
      occurrences.push({
        selector: stableSelector,
        html,
        summary: 'This attribute is required for this element’s role, but is missing.',
        hint: 'Add this attribute with a valid value for this role.',
        i18n: {
          summaryKey: 'ariaRequiredAttr_summary_fail',
          hintKey: 'ariaRequiredAttr_hint_fail',
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
