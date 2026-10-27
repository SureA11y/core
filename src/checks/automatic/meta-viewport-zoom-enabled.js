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
 *   In the viewport meta tag in effect, the last one with content (an
 *   earlier one is replaced, and asked about if it restricts zoom):
 *   user-scalable is absent, yes, device-width, device-height, or a number
 *   outside the range -1 to 1; and maximum-scale is absent, device-width,
 *   device-height, negative, or 2 or more. Anything else stops the user
 *   zooming text to 200%, which WCAG 1.4.4 (Resize Text) requires.
 * @reports
 *   - `reasons`: the settings that restrict zoom, one per item, written as
 *     in the `content` attribute (`user-scalable=no`, `maximum-scale=1`).
 * @reason-codes
 *   - `VIEWPORT_ZOOM_RESTRICTED` (fail): the viewport meta tag in effect,
 *     the last one with content, disables zoom or caps it below 200%.
 *     Basis: WCAG 1.4.4; ACT b4f0c3; CSS Viewport meta viewport.
 *   - `VIEWPORT_ZOOM_RESTRICTED_OVERRIDDEN` (cantTell): a viewport meta tag
 *     that a later one replaces restricts zoom; browsers apply the last,
 *     and have not always agreed.
 *     It leans pass when the tag in effect sets each restricted setting
 *     again to a value that allows zoom.
 *     Basis: WCAG 1.4.4 (not settled); CSS Viewport meta viewport.
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
  coverage: { facetsBySc: { '1.4.4': ['meta-viewport-zoom-enabled'] } },
  // How a person checks each undecided finding: shown with it as
  // howToCheck (docs/OUTPUT_SCHEMA.md).
  review: {
    VIEWPORT_ZOOM_RESTRICTED_OVERRIDDEN: {
      steps: [
        'In the Elements panel, find every <meta name="viewport"> in the page\'s head and note which one is last.',
        "Open the page on a phone or tablet, or in the developer tools' device mode with touch emulation.",
        "Pinch to zoom (or use the browser's zoom) and try to enlarge text to 200%."
      ],
      passWhen:
        'Text can be zoomed to at least 200%, so the earlier restricting tag has no effect.',
      failWhen:
        'Zoom is blocked or capped below 200% in the browser tested, which fails WCAG 1.4.4.'
    }
  }
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
  const questions = [];
  let applicableCount = 0;

  // Browsers apply the last viewport meta tag that has content; an earlier
  // one is overridden. One that restricts zoom fails; an earlier one that
  // restricts is asked about, since browsers have differed on merging them.
  const withContent = Array.from(nodes).filter(
    (el) =>
      el && dom.get(el, 'getAttribute') && String(dom.getAttribute(el, 'content') || '').trim()
  );
  const inEffect = withContent.length ? withContent[withContent.length - 1] : null;

  // The tag in effect sets each setting this earlier one restricts, to a
  // value that restricts nothing: a browser that merges the tags keeps the
  // later value, and one that applies the last tag drops the earlier, so
  // zoom is allowed either way. Where the later tag leaves one out, a
  // merging browser would keep the restriction, and there is no lean.
  const inEffectViewport = inEffect
    ? helpers.readViewportContent(String(dom.getAttribute(inEffect, 'content') || ''))
    : null;
  function overriddenLean(viewport) {
    if (!inEffectViewport) return null;
    const later = inEffectViewport;
    if (later.userScalable === false) return null;
    if (typeof later.maximumScale === 'number' && later.maximumScale < 2) return null;
    const resetsUserScalable = viewport.userScalable !== false || later.userScalable === true;
    const resetsMaximumScale =
      !(typeof viewport.maximumScale === 'number' && viewport.maximumScale < 2) ||
      typeof later.maximumScale === 'number';
    if (!resetsUserScalable || !resetsMaximumScale) return null;
    return {
      toward: 'pass',
      why: 'The later viewport meta tag sets each restricted setting again to a value that allows zoom, so zoom is allowed whether browsers merge the tags or apply the last one.',
      signals: [
        { signal: 'later-tag-resets-properties', value: true },
        { signal: 'later-tag-restricts', value: false }
      ],
      i18n: { whyKey: 'metaViewportZoomEnabled_lean_why_overridden' }
    };
  }

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

    if (el !== inEffect) {
      const lean = overriddenLean(viewport);
      questions.push(
        helpers.reportOccurrence(el, {
          ...(lean ? { lean } : {}),
          summary:
            'This viewport meta tag restricts zoom, but a later viewport meta tag replaces it.',
          hint: 'Remove the earlier viewport meta tag, or user-scalable=no and any maximum-scale below 2 from it: browsers apply the last one, and have not always agreed.',
          occurrenceOutcome: 'cantTell',
          i18n: {
            summaryKey: 'metaViewportZoomEnabled_summary_cantTell_overridden',
            hintKey: 'metaViewportZoomEnabled_hint_cantTell_overridden',
            params: { reasons: reasons.join(', ') }
          },
          uncertainty: {
            code: 'runtime-dependent',
            needed: 'Whether the browser in use applies only the last viewport meta tag.'
          },
          data: {
            details: { reasonCode: 'VIEWPORT_ZOOM_RESTRICTED_OVERRIDDEN', reasons }
          }
        })
      );
      continue;
    }

    occurrences.push(
      helpers.reportOccurrence(el, {
        occurrenceOutcome: 'fail',
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
  const resolved = helpers.resolveTieredOutcome(
    occurrences,
    questions,
    rule.defaultSeverity || 'serious'
  );
  return { ruleId: rule.ruleId, ...resolved };
}

module.exports = { id, meta, runInPage, applicability };
