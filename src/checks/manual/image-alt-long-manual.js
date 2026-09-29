/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check image-alt-long
 * @atomic true
 * @summary An image's text alternative should be short
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to <img>, <area> and <input type="image"> with an alt
 *   attribute, and to role="img" elements with an aria-label. A page with
 *   none is notApplicable.
 * @expectation
 *   A text alternative longer than 80 characters (spaces collapsed) is
 *   flagged for a person to decide whether it is short and concise, as RGAA
 *   1.3.9 asks, or one of the particular cases it allows. RGAA's test gives
 *   no number: 80 characters is a threshold for asking, not a limit.
 * @implementation-notes
 * - Manual (cantTell): a long alternative can be right, and a detailed
 *   description belongs in a separate long description (RGAA 1.8).
 * - Opt-in (tag `rgaa`): WCAG sets no length for a text alternative.
 */

const id = 'image-alt-long';

const meta = {
  title: 'Text alternatives of images are short',
  description:
    'Flags an image whose text alternative is longer than 80 characters, for a person to decide whether it is short and concise enough.',
  i18n: {
    titleKey: 'imageAltLong_title',
    descriptionKey: 'imageAltLong_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'images', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const MAX_LENGTH = 80;
  const SELECTOR = 'img[alt], area[alt], input[type="image" i][alt], [role="img"][aria-label]';

  function collapse(v) {
    return String(v == null ? '' : v)
      .replace(/\s+/g, ' ')
      .trim();
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(SELECTOR)
    : helpers.queryAll(SELECTOR);

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;
    const tag = String(el.tagName).toLowerCase();
    const native = tag === 'img' || tag === 'area' || tag === 'input';
    const text = collapse(native ? el.getAttribute('alt') : el.getAttribute('aria-label'));
    if (!text) continue;
    applicableCount += 1;
    if (text.length <= MAX_LENGTH) continue;

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: `This image's text alternative is ${text.length} characters long.`,
        hint: 'Keep the text alternative to what the image conveys in context, in a few words. Put a detailed description in a long description next to the image or linked from it.',
        i18n: {
          summaryKey: 'imageAltLong_summary_cantTell',
          hintKey: 'imageAltLong_hint_cantTell',
          params: { length: String(text.length) }
        },
        data: {
          details: { reasonCode: 'longAlternative', length: text.length, maxLength: MAX_LENGTH },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (applicableCount === 0 || !occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'minor',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
