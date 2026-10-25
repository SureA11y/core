/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check mouse-only-event-handlers
 * @atomic true
 * @summary Pointer-only event handlers should have a keyboard-reachable equivalent
 * @standard WCAG 2.2
 * @sc 2.1.1, 2.1.3
 * @applicability
 *   Elements carrying at least one inline pointer-only event-handler
 *   attribute (`onmouseover`, `onmouseout`, `onmousedown`, `onmouseup`,
 *   `ondblclick`, `onmousemove`, `onmouseenter`, `onmouseleave`) with a
 *   non-empty value, or, where the page runs the listener hook
 *   (`listenerHookScript`), a listener of one of those types added from
 *   script (`addEventListener` or the `on…` property), that are also
 *   eligible/reachable (not hidden/`aria-hidden`/`display:none`).
 * @expectation
 *   The element also carries at least one keyboard-reachable inline
 *   handler: `onkeydown`, `onkeyup`, `onkeypress` (the direct keyboard-
 *   event equivalents), or `onfocus`/`onblur` (the standard substitute
 *   for hover-triggered behavior: focus/blur are the keyboard-
 *   navigable analog to mouseover/mouseout, per WCAG technique G90).
 *   A handler is reachable only if keyboard events can reach it:
 *   `onfocus`/`onblur` when the element itself can take focus, and a key
 *   handler when the element or one of its descendants can (key events
 *   bubble, focus events do not). Otherwise the element's mouse-driven
 *   behavior (a hover tooltip, a custom dropdown, a drag interaction) has
 *   no way to be triggered by a keyboard-only user, and it is flagged with
 *   a reason saying whether the keyboard handlers are missing or cannot
 *   run. With the listener hook, a key, focus or blur listener added from
 *   script on the element counts as the matching inline handler does, and
 *   so do `focusin`/`focusout` listeners, which, like key events, also
 *   fire for a focused descendant.
 * @reports
 *   - `mouseAttrs`: the pointer-only handlers the element has. One item is
 *     an attribute name, such as `onmouseover`; a listener added from
 *     script is named as the attribute of its type.
 *   - `keyboardAttrs` (handlers that cannot run,
 *     `MOUSE_ONLY_HANDLER_KEYBOARD_EQUIVALENT_NOT_FOCUSABLE`): the keyboard
 *     handler attributes the element carries, which keyboard events cannot
 *     reach. One item is an attribute name, such as `onfocus`.
 * @reason-codes
 *   - `MOUSE_ONLY_HANDLER_NO_KEYBOARD_EQUIVALENT` (cantTell): the element has
 *     pointer-only event handlers and no key, focus or blur handler.
 *     Basis: WCAG 2.1.1 (not settled); WCAG 2.1.3 (not settled); F54.
 *   - `MOUSE_ONLY_HANDLER_KEYBOARD_EQUIVALENT_NOT_FOCUSABLE` (cantTell): the
 *     element has pointer-only event handlers, and its keyboard handlers
 *     cannot run because neither it nor anything inside it can take focus.
 *     Basis: WCAG 2.1.1 (not settled); WCAG 2.1.3 (not settled); F54.
 * @implementation-notes
 * - Authored as `type: 'manual'` (cantTell-capped, never fail), not
 *   `automatic`: this can only see inline `on*="..."` HTML attributes.
 *   A keyboard handler attached elsewhere via `addEventListener` (the
 *   norm in most modern frameworks) is invisible to a static markup
 *   scan and would make a `fail` a false positive. Surfaced by a diff
 *   against a legacy ruleset's WCAG2AA rules; this is a real, well-known
 *   WCAG 2.1.1 anti-pattern
 *   (technique G90/F54) that nothing else in this rule set checks.
 * - Does NOT treat `onclick` as a keyboard-equivalent excuse on purpose:
 *   whether `onclick` is keyboard-reachable depends on the
 *   element's separate focusability (native interactive tag or
 *   `tabindex`), which this rule does not attempt to cross-check, and
 *   for the specific hover-triggered handlers this rule targets
 *   (`onmouseover`/`onmouseout`/etc.), `onclick` isn't actually an
 *   equivalent interaction model regardless of focusability (hover and
 *   click are different gestures with different semantics).
 * - Without the listener hook, only inline HTML attribute handlers are
 *   detectable; JS-attached listeners (`addEventListener('mouseover',
 *   ...)`) are invisible to a static DOM scan. With it
 *   (`listenerHookScript`), listeners on the element itself are seen; one
 *   on an ancestor is left out, as nothing tells which element it serves.
 *   The rule stays manual either way: a pointer listener may only track
 *   the pointer or draw a hover effect, which needs no keyboard
 *   equivalent.
 */

