'use strict';

/**
 * @check landmark-no-duplicate-main
 * @atomic true
 * @summary A page must not have more than one main landmark
 * @standard Best Practices (a widely-used reference engine's classification; no formal WCAG Success Criterion — see ROADMAP.md Tier 1b)
 * @applicability
 *   Applies whenever the page contains at least one main landmark
 *   (explicit role="main", or an implicit <main>).
 * @expectation
 *   At most one main landmark exists on the page. Distinct, atomic
 *   decision from landmark-one-main (that rule flags zero
 *   mains too; this one only flags more than one) — matches a widely-used
 *   reference engine shipping both as separate rules with some overlap by design.
 * @implementation-notes
 * - Not WCAG-normative — authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent.
 * - Only landmarks actually exposed to assistive technology can collide —
 *   matches a widely-used reference engine's own `page-no-duplicate` check (confirmed by reading
 *   its source directly: `query_selector_all_filter_default(..., elm =>
 *   _isVisibleToScreenReaders(elm))`). Without this, a responsive layout
 *   rendering both a visible and a CSS-hidden duplicate `<main>` (found on
 *   a real site — Zoom's homepage) was wrongly flagged as a duplicate
 *   landmark; the hidden copy is never actually reachable by AT.
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
  const { document, helpers, rule } = ctx;

  function normalizeWs(s) {
    return String(s || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getExplicitRoleToken(el) {
    const raw = normalizeWs(el.getAttribute && el.getAttribute('role'));
    if (!raw) return '';
    return raw.split(/\s+/)[0].toLowerCase();
  }

  function getLandmarkRole(el) {
    if (!el || !el.getAttribute) return '';
    const explicit = getExplicitRoleToken(el);
    if (explicit) return explicit === 'main' ? 'main' : '';
    const tag = el.tagName ? el.tagName.toLowerCase() : '';
    return tag === 'main' ? 'main' : '';
  }

  // queryAllSmart (shadow-DOM-aware) instead of plain document.querySelectorAll -- see
  // landmark-unique-manual.js's header comment for the real page (Airtable)
  // that surfaced this gap: a third-party shadow-DOM-hosted widget's own landmark is
  // invisible to a light-DOM-only query.
  let nodes;
  try {
    nodes =
      helpers && typeof helpers.queryAllSmart === 'function'
        ? helpers.queryAllSmart('main, [role]')
        : document.querySelectorAll('main, [role]');
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
    if (getLandmarkRole(el) === 'main') mains.push(el);
  }

  if (mains.length <= 1) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = mains.map((el) => {
    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : el.outerHTML || '';

    return {
      selector: stableSelector,
      html,
      summary: 'This page has more than one main landmark.',
      hint: 'Keep only one main landmark (<main>/role="main") per page.',
      i18n: {
        summaryKey: 'landmarkNoDuplicateMain_summary_cantTell',
        hintKey: 'landmarkNoDuplicateMain_hint_cantTell',
        params: { count: String(mains.length) }
      },
      data: {
        details: { reasonCode: 'LANDMARK_DUPLICATE_MAIN', count: mains.length }
      }
    };
  });

  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'minor',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
