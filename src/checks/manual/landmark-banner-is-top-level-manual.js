/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check landmark-banner-is-top-level
 * @atomic true
 * @summary The banner landmark must not be nested inside another landmark
 * @standard Best Practices (no formal WCAG Success Criterion)
 * @applicability
 *   Applies whenever the page contains at least one banner candidate:
 *   explicit role="banner", OR a <header> with NO role attribute at all,
 *   regardless of nesting.
 * @expectation
 *   No banner candidate has an ancestor that is itself any landmark
 *   region. A banner nested inside another landmark is not a top-level,
 *   whole-page banner and confuses landmark-based navigation for
 *   assistive technology users.
 * @implementation-notes
 * - Not WCAG-normative, authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule per the design doc's policy model
 *   ("Advisory / best-practice rules may exist, but must not produce
 *   `fail`"). Matches the existing `page-title-patterns-manual.js`
 *   precedent: deterministic DOM analysis, no human required, but
 *   capped at `cantTell`/`notApplicable` rather than `fail`/`pass`.
 * - Landmark detection is `helpers.getLandmarkRole`, shared by every
 *   landmark rule: HTML-AAM's implicit roles, an explicit role's first
 *   token, and region/form only when named (Core-AAM). See its header
 *   comment in src/core/dom-helpers.js.
 * - Candidate selection (`isBannerCandidate`) requires the element to really
 *   carry the banner role, so a nested `<header>` is not a candidate. The
 *   two ancestor sets differ, so this does not make the rule vacuous: the
 *   suppression set is the sectioning tags plus `<main>`, while the blocking
 *   set is any landmark role, so a `<header>` inside `role="region"`,
 *   `<form>` or `<footer>` is still caught, and an explicit `role="banner"`
 *   is a candidate wherever it sits.
 */

const id = 'landmark-banner-is-top-level';

const meta = {
  title: 'Banner landmark must be top-level',
  description:
    'Checks that the banner landmark (role="banner" or a non-nested <header>) is not nested inside another landmark region.',
  i18n: {
    titleKey: 'landmarkBannerIsTopLevel_title',
    descriptionKey: 'landmarkBannerIsTopLevel_description'
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
  const { root, helpers, rule } = ctx;

  // A candidate must actually have the banner role. Per HTML-AAM a <header>
  // descended from article/aside/main/nav/section is not a banner at all, so
  // flagging it as a nested banner reports a landmark that does not exist.
  function isBannerCandidate(el) {
    return helpers.getLandmarkRole(el, ctx) === 'banner';
  }

  function hasLandmarkAncestor(el) {
    const scopeRoots = Array.isArray(root) ? root : root ? [root] : [];
    let p = el.parentElement;
    while (p) {
      if (helpers.getLandmarkRole(p, ctx)) return true;
      // Don't climb past the scanned scope -- see aria-helpers.js's
      // hasLandmarkScopingAncestor for the same fix and rationale.
      if (scopeRoots.includes(p)) break;
      p = p.parentElement;
    }
    return false;
  }

  // queryAllSmart is shadow-DOM-aware, so a landmark a third-party widget
  // renders inside a shadow root counts too.
  let nodes;
  try {
    nodes = helpers.queryAllSmart(helpers.landmarkCandidateSelector);
  } catch {
    nodes = [];
  }

  const banners = [];
  const seen = new Set();
  for (const el of nodes) {
    if (!el || seen.has(el)) continue;
    seen.add(el);
    if (!isBannerCandidate(el)) continue;

    // An aria-hidden banner candidate is removed from the accessibility
    // tree entirely -- it isn't part of the landmark structure assistive
    // technology users navigate at all, so it shouldn't be flagged as
    // "nested inside another landmark" (there's no real landmark there to
    // begin with, from AT's perspective). queryAllSmart's default hidden-
    // content policy only excludes "hard" CSS-based hiding (display:none,
    // etc.), not the softer aria-hidden exclusion, so this needs its own
    // check.
    if (helpers && typeof helpers.isAccTreeEligible === 'function') {
      const elig = (() => {
        try {
          return helpers.isAccTreeEligible(el, ctx);
        } catch {
          return { eligible: true, reasons: [] };
        }
      })();
      if (elig && elig.eligible === false) continue;
    }

    banners.push(el);
  }

  if (banners.length === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  for (const el of banners) {
    if (!hasLandmarkAncestor(el)) continue;

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: 'This banner landmark is nested inside another landmark region.',
        hint: 'Move the banner landmark (header/role="banner") so it is not contained by another landmark; a banner should be a top-level region of the page.',
        i18n: {
          summaryKey: 'landmarkBannerIsTopLevel_summary_cantTell',
          hintKey: 'landmarkBannerIsTopLevel_hint_cantTell',
          params: {}
        },
        data: {
          details: { reasonCode: 'LANDMARK_BANNER_NOT_TOP_LEVEL' }
        }
      })
    );
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

module.exports = { id, meta, runInPage };
