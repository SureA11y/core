/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check aria-prohibited-children
 * @atomic true
 * @summary Container roles must not own an accessible-tree child with a disallowed role
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to elements with an explicit, valid role that is one of the
 *   container roles with a documented "required owned elements" entry
 *   (the same REQUIRED_OWNED_ROLES table aria-required-children
 *   uses — see src/core/aria-helpers.js).
 * @expectation
 *   Every accessible-tree-owned descendant of the container (after
 *   pruning role="none"/"presentation" elements and any "group"/
 *   "rowgroup" wrapper — both always transparent for owned-element
 *   matching, per WAI-ARIA, regardless of whether "group"/"rowgroup" is
 *   itself in the container's own required-owned-roles set) has a role
 *   from that same required-owned set. Nothing else is a structurally
 *   valid direct child of a composite/container role, where "allowed" is
 *   the container's required-owned roles plus the small
 *   ALLOWED_EXTRA_OWNED_ROLES set of roles it may own without being
 *   required to (a separator between menu items, a caption on a grid). A
 *   roleless wrapper
 *   is descended into to reach the items a component library buries
 *   inside it, but once one is found there the rest of that wrapper's
 *   subtree is the item's own content and is not judged against the
 *   container.
 * @implementation-notes
 * - A distinct atomic decision from aria-required-children (see that
 *   rule): "does at least one required child exist" vs "is every owned
 *   child one of the allowed roles" — split per this repo's "one rule =
 *   one normative decision" principle.
 * - The "allowed owned roles" set is REQUIRED_OWNED_ROLES plus
 *   ALLOWED_EXTRA_OWNED_ROLES, because WAI-ARIA's "Required Owned
 *   Elements" says what a container MUST contain, not the exhaustive list
 *   of what it MAY contain. The extra table is deliberately small and each
 *   entry needs a source — ARIA giving the child a Required Context Role
 *   that names this container (caption in table/grid), or the child role's
 *   own definition placing it there (separator in menu/menubar) — recorded
 *   and validated in scripts/generate-aria-tables.js. The two sets are
 *   used for different questions: only a REQUIRED role makes a roleless
 *   wrapper an item wrapper, while the allowed set decides the verdict.
 * - A ROLELESS descendant that has any global WAI-ARIA attribute or is
 *   focusable is also flagged: it's treated as an owned entry with
 *   `role: null`, which can never match a container's required-owned-roles
 *   set, so it's always "unallowed". Both signals
 *   (global-attribute presence, focusability via the shared
 *   `helpers.getFocusableInfo`) are static, declarative markup facts with
 *   no live-DOM/hydration risk, unlike e.g.
 *   `aria-checked-state-mismatch`'s DOM-property comparison.
 *   `helpers.getFocusableInfo`'s `mechanism` field ('tabindex' | 'native' |
 *   ...) distinguishes an explicit `tabindex` attribute from native
 *   focusability (e.g. an `<a href>`), so the reported `data.details.attr`
 *   and message correctly say `nativeFocusable` rather than claiming a
 *   tabindex attribute that isn't actually present in the markup.
 * - A roleless wrapper is transparent only as a route to the items inside
 *   it, never as a way to attribute the item's own content to the
 *   container. Unlike role="none"/"presentation", a roleless element is
 *   NOT removed from the accessibility tree — it is exposed as a generic
 *   node, so strictly nothing inside it is the container's child at all.
 *   The walk descends anyway, because component markup routinely buries
 *   the real item several roleless levels down (an Angular Material card
 *   whose radio sits at card > header > mat-radio-button > div > div >
 *   input[type=radio]) and refusing to descend would report every such
 *   container as owning nothing. Applied in both directions, that
 *   leniency turned every role-bearing element anywhere in an item's
 *   subtree into an owned child of the container: a `role="separator"`
 *   dividing two columns inside a radio card was reported as a
 *   prohibited child of the radiogroup. So when a roleless wrapper turns
 *   out to hold a required item, only the items it holds are collected;
 *   a wrapper holding no item at all is interposed content, and
 *   everything found inside it is still reported.
 * - Recursion stops at the first non-transparent role boundary: a nested
 *   container with its own real role
 *   (e.g. a `<div role="listbox">` inside a menubar) is evaluated as its
 *   own owned-role entry against the outer container (and, separately,
 *   gets its own applicability pass as a container in the same rule run)
 *   — its descendants are never misattributed to the outer container.
 *   "group"/"rowgroup" are always transparent instead, for any container
 *   role, not only the few (menu, menubar, tree) whose own required-owned
 *   set names "group" as an acceptable leaf role — confirmed by ACT
 *   bc4a75's own examples, e.g. a `role="list"` (no "group" in its
 *   required-owned set) still treating a `role="group"` wrapper as
 *   transparent.
 * - Child-role resolution uses `ariaHelpers.getContainmentRole` (explicit
 *   role, falling back to the native-tag map — li/tr/td/th/tbody/ul/ol/
 *   table/select/input[type=radio]), the same resolution
 *   aria-required-children's descendant matching uses — not
 *   `getExplicitRole`, which only sees an explicit role="" attribute. A
 *   bare `<li>` with no role="" (the common CSS-reset workaround
 *   `<ul role="list"><li>...</li></ul>`) must still resolve to the
 *   implicit listitem role so the walk stops at that boundary instead of
 *   recursing straight through it into the listitem's own subtree; the
 *   same applies to every container role in REQUIRED_OWNED_ROLES whose
 *   native-tag counterpart the child map covers (e.g. a bare
 *   `<tr>`/`<td>` under a role="table"/"grid"/"row" container).
 * - Gated on isAccTreeEligible for the container itself, matching
 *   aria-required-children: a closed dialog/flyout menu populated on open
 *   is a real false-positive shape otherwise. The descendant-level
 *   eligibility gate alone would make the container-level gate redundant
 *   for correctness (an ineligible container has no eligible descendants
 *   either, so `owned` ends up empty and nothing fails), but skipping the
 *   container up front reports `notApplicable` instead of a vacuous
 *   `pass` — the more accurate outcome for a container that isn't
 *   currently exposed at all — and avoids walking a subtree whose result
 *   is already known.
 * - No aria-busy exemption here (unlike aria-required-children): the
 *   WAI-ARIA spec's aria-busy escape hatch is specifically about a
 *   container missing its required owned elements while loading, not
 *   about a container that already has extra/disallowed owned elements —
 *   that scenario isn't this rule's concern.
 */

