/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check images-of-text
 * @atomic true
 * @summary Text should be real text, not an image of text
 * @standard WCAG 2.2
 * @sc 1.4.5
 * @applicability
 *   Applies to two kinds of image that markup shows are likely to hold
 *   text, when they are rendered:
 *   - an <input type="image">, a button drawn as an image, which nearly
 *     always carries its label as text in the image;
 *   - an <img> whose source is an SVG data URL whose markup holds a <text>
 *     element: the text is drawn as part of the image, which can't be
 *     restyled as text can.
 *   Other images are not asked about: whether an image holds text is in its
 *   pixels, which a scan of the markup doesn't see. An inline <svg> with
 *   <text> is real text, and is out of scope (ACT 0va7u6).
 *   Finding nothing to ask about, it reports notApplicable, not pass: it
 *   applies only to what its check flags, and finding nothing there
 *   doesn't show that all is well (RULE_TAXONOMY.md, manual rules).
 * @expectation
 *   Text that can be real text is real text, styled with CSS, rather than
 *   an image of text, unless the image can be customized to the user's
 *   needs or the particular presentation of the text is essential, as in a
 *   logo (WCAG 1.4.5).
 * @reason-codes
 *   - `IMAGE_BUTTON_TEXT_REVIEW` (cantTell): an <input type="image"> draws
 *     its button as an image; a person checks whether the image holds text
 *     that could be real text.
 *     Basis: WCAG 1.4.5 (not settled); G140; C22; ACT 0va7u6.
 *   - `SVG_IMAGE_TEXT_REVIEW` (cantTell): an <img> shows an SVG whose markup
 *     holds <text>, drawn as part of the image; a person checks whether
 *     that text could be real text.
 *     Basis: WCAG 1.4.5 (not settled); G140; C22; ACT 0va7u6.
 * @implementation-notes
 * - type 'manual': whether an image of text is customizable, or its
 *   presentation essential, is a judgment, so the rule never fails.
 * - The SVG is read only from a data URL, which is in the page: an SVG file
 *   the <img> loads is not fetched.
 * - An image with alt="" is asked about too: 1.4.5 is about what is drawn,
 *   and a decorative image of text is still an image of text (ACT 0va7u6,
 *   Failed Example 4).
 */

const id = 'images-of-text';

const meta = {
  title: 'Text should be real text, not an image of text',
  description:
    'Asks about images that markup shows are likely to hold text (an <input type="image">, or an <img> showing an SVG with <text>), whether that text could be real text.',
  i18n: {
    titleKey: 'imagesOfText_title',
    descriptionKey: 'imagesOfText_description'
  },
  helpUrl: null,
  tags: ['wcag2aa', 'wcag145', 'nontext', 'images', 'atomic', 'manual'],
  wcagSc: ['1.4.5'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.4.5',
      title: 'Images of Text',
      conformanceLevel: 'AA'
    }
  ],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'low',
  coverage: { facetsBySc: { '1.4.5': ['images-of-text-evidence'] } }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  // Rendered: an image a scan can't see drawn is no image of text to it.
  function isRendered(el) {
    if (!helpers || typeof helpers.isDomVisibleEligible !== 'function') return true;
    try {
      return helpers.isDomVisibleEligible(el, ctx, { targetSet: 'dom' }).eligible !== false;
    } catch {
      return true;
    }
  }

  // The markup of an SVG data URL, or '' for any other source.
  function svgDataMarkup(src) {
    const m = /^\s*data:image\/svg\+xml(;[^,]*)?,([\s\S]*)$/i.exec(String(src || ''));
    if (!m) return '';
    const params = (m[1] || '').toLowerCase();
    try {
      if (/;base64/.test(params)) {
        return typeof atob === 'function' ? atob(m[2].replace(/\s+/g, '')) : '';
      }
      return decodeURIComponent(m[2]);
    } catch {
      return m[2];
    }
  }

  const occurrences = [];

  function ask(el, reasonCode, keys, summary, hint) {
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary,
        hint,
        i18n: { summaryKey: keys[0], hintKey: keys[1], params: {} },
        data: { details: { reasonCode } }
      })
    );
  }

  const inputs = helpers.queryAllSmart ? helpers.queryAllSmart('input') : helpers.queryAll('input');
  for (const el of inputs) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    const type = String(dom.getAttribute(el, 'type') || '')
      .trim()
      .toLowerCase();
    if (type !== 'image' || !isRendered(el)) continue;
    ask(
      el,
      'IMAGE_BUTTON_TEXT_REVIEW',
      ['imagesOfText_summary_cantTell_button', 'imagesOfText_hint_cantTell_button'],
      'This button is drawn as an image. Check whether the image holds text that could be real text.',
      'Use real text styled with CSS, such as a <button> with its label as text, unless the text is essential as it is drawn (a logo) or users can change how the image shows it.'
    );
  }

  const imgs = helpers.queryAllSmart ? helpers.queryAllSmart('img') : helpers.queryAll('img');
  for (const el of imgs) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    if (!/<text[\s>/]/i.test(svgDataMarkup(dom.getAttribute(el, 'src')))) continue;
    if (!isRendered(el)) continue;
    ask(
      el,
      'SVG_IMAGE_TEXT_REVIEW',
      ['imagesOfText_summary_cantTell_svg', 'imagesOfText_hint_cantTell_svg'],
      'This image shows an SVG with text drawn in it. Check whether that text could be real text.',
      'Use real text styled with CSS, such as the SVG inline in the page or the text next to the image, unless the text is essential as it is drawn (a logo) or users can change how the image shows it.'
    );
  }

  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'moderate',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
