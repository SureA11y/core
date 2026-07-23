'use strict';

/**
 * @check a11ycore-aria-prohibited-children
 * @atomic true
 * @summary Container roles must not own an accessible-tree child with a disallowed role
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to elements with an explicit, valid role that is one of the
 *   container roles with a documented "required owned elements" entry
 *   (the same REQUIRED_OWNED_ROLES table a11ycore-aria-required-children
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
 * - A distinct atomic decision from a11ycore-aria-required-children (see
 *   that rule): "does at least one required child exist" vs "is every
 *   owned child one of the allowed roles." the reference engine bundles both under
 *   one check (`aria-required-children`); this repo's "one rule = one
 *   normative decision" principle splits them, matching the established
 *   pattern elsewhere of a11y-core rules mapping many-to-one against a
 *   single the reference engine check (see scripts/cross-engine/rule-mapping.js).
 * - The "allowed owned roles" set is exactly REQUIRED_OWNED_ROLES — not
 *   a separately authored, broader list. Verified directly against
 *   the reference engine 4.12.1's own ariaRequiredChildren/getOwnedRoles algorithm
 *   (node_modules/the reference engine/its source): an owned element is only considered
 *   allowed if its role is literally in the container's required set;
 *   the reference engine does not define a superset "allowed but not required" list
 *   for this purpose. Found and verified via a real page (Red Cross's
 *   homepage: a <nav role="region"> nested inside a <ul role="menubar">
 *   through a role="none" <li> wrapper — a real violation the reference engine
 *   caught that a11ycore-aria-required-children's own scope (documented
 *   there as "can only under-report, never over-report") does not).
 * - Widened 2026-07-21 to also flag a ROLELESS descendant that has any
 *   global WAI-ARIA attribute or is focusable, matching the reference engine's own
 *   `getOwnedRoles` exactly (verified directly against its source,
 *   `node_modules/the reference engine/its source`: `hasGlobalAriaOrFocusable =
 *   !!globalAriaAttr || _isFocusable(vNode)` — such a descendant is
 *   pushed as an owned entry with `role: null`, which can never match a
 *   container's required-owned-roles set, so it's always "unallowed").
 *   Previously left out as riskier to replicate — re-evaluated given
 *   direct access to the reference engine's exact algorithm (not a guess) plus this
 *   engine's own already-existing, shared `helpers.getFocusableInfo` for
 *   the focusability half. Both signals (global-attribute presence,
 *   focusability) are static, declarative markup facts with no live-DOM/
 *   hydration risk, unlike e.g. `aria-checked-state-mismatch`'s DOM-
 *   property comparison.
 * - Recursion stops at the first non-transparent role boundary, same as
 *   the reference engine: a nested container with its own real role (e.g. a
 *   <div role="listbox"> inside a menubar) is evaluated as ITS OWN
 *   owned-role entry against the outer container (and, separately, gets
 *   its own applicability pass as a container in the same rule run) —
 *   its descendants are never misattributed to the outer container.
 * - Not gated on isAccTreeEligible for the container itself (matches
 *   a11ycore-aria-required-children: this is a static markup structural
 *   property), but descendants ARE skipped (subtree not walked further)
 *   when they fail accessible-tree eligibility (aria-hidden, display:
 *   none, inert, etc.) — an invisible descendant contributes nothing to
 *   the real accessibility tree the reference engine (and any AT) would see.
 */

const id = 'a11ycore-aria-prohibited-children';

const meta = {
  title: 'Container roles must not own a child with a disallowed role',
  description: 'Checks that every accessible-tree-owned child of a container role (list, listbox, menu, menubar, radiogroup, rowgroup, table, grid, treegrid, tablist, tree, row) has one of that role\'s allowed owned roles — the same set as its required owned roles.',
  i18n: {
    titleKey: 'a11ycore_ariaProhibitedChildren_title',
    descriptionKey: 'a11ycore_ariaProhibitedChildren_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'aria', 'structure', 'atomic', 'automatic'],
  wcagSc: ['4.1.2'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '4.1.2', title: 'Name, Role, Value', conformanceLevel: 'A' }
  ],
  defaultSeverity: 'moderate',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'medium',
  coverage: { facetsBySc: { '4.1.2': ['aria-role-owned-children-allowed'] } }
};

