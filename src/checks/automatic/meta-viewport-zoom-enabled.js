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
 * @implementation-notes
 * - An unparseable value counts as a restriction, because CSS Device
 *   Adaptation translates it to 0: maximum-scale=yes disables zoom exactly
 *   as maximum-scale=0 does. A negative maximum-scale is out of range and
 *   dropped by the browser, so it restricts nothing and passes.
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
  const { document, helpers, rule } = ctx;

  function parseContent(raw) {
    const out = {};
    for (const pair of String(raw || '').split(/[,;]/)) {
      const eq = pair.indexOf('=');
      if (eq === -1) continue;
      const key = pair.slice(0, eq).trim().toLowerCase();
      const value = pair
        .slice(eq + 1)
        .trim()
        .toLowerCase();
      if (key) out[key] = value;
    }
    return out;
  }

  const nodes = document.querySelectorAll
    ? document.querySelectorAll('meta[name="viewport" i]')
    : [];

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;
    const raw = String(el.getAttribute('content') || '').trim();
    if (!raw) continue;

    const parsed = parseContent(raw);

    // ACT b4f0c3 applies only when content carries maximum-scale or
    // user-scalable; content that sets neither cannot restrict zoom.
    if (parsed['user-scalable'] === undefined && parsed['maximum-scale'] === undefined) continue;

    applicableCount += 1;
    const reasons = [];

    // CSS Device Adaptation translates an unparseable value to 0, so
    // user-scalable=invalid and maximum-scale=yes disable zoom just as
    // user-scalable=no does. A negative maximum-scale is out of range and
    // dropped instead, which is why it does not restrict anything.
    const userScalable = parsed['user-scalable'];
    if (
      userScalable !== undefined &&
      userScalable !== 'yes' &&
      userScalable !== 'device-width' &&
      userScalable !== 'device-height'
    ) {
      const scale = parseFloat(userScalable);
      if (Number.isNaN(scale) || (scale > -1 && scale < 1)) {
        reasons.push('user-scalable=' + userScalable);
      }
    }

    const maxScaleRaw = parsed['maximum-scale'];
    if (
      maxScaleRaw !== undefined &&
      maxScaleRaw !== 'device-width' &&
      maxScaleRaw !== 'device-height'
    ) {
      const maxScale = parseFloat(maxScaleRaw);
      if (Number.isNaN(maxScale) || (maxScale >= 0 && maxScale < 2)) {
        reasons.push('maximum-scale=' + maxScaleRaw);
      }
    }

    if (!reasons.length) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : el.outerHTML || '';

    occurrences.push({
      selector: stableSelector,
      html,
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
    });
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
