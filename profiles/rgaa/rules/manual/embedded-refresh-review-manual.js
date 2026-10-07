/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check embedded-refresh-review
 * @atomic true
 * @summary Embedded content that may refresh itself should be checked for a way to control the refresh
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to the elements RGAA 13.1.1 lists as refresh methods, other
 *   than <meta>:
 *   - every <object> and <embed>, except one that shows a still image (a
 *     `type` of image/* other than image/svg+xml, or with no `type`, a
 *     `data` or `src` ending in a raster image extension);
 *   - every <canvas>, since a script draws it and may redraw it;
 *   - every <svg> that contains a <script>.
 *   Hidden elements count, as they can still reload content. An element
 *   inside an <object> already asked about is its fallback and is left out.
 * @expectation
 *   Each element found is asked about (cantTell). If it refreshes its
 *   content on its own, RGAA 13.1.1 wants the user to be able to stop or
 *   restart the refresh, lengthen the delay tenfold, be warned in time to
 *   lengthen it, or the delay to be twenty hours at least. The markup does
 *   not show whether any refresh happens.
 * @implementation-notes
 * - meta-refresh-no-url-timing reports the <meta> refresh of 13.1.1.
 * - An inline <svg> with no <script> is left out: without a script it
 *   cannot reload anything. SMIL animation is moving content (13.8), not a
 *   refresh.
 * - Refreshes started by a script elsewhere in the page cannot be detected.
 * - Manual (cantTell): the rule never passes.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'embedded-refresh-review';

const meta = {
  title: 'Embedded content that may refresh itself lets the user control the refresh',
  description:
    'Flags <object>, <embed>, <canvas> and scripted <svg> elements, for a person to check whether they refresh their content on their own and, if so, whether the user can stop, slow down or be warned of the refresh.',
  i18n: {
    titleKey: 'embeddedRefreshReview_title',
    descriptionKey: 'embeddedRefreshReview_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'time', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'low',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  // Every match in scope, hidden or not: a hidden element can still reload.
  function queryAllUnfiltered(sel) {
    const engineOptions = ctx.engineOptions || {};
    const deep =
      engineOptions.includeShadowDom !== false && typeof helpers.queryAllDeep === 'function';
    const list = Array.from((deep ? helpers.queryAllDeep(sel) : helpers.queryAll(sel)) || []);
    return typeof helpers.isExcluded === 'function'
      ? list.filter((el) => !helpers.isExcluded(el))
      : list;
  }

  const STILL_IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|bmp|ico|tiff?)(?:[?#]|$)/i;

  function attr(el, name) {
    return String(dom.getAttribute(el, name) || '').trim();
  }

  function isStillImage(el, urlAttr) {
    const type = attr(el, 'type').toLowerCase().split(';')[0].trim();
    if (type) return type.startsWith('image/') && type !== 'image/svg+xml';
    return STILL_IMAGE_EXT.test(attr(el, urlAttr));
  }

  function applies(el, tag) {
    if (tag === 'object') return !isStillImage(el, 'data');
    if (tag === 'embed') return !isStillImage(el, 'src');
    if (tag === 'canvas') return true;
    if (tag === 'svg') return !!dom.querySelector(el, 'script');
    return false;
  }

  const occurrences = [];
  const askedObjects = [];

  for (const el of queryAllUnfiltered('object, embed, canvas, svg')) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    if (askedObjects.some((o) => o !== el && dom.contains(o, el))) continue;
    const tag = String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();
    if (!applies(el, tag)) continue;
    if (tag === 'object') askedObjects.push(el);

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary:
          'This element may refresh its content on its own. Check whether it does, and whether the user can control the refresh.',
        hint: 'A refresh passes when the user can stop and restart it, can make the delay at least ten times longer, is warned in time to do so, or when the delay is at least twenty hours.',
        i18n: {
          summaryKey: 'embeddedRefreshReview_summary_cantTell',
          hintKey: 'embeddedRefreshReview_hint_cantTell',
          params: { element: tag }
        },
        uncertainty: {
          code: 'judgement-required',
          needed:
            'Whether this element refreshes its content automatically, and if so how the user can control it.',
          evidence: { element: tag }
        },
        data: {
          details: { reasonCode: 'POSSIBLE_REFRESH_SOURCE', element: tag },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
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
