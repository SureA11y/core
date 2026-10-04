/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check mouse-only-event-handlers
 * @atomic true
 * @summary Pointer-only inline event handlers should have a keyboard-reachable equivalent
 * @standard WCAG 2.2
 * @sc 2.1.1
 * @applicability
 *   Elements carrying at least one inline pointer-only event-handler
 *   attribute (`onmouseover`, `onmouseout`, `onmousedown`, `onmouseup`,
 *   `ondblclick`, `onmousemove`, `onmouseenter`, `onmouseleave`) with a
 *   non-empty value, that are also eligible/reachable (not
 *   hidden/`aria-hidden`/`display:none`).
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
 *   run.
 * @reports
 *   - `mouseAttrs`: the pointer-only handler attributes the element
 *     carries. One item is an attribute name, such as `onmouseover`.
 *   - `keyboardAttrs` (handlers that cannot run,
 *     `MOUSE_ONLY_HANDLER_KEYBOARD_EQUIVALENT_NOT_FOCUSABLE`): the keyboard
 *     handler attributes the element carries, which keyboard events cannot
 *     reach. One item is an attribute name, such as `onfocus`.
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
 * - Only inline HTML attribute handlers are detectable; JS-attached
 *   listeners (`addEventListener('mouseover', ...)`) are invisible to a
 *   static DOM scan. That's a documented limitation, not an oversight.
 */

const id = 'mouse-only-event-handlers';

const meta = {
  title: 'Pointer-only inline event handlers should have a keyboard-reachable equivalent',
  description:
    'Flags elements with an inline pointer-only event handler (onmouseover, onmouseout, onmousedown, onmouseup, ondblclick, onmousemove, onmouseenter, onmouseleave) and no keyboard-reachable equivalent (onkeydown/onkeyup/onkeypress/onfocus/onblur), for manual review.',
  i18n: {
    titleKey: 'mouseOnlyEventHandlers_title',
    descriptionKey: 'mouseOnlyEventHandlers_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag211', 'structure', 'atomic', 'manual'],
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
  defaultSeverity: 'moderate',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'low',
  coverage: { facetsBySc: { '2.1.1': ['mouse-only-event-handlers-evidence'] } }
};

function runInPage(ctx) {
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
      descendants = Array.from(el.querySelectorAll(FOCUSABLE_CANDIDATES));
    } catch {
      return true;
    }
    return descendants.some((d) => canTakeFocus(d));
  }

  const selector = MOUSE_ONLY_ATTRS.map((a) => `[${a}]`).join(', ');
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(selector)
    : helpers.queryAll(selector);

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;

    const presentMouseAttrs = MOUSE_ONLY_ATTRS.filter((a) => trim(el.getAttribute(a)));
    if (!presentMouseAttrs.length) continue;

    const eligResult = helpers.isAccTreeEligible ? helpers.isAccTreeEligible(el, ctx) : true;
    const eligible =
      typeof eligResult === 'boolean' ? eligResult : !!(eligResult && eligResult.eligible);
    if (!eligible) continue;

    applicableCount += 1;

    const presentKeyboardAttrs = KEYBOARD_EQUIV_ATTRS.filter((a) => trim(el.getAttribute(a)));
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
