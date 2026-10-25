/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check invalid-field-error-message
 * @atomic true
 * @summary A field marked invalid must have a shown error message in text
 * @standard WCAG 2.2
 * @sc 3.3.1
 * @applicability
 *   Elements the page shows, in the accessibility tree and not disabled,
 *   whose `aria-invalid` says they are invalid: `true`, or a value ARIA
 *   reads as `true` (anything but `false`, `grammar`, `spelling` or
 *   empty). `grammar` and `spelling` mark text, not a value a user
 *   entered.
 * @expectation
 *   The error is identified and described to the user in text (WCAG 3.3.1).
 *   - `aria-errormessage` names an element that is shown and has text:
 *     pass.
 *   - `aria-errormessage` names only elements that are hidden
 *     (`ERROR_MESSAGE_HIDDEN`): cantTell, leaning fail. ARIA requires the
 *     message to be shown while the field is invalid, and the page states it
 *     isn't; but, as for an empty message, the error may still be told in
 *     the label or next to the field, which meets 3.3.1.
 *   - `aria-errormessage` names only shown elements with no text
 *     (`ERROR_MESSAGE_EMPTY`): cantTell. ARIA sets no MUST on the message's
 *     text, and the error may be told in the label or next to the field,
 *     which meets 3.3.1. When the
 *     field's `aria-describedby` gives a description, the error may be
 *     there: cantTell (`ERROR_MESSAGE_NOT_SHOWN_DESCRIBED`).
 *   - `aria-errormessage` names no element of the page: cantTell
 *     (`ERROR_MESSAGE_TARGET_MISSING`); a script may add it.
 *   - No `aria-errormessage`, and `aria-describedby` gives a description:
 *     pass.
 *   - Neither: cantTell (`NO_ERROR_MESSAGE`). The error may be in the
 *     label or in text next to the field, which the markup doesn't tie to
 *     it; check that the user is told, in text, which field is in error
 *     and what is wrong.
 *
 *   - `aria-errormessage` names a message that is `aria-hidden` itself or
 *     inside an `aria-hidden` element: cantTell, leaning fail
 *     (`ERROR_MESSAGE_HIDDEN`, with
 *     `hiddenBy: 'aria-hidden'`). ARIA counts such an element as hidden,
 *     and requires a pertinent error message not to be.
 *   - `aria-errormessage` names a shown message all of whose text is
 *     inside `aria-hidden` elements, while the message itself is not:
 *     cantTell (`ERROR_MESSAGE_ARIA_HIDDEN`). People who see it are told;
 *     screen reader users may not be.
 *
 *   An element counts as hidden when nobody sees it: `display: none`,
 *   `visibility: hidden`, `hidden`, a closed `<details>` or
 *   `content-visibility: hidden` on it or an ancestor; a message hidden
 *   with `visibility: hidden` whose text is brought back with
 *   `visibility: visible` is shown. Text is what the accessible name
 *   computation reads: an image's alt counts, and text hidden inside the
 *   message doesn't. The message may be named by id or set from script as
 *   an element (`ariaErrorMessageElements`).
 * @reports
 *   - `ariaInvalid`: the attribute's value.
 *   - `hiddenBy` (`ERROR_MESSAGE_HIDDEN`): `aria-hidden` when only
 *     aria-hidden hides the message; absent when nobody sees it.
 *   - `errorMessageIds`: the ids `aria-errormessage` names, or [] for none.
 * @reason-codes
 *   - `ERROR_MESSAGE_HIDDEN` (cantTell): aria-errormessage names only
 *     messages that are hidden: nobody sees them, or aria-hidden, on the
 *     message or around it, hides them from assistive technology. It leans
 *     fail: the message tied to the field can't be seen or heard.
 *     Basis: WAI-ARIA 1.2 aria-errormessage (MUST); WCAG 3.3.1 (not settled); ARIA21.
 *   - `ERROR_MESSAGE_EMPTY` (cantTell): aria-errormessage names only shown
 *     messages that have no text; the error may be told in text elsewhere.
 *     Basis: WCAG 3.3.1 (not settled); WAI-ARIA 1.2 aria-errormessage.
 *   - `ERROR_MESSAGE_NOT_SHOWN_DESCRIBED` (cantTell): the named message is
 *     hidden or empty, but the field's aria-describedby gives a description
 *     that may carry the error.
 *     Basis: WCAG 3.3.1 (not settled); WAI-ARIA 1.2 aria-errormessage.
 *   - `ERROR_MESSAGE_ARIA_HIDDEN` (cantTell): the named message is shown, but
 *     all its text is inside aria-hidden elements, so people who see it are
 *     told and screen reader users may not be.
 *     Basis: WCAG 3.3.1 (not settled); WAI-ARIA 1.2 aria-errormessage (MUST).
 *   - `ERROR_MESSAGE_TARGET_MISSING` (cantTell): aria-errormessage names no
 *     element of the page; a script may add it later.
 *     Basis: WAI-ARIA 1.2 aria-errormessage (not settled); WCAG 3.3.1.
 *   - `NO_ERROR_MESSAGE` (cantTell): neither aria-errormessage nor
 *     aria-describedby ties a message to the field; the error may be told in
 *     text the markup doesn't tie to it.
 *     Basis: WCAG 3.3.1 (not settled); G83.
 * @implementation-notes
 * - WCAG 3.3.1: "If an input error is automatically detected, the item
 *   that is in error is identified and the error is described to the user
 *   in text." `aria-invalid="true"` is the page saying it detected one.
 *   ARIA 1.2 (aria-errormessage): "authors MUST ensure the content is not
 *   hidden" when the object is invalid, so a hidden message is a stated
 *   failure, not a guess. Technique ARIA21 uses aria-invalid with a shown,
 *   associated message; ARIA19 and G83 describe the error in text.
 * - A shown, linked message passes without asking whether it is also
 *   announced on its own (a live region): WCAG doesn't require that here.
 * - A target's shown state and text are worked out once and reused by
 *   every field that names it (a form-level summary, say).
 */

