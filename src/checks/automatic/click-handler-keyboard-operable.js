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
 *   - native controls, whose own keyboard behaviour reaches the user: a link
 *     or area with `href`, `button`, `input` other than hidden, `select`,
 *     `textarea`, `option`, `summary`, `label` (it activates its control,
 *     which takes focus itself), `iframe`, `embed`, `audio` or `video` with
 *     `controls`, and an editing host (`contenteditable`);
 *   - an element containing a control whose keyboard activation fires
 *     `click` (a link or area with `href`, `button`, `summary`, or an input of
 *     type button, submit, reset, image, checkbox or radio) that can take
 *     focus: the control's click bubbles to the handler, so this is event
 *     delegation and the keyboard already runs it;
 *   - an element that cannot take focus, has no descendant that can, has no
 *     widget role and no `cursor: pointer`: nothing tells the user it is
 *     clickable, and such a handler often only tracks clicks or stops their
 *     propagation.
 * @expectation
 *   A keyboard user can run what the click runs. Chromium fires `click` on
 *   Enter or Space for native controls only: a `<span role="button"
 *   tabindex="0" onclick>` gets focus but does nothing on either key.
 *   - The element, or one of its descendants, can take focus, and an inline
 *     key handler (`onkeydown`, `onkeyup`, `onkeypress`) is on it, an
 *     ancestor or a descendant, so key events from the focused element can
 *     reach one: pass.
 *   - The element or a descendant can take focus, but no inline key handler
 *     is there: cantTell (`CLICK_HANDLER_NO_KEY_HANDLER`), check that Enter
 *     and Space do what a click does.
 *   - Neither it nor a descendant can take focus, and its role is button,
 *     link, checkbox or switch: fail (`CLICK_HANDLER_CONTROL_NOT_FOCUSABLE`).
 *     The element says it is a control, and Tab never reaches it, as in
 *     WCAG failure F42 for scripted links. Unless an ancestor carries
 *     `aria-activedescendant` or an inline key handler, which may operate it
 *     without moving focus to it: then cantTell.
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
  const KEY_SELECTOR = '[onkeydown], [onkeyup], [onkeypress]';
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
  const ACTIVABLE_SELECTOR = 'a[href], area[href], button, input, summary';
  const CLICKING_INPUT_TYPES = new Set(['button', 'submit', 'reset', 'image', 'checkbox', 'radio']);
  const FOCUSABLE_CANDIDATES =
    'a[href], area[href], button, input, select, textarea, summary, iframe, [tabindex], [contenteditable]';

  function trim(v) {
    return (v == null ? '' : String(v)).trim();
  }
  function tagOf(el) {
    return String(dom.localName(el) || '').toLowerCase();
  }
  function hasKeyAttr(el) {
    return KEY_ATTRS.some((a) => trim(dom.getAttribute(el, a)));
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

  function canTakeFocus(el) {
    try {
      const info = helpers.getFocusableInfo(el, ctx);
      return !!(info && info.focusable);
    } catch {
      return false;
    }
  }

  function shown(el) {
    return !(helpers.isHiddenContent && helpers.isHiddenContent(el));
  }

  function descendants(el, selector) {
    try {
      return Array.from(dom.querySelectorAll(el, selector));
    } catch {
      return [];
    }
  }

  // Enter or Space on these fires click, which bubbles to the handler.
  function firesClickFromKeyboard(d) {
    if (tagOf(d) === 'input') {
      const type = trim(dom.getAttribute(d, 'type')).toLowerCase() || 'text';
      if (!CLICKING_INPUT_TYPES.has(type)) return false;
    }
    return shown(d) && canTakeFocus(d);
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
    if (!trim(dom.getAttribute(el, 'onclick'))) continue;
    const tag = tagOf(el);
    if (tag === 'html' || tag === 'body') continue;
    if (isNativeControl(el)) continue;
    if (descendants(el, ACTIVABLE_SELECTOR).some(firesClickFromKeyboard)) continue;

    const role = helpers.aria.getAuthorRole(el) || '';
    const selfFocusable = canTakeFocus(el);
    const reachable =
      selfFocusable ||
      descendants(el, FOCUSABLE_CANDIDATES).some((d) => shown(d) && canTakeFocus(d));
    const ancestorList = ancestors(el);
    const keyAbove = ancestorList.some(hasKeyAttr);
    const keyHandled = hasKeyAttr(el) || keyAbove || descendants(el, KEY_SELECTOR).some(hasKeyAttr);

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

    const managedFromAbove =
      keyAbove || ancestorList.some((a) => trim(dom.getAttribute(a, 'aria-activedescendant')));

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
