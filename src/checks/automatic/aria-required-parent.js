/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check aria-required-parent
 * @atomic true
 * @summary Roles that require a specific ancestor/owner context role must have one
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to elements with an explicit, valid, non-abstract role that is
 *   also one of the roles with a documented, non-empty "required context
 *   role" entry (listitem, option, menuitem, menuitemcheckbox,
 *   menuitemradio, tab, treeitem, row, cell, gridcell, columnheader,
 *   rowheader, rowgroup).
 * @expectation
 *   The element has an ancestor (DOM containment) or owner (via that
 *   ancestor/owner's aria-owns) whose effective role is one of the
 *   acceptable context roles for this element's role.
 * @implementation-notes
 * - Deliberately scoped to REQUIRED_CONTEXT_ROLE in src/core/aria-helpers.js
 *   (see that file's header for the conservative-scope rationale); roles
 *   with an explicitly empty entry (e.g. tabpanel) are left unconstrained.
 * - Context-role matching uses ariaHelpers.getContainmentRole, which
 *   combines explicit role="" attributes with a small, curated native-HTML-
 *   tag mapping, so a native ancestor (e.g. <table>/<tr>/<select>) without
 *   an explicit role still satisfies the requirement.
 * - Ancestor search walks the flat/composed tree (helpers.composedParent:
 *   assignedSlot, then parentNode, then shadow host), not raw parentElement,
 *   so a slotted element's real rendered ancestor context (e.g. a shadow-
 *   tree role="list" wrapper around its <slot>) is found even though it's
 *   invisible to plain DOM containment; aria-owns is checked as a second,
 *   independent path via a reverse lookup over the search root.
 * - Gated on isAccTreeEligible for the element itself. The ancestor-role
 *   walk itself doesn't care about visibility (a hidden ancestor's role is
 *   still found by plain DOM/composed-tree containment, so a genuinely
 *   correctly-nested-but-hidden widget was never at risk here) — the
 *   remaining false-positive shape is an element whose required ancestor
 *   context doesn't exist YET because it (and its wrapping context) are
 *   assembled together at reveal time (e.g. a portal-rendered item staged
 *   outside the live menu until opened). Same category of fix as
 *   aria-required-children/aria-prohibited-children, applied for
 *   consistency; an element that isn't currently exposed to the
 *   accessibility tree is skipped (notApplicable), not failed.
 */

const id = 'aria-required-parent';

