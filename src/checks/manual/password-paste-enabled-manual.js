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
 * @expectation
 *   A reviewer confirms the field can still be pasted into. Remembering a
 *   password is a cognitive function test, and 3.3.8 asks for a mechanism
 *   that helps the user through one; a password manager, or the clipboard
 *   for a one-time code, is that mechanism.
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
 *   limit every static scan shares.
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
    return normalizeWs(el.getAttribute && el.getAttribute('autocomplete'))
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
    const tag = el.tagName ? el.tagName.toLowerCase() : '';
    if (tag !== 'input' && tag !== 'textarea') return false;

    const tokens = autocompleteTokens(el);
    if (AUTH_AUTOCOMPLETE_TOKENS.some((t) => tokens.includes(t))) return true;

    const type = normalizeWs(el.getAttribute && el.getAttribute('type')).toLowerCase();
    if (tag !== 'input' || type !== 'password') return false;

    const declaresOtherPurpose = tokens.some(
      (t) => t !== 'on' && t !== 'off' && !AUTH_AUTOCOMPLETE_TOKENS.includes(t)
    );
    return !declaresOtherPurpose;
  }

  // A field that takes no input at all cannot be pasted into either, so a
  // paste handler on it blocks nothing.
  function acceptsInput(el) {
    if (el.hasAttribute && (el.hasAttribute('disabled') || el.hasAttribute('readonly'))) {
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

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('input, textarea')
    : helpers.queryAll('input, textarea');

  const cancelling = [];
  const undetermined = [];

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;
    if (!isAuthField(el)) continue;

    if (!acceptsInput(el)) continue;

    const eligResult = helpers.isAccTreeEligible ? helpers.isAccTreeEligible(el, ctx) : true;
    const eligible =
      typeof eligResult === 'boolean' ? eligResult : !!(eligResult && eligResult.eligible);
    if (!eligible) continue;

    const handler = el.getAttribute('onpaste');
    if (handler === null) continue;

    const verdict = classifyHandler(handler);
    if (verdict === 'none') continue;

    const eligInfo = helpers.getEligibilityInfo
      ? helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' })
      : { targetSet: 'acc', accEligible: null, reasons: [] };

    if (verdict === 'cancelOnly') {
      cancelling.push(
        helpers.reportOccurrence(el, {
          summary:
            'This authentication field has a paste handler whose only effect is to cancel the paste.',
          hint: 'Confirm by hand whether pasting still works. If it is blocked, remove the handler so a password manager, or the clipboard for a one-time code, can fill the field.',
          i18n: {
            summaryKey: 'passwordPasteEnabled_summary_fail',
            hintKey: 'passwordPasteEnabled_hint_fail',
            params: {}
          },
          data: {
            visibilityFilter: eligInfo,
            details: { reasonCode: 'PASTE_CANCELLED', handler: normalizeWs(handler) }
          }
        })
      );
      continue;
    }

    // An inline handler that delegates: whether it cancels lives in code the
    // markup does not carry.
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
