/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check widget-keyboard-focusable
 * @atomic true
 * @summary An element with a widget role should be reachable with the keyboard
 * @standard WCAG 2.2
 * @sc 2.1.1
 * @applicability
 *   Elements the page shows with `aria-activedescendant`, and those whose
 *   role, from the `role` attribute or a custom element's
 *   `ElementInternals`, is a widget a user operates:
 *   - single widgets: button, link, checkbox, switch, radio, slider,
 *     spinbutton, textbox, searchbox, combobox;
 *   - composite widgets: grid, treegrid, listbox, menu, menubar, tree,
 *     tablist, toolbar, radiogroup.
 *
 *   Left out:
 *   - an element out of the accessibility tree (`aria-hidden="true"`), or
 *     disabled (`disabled`, or `aria-disabled="true"` on it or an
 *     ancestor): it offers nothing to operate;
 *   - a widget inside a composite widget, or inside an element with
 *     `aria-activedescendant` that can take focus: the composite moves
 *     focus among its items
 *     (a roving tabindex) or keeps it and points at the active one, so the
 *     outer element is judged instead (for a submenu, its menubar);
 *   - an element with an inline `onclick`, or a click listener the listener
 *     hook (`listenerHookScript`) saw, which
 *     `click-handler-keyboard-operable` judges.
 * @expectation
 *   A keyboard user can reach the widget with Tab (WCAG 2.1.1). Only the
 *   markup's focusability is read: a script may move focus or handle keys
 *   in ways the markup doesn't show, so a finding is a question, never a
 *   failure.
 *   - A single widget that is in the tab order, or holds an element that
 *     is, passes.
 *   - A single widget that can't take focus, and holds nothing that can:
 *     cantTell (`WIDGET_NOT_FOCUSABLE`). Check that a keyboard user can
 *     reach it, or what it does, another way.
 *   - A single widget that takes focus only from script (`tabindex="-1"`):
 *     cantTell (`WIDGET_NOT_IN_TAB_ORDER`). Tab never reaches it; check
 *     that a script moves focus to it, or that what it does is offered
 *     elsewhere.
 *   - A composite widget passes when it is in the tab order (with
 *     `aria-activedescendant` pointing at its active item, or not) or
 *     holds an element that is. One that no other element names in
 *     `aria-controls` or `aria-owns` (a popup opened by a button or
 *     combobox gets focus from it) and that has neither: cantTell
 *     (`COMPOSITE_NO_TAB_STOP`).
 *   - An element of any role carrying `aria-activedescendant` that can't
 *     take focus: cantTell (`ACTIVEDESCENDANT_HOST_NOT_FOCUSABLE`). The
 *     active item is announced only while that element has focus. Such an
 *     element doesn't manage focus for the widgets inside it, so they are
 *     judged on their own.
 * @reports
 *   - `role`: the element's role.
 *   - `focusable`: whether the element itself can take focus.
 *   - `scriptFocusable`: for a composite, whether any element in it takes
 *     focus from script (`tabindex="-1"`).
 * @implementation-notes
 * - WCAG 2.1.1 asks that all functionality work from a keyboard; F42 fails
 *   a scripted control that can't take focus, F54 a function behind
 *   pointer-only handlers. ARIA's authoring practices give every widget a
 *   tab stop: the widget itself, or one item of a composite (roving
 *   tabindex), or the composite with `aria-activedescendant`.
 * - Manual, so cantTell at most: an element can be made reachable, or its
 *   function offered, in ways static markup doesn't show (a key handler on
 *   the page that moves focus, a keyboard shortcut, the same action in
 *   another control).
 * - Only light-DOM descendants are looked at for a tab stop. A composite
 *   is judged once, however many items it holds, and the set of elements
 *   named by `aria-controls`/`aria-owns` is built once per run, only when a
 *   composite without a tab stop needs it. Whether an ancestor manages
 *   focus or is aria-disabled is worked out once per element and shared
 *   down the tree; in a composite's items, the hidden-content check runs
 *   only on one that would change the answer.
 */

const id = 'widget-keyboard-focusable';

