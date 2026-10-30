/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check password-paste-enabled
 * @atomic true
 * @summary An authentication field must not block pasting into it
 * @standard WCAG 2.2
 * @sc 3.3.8
 * @applicability
 *   Applies to any control whose autocomplete token is current-password,
 *   new-password or one-time-code, and to <input type="password"> unless its
 *   autocomplete names another purpose. A disabled or readonly field takes no
 *   input to block, and one outside the accessibility tree is not being asked
 *   for, so neither is in scope.
 *   Finding nothing to ask about, it reports notApplicable, not pass: it
 *   applies only to what its check flags, and finding nothing there
 *   doesn't show that all is well.
 * @expectation
 *   A reviewer confirms the field can still be pasted into. Remembering a
 *   password is a cognitive function test, and 3.3.8 asks for a mechanism
 *   that helps the user through one; a password manager, or the clipboard
 *   for a one-time code, is that mechanism.
 * @reports
 *   - `handler`: the field's `onpaste` attribute value, with spacing
 *     collapsed. It only cancels the paste (`PASTE_CANCELLED`) or calls
 *     other script that may or may not (`PASTE_HANDLER_OPAQUE`).
 * @reason-codes
 *   - `PASTE_CANCELLED` (cantTell): the authentication field has an inline
 *     paste handler whose only effect is to cancel the paste, which may stop a
 *     password manager or the clipboard filling it.
 *     It leans fail, unless the field is a box of a split one-time code
 *     (maxlength 1, among four or more such boxes), which has no lean. Where
 *     a listener hook installed before the page's scripts saw no paste
 *     listener added from script on the field, an ancestor, a shadow root it
 *     is in, the document or the window, the lean says so and carries no
 *     caution.
 *     Basis: WCAG 3.3.8 (not settled).
 *   - `PASTE_HANDLER_OPAQUE` (cantTell): the authentication field has an
 *     inline paste handler that calls other script, so whether it blocks
 *     pasting could not be told.
 *     It leans fail when the handler calls a function named to block
 *     pasting (disablePaste) or shows an alert and cancels, and the field is
 *     not a box of a split one-time code; otherwise no lean.
 *     Basis: WCAG 3.3.8 (not settled).
 * @implementation-notes
 * - Advisory and capped at cantTell. Whether a handler really stops the user
 *   depends on script the markup does not carry, so no reading of it is safe
 *   enough to fail on: a split one-time-code field cancels the default paste
 *   and then spreads the digits across its boxes. The two cases are reported
 *   apart -- a handler that only cancels, and one that goes on to do more --
 *   so a reviewer knows which to look at first. `return true` allows the
 *   paste and reports nothing.
 * - type="password" masks rather than authenticates, and a card security code
 *   is masked the same way, so an autocomplete naming another purpose puts the
 *   field out of scope. A masked field with no autocomplete cannot be told
 *   apart, which is the one case left.
 * - `autocomplete="off"` is not reported. Browsers override it for password
 *   fields so password managers keep working, and the mechanism survives.
 * - A handler attached with addEventListener leaves nothing to read, the
 *   limit every static scan shares, unless the page runs the listener hook
 *   (`listenerHookScript`). An early hook that saw no paste listener on the
 *   field or anything its paste event reaches shows that nothing puts the
 *   pasted text back after the inline handler cancels it; the finding still
 *   asks, as 3.3.8 also lets another login method replace this step.
 * - 3.3.8 also excuses the test where the process offers another
 *   authentication method. A sibling button proves nothing about whether it
 *   works or replaces this step, so it is not inferred; the facet is recorded
 *   as partial for that reason.
 */

const id = 'password-paste-enabled';

