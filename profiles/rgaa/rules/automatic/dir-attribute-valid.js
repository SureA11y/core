/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check dir-attribute-valid
 * @atomic true
 * @summary A dir attribute must be ltr or rtl
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to elements carrying a dir attribute. An element with dir="auto"
 *   applies only when its text (content, or the value of a text field)
 *   contains a strong character of the direction opposite to the one it
 *   inherits: RGAA 8.10.2 step 1 covers only the passages of 8.10.1, text
 *   that reads in the reverse direction of the document. A page with no
 *   applicable element is notApplicable.
 * @expectation
 *   The value is ltr or rtl, in any case (RGAA 8.10.2: « La valeur de
 *   l'attribut dir est conforme (rtl ou ltr) »). Surrounding spaces are not
 *   ignored: HTML matches the keyword exactly, apart from case, so a
 *   browser ignores dir=" rtl ". dir="auto", which HTML allows, fails with
 *   its own reasonCode on reverse-direction text, since RGAA names only
 *   those two values. Whether the direction is the right one is the
 *   relevance condition of the same test, left to a person.
 * @implementation-notes
 * - The inherited direction comes from the nearest ancestor whose dir is
 *   ltr or rtl, or, for an ancestor with dir="auto", from the first strong
 *   character of its text; with neither it is ltr. Right-to-left strong
 *   characters are those of the Hebrew, Arabic, Syriac, Thaana, NKo and
 *   related blocks; any other letter is a left-to-right strong character.
 * - Opt-in (tag `rgaa`): WCAG does not restrict the dir values, so the rule
 *   runs only under the rgaa-4.1.2 profile, the `rgaa` tag or its own id.
 */

const id = 'dir-attribute-valid';

const meta = {
  title: 'dir attributes are ltr or rtl',
  description: 'Checks that every dir attribute is ltr or rtl, the two values RGAA accepts.',
  i18n: {
    titleKey: 'dirAttributeValid_title',
    descriptionKey: 'dirAttributeValid_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'language', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'understandable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('[dir]') : helpers.queryAll('[dir]');

  const occurrences = [];
  let applicableCount = 0;

  const RTL_CHAR =
    /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF\u{10800}-\u{10FFF}\u{1E800}-\u{1EFFF}]/u;
  const LETTER = /\p{L}/u;

  // 'rtl', 'ltr' or '' for the first strong character of `text`.
  function firstStrong(text) {
    for (const ch of String(text || '')) {
      if (RTL_CHAR.test(ch)) return 'rtl';
      if (LETTER.test(ch)) return 'ltr';
    }
    return '';
  }

  function hasStrong(text, dir) {
    for (const ch of String(text || '')) {
      const rtl = RTL_CHAR.test(ch);
      if (dir === 'rtl' ? rtl : !rtl && LETTER.test(ch)) return true;
    }
    return false;
  }

  function ownText(el) {
    const tag = String(dom.tagName(el) || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') {
      return String(el.value || dom.getAttribute(el, 'value') || '');
    }
    return String(dom.textContent(el) || '');
  }

  function inheritedDir(el) {
    for (let p = dom.parentElement(el); p; p = dom.parentElement(p)) {
      if (!dom.get(p, 'hasAttribute') || !dom.hasAttribute(p, 'dir')) continue;
      const v = String(dom.getAttribute(p, 'dir')).toLowerCase();
      if (v === 'ltr' || v === 'rtl') return v;
      if (v === 'auto') return firstStrong(ownText(p)) || 'ltr';
    }
    return 'ltr';
  }

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    const raw = String(dom.getAttribute(el, 'dir'));
    const value = raw.toLowerCase();

    const isAuto = value === 'auto';
    if (isAuto) {
      const opposite = inheritedDir(el) === 'rtl' ? 'ltr' : 'rtl';
      if (!hasStrong(ownText(el), opposite)) continue;
    }

    applicableCount += 1;
    if (value === 'ltr' || value === 'rtl') continue;
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: isAuto
          ? 'This element uses dir="auto"; RGAA accepts only ltr or rtl.'
          : `This element has dir="${raw}", which is neither ltr nor rtl.`,
        hint: 'Set dir to ltr (left to right) or rtl (right to left), whichever the text reads in.',
        i18n: {
          summaryKey: isAuto
            ? 'dirAttributeValid_summary_fail_auto'
            : 'dirAttributeValid_summary_fail_invalid',
          hintKey: 'dirAttributeValid_hint_fail',
          params: { value: raw }
        },
        data: {
          details: { reasonCode: isAuto ? 'autoDir' : 'invalidDir', value: raw },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
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
      outcome: 'fail',
      severity: rule.defaultSeverity || 'minor',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
