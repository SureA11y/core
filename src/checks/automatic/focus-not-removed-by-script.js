/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check focus-not-removed-by-script
 * @atomic true
 * @summary A script must not remove focus from an element as it receives it
 * @standard WCAG 2.2
 * @sc 2.1.1, 2.4.7
 * @type automatic
 * @applicability
 *   Elements that can take focus, that the page renders, and whose inline
 *   `onfocus` handler calls `blur()`, or `focus()` on another element.
 *   Without such an element, or in a document where none can take focus,
 *   nothing is applicable.
 * @expectation
 *   WCAG failure F55: a script that removes focus from an element when it
 *   receives it leaves a keyboard user unable to reach or operate it, and
 *   unable to see where focus is.
 *   - `FOCUS_HANDLER_BLURS_SELF`: fail, on an element in the tab order,
 *     when the handler does only that
 *     (`this.blur()`, `blur()`, or `blur()` on `event.target` or
 *     `event.currentTarget`, by name or in brackets, possibly behind
 *     `if (this.blur)`, with at most a `return`), as F55's examples do.
 *     Focus goes nowhere: it is dropped, not sent elsewhere. Outside the tab
 *     order (tabindex="-1"), where a keyboard user doesn't reach it, it is
 *     asked about.
 *   Each other element is asked about (cantTell):
 *   - `FOCUS_HANDLER_CALLS_BLUR` when it calls `blur()` among other code, or
 *     on another element, where whether focus is lost depends on the
 *     script;
 *   - `FOCUS_HANDLER_MOVES_FOCUS` when it calls `focus()` on another
 *     element (`document.body.focus()`), which takes focus away as it
 *     arrives, as F55's test checks.
 *   A handler that sends focus somewhere (a focus-trap sentinel, a redirect)
 *   is the moves case and is asked about, never failed: the rule reads the
 *   handler's text, not what the page does, and a person can confirm it by
 *   tabbing to the element.
 * @reports
 *   - `reasonCode`: `FOCUS_HANDLER_BLURS_SELF`, `FOCUS_HANDLER_CALLS_BLUR` or
 *     `FOCUS_HANDLER_MOVES_FOCUS`.
 *   - `handler`: the onfocus attribute's value, whitespace collapsed, up to
 *     120 characters; a longer one is cut and ends in `…`.
 *   - `tabbable`: whether the element is in the tab order. One that is not
 *     can still receive focus from a click or a script.
 * @reason-codes
 *   - `FOCUS_HANDLER_BLURS_SELF` (fail, cantTell): the element's onfocus
 *     handler does nothing but call blur() on it, so focus is removed as it
 *     arrives; it fails in the tab order and is asked about outside it.
 *     Basis: WCAG 2.1.1; WCAG 2.4.7; F55.
 *   - `FOCUS_HANDLER_CALLS_BLUR` (cantTell): the element's onfocus handler
 *     calls blur() among other code or on another element; whether focus is
 *     lost depends on the script.
 *     Basis: WCAG 2.1.1 (not settled); WCAG 2.4.7 (not settled); F55.
 *   - `FOCUS_HANDLER_MOVES_FOCUS` (cantTell): the element's onfocus handler
 *     calls focus() on another element, so focus may move away as it arrives.
 *     Basis: WCAG 2.1.1 (not settled); WCAG 2.4.7 (not settled); F55.
 * @implementation-notes
 * - Only inline `onfocus` attributes are read. A focus listener added with
 *   addEventListener, and a blur() delayed by setTimeout, are not seen: the
 *   rule does not focus elements to watch what happens, which would run the
 *   page's handlers and change the page for the rules that follow, and cost
 *   time on large pages.
 * - A bare `blur()` in an inline handler is the element's own: inline
 *   handlers look names up on the element first.
 * - F55 also names WCAG 3.2.1, which core has no rollup for; the rule counts
 *   toward 2.1.1 and 2.4.7.
 */

const id = 'focus-not-removed-by-script';

