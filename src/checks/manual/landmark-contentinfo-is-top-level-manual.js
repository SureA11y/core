/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check landmark-contentinfo-is-top-level
 * @atomic true
 * @summary The contentinfo landmark must not be nested inside another landmark
 * @standard Best Practices (no formal WCAG Success Criterion)
 * @applicability
 *   Applies whenever the page contains at least one contentinfo
 *   candidate: explicit role="contentinfo", OR a <footer> with NO role
 *   attribute at all, regardless of nesting.
 * @expectation
 *   No contentinfo candidate has an ancestor that is itself any landmark
 *   region. A contentinfo nested inside another landmark is not a
 *   top-level, whole-page footer region and confuses landmark-based
 *   navigation for assistive technology users.
 * @implementation-notes
 * - Not WCAG-normative, authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent (this rule mirrors
 *   its structure with contentinfo/footer in place of banner/header).
 * - Candidate selection (`isContentinfoCandidate`) requires the element to
 *   really carry the contentinfo role, same reasoning as
 *   landmark-banner-is-top-level.
 */

const id = 'landmark-contentinfo-is-top-level';

const meta = {
  title: 'Contentinfo landmark must be top-level',
  description:
    'Checks that the contentinfo landmark (role="contentinfo" or a non-nested <footer>) is not nested inside another landmark region.',
  i18n: {
    titleKey: 'landmarkContentinfoIsTopLevel_title',
    descriptionKey: 'landmarkContentinfoIsTopLevel_description'
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

  // A candidate must actually have the contentinfo role: a <footer> inside
  // article/aside/main/nav/section is not one, so flagging it as nested
  // would report a landmark that does not exist.
  function isContentinfoCandidate(el) {
    return helpers.getLandmarkRole(el, ctx) === 'contentinfo';
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

  const contentinfos = [];
  const seen = new Set();
  for (const el of nodes) {
    if (!el || seen.has(el)) continue;
    seen.add(el);
    if (!isContentinfoCandidate(el)) continue;

    // An aria-hidden contentinfo candidate is removed from the
    // accessibility tree entirely -- it isn't part of the landmark
    // structure assistive technology users navigate at all, so it
    // shouldn't be flagged as "nested inside another landmark" (there's
    // no real landmark there to begin with, from AT's perspective).
    // queryAllSmart's default hidden-content policy only excludes "hard"
    // CSS-based hiding (display:none, etc.), not the softer aria-hidden
    // exclusion, so this needs its own check.
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

    contentinfos.push(el);
  }

  if (contentinfos.length === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  for (const el of contentinfos) {
    if (!hasLandmarkAncestor(el)) continue;

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: 'This contentinfo landmark is nested inside another landmark region.',
        hint: 'Move the contentinfo landmark (footer/role="contentinfo") so it is not contained by another landmark; contentinfo should be a top-level region of the page.',
        i18n: {
          summaryKey: 'landmarkContentinfoIsTopLevel_summary_cantTell',
          hintKey: 'landmarkContentinfoIsTopLevel_hint_cantTell',
          params: {}
        },
        data: {
          details: { reasonCode: 'LANDMARK_CONTENTINFO_NOT_TOP_LEVEL' }
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
