/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check click-handler-keyboard-operable
 * @atomic true
 * @summary A click handler on an element that is not a native control must be operable by keyboard
 * @standard WCAG 2.2
 * @sc 2.1.1, 2.1.3
 * @applicability
 *   Elements the page renders with a non-empty inline `onclick` attribute,
 *   or, where the page runs the listener hook (`listenerHookScript`), with a
 *   click listener added from script (`addEventListener('click', …)` or
 *   the `onclick` property) on the element itself, except:
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
 *   - With the listener hook, a key listener added from script on the
 *     element or a descendant counts as an inline key handler does. One
 *     only on an ancestor, a shadow root the element is in, the document or
 *     the window may handle the element's keys or only others': cantTell
 *     (`CLICK_HANDLER_KEY_LISTENER_ABOVE`).
 *   - The element is in the tab order, its role is button, link, checkbox
 *     or switch, and a hook installed before the page's scripts saw no key
 *     listener on it, a descendant, an ancestor, a shadow root it is in,
 *     the document or the window, nor is an inline key handler there: fail
 *     (`CLICK_HANDLER_NO_KEY_LISTENER`). No key event reaches a handler, so
 *     Enter and Space do nothing. Unless a focus or focusin listener is on
 *     it, an ancestor, a shadow root it is in, the document or the window:
 *     it may add the key listener once the element has focus, so cantTell
 *     (`CLICK_HANDLER_FOCUS_LISTENER`).
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
 * @reason-codes
 *   - `CLICK_HANDLER_NO_KEY_LISTENER` (fail): a button, link, checkbox or
 *     switch with a click handler is in the tab order, but no key handler or
 *     listener is anywhere its key events go, so Enter and Space do nothing.
 *     Basis: WCAG 2.1.1; WCAG 2.1.3.
 *   - `CLICK_HANDLER_CONTROL_NOT_FOCUSABLE` (fail): a button, link, checkbox
 *     or switch with a click handler cannot take focus, nor can anything
 *     inside it, and nothing above it operates it.
 *     Basis: WCAG 2.1.1; WCAG 2.1.3; F42.
 *   - `CLICK_HANDLER_NO_KEY_HANDLER` (cantTell): an element with a click
 *     handler is in the tab order, but no key handler is seen; whether Enter
 *     and Space do what a click does is for a person to check.
 *     Basis: WCAG 2.1.1 (not settled); WCAG 2.1.3 (not settled).
 *   - `CLICK_HANDLER_NOT_IN_TAB_ORDER` (cantTell): an element with a click
 *     handler takes focus only from script (tabindex="-1"), so Tab never
 *     reaches it.
 *     Basis: WCAG 2.1.1 (not settled); WCAG 2.1.3 (not settled).
 *   - `CLICK_HANDLER_KEY_LISTENER_ABOVE` (cantTell): an element with a click
 *     handler is in the tab order, and the only key listener is above it,
 *     which may or may not handle its keys.
 *     Basis: WCAG 2.1.1 (not settled); WCAG 2.1.3 (not settled).
 *   - `CLICK_HANDLER_FOCUS_LISTENER` (cantTell): a control with a click
 *     handler is in the tab order with no key listener, but a focus listener
 *     may add one once it has focus.
 *     Basis: WCAG 2.1.1 (not settled); WCAG 2.1.3 (not settled).
 *   - `CLICK_HANDLER_NOT_FOCUSABLE` (cantTell): an element with a click
 *     handler that cannot take focus, with a widget role or a pointer
 *     cursor; whether the action is offered by keyboard elsewhere is for a
 *     person to check.
 *     Basis: WCAG 2.1.1 (not settled); WCAG 2.1.3 (not settled).
 * @implementation-notes
 * - No ACT rule tests click handlers. WCAG 2.1.1 asks that all
 *   functionality work from a keyboard; F42 fails a scripted link that is not
 *   focusable, and F54 a function behind pointer-only handlers.
 *   mouse-only-event-handlers covers the hover and mousedown handlers and
 *   leaves `onclick` out, since keyboard activation fires `click` on a
 *   native control; this rule covers `onclick` on the elements where it does
 *   not.
 * - Without the listener hook, only inline attributes are seen. A key
 *   listener added from script is invisible then, so a focusable element
 *   with no inline key handler is only asked about, never failed, and a
 *   click listener added from script is not seen at all: the rule does not
 *   report what it cannot see. With the hook (`listenerHookScript`), it
 *   sees the listeners on each element; a click listener on an ancestor
 *   only, as a framework that delegates events from its root adds, says
 *   nothing about which element it serves, so it makes no element a
 *   candidate. A key listener above the element is never enough to pass or
 *   fail. Only an early hook proves that no listener exists.
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
  title: 'Click handlers on elements that are not native controls must work by keyboard',
  description:
    'Checks that an element that is not a native control and has a click handler (an inline onclick, or a click listener the listener hook saw) can take keyboard focus and has a key handler, so a keyboard user can run what a click runs.',
  i18n: {
    titleKey: 'clickHandlerKeyboardOperable_title',
    descriptionKey: 'clickHandlerKeyboardOperable_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag2aaa', 'wcag211', 'wcag213', 'structure', 'atomic', 'automatic'],
  wcagSc: ['2.1.1', '2.1.3'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '2.1.1',
      title: 'Keyboard',
      conformanceLevel: 'A'
    },
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '2.1.3',
      title: 'Keyboard (No Exception)',
      conformanceLevel: 'AAA'
    }
  ],
  defaultSeverity: 'serious',
  category: 'operable',
  type: 'automatic',
  defaultConfidence: 'medium',
  coverage: {
    facetsBySc: {
      '2.1.1': ['click-handler-keyboard-operable'],
      '2.1.3': ['click-handler-keyboard-operable']
    }
  }
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
  // Statements that do nothing, written without spaces.
  const NO_OP_STATEMENTS = new Set([
    'return',
    'returnfalse',
    'return(false)',
    'void0',
    'void(0)',
    'returnvoid0',
    'returnvoid(0)',
    'event.preventDefault()'
  ]);
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

  // Listeners added from script, as the opt-in listener hook records them
  // (helpers.getEventListenerInfo): { hook: 'none' | 'early' | 'late',
  // listens }. Without the hook nothing is seen, as before.
  const KEY_TYPES = ['keydown', 'keyup', 'keypress'];
  function listenerInfo(target, types) {
    try {
      return typeof helpers.getEventListenerInfo === 'function'
        ? helpers.getEventListenerInfo(target, types)
        : { hook: 'none', listens: false };
    } catch {
      return { hook: 'none', listens: false };
    }
  }
  // A key handler of the element's own: an inline attribute, or a key
  // listener the hook saw on it.
  function hasOwnKeyHandler(el) {
    return hasKeyAttr(el) || listenerInfo(el, KEY_TYPES).listens;
  }

  // A handler made only of statements that do nothing, such as
  // onclick="return false", offers no function to operate. Spaces don't
  // matter, and a label before a statement does nothing: in
  // onclick="javascript:void(0)", "javascript:" is one.
  function isNoOp(code) {
    const parts = code
      .split(';')
      .map((p) => p.replace(/^\s*(?:[A-Za-z_$][\w$]*\s*:(?!:)\s*)+/, '').replace(/\s+/g, ''))
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
      if (!out.keyHandler && hasOwnKeyHandler(d)) out.keyHandler = true;
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

  // The shadow roots a key event from el passes through: the one holding
  // el or any of its flat-tree ancestors. A component that listens on its
  // own shadow root (as Lit's renderRoot does) handles its keys there.
  function shadowRootsAbove(el, ancestorList) {
    const out = [];
    for (const n of [el, ...ancestorList]) {
      const p = dom.parentNode(n);
      if (p && dom.nodeType(p) === 11 && dom.host(p)) out.push(p);
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

  // Elements with an inline onclick, and with the listener hook, those
  // given a click listener from script (addEventListener or el.onclick).
  const nodes = helpers.queryAllSmart('[onclick]', { listenerTypes: ['click'] });
  const doc = ctx.document || null;
  const win = doc && dom.defaultView ? dom.defaultView(doc) : null;
  // Key listeners on the document or the window, which every key event
  // reaches: a framework that delegates events from the root listens there
  // (or on its root element), for every element of the page.
  const pageKeyListener =
    (doc && listenerInfo(doc, KEY_TYPES).listens) || (win && listenerInfo(win, KEY_TYPES).listens);
  // Focus listeners, which may add the key listener when the element gets
  // focus: one on the document or the window reaches every element.
  const FOCUS_TYPES = ['focus', 'focusin'];
  const pageFocusListener =
    (doc && listenerInfo(doc, FOCUS_TYPES).listens) ||
    (win && listenerInfo(win, FOCUS_TYPES).listens);
  const fails = [];
  const questions = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    const onclick = trim(dom.getAttribute(el, 'onclick'));
    const clickInfo = listenerInfo(el, ['click']);
    if (!clickInfo.listens && (!onclick || isNoOp(onclick))) continue;
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
    const keyHandled = hasOwnKeyHandler(el) || keyAbove || sub.keyHandler;
    // A key listener added from script above the element: it may handle
    // this element's keys, or only its own. Never enough to pass or fail.
    const hookKeyAbove =
      clickInfo.hook !== 'none' &&
      (pageKeyListener ||
        ancestorList.some((a) => listenerInfo(a, KEY_TYPES).listens) ||
        shadowRootsAbove(el, ancestorList).some((r) => listenerInfo(r, KEY_TYPES).listens));
    const keyListenerAbove = !keyHandled && hookKeyAbove;
    // An early hook saw every listener: none of the above means no key
    // event reaches a handler at all.
    const noKeyListenerAnywhere = clickInfo.hook === 'early' && !keyHandled && !keyListenerAbove;

    // Only a script can move focus to a tabindex="-1" element, as a roving
    // tabindex does from a key handler on an ancestor.
    if (reachable && !inTabOrder && !keyAbove) {
      applicableCount += 1;
      questions.push(
        helpers.reportOccurrence(el, {
          summary: `This <${tag}> runs a click handler, but neither it nor anything in it is in the tab order (tabindex="-1"), so a keyboard user reaches it only if a script moves focus there.`,
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
      // The element says it is a control, Tab reaches it, and the hook,
      // installed before the page's scripts, saw no key listener anywhere a
      // key event from it goes: Enter and Space do nothing (2.1.1).
      // A focus listener on it, an ancestor, a shadow root it is in, the
      // document or the window may add the key listener once it has focus.
      const focusWired =
        noKeyListenerAnywhere &&
        FAIL_ROLES.has(role) &&
        (pageFocusListener ||
          listenerInfo(el, FOCUS_TYPES).listens ||
          ancestorList.some((a) => listenerInfo(a, FOCUS_TYPES).listens) ||
          shadowRootsAbove(el, ancestorList).some((r) => listenerInfo(r, FOCUS_TYPES).listens));
      if (focusWired) {
        questions.push(
          helpers.reportOccurrence(el, {
            summary: `This <${tag}> runs a click handler and takes keyboard focus. No key listener is on it yet, but a focus listener on it, an ancestor, the document or the window may add one when it gets focus.`,
            hint: 'Check that Enter (and Space, for a button) does what a click does. If not, use a native <button> or <a href>, or handle keydown for those keys.',
            i18n: {
              summaryKey: 'clickHandlerKeyboardOperable_summary_cantTell_focusListener',
              hintKey: 'clickHandlerKeyboardOperable_hint_cantTell_noKeyHandler',
              params: { element: tag }
            },
            uncertainty: {
              code: 'runtime-dependent',
              needed:
                'Whether a focus listener adds a key listener that runs the click action on Enter or Space.',
              evidence: {
                role,
                focusable: selfFocusable,
                keyHandler: false,
                focusListener: true
              }
            },
            data: {
              details: {
                reasonCode: 'CLICK_HANDLER_FOCUS_LISTENER',
                role,
                focusable: selfFocusable
              }
            }
          })
        );
        continue;
      }
      if (noKeyListenerAnywhere && FAIL_ROLES.has(role)) {
        fails.push(
          helpers.reportOccurrence(el, {
            summary: `This element has role="${role}" and a click handler, and takes keyboard focus, but no key listener is on it, an ancestor, the document or the window, so Enter and Space do nothing.`,
            hint: `Use the native element (<button>, <a href> or <input type="checkbox">), or handle keydown so that the keys a ${role} answers to do what a click does.`,
            i18n: {
              summaryKey: 'clickHandlerKeyboardOperable_summary_fail_noKeyListener',
              hintKey: 'clickHandlerKeyboardOperable_hint_fail_noKeyListener',
              params: { role }
            },
            data: {
              details: {
                reasonCode: 'CLICK_HANDLER_NO_KEY_LISTENER',
                role,
                focusable: selfFocusable
              }
            }
          })
        );
        continue;
      }
      if (keyListenerAbove) {
        questions.push(
          helpers.reportOccurrence(el, {
            summary: `This <${tag}> runs a click handler and takes keyboard focus. The only key listeners are on an ancestor, the document or the window, which may or may not handle its keys.`,
            hint: 'Check that Enter (and Space, for a button) does what a click does. If not, use a native <button> or <a href>, or handle keydown for those keys.',
            i18n: {
              summaryKey: 'clickHandlerKeyboardOperable_summary_cantTell_keyListenerAbove',
              hintKey: 'clickHandlerKeyboardOperable_hint_cantTell_noKeyHandler',
              params: { element: tag }
            },
            uncertainty: {
              code: 'runtime-dependent',
              needed:
                'Whether the key listener above the element runs its click action on Enter or Space.',
              evidence: {
                role,
                focusable: selfFocusable,
                keyHandler: false,
                keyListenerAbove: true
              }
            },
            data: {
              details: {
                reasonCode: 'CLICK_HANDLER_KEY_LISTENER_ABOVE',
                role,
                focusable: selfFocusable
              }
            }
          })
        );
        continue;
      }
      questions.push(
        helpers.reportOccurrence(el, {
          summary: `This <${tag}> runs a click handler and takes keyboard focus, but has no key handler of its own, so Enter and Space may do nothing.`,
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
      hookKeyAbove ||
      ancestorList.some(
        (a) =>
          trim(dom.getAttribute(a, 'aria-activedescendant')) ||
          (COMPOSITE_ROLES.has(helpers.aria.getAuthorRole(a) || '') && focusOf(a).focusable)
      );

    if (FAIL_ROLES.has(role) && !managedFromAbove) {
      fails.push(
        helpers.reportOccurrence(el, {
          summary: `This element has role="${role}" and a click handler, but neither it nor anything in it can take keyboard focus, so a keyboard user cannot reach it.`,
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
        summary: `This <${tag}> runs a click handler, but neither it nor anything in it can take keyboard focus.`,
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
