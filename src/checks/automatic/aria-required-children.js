/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check aria-required-children
 * @atomic true
 * @summary Container roles that require specific owned elements must contain at least one
 * @standard WCAG 2.2
 * @sc 1.3.1
 * @applicability
 *   Applies to elements with an explicit, valid, non-abstract role that is
 *   also one of the container roles with a documented "required owned
 *   elements" entry (list, listbox, menu, menubar, radiogroup, rowgroup,
 *   table, grid, treegrid, tablist, tree, row).
 *   The container needs its explicit role, but an owned element may take its
 *   role from a custom element's ElementInternals
 *   (this.attachInternals().role), as an owned native element takes its
 *   tag's.
 * @expectation
 *   At least one descendant, or one aria-owns-referenced element, has one
 *   of the acceptable owned roles for that container role. A container
 *   with none that owns text, directly or through generic wrappers (a
 *   <span> or <div> with no role), FAILS: the text sits where its required
 *   children belong, as in a list whose items have no role (ACT bc4a75,
 *   Failed Example 1). One that owns nothing is asked about (CANTTELL): it
 *   conveys nothing false -- an empty role="list" is announced as a list
 *   with no items, which is what it is, and a script may fill it. Whether the content a container does own is VALID is
 *   aria-prohibited-children's decision, and that rule still fails, so a
 *   genuinely misdescribed structure (a role="button" among list items, a
 *   tablist of plain buttons) is caught with the same strength as before.
 *   The native-HTML equivalents already work this way: nothing in this
 *   ruleset fails an empty <ul>, and list-children-valid judges only the
 *   children that exist.
 * @reports
 *   - `role`: the container's role.
 *   - `requiredOwnedRoles`: the roles it needs at least one child with.
 *     Each item is a role name.
 * @reason-codes
 *   - `ARIA_REQUIRED_CHILD_TEXT_ONLY` (fail): a container role owns text,
 *     directly or through generic wrappers, and none of the roles it
 *     requires, such as a list whose items have no role.
 *     Basis: WAI-ARIA 1.2 required owned elements (MUST); ACT bc4a75; WCAG
 *     1.3.1.
 *   - `ARIA_REQUIRED_CHILD_MISSING` (cantTell): a container role owns none of
 *     the roles it requires, and no text either, such as an empty list.
 *     It leans pass when the container holds no element at all, and fail
 *     when it holds content with a name, such as an image with alt text or a
 *     button, none of it with a required role.
 *     Basis: WAI-ARIA 1.2 required owned elements (MUST); ACT bc4a75; WCAG
 *     1.3.1 (not settled).
 * @implementation-notes
 * - Scoped to REQUIRED_OWNED_ROLES in src/core/aria-helpers.js
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
 *   containers with their own differing role, favoring simplicity, this
 *   can only under-report (recall), never over-report (fail integrity).
 * - "At least one required child exists" is the whole of this rule's
 *   decision. Whether every owned child is ALLOWED is
 *   aria-prohibited-children's, and that rule does walk the owned graph
 *   exclusively, with group/rowgroup transparency. ACT bc4a75 asks both
 *   questions at once, which is why the mapping lists the two rules as a
 *   family: read on its own, this rule looks like it under-reports a
 *   container mixing valid and invalid children, and the sibling is what
 *   catches it.
 * - Gated on isIncludedInAccessibilityTree for the container itself (ACT
 *   scopes the rule to elements included in the accessibility tree, so
 *   hidden content stays out even where an aria-labelledby uses its text):
 *   unlike this
 *   file's sibling attribute/role-validity checks (e.g. aria-roles-valid),
 *   "does this container currently have a required child" is not a fact
 *   that stays fixed once written, it is routinely filled in by the same
 *   script/interaction that reveals the container (a closed flyout menu
 *   or <dialog> populated on open). Flagging it while the container isn't
 *   currently exposed to the accessibility tree is a false positive; such
 *   a container is skipped entirely (does not count toward applicability),
 *   matching the pattern already used by this engine's accessible-name
 *   rules (svg-text-alternative-present, iframe-name-present, ...).
 * - Also honors the WAI-ARIA spec's own explicit escape hatch: "When a
 *   widget is missing required owned elements due to script execution or
 *   loading, authors MUST mark a containing element with aria-busy equal
 *   to true." A container carrying aria-busy="true" is skipped the same
 *   way, only the exact string "true" counts (absent/"false" do not).
 * - Descendant search tries a fast native querySelectorAll(CANDIDATE_
 *   SELECTOR) first (covers the light-DOM-only common case with no added
 *   cost); only when that finds nothing AND the container has a <slot>
 *   anywhere in its subtree does it fall back to a composed-tree walk that
 *   expands <slot> elements via assignedElements({flatten:true}). Plain
 *   querySelectorAll only sees a <slot>'s unrendered fallback content, never
 *   what's actually distributed into it. Scoped to slot
 *   expansion only, not a general "also descend into any nested custom
 *   element's own shadow root" walk, no known case needs that yet.
 */