const id = 'invalid-field-error-message';

const meta = {
  title: 'Fields marked invalid must have a shown error message',
  description:
    'Checks that an element with aria-invalid has an error message in text: its aria-errormessage must name a shown element with text, and a field with no linked message is asked about.',
  i18n: {
    titleKey: 'invalidFieldErrorMessage_title',
    descriptionKey: 'invalidFieldErrorMessage_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag331', 'aria', 'forms', 'atomic', 'automatic'],
  wcagSc: ['3.3.1'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '3.3.1',
      title: 'Error Identification',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'serious',
  category: 'understandable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '3.3.1': ['invalid-field-error-message'] } }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const NOT_INVALID = new Set(['', 'false', 'grammar', 'spelling']);
  const UNSEEN = new Set([
    'displayNone',
    'hiddenAttr',
    'visibilityHidden',
    'detailsClosed',
    'contentVisibilityHidden',
    'templateContent',
    'nonRenderedElement'
  ]);

  function trim(v) {
    return (v == null ? '' : String(v)).trim();
  }

  function reasonsOf(el) {
    try {
      const info = helpers.isAccTreeEligible(el);
      return info && info.eligible === false ? info.reasons || [] : [];
    } catch {
      return [];
    }
  }
  const unseen = (reasons) => reasons.some((r) => UNSEEN.has(r));
  // Whether a descendant the selector picks is seen and holds text:
  // visibility: visible brings text back into view inside a
  // visibility: hidden message.
  function seenTextInside(ref, selector) {
    try {
      for (const d of dom.querySelectorAll(ref, selector)) {
        if (!unseen(reasonsOf(d)) && trim(dom.textContent(d))) return true;
      }
    } catch {}
    return false;
  }

  // Whether a message element is shown, has text, and keeps that text from
  // assistive technology with aria-hidden. A message that is aria-hidden
  // itself, or inside an aria-hidden element, is hidden in ARIA's sense
  // even when it is drawn. Several fields may name one message, so each is
  // worked out once.
  const messageCache = new Map();
  function messageInfo(ref) {
    if (messageCache.has(ref)) return messageCache.get(ref);
    const reasons = reasonsOf(ref);
    let shown = !unseen(reasons);
    if (!shown && reasons.every((r) => r === 'visibilityHidden' || !UNSEEN.has(r))) {
      shown = seenTextInside(ref, '*');
    }
    let text = '';
    try {
      text = trim(helpers.getTextFromElements([ref], ctx, {}).text);
    } catch {}
    const hiddenByAria = shown && reasons.indexOf('ariaHidden') !== -1;
    // Text people see but assistive technology doesn't: all the text in a
    // message that is not aria-hidden itself.
    const ariaHidden =
      shown && !hiddenByAria && text === '' && seenTextInside(ref, '[aria-hidden="true" i]');
    const out = { shown: shown && !hiddenByAria, hiddenByAria, hasText: text !== '', ariaHidden };
    messageCache.set(ref, out);
    return out;
  }

  function described(el) {
    const value = dom.getAttribute(el, 'aria-describedby');
    if (!trim(value)) return false;
    try {
      return trim(helpers.getTextFromIdRefs(value, ctx, {}, el).text) !== '';
    } catch {
      return false;
    }
  }

  const fails = [];
  const questions = [];
  let applicableCount = 0;

  for (const el of helpers.queryAllSmart('[aria-invalid]')) {
    if (!el) continue;
    const ariaInvalid = trim(dom.getAttribute(el, 'aria-invalid')).toLowerCase();
    if (NOT_INVALID.has(ariaInvalid)) continue;
    try {
      if (dom.matches(el, ':disabled')) continue;
    } catch {}
    if (!helpers.isIncludedInAccessibilityTree(el, ctx)) continue;
    applicableCount += 1;

    const errorMessage = trim(dom.getAttribute(el, 'aria-errormessage'));
    const errorMessageIds = errorMessage ? errorMessage.split(/\s+/) : [];
    // The message may be set from script as an element reference, which
    // leaves the attribute empty.
    const refs = helpers.getRefElements(el, 'aria-errormessage', ctx);

    let reasonCode;
    let tier = 'cantTell';
    let hiddenBy = null;
    if (errorMessage || refs.length) {
      if (!refs.length) {
        reasonCode = 'ERROR_MESSAGE_TARGET_MISSING';
      } else {
        const infos = refs.map((ref) => messageInfo(ref));
        if (infos.some((i) => i.shown && i.hasText && !i.ariaHidden)) continue;
        if (infos.some((i) => i.ariaHidden)) {
          reasonCode = 'ERROR_MESSAGE_ARIA_HIDDEN';
        } else if (described(el)) {
          reasonCode = 'ERROR_MESSAGE_NOT_SHOWN_DESCRIBED';
        } else if (infos.some((i) => i.shown)) {
          // A shown message with no text: ARIA sets no MUST on its text, and
          // 3.3.1 is met by error text the markup doesn't tie to the field,
          // as for NO_ERROR_MESSAGE.
          reasonCode = 'ERROR_MESSAGE_EMPTY';
        } else {
          reasonCode = 'ERROR_MESSAGE_HIDDEN';
          if (infos.every((i) => i.hiddenByAria)) hiddenBy = 'aria-hidden';
        }
      }
    } else {
      if (described(el)) continue;
      reasonCode = 'NO_ERROR_MESSAGE';
    }

    let eligInfo = null;
    try {
      eligInfo = helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' });
    } catch {}

    const messages = {
      ERROR_MESSAGE_HIDDEN: {
        key: 'cantTell_hidden',
        summary:
          'This field is marked invalid, but the error message aria-errormessage names is hidden.',
        hint: 'Show the error message while the field is invalid.',
        uncertainty: 'judgement-required',
        needed: 'Whether the error is described in text elsewhere, such as the field’s label.',
        lean: {
          why: 'The error message tied to the field is hidden, so the error is probably not told.',
          whyKey: 'invalidFieldErrorMessage_lean_why_hidden',
          signal: 'error-message-hidden'
        }
      },
      ERROR_MESSAGE_HIDDEN_ARIA: {
        key: 'cantTell_hiddenAria',
        summary:
          'This field is marked invalid, but the error message aria-errormessage names is hidden from assistive technology with aria-hidden.',
        hint: 'Remove aria-hidden from the error message, and from what contains it, while the field is invalid.',
        uncertainty: 'judgement-required',
        needed: 'Whether screen reader users are told about the error some other way.',
        lean: {
          why: 'The error message tied to the field is hidden from assistive technology, so screen reader users are probably not told the error.',
          whyKey: 'invalidFieldErrorMessage_lean_why_hiddenAria',
          signal: 'error-message-aria-hidden'
        }
      },
      ERROR_MESSAGE_EMPTY: {
        key: 'cantTell_empty',
        summary:
          'This field is marked invalid, but the error message aria-errormessage names has no text.',
        hint: 'Check that the user is told, in text, what is wrong, in the label or next to the field; put that text in the error message.',
        uncertainty: 'judgement-required',
        needed: 'Whether the error is described in text elsewhere, such as the field’s label.'
      },
      ERROR_MESSAGE_NOT_SHOWN_DESCRIBED: {
        key: 'cantTell_notShownDescribed',
        summary:
          'This field is marked invalid, and the error message aria-errormessage names is hidden or has no text; its description may carry the error.',
        hint: 'Check that the description tells the user, in text, what is wrong; show the error message while the field is invalid.',
        uncertainty: 'judgement-required',
        needed: 'Whether the field’s description says what the error is.'
      },
      ERROR_MESSAGE_ARIA_HIDDEN: {
        key: 'cantTell_ariaHidden',
        summary:
          'This field is marked invalid, and the error message aria-errormessage names is shown, but aria-hidden keeps its text from assistive technology.',
        hint: 'Check that screen reader users are told about the error too; remove aria-hidden from the message, or describe the error in the field’s description.',
        uncertainty: 'judgement-required',
        needed: 'Whether assistive technology users are told about the error some other way.'
      },
      ERROR_MESSAGE_TARGET_MISSING: {
        key: 'cantTell_targetMissing',
        summary: 'This field is marked invalid, but no element has the id aria-errormessage names.',
        hint: 'Check that the error message is in the page while the field is invalid, with the id aria-errormessage names.',
        uncertainty: 'runtime-dependent',
        needed: 'Whether a script adds the error message the field names.'
      },
      NO_ERROR_MESSAGE: {
        key: 'cantTell_none',
        summary:
          'This field is marked invalid, but no error message is tied to it with aria-errormessage or aria-describedby.',
        hint: 'Check that the user is told, in text, which field is in error and what is wrong; tie the message to the field with aria-errormessage or aria-describedby.',
        uncertainty: 'judgement-required',
        needed: 'Whether the error is described in text near the field or in its label.'
      }
    };
    const m = messages[hiddenBy ? 'ERROR_MESSAGE_HIDDEN_ARIA' : reasonCode];
    const occurrence = {
      summary: m.summary,
      hint: m.hint,
      i18n: {
        summaryKey: `invalidFieldErrorMessage_summary_${m.key}`,
        hintKey: `invalidFieldErrorMessage_hint_${m.key}`,
        params: {}
      },
      data: {
        details: { reasonCode, ariaInvalid, errorMessageIds, ...(hiddenBy ? { hiddenBy } : {}) },
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
      }
    };
    if (tier === 'fail') {
      fails.push(helpers.reportOccurrence(el, occurrence));
    } else {
      occurrence.uncertainty = { code: m.uncertainty, needed: m.needed };
      if (m.lean)
        occurrence.lean = {
          toward: 'fail',
          why: m.lean.why,
          signals: [{ signal: m.lean.signal, value: true }],
          i18n: { whyKey: m.lean.whyKey }
        };
      questions.push(helpers.reportOccurrence(el, occurrence));
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    ...helpers.resolveTieredOutcome(fails, questions, rule.defaultSeverity || 'serious')
  };
}

module.exports = { id, meta, runInPage };
