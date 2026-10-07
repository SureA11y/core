/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check figure-caption-structure
 * @atomic true
 * @summary An image with a caption must be structured as RGAA 1.9.1 describes
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to <figure> elements that contain an image (<img>,
 *   <input type="image"> or an element with role="img") and a <figcaption>
 *   with text. A page with none is notApplicable.
 * @expectation
 *   The <figure> has role="figure" or role="group", and an aria-label whose
 *   text is the same as the caption's, whitespace collapsed (RGAA 1.9.1).
 *   The caption being inside a <figcaption> is what makes the figure
 *   applicable.
 * @implementation-notes
 * - Opt-in (tag `rgaa`): WCAG requires neither the explicit role nor the
 *   repeated label, so the rule runs only under the rgaa-4.1.2 profile, the
 *   `rgaa` tag or its own id.
 * - One occurrence per figure. Its reasonCode is the first condition that
 *   fails, in the order role, label, label text; details.reasons lists all.
 * - An image with a caption that is not in a <figure> at all cannot be found
 *   by markup; that stays with a person.
 */

const id = 'figure-caption-structure';

const meta = {
  title: 'Images with a caption use the figure structure RGAA describes',
  description:
    'Checks that a <figure> holding an image and a <figcaption> has role="figure" or "group" and an aria-label matching the caption.',
  i18n: {
    titleKey: 'figureCaptionStructure_title',
    descriptionKey: 'figureCaptionStructure_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'images', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const collapse = (s) =>
    String(s || '')
      .replace(/\s+/g, ' ')
      .trim();

  const figures = helpers.queryAllSmart
    ? helpers.queryAllSmart('figure')
    : helpers.queryAll('figure');

  const occurrences = [];
  let applicableCount = 0;

  for (const figure of figures) {
    if (!figure || !dom.get(figure, 'getAttribute')) continue;
    const caption = Array.from(dom.querySelectorAll(figure, ':scope > *')).find(
      (c) => String(dom.tagName(c)).toLowerCase() === 'figcaption'
    );
    const captionText = caption ? collapse(dom.textContent(caption)) : '';
    const image = Array.from(
      dom.querySelectorAll(figure, 'img, input[type="image" i], [role="img"]')
    ).find((el) => dom.closest(el, 'figure') === figure);
    if (!captionText || !image) continue;
    applicableCount += 1;

    const role = String(dom.getAttribute(figure, 'role') || '')
      .trim()
      .toLowerCase()
      .split(/\s+/)[0];
    const label = collapse(dom.getAttribute(figure, 'aria-label'));

    const reasons = [];
    if (role !== 'figure' && role !== 'group') reasons.push('missingRole');
    if (!label) reasons.push('missingAriaLabel');
    else if (label !== captionText) reasons.push('ariaLabelMismatch');
    if (!reasons.length) continue;

    const reasonCode = reasons[0];
    const texts = {
      missingRole: [
        'This figure holds an image and a caption but has no role="figure" or role="group".',
        'figureCaptionStructure_summary_fail_role'
      ],
      missingAriaLabel: [
        'This figure holds an image and a caption but has no aria-label repeating the caption.',
        'figureCaptionStructure_summary_fail_label'
      ],
      ariaLabelMismatch: [
        "This figure's aria-label differs from its caption.",
        'figureCaptionStructure_summary_fail_mismatch'
      ]
    };

    occurrences.push(
      helpers.reportOccurrence(figure, {
        summary: texts[reasonCode][0],
        hint: 'Give the <figure> role="figure" and an aria-label with the same text as its <figcaption>.',
        i18n: {
          summaryKey: texts[reasonCode][1],
          hintKey: 'figureCaptionStructure_hint_fail',
          params: {}
        },
        data: {
          details: { reasonCode, reasons, caption: captionText },
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
