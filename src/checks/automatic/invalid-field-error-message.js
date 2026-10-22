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
 *     (`ERROR_MESSAGE_HIDDEN`) or that are shown with no text
 *     (`ERROR_MESSAGE_EMPTY`): fail. ARIA requires the message to be shown
 *     while the field is invalid, and the page states it isn't. When the
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
 *   An element counts as hidden when nobody sees it: `display: none`,
 *   `visibility: hidden`, `hidden`, a closed `<details>` or
 *   `content-visibility: hidden` on it or an ancestor. Text is what the
 *   accessible name computation reads: an image's alt counts, and text
 *   hidden inside the message doesn't.
 * @reports
 *   - `ariaInvalid`: the attribute's value.
 *   - `errorMessageIds`: the ids `aria-errormessage` names, or [] for none.
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

  // Whether a message element is shown and has text. Several fields may
  // name one message, so each is worked out once.
  const messageCache = new Map();
  function messageInfo(ref, from) {
    if (messageCache.has(ref)) return messageCache.get(ref);
    let shown = true;
    try {
      const info = helpers.isAccTreeEligible(ref);
      if (info && info.eligible === false) {
        shown = !(info.reasons || []).some((r) => UNSEEN.has(r));
      }
    } catch {}
    let text = '';
    const refId = trim(dom.get(ref, 'id'));
    try {
      if (refId) text = trim(helpers.getTextFromIdRefs(refId, ctx, {}, from).text);
    } catch {}
    const out = { shown, hasText: text !== '' };
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

    let reasonCode;
    let tier = 'cantTell';
    if (errorMessage) {
      const refs = helpers.resolveIdRefs(errorMessage, ctx, {}, el).refs;
      if (!refs.length) {
        reasonCode = 'ERROR_MESSAGE_TARGET_MISSING';
      } else {
        const infos = refs.map((ref) => messageInfo(ref, el));
        if (infos.some((i) => i.shown && i.hasText)) continue;
        if (described(el)) {
          reasonCode = 'ERROR_MESSAGE_NOT_SHOWN_DESCRIBED';
        } else {
          tier = 'fail';
          reasonCode = infos.some((i) => i.shown) ? 'ERROR_MESSAGE_EMPTY' : 'ERROR_MESSAGE_HIDDEN';
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
        key: 'fail_hidden',
        summary:
          'This field is marked invalid, but the error message aria-errormessage names is hidden.',
        hint: 'Show the error message while the field is invalid.'
      },
      ERROR_MESSAGE_EMPTY: {
        key: 'fail_empty',
        summary:
          'This field is marked invalid, but the error message aria-errormessage names has no text.',
        hint: 'Put text in the error message that says what is wrong and how to fix it.'
      },
      ERROR_MESSAGE_NOT_SHOWN_DESCRIBED: {
        key: 'cantTell_notShownDescribed',
        summary:
          'This field is marked invalid, and the error message aria-errormessage names is hidden or has no text; its description may carry the error.',
        hint: 'Check that the description tells the user, in text, what is wrong; show the error message while the field is invalid.',
        uncertainty: 'judgement-required',
        needed: 'Whether the field’s description says what the error is.'
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
    const m = messages[reasonCode];
    const occurrence = {
      summary: m.summary,
      hint: m.hint,
      i18n: {
        summaryKey: `invalidFieldErrorMessage_summary_${m.key}`,
        hintKey: `invalidFieldErrorMessage_hint_${m.key}`,
        params: {}
      },
      data: {
        details: { reasonCode, ariaInvalid, errorMessageIds },
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
      }
    };
    if (tier === 'fail') {
      fails.push(helpers.reportOccurrence(el, occurrence));
    } else {
      occurrence.uncertainty = { code: m.uncertainty, needed: m.needed };
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
