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
 *   slider, spinbutton, searchbox, treeitem). The container is applicable
 *   regardless of whether it is itself focusable — focusability is only
 *   used to decide whether a *descendant* nests an interactive control.
 * @expectation
 *   The element does not contain, as a descendant, another *operable*
 *   interactive control (e.g. a <button> wrapping a <select>, or a link
 *   containing a checkbox). Nested interactive controls are not reliably
 *   announced or operable via assistive technology — activating the outer
 *   control and the inner one become ambiguous, and some AT only exposes
 *   one of the two.
 * @implementation-notes
 * - A descendant counts as a nested interactive control only when it is both
 *   (a) a native interactive element or an explicit ARIA widget role and
 *   (b) operable: exposed to the accessibility tree and platform-focusable
 *   (natively focusable, or focusable via tabindex), per
 *   helpers.getFocusableInfo, which accounts for contenteditable, :disabled,
 *   inert, and invalid/negative tabindex.
 * - Focusability, not role membership, is the discriminator. A widget-role
 *   child that the container drives rather than exposes as its own focus
 *   target carries no independent focus and creates no operability ambiguity:
 *   a role="option" inside a listbox/combobox, a role="tab" inside a tablist,
 *   a role="treeitem" inside a tree, a role="menuitem" inside a menu, or a
 *   role="radio" inside a radiogroup, each managed via roving tabindex or
 *   aria-activedescendant. A control that is itself focusable while nested in
 *   another control does count: a <button> inside an <a href>, a focusable
 *   role="button" inside a link, an editable field inside a control.
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
  const { helpers, rule } = ctx;

  // Declared inside runInPage — see scripts/build-core.js header
  // ("runInPage MUST be self-contained").
  const INTERACTIVE_SELECTOR = [
    'a[href]',
    'button',
    'input:not([type="hidden"])',
    'select',
    'textarea',
    '[role="button"]',
    '[role="link"]',
    '[role="checkbox"]',
    '[role="radio"]',
    '[role="switch"]',
    '[role="tab"]',
    '[role="textbox"]',
    '[role="combobox"]',
    '[role="listbox"]',
    '[role="menuitem"]',
    '[role="menuitemcheckbox"]',
    '[role="menuitemradio"]',
    '[role="option"]',
    '[role="slider"]',
    '[role="spinbutton"]',
    '[role="searchbox"]',
    '[role="treeitem"]'
  ].join(', ');

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
      node.nodeType === 1 &&
      typeof node.matches === 'function' &&
      node.matches(INTERACTIVE_SELECTOR)
    );
  }

  // Operable = a native-interactive / ARIA-widget element that is exposed to
  // the accessibility tree and platform-focusable. A widget-role element with
  // no independent focus (e.g. a role="option" with no tabindex, driven by
  // its container via roving tabindex or aria-activedescendant) is not
  // operable and does not nest an interactive control. When no focus model is
  // available, role membership alone qualifies.
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
  function collectNestedOperable(root) {
    const out = [];
    const top = root && root.children;
    if (!top || !top.length) return out;
    const stack = [];
    for (let i = top.length - 1; i >= 0; i--) stack.push(top[i]);
    while (stack.length) {
      const node = stack.pop();
      if (node && node.nodeType === 1 && isOperableInteractive(node)) {
        out.push(node);
        continue; // do not descend into a counted control
      }
      const kids = node && node.children;
      if (kids && kids.length) {
        for (let i = kids.length - 1; i >= 0; i--) stack.push(kids[i]);
      }
    }
    return out;
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(INTERACTIVE_SELECTOR)
    : helpers.queryAll(INTERACTIVE_SELECTOR);

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || el.nodeType !== 1) continue;
    if (!isEligible(el)) continue;

    applicableCount += 1;

    const nested = collectNestedOperable(el);
    if (!nested.length) continue;

    const nestedTags = nested.map((n) => (n && n.tagName ? n.tagName.toLowerCase() : 'unknown'));
    const dedupedNestedTags = [...new Set(nestedTags)];

    const tag = el.tagName.toLowerCase();
    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : el.outerHTML || '';

    occurrences.push({
      selector: stableSelector,
      html,
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
    });
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
