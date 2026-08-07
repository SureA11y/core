/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check meta-viewport-large
 * @atomic true
 * @summary Viewport meta tag should allow zooming up to 500% (AAA-level)
 * @standard Best Practices (no formal WCAG Success Criterion — see ROADMAP.md Tier 1b)
 * @applicability
 *   Applies to <meta name="viewport"> elements that carry a non-empty
 *   content attribute.
 * @expectation
 *   The content attribute does not set user-scalable to "no"/"0", and
 *   does not set maximum-scale below 5 (500%). This is the AAA-level,
 *   stricter counterpart of meta-viewport-zoom-enabled (which
 *   enforces the AA 200% minimum as a hard, WCAG-normative fail); this
 *   rule is advisory best-practice guidance toward the higher AAA bar.
 * @implementation-notes
 * - Not WCAG-normative — authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent.
 * - Distinct, atomic decision from meta-viewport-zoom-enabled
 *   (that rule is the hard-fail 200% floor; this one is the softer 500%
 *   best-practice ceiling target).
 */

const id = 'meta-viewport-large';

const meta = {
  title: 'Viewport meta tag should allow zooming up to 500%',
  description:
    'Checks that <meta name="viewport"> does not set user-scalable=no or maximum-scale below 5 (500%).',
  i18n: {
    titleKey: 'metaViewportLarge_title',
    descriptionKey: 'metaViewportLarge_description'
  },
  helpUrl: null,
  tags: ['best-practice', 'structure', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {}
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
      if (!Number.isNaN(maxScale) && maxScale < 5) {
        reasons.push('maximum-scale=' + maxScaleRaw);
      }
    }

    if (!reasons.length) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : el.outerHTML || '';

    occurrences.push({
      selector: stableSelector,
      html,
      summary: 'This viewport meta tag restricts zoom below the 500% best-practice target.',
      hint: 'Remove user-scalable=no and raise maximum-scale to at least 5 (500%) if possible.',
      i18n: {
        summaryKey: 'metaViewportLarge_summary_cantTell',
        hintKey: 'metaViewportLarge_hint_cantTell',
        params: { reasons: reasons.join(', ') }
      },
      data: {
        details: { reasonCode: 'VIEWPORT_ZOOM_BELOW_500', reasons }
      }
    });
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
  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage, applicability };
