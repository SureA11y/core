/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check landmark-no-duplicate-main
 * @atomic true
 * @summary A page must not have more than one main landmark
 * @standard Best Practices (no formal WCAG Success Criterion)
 * @applicability
 *   Applies whenever the page contains at least one main landmark
 *   (explicit role="main", or an implicit <main>).
 *   A custom element whose ElementInternals give it a landmark role
 *   (this.attachInternals().role), with no role attribute naming another, is
 *   a landmark as a native element with that role is.
 * @expectation
 *   At most one main landmark exists on the page. Distinct, atomic
 *   decision from landmark-one-main (that rule flags zero
 *   mains too; this one only flags more than one).
 * @reports
 *   - `count`: how many main landmarks the page exposes to assistive
 *     technology, against a limit of 1.
 * @reason-codes
 *   - `LANDMARK_DUPLICATE_MAIN` (cantTell): the page exposes more than one
 *     main landmark; each one is reported.
 *     It leans fail: the page states it.
 *     Basis: WAI-ARIA 1.2 main role (SHOULD).
 * @implementation-notes
 * - Not WCAG-normative, authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent.
 * - Only landmarks actually exposed to assistive technology can collide.
 *   Without this, a responsive layout rendering both a visible and a
 *   CSS-hidden duplicate `<main>` is flagged as a duplicate landmark even
 *   though the hidden copy is never reachable by AT.
 */

const id = 'landmark-no-duplicate-main';

const meta = {
  title: 'Page must not have more than one main landmark',
  description: 'Checks that at most one main landmark (role="main" or <main>) exists on the page.',
  i18n: {
    titleKey: 'landmarkNoDuplicateMain_title',
    descriptionKey: 'landmarkNoDuplicateMain_description'
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

  // queryAllSmart is shadow-DOM-aware, so a <main> a third-party widget
  // renders inside a shadow root counts too.
  let nodes;
  try {
    nodes = helpers.queryAllSmart('main, [role]', { internalsRoles: true });
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

  const mains = [];
  const seen = new Set();
  for (const el of nodes) {
    if (!el || seen.has(el)) continue;
    seen.add(el);
    if (!isExposedToAt(el)) continue;
    if (helpers.getLandmarkRole(el, ctx) === 'main') mains.push(el);
  }

  if (mains.length === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (mains.length === 1) {
    // A pass is a claim about the whole page, and a scoped scan saw only part
    // of it (RULE_AUTHORING.md §11.2); what it found inside the scope stands.
    return {
      ruleId: rule.ruleId,
      outcome: helpers.isWholeDocumentScope() ? 'pass' : 'notApplicable',
      severity: 'minor',
      occurrences: []
    };
  }

  const occurrences = mains.map((el) => {
    return helpers.reportOccurrence(el, {
      summary: 'This page has more than one main landmark.',
      hint: 'Keep only one main landmark (<main> or role="main") on the page.',
      i18n: {
        summaryKey: 'landmarkNoDuplicateMain_summary_cantTell',
        hintKey: 'landmarkNoDuplicateMain_hint_cantTell',
        params: { count: String(mains.length) }
      },
      lean: {
        toward: 'fail',
        why: 'The page exposes more than one main landmark.',
        signals: [{ signal: 'landmark-repeated', value: true }],
        i18n: { whyKey: 'landmarkNoDuplicateMain_lean_why' }
      },
      data: {
        details: { reasonCode: 'LANDMARK_DUPLICATE_MAIN', count: mains.length }
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
