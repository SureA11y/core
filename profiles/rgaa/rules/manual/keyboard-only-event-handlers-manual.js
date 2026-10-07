/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check keyboard-only-event-handlers
 * @atomic true
 * @summary Keyboard-only inline event handlers should have a pointer equivalent
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to elements that carry a non-empty inline key handler
 *   (`onkeydown`, `onkeyup` or `onkeypress`) and are not interactive
 *   natively: not a link or area with href, button, input other than
 *   hidden, select, textarea, option, summary, details, label, iframe,
 *   embed, audio or video with controls, img with usemap, or an element
 *   made editable with contenteditable. Hidden content is skipped, as in
 *   the other rules. A page with no such element is notApplicable.
 * @expectation
 *   Each such element with no inline click or pointer handler (`onclick`,
 *   `ondblclick`, `onmousedown`, `onmouseup`, `onpointerdown`,
 *   `onpointerup`, `ontouchstart`, `ontouchend`) is flagged (cantTell) for
 *   a person to check RGAA 7.3.1 steps 4 and 5: the action is also
 *   available with any pointing device (mouse, touch, stylus), on this
 *   element or on another element of the page that does the same thing.
 *   Never pass or fail.
 * @implementation-notes
 * - WCAG 2.1.1 asks for keyboard access only, so mouse-only-event-handlers
 *   reports the pointer-only side. RGAA 7.3.1 asks for keyboard and pointer
 *   access alike, and this rule asks the pointer side.
 * - Manual (cantTell): a handler attached from a script file
 *   (addEventListener) cannot be seen in the markup, so a missing
 *   onclick is not proof, and the key handler may only add shortcuts to a
 *   component that a pointer can already use.
 * - A native interactive element is skipped: it is reachable and
 *   activable with a pointer on its own.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'keyboard-only-event-handlers';

const meta = {
  title: 'Keyboard-only inline event handlers should have a pointer equivalent',
  description:
    'Flags elements that are not interactive natively and have an inline key handler (onkeydown, onkeyup, onkeypress) but no click or pointer handler, for a person to check that the action also works with a mouse, touch or stylus.',
  i18n: {
    titleKey: 'keyboardOnlyEventHandlers_title',
    descriptionKey: 'keyboardOnlyEventHandlers_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'structure', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'low',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const KEY_ATTRS = ['onkeydown', 'onkeyup', 'onkeypress'];
  const POINTER_ATTRS = [
    'onclick',
    'ondblclick',
    'onmousedown',
    'onmouseup',
    'onpointerdown',
    'onpointerup',
    'ontouchstart',
    'ontouchend'
  ];

  function trim(v) {
    return (v == null ? '' : String(v)).trim();
  }

  function isNativeInteractive(el) {
    const tag = String(dom.localName(el) || '').toLowerCase();
    switch (tag) {
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
      case 'details':
      case 'label':
      case 'iframe':
      case 'embed':
        return true;
      case 'audio':
      case 'video':
        return dom.hasAttribute(el, 'controls');
      case 'img':
        return dom.hasAttribute(el, 'usemap');
      default:
        break;
    }
    const editable = dom.getAttribute(el, 'contenteditable');
    return editable != null && trim(editable).toLowerCase() !== 'false';
  }

  const selector = KEY_ATTRS.map((a) => `[${a}]`).join(', ');
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(selector)
    : helpers.queryAll(selector);

  const occurrences = [];
  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    const keyAttrs = KEY_ATTRS.filter((a) => trim(dom.getAttribute(el, a)));
    if (!keyAttrs.length) continue;
    if (isNativeInteractive(el)) continue;
    if (POINTER_ATTRS.some((a) => trim(dom.getAttribute(el, a)))) continue;

    const element = String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();
    const attrs = keyAttrs.join(', ');
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: `This <${element}> has ${attrs} but no click or pointer handler.`,
        hint: 'Check that the action also works with a mouse, touch or stylus, on this element or on another element of the page that does the same thing (RGAA 7.3.1). A handler attached from a script file does not show in the markup.',
        i18n: {
          summaryKey: 'keyboardOnlyEventHandlers_summary_cantTell',
          hintKey: 'keyboardOnlyEventHandlers_hint_cantTell',
          params: { element, attrs }
        },
        data: {
          details: { reasonCode: 'keyboardOnlyHandler', element, keyAttrs },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'moderate',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
