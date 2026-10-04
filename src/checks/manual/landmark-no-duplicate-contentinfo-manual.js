/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check landmark-no-duplicate-contentinfo
 * @atomic true
 * @summary A page must not have more than one contentinfo landmark
 * @standard Best Practices (no formal WCAG Success Criterion)
 * @applicability
 *   Applies whenever the page contains at least one contentinfo landmark
 *   (explicit role="contentinfo", or an implicit, non-nested <footer>).
 * @expectation
 *   At most one contentinfo landmark exists on the page, mirroring
 *   landmark-no-duplicate-banner's rationale for contentinfo.
 * @reports
 *   - `count`: how many contentinfo landmarks the page exposes to assistive
 *     technology, against a limit of 1.
 * @implementation-notes
 * - Not WCAG-normative, authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent.
 * - Only landmarks actually exposed to assistive technology can collide,
 *   same as the sibling banner/main rules, avoiding hidden-duplicate false
 *   positives.
 */

const id = 'landmark-no-duplicate-contentinfo';

const meta = {
  title: 'Page must not have more than one contentinfo landmark',
  description:
    'Checks that at most one contentinfo landmark (role="contentinfo" or a non-nested <footer>) exists on the page.',
  i18n: {
    titleKey: 'landmarkNoDuplicateContentinfo_title',
    descriptionKey: 'landmarkNoDuplicateContentinfo_description'
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

  const contentinfos = [];
  const seen = new Set();
  for (const el of nodes) {
    if (!el || seen.has(el)) continue;
    seen.add(el);
    if (!isExposedToAt(el)) continue;
    if (helpers.getLandmarkRole(el, ctx) === 'contentinfo') contentinfos.push(el);
  }

  if (contentinfos.length === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (contentinfos.length === 1) {
    // A pass is a claim about the whole page, and a scoped scan saw only part
    // of it (RULE_AUTHORING.md §11.2); what it found inside the scope stands.
    return {
      ruleId: rule.ruleId,
      outcome: helpers.isWholeDocumentScope() ? 'pass' : 'notApplicable',
      severity: 'minor',
      occurrences: []
    };
  }

  const occurrences = contentinfos.map((el) => {
    return helpers.reportOccurrence(el, {
      summary: 'This page has more than one contentinfo landmark.',
      hint: 'Keep only one contentinfo landmark (footer/role="contentinfo") per page.',
      i18n: {
        summaryKey: 'landmarkNoDuplicateContentinfo_summary_cantTell',
        hintKey: 'landmarkNoDuplicateContentinfo_hint_cantTell',
        params: { count: String(contentinfos.length) }
      },
      data: {
        details: { reasonCode: 'LANDMARK_DUPLICATE_CONTENTINFO', count: contentinfos.length }
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
