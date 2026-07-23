'use strict';

/**
 * @check a11ycore-aria-required-children
 * @atomic true
 * @summary Container roles that require specific owned elements must contain at least one
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to elements with an explicit, valid, non-abstract role that is
 *   also one of the container roles with a documented "required owned
 *   elements" entry (list, listbox, menu, menubar, radiogroup, rowgroup,
 *   table, grid, treegrid, tablist, tree, row).
 * @expectation
 *   At least one descendant, or one aria-owns-referenced element, has one
 *   of the acceptable owned roles for that container role.
 * @implementation-notes
 * - Deliberately scoped to REQUIRED_OWNED_ROLES in src/core/aria-helpers.js
 *   (see that file's header for the conservative-scope rationale).
 * - Owned-role matching uses ariaHelpers.getContainmentRole, which combines
 *   explicit role="" attributes with a small, curated native-HTML-tag
 *   mapping (li, option, tr, td, th, ...). This avoids false positives on
 *   plain native markup under an explicitly-asserted container role, e.g.
 *   <ul role="list"><li>...</li></ul> (a common CSS-reset workaround where
 *   only the container gets an explicit role).
 * - Only one qualifying descendant/owned element is required (per
 *   WAI-ARIA "required owned elements": any one acceptable role satisfies
 *   the requirement); the full subtree is scanned without excluding nested
 *   containers with their own differing role, favoring simplicity — this
 *   can only under-report (recall), never over-report (fail integrity).
 * - Not gated on isAccTreeEligible: this is a static markup structural
 *   property.
 * - Descendant search tries a fast native querySelectorAll(CANDIDATE_
 *   SELECTOR) first (covers the light-DOM-only common case with no added
 *   cost); only when that finds nothing AND the container has a <slot>
 *   anywhere in its subtree does it fall back to a composed-tree walk that
 *   expands <slot> elements via assignedElements({flatten:true}) — plain
 *   querySelectorAll only sees a <slot>'s unrendered fallback content, never
 *   what's actually distributed into it. Deliberately scoped to slot
 *   expansion only, not a general "also descend into any nested custom
 *   element's own shadow root" walk — no confirmed real-world case needs
 *   that yet.
 */

const id = 'a11ycore-aria-required-children';