const meta = {
  title: 'Widgets should be reachable with the keyboard',
  description:
    'Flags an element with a widget role that cannot take focus or is out of the tab order, and a composite widget with no tab stop, for manual review.',
  i18n: {
    titleKey: 'widgetKeyboardFocusable_title',
    descriptionKey: 'widgetKeyboardFocusable_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag211', 'aria', 'keyboard', 'structure', 'atomic', 'manual'],
  wcagSc: ['2.1.1'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '2.1.1',
      title: 'Keyboard',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'serious',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: { facetsBySc: { '2.1.1': ['widget-keyboard-focusable-evidence'] } }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const SINGLE = new Set([
    'button',
    'link',
    'checkbox',
    'switch',
    'radio',
    'slider',
    'spinbutton',
    'textbox',
    'searchbox',
    'combobox'
  ]);
  const COMPOSITE = new Set([
    'grid',
    'treegrid',
    'listbox',
    'menu',
    'menubar',
    'tree',
    'tablist',
    'toolbar',
    'radiogroup'
  ]);
  const FOCUS_SELECTOR =
    'a[href], area[href], button, input, select, textarea, summary, iframe, [tabindex], [contenteditable]';

  function trim(v) {
    return (v == null ? '' : String(v)).trim();
  }
  function roleOf(el) {
    try {
      return trim(helpers.aria.getAuthorRole(el)).toLowerCase();
    } catch {
      return '';
    }
  }
  function focusOf(el) {
    try {
      const info = helpers.getFocusableInfo(el, ctx);
      return { focusable: !!(info && info.focusable), tabbable: !!(info && info.tabbable) };
    } catch {
      return { focusable: false, tabbable: false };
    }
  }
  function isAriaDisabled(el) {
    return trim(dom.getAttribute(el, 'aria-disabled')).toLowerCase() === 'true';
  }

  // For each element, whether it or an ancestor manages focus for what it
  // holds (a composite widget, or an element keeping focus while pointing
  // at its active descendant), and whether it or an ancestor is
  // aria-disabled. Worked out once per element and shared down the tree,
  // so a page of many widgets walks each ancestor once, where a
  // role-selector closest() per widget is slow on large pages.
  const contexts = new Map();
  const NONE = { managed: false, disabled: false };
  function contextOf(el) {
    if (!el) return NONE;
    const chain = [];
    let node = el;
    while (node && !contexts.has(node)) {
      chain.push(node);
      node = dom.parentElement(node);
    }
    let up = node ? contexts.get(node) : NONE;
    for (let i = chain.length - 1; i >= 0; i--) {
      const a = chain[i];
      up = {
        managed:
          up.managed ||
          COMPOSITE.has(roleOf(a)) ||
          (dom.hasAttribute(a, 'aria-activedescendant') && focusOf(a).focusable),
        disabled: up.disabled || isAriaDisabled(a)
      };
      contexts.set(a, up);
    }
    return up;
  }
  function isDisabled(el) {
    if (contextOf(el).disabled) return true;
    try {
      return dom.matches(el, ':disabled');
    } catch {
      return false;
    }
  }

  // The focusable elements a widget holds: whether one is in the tab
  // order, and, when asked, whether one takes focus from script only.
  // Focusability is cached per run and cheap, so it is read first; the
  // hidden-content check runs only on an element that would change the
  // answer, which keeps a large composite (a listbox of thousands of
  // options with tabindex="-1") to one such check.
  function descendantFocus(el, wantScriptFocusable) {
    let tabbable = false;
    let scriptFocusable = false;
    for (const d of dom.querySelectorAll(el, FOCUS_SELECTOR)) {
      const f = focusOf(d);
      if (!f.focusable) continue;
      if (!f.tabbable && (!wantScriptFocusable || scriptFocusable)) continue;
      if (helpers.isHiddenContent(d)) continue;
      if (f.tabbable) {
        tabbable = true;
        break;
      }
      scriptFocusable = true;
    }
    return { tabbable, scriptFocusable };
  }

  // Elements some other element names in aria-controls or aria-owns: a
  // popup such an element opens gets focus from it. Built once, on demand.
  let controlled = null;
  function isControlled(el) {
    if (!controlled) {
      controlled = new Set();
      for (const c of helpers.queryAllDeep('[aria-controls], [aria-owns]')) {
        for (const attr of ['aria-controls', 'aria-owns']) {
          const value = dom.getAttribute(c, attr);
          if (!trim(value)) continue;
          for (const ref of helpers.resolveIdRefs(value, ctx, {}, c).refs) controlled.add(ref);
        }
      }
    }
    return controlled.has(el);
  }

  const occurrences = [];
  let applicableCount = 0;

  // A bare [role] is matched far faster than a list of role values, and
  // several rules query it, so its hidden-content checks are shared; the
  // roles are told apart below.
  const nodes = helpers.queryAllSmart('[role], [aria-activedescendant]', { internalsRoles: true });

  for (const el of nodes) {
    if (!el) continue;
    const role = roleOf(el);
    const composite = COMPOSITE.has(role);
    const widget = composite || SINGLE.has(role);
    const activeHost = !!trim(dom.getAttribute(el, 'aria-activedescendant'));
    if (!widget && !activeHost) continue;
    if (trim(dom.getAttribute(el, 'onclick'))) continue;
    // A click listener the listener hook saw is click-handler-keyboard-operable's too.
    if (
      typeof helpers.getEventListenerInfo === 'function' &&
      helpers.getEventListenerInfo(el, ['click']).listens
    )
      continue;
    if (contextOf(dom.parentElement(el)).managed) continue;
    if (isDisabled(el)) continue;
    if (!helpers.isIncludedInAccessibilityTree(el, ctx)) continue;
    applicableCount += 1;

    const own = focusOf(el);
    if (own.tabbable) continue;

    let reasonCode;
    let scriptFocusable = false;
    if (activeHost && !own.focusable) {
      reasonCode = 'ACTIVEDESCENDANT_HOST_NOT_FOCUSABLE';
    } else if (!widget) {
      continue;
    } else if (composite) {
      const inside = descendantFocus(el, true);
      if (inside.tabbable) continue;
      if (isControlled(el)) continue;
      scriptFocusable = own.focusable || inside.scriptFocusable;
      reasonCode = 'COMPOSITE_NO_TAB_STOP';
    } else if (own.focusable) {
      reasonCode = 'WIDGET_NOT_IN_TAB_ORDER';
    } else {
      if (descendantFocus(el, false).tabbable) continue;
      reasonCode = 'WIDGET_NOT_FOCUSABLE';
    }

    let eligInfo = null;
    try {
      eligInfo = helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' });
    } catch {}

    const messages = {
      WIDGET_NOT_FOCUSABLE: {
        key: 'notFocusable',
        summary: 'This element has the role {{role}} but cannot take keyboard focus.',
        hint: 'Check that a keyboard user can reach it, for example with tabindex="0" or a native control, or that what it does is offered another way.'
      },
      WIDGET_NOT_IN_TAB_ORDER: {
        key: 'notInTabOrder',
        summary:
          'This element has the role {{role}} but takes focus only from script (tabindex="-1").',
        hint: 'Check that a script moves focus to it, or that what it does is offered another way; otherwise give it tabindex="0".'
      },
      ACTIVEDESCENDANT_HOST_NOT_FOCUSABLE: {
        key: 'activedescendantHostNotFocusable',
        summary:
          'This element points at its active item with aria-activedescendant, but cannot take keyboard focus.',
        hint: 'Check that a keyboard user can reach it: aria-activedescendant is announced only while the element that carries it has focus, so give it tabindex="0".'
      },
      COMPOSITE_NO_TAB_STOP: {
        key: 'compositeNoTabStop',
        summary:
          'This {{role}} has no tab stop: neither it nor anything in it is in the tab order.',
        hint: 'Check that a keyboard user can reach it: give one item tabindex="0" (roving tabindex), or make the {{role}} focusable and point aria-activedescendant at the active item.'
      }
    };
    const m = messages[reasonCode];

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: m.summary.replace(/\{\{role\}\}/g, role),
        hint: m.hint.replace(/\{\{role\}\}/g, role),
        i18n: {
          summaryKey: `widgetKeyboardFocusable_summary_cantTell_${m.key}`,
          hintKey: `widgetKeyboardFocusable_hint_cantTell_${m.key}`,
          params: { role }
        },
        data: {
          details:
            composite && reasonCode === 'COMPOSITE_NO_TAB_STOP'
              ? { reasonCode, role, focusable: own.focusable, scriptFocusable }
              : { reasonCode, role, focusable: own.focusable },
          visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
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
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'serious',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
