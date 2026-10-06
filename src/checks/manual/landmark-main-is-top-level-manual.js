/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check landmark-main-is-top-level
 * @atomic true
 * @summary The main landmark must not be nested inside another landmark
 * @standard Best Practices (no formal WCAG Success Criterion)
 * @applicability
 *   Applies whenever the page contains at least one main landmark
 *   (explicit role="main", or an implicit <main> element).
 * @expectation
 *   No main landmark has an ancestor that is itself any landmark region.
 *   A main region nested inside another landmark is not a top-level,
 *   whole-page main content area and confuses landmark-based navigation
 *   for assistive technology users.
 * @implementation-notes
 * - Not WCAG-normative, authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent (this rule mirrors
 *   its structure with main in place of banner/header).
 * - Unlike landmark-banner-is-top-level/landmark-contentinfo-is-top-level
 *   (see that file's header comment), candidate selection here doesn't
 *   need to be unconditional: `<main>`'s implicit role is unconditional
 *   per HTML-AAM. Unlike `<header>`/`<footer>`, nesting never suppresses
 *   it, so a `<main>` candidate is never subject to
 *   the self-defeating candidate-selection problem those two rules guard
 *   against.
 */

const id = 'landmark-main-is-top-level';

const meta = {
  title: 'Main landmark must be top-level',
  description:
    'Checks that the main landmark (role="main" or <main>) is not nested inside another landmark region.',
  i18n: {
    titleKey: 'landmarkMainIsTopLevel_title',
    descriptionKey: 'landmarkMainIsTopLevel_description'
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
  const dom = ctx.helpers.dom;
  const { root, helpers, rule } = ctx;

  function hasLandmarkAncestor(el) {
    const scopeRoots = Array.isArray(root) ? root : root ? [root] : [];
    let p = dom.parentElement(el);
    // Bounded as a safety net only: a walk up a real tree always ends.
    for (let steps = 0; p && steps < 100000; steps++) {
      if (helpers.getLandmarkRole(p, ctx)) return true;
      // Don't climb past the scanned scope -- see aria-helpers.js's
      // hasLandmarkScopingAncestor for the same fix and rationale.
      if (scopeRoots.includes(p)) break;
      p = dom.parentElement(p);
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

  const mains = [];
  const seen = new Set();
  for (const el of nodes) {
    if (!el || seen.has(el)) continue;
    seen.add(el);
    if (helpers.getLandmarkRole(el, ctx) !== 'main') continue;

    // An aria-hidden main candidate is removed from the accessibility
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

    mains.push(el);
  }

  if (mains.length === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  for (const el of mains) {
    if (!hasLandmarkAncestor(el)) continue;

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: 'This main landmark is nested inside another landmark region.',
        hint: 'Move the main landmark (<main>/role="main") so it is not contained by another landmark; main should be a top-level region of the page.',
        i18n: {
          summaryKey: 'landmarkMainIsTopLevel_summary_cantTell',
          hintKey: 'landmarkMainIsTopLevel_hint_cantTell',
          params: {}
        },
        data: {
          details: { reasonCode: 'LANDMARK_MAIN_NOT_TOP_LEVEL' }
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