const meta = {
  title: 'Roles requiring a specific context role must be in that context',
  description:
    'Checks that roles with a documented "required context role" entry (listitem, option, tab, treeitem, row, cell, ...) have an ancestor or aria-owns owner with an acceptable context role.',
  i18n: {
    titleKey: 'ariaRequiredParent_title',
    descriptionKey: 'ariaRequiredParent_description'
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
  coverage: { facetsBySc: { '4.1.2': ['aria-role-required-context-parent'] } }
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

  // Roles that may host a nested listitem/treeitem group without breaking
  // the required-context chain — the group role is transparent for exactly
  // these two roles.
  const GROUP_TRANSPARENT_FOR_ROLES = new Set(['listitem', 'treeitem']);

  // The WAI-ARIA "Global States and Properties" set (same list as
  // aria-prohibited-children.js's GLOBAL_ARIA_ATTRS — duplicated, not
  // imported, since runInPage must be self-contained per
  // scripts/build-core.js). A roleless ancestor carrying any of these is
  // still "included in the accessibility tree" and is therefore a real
  // (generic) parent, not a transparent one: ACT's ff89c9 test corpus
  // covers exactly this with role="listitem" whose actual DOM parent is a
  // roleless <div aria-live="polite">, itself inside a role="list" — the
  // required-context chain is broken by that included-but-roleless div,
  // even though a role="list" ancestor does exist further up.
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

  function hasGlobalAriaAttr(el) {
    for (const attr of GLOBAL_ARIA_ATTRS) {
      if (el.getAttribute && el.getAttribute(attr) != null) return true;
    }
    return false;
  }

  // A real ancestor role — not "no role at all" and not the two roles that
  // strip an element from the accessibility tree's parent/child chain
  // entirely (presentation/none) — stops the search. This is stricter than
  // "any ancestor with the right role anywhere up the tree": the
  // required-context relationship is about the accessibility tree's actual
  // PARENT, so an intervening ancestor with its OWN distinct real role
  // (e.g. a plain <li>'s native "listitem" role) blocks the search even if
  // a further-up ancestor has the correct role. E.g. a <button role="tab">
  // inside a plain <li> (native listitem) inside <ul role="tablist"> fails:
  // the tablist is never the tab's accessible-tree parent, the listitem is.
  //
  // A roleless ancestor is normally transparent (it isn't a node in the
  // accessibility tree at all), UNLESS it carries a global ARIA attribute
  // -- that alone includes it in the tree as a real, roleless (generic)
  // parent, which still blocks the search the same way a distinct real
  // role would.
  function getRealContextRole(el) {
    const role = ariaHelpers.getContainmentRole(el);
    if (!role || role === 'presentation' || role === 'none') {
      return hasGlobalAriaAttr(el) ? 'generic' : '';
    }
    return role;
  }

  // Flat-tree ancestor walk (ctx.helpers.composedParent — assignedSlot wins
  // over parentNode, then shadow host). A slotted light-DOM element's real
  // rendered ancestor is whatever the shadow tree wraps its <slot> in (e.g.
  // a role="list" container), not its own light-DOM parentElement.
  // composedParent can return a non-Element node (a ShadowRoot, nodeType
  // 11) when climbing out of a shadow tree that has no further light-DOM
  // parent — skip those and keep climbing rather than treating them as a
  // (roleless) context.
  const getComposedParent =
    helpers && typeof helpers.composedParent === 'function'
      ? helpers.composedParent
      : function (n) {
          return n && n.parentElement ? n.parentElement : null;
        };

  function hasAcceptableAncestorContext(el, acceptableRoles, ownRole) {
    const allowsGroup = acceptableRoles.has('group');
    let cur = getComposedParent(el);
    let guard = 0;
    // Mutable working copy: passing a transparent "group" ancestor also
    // makes the element's OWN role an acceptable context from that point on
    // (a nested treeitem-under-group-under-treeitem chain is a normal,
    // arbitrarily-deep ARIA tree/list, not just one level). Cloned lazily
    // so the caller's Set (built once per element in runInPage) is never
    // mutated.
    let roles = acceptableRoles;
    while (cur && guard++ < 200) {
      if (cur.nodeType !== 1) {
        cur = getComposedParent(cur);
        continue;
      }
      const role = getRealContextRole(cur);
      if (!role) {
        cur = getComposedParent(cur);
        continue;
      }
      if (role === 'group' && allowsGroup && GROUP_TRANSPARENT_FOR_ROLES.has(ownRole)) {
        if (roles === acceptableRoles) roles = new Set(acceptableRoles);
        roles.add(ownRole);
        cur = getComposedParent(cur);
        continue;
      }
      return roles.has(role);
    }
    return false;
  }

  function hasAcceptableOwnerContext(el, acceptableRoles) {
    const elId = el.getAttribute('id');
    const idTok = elId && String(elId).trim();
    if (!idTok) return false;

    const owners = helpers.queryAllSmart
      ? helpers.queryAllSmart('[aria-owns]')
      : helpers.queryAll('[aria-owns]');
    for (const owner of owners) {
      if (!owner || !owner.getAttribute) continue;
      const ownsAttr = owner.getAttribute('aria-owns') || '';
      const tokens = ownsAttr.split(/\s+/).filter(Boolean);
      if (tokens.indexOf(idTok) === -1) continue;

      const role = ariaHelpers.getContainmentRole(owner);
      if (role && acceptableRoles.has(role)) return true;
    }
    return false;
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

    const requiredContext = ariaHelpers.getRequiredContextRoles(role);
    if (!requiredContext || !requiredContext.length) continue; // no entry, or explicitly unconstrained

    if (!isEligibleAcc(el)) continue; // not currently exposed to the accessibility tree

    applicableCount += 1;

    const acceptableRoles = new Set(requiredContext);
    const hasContext =
      hasAcceptableAncestorContext(el, acceptableRoles, role) ||
      hasAcceptableOwnerContext(el, acceptableRoles);

    if (hasContext) continue;

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: 'This role requires a specific ancestor/owner context role, which was not found.',
        hint: 'Place this element inside (or aria-owns-reference it from) an element with an acceptable context role.',
        i18n: {
          summaryKey: 'ariaRequiredParent_summary_fail',
          hintKey: 'ariaRequiredParent_hint_fail',
          params: { role, requiredRoles: requiredContext.join(', ') }
        },
        data: {
          details: {
            reasonCode: 'ARIA_REQUIRED_PARENT_MISSING',
            role,
            requiredContextRoles: requiredContext
          }
        }
      })
    );
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
