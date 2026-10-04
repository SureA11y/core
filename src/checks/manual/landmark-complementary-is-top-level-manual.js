/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check landmark-complementary-is-top-level
 * @atomic true
 * @summary The complementary landmark must not be nested inside another landmark
 * @standard Best Practices (no formal WCAG Success Criterion)
 * @applicability
 *   Applies whenever the page contains at least one element carrying the
 *   complementary role: explicit role="complementary", or an <aside> that
 *   keeps its implicit role.
 * @expectation
 *   No complementary candidate has an ancestor that is itself a landmark
 *   region. Complementary content supports the main content of the page and
 *   sits beside it; nested inside another landmark it is a section of that
 *   landmark instead, which is not what landmark navigation announces.
 * @implementation-notes
 * - Not WCAG-normative, authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule, matching its three siblings
 *   (`landmark-banner-is-top-level`, `landmark-contentinfo-is-top-level`,
 *   `landmark-main-is-top-level`). Landmark detection and the
 *   ancestor walk are identical to theirs; only the role being looked for
 *   differs.
 * - An unnamed <aside> inside sectioning content has no complementary role
 *   per HTML-AAM, so it is not a candidate at all: reporting it would name a
 *   landmark that does not exist. A *named* one keeps the role wherever it
 *   sits, which is exactly the case worth review -- an <aside aria-label>
 *   inside <main> really is a complementary landmark nested in another
 *   landmark. `landmark-unique` and the sibling top-level rules already
 *   resolve <aside> this way, through the same shared helper.
 */

const id = 'landmark-complementary-is-top-level';

const meta = {
  title: 'Complementary landmark must be top-level',
  description:
    'Checks that the complementary landmark (role="complementary" or an <aside> that keeps its implicit role) is not nested inside another landmark region.',
  i18n: {
    titleKey: 'landmarkComplementaryIsTopLevel_title',
    descriptionKey: 'landmarkComplementaryIsTopLevel_description'
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

  // A candidate must actually carry the complementary role. An <aside> that
  // HTML-AAM strips the role from is not a complementary landmark at all, so
  // flagging it would report a landmark that does not exist.
  function isComplementaryCandidate(el) {
    return helpers.getLandmarkRole(el, ctx) === 'complementary';
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

  const complementaries = [];
  const seen = new Set();
  for (const el of nodes) {
    if (!el || seen.has(el)) continue;
    seen.add(el);
    if (!isComplementaryCandidate(el)) continue;

    // An aria-hidden candidate is removed from the accessibility tree
    // entirely, so it is not part of the landmark structure assistive
    // technology users navigate and there is no real landmark to call
    // nested. queryAllSmart's default hidden-content policy only excludes
    // "hard" CSS-based hiding (display:none, etc.), not the softer
    // aria-hidden exclusion, so this needs its own check.
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

    complementaries.push(el);
  }

  if (complementaries.length === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  for (const el of complementaries) {
    if (!hasLandmarkAncestor(el)) continue;

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: 'This complementary landmark is nested inside another landmark region.',
        hint: 'Move the complementary landmark (<aside>/role="complementary") so it is not contained by another landmark; complementary content belongs beside the main content, not inside another region.',
        i18n: {
          summaryKey: 'landmarkComplementaryIsTopLevel_summary_cantTell',
          hintKey: 'landmarkComplementaryIsTopLevel_hint_cantTell',
          params: {}
        },
        data: {
          details: { reasonCode: 'LANDMARK_COMPLEMENTARY_NOT_TOP_LEVEL' }
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
  // A pass is a claim about the whole page, and a scoped scan saw only part
  // of it (RULE_AUTHORING.md §11.2); what it found inside the scope stands.
  return {
    ruleId: rule.ruleId,
    outcome: helpers.isWholeDocumentScope() ? 'pass' : 'notApplicable',
    severity: 'minor',
    occurrences: []
  };
}

module.exports = { id, meta, runInPage };
