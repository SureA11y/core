/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check meta-viewport-zoom-enabled
 * @atomic true
 * @summary <meta name="viewport"> must not disable or cap pinch-zoom below 200%
 * @standard WCAG 2.2
 * @sc 1.4.4
 * @applicability
 *   Applies to <meta name="viewport"> elements that carry a non-empty
 *   content attribute.
 * @expectation
 *   The content attribute does not set user-scalable to "no"/"0", and does
 *   not set maximum-scale below 2 (200%). Either disables the user's
 *   ability to zoom text to at least 200%, which WCAG 1.4.4 (Resize Text)
 *   requires be possible.
 * @implementation-notes
 * - Malformed/unparseable maximum-scale values are ignored (not flagged) —
 *   this rule only reports a clearly-detected zoom restriction, matching
 *   this engine's no-false-positives policy.
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

    applicableCount += 1;

    const parsed = parseContent(raw);
    const reasons = [];

    const userScalable = parsed['user-scalable'];
    if (userScalable === 'no' || userScalable === '0') {
      reasons.push('user-scalable=' + userScalable);
    }

    const maxScaleRaw = parsed['maximum-scale'];
    if (maxScaleRaw !== undefined) {
      const maxScale = parseFloat(maxScaleRaw);
      if (!Number.isNaN(maxScale) && maxScale < 2) {
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
