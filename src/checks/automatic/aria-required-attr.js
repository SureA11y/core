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
 *   A native <input type="checkbox"> or <input type="radio"> with another
 *   checkable role (switch, menuitemcheckbox, menuitemradio, or checkbox on
 *   a radio and the reverse) is in scope, but its aria-checked counts as
 *   supplied: the browser exposes the input's own checked state (HTML-AAM),
 *   so it passes without the attribute.
 * @expectation
 *   Every required state/property for that role is present and non-empty.
 *   Graded by whether ARIA supplies a stand-in for the missing attribute:
 *   - FAIL where it does not, so the state is simply not exposed
 *     (aria-checked on checkbox/radio/switch/menuitemcheckbox/menuitemradio,
 *     aria-valuenow on slider/scrollbar/meter and on a focusable separator).
 *   - CANTTELL where ARIA defines an implicit value the role falls back to
 *     (aria-expanded on combobox, aria-level on heading), so the role still
 *     exposes a value and only the author knows whether it is the right one.
 * @reports
 *   - `attr`: the required attribute that is missing or empty.
 *   - `role`: the element's role.
 *   - `implicitValue` (the CANTTELL case): the value ARIA falls back to,
 *     `false` for aria-expanded on a combobox, `2` for aria-level on a
 *     heading.
 * @reason-codes
 *   - `ARIA_ATTR_REQUIRED_MISSING` (fail): an element whose role requires a
 *     state or property it does not have, and for which ARIA gives no default,
 *     so the state is not exposed.
 *     Basis: WCAG 4.1.2; ACT 4e8ab6; WAI-ARIA 1.2 required states and
 *     properties (MUST).
 *   - `ARIA_ATTR_REQUIRED_MISSING_IMPLICIT` (cantTell): an element whose role
 *     requires a state or property it does not have, where ARIA gives a default
 *     value, such as level 2 for a heading.
 *     It leans fail for a combobox without aria-expanded when the popup its
 *     aria-controls names is shown with content, so it is announced collapsed
 *     while open.
 *     Basis: WAI-ARIA 1.2 required states and properties (exception: implicit
 *     value); ACT 4e8ab6; WCAG 4.1.2 (not settled).
 *   - `state_internals` (cantTell): the element is a custom element that may
 *     set the required state through ElementInternals, which no script can
 *     read, so whether it is set could not be told.
 *     It leans fail when the code of the element's class and the classes it
 *     extends never calls attachInternals, and pass when it calls it and
 *     names the state's property (such as ariaChecked).
 *     Basis: WCAG 4.1.2 (not settled); HTML ElementInternals (not settled).
 * @implementation-notes
 * - The implicit-value table is generated from aria-query's requiredProps by
 *   scripts/generate-aria-tables.js (REQUIRED_PROP_IMPLICIT_VALUES in
 *   src/core/aria-helpers.js), so the two tiers cannot drift apart from the
 *   spec by hand. ACT 4e8ab6 maps this rule's requirement to WAI-ARIA rather
 *   than to WCAG, and names 1.3.1/4.1.2 as "less strict" precisely because
 *   they "allow for fallback default values"; the cantTell tier is that
 *   carve-out, not a softening of the fail tier.
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
 * - aria-busy="true" exempts nothing here. WAI-ARIA's aria-busy carve-out
 *   names required owned elements, which aria-required-children reads, not
 *   required states, and ACT 4e8ab6 has no such exemption: a checkbox
 *   that is busy still announces no checked state. It extended the
 *   carve-out by analogy until 2026-10.
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
  const dom = ctx.helpers.dom;
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

  const CHECKABLE_ROLES = new Set([
    'checkbox',
    'switch',
    'radio',
    'menuitemcheckbox',
    'menuitemradio'
  ]);

  function isNativeCheckable(el) {
    if (String(dom.localName(el) || '').toLowerCase() !== 'input') return false;
    if (dom.namespaceURI(el) && dom.namespaceURI(el) !== 'http://www.w3.org/1999/xhtml')
      return false;
    const type = String(dom.getAttribute(el, 'type') || '')
      .trim()
      .toLowerCase();
    return type === 'checkbox' || type === 'radio';
  }

  // Reasons the engine gives for content that is not drawn, or kept from
  // assistive technology.
  const UNSEEN = new Set([
    'displayNone',
    'hiddenAttr',
    'visibilityHidden',
    'detailsClosed',
    'contentVisibilityHidden',
    'templateContent',
    'nonRenderedElement',
    'ariaHidden'
  ]);
  function shownWithContent(ref) {
    try {
      const info = helpers.isAccTreeEligible(ref);
      const reasons = info && info.eligible === false ? info.reasons || [] : [];
      if (reasons.some((r) => UNSEEN.has(r))) return false;
      if (typeof helpers.isVisuallyHidden === 'function' && helpers.isVisuallyHidden(ref))
        return false;
      return String(dom.textContent(ref) || '').trim() !== '';
    } catch {
      return false;
    }
  }

  // Which way a missing aria-expanded on a combobox points: the popup its
  // aria-controls names, shown with content, is open while the combobox is
  // announced collapsed. A popup that is closed now says nothing about
  // whether aria-expanded is set when it opens, so it gives no lean.
  function implicitLean(el, role, attr) {
    if (role !== 'combobox' || attr !== 'aria-expanded') return null;
    let refs = [];
    try {
      refs = helpers.getRefElements(el, 'aria-controls', ctx) || [];
    } catch {}
    if (!refs.some(shownWithContent)) return null;
    return {
      toward: 'fail',
      why: 'The popup this combobox controls is shown, but without aria-expanded the combobox is announced as collapsed.',
      signals: [{ signal: 'popup-visible', value: true }],
      caution: 'The popup may be closing, or be a list the widget always shows.',
      i18n: {
        whyKey: 'ariaRequiredAttr_lean_why_comboboxOpen',
        cautionKey: 'ariaRequiredAttr_lean_caution_comboboxOpen'
      }
    };
  }

  // Which way a state a custom element may set through its internals
  // points, from the source of its class and the classes it extends: code
  // that never calls attachInternals can't set it that way, and code that
  // calls it and names the state's property most likely does. Reading a
  // class's source neither constructs nor calls it.
  function internalsLean(el, attr) {
    let sources = '';
    try {
      const name = String(dom.localName(el) || '').toLowerCase();
      const win = dom.defaultView(dom.ownerDocument(el));
      const registry = win && win.customElements;
      let ctor = registry && typeof registry.get === 'function' ? registry.get(name) : null;
      if (!ctor) return null;
      const toSource = Function.prototype.toString;
      // An autonomous custom element extends HTMLElement: the walk stops
      // there, before the platform's own code.
      const base = win.HTMLElement;
      for (let guard = 0; ctor && typeof ctor === 'function' && guard < 20; guard++) {
        if (ctor === base) break;
        const src = String(Reflect.apply(toSource, ctor, []));
        if (/\[native code\]/.test(src)) break;
        sources += src + '\n';
        ctor = Object.getPrototypeOf(ctor);
      }
    } catch {
      return null;
    }
    if (!sources) return null;
    const tail = attr.slice(5);
    const IDL = {
      valuenow: 'ValueNow',
      valuemin: 'ValueMin',
      valuemax: 'ValueMax',
      valuetext: 'ValueText'
    };
    const prop = 'aria' + (IDL[tail] || tail.charAt(0).toUpperCase() + tail.slice(1));
    if (!sources.includes('attachInternals')) {
      return {
        toward: 'fail',
        why: 'The component’s code never calls attachInternals, so it cannot set this state that way, and the element has no attribute for it.',
        signals: [{ signal: 'ctor-source-mentions-internals', value: false }],
        caution:
          'Code outside the component’s classes, such as a shared helper, may attach the internals.',
        i18n: {
          whyKey: 'ariaRequiredAttr_lean_why_internalsUnused',
          cautionKey: 'ariaRequiredAttr_lean_caution_internalsUnused'
        }
      };
    }
    if (!sources.includes(prop)) return null;
    return {
      toward: 'pass',
      why: 'The component’s code attaches internals and sets this state through them.',
      signals: [
        { signal: 'ctor-source-mentions-internals', value: true },
        { signal: 'ctor-source-mentions-state-prop', value: prop }
      ],
      caution: 'Naming the state in its code does not show it is set to the right value.',
      i18n: {
        whyKey: 'ariaRequiredAttr_lean_why_internalsSet',
        cautionKey: 'ariaRequiredAttr_lean_caution_internalsSet'
      }
    };
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('[role]')
    : helpers.queryAll('[role]');

  const failOccurrences = [];
  const cantTellOccurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;

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

    // A native checkbox or radio exposes its own checked state whatever
    // checkable role it carries (HTML-AAM maps the checkedness; ARIA in HTML
    // tells authors not to set aria-checked on it), so aria-checked is
    // supplied on <input type="checkbox" role="switch"> and the like.
    const nativeChecked = isNativeCheckable(el) && CHECKABLE_ROLES.has(role);

    // combobox's aria-controls is required only once the popup is actually
    // displayed (aria-expanded="true") -- see this file's header comment.
    if (
      role === 'combobox' &&
      String(dom.getAttribute(el, 'aria-expanded') || '').trim() === 'true'
    ) {
      required.push('aria-controls');
    }

    // A separator only carries a value when it is focusable, i.e. a
    // splitter the user can move -- see this file's header comment.
    if (role === 'separator' && isFocusable(el)) {
      required.push('aria-valuenow');
    }

    if (!required.length) continue;

    if (!isEligibleAcc(el)) continue; // not currently exposed to the accessibility tree

    applicableCount += 1;

    const missing = [];
    for (const attr of required) {
      const v = dom.getAttribute(el, attr);
      if (attr === 'aria-checked' && nativeChecked) continue;
      if (v == null || String(v).trim() === '') {
        // A custom element may set the state through ElementInternals
        // (helpers.getInternalsStateInfo): set there, it is not missing;
        // where its internals can't be read, whether it is set is asked.
        const internalsState =
          typeof helpers.getInternalsStateInfo === 'function'
            ? helpers.getInternalsStateInfo(el, attr)
            : null;
        if (internalsState && internalsState.status === 'set') continue;
        if (internalsState && internalsState.status === 'unknown') {
          const question = helpers.internalsQuestion(el, attr);
          const lean = internalsLean(el, attr);
          if (lean) question.lean = lean;
          cantTellOccurrences.push(helpers.reportOccurrence(el, question));
          continue;
        }
        missing.push(attr);
      }
    }

    if (!missing.length) continue;

    for (const attr of missing) {
      const implicit =
        typeof ariaHelpers.getRequiredAttrImplicitValue === 'function'
          ? ariaHelpers.getRequiredAttrImplicitValue(role, attr)
          : null;

      if (implicit) {
        const lean = implicitLean(el, role, attr);
        cantTellOccurrences.push(
          helpers.reportOccurrence(el, {
            occurrenceOutcome: 'cantTell',
            summary: `This attribute is required for this element’s role and is missing, but ARIA falls back to "${implicit}".`,
            hint: 'Set the attribute explicitly if the implicit value is not the state you mean.',
            i18n: {
              summaryKey: 'ariaRequiredAttr_summary_cantTell',
              hintKey: 'ariaRequiredAttr_hint_cantTell',
              params: { attr, role, implicit }
            },
            uncertainty: {
              code: 'spec-only',
              needed: 'Whether the implicit fallback is the state the author meant.',
              evidence: { attribute: attr, role, implicitValue: implicit }
            },
            ...(lean ? { lean } : {}),
            data: {
              details: {
                reasonCode: 'ARIA_ATTR_REQUIRED_MISSING_IMPLICIT',
                attr,
                role,
                implicitValue: implicit
              }
            }
          })
        );
        continue;
      }

      failOccurrences.push(
        helpers.reportOccurrence(el, {
          occurrenceOutcome: 'fail',
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
  const resolved = helpers.resolveTieredOutcome(
    failOccurrences,
    cantTellOccurrences,
    rule.defaultSeverity || 'serious'
  );
  return { ruleId: rule.ruleId, ...resolved };
}

module.exports = { id, meta, runInPage };
