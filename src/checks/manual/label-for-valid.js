/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check label-for-valid
 * @atomic true
 * @summary A label's for attribute should name a control it can label
 * @standard Best Practices (no formal WCAG Success Criterion)
 * @applicability
 *   `<label>` elements the page shows with a non-empty `for` attribute.
 * @expectation
 *   HTML: a label with `for` labels the element with that id in its tree,
 *   if that element is labelable, and nothing otherwise, whatever the
 *   label contains.
 *   - `for` names a labelable element (`button`, `input` other than
 *     hidden, `meter`, `output`, `progress`, `select`, `textarea`) or a
 *     custom element, which may be form-associated: pass.
 *   - `for` names no element: cantTell (`LABEL_FOR_TARGET_MISSING`).
 *   - `for` names an element that can't be labelled: cantTell
 *     (`LABEL_FOR_NOT_LABELABLE`).
 *
 *   Either way the label labels nothing. Check which control it was meant
 *   for: that control may be named another way, which the name rules
 *   judge, or be left without the visible label meant for it.
 * @reports
 *   - `for`: the id the label names.
 *   - `targetElement`: for `LABEL_FOR_NOT_LABELABLE`, the tag of the
 *     element named.
 * @reason-codes
 *   - `LABEL_FOR_NOT_LABELABLE` (cantTell): the label's for attribute names an
 *     element that cannot be labelled, so the label labels nothing.
 *     It leans fail: the page states it.
 *     Basis: HTML labeled control (best practice).
 *   - `LABEL_FOR_TARGET_MISSING` (cantTell): the label's for attribute names
 *     no element in its tree, so the label labels nothing.
 *     It leans fail: the page states it.
 *     Basis: HTML labeled control (best practice).
 * @implementation-notes
 * - Best practice, with no WCAG mapping: the harm, a control without its
 *   label, is the name rules' and 3.3.2's to report, on the control.
 * - Manual: which control the label was meant for is a person's call.
 * - The id is looked up in the label's own tree, as browsers do.
 */

const id = 'label-for-valid';

const meta = {
  title: 'A label’s for attribute should name a control it can label',
  description:
    'Flags a label whose for attribute names no element, or an element that cannot be labelled, so the label labels nothing, for manual review.',
  i18n: {
    titleKey: 'labelForValid_title',
    descriptionKey: 'labelForValid_description'
  },
  helpUrl: null,
  tags: ['best-practice', 'forms', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'understandable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const LABELABLE = new Set(['button', 'meter', 'output', 'progress', 'select', 'textarea']);

  function trim(v) {
    return (v == null ? '' : String(v)).trim();
  }
  function isLabelable(el) {
    const tag = String(dom.localName(el) || '').toLowerCase();
    if (LABELABLE.has(tag)) return true;
    if (tag === 'input') return trim(dom.getAttribute(el, 'type')).toLowerCase() !== 'hidden';
    // A custom element may be form-associated, and so labelable.
    return tag.includes('-');
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const label of helpers.queryAllSmart('label[for]')) {
    if (!label) continue;
    const forId = trim(dom.getAttribute(label, 'for'));
    if (!forId) continue;
    applicableCount += 1;

    const target = helpers.getElementByIdInTree(label, forId);
    if (target && isLabelable(target)) continue;

    const missing = !target;
    const targetElement = missing ? null : String(dom.localName(target) || '').toLowerCase();
    let eligInfo = null;
    try {
      eligInfo = helpers.getEligibilityInfo(label, ctx, { targetSet: 'acc' });
    } catch {}

    occurrences.push(
      helpers.reportOccurrence(label, {
        summary: missing
          ? `This label’s for="${forId}" names no element, so it labels nothing.`
          : `This label’s for="${forId}" names a <${targetElement}>, which can’t be labelled, so it labels nothing.`,
        hint: 'Check which control the label is meant for, and set for to that control’s id.',
        i18n: {
          summaryKey: missing
            ? 'labelForValid_summary_cantTell_missing'
            : 'labelForValid_summary_cantTell_notLabelable',
          hintKey: 'labelForValid_hint_cantTell',
          params: missing ? { for: forId } : { for: forId, element: targetElement }
        },
        lean: missing
          ? {
              toward: 'fail',
              why: "The label's for attribute names no element, so the label labels nothing.",
              signals: [{ signal: 'for-target-missing', value: true }],
              i18n: { whyKey: 'labelForValid_lean_why_targetMissing' }
            }
          : {
              toward: 'fail',
              why: "The label's for attribute names an element that can't be labelled, so the label labels nothing.",
              signals: [{ signal: 'for-target-not-labelable', value: true }],
              i18n: { whyKey: 'labelForValid_lean_why_notLabelable' }
            },
        data: {
          details: missing
            ? { reasonCode: 'LABEL_FOR_TARGET_MISSING', for: forId }
            : { reasonCode: 'LABEL_FOR_NOT_LABELABLE', for: forId, targetElement },
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
      severity: rule.defaultSeverity || 'minor',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
