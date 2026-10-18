/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check click-handler-keyboard-operable
 * @atomic true
 * @summary An inline click handler on an element that is not a native control must be operable by keyboard
 * @standard WCAG 2.2
 * @sc 2.1.1
 * @applicability
 *   Elements with a non-empty inline `onclick` attribute that the page
 *   renders, except:
 *   - `<html>` and `<body>`, where a click handler serves the whole page;
 *   - a handler made only of statements that do nothing (`return false`,
 *     `void(0)`, `void 0`, `event.preventDefault()`): it offers no function;
 *   - an element with `aria-disabled="true"`, on itself or an ancestor: a
 *     disabled control offers no function to operate;
 *   - native controls, whose own keyboard behaviour reaches the user: a link
 *     or area with `href`, `button`, `input` other than hidden, `select`,
 *     `textarea`, `option`, `summary`, `label` (it activates its control,
 *     which takes focus itself), `iframe`, `embed`, `audio` or `video` with
 *     `controls`, and an editing host (`contenteditable`);
 *   - an element containing, in the flat tree (its shadow root and slotted
 *     content included), a control whose keyboard activation fires `click`
 *     (a link or area with `href`, `button`, `summary`, or an input of type
 *     button, submit, reset, image, checkbox or radio) that is in the tab
 *     order: the control's click bubbles to the handler, so this is event
 *     delegation and the keyboard already runs it;
 *   - an element that cannot take focus, has no descendant that can, has no
 *     widget role and no `cursor: pointer`: nothing tells the user it is
 *     clickable, and such a handler often only tracks clicks or stops their
 *     propagation.
 * @expectation
 *   A keyboard user can run what the click runs. Chromium fires `click` on
 *   Enter or Space for native controls only: a `<span role="button"
 *   tabindex="0" onclick>` gets focus but does nothing on either key.
 *   - The element, or one of its flat-tree descendants, is in the tab order,
 *     and an inline key handler (`onkeydown`, `onkeyup`, `onkeypress`) is on
 *     it, an ancestor or a descendant, so key events from the focused
 *     element can reach one: pass.
 *   - The element or a descendant is in the tab order, but no inline key
 *     handler is there: cantTell (`CLICK_HANDLER_NO_KEY_HANDLER`), check that
 *     Enter and Space do what a click does.
 *   - The element or a descendant can take focus, but only with
 *     `tabindex="-1"`, and no ancestor has a key handler: cantTell
 *     (`CLICK_HANDLER_NOT_IN_TAB_ORDER`). Tab never reaches it; a script may
 *     move focus there, as a roving tabindex does.
 *   - Neither it nor a descendant can take focus, and its role is button,
 *     link, checkbox or switch: fail (`CLICK_HANDLER_CONTROL_NOT_FOCUSABLE`).
 *     The element says it is a control, and Tab never reaches it, as in
 *     WCAG failure F42 for scripted links. Unless an ancestor carries
 *     `aria-activedescendant` or an inline key handler, or is a focusable
 *     composite widget (grid, treegrid, listbox, menu, menubar, tree,
 *     tablist, toolbar, radiogroup, combobox), which may operate it without
 *     moving focus to it: then cantTell.
 *   - Neither it nor a descendant can take focus, with another widget role
 *     or `cursor: pointer`: cantTell (`CLICK_HANDLER_NOT_FOCUSABLE`). An
 *     option of a combobox's list or a cell of a grid is often operated from
 *     the element that keeps focus, and the action may be offered by another
 *     control of the page.
 * @reports
 *   - `role`: the element's ARIA role, or '' for none.
 *   - `focusable`: whether the element itself can take focus.
 * @implementation-notes
 * - No ACT rule tests click handlers. WCAG 2.1.1 asks that all
 *   functionality work from a keyboard; F42 fails a scripted link that is not
 *   focusable, and F54 a function behind pointer-only handlers.
 *   mouse-only-event-handlers covers the hover and mousedown handlers and
 *   leaves `onclick` out, since keyboard activation fires `click` on a
 *   native control; this rule covers `onclick` on the elements where it does
 *   not.
 * - Only inline attributes are seen. A key listener added from script is
 *   invisible, so a focusable element with no inline key handler is only
 *   asked about, never failed. A click listener added from script is not
 *   seen either: the rule does not report what it cannot see.
 * - A key handler on an ancestor counts, as key events bubble from the
 *   focused element (on `body`, a page-wide handler).
 * - The fail needs only what the page states: the click handler, the role,
 *   and that neither the element nor anything in it can take focus.
 * - Focus follows Chromium: an element with `display: contents` takes none,
 *   and a shadow host with `delegatesFocus` takes it when its shadow root
 *   holds a focusable element.
 */

