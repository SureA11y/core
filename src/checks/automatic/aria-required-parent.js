'use strict';

/**
 * @check a11ycore-aria-required-parent
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
 * - Not gated on isAccTreeEligible: this is a static markup structural
 *   property.
 */

const id = 'a11ycore-aria-required-parent';

const meta = {
  title: 'Roles requiring a specific context role must be in that context',
  description: 'Checks that roles with a documented "required context role" entry (listitem, option, tab, treeitem, row, cell, ...) have an ancestor or aria-owns owner with an acceptable context role.',
  i18n: {
    titleKey: 'a11ycore_ariaRequiredParent_title',
    descriptionKey: 'a11ycore_ariaRequiredParent_description'
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
  coverage: { facetsBySc: { '4.1.2': ['aria-role-required-context-parent'] } }
};

function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const ariaHelpers = helpers && helpers.aria ? helpers.aria : null;
  if (!ariaHelpers) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  // Roles that may host a nested listitem/treeitem group without breaking
  // the required-context chain (verified against the reference engine 4.12.1's own
  // getMissingContext, which special-cases exactly these two roles via its
  // ownGroupRoles option).
  const GROUP_TRANSPARENT_FOR_ROLES = new Set(['listitem', 'treeitem']);

  // A real ancestor role — not "no role at all" and not the two roles that
  // strip an element from the accessibility tree's parent/child chain
  // entirely (presentation/none) — stops the search, matching the reference engine's
  // getMissingContext. This is stricter than "any ancestor with the right
  // role anywhere up the tree": the required-context relationship is about
  // the accessibility tree's actual PARENT, so an intervening ancestor with
  // its OWN distinct real role (e.g. a plain <li>'s native "listitem" role)
  // blocks the search even if a further-up ancestor has the correct role.
  // Found via a real page — Le Monde's review-carousel tablist, where each
  // <button role="tab"> sits inside a plain <li> (native listitem) inside
  // <ul role="tablist">: the reference engine correctly fails this (the tablist is never the
  // tab's accessible-tree parent, listitem is), which the old "walk every
  // ancestor" version here missed entirely.
  function getRealContextRole(el) {
    const role = ariaHelpers.getContainmentRole(el);
    if (!role || role === 'presentation' || role === 'none') return '';
    return role;
  }

  // Flat-tree ancestor walk (ctx.helpers.composedParent — assignedSlot wins
  // over parentNode, then shadow host). A slotted light-DOM element's real
  // rendered ancestor is whatever the shadow tree wraps its <slot> in (e.g.
  // a role="list" container), not its own light-DOM parentElement — found
  // via Adobe Spectrum Web Components' <sp-sidenav-item role="listitem">,
  // distributed via slot="descendant" into its parent's shadow root, which
  // wraps that slot in a <div role="list">. composedParent can return a
  // non-Element node (a ShadowRoot, nodeType 11) when climbing out of a
  // shadow tree that has no further light-DOM parent — skip those and keep
  // climbing rather than treating them as a (roleless) context.
  const getComposedParent = helpers && typeof helpers.composedParent === 'function'
    ? helpers.composedParent
    : function (n) { return n && n.parentElement ? n.parentElement : null; };

  function hasAcceptableAncestorContext(el, acceptableRoles, ownRole) {
    const allowsGroup = acceptableRoles.has('group');
    let cur = getComposedParent(el);
    let guard = 0;
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
        cur = getComposedParent(cur);
        continue;
      }
      return acceptableRoles.has(role);
    }
    return false;
  }

  function hasAcceptableOwnerContext(el, acceptableRoles) {
    const elId = el.getAttribute('id');
    const idTok = elId && String(elId).trim();
    if (!idTok) return false;

    const owners = helpers.queryAllSmart ? helpers.queryAllSmart('[aria-owns]', safeRoot) : helpers.queryAll('[aria-owns]', safeRoot);
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

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('[role]', safeRoot) : helpers.queryAll('[role]', safeRoot);

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;

    const role = ariaHelpers.getExplicitRole(el);
    if (!role || !ariaHelpers.isValidConcreteRole(role)) continue; // aria-roles-valid's concern

    const requiredContext = ariaHelpers.getRequiredContextRoles(role);
    if (!requiredContext || !requiredContext.length) continue; // no entry, or explicitly unconstrained

    applicableCount += 1;

    const acceptableRoles = new Set(requiredContext);
    const hasContext =
      hasAcceptableAncestorContext(el, acceptableRoles, role) ||
      hasAcceptableOwnerContext(el, acceptableRoles);

    if (hasContext) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    occurrences.push({
      selector: stableSelector,
      html,
      summary: 'This role requires a specific ancestor/owner context role, which was not found.',
      hint: 'Place this element inside (or aria-owns-reference it from) an element with an acceptable context role.',
      i18n: {
        summaryKey: 'a11ycore_ariaRequiredParent_summary_fail',
        hintKey: 'a11ycore_ariaRequiredParent_hint_fail',
        params: { role, requiredRoles: requiredContext.join(', ') }
      },
      data: {
        details: { reasonCode: 'ARIA_REQUIRED_PARENT_MISSING', role, requiredContextRoles: requiredContext }
      }
    });
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