const id = 'aria-prohibited-children';

const meta = {
  title: 'Container roles must not own a child with a disallowed role',
  description:
    "Checks that every accessible-tree-owned child of a container role (list, listbox, menu, menubar, radiogroup, rowgroup, table, grid, treegrid, tablist, tree, row) has one of that role's allowed owned roles.",
  i18n: {
    titleKey: 'ariaProhibitedChildren_title',
    descriptionKey: 'ariaProhibitedChildren_description'
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
  defaultConfidence: 'medium',
  coverage: { facetsBySc: { '4.1.2': ['aria-role-owned-children-allowed'] } }
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

  // The WAI-ARIA "Global States and Properties" set (same list as
  // aria-allowed-attr.js's GLOBAL_ATTRS — duplicated, not imported, since
  // runInPage must be self-contained per scripts/build-core.js). A
  // roleless descendant carrying any of these is a real accessible-tree
  // node, not a transparent wrapper.
  const GLOBAL_ARIA_ATTRS = [
    'aria-atomic',
    'aria-braillelabel',
    'aria-brailleroledescription',
    'aria-busy',
    'aria-controls',
    'aria-current',
    'aria-describedby',
    'aria-description',
    'aria-details',
    'aria-disabled',
    'aria-dropeffect',
    'aria-errormessage',
    'aria-flowto',
    'aria-grabbed',
    'aria-haspopup',
    'aria-hidden',
    'aria-invalid',
    'aria-keyshortcuts',
    'aria-label',
    'aria-labelledby',
    'aria-live',
    'aria-owns',
    'aria-relevant',
    'aria-roledescription'
  ];

  function getGlobalAriaAttr(el) {
    for (const attr of GLOBAL_ARIA_ATTRS) {
      const v = el.getAttribute ? el.getAttribute(attr) : null;
      if (v != null) return attr;
    }
    return null;
  }

  // Roles a container may own beyond its REQUIRED owned elements. WAI-ARIA's
  // "Required Owned Elements" says what a container must contain, not the
  // exhaustive list of what it may contain; using the required set as both
  // reported a separator between menu items, and a caption on a grid, as
  // prohibited children. Generated from scripts/generate-aria-tables.js, which
  // documents the source for every entry and validates each against
  // aria-query's Required Context Role data.
  // <generated:aria-allowed-extra-owned-roles>
  const ALLOWED_EXTRA_OWNED_ROLES = {
    grid: ['caption'],
    menu: ['separator'],
    menubar: ['separator'],
    table: ['caption']
  };
  // </generated:aria-allowed-extra-owned-roles>

  const MAX_DEPTH = 40;

  // Collects this container's owned-role entries, pruning role="none"/
  // "presentation" and "group"/"rowgroup" wrappers as transparent
  // (recursing through them unconditionally — see header comment), and
  // stopping at the first non-transparent role boundary otherwise. A
  // roleless wrapper is transparent too, but only as a way to reach the
  // items buried inside it: once one is found there, the rest of that
  // wrapper's subtree belongs to the item, not to this container (see the
  // roleless branch below). A roleless descendant is a non-transparent
  // boundary (an owned entry with role: null, which can never satisfy a
  // required-role set) when it carries a global aria-* attribute or is
  // focusable.
  // kidRole comes from getContainmentRole, not getExplicitRole: "roleless"
  // here means neither an explicit role="" NOR one of the native
  // containment tags (li, tr, td, ...), so a bare <li>/<tr>/... is a real
  // listitem/row boundary, not a transparent wrapper the walk should pass
  // through.
  function collectOwnedRoles(el, out, depth, requiredSet) {
    if (depth > MAX_DEPTH) return;
    const kids = el.children ? Array.prototype.slice.call(el.children) : [];
    for (const kid of kids) {
      if (!kid || kid.nodeType !== 1) continue;
      if (!isEligibleAcc(kid)) continue;

      const kidRole = ariaHelpers.getContainmentRole(kid);
      const isPresentational = kidRole === 'presentation' || kidRole === 'none';
      const isTransparentGroup = kidRole === 'group' || kidRole === 'rowgroup';

      if (!kidRole && !isPresentational) {
        const globalAttr = getGlobalAriaAttr(kid);
        let mechanism;
        try {
          const fi =
            helpers && typeof helpers.getFocusableInfo === 'function'
              ? helpers.getFocusableInfo(kid, ctx)
              : null;
          mechanism = (fi && fi.focusable && fi.mechanism) || 'none';
        } catch {
          mechanism = 'none';
        }
        if (globalAttr || mechanism !== 'none') {
          // `mechanism` distinguishes an actual tabindex="" attribute from
          // native focusability (e.g. <a href>, <button>, <input>) — these
          // are different facts and must not be reported as the same
          // "carries tabindex" claim (a native anchor with no tabindex
          // attribute at all is not "carrying tabindex").
          const attr = globalAttr || (mechanism === 'tabindex' ? 'tabindex' : 'nativeFocusable');
          out.push({ el: kid, role: null, attr });
          continue; // real accessible-tree node: stop here, do not recurse further
        }
      }

      if (isPresentational || isTransparentGroup) {
        // role="none"/"presentation" really is removed from the accessibility
        // tree, and its children are promoted to this container — so whatever
        // is inside genuinely becomes an owned child. group/rowgroup stay
        // unconditionally transparent for the reason in the header comment.
        collectOwnedRoles(kid, out, depth + 1, requiredSet);
        continue;
      }

      if (!kidRole) {
        // A roleless wrapper is NOT removed from the accessibility tree: it is
        // exposed as a generic node, so strictly speaking nothing inside it is
        // this container's child at all. The walk descends anyway, because a
        // component library routinely buries the real item several roleless
        // levels down (an Angular Material card whose radio sits at
        // card > header > mat-radio-button > div > div > input[type=radio]),
        // and refusing to descend would report every such container as
        // missing its items.
        //
        // That leniency has to run one way only. If the wrapper turns out to
        // hold a required item, the wrapper is an item wrapper and everything
        // else inside it is the ITEM's content, not the container's children:
        // a mat-divider sitting in the card body beside the radio is not an
        // owned child of the radiogroup, and reporting it as one is a false
        // positive on ordinary component markup. Only the items are collected
        // in that case. A wrapper holding no item at all is pure interposed
        // content, so everything found in it is still reported.
        const nested = [];
        collectOwnedRoles(kid, nested, depth + 1, requiredSet);
        const items = nested.filter((entry) => entry.role && requiredSet.has(entry.role));
        for (const entry of items.length ? items : nested) out.push(entry);
        continue;
      }

      if (!ariaHelpers.isValidConcreteRole(kidRole)) continue; // aria-roles-valid's concern

      out.push({ el: kid, role: kidRole });
      // Stop here: a real, non-transparent role is its own semantic unit.
    }
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('[role]')
    : helpers.queryAll('[role]');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;

    const role = ariaHelpers.getExplicitRole(el);
    if (!role || !ariaHelpers.isValidConcreteRole(role)) continue;

    const requiredOwned = ariaHelpers.getRequiredOwnedRoles(role);
    if (!requiredOwned || !requiredOwned.length) continue;

    if (!isEligibleAcc(el)) continue; // not currently exposed to the accessibility tree

    applicableCount += 1;

    // Two different sets, deliberately. requiredSet drives the item-wrapper
    // detection in collectOwnedRoles: only a REQUIRED role makes a roleless
    // wrapper an item wrapper, so a wrapper holding nothing but a separator is
    // still interposed content. allowedRoles decides the verdict, and includes
    // the roles a container may own without being required to.
    const requiredSet = new Set(requiredOwned);
    const allowedRoles = requiredOwned.concat(ALLOWED_EXTRA_OWNED_ROLES[role] || []);
    const allowedSet = new Set(allowedRoles);
    const owned = [];
    collectOwnedRoles(el, owned, 0, requiredSet);

    for (const entry of owned) {
      if (entry.role && allowedSet.has(entry.role)) continue;

      const containerSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';

      const isRoleless = !entry.role;
      const isNativeFocusable = entry.attr === 'nativeFocusable';

      let summary;
      let hint;
      let summaryKey;
      let hintKey;
      if (isNativeFocusable) {
        summary = `This element has no explicit role but is natively focusable, making it a real accessible-tree node that is not an allowed owned child of the enclosing role="${role}" container.`;
        hint = `Give this element role="presentation"/"none", remove its native focusability (e.g. drop the href/tabindex-granting attribute), or move it outside the ${role} container.`;
        summaryKey = 'ariaProhibitedChildren_summary_fail_native_focusable';
        hintKey = 'ariaProhibitedChildren_hint_fail_native_focusable';
      } else if (isRoleless) {
        summary = `This element has no explicit role but carries ${entry.attr}, making it a real accessible-tree node that is not an allowed owned child of the enclosing role="${role}" container.`;
        hint = `Remove ${entry.attr} (or the role="${role}" container ownership), or give this element role="presentation"/"none" if it isn't meant to be its own accessible-tree node.`;
        summaryKey = 'ariaProhibitedChildren_summary_fail_roleless';
        hintKey = 'ariaProhibitedChildren_hint_fail_roleless';
      } else {
        summary = `This element has role="${entry.role}", which is not an allowed owned child of the enclosing role="${role}" container.`;
        hint = `Remove or change this role so it matches one of the container's allowed owned roles (${allowedRoles.join(', ')}), or move this element outside the ${role} container.`;
        summaryKey = 'ariaProhibitedChildren_summary_fail';
        hintKey = 'ariaProhibitedChildren_hint_fail';
      }

      occurrences.push(
        helpers.reportOccurrence(entry.el, {
          summary,
          hint,
          i18n: {
            summaryKey,
            hintKey,
            params: isRoleless
              ? { attr: entry.attr, containerRole: role }
              : {
                  childRole: entry.role,
                  containerRole: role,
                  allowedRoles: allowedRoles.join(', ')
                }
          },
          data: {
            details: {
              reasonCode: isRoleless ? 'ARIA_PROHIBITED_CHILD_ROLELESS' : 'ARIA_PROHIBITED_CHILD',
              childRole: entry.role,
              attr: entry.attr,
              containerRole: role,
              containerSelector,
              allowedOwnedRoles: allowedRoles
            }
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
      severity: rule.defaultSeverity || 'moderate',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