const id = 'aria-required-children';

const meta = {
  title: 'Container roles must own at least one required child role',
  description:
    'Checks that container roles with a documented "required owned elements" entry (list, listbox, menu, radiogroup, table, grid, tablist, tree, row, ...) contain at least one descendant or aria-owns-referenced element with an acceptable owned role.',
  i18n: {
    titleKey: 'ariaRequiredChildren_title',
    descriptionKey: 'ariaRequiredChildren_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag131', 'aria', 'structure', 'atomic', 'automatic'],
  wcagSc: ['1.3.1'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.3.1',
      title: 'Info and Relationships',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'moderate',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'medium',
  coverage: { facetsBySc: { '1.3.1': ['aria-role-required-owned-children'] } },
  // How a person checks each undecided finding: shown with it as
  // howToCheck (docs/OUTPUT_SCHEMA.md).
  review: {
    ARIA_REQUIRED_CHILD_MISSING: {
      steps: [
        'Inspect the container the report names and note its role and the child roles it needs (such as listitem for list, option for listbox).',
        'Look at what it shows on screen: check whether it is empty or holds images, icons or controls.',
        'Interact with the page (open menus, load results) and check whether children with the required role are added later.',
        "Open the Accessibility pane in the browser's developer tools and check the roles of anything it holds."
      ],
      passWhen:
        'The container is empty and conveys nothing, or the items it shows carry the required role.',
      failWhen:
        'It shows items (images, icons, controls) that lack the required child role, so the structure is not conveyed, which fails WCAG 1.3.1 (ACT bc4a75).'
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

  function isEligibleAcc(el) {
    // ACT scopes these rules to elements included in the accessibility
    // tree: hidden content stays out even where an aria-labelledby uses its
    // text, or it is focusable (aria-hidden-focus asks about that).
    const fn =
      helpers && typeof helpers.isIncludedInAccessibilityTree === 'function'
        ? helpers.isIncludedInAccessibilityTree
        : helpers && typeof helpers.isAccTreeEligible === 'function'
          ? helpers.isAccTreeEligible
          : null;
    if (!fn) return true;
    try {
      const r = fn(el, ctx);
      if (typeof r === 'boolean') return r;
      return !!(r && r.eligible);
    } catch {
      return true;
    }
  }

  function isMarkedBusy(el) {
    const v = dom.getAttribute(el, 'aria-busy');
    return v != null && String(v).trim().toLowerCase() === 'true';
  }

  // Candidate selector for descendant scanning: explicit role attributes,
  // plus every native tag ariaHelpers.getContainmentRole() recognizes
  // (kept in sync with aria-helpers.js NATIVE_CONTAINMENT_ROLE_BY_ELEMENT).
  // Declared inside runInPage, see scripts/build-core.js header
  // ("runInPage MUST be self-contained").
  const CANDIDATE_SELECTOR =
    '[role], li, option, tr, td, th, thead, tbody, tfoot, ul, ol, table, select, input[type="radio"]';

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('[role]')
    : helpers.queryAll('[role]');

  const occurrences = [];
  const fails = [];

  // Whether `node` owns text directly or through generic wrappers: a text
  // node with more than whitespace, or an element with no role of its own
  // (or role generic, none or presentation) that does. Hidden elements, and
  // elements with another role, don't count.
  const NO_ROLE = ['', 'generic', 'none', 'presentation'];
  function ownsBareText(node, depth) {
    if (depth > 50) return false;
    for (const child of dom.childNodes(node) || []) {
      const type = dom.nodeType(child);
      if (type === 3) {
        if (String(dom.nodeValue(child) || '').trim()) return true;
        continue;
      }
      if (type !== 1) continue;
      if (!isEligibleAcc(child)) continue;
      let childRole;
      try {
        childRole =
          ariaHelpers.getContainmentRole(child) || ariaHelpers.getNativeRoleForElement(child) || '';
      } catch {
        childRole = 'unknown';
      }
      if (!NO_ROLE.includes(childRole)) continue;
      if (ownsBareText(child, depth + 1)) return true;
    }
    return false;
  }
  let applicableCount = 0;

  // Which way a container with none of its required children points: one
  // that holds no element at all (no shadow root, nothing owned) conveys no
  // items, right or wrong; one that holds named content (an image with alt
  // text, a button, a labelled control) shows items that lack the role.
  function leanFor(el) {
    const ownsAttr = String(dom.getAttribute(el, 'aria-owns') || '').trim();
    let shadow = null;
    try {
      shadow = dom.shadowRoot(el);
    } catch {}
    if (dom.childElementCount(el) === 0 && !ownsAttr && !shadow) {
      return {
        toward: 'pass',
        why: 'The container holds no elements, so it conveys no items, right or wrong.',
        signals: [{ signal: 'child-element-count', value: 0 }],
        caution: 'A script may fill it later with items that lack the required role.',
        i18n: {
          whyKey: 'ariaRequiredChildren_lean_why_empty',
          cautionKey: 'ariaRequiredChildren_lean_caution_empty'
        }
      };
    }
    let named = 0;
    try {
      const all = dom.querySelectorAll(el, '*');
      for (let i = 0; i < all.length && i < 500 && !named; i++) {
        const d = all[i];
        if (!isEligibleAcc(d)) continue;
        const info = helpers.getAccessibleNameInfo(d, ctx);
        if (info && String(info.value || '').trim()) named += 1;
      }
    } catch {}
    if (!named) return null;
    return {
      toward: 'fail',
      why: 'The container holds content with a name, such as an image or a control, but none of it has a role the container requires.',
      signals: [{ signal: 'named-descendants', value: true }],
      caution:
        'aria-prohibited-children judges content that has a role of its own; this is the same structure seen from the container.',
      i18n: {
        whyKey: 'ariaRequiredChildren_lean_why_namedContent',
        cautionKey: 'ariaRequiredChildren_lean_caution_namedContent'
      }
    };
  }

  // Composed-tree descendant walk: el.querySelectorAll only sees the raw
  // light-DOM subtree, so a container whose real owned children are
  // distributed via <slot> (e.g. a shadow-DOM role="list" wrapping
  // <slot></slot>, with the actual role="listitem" elements living in the
  // light DOM and projected in) would never find them there, same class
  // of bug as aria-required-parent's ancestor search, just in the opposite
  // (descendant) direction.
  //
  // Scoped to slot expansion only, does NOT separately
  // descend into an unrelated nested custom element's own shadow root
  // (e.g. a <my-widget> child with no <slot> involvement at all). That's a
  // qualitatively different question (does an arbitrary component's own
  // internal structure count as this container's "owned children"?) with
  // no known case driving it yet; slot projection is the shape that
  // actually comes up.
  // An element's child elements by sibling links, not el.children: in jsdom
  // that collection stays live once read, and each later change under a
  // large parent (a list of thousands of items) rebuilds it.
  function childElementsOf(el) {
    const out = [];
    for (let c = el ? dom.firstElementChild(el) : null; c; c = dom.nextElementSibling(c))
      out.push(c);
    return out;
  }

  function collectComposedDescendants(node, out, seen, limit) {
    if (!node || !dom.firstElementChild(node)) return;
    for (const child of childElementsOf(node)) {
      if (out.length >= limit) return;
      if (seen.has(child)) continue;

      if (
        (dom.tagName(child) || '').toLowerCase() === 'slot' &&
        typeof dom.get(child, 'assignedElements') === 'function'
      ) {
        let assigned;
        try {
          assigned = dom.assignedElements(child, { flatten: true }) || [];
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
    if (!el || !dom.get(el, 'getAttribute')) continue;

    const role = ariaHelpers.getExplicitRole(el);
    if (!role || !ariaHelpers.isValidConcreteRole(role)) continue; // aria-roles-valid's concern

    const requiredOwned = ariaHelpers.getRequiredOwnedRoles(role);
    if (!requiredOwned || !requiredOwned.length) continue;

    if (!isEligibleAcc(el)) continue; // not currently exposed to the accessibility tree
    if (isMarkedBusy(el)) continue; // author has signaled transient incompleteness per WAI-ARIA

    applicableCount += 1;

    const ownedSet = new Set(requiredOwned);
    let found = false;

    // Fast path first: native querySelectorAll over the curated candidate
    // selector. Covers the overwhelming majority of containers (no shadow
    // DOM involved at all) with zero added cost.
    let descendants;
    try {
      descendants = dom.querySelectorAll(el, CANDIDATE_SELECTOR);
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

    // A custom element inside may own the role through its internals, which
    // the candidate selector can't name.
    if (!found && typeof helpers.getInternalsRoleElements === 'function') {
      for (const { el: cand, role: candRole } of helpers.getInternalsRoleElements()) {
        if (cand !== el && ownedSet.has(candRole) && dom.contains(el, cand)) {
          found = true;
          break;
        }
      }
    }

    // Slow path only when the fast path found nothing AND there's an actual
    // <slot> somewhere in the subtree to expand, bounds the extra cost to
    // exactly the containers that could possibly need it.
    if (!found) {
      let hasSlot;
      try {
        hasSlot = !!dom.querySelector(el, 'slot');
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
          if (!cand || !dom.get(cand, 'getAttribute')) continue;
          const candRole = ariaHelpers.getContainmentRole(cand);
          if (candRole && ownedSet.has(candRole)) {
            found = true;
            break;
          }
        }
      }
    }

    if (!found) {
      const ownsAttr = dom.getAttribute(el, 'aria-owns');
      if (ownsAttr && helpers.resolveIdRefs) {
        const resolved = helpers.resolveIdRefs(ownsAttr, ctx, { maxRefs: 50 }, el);
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

    // Text the container owns itself, or through generic wrappers (a <span>
    // with no role), is content in place of its required children: a list
    // whose items have no role (ACT bc4a75, Failed Example 1). It fails. An
    // element with a role of its own is aria-prohibited-children's to judge,
    // and an empty container is asked about, as before.
    if (ownsBareText(el, 0)) {
      fails.push(
        helpers.reportOccurrence(el, {
          summary:
            'This container role holds content, but none of it has a role the container requires.',
          hint: 'Give each item the role the container needs, such as role="listitem" in a list.',
          occurrenceOutcome: 'fail',
          i18n: {
            summaryKey: 'ariaRequiredChildren_summary_fail_textOnly',
            hintKey: 'ariaRequiredChildren_hint_fail_textOnly',
            params: { role, requiredRoles: requiredOwned.join(', ') }
          },
          data: {
            details: {
              reasonCode: 'ARIA_REQUIRED_CHILD_TEXT_ONLY',
              role,
              requiredOwnedRoles: requiredOwned
            }
          }
        })
      );
      continue;
    }

    const lean = leanFor(el);
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: 'This container role has no owned child with a required role.',
        hint: 'Add a child element with one of these roles, or reference one with aria-owns.',
        i18n: {
          summaryKey: 'ariaRequiredChildren_summary_fail',
          hintKey: 'ariaRequiredChildren_hint_fail',
          params: { role, requiredRoles: requiredOwned.join(', ') }
        },
        uncertainty: {
          code: 'spec-only',
          needed:
            'Whether this container is legitimately empty, or holds items that never got their role.',
          evidence: {
            role,
            requiredOwnedRoles: requiredOwned,
            childElementCount:
              typeof dom.childElementCount(el) === 'number' ? dom.childElementCount(el) : null
          }
        },
        ...(lean ? { lean } : {}),
        data: {
          details: {
            reasonCode: 'ARIA_REQUIRED_CHILD_MISSING',
            role,
            requiredOwnedRoles: requiredOwned
          }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  const resolved = helpers.resolveTieredOutcome(
    fails,
    occurrences,
    rule.defaultSeverity || 'moderate'
  );
  return { ruleId: rule.ruleId, ...resolved };
}

module.exports = { id, meta, runInPage };
