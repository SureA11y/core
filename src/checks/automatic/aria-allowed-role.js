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
  coverage: {}
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

    // Why the role is not allowed, where the element's own state decides
    // which roles it permits (aria.getElementRoleKey): a <section> with no
    // name is not a region, a nested <header> is not a banner, a <label>
    // tied to a field takes no role, an <img> with no alt text takes only
    // none or presentation, an <a> with href only a few. Else, the roles it
    // allows.
    let key = '';
    let allowedList = null;
    try {
      key = ariaHelpers.getElementRoleKey ? ariaHelpers.getElementRoleKey(el) : '';
      allowedList = ariaHelpers.getAllowedRolesForElement
        ? ariaHelpers.getAllowedRolesForElement(el)
        : null;
    } catch {}
    const allowedRoles = (allowedList || []).join(', ');
    // The sectioning element or landmark a nested <header> sits in.
    let scope = '';
    if (key === 'header' && role === 'banner') {
      const TAGS = ['article', 'aside', 'main', 'nav', 'section'];
      const ROLES = ['article', 'complementary', 'main', 'navigation', 'region'];
      for (
        let p = dom.parentElement(el), g = 0;
        p && g < 200 && !scope;
        p = dom.parentElement(p), g++
      ) {
        const t = String(dom.tagName(p) || '').toLowerCase();
        const r = ariaHelpers.getExplicitRole(p);
        if (r ? ROLES.includes(r) : TAGS.includes(t)) scope = t;
      }
    }
    const REASONS = {
      section: role === 'region' && {
        reason: 'sectionUnnamed',
        summary:
          'This <section> has no accessible name, so it is not a region, and role="region" is not allowed on it.',
        hint: 'Name the section with aria-label or aria-labelledby: it is then a region, and the role is not needed. Or remove the role.'
      },
      header: role === 'banner' &&
        scope && {
          reason: 'headerNested',
          summary: `This <header> is nested in <${scope}>, so it is not the page banner, and role="banner" is not allowed on it.`,
          hint: 'Remove the role, or move the page header out of that element.'
        },
      'label[associated]': {
        reason: 'labelAssociated',
        summary: `This <label> is tied to a form field, and a label tied to a field may take no role, so role="${role}" is not allowed on it.`,
        hint: 'Remove the role. If the label must act as a control, use a separate element, such as a <button>.'
      },
      img: {
        reason: 'imgNoAlt',
        summary: `This <img> has no alt text, so it may only take role="none" or role="presentation", and role="${role}" is not allowed on it.`,
        hint: 'Give the image alt text that says what it is or does, which allows more roles, or put it inside a native element, such as a <button>.'
      },
      'a[href]': {
        reason: 'linkHref',
        summary: `An <a> with href may only take these roles: ${allowedRoles}. role="${role}" is not one of them.`,
        hint: 'Use one of those roles, or wrap the link in an element that has the role you meant, such as a heading element around it.'
      }
    };
    const why = REASONS[key] || null;
    const summaryText = why ? why.summary : 'This role is not permitted on this element.';
    const hintText = why
      ? why.hint
      : allowedList && allowedList.length
        ? `Use a role this element allows (${allowedRoles}), or use a different element.`
        : 'Use a role this element allows, or use a different element.';
    const hintKey = why
      ? `ariaAllowedRole_hint_fail_${why.reason}`
      : allowedList && allowedList.length
        ? 'ariaAllowedRole_hint_fail_allowed'
        : 'ariaAllowedRole_hint_fail';

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: summaryText,
        hint: hintText,
        i18n: {
          summaryKey: why
            ? `ariaAllowedRole_summary_fail_${why.reason}`
            : 'ariaAllowedRole_summary_fail',
          hintKey,
          params: {
            role,
            element: tag,
            ...(allowedRoles ? { allowedRoles } : {}),
            ...(scope ? { scope } : {})
          }
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
          details: {
            reasonCode: 'ARIA_ROLE_NOT_ALLOWED_FOR_ELEMENT',
            role,
            element: tag,
            ...(why ? { notAllowedBecause: why.reason } : {}),
            ...(allowedList ? { allowedRoles: allowedList.slice() } : {})
          }
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
