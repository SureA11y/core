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
 *     It leans fail when the element is in the tab order and blur() is
 *     called on it as a statement of its own, outside any condition or
 *     callback, with no return before it.
 *     Basis: WCAG 2.1.1 (not settled); WCAG 2.4.7 (not settled); F55.
 *   - `FOCUS_HANDLER_MOVES_FOCUS` (cantTell): the element's onfocus handler
 *     calls focus() on another element, so focus may move away as it arrives.
 *     It leans pass when the element is a focus-trap sentinel (a plain,
 *     empty, unnamed element in the tab order, in or beside a dialog, or at
 *     the edge of a container holding focusable content), and fail when it
 *     is a visible control with a name, in the tab order, that calls focus()
 *     as a statement of its own, outside any condition or callback.
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
    'Fails elements in the tab order whose inline onfocus handler only calls blur() on them, and asks about other handlers that call blur(), or focus() on another element, which can remove focus as soon as the element receives it (WCAG failure F55).',
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
  reasonCodes: [
    'FOCUS_HANDLER_BLURS_SELF',
    'FOCUS_HANDLER_CALLS_BLUR',
    'FOCUS_HANDLER_MOVES_FOCUS'
  ],
  // How a person checks each undecided finding: shown with it as
  // howToCheck (docs/OUTPUT_SCHEMA.md).
  review: {
    FOCUS_HANDLER_BLURS_SELF: {
      steps: [
        'Click just before the element the report names, then press Tab until focus should reach it (if it is not in the tab order, click it instead).',
        'Watch the focus indicator and, in the developer tools console, check document.activeElement.',
        'Press Tab once more and see where focus goes.'
      ],
      passWhen:
        'Focus stays on the element, its focus indicator shows, and the next Tab moves on to the next control.',
      failWhen:
        'Focus disappears from the element as it arrives, so it cannot be reached or operated by keyboard, which fails WCAG 2.1.1 and 2.4.7 (F55).'
    },
    FOCUS_HANDLER_CALLS_BLUR: {
      steps: [
        'Read the onfocus handler the report quotes and note when it calls blur() and on which element.',
        'Click just before the element, then press Tab until focus should reach it; repeat in any state the handler tests for (for example, a field filled in or empty).',
        'Watch the focus indicator and check document.activeElement in the developer tools console.',
        'Try to operate the element with the keyboard (type, press Enter or Space).'
      ],
      passWhen:
        'In every state, focus stays on the element, its focus indicator shows, and it can be operated by keyboard.',
      failWhen:
        'In some state focus is removed as the element receives it, so it cannot be operated by keyboard or focus is lost from view, which fails WCAG 2.1.1 and 2.4.7 (F55).'
    },
    FOCUS_HANDLER_MOVES_FOCUS: {
      steps: [
        'Read the onfocus handler the report quotes and note which element it sends focus to.',
        'Click just before the element, then press Tab until focus should reach it, and see where focus lands (check document.activeElement in the console).',
        'If the element is an invisible, unnamed sentinel at the edge of a dialog that wraps focus back inside, note that this is a focus trap for a modal and expected.',
        'Otherwise, try to operate the element with the keyboard and press Shift+Tab to see whether you can go back.'
      ],
      passWhen:
        "Focus goes to a sensible place (a dialog's focus wrap) or stays on the element, and every control can still be reached and operated by keyboard.",
      failWhen:
        'A visible control sends focus elsewhere as it arrives, so it cannot be reached or operated by keyboard, which fails WCAG 2.1.1 and 2.4.7 (F55).'
    }
  }
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

  // The handler's top-level statements: split on the semicolons and the
  // closing braces that are outside any bracket or string, so a call in a
  // condition, a callback or a block stays inside its statement.
  function topStatements(code) {
    const out = [];
    let depth = 0;
    let quote = '';
    let cur = '';
    for (let i = 0; i < code.length; i++) {
      const ch = code[i];
      cur += ch;
      if (quote) {
        if (ch === '\\') {
          cur += code[i + 1] || '';
          i += 1;
        } else if (ch === quote) quote = '';
        continue;
      }
      if (ch === "'" || ch === '"' || ch === '`') quote = ch;
      else if (ch === '(' || ch === '[' || ch === '{') depth += 1;
      else if (ch === ')' || ch === ']' || ch === '}') {
        depth = Math.max(0, depth - 1);
        if (ch === '}' && depth === 0) {
          out.push(cur.trim());
          cur = '';
        }
      } else if (ch === ';' && depth === 0) {
        out.push(cur.slice(0, -1).trim());
        cur = '';
      }
    }
    if (cur.trim()) out.push(cur.trim());
    return out.filter(Boolean);
  }
  // Whether a top-level statement passes `test`, with no return or throw in
  // a statement before it that could stop the handler first.
  function unconditionally(code, test) {
    for (const st of topStatements(code)) {
      if (test(st)) return true;
      if (/\b(?:return|throw)\b/.test(st)) return false;
    }
    return false;
  }
  const SELF_BLUR_STATEMENT = new RegExp('^' + SELF_BLUR + String.raw`\s*\(\s*\)$`);
  const OTHER_FOCUS_STATEMENT =
    /^(?!(?:if|else|for|while|do|switch|try|return|throw|var|let|const)\b)[^?]*(?:\.\s*focus|\[\s*['"]focus['"]\s*\])\s*\(\s*\)$/;
  function focusesOther(st) {
    if (/&&|\|\||=>|\bfunction\b/.test(st)) return false;
    if (/^(?:this|event\.(?:target|currentTarget))\s*(?:\.\s*focus|\[)/.test(st)) return false;
    return OTHER_FOCUS_STATEMENT.test(st);
  }

  function trimText(v) {
    return (v == null ? '' : String(v)).trim();
  }
  // A dialog: <dialog>, role dialog or alertdialog, or aria-modal="true".
  function isDialog(el) {
    if (!el) return false;
    if (String(dom.localName(el) || '').toLowerCase() === 'dialog') return true;
    if (trimText(dom.getAttribute(el, 'aria-modal')).toLowerCase() === 'true') return true;
    let role = '';
    try {
      role = helpers.aria.getExplicitRole(el) || '';
    } catch {}
    return role === 'dialog' || role === 'alertdialog';
  }
  function inDialog(el) {
    for (let a = el, i = 0; a && i < 500; a = dom.parentElement(a), i++) {
      if (isDialog(a)) return true;
    }
    return false;
  }
  const FOCUS_CANDIDATES =
    'a[href], area[href], button, input, select, textarea, summary, iframe, [tabindex], [contenteditable]';
  function matchesSafe(el, sel) {
    try {
      return !!el && dom.matches(el, sel);
    } catch {
      return false;
    }
  }
  // A focus-trap sentinel: a plain element in the tab order with no text,
  // content, name or role, in or beside a dialog, or first or last in a
  // container that holds other focusable content. Its handler sends focus
  // into the dialog or back to its start, which is what it is for.
  function isSentinel(el, focus) {
    if (!focus.tabbable) return false;
    const tag = String(dom.localName(el) || '').toLowerCase();
    if (tag !== 'div' && tag !== 'span') return false;
    for (const a of ['role', 'aria-label', 'aria-labelledby', 'title', 'contenteditable']) {
      if (dom.getAttribute(el, a) != null) return false;
    }
    if (/\S/.test(String(dom.textContent(el) || ''))) return false;
    try {
      if (dom.querySelector(el, 'img, svg, canvas, picture, video, audio, object, embed, iframe'))
        return false;
    } catch {
      return false;
    }
    if (inDialog(el)) return true;
    if (isDialog(dom.previousElementSibling(el)) || isDialog(dom.nextElementSibling(el)))
      return true;
    const parent = dom.parentElement(el);
    if (!parent) return false;
    const atEdge = dom.firstElementChild(parent) === el || dom.lastElementChild(parent) === el;
    if (!atEdge) return false;
    try {
      for (const d of dom.querySelectorAll(parent, FOCUS_CANDIDATES)) {
        if (d !== el && canTakeFocus(d).focusable) return true;
      }
    } catch {}
    return false;
  }
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
    'slider',
    'spinbutton',
    'combobox',
    'textbox',
    'searchbox'
  ]);
  const NATIVE_CONTROL =
    'a[href], area[href], button, input:not([type="hidden"]), select, textarea, summary';
  // A control a person sees and that has a name: a native control or a
  // widget role, a non-empty accessible name, and shown.
  function isNamedVisibleControl(el) {
    let role = '';
    try {
      role = helpers.aria.getExplicitRole(el) || '';
    } catch {}
    if (!(role ? WIDGET_ROLES.has(role) : matchesSafe(el, NATIVE_CONTROL))) return false;
    let name = '';
    try {
      // The name from author mechanisms, or from the content for a
      // control that takes it from there (a button, a link).
      const info =
        typeof helpers.getNameFromContentInfo === 'function'
          ? helpers.getNameFromContentInfo(el, ctx)
          : helpers.getAccessibleNameInfo(el, ctx);
      name = trimText(info && info.value);
    } catch {}
    if (!name) return false;
    try {
      if (typeof helpers.isDomVisibleEligible === 'function') {
        const vis = helpers.isDomVisibleEligible(el, ctx);
        if (vis && vis.eligible === false) return false;
      }
    } catch {
      return false;
    }
    return true;
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
    let lean;
    if (
      kind === 'calls' &&
      focus.tabbable &&
      unconditionally(handler, (st) => SELF_BLUR_STATEMENT.test(st))
    ) {
      lean = {
        toward: 'fail',
        why: 'The handler calls blur() on the element itself as a statement of its own, outside any condition, so focus is removed as it arrives.',
        signals: [{ signal: 'unconditional-self-blur', value: true }],
        caution:
          'Other code in the handler may move focus back, or open something that takes focus on purpose.',
        i18n: {
          whyKey: 'focusNotRemovedByScript_lean_why_calls',
          cautionKey: 'focusNotRemovedByScript_lean_caution_calls'
        }
      };
    } else if (kind === 'moves' && isSentinel(el, focus)) {
      lean = {
        toward: 'pass',
        why: 'The element is an empty, unnamed focus guard at the edge of a dialog or a group of controls: moving focus on as it arrives is how a focus trap keeps focus inside.',
        signals: [{ signal: 'sentinel-shape', value: true }],
        caution:
          'Check that the trap lets focus out once the dialog closes, and that it belongs to a modal dialog.',
        i18n: {
          whyKey: 'focusNotRemovedByScript_lean_why_sentinel',
          cautionKey: 'focusNotRemovedByScript_lean_caution_sentinel'
        }
      };
    } else if (
      kind === 'moves' &&
      focus.tabbable &&
      isNamedVisibleControl(el) &&
      unconditionally(handler, focusesOther)
    ) {
      lean = {
        toward: 'fail',
        why: 'The element is a visible, named control, and its handler sends focus to another element whenever it arrives, so the control cannot be operated by keyboard.',
        signals: [
          { signal: 'named-visible-control', value: true },
          { signal: 'unconditional-focus-move', value: true }
        ],
        caution:
          'A field may forward focus on purpose to the control that edits it, such as a custom date picker.',
        i18n: {
          whyKey: 'focusNotRemovedByScript_lean_why_moves',
          cautionKey: 'focusNotRemovedByScript_lean_caution_moves'
        }
      };
    }
    occurrences.push(
      helpers.reportOccurrence(el, {
        ...(lean ? { lean } : {}),
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
