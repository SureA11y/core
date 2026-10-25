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
 *   constraint in the ARIA in HTML specification's table of permitted
 *   roles.
 * @expectation
 *   The explicit role is one of the roles the ARIA-in-HTML specification
 *   permits for that host element.
 *   Reported at CANTTELL rather than FAIL: ARIA-in-HTML's permitted-roles
 *   table is an author conformance requirement with no ACT rule and no WCAG
 *   mapping in any source. The role the author asked for is still the role
 *   assistive technology exposes, so whether the combination harms anyone
 *   depends on the widget, not on the table.
 * @reports
 *   - `role`: the explicit role that is not permitted on the host element.
 * @reason-codes
 *   - `ARIA_ROLE_NOT_ALLOWED_FOR_ELEMENT` (cantTell): an explicit role that
 *     ARIA in HTML does not permit on that element, which assistive technology
 *     still exposes.
 *     It leans fail when the element takes keyboard focus and the role is not
 *     a widget role, and pass when the role is none or presentation on a
 *     focusable element, which browsers ignore.
 *     Basis: ARIA in HTML (MUST).
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
  coverage: {},
  // How a person checks each undecided finding: shown with it as
  // howToCheck (docs/OUTPUT_SCHEMA.md).
  review: {
    ARIA_ROLE_NOT_ALLOWED_FOR_ELEMENT: {
      steps: [
        'Inspect the element the report names and note its tag and its role attribute.',
        "Open the Accessibility pane in the browser's developer tools and check which role is exposed.",
        'Press Tab to see whether the element takes keyboard focus, and try operating it with Enter or Space if it is a control.',
        'With a screen reader, move to the element and compare what is announced with what the element does on screen.'
      ],
      passWhen:
        'The announced role matches how the element looks and behaves (or role none/presentation was ignored on a focusable control and its native role is kept).',
      failWhen:
        "The announced role contradicts the element's behaviour, such as a focusable button announced as a heading, which fails ARIA in HTML and can fail WCAG 4.1.2."
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
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

  // Roles that descend from the abstract widget role in WAI-ARIA 1.2, plus
  // separator, which is a widget when focusable: the roles a control that
  // takes keyboard focus is expected to have.
  const WIDGET_ROLES = new Set([
    'button',
    'checkbox',
    'columnheader',
    'combobox',
    'grid',
    'gridcell',
    'link',
    'listbox',
    'menu',
    'menubar',
    'menuitem',
    'menuitemcheckbox',
    'menuitemradio',
    'option',
    'progressbar',
    'radio',
    'radiogroup',
    'row',
    'rowheader',
    'scrollbar',
    'searchbox',
    'separator',
    'slider',
    'spinbutton',
    'switch',
    'tab',
    'tablist',
    'textbox',
    'tree',
    'treegrid',
    'treeitem'
  ]);

  function focusInfo(el) {
    try {
      const info = helpers.getFocusableInfo(el, ctx);
      return { focusable: !!(info && info.focusable), tabbable: !!(info && info.tabbable) };
    } catch {
      return { focusable: false, tabbable: false };
    }
  }

  // Which way the finding points: a role none or presentation on an element
  // that takes focus is ignored by browsers (presentational role conflict
  // resolution), so the native role is kept; a static role on an element in
  // the tab order announces what keyboard focus lands on as something that is
  // not a control.
  function leanFor(el, role) {
    const focus = focusInfo(el);
    if (role === 'none' || role === 'presentation') {
      if (!focus.focusable) return null;
      return {
        toward: 'pass',
        why: 'Browsers ignore role none or presentation on an element that takes focus, and keep its native role.',
        signals: [
          { signal: 'role-is-presentational', value: true },
          { signal: 'host-focusable', value: true }
        ],
        caution: 'Browsers resolve this conflict in slightly different ways.',
        i18n: {
          whyKey: 'ariaAllowedRole_lean_why_presentational',
          cautionKey: 'ariaAllowedRole_lean_caution_presentational'
        }
      };
    }
    if (!focus.tabbable || WIDGET_ROLES.has(role)) return null;
    return {
      toward: 'fail',
      why: 'The element is in the tab order but its role is not a control role, so keyboard users land on something announced as static.',
      signals: [
        { signal: 'host-tabbable', value: true },
        { signal: 'explicit-role-is-widget', value: false }
      ],
      caution:
        'A focusable element with a static role can be deliberate, such as a scrollable region.',
      i18n: {
        whyKey: 'ariaAllowedRole_lean_why_focusable',
        cautionKey: 'ariaAllowedRole_lean_caution_focusable'
      }
    };
  }

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;

    const role = ariaHelpers.getExplicitRole(el);
    if (!role || !ariaHelpers.isValidConcreteRole(role)) continue; // aria-roles-valid's concern

    const info = ariaHelpers.isRoleAllowedOnElement(el, role);
    if (!info.constrained) continue; // no asserted constraint for this element

    applicableCount += 1;

    if (info.allowed) continue;

    const tag = (dom.tagName(el) || '').toLowerCase();
    const lean = leanFor(el, role);

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: 'This role is not permitted on this element.',
        hint: 'Use a role this element allows, or use a different element.',
        i18n: {
          summaryKey: 'ariaAllowedRole_summary_fail',
          hintKey: 'ariaAllowedRole_hint_fail',
          params: { role, element: tag }
        },
        uncertainty: {
          code: 'spec-only',
          needed: 'Whether the role misstates this element to assistive technology in practice.',
          evidence: {
            role,
            element: tag,
            source: 'ARIA in HTML permitted-roles table',
            wcagSc: []
          }
        },
        ...(lean ? { lean } : {}),
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
