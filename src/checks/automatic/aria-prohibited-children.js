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
 *   "rowgroup" wrapper whose role is itself one of the required roles —
 *   both are structurally transparent, same as WAI-ARIA's own
 *   accessibility-tree construction) has a role from that same required-
 *   owned set. Nothing else is a structurally valid direct child of a
 *   composite/container role.
 * @implementation-notes
 * - A distinct atomic decision from aria-required-children (see
 *   that rule): "does at least one required child exist" vs "is every
 *   owned child one of the allowed roles." A widely-used reference engine
 *   bundles both under one check (`aria-required-children`); this repo's
 *   "one rule = one normative decision" principle splits them, matching
 *   the established pattern elsewhere of surea11y rules mapping
 *   many-to-one against a single check in that reference engine.
 * - The "allowed owned roles" set is exactly REQUIRED_OWNED_ROLES — not
 *   a separately authored, broader list. Verified directly against a
 *   widely-used reference engine's own ariaRequiredChildren/getOwnedRoles
 *   algorithm: an owned element is only considered allowed if its role is
 *   literally in the container's required set; that engine does not
 *   define a superset "allowed but not required" list for this purpose.
 *   Found and verified via a real page (Red Cross's homepage: a
 *   <nav role="region"> nested inside a <ul role="menubar"> through a
 *   role="none" <li> wrapper — a real violation that reference engine
 *   caught that aria-required-children's own scope (documented
 *   there as "can only under-report, never over-report") does not).
 * - Widened 2026-07-21 to also flag a ROLELESS descendant that has any
 *   global WAI-ARIA attribute or is focusable, matching a widely-used
 *   reference engine's own `getOwnedRoles` exactly (verified directly
 *   against its source: `hasGlobalAriaOrFocusable =
 *   !!globalAriaAttr || _isFocusable(vNode)` — such a descendant is
 *   pushed as an owned entry with `role: null`, which can never match a
 *   container's required-owned-roles set, so it's always "unallowed").
 *   Previously left out as riskier to replicate — re-evaluated given
 *   direct access to that engine's exact algorithm (not a guess) plus this
 *   engine's own already-existing, shared `helpers.getFocusableInfo` for
 *   the focusability half. Both signals (global-attribute presence,
 *   focusability) are static, declarative markup facts with no live-DOM/
 *   hydration risk, unlike e.g. `aria-checked-state-mismatch`'s DOM-
 *   property comparison.
 * - Fixed 2026-07-30: a roleless-but-focusable descendant's message and
 *   `data.details.attr` used to always claim "carries tabindex" even when
 *   the element had no tabindex attribute at all and was only focusable
 *   natively (e.g. an <a href> link). `helpers.getFocusableInfo`'s
 *   `mechanism` field ('tabindex' | 'native' | ...) is now used to tell
 *   the two apart, with a distinct `nativeFocusable` attr/message for the
 *   native case. Found via a real Angular app: a routerLink <a> inside a
 *   role="list" was reported as "carries tabindex" though the rendered
 *   markup had no such attribute.
 * - Recursion stops at the first non-transparent role boundary, same as
 *   that reference engine: a nested container with its own real role (e.g. a
 *   <div role="listbox"> inside a menubar) is evaluated as ITS OWN
 *   owned-role entry against the outer container (and, separately, gets
 *   its own applicability pass as a container in the same rule run) —
 *   its descendants are never misattributed to the outer container.
 * - Fixed 2026-07-31: child-role resolution used `ariaHelpers.getExplicitRole`
 *   (explicit role="" attribute only), unlike aria-required-children's
 *   descendant matching which uses `ariaHelpers.getContainmentRole` (explicit
 *   role, falling back to the native-tag map — li/tr/td/th/tbody/ul/ol/
 *   table/select/input[type=radio] — see that helper's own header comment).
 *   A bare `<li>` with no role="" attribute — the common CSS-reset
 *   workaround `<ul role="list"><li>...</li></ul>` that getContainmentRole
 *   exists specifically to handle — was therefore read as roleless here,
 *   making it structurally transparent: the walk recursed straight through
 *   the listitem boundary into its subtree and could report a focusable
 *   descendant several levels down as a disallowed owned child of the list,
 *   instead of stopping at the (implicit) listitem the way
 *   aria-required-children already does. Switched to getContainmentRole so
 *   both rules resolve an owned child's role identically. This is a general
 *   fix, not list/listitem-specific: it applies to every container role in
 *   REQUIRED_OWNED_ROLES whose native-tag counterpart the child map covers
 *   (e.g. a bare `<tr>`/`<td>` under a role="table"/"grid"/"row" container
 *   with no explicit role="" was subject to the same flattening bug). Found
 *   via a real Angular Material-style component library: an `<a routerlink>`
 *   several DOM levels inside a bare `<li>` under `<ul role="list">` was
 *   reported as an unallowed owned child of the list.
 * - Gated on isAccTreeEligible for the container itself, matching the fix
 *   applied to aria-required-children (see that rule's header): the
 *   original "not gated" note here just cited that rule's reasoning
 *   without re-deriving it, and that reasoning turned out not to hold —
 *   a closed dialog/flyout menu populated on open is a real false-positive
 *   shape. In this rule specifically the descendant-level eligibility gate
 *   already made the container-level gate redundant for correctness (an
 *   ineligible container has no eligible descendants either, so `owned`
 *   ends up empty and nothing fails) — but skipping the container up front
 *   reports `notApplicable` instead of a vacuous `pass`, which is the more
 *   accurate outcome for a container that isn't currently exposed at all,
 *   and avoids walking a subtree whose result is already known.
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
    "Checks that every accessible-tree-owned child of a container role (list, listbox, menu, menubar, radiogroup, rowgroup, table, grid, treegrid, tablist, tree, row) has one of that role's allowed owned roles — the same set as its required owned roles.",
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

  // The WAI-ARIA "Global States and Properties" set (same list as
  // aria-allowed-attr.js's GLOBAL_ATTRS — duplicated, not imported, since
  // runInPage must be self-contained per scripts/build-core.js). A
  // roleless descendant carrying any of these is a real accessible-tree
  // node a widely-used reference engine's getOwnedRoles also flags, not a transparent wrapper.
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

  const MAX_DEPTH = 40;

  // Collects this container's owned-role entries, pruning role="none"/
  // "presentation" and required-matching "group"/"rowgroup" wrappers as
  // transparent (recursing through them), and stopping at the first
  // non-transparent role boundary otherwise — see header comment. A
  // roleless descendant is ALSO a non-transparent boundary (an owned
  // entry with role: null, which can never satisfy a required-role set)
  // when it carries a global aria-* attribute or is focusable — matches
  // a widely-used reference engine's own getOwnedRoles exactly (see header comment).
  // kidRole comes from getContainmentRole, not getExplicitRole (see header
  // comment's 2026-07-31 fix): "roleless" here means neither an explicit
  // role="" NOR one of the native containment tags (li, tr, td, ...), so a
  // bare <li>/<tr>/... is a real listitem/row boundary, not a transparent
  // wrapper the walk should pass through.
  function collectOwnedRoles(el, requiredSet, out, depth) {
    if (depth > MAX_DEPTH) return;
    const kids = el.children ? Array.prototype.slice.call(el.children) : [];
    for (const kid of kids) {
      if (!kid || kid.nodeType !== 1) continue;
      if (!isEligibleAcc(kid)) continue;

      const kidRole = ariaHelpers.getContainmentRole(kid);
      const isPresentational = kidRole === 'presentation' || kidRole === 'none';
      const isTransparentGroup =
        (kidRole === 'group' || kidRole === 'rowgroup') && requiredSet.has(kidRole);

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

      if (!kidRole || isPresentational || isTransparentGroup) {
        collectOwnedRoles(kid, requiredSet, out, depth + 1);
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

    const requiredSet = new Set(requiredOwned);
    const owned = [];
    collectOwnedRoles(el, requiredSet, owned, 0);

    for (const entry of owned) {
      if (entry.role && requiredSet.has(entry.role)) continue;

      const stableSelector = helpers.buildSelector ? helpers.buildSelector(entry.el) : 'html';
      const html = helpers.getOuterHtmlSnippet
        ? helpers.getOuterHtmlSnippet(entry.el)
        : entry.el.outerHTML || '';
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
        hint = `Remove or change this role so it matches one of the container's allowed owned roles (${requiredOwned.join(', ')}), or move this element outside the ${role} container.`;
        summaryKey = 'ariaProhibitedChildren_summary_fail';
        hintKey = 'ariaProhibitedChildren_hint_fail';
      }

      occurrences.push({
        selector: stableSelector,
        html,
        summary,
        hint,
        i18n: {
          summaryKey,
          hintKey,
          params: isRoleless
            ? { attr: entry.attr, containerRole: role }
            : { childRole: entry.role, containerRole: role, allowedRoles: requiredOwned.join(', ') }
        },
        data: {
          details: {
            reasonCode: isRoleless ? 'ARIA_PROHIBITED_CHILD_ROLELESS' : 'ARIA_PROHIBITED_CHILD',
            childRole: entry.role,
            attr: entry.attr,
            containerRole: role,
            containerSelector,
            allowedOwnedRoles: requiredOwned
          }
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
      severity: rule.defaultSeverity || 'moderate',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