const meta = {
  title: 'Authentication fields must not block pasting',
  description:
    'Checks that a password or one-time-code field carries no inline paste handler that cancels the paste, which would remove the password manager or clipboard that WCAG 3.3.8 relies on as the assisting mechanism.',
  i18n: {
    titleKey: 'passwordPasteEnabled_title',
    descriptionKey: 'passwordPasteEnabled_description'
  },
  helpUrl: null,
  tags: ['wcag22aa', 'wcag338', 'forms', 'authentication', 'atomic', 'manual', 'acc'],
  wcagSc: ['3.3.8'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '3.3.8',
      title: 'Accessible Authentication (Minimum)',
      conformanceLevel: 'AA'
    }
  ],
  defaultSeverity: 'serious',
  category: 'understandable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: { facetsBySc: { '3.3.8': ['authentication-paste-not-blocked'] } }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  // Declared inside runInPage; see scripts/build-core.js header
  // ("runInPage MUST be self-contained").
  const AUTH_AUTOCOMPLETE_TOKENS = ['current-password', 'new-password', 'one-time-code'];

  function normalizeWs(s) {
    return String(s || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function autocompleteTokens(el) {
    return normalizeWs(dom.get(el, 'getAttribute') && dom.getAttribute(el, 'autocomplete'))
      .toLowerCase()
      .split(' ')
      .filter(Boolean);
  }

  // A field an authentication step reads: a password input, or any control
  // whose autocomplete token names an authentication secret. The autocomplete
  // route matters for one-time codes, which are ordinary text inputs.
  //
  // type="password" is a masking control, not only an authentication one: a
  // card security code is routinely masked the same way. An explicit
  // autocomplete purpose that is not an authentication one says so, and takes
  // the field back out of scope.
  function isAuthField(el) {
    const tag = dom.tagName(el) ? dom.tagName(el).toLowerCase() : '';
    if (tag !== 'input' && tag !== 'textarea') return false;

    const tokens = autocompleteTokens(el);
    if (AUTH_AUTOCOMPLETE_TOKENS.some((t) => tokens.includes(t))) return true;

    const type = normalizeWs(
      dom.get(el, 'getAttribute') && dom.getAttribute(el, 'type')
    ).toLowerCase();
    if (tag !== 'input' || type !== 'password') return false;

    const declaresOtherPurpose = tokens.some(
      (t) => t !== 'on' && t !== 'off' && !AUTH_AUTOCOMPLETE_TOKENS.includes(t)
    );
    return !declaresOtherPurpose;
  }

  // A field that takes no input at all cannot be pasted into either, so a
  // paste handler on it blocks nothing.
  function acceptsInput(el) {
    if (
      dom.get(el, 'hasAttribute') &&
      (dom.hasAttribute(el, 'disabled') || dom.hasAttribute(el, 'readonly'))
    ) {
      return false;
    }
    return true;
  }

  // Classifies an inline handler as 'cancelOnly', 'opaque' or 'none'.
  //
  // Cancelling is not the same as blocking. Replacing the default paste is
  // how a split one-time-code field distributes the digits across its boxes,
  // and how a password field strips stray whitespace from what was pasted --
  // both call preventDefault and then insert the text themselves, which
  // helps the user rather than stopping them. So a handler counts as
  // blocking only when cancelling is the whole of what it does. Anything
  // further -- a call, an assignment, a condition -- may well be putting the
  // text back, and the markup does not say, so it reports cantTell.
  function classifyHandler(source) {
    const src = String(source || '').trim();
    if (!src) return 'none';

    const CANCEL = [
      /\breturn\s+false\b/gi,
      /\breturn\s*!1\b/gi,
      /\bpreventDefault\s*\(\s*\)/gi,
      /\breturnValue\s*=\s*(?:false|!1)\b/gi
    ];
    // Says "yes, paste" outright, so it blocks nothing.
    const ALLOW = [/\breturn\s+true\b/gi, /\breturn\s*!0\b/gi];
    // Neither cancels nor re-inserts.
    const NEUTRAL = [/\bstop(?:Immediate)?Propagation\s*\(\s*\)/gi, /\breturn\b/gi];
    // What is left of an object reference once its method call is removed.
    const REFS = /\b(?:window|document|this|event|evt|ev|e|arguments\[0\])\b/gi;
    const ONLY_PUNCTUATION = /^[\s;.,()[\]{}]*$/;

    let rest = src;
    let sawCancel = false;
    for (const re of CANCEL) {
      const next = rest.replace(re, ' ');
      if (next !== rest) sawCancel = true;
      rest = next;
    }

    if (!sawCancel) {
      for (const re of ALLOW) rest = rest.replace(re, ' ');
      for (const re of NEUTRAL) rest = rest.replace(re, ' ');
      rest = rest.replace(REFS, ' ');
      return ONLY_PUNCTUATION.test(rest) ? 'none' : 'opaque';
    }

    for (const re of NEUTRAL) rest = rest.replace(re, ' ');
    rest = rest.replace(REFS, ' ');
    // Anything left beyond punctuation is the handler doing more than cancel.
    return ONLY_PUNCTUATION.test(rest) ? 'cancelOnly' : 'opaque';
  }

  // A box of a split one-time-code field: maxlength 1, among three or more
  // such boxes in its parent. Its page usually spreads a pasted code across
  // the boxes from script the markup does not carry.
  function inSplitCodeGroup(el) {
    const one = (n) => normalizeWs(dom.getAttribute(n, 'maxlength')) === '1';
    if (!one(el)) return false;
    const parent = dom.parentElement(el);
    if (!parent) return false;
    let boxes = 0;
    try {
      for (const n of dom.querySelectorAll(parent, 'input')) if (one(n)) boxes += 1;
    } catch {
      return false;
    }
    return boxes >= 4;
  }

  // A handler whose own words say it blocks pasting: a function named so
  // (disablePaste, no_paste, preventCopyPaste), or a message shown before
  // the paste is cancelled.
  // Word-initial (disablePaste, no_paste) in any case, and camelCase within
  // a name (onDisablePaste) in its own case, so "casinoPaste" is no match.
  const BLOCK_NAME =
    /(?:\b|_)(?:no|disable|block|prevent|deny|forbid|stop)_?(?:copy_?(?:and_?)?)?paste|paste_?(?:block|disable|prevent|deny|forbid)/i;
  const BLOCK_NAME_CAMEL =
    /[a-z0-9](?:No|Disable|Block|Prevent|Deny|Forbid|Stop)(?:Copy(?:And)?)?Paste|Paste(?:Block|Disable|Prevent|Deny|Forbid)/;
  const CANCELS =
    /\breturn\s+false\b|\breturn\s*!1\b|\bpreventDefault\s*\(|\breturnValue\s*=\s*(?:false|!1)\b/i;
  const ALERTS = /\balert\s*\(/;

  // Paste listeners added from script, as the opt-in listener hook records
  // them (helpers.getEventListenerInfo): { hook: 'none' | 'early' | 'late',
  // listens }. Only an early hook proves none exists.
  function pasteListenerInfo(target) {
    try {
      return typeof helpers.getEventListenerInfo === 'function'
        ? helpers.getEventListenerInfo(target, ['paste'])
        : { hook: 'none', listens: false };
    } catch {
      return { hook: 'none', listens: false };
    }
  }
  const doc = ctx.document || null;
  const win = doc && dom.defaultView ? dom.defaultView(doc) : null;
  const pagePasteListener =
    (doc && pasteListenerInfo(doc).listens) || (win && pasteListenerInfo(win).listens);

  // Whether an early hook saw no paste listener added from script on the
  // field, an ancestor (in the flat tree), a shadow root the field or an
  // ancestor is in, the document or the window: everywhere a paste event on
  // the field goes.
  function noScriptPasteListener(el) {
    if (pasteListenerInfo(el).hook !== 'early') return false;
    if (pagePasteListener) return false;
    const parentOf = (n) =>
      helpers.flatParentElement ? helpers.flatParentElement(n) : dom.parentElement(n);
    for (let n = el, i = 0; n && i < 500; n = parentOf(n), i++) {
      if (pasteListenerInfo(n).listens) return false;
      const p = dom.parentNode(n);
      if (p && dom.nodeType(p) === 11 && pasteListenerInfo(p).listens) return false;
    }
    return true;
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('input, textarea')
    : helpers.queryAll('input, textarea');

  const cancelling = [];
  const undetermined = [];

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    if (!isAuthField(el)) continue;

    if (!acceptsInput(el)) continue;

    const eligResult = helpers.isAccTreeEligible ? helpers.isAccTreeEligible(el, ctx) : true;
    const eligible =
      typeof eligResult === 'boolean' ? eligResult : !!(eligResult && eligResult.eligible);
    if (!eligible) continue;

    const handler = dom.getAttribute(el, 'onpaste');
    if (handler === null) continue;

    const verdict = classifyHandler(handler);
    if (verdict === 'none') continue;

    const eligInfo = helpers.getEligibilityInfo
      ? helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' })
      : { targetSet: 'acc', accEligible: null, reasons: [] };

    // A split code box may have its paste put back by a listener added
    // from script, so it has no lean, with the listener hook or without.
    const splitCode = inSplitCodeGroup(el);

    if (verdict === 'cancelOnly') {
      cancelling.push(
        helpers.reportOccurrence(el, {
          summary:
            'This authentication field has a paste handler whose only effect is to cancel the paste.',
          hint: 'Confirm by hand whether pasting still works. If it is blocked, remove the handler so a password manager, or the clipboard for a one-time code, can fill the field.',
          i18n: {
            summaryKey: 'passwordPasteEnabled_summary_cantTell_cancelled',
            hintKey: 'passwordPasteEnabled_hint_cantTell_cancelled',
            params: {}
          },
          ...(splitCode
            ? {}
            : noScriptPasteListener(el)
              ? {
                  lean: {
                    toward: 'fail',
                    why: 'The field’s paste handler does nothing but cancel the paste, and a hook installed before the page’s scripts saw no other paste listener on the field, around it, on the document or the window, so nothing puts the pasted text back.',
                    signals: [
                      { signal: 'handler', value: 'cancel-only' },
                      { signal: 'split-code-box', value: false },
                      { signal: 'hook-mode', value: 'early' },
                      { signal: 'script-paste-listener', value: false }
                    ],
                    i18n: { whyKey: 'passwordPasteEnabled_lean_why_cancelledNoListener' }
                  }
                }
              : {
                  lean: {
                    toward: 'fail',
                    why: 'The field’s paste handler does nothing but cancel the paste, so pasting is probably blocked.',
                    signals: [
                      { signal: 'handler', value: 'cancel-only' },
                      { signal: 'split-code-box', value: false }
                    ],
                    caution:
                      'A listener added from script, on the field or around it, may put the pasted text in after the handler cancels it.',
                    i18n: {
                      whyKey: 'passwordPasteEnabled_lean_why_cancelled',
                      cautionKey: 'passwordPasteEnabled_lean_caution_cancelled'
                    }
                  }
                }),
          data: {
            visibilityFilter: eligInfo,
            details: { reasonCode: 'PASTE_CANCELLED', handler: normalizeWs(handler) }
          }
        })
      );
      continue;
    }

    // An inline handler that delegates: whether it cancels lives in code the
    // markup does not carry, unless its own words say it blocks.
    const namedBlock = BLOCK_NAME.test(handler) || BLOCK_NAME_CAMEL.test(handler);
    const alertsAndCancels = ALERTS.test(handler) && CANCELS.test(handler);
    undetermined.push(
      helpers.reportOccurrence(el, {
        summary:
          'This authentication field has a paste handler, and whether it cancels pasting could not be determined.',
        hint: 'Check by hand that pasting into the field still works, so a password manager or the clipboard can fill it.',
        i18n: {
          summaryKey: 'passwordPasteEnabled_summary_cantTell',
          hintKey: 'passwordPasteEnabled_hint_cantTell',
          params: {}
        },
        ...((namedBlock || alertsAndCancels) && !splitCode
          ? {
              lean: {
                toward: 'fail',
                why: 'The paste handler says what it does: it calls a function named to block pasting, or shows a message and cancels the paste.',
                signals: [
                  { signal: 'handler-names-block', value: namedBlock },
                  { signal: 'handler-alerts-and-cancels', value: alertsAndCancels },
                  { signal: 'split-code-box', value: false }
                ],
                caution:
                  'A function’s name can mislead; what it does is in script the markup does not carry.',
                i18n: {
                  whyKey: 'passwordPasteEnabled_lean_why_opaque',
                  cautionKey: 'passwordPasteEnabled_lean_caution_opaque'
                }
              }
            }
          : {}),
        data: {
          visibilityFilter: eligInfo,
          details: { reasonCode: 'PASTE_HANDLER_OPAQUE', handler: normalizeWs(handler) }
        }
      })
    );
  }

  const occurrences = cancelling.concat(undetermined);
  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'serious',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