function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const ariaHelpers = helpers && helpers.aria ? helpers.aria : null;
  if (!ariaHelpers) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  function isEligibleAcc(el) {
    const fn = helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;
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
  // node the reference engine's getOwnedRoles also flags, not a transparent wrapper.
  const GLOBAL_ARIA_ATTRS = [
    'aria-atomic', 'aria-braillelabel', 'aria-brailleroledescription', 'aria-busy',
    'aria-controls', 'aria-current', 'aria-describedby', 'aria-description',
    'aria-details', 'aria-disabled', 'aria-dropeffect', 'aria-errormessage',
    'aria-flowto', 'aria-grabbed', 'aria-haspopup', 'aria-hidden', 'aria-invalid',
    'aria-keyshortcuts', 'aria-label', 'aria-labelledby', 'aria-live', 'aria-owns',
    'aria-relevant', 'aria-roledescription'
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
  // the reference engine's own getOwnedRoles exactly (see header comment).
  function collectOwnedRoles(el, requiredSet, out, depth) {
    if (depth > MAX_DEPTH) return;
    const kids = el.children ? Array.prototype.slice.call(el.children) : [];
    for (const kid of kids) {
      if (!kid || kid.nodeType !== 1) continue;
      if (!isEligibleAcc(kid)) continue;

      const kidRole = ariaHelpers.getExplicitRole(kid);
      const isPresentational = kidRole === 'presentation' || kidRole === 'none';
      const isTransparentGroup = (kidRole === 'group' || kidRole === 'rowgroup') && requiredSet.has(kidRole);

      if (!kidRole && !isPresentational) {
        const globalAttr = getGlobalAriaAttr(kid);
        let focusable = false;
        try {
          const fi = helpers && typeof helpers.getFocusableInfo === 'function' ? helpers.getFocusableInfo(kid, ctx) : null;
          focusable = !!(fi && fi.focusable);
        } catch {
          focusable = false;
        }
        if (globalAttr || focusable) {
          out.push({ el: kid, role: null, attr: globalAttr || 'tabindex' });
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

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('[role]', safeRoot) : helpers.queryAll('[role]', safeRoot);

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;

    const role = ariaHelpers.getExplicitRole(el);
    if (!role || !ariaHelpers.isValidConcreteRole(role)) continue;

    const requiredOwned = ariaHelpers.getRequiredOwnedRoles(role);
    if (!requiredOwned || !requiredOwned.length) continue;

    applicableCount += 1;

    const requiredSet = new Set(requiredOwned);
    const owned = [];
    collectOwnedRoles(el, requiredSet, owned, 0);

    for (const entry of owned) {
      if (entry.role && requiredSet.has(entry.role)) continue;

      const stableSelector = helpers.buildSelector ? helpers.buildSelector(entry.el) : 'html';
      const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(entry.el) : (entry.el.outerHTML || '');
      const containerSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';

      const isRoleless = !entry.role;
      const summary = isRoleless
        ? `This element has no explicit role but carries ${entry.attr}, making it a real accessible-tree node that is not an allowed owned child of the enclosing role="${role}" container.`
        : `This element has role="${entry.role}", which is not an allowed owned child of the enclosing role="${role}" container.`;
      const hint = isRoleless
        ? `Remove ${entry.attr} (or the role="${role}" container ownership), or give this element role="presentation"/"none" if it isn't meant to be its own accessible-tree node.`
        : `Remove or change this role so it matches one of the container's allowed owned roles (${requiredOwned.join(', ')}), or move this element outside the ${role} container.`;

      occurrences.push({
        selector: stableSelector,
        html,
        summary,
        hint,
        i18n: {
          summaryKey: isRoleless ? 'a11ycore_ariaProhibitedChildren_summary_fail_roleless' : 'a11ycore_ariaProhibitedChildren_summary_fail',
          hintKey: isRoleless ? 'a11ycore_ariaProhibitedChildren_hint_fail_roleless' : 'a11ycore_ariaProhibitedChildren_hint_fail',
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
    return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'moderate', occurrences };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
