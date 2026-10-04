/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check landmark-no-duplicate-banner
 * @atomic true
 * @summary A page must not have more than one banner landmark
 * @standard Best Practices (no formal WCAG Success Criterion)
 * @applicability
 *   Applies whenever the page contains at least one banner landmark
 *   (explicit role="banner", or an implicit, non-nested <header>; see
 *   landmark-banner-is-top-level's implementation notes for the
 *   shared landmark-detection model).
 * @expectation
 *   At most one banner landmark exists on the page. Per WAI-ARIA
 *   Authoring Practices, the banner landmark represents site-oriented
 *   content that identifies the page as a whole, so having more than one
 *   is ambiguous for assistive technology users navigating by landmark.
 * @reports
 *   - `count`: how many banner landmarks the page exposes to assistive
 *     technology, against a limit of 1.
 * @implementation-notes
 * - Not WCAG-normative, authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent.
 * - Flags every banner instance (not just the "extra" ones) when more
 *   than one exists, since which instance is "correct" is ambiguous.
 * - Only landmarks actually exposed to assistive technology can collide.
 *   Without this, a responsive layout rendering both a visible and a
 *   CSS-hidden duplicate `<header>` (a desktop/mobile header pair) is
 *   flagged as a duplicate landmark even though the hidden copy is never
 *   reachable by AT.
 */

const id = 'landmark-no-duplicate-banner';

const meta = {
  title: 'Page must not have more than one banner landmark',
  description:
    'Checks that at most one banner landmark (role="banner" or a non-nested <header>) exists on the page.',
  i18n: {
    titleKey: 'landmarkNoDuplicateBanner_title',
    descriptionKey: 'landmarkNoDuplicateBanner_description'
  },
  helpUrl: null,
  tags: ['best-practice', 'landmarks', 'structure', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  // queryAllSmart is shadow-DOM-aware, so a landmark a third-party widget
  // renders inside a shadow root counts too.
  let nodes;
  try {
    nodes = helpers.queryAllSmart(helpers.landmarkCandidateSelector);
  } catch {
    nodes = [];
  }

  const isAccTreeEligible =
    helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;

  function isExposedToAt(el) {
    if (!isAccTreeEligible) return true;
    try {
      const r = isAccTreeEligible(el, ctx);
      if (typeof r === 'boolean') return r;
      return !!(r && r.eligible);
    } catch {
      return true;
    }
  }

  const banners = [];
  const seen = new Set();
  for (const el of nodes) {
    if (!el || seen.has(el)) continue;
    seen.add(el);
    if (!isExposedToAt(el)) continue;
    if (helpers.getLandmarkRole(el, ctx) === 'banner') banners.push(el);
  }

  if (banners.length === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (banners.length === 1) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }

  const occurrences = banners.map((el) => {
    return helpers.reportOccurrence(el, {
      summary: 'This page has more than one banner landmark.',
      hint: 'Keep only one banner landmark (header/role="banner") per page.',
      i18n: {
        summaryKey: 'landmarkNoDuplicateBanner_summary_cantTell',
        hintKey: 'landmarkNoDuplicateBanner_hint_cantTell',
        params: { count: String(banners.length) }
      },
      data: {
        details: { reasonCode: 'LANDMARK_DUPLICATE_BANNER', count: banners.length }
      }
    });
  });

  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'minor',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
