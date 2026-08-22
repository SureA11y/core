/* SPDX-License-Identifier: MPL-2.0 */

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
 *   menuitemcheckbox, menuitemradio, meter, radio, scrollbar, separator,
 *   slider, switch) -- except when that explicit role is identical to the
 *   element's own native/implicit role (ACT 4e8ab6: e.g.
 *   <input type="checkbox" role="checkbox">, which is exempt because the
 *   native control's own state exposure already covers it; no aria-checked
 *   is required. helpers.aria.getNativeRoleForElement resolves this).
 * @expectation
 *   Every required aria-* attribute for that role is present (and non-empty).
 * @implementation-notes
 * - Scoped to REQUIRED_PROPS_BY_ROLE in src/core/aria-helpers.js,
 *   which only lists a required property when the spec is unambiguous and
 *   context-independent, see that file's header for the rationale.
 * - `meter`'s `aria-valuenow` is required. NOT required
 *   unconditionally: `progressbar`'s `aria-valuenow` (a legitimately
 *   indeterminate progressbar omits it) and `combobox`'s `aria-controls`
 *   (only required once the popup is actually displayed). ACT 4e8ab6's own
 *   test corpus confirms the conditional trigger: a role="combobox" with
 *   aria-expanded="true" and no (or empty) aria-controls fails, so that
 *   specific combination is checked directly below rather than through
 *   REQUIRED_PROPS_BY_ROLE's unconditional table. `separator`'s
 *   `aria-valuenow` is conditional in the same way: a plain separator is a
 *   structural divider that needs no value, but a focusable one is a
 *   splitter the user can move, and WAI-ARIA requires the value then. ACT
 *   4e8ab6 fails exactly that shape (`<div role="separator" tabindex="0">`
 *   with no aria-valuenow), so focusability is read from
 *   helpers.getFocusableInfo at the same point.
 * - Gated on isAccTreeEligible for the element itself: unlike a syntax-
 *   level check (attribute name/value validity), "does this element
 *   currently carry its required state attribute" is not fixed once
 *   written, checkbox/switch/radio's aria-checked and slider/scrollbar's
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
  const { helpers, rule } = ctx;

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

  // Focusability decides whether a separator is a widget; the same helper
  // aria-hidden-focus and nested-interactive-controls-absent rely on, so
  // :disabled, inert and invalid tabindex values are already accounted for.
  function isFocusable(el) {
    const fn =
      helpers && typeof helpers.getFocusableInfo === 'function' ? helpers.getFocusableInfo : null;
    if (!fn) return false;
    try {
      const info = fn(el, ctx);
      return !!(info && info.focusable);
    } catch {
      return false;
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

    // ACT 4e8ab6: an explicit role identical to the element's own native
    // role is exempt -- the native control's own state exposure already
    // covers it (e.g. <input type="checkbox" role="checkbox"> needs no
    // aria-checked; the browser exposes .checked natively).
    if (ariaHelpers.getNativeRoleForElement && ariaHelpers.getNativeRoleForElement(el) === role) {
      continue;
    }

    const required = ariaHelpers.getRequiredAttrsForRole(role).slice();

    // combobox's aria-controls is required only once the popup is actually
    // displayed (aria-expanded="true") -- see this file's header comment.
    if (role === 'combobox' && String(el.getAttribute('aria-expanded') || '').trim() === 'true') {
      required.push('aria-controls');
    }

    // A separator only carries a value when it is focusable, i.e. a
    // splitter the user can move -- see this file's header comment.
    if (role === 'separator' && isFocusable(el)) {
      required.push('aria-valuenow');
    }

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

    for (const attr of missing) {
      occurrences.push(
        helpers.reportOccurrence(el, {
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
        })
      );
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