const id = 'click-handler-keyboard-operable';

const meta = {
  title: 'Inline click handlers on elements that are not native controls must work by keyboard',
  description:
    'Checks that an element with an inline onclick that is not a native control can take keyboard focus and has a key handler, so a keyboard user can run what a click runs.',
  i18n: {
    titleKey: 'clickHandlerKeyboardOperable_title',
    descriptionKey: 'clickHandlerKeyboardOperable_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag211', 'structure', 'atomic', 'automatic'],
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
  type: 'automatic',
  defaultConfidence: 'medium',
  coverage: { facetsBySc: { '2.1.1': ['click-handler-keyboard-operable'] } }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const KEY_ATTRS = ['onkeydown', 'onkeyup', 'onkeypress'];
  const FAIL_ROLES = new Set(['button', 'link', 'checkbox', 'switch']);
  const WIDGET_ROLES = new Set([
    'button',
    'link',
    'checkbox',
    'switch',
    'radio',
    'menuitem',
    'menuitemcheckbox',
    'menuitemradio',
    'option',
    'tab',
    'treeitem',
    'gridcell',
    'slider',
    'spinbutton',
    'combobox',
    'textbox',
    'searchbox',
    'scrollbar'
  ]);
  const COMPOSITE_ROLES = new Set([
    'grid',
    'treegrid',
    'listbox',
    'menu',
    'menubar',
    'tree',
    'tablist',
    'toolbar',
    'radiogroup',
    'combobox'
  ]);
  const ACTIVABLE_SELECTOR = 'a[href], area[href], button, input, summary';
  const CLICKING_INPUT_TYPES = new Set(['button', 'submit', 'reset', 'image', 'checkbox', 'radio']);
  const NO_OP_STATEMENTS = new Set(['return false', 'void(0)', 'void 0', 'event.preventDefault()']);
  const MAX_SUBTREE = 20000;

  function trim(v) {
    return (v == null ? '' : String(v)).trim();
  }
  function tagOf(el) {
    return String(dom.localName(el) || '').toLowerCase();
  }
  function hasKeyAttr(el) {
    return KEY_ATTRS.some((a) => trim(dom.getAttribute(el, a)));
  }

  // A handler made only of statements that do nothing, such as
  // onclick="return false", offers no function to operate.
  function isNoOp(code) {
    const parts = code
      .split(';')
      .map((p) => p.trim())
      .filter(Boolean);
    return parts.length > 0 && parts.every((p) => NO_OP_STATEMENTS.has(p));
  }

  function isAriaDisabled(el) {
    return trim(dom.getAttribute(el, 'aria-disabled')).toLowerCase() === 'true';
  }

  function isNativeControl(el) {
    switch (tagOf(el)) {
      case 'a':
      case 'area':
        return dom.hasAttribute(el, 'href');
      case 'input':
        return trim(dom.getAttribute(el, 'type')).toLowerCase() !== 'hidden';
      case 'button':
      case 'select':
      case 'textarea':
      case 'option':
      case 'summary':
      case 'label':
      case 'iframe':
      case 'embed':
        return true;
      case 'audio':
      case 'video':
        return dom.hasAttribute(el, 'controls');
      default:
        break;
    }
    const editable = dom.getAttribute(el, 'contenteditable');
    return editable != null && trim(editable).toLowerCase() !== 'false';
  }

  // { focusable, tabbable }. An element with display: contents has no box,
  // and Chromium neither focuses it nor stops on it with Tab.
  function focusOf(el) {
    try {
      const cs = helpers.computedStyle(el);
      if (cs && trim(cs.display) === 'contents') return { focusable: false, tabbable: false };
      const info = helpers.getFocusableInfo(el, ctx);
      return { focusable: !!(info && info.focusable), tabbable: !!(info && info.tabbable) };
    } catch {
      return { focusable: false, tabbable: false };
    }
  }

  function shown(el) {
    return !(helpers.isHiddenContent && helpers.isHiddenContent(el));
  }

  // Enter or Space on these fires click, which bubbles to the handler.
  function firesClickFromKeyboard(d, focus) {
    if (!focus.tabbable || !dom.matches(d, ACTIVABLE_SELECTOR)) return false;
    if (tagOf(d) === 'input') {
      const type = trim(dom.getAttribute(d, 'type')).toLowerCase() || 'text';
      if (!CLICKING_INPUT_TYPES.has(type)) return false;
    }
    return true;
  }

  // What the element's flat-tree descendants offer: shadow content and
  // slotted nodes included, as a click in them bubbles to the element and a
  // key event from them reaches it. A subtree too large to walk counts as
  // reachable, so it is only asked about.
  function scanSubtree(el) {
    const out = { delegates: false, focusable: false, tabbable: false, keyHandler: false };
    const stack = helpers.flatChildElements(el).reverse();
    let seen = 0;
    while (stack.length) {
      if (++seen > MAX_SUBTREE) {
        out.focusable = out.tabbable = true;
        break;
      }
      const d = stack.pop();
      if (!out.keyHandler && hasKeyAttr(d)) out.keyHandler = true;
      const focus = focusOf(d);
      if (focus.focusable && shown(d)) {
        if (firesClickFromKeyboard(d, focus)) {
          out.delegates = true;
          break;
        }
        out.focusable = true;
        if (focus.tabbable) out.tabbable = true;
      }
      const kids = helpers.flatChildElements(d);
      for (let i = kids.length - 1; i >= 0; i--) stack.push(kids[i]);
    }
    return out;
  }

  // A host with delegatesFocus passes focus to the first focusable element
  // of its shadow root, so Tab stops on the host's content.
  function delegatesFocus(el) {
    try {
      const root = dom.shadowRoot(el);
      return !!(root && dom.get(root, 'delegatesFocus'));
    } catch {
      return false;
    }
  }

  function ancestors(el) {
    const out = [];
    let cur = helpers.flatParentElement(el);
    for (let i = 0; cur && i < 200; i++) {
      out.push(cur);
      cur = helpers.flatParentElement(cur);
    }
    return out;
  }

  function hasPointerCursor(el) {
    try {
      const cs = helpers.computedStyle(el);
      return trim(cs && cs.cursor).toLowerCase() === 'pointer';
    } catch {
      return false;
    }
  }

  const nodes = helpers.queryAllSmart('[onclick]');
  const fails = [];
  const questions = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    const onclick = trim(dom.getAttribute(el, 'onclick'));
    if (!onclick || isNoOp(onclick)) continue;
    const tag = tagOf(el);
    if (tag === 'html' || tag === 'body') continue;
    if (isNativeControl(el)) continue;
    const ancestorList = ancestors(el);
    // aria-disabled applies to the element and its descendants (WAI-ARIA 1.2).
    if (isAriaDisabled(el) || ancestorList.some(isAriaDisabled)) continue;
    const sub = scanSubtree(el);
    if (sub.delegates) continue;

    const role = helpers.aria.getAuthorRole(el) || '';
    const self = focusOf(el);
    const hostDelegates = delegatesFocus(el);
    const selfFocusable = self.focusable || (hostDelegates && sub.focusable);
    const selfTabbable = self.tabbable || (hostDelegates && sub.tabbable);
    const reachable = selfFocusable || sub.focusable;
    const inTabOrder = selfTabbable || sub.tabbable;
    const keyAbove = ancestorList.some(hasKeyAttr);
    const keyHandled = hasKeyAttr(el) || keyAbove || sub.keyHandler;

    // Only a script can move focus to a tabindex="-1" element, as a roving
    // tabindex does from a key handler on an ancestor.
    if (reachable && !inTabOrder && !keyAbove) {
      applicableCount += 1;
      questions.push(
        helpers.reportOccurrence(el, {
          summary: `This <${tag}> runs an onclick handler, but neither it nor anything in it is in the tab order (tabindex="-1"), so a keyboard user reaches it only if a script moves focus there.`,
          hint: 'Check that a keyboard user can move focus to it, such as with the arrow keys of the widget it belongs to, and that Enter and Space then do what a click does. If not, use tabindex="0" or a native <button> or <a href>.',
          i18n: {
            summaryKey: 'clickHandlerKeyboardOperable_summary_cantTell_notInTabOrder',
            hintKey: 'clickHandlerKeyboardOperable_hint_cantTell_notInTabOrder',
            params: { element: tag }
          },
          uncertainty: {
            code: 'runtime-dependent',
            needed:
              'Whether a script moves focus to the element, as a roving tabindex does, and Enter or Space then runs the click action.',
            evidence: { role, focusable: selfFocusable, tabbable: false, keyHandler: keyHandled }
          },
          data: {
            details: {
              reasonCode: 'CLICK_HANDLER_NOT_IN_TAB_ORDER',
              role,
              focusable: selfFocusable
            }
          }
        })
      );
      continue;
    }

    if (reachable) {
      applicableCount += 1;
      if (keyHandled) continue;
      questions.push(
        helpers.reportOccurrence(el, {
          summary: `This <${tag}> runs an onclick handler and takes keyboard focus, but has no inline key handler, so Enter and Space may do nothing.`,
          hint: 'Check that Enter (and Space, for a button) does what a click does. If not, use a native <button> or <a href>, or handle keydown for those keys.',
          i18n: {
            summaryKey: 'clickHandlerKeyboardOperable_summary_cantTell_noKeyHandler',
            hintKey: 'clickHandlerKeyboardOperable_hint_cantTell_noKeyHandler',
            params: { element: tag }
          },
          uncertainty: {
            code: 'runtime-dependent',
            needed:
              'Whether a key listener added from script runs the click action on Enter or Space.',
            evidence: { role, focusable: selfFocusable, keyHandler: false }
          },
          data: {
            details: { reasonCode: 'CLICK_HANDLER_NO_KEY_HANDLER', role, focusable: selfFocusable }
          }
        })
      );
      continue;
    }

    const isWidget = WIDGET_ROLES.has(role);
    if (!isWidget && !hasPointerCursor(el)) continue;
    applicableCount += 1;

    // A focusable composite widget may operate its items from the keyboard
    // with a listener added from script, focus staying on the widget.
    const managedFromAbove =
      keyAbove ||
      ancestorList.some(
        (a) =>
          trim(dom.getAttribute(a, 'aria-activedescendant')) ||
          (COMPOSITE_ROLES.has(helpers.aria.getAuthorRole(a) || '') && focusOf(a).focusable)
      );

    if (FAIL_ROLES.has(role) && !managedFromAbove) {
      fails.push(
        helpers.reportOccurrence(el, {
          summary: `This element has role="${role}" and an onclick handler, but neither it nor anything in it can take keyboard focus, so a keyboard user cannot reach it.`,
          hint: `Use the native element (<button>, <a href> or <input type="checkbox">), or add tabindex="0" and make the keys a ${role} answers to do what a click does.`,
          i18n: {
            summaryKey: 'clickHandlerKeyboardOperable_summary_fail_notFocusable',
            hintKey: 'clickHandlerKeyboardOperable_hint_fail_notFocusable',
            params: { role }
          },
          data: {
            details: { reasonCode: 'CLICK_HANDLER_CONTROL_NOT_FOCUSABLE', role, focusable: false }
          }
        })
      );
      continue;
    }

    questions.push(
      helpers.reportOccurrence(el, {
        summary: `This <${tag}> runs an onclick handler, but neither it nor anything in it can take keyboard focus.`,
        hint: 'Check that a keyboard user can do the same thing, here or with another control of the page. If not, use a native <button> or <a href>, or add tabindex="0" and handle Enter and Space.',
        i18n: {
          summaryKey: 'clickHandlerKeyboardOperable_summary_cantTell_notFocusable',
          hintKey: 'clickHandlerKeyboardOperable_hint_cantTell_notFocusable',
          params: { element: tag }
        },
        uncertainty: {
          code: 'equivalence-unknown',
          needed:
            'Whether the click action is available by keyboard from another element, such as the one that keeps focus in a composite widget, or another control of the page.',
          evidence: { role, focusable: false, managedFromAbove }
        },
        data: {
          details: { reasonCode: 'CLICK_HANDLER_NOT_FOCUSABLE', role, focusable: false }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  const resolved = helpers.resolveTieredOutcome(
    fails,
    questions,
    rule.defaultSeverity || 'serious'
  );
  return { ruleId: rule.ruleId, ...resolved };
}

module.exports = { id, meta, runInPage };