const meta = {
  title: 'Container roles must own at least one required child role',
  description: 'Checks that container roles with a documented "required owned elements" entry (list, listbox, menu, radiogroup, table, grid, tablist, tree, row, ...) contain at least one descendant or aria-owns-referenced element with an acceptable owned role.',
  i18n: {
    titleKey: 'a11ycore_ariaRequiredChildren_title',
    descriptionKey: 'a11ycore_ariaRequiredChildren_description'
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
  coverage: { facetsBySc: { '4.1.2': ['aria-role-required-owned-children'] } }
};

function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const ariaHelpers = helpers && helpers.aria ? helpers.aria : null;
  if (!ariaHelpers) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  // Candidate selector for descendant scanning: explicit role attributes,
  // plus every native tag ariaHelpers.getContainmentRole() recognizes
  // (kept in sync with aria-helpers.js NATIVE_CONTAINMENT_ROLE_BY_ELEMENT).
  // Declared inside runInPage — see scripts/build-core.js header
  // ("runInPage MUST be self-contained").
  const CANDIDATE_SELECTOR = '[role], li, option, tr, td, th, thead, tbody, tfoot, ul, ol, table, select, input[type="radio"]';

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('[role]', safeRoot) : helpers.queryAll('[role]', safeRoot);

  const occurrences = [];
  let applicableCount = 0;

  // Composed-tree descendant walk: el.querySelectorAll only sees the raw
  // light-DOM subtree, so a container whose real owned children are
  // distributed via <slot> (e.g. a shadow-DOM role="list" wrapping
  // <slot></slot>, with the actual role="listitem" elements living in the
  // light DOM and projected in) would never find them there — same class
  // of bug as aria-required-parent's ancestor search, just in the opposite
  // (descendant) direction. Found via Adobe Spectrum Web Components'
  // sp-sidenav-item: its shadow root's role="list" div owns its listitems
  // only through slot projection.
  //
  // Deliberately scoped to slot expansion only — does NOT separately
  // descend into an unrelated nested custom element's own shadow root
  // (e.g. a <my-widget> child with no <slot> involvement at all). That's a
  // qualitatively different question (does an arbitrary component's own
  // internal structure count as this container's "owned children"?) with
  // no confirmed real-world case driving it yet; slot projection is the
  // shape actually observed.
  function collectComposedDescendants(node, out, seen, limit) {
    if (!node || !node.children) return;
    for (const child of Array.from(node.children)) {
      if (out.length >= limit) return;
      if (seen.has(child)) continue;

      if ((child.tagName || '').toLowerCase() === 'slot' && typeof child.assignedElements === 'function') {
        let assigned = [];
        try {
          assigned = child.assignedElements({ flatten: true }) || [];
        } catch {
          assigned = [];
        }
        for (const a of assigned) {
          if (seen.has(a)) continue;
          seen.add(a);
          out.push(a);
          if (out.length >= limit) return;
          collectComposedDescendants(a, out, seen, limit);
          if (out.length >= limit) return;
        }
        continue; // a <slot>'s own childNodes are unrendered fallback content once something is assigned
      }

      seen.add(child);
      out.push(child);
      collectComposedDescendants(child, out, seen, limit);
    }
  }

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;

    const role = ariaHelpers.getExplicitRole(el);
    if (!role || !ariaHelpers.isValidConcreteRole(role)) continue; // aria-roles-valid's concern

    const requiredOwned = ariaHelpers.getRequiredOwnedRoles(role);
    if (!requiredOwned || !requiredOwned.length) continue;

    applicableCount += 1;

    const ownedSet = new Set(requiredOwned);
    let found = false;

    // Fast path first: native querySelectorAll over the curated candidate
    // selector, exactly as before this fix — covers the overwhelming
    // majority of containers (no shadow DOM involved at all) with zero
    // added cost.
    let descendants = [];
    try {
      descendants = el.querySelectorAll(CANDIDATE_SELECTOR);
    } catch {
      descendants = [];
    }
    for (const cand of descendants) {
      const candRole = ariaHelpers.getContainmentRole(cand);
      if (candRole && ownedSet.has(candRole)) {
        found = true;
        break;
      }
    }

    // Slow path only when the fast path found nothing AND there's an actual
    // <slot> somewhere in the subtree to expand — bounds the extra cost to
    // exactly the containers that could possibly need it.
    if (!found) {
      let hasSlot = false;
      try {
        hasSlot = !!el.querySelector('slot');
      } catch {
        hasSlot = false;
      }
      if (hasSlot) {
        const composed = [];
        try {
          collectComposedDescendants(el, composed, new Set(), 5000);
        } catch {
          // fall through with whatever was collected before the error
        }
        for (const cand of composed) {
          if (!cand || !cand.getAttribute) continue;
          const candRole = ariaHelpers.getContainmentRole(cand);
          if (candRole && ownedSet.has(candRole)) {
            found = true;
            break;
          }
        }
      }
    }

    if (!found) {
      const ownsAttr = el.getAttribute('aria-owns');
      if (ownsAttr && helpers.resolveIdRefs) {
        const resolved = helpers.resolveIdRefs(ownsAttr, ctx, { maxRefs: 50 });
        for (const ownedEl of resolved.refs || []) {
          const candRole = ariaHelpers.getContainmentRole(ownedEl);
          if (candRole && ownedSet.has(candRole)) {
            found = true;
            break;
          }
        }
      }
    }

    if (found) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    occurrences.push({
      selector: stableSelector,
      html,
      summary: 'This container role has no owned child with a required role.',
      hint: 'Add a descendant (or aria-owns-referenced element) with one of the required owned roles.',
      i18n: {
        summaryKey: 'a11ycore_ariaRequiredChildren_summary_fail',
        hintKey: 'a11ycore_ariaRequiredChildren_hint_fail',
        params: { role, requiredRoles: requiredOwned.join(', ') }
      },
      data: {
        details: { reasonCode: 'ARIA_REQUIRED_CHILD_MISSING', role, requiredOwnedRoles: requiredOwned }
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