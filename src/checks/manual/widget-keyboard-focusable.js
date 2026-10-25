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
 * @reason-codes
 *   - `WIDGET_NOT_FOCUSABLE` (cantTell): a widget that cannot take focus and
 *     holds nothing that can; whether a keyboard user can reach it or what
 *     it does another way is for a person to check.
 *     It leans fail unless another element in the tab order has the same
 *     role and name.
 *     Basis: WCAG 2.1.1 (not settled); F42.
 *   - `WIDGET_NOT_IN_TAB_ORDER` (cantTell): a widget that takes focus only
 *     from script (tabindex="-1"), so Tab never reaches it.
 *     It leans pass when another element in the tab order has the same role
 *     and name, and fail when, with a listener hook installed before the
 *     page's scripts, no key listener is on an ancestor, the document or
 *     the window to move focus to it.
 *     Basis: WCAG 2.1.1 (not settled).
 *   - `COMPOSITE_NO_TAB_STOP` (cantTell): a composite widget that no other
 *     element controls or owns, with no tab stop on it or on any of its
 *     items.
 *     It leans fail unless the element just before it, or before its parent,
 *     says it opens a popup (aria-haspopup, or aria-expanded="true").
 *     Basis: WCAG 2.1.1 (not settled).
 *   - `ACTIVEDESCENDANT_HOST_NOT_FOCUSABLE` (cantTell): an element with
 *     aria-activedescendant that cannot take focus, so its active item is
 *     never announced.
 *     It leans fail: ARIA gives aria-activedescendant effect only on the
 *     element that has focus.
 *     Basis: WCAG 2.1.1 (not settled); WAI-ARIA 1.2 aria-activedescendant.
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
  coverage: { facetsBySc: { '2.1.1': ['widget-keyboard-focusable-evidence'] } },
  // How a person checks each undecided finding: shown with it as
  // howToCheck (docs/OUTPUT_SCHEMA.md).
  review: {
    ACTIVEDESCENDANT_HOST_NOT_FOCUSABLE: {
      steps: [
        'Find the element the report names; it uses aria-activedescendant to point at its active item.',
        'Using only the keyboard, open or reach the widget (for example type in its search box) and watch whether that element, not something else, gets focus.',
        'Press the arrow keys with a screen reader running and listen whether each active item is announced.'
      ],
      passWhen:
        'The element gets focus and the screen reader announces each active item as the arrow keys move.',
      failWhen:
        'The element cannot get focus, so moving through items announces nothing or the items cannot be reached, which fails WCAG 2.1.1.'
    },
    COMPOSITE_NO_TAB_STOP: {
      steps: [
        'Find the widget the report names (a menu, list box, tab list, toolbar, grid or tree).',
        'Click just before it and press Tab, and watch whether focus enters it or one of its items.',
        'If it is a popup, open it from its button with the keyboard and see whether focus moves into it.',
        'Once inside, check that the arrow keys move between the items.'
      ],
      passWhen:
        'Tab (or the button that opens it) puts focus in the widget and the arrow keys move between its items.',
      failWhen:
        'Focus never gets into the widget or its items with the keyboard, which fails WCAG 2.1.1.'
    },
    WIDGET_NOT_FOCUSABLE: {
      steps: [
        'Find the widget the report names and note what it does when clicked or touched.',
        'Click just before it, then press Tab and watch whether focus ever lands on it.',
        'If it never gets focus, look for another control a keyboard can reach that does the same thing.',
        'If the element does nothing, its role may be wrong; note that instead.'
      ],
      passWhen:
        'The widget gets keyboard focus and works with the keyboard, or the same function is offered by another keyboard-reachable control.',
      failWhen:
        'The widget cannot be reached or used with the keyboard and its function is not offered elsewhere, which fails WCAG 2.1.1 (F42).'
    },
    WIDGET_NOT_IN_TAB_ORDER: {
      steps: [
        'Find the widget the report names and note when it appears (for example when a menu or dialog opens).',
        'Use only the keyboard to open or reach that part of the page, and watch whether a script moves focus to the widget, or the arrow keys reach it.',
        'If focus never reaches it, look for another keyboard-reachable control that does the same thing.'
      ],
      passWhen:
        'Focus is moved to the widget by script or by arrow keys when needed, or its function is offered elsewhere.',
      failWhen:
        'Tab and arrow keys never reach the widget and nothing else offers its function, which fails WCAG 2.1.1.'
    }
  }
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
          for (const ref of helpers.getRefElements(c, attr, ctx)) controlled.add(ref);
        }
      }
    }
    return controlled.has(el);
  }

  // For the leans. Tab stops by role and name, built once on demand: a
  // widget whose function another control in the tab order offers, with
  // the same role and name, is a deliberate duplicate.
  let tabStopsByRoleName = null;
  function nameOf(el) {
    try {
      const info =
        typeof helpers.getNameFromContentInfo === 'function'
          ? helpers.getNameFromContentInfo(el, ctx)
          : helpers.getAccessibleNameInfo(el, ctx);
      return trim(info && info.value)
        .replace(/\s+/g, ' ')
        .toLowerCase();
    } catch {
      return '';
    }
  }
  function fullRoleOf(el) {
    const r = roleOf(el);
    if (r) return r;
    try {
      return trim(helpers.aria.getNativeRoleForElement(el)).toLowerCase();
    } catch {
      return '';
    }
  }
  function hasTabbableTwin(el, role) {
    const name = nameOf(el);
    if (!name) return false;
    if (!tabStopsByRoleName) {
      tabStopsByRoleName = new Map();
      for (const d of helpers.queryAllDeep(FOCUS_SELECTOR + ', [role]')) {
        if (!focusOf(d).tabbable || helpers.isHiddenContent(d)) continue;
        const key = fullRoleOf(d) + '|' + nameOf(d);
        tabStopsByRoleName.set(key, (tabStopsByRoleName.get(key) || []).concat(d));
      }
    }
    return (tabStopsByRoleName.get(role + '|' + name) || []).some((d) => d !== el);
  }
  // A key listener the listener hook saw on an ancestor, the document or the
  // window; null without an early hook, which alone shows there is none.
  function keyListenerAbove(el) {
    if (typeof helpers.getEventListenerInfo !== 'function') return null;
    const types = ['keydown', 'keyup', 'keypress'];
    let info;
    try {
      info = helpers.getEventListenerInfo(el, types);
    } catch {
      return null;
    }
    if (!info || info.hook !== 'early') return null;
    try {
      const doc = ctx.document;
      const win = dom.defaultView(doc);
      if (helpers.getEventListenerInfo(doc, types).listens) return true;
      if (win && helpers.getEventListenerInfo(win, types).listens) return true;
      for (let a = dom.parentElement(el), i = 0; a && i < 500; a = dom.parentElement(a), i++) {
        if (helpers.getEventListenerInfo(a, types).listens) return true;
      }
    } catch {
      return null;
    }
    return false;
  }
  const POPUP_TRIGGER = '[aria-haspopup]:not([aria-haspopup="false"]), [aria-expanded="true"]';
  function hasPopupTrigger(el) {
    const parent = dom.parentElement(el);
    for (const sib of [
      dom.previousElementSibling(el),
      parent && dom.previousElementSibling(parent)
    ]) {
      if (!sib) continue;
      try {
        if (dom.matches(sib, POPUP_TRIGGER) || dom.querySelector(sib, POPUP_TRIGGER)) return true;
      } catch {}
    }
    return false;
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
    // An id, or an element set from script (ariaActiveDescendantElement).
    const activeHost =
      !!trim(dom.getAttribute(el, 'aria-activedescendant')) ||
      helpers.getReflectedRefs(el, 'aria-activedescendant').length > 0;
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

    let lean;
    if (reasonCode === 'WIDGET_NOT_FOCUSABLE') {
      if (!hasTabbableTwin(el, role))
        lean = {
          toward: 'fail',
          why: 'The element says it is a widget, but neither it nor anything in it can take focus, and no control in the tab order has its role and name.',
          signals: [
            { signal: 'role', value: role },
            { signal: 'focusable', value: false },
            { signal: 'same-name-tabbable-duplicate', value: false }
          ],
          caution:
            'A script may make it focusable when needed, or the role may be wrong for content that does nothing.',
          i18n: {
            whyKey: 'widgetKeyboardFocusable_lean_why_notFocusable',
            cautionKey: 'widgetKeyboardFocusable_lean_caution_notFocusable'
          }
        };
    } else if (reasonCode === 'WIDGET_NOT_IN_TAB_ORDER') {
      if (hasTabbableTwin(el, role)) {
        lean = {
          toward: 'pass',
          why: 'Another control in the tab order has the same role and name, so this one is a duplicate taken out of the tab order.',
          signals: [{ signal: 'same-name-tabbable-duplicate', value: true }],
          caution: 'Check that the two really do the same thing.',
          i18n: {
            whyKey: 'widgetKeyboardFocusable_lean_why_duplicate',
            cautionKey: 'widgetKeyboardFocusable_lean_caution_duplicate'
          }
        };
      } else if (keyListenerAbove(el) === false) {
        lean = {
          toward: 'fail',
          why: 'A hook installed before the page’s scripts saw no key listener on its ancestors, the document or the window, so no key moves focus to it.',
          signals: [
            { signal: 'listener-hook-active', value: true },
            { signal: 'ancestor-key-listener', value: false },
            { signal: 'same-name-tabbable-duplicate', value: false }
          ],
          caution:
            'A script may focus it when something opens, such as a dialog that takes focus to it.',
          i18n: {
            whyKey: 'widgetKeyboardFocusable_lean_why_noKeyListener',
            cautionKey: 'widgetKeyboardFocusable_lean_caution_noKeyListener'
          }
        };
      }
    } else if (reasonCode === 'COMPOSITE_NO_TAB_STOP') {
      if (!hasPopupTrigger(el))
        lean = {
          toward: 'fail',
          why: 'Nothing names this widget as one it controls or owns, nothing before it opens a popup, and neither it nor any item is in the tab order.',
          signals: [
            { signal: 'script-focusable', value: scriptFocusable },
            { signal: 'adjacent-popup-trigger', value: false }
          ],
          caution:
            'A popup opened and focused by a script from a trigger that does not say so looks the same.',
          i18n: {
            whyKey: 'widgetKeyboardFocusable_lean_why_compositeNoTabStop',
            cautionKey: 'widgetKeyboardFocusable_lean_caution_compositeNoTabStop'
          }
        };
    } else if (reasonCode === 'ACTIVEDESCENDANT_HOST_NOT_FOCUSABLE') {
      lean = {
        toward: 'fail',
        why: 'ARIA gives aria-activedescendant effect only on the element that has focus, and this one cannot take it.',
        signals: [{ signal: 'focusable', value: false }],
        caution: 'A script may make it focusable when the widget opens.',
        i18n: {
          whyKey: 'widgetKeyboardFocusable_lean_why_activedescendantHost',
          cautionKey: 'widgetKeyboardFocusable_lean_caution_activedescendantHost'
        }
      };
    }

    occurrences.push(
      helpers.reportOccurrence(el, {
        ...(lean ? { lean } : {}),
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