const meta = {
  title: 'A script does not remove focus from an element as it receives it',
  description:
    'Fails elements whose inline onfocus handler only calls blur() on them, and asks about those whose handler calls blur() otherwise, or focus() on another element, which can remove focus as soon as the element receives it (WCAG failure F55).',
  i18n: {
    titleKey: 'focusNotRemovedByScript_title',
    descriptionKey: 'focusNotRemovedByScript_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag2aa', 'wcag211', 'wcag247', 'navigation', 'focus', 'atomic', 'automatic'],
  wcagSc: ['2.1.1', '2.4.7'],
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
      requirement: '2.4.7',
      title: 'Focus Visible',
      conformanceLevel: 'AA'
    }
  ],
  defaultSeverity: 'serious',
  category: 'operable',
  type: 'automatic',
  defaultConfidence: 'medium',
  coverage: {
    facetsBySc: {
      '2.1.1': ['focus-not-removed-by-script-evidence'],
      '2.4.7': ['focus-not-removed-by-script-evidence']
    }
  },
  // Picked from a table by the handler's kind, which
  // scripts/generate-finding-ids.js can't read from the source.
  reasonCodes: ['FOCUS_HANDLER_BLURS_SELF', 'FOCUS_HANDLER_CALLS_BLUR', 'FOCUS_HANDLER_MOVES_FOCUS']
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  // blur() and focus() as a call, by name or in brackets (this['blur']()).
  const CALLS_BLUR = /\bblur\s*\(|\[\s*['"]blur['"]\s*\]\s*\(/;
  const CALLS_FOCUS = /\.\s*focus\s*\(|\[\s*['"]focus['"]\s*\]\s*\(/g;
  // focus() on the element itself keeps focus where it is.
  const FOCUSES_SELF =
    /(?:^|[^\w$.])(?:this|event\.(?:target|currentTarget))\s*(?:\.\s*focus|\[\s*['"]focus['"]\s*\])\s*\(/g;
  // Nothing but blur() on the element itself, possibly behind a check that
  // it has one (F55's Example 3: if(this.blur)this.blur();), and at most a
  // return.
  const SELF_BLUR = String.raw`(?:(?:this|event\.(?:target|currentTarget))\s*(?:\.\s*blur|\[\s*['"]blur['"]\s*\])|blur)`;
  const BLURS_SELF = new RegExp(
    String.raw`^(?:if\s*\(\s*` +
      SELF_BLUR +
      String.raw`\s*\)\s*)?` +
      SELF_BLUR +
      String.raw`\s*\(\s*\)\s*;?\s*(?:return(?:\s+(?:true|false))?\s*;?\s*)?$`
  );
  // Whether the handler calls focus() on something other than the element.
  function movesFocus(handler) {
    const all = (handler.match(CALLS_FOCUS) || []).length;
    const own = (handler.match(FOCUSES_SELF) || []).length;
    return all > own;
  }

  function canTakeFocus(el) {
    if (!helpers.getFocusableInfo) return { focusable: true, tabbable: true };
    try {
      const info = helpers.getFocusableInfo(el, ctx) || {};
      return { focusable: !!info.focusable, tabbable: !!info.tabbable };
    } catch {
      return { focusable: false, tabbable: false };
    }
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('[onfocus]')
    : helpers.queryAll('[onfocus]');

  const occurrences = [];
  const fails = [];
  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    const handler = String(dom.getAttribute(el, 'onfocus') || '')
      .replace(/\s+/g, ' ')
      .trim();
    const blurs = CALLS_BLUR.test(handler);
    const moves = !blurs && movesFocus(handler);
    if (!blurs && !moves) continue;

    const elig = helpers.isAccTreeEligible ? helpers.isAccTreeEligible(el, ctx) : true;
    if (!(typeof elig === 'boolean' ? elig : !!(elig && elig.eligible))) continue;
    const focus = canTakeFocus(el);
    if (!focus.focusable) continue; // its focus handler never runs

    const shown = handler.length > 120 ? `${handler.slice(0, 119)}…` : handler;
    const tag = String(dom.tagName(el) || '').toLowerCase();
    const self = blurs && BLURS_SELF.test(handler);
    const kind = self ? 'self' : blurs ? 'calls' : 'moves';
    const SUMMARIES = {
      self: `This <${tag}> removes focus from itself as soon as it receives it (onfocus="${shown}").`,
      calls: `This <${tag}>'s onfocus handler calls blur(), which may remove focus as it arrives (onfocus="${shown}").`,
      moves: `This <${tag}>'s onfocus handler moves focus to another element as it arrives (onfocus="${shown}").`
    };
    const CODES = {
      self: 'FOCUS_HANDLER_BLURS_SELF',
      calls: 'FOCUS_HANDLER_CALLS_BLUR',
      moves: 'FOCUS_HANDLER_MOVES_FOCUS'
    };
    const details = {
      reasonCode: CODES[kind],
      handler: shown,
      tabbable: focus.tabbable
    };
    // F55 is about keyboard focus: an element in the tab order that drops
    // it fails; one outside it is reached by click or script only, and asked
    // about like the rest.
    if (self && focus.tabbable) {
      fails.push(
        helpers.reportOccurrence(el, {
          summary: SUMMARIES.self,
          hint: 'Remove the blur() call so focus stays on the element, or make the element unfocusable if it should not take focus at all (WCAG failure F55).',
          i18n: {
            summaryKey: 'focusNotRemovedByScript_summary_fail_self',
            hintKey: 'focusNotRemovedByScript_hint_fail',
            params: { element: tag, handler: shown }
          },
          occurrenceOutcome: 'fail',
          data: { details }
        })
      );
      continue;
    }
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: SUMMARIES[kind],
        hint: 'Tab to the element and check that focus stays on it. A script must not remove focus from an element that receives it (WCAG failure F55): remove the blur() call, or make the element unfocusable if it should not take focus at all.',
        i18n: {
          summaryKey: `focusNotRemovedByScript_summary_cantTell_${kind}`,
          hintKey: 'focusNotRemovedByScript_hint_cantTell',
          params: { element: tag, handler: shown }
        },
        uncertainty: {
          code: 'judgement-required',
          needed: 'Whether focus stays on the element when it receives it.'
        },
        data: {
          details: {
            reasonCode: CODES[kind],
            handler: shown,
            tabbable: focus.tabbable
          }
        }
      })
    );
  }

  if (!occurrences.length && !fails.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    ...helpers.resolveTieredOutcome(fails, occurrences, rule.defaultSeverity || 'serious')
  };
}

module.exports = { id, meta, runInPage };
