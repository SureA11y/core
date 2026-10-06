/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check meta-viewport-zoom-enabled
 * @atomic true
 * @summary <meta name="viewport"> must not disable or cap pinch-zoom below 200%
 * @standard WCAG 2.2
 * @sc 1.4.4
 * @applicability
 *   Applies to <meta name="viewport"> elements whose content attribute sets
 *   maximum-scale or user-scalable. Content setting neither cannot restrict
 *   zoom.
 * @expectation
 *   user-scalable is absent, yes, device-width, device-height, or a number
 *   outside the range -1 to 1; and maximum-scale is absent, device-width,
 *   device-height, negative, or 2 or more. Anything else stops the user
 *   zooming text to 200%, which WCAG 1.4.4 (Resize Text) requires.
 * @reports
 *   - `reasons`: the settings that restrict zoom, one per item, written as
 *     in the `content` attribute (`user-scalable=no`, `maximum-scale=1`).
 * @implementation-notes
 * - The content attribute is read as browsers read it (CSS Viewport):
 *   whitespace separates settings as ',' and ';' do, so
 *   'width=device-width user-scalable=no' sets user-scalable. A setting
 *   with no value, or a value that isn't a number, counts as a
 *   restriction, as browsers translate it to 0; yes counts as 1, so
 *   maximum-scale=yes caps zoom at 100%. A negative maximum-scale is
 *   dropped by the browser, so it restricts nothing and passes. Shared with
 *   meta-viewport-large (helpers.readViewportContent).
 */

const id = 'meta-viewport-zoom-enabled';

const meta = {
  title: 'Viewport meta tag must not disable zoom',
  description:
    'Checks that <meta name="viewport"> does not set user-scalable=no or maximum-scale below 2 (200%).',
  i18n: {
    titleKey: 'metaViewportZoomEnabled_title',
    descriptionKey: 'metaViewportZoomEnabled_description'
  },
  helpUrl: null,
  tags: ['wcag2aa', 'wcag144', 'structure', 'atomic', 'automatic'],
  wcagSc: ['1.4.4'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.4.4',
      title: 'Resize Text',
      conformanceLevel: 'AA'
    }
  ],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '1.4.4': ['meta-viewport-zoom-enabled'] } }
};

// This check is inherently whole-document (does the PAGE have this
// property?), not evaluable per-subtree -- notApplicable when contextSelector
// scoped this run narrower than the whole document, or when
// engineOptions.fragment:true was set (see helpers.isWholeDocumentScope).
function applicability(ctx) {
  return ctx.helpers.isWholeDocumentScope ? ctx.helpers.isWholeDocumentScope() : true;
}

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  const nodes = dom.get(document, 'querySelectorAll')
    ? dom.querySelectorAll(document, 'meta[name="viewport" i]')
    : [];

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    const raw = String(dom.getAttribute(el, 'content') || '').trim();
    if (!raw) continue;

    const viewport = helpers.readViewportContent(raw);
    const { values } = viewport;

    // ACT b4f0c3 applies only when content carries maximum-scale or
    // user-scalable; content that sets neither cannot restrict zoom.
    if (viewport.userScalable === undefined && viewport.maximumScale === undefined) continue;

    applicableCount += 1;
    const reasons = [];
    if (viewport.userScalable === false) reasons.push('user-scalable=' + values['user-scalable']);
    if (typeof viewport.maximumScale === 'number' && viewport.maximumScale < 2) {
      reasons.push('maximum-scale=' + values['maximum-scale']);
    }

    if (!reasons.length) continue;

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: 'This viewport meta tag restricts the user’s ability to zoom.',
        hint: 'Remove user-scalable=no and any maximum-scale below 2 from the viewport meta content.',
        i18n: {
          summaryKey: 'metaViewportZoomEnabled_summary_fail',
          hintKey: 'metaViewportZoomEnabled_hint_fail',
          params: { reasons: reasons.join(', ') }
        },
        data: {
          details: { reasonCode: 'VIEWPORT_ZOOM_RESTRICTED', reasons }
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
      severity: rule.defaultSeverity || 'serious',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage, applicability };