const id = 'mouse-only-event-handlers';

const meta = {
  title: 'Pointer-only event handlers should have a keyboard-reachable equivalent',
  description:
    'Flags elements with a pointer-only event handler (onmouseover, onmouseout, onmousedown, onmouseup, ondblclick, onmousemove, onmouseenter, onmouseleave), inline or, with the listener hook, added from script, and no keyboard-reachable equivalent (onkeydown/onkeyup/onkeypress/onfocus/onblur), for manual review.',
  i18n: {
    titleKey: 'mouseOnlyEventHandlers_title',
    descriptionKey: 'mouseOnlyEventHandlers_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag2aaa', 'wcag211', 'wcag213', 'structure', 'atomic', 'manual'],
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
  defaultSeverity: 'moderate',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'low',
  coverage: {
    facetsBySc: {
      '2.1.1': ['mouse-only-event-handlers-evidence'],
      '2.1.3': ['mouse-only-event-handlers-evidence']
    }
  },
  // How a person checks each undecided finding: shown with it as
  // howToCheck (docs/OUTPUT_SCHEMA.md).
  review: {
    MOUSE_ONLY_HANDLER_KEYBOARD_EQUIVALENT_NOT_FOCUSABLE: {
      steps: [
        'Find the element the report names and note what its mouse handlers do by hovering or clicking it.',
        'Press Tab through that part of the page and watch whether focus ever lands on the element or on something inside it.',
        'If it does, try Enter, Space and the arrow keys and compare with what the mouse did.'
      ],
      passWhen:
        'The element (or something inside it) gets keyboard focus and its key or focus handlers give the same result as the mouse, or the mouse action is only visual.',
      failWhen:
        'Focus never reaches the element, so its keyboard handlers never run and the mouse action cannot be done by keyboard, which fails WCAG 2.1.1 (F54).'
    },
    MOUSE_ONLY_HANDLER_NO_KEYBOARD_EQUIVALENT: {
      steps: [
        'Find the element the report names and note its mouse handlers (such as onmouseover or ondblclick).',
        'Hover, click or double-click it with the mouse and note what happens (a menu opens, a tooltip shows, an item moves).',
        'Reload, then use only the keyboard: Tab to the element (or the control around it) and try Enter, Space, the arrow keys and Escape.',
        'Check whether the same result happens, or whether the same function is offered by another control a keyboard can reach.'
      ],
      passWhen:
        'The mouse action only adds a visual effect, or the keyboard gets the same result on focus or with a key.',
      failWhen:
        'Something the mouse does (opening a menu, showing information, moving an item) cannot be done with the keyboard, which fails WCAG 2.1.1 (F54).'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const MOUSE_ONLY_ATTRS = [
    'onmouseover',
    'onmouseout',
    'onmousedown',
    'onmouseup',
    'ondblclick',
    'onmousemove',
    'onmouseenter',
    'onmouseleave'
  ];
  const KEYBOARD_EQUIV_ATTRS = ['onkeydown', 'onkeyup', 'onkeypress', 'onfocus', 'onblur'];

  function trim(v) {
    return (v == null ? '' : String(v)).trim();
  }

  // Listeners added from script, as the opt-in listener hook records them
  // (helpers.getEventListenerInfo); none without the hook. Each is named as
  // the handler attribute of its type (a mouseover listener as
  // onmouseover), so it reads like the inline handlers beside it.
  // focusin and focusout bubble from a focused descendant, as key events do.
  const HOOK_KEYBOARD_TYPES = [
    'keydown',
    'keyup',
    'keypress',
    'focus',
    'blur',
    'focusin',
    'focusout'
  ];
  function listenedHandlers(el, attrs, extraTypes) {
    if (typeof helpers.getEventListenerInfo !== 'function') return [];
    const types = attrs.map((a) => a.slice(2)).concat(extraTypes || []);
    const out = [];
    for (const type of types) {
      try {
        if (helpers.getEventListenerInfo(el, [type]).listens) out.push('on' + type);
      } catch {}
    }
    return out;
  }
  function union(a, b) {
    const out = a.slice();
    for (const x of b) if (out.indexOf(x) === -1) out.push(x);
    return out;
  }

  const FOCUS_ATTRS = ['onfocus', 'onblur'];
  const FOCUSABLE_CANDIDATES =
    'a[href], area[href], button, input, select, textarea, summary, iframe, [tabindex], [contenteditable]';

  function canTakeFocus(el) {
    if (!helpers.getFocusableInfo) return true;
    try {
      const info = helpers.getFocusableInfo(el, ctx);
      return !!(info && info.focusable);
    } catch {
      return true;
    }
  }

  // Focus and blur fire only on the element that takes focus. Key events are
  // dispatched to the focused element and bubble, so a key handler also runs
  // for a focusable descendant.
  function keyboardCanReach(el, keyboardAttrs) {
    if (canTakeFocus(el)) return true;
    if (keyboardAttrs.every((a) => FOCUS_ATTRS.indexOf(a) !== -1)) return false;
    let descendants;
    try {
      descendants = Array.from(dom.querySelectorAll(el, FOCUSABLE_CANDIDATES));
    } catch {
      return true;
    }
    // A descendant the page does not show (a closed <details>,
    // hidden="until-found") takes no focus.
    return descendants.some(
      (d) => !(helpers.isHiddenContent && helpers.isHiddenContent(d)) && canTakeFocus(d)
    );
  }

  const selector = MOUSE_ONLY_ATTRS.map((a) => `[${a}]`).join(', ');
  // With the listener hook, elements given a pointer listener from script
  // are candidates too.
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(selector, {
        listenerTypes: MOUSE_ONLY_ATTRS.map((a) => a.slice(2))
      })
    : helpers.queryAll(selector);

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;

    const presentMouseAttrs = union(
      MOUSE_ONLY_ATTRS.filter((a) => trim(dom.getAttribute(el, a))),
      listenedHandlers(el, MOUSE_ONLY_ATTRS)
    );
    if (!presentMouseAttrs.length) continue;

    const eligResult = helpers.isAccTreeEligible ? helpers.isAccTreeEligible(el, ctx) : true;
    const eligible =
      typeof eligResult === 'boolean' ? eligResult : !!(eligResult && eligResult.eligible);
    if (!eligible) continue;

    applicableCount += 1;

    const presentKeyboardAttrs = union(
      KEYBOARD_EQUIV_ATTRS.filter((a) => trim(dom.getAttribute(el, a))),
      listenedHandlers(el, [], HOOK_KEYBOARD_TYPES)
    );
    if (presentKeyboardAttrs.length && keyboardCanReach(el, presentKeyboardAttrs)) continue;
    const unreachable = presentKeyboardAttrs.length > 0;

    const eligInfo = helpers.getEligibilityInfo
      ? helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' })
      : null;

    if (unreachable) {
      occurrences.push(
        helpers.reportOccurrence(el, {
          summary: `This element has ${presentMouseAttrs.join(', ')} and ${presentKeyboardAttrs.join(', ')}, but it cannot take keyboard focus, so the keyboard handlers never run.`,
          hint: 'Make the element focusable (use a native control, or add tabindex="0"), or move the handlers to a focusable element, so this functionality is also reachable by keyboard.',
          i18n: {
            summaryKey: 'mouseOnlyEventHandlers_summary_cantTell_notFocusable',
            hintKey: 'mouseOnlyEventHandlers_hint_cantTell_notFocusable',
            params: {
              attrs: presentMouseAttrs.join(', '),
              keyboardAttrs: presentKeyboardAttrs.join(', ')
            }
          },
          data: {
            details: {
              reasonCode: 'MOUSE_ONLY_HANDLER_KEYBOARD_EQUIVALENT_NOT_FOCUSABLE',
              mouseAttrs: presentMouseAttrs,
              keyboardAttrs: presentKeyboardAttrs
            },
            visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
          }
        })
      );
      continue;
    }

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: `This element has ${presentMouseAttrs.join(', ')} but no keyboard-reachable equivalent handler.`,
        hint: 'Check with the keyboard whether this behavior can be triggered: a keyboard handler added from script counts, and a purely visual hover effect needs none. If it can’t be, add keyboard handling that does the same thing (onkeydown, or onfocus/onblur for hover behavior).',
        i18n: {
          summaryKey: 'mouseOnlyEventHandlers_summary_cantTell',
          hintKey: 'mouseOnlyEventHandlers_hint_cantTell',
          params: { attrs: presentMouseAttrs.join(', ') }
        },
        data: {
          details: {
            reasonCode: 'MOUSE_ONLY_HANDLER_NO_KEYBOARD_EQUIVALENT',
            mouseAttrs: presentMouseAttrs
          },
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
      severity: rule.defaultSeverity || 'moderate',
      occurrences
    };
  }

  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
