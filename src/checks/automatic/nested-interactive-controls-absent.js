/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check nested-interactive-controls-absent
 * @atomic true
 * @summary An interactive control must not contain another interactive control
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to elements matching the interactive-control set (native
 *   a[href], button, input (not hidden), select, textarea; or an explicit
 *   ARIA widget role: button, link, checkbox, radio, switch, tab, textbox,
 *   combobox, listbox, menuitem, menuitemcheckbox, menuitemradio, option,
 *   slider, spinbutton, searchbox, treeitem, taken from the role
 *   attribute's first token naming a known role, matched in any case, so
 *   role="foo button" and role="BUTTON" count and role="none button" does
 *   not). The container is applicable regardless of whether it is itself
 *   focusable, focusability is only used to decide whether a *descendant*
 *   nests an interactive control.
 * @expectation
 *   The element does not contain, as a descendant, another *operable*
 *   interactive control (e.g. a <button> wrapping a <select>, or a link
 *   containing a checkbox). Nested interactive controls are not reliably
 *   announced or operable via assistive technology, activating the outer
 *   control and the inner one become ambiguous, and some AT only exposes
 *   one of the two.
 * @reports
 *   - `nestedElements`: the controls nested inside this one, one tag name
 *     per control.
 * @implementation-notes
 * - A descendant counts as a nested interactive control only when it is both
 *   (a) a native interactive element or an explicit ARIA widget role and
 *   (b) operable: exposed to the accessibility tree and platform-focusable
 *   (natively focusable, or focusable via tabindex), per
 *   helpers.getFocusableInfo, which accounts for contenteditable, :disabled,
 *   inert, and invalid/negative tabindex.
 * - A widget-role child that its container drives rather than exposes as its
 *   own focus target creates no operability ambiguity and does not count:
 *   a role="option" inside a listbox/combobox, a role="tab" inside a tablist,
 *   a role="treeitem" inside a tree, a role="menuitem" inside a menu, or a
 *   role="radio" inside a radiogroup. Composites manage such children with one
 *   of two focus models, and both are exempt: aria-activedescendant (the child
 *   has no tabindex and is not focusable) and roving tabindex (the active
 *   child carries tabindex="0" and the rest tabindex="-1"). Under roving
 *   tabindex the owned child IS platform-focusable, so focusability alone
 *   cannot be the discriminator; membership in the container's owned-child set
 *   is what exempts it. A control that is itself focusable while nested in a
 *   control it does NOT belong to still counts: a <button> inside an <a href>,
 *   a focusable role="button" inside a link, an editable field inside a
 *   control, or an orphan role="option" with no owning listbox/combobox.
 * - A disabled native control (<button disabled>, <input disabled>) and an
 *   inert descendant are not focusable, so they do not nest an interactive
 *   control; a display:none or aria-hidden descendant is not exposed to AT
 *   and is likewise out of scope. aria-disabled leaves an element focusable,
 *   so it still counts.
 * - Occurrences report the outer (containing) control, the fixable unit
 *   ("move the nested control outside this element"), not the descendant.
 * - Only the shallowest operable descendants are attributed to a container.
 *   In a chain A > B > C where all three are operable, A is reported for B
 *   and B for C; A is not reported for C, whose nesting belongs to its
 *   nearest operable ancestor B.
 */

const id = 'nested-interactive-controls-absent';

const meta = {
  title: 'Interactive controls must not be nested',
  description:
    'Checks that an interactive control (link, button, form control, or ARIA widget role) does not contain another interactive control.',
  i18n: {
    titleKey: 'nestedInteractiveControlsAbsent_title',
    descriptionKey: 'nestedInteractiveControlsAbsent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'structure', 'atomic', 'automatic'],
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
  coverage: { facetsBySc: { '4.1.2': ['nested-interactive-controls-absent'] } }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  // Declared inside runInPage, see scripts/build-core.js header
  // ("runInPage MUST be self-contained").
  const NATIVE_INTERACTIVE_SELECTOR = [
    'a[href]',
    'button',
    'input:not([type="hidden"])',
    'select',
    'textarea'
  ].join(', ');
  const WIDGET_ROLES = [
    'button',
    'link',
    'checkbox',
    'radio',
    'switch',
    'tab',
    'textbox',
    'combobox',
    'listbox',
    'menuitem',
    'menuitemcheckbox',
    'menuitemradio',
    'option',
    'slider',
    'spinbutton',
    'searchbox',
    'treeitem'
  ];
  const WIDGET_ROLE_SET = new Set(WIDGET_ROLES);
  // role is a fallback list matched in any case, so select by token
  // (case-insensitive) and keep only elements whose resolved role is a
  // widget role (matchesInteractive): role="link button" is a link.
  const INTERACTIVE_SELECTOR = [NATIVE_INTERACTIVE_SELECTOR]
    .concat(WIDGET_ROLES.map((r) => `[role~="${r}" i]`))
    .join(', ');

  const isAccTreeEligible =
    helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;
  const getFocusableInfo =
    helpers && typeof helpers.getFocusableInfo === 'function' ? helpers.getFocusableInfo : null;

  function isEligible(node) {
    if (!isAccTreeEligible) return true;
    try {
      const r = isAccTreeEligible(node, ctx);
      return !!(r && r.eligible);
    } catch {
      return true;
    }
  }

  function matchesInteractive(node) {
    return !!(
      node &&
      dom.nodeType(node) === 1 &&
      typeof dom.get(node, 'matches') === 'function' &&
      (dom.matches(node, NATIVE_INTERACTIVE_SELECTOR) || WIDGET_ROLE_SET.has(getExplicitRole(node)))
    );
  }

  // A composite widget owns children of a fixed role and drives their focus
  // itself (via roving tabindex or aria-activedescendant). The roving-tabindex
  // model gives the active child tabindex="0" and the rest tabindex="-1", so
  // the owned children ARE platform-focusable even though the container, not
  // the child, is the operable unit. Such a child is part of the composite,
  // not a control nested inside another control, so it must not be reported
  // regardless of its tabindex. The map is keyed by the child role and lists
  // the container roles that legitimately own it.
  const COMPOSITE_CHILD_CONTAINERS = {
    option: ['listbox', 'combobox'],
    tab: ['tablist'],
    treeitem: ['tree'],
    menuitem: ['menu', 'menubar'],
    menuitemcheckbox: ['menu', 'menubar'],
    menuitemradio: ['menu', 'menubar'],
    radio: ['radiogroup']
  };

  // The resolved explicit role: the first token naming a known role,
  // lower-cased, or '' when none does (role is a fallback list).
  function getExplicitRole(node) {
    if (!node || dom.nodeType(node) !== 1) return '';
    return helpers.aria.getExplicitRole(node);
  }

  function parentElementOf(node) {
    if (!node) return null;
    if (dom.parentElement(node)) return dom.parentElement(node);
    const p = dom.parentNode(node);
    return p && dom.nodeType(p) === 1 ? p : null;
  }

  // True when `node` is an owned child of a composite widget: its role is a
  // composite-child role and a matching container role is present on one of
  // its ancestors. The roving tab stop (tabindex="0") such a container places
  // on its active child does not make that child an independently nested
  // control.
  function isManagedCompositeChild(node) {
    const role = getExplicitRole(node);
    const containers = COMPOSITE_CHILD_CONTAINERS[role];
    if (!containers) return false;
    let p = parentElementOf(node);
    while (p && dom.nodeType(p) === 1) {
      if (containers.indexOf(getExplicitRole(p)) !== -1) return true;
      p = parentElementOf(p);
    }
    return false;
  }

  // Operable = a native-interactive / ARIA-widget element that is exposed to
  // the accessibility tree and platform-focusable. A widget-role element with
  // no independent focus (e.g. a role="option" with no tabindex, driven by
  // its container via roving tabindex or aria-activedescendant) is not
  // operable and does not nest an interactive control. When no focus model is
  // available, role membership alone qualifies. (Composite-owned children are
  // handled earlier as attribution boundaries in collectNestedOperable, so
  // they never reach here.)
  function isOperableInteractive(node) {
    if (!matchesInteractive(node)) return false;
    if (!isEligible(node)) return false;
    if (!getFocusableInfo) return true;
    try {
      const info = getFocusableInfo(node, ctx);
      return !!(info && info.focusable);
    } catch {
      return true;
    }
  }

  // Shallowest operable interactive descendants of `root`. Traversal stops at
  // each counted node instead of descending into it, so a control nested
  // inside another operable control is attributed to its nearest operable
  // ancestor rather than to every enclosing container. Eligibility is applied
  // per node during the walk, so hidden or aria-hidden subtrees drop out.
  //
  // The walk follows the flat tree, as the page renders it: a shadow host's
  // children are its shadow root's, and a <slot> stands for the elements
  // assigned to it (its fallback content when none is). So a <button>
  // around a <slot> nests the link a page slots into it.
  // Sibling links, not node.children, which in jsdom stays live once read
  // and is rebuilt on every later change under a large parent.
  function flatChildren(node) {
    if (!node) return [];
    let assigned = null;
    if (
      String(dom.localName(node)) === 'slot' &&
      typeof dom.get(node, 'assignedElements') === 'function'
    ) {
      try {
        assigned = dom.assignedElements(node, { flatten: true });
      } catch {
        assigned = null;
      }
    }
    if (assigned && assigned.length) return assigned;
    const from = dom.shadowRoot(node) || node;
    const out = [];
    for (let c = dom.firstElementChild(from); c; c = dom.nextElementSibling(c)) out.push(c);
    return out;
  }

  function collectNestedOperable(root) {
    const out = [];
    const stack = flatChildren(root).reverse();
    if (!stack.length) return out;
    let guard = 0;
    while (stack.length && guard++ < 200000) {
      const node = stack.pop();
      if (node && dom.nodeType(node) === 1) {
        // A composite-owned child (option in a listbox/combobox, tab in a
        // tablist, ...) is not a nested interactive control: its container
        // owns it and drives its focus (roving tabindex or
        // aria-activedescendant). Treat it as an attribution boundary, do not
        // count it, and do not descend past it. Any control nested
        // inside it is attributed to the child itself (examined as its own
        // container in the main loop), keeping the report at the nearest
        // interactive ancestor rather than bubbling up to the composite.
        if (isManagedCompositeChild(node)) continue;
        if (isOperableInteractive(node)) {
          out.push(node);
          continue; // do not descend into a counted control
        }
      }
      const kids = flatChildren(node);
      for (let i = kids.length - 1; i >= 0; i--) stack.push(kids[i]);
    }
    return out;
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(INTERACTIVE_SELECTOR)
    : helpers.queryAll(INTERACTIVE_SELECTOR);

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || dom.nodeType(el) !== 1) continue;
    // The token selector also matches e.g. role="none button" (role none).
    if (!matchesInteractive(el)) continue;
    if (!isEligible(el)) continue;

    applicableCount += 1;

    const nested = collectNestedOperable(el);
    if (!nested.length) continue;

    const nestedTags = nested.map((n) =>
      n && dom.tagName(n) ? dom.tagName(n).toLowerCase() : 'unknown'
    );
    const dedupedNestedTags = [...new Set(nestedTags)];

    const tag = dom.tagName(el).toLowerCase();

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: 'This interactive control contains one or more other interactive controls.',
        hint: 'Move the nested interactive control(s) outside this element; nested interactive controls are not reliably operable via assistive technology.',
        i18n: {
          summaryKey: 'nestedInteractiveControlsAbsent_summary_fail',
          hintKey: 'nestedInteractiveControlsAbsent_hint_fail',
          params: { element: tag, nestedElements: dedupedNestedTags.join(', ') }
        },
        data: {
          details: {
            reasonCode: 'NESTED_INTERACTIVE_CONTROL',
            element: tag,
            nestedElements: nestedTags
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
      severity: rule.defaultSeverity || 'serious',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
