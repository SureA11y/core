'use strict';

/**
 * @check landmark-main-is-top-level
 * @atomic true
 * @summary The main landmark must not be nested inside another landmark
 * @standard Best Practices (a widely-used reference engine's classification; no formal WCAG Success Criterion — see ROADMAP.md Tier 1b)
 * @applicability
 *   Applies whenever the page contains at least one main landmark
 *   (explicit role="main", or an implicit <main> element).
 * @expectation
 *   No main landmark has an ancestor that is itself any landmark region.
 *   A main region nested inside another landmark is not a top-level,
 *   whole-page main content area and confuses landmark-based navigation
 *   for assistive technology users.
 * @implementation-notes
 * - Not WCAG-normative — authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent (this rule mirrors
 *   its structure with main in place of banner/header).
 */

const id = 'landmark-main-is-top-level';

const meta = {
  title: 'Main landmark must be top-level',
  description: 'Checks that the main landmark (role="main" or <main>) is not nested inside another landmark region.',
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
  const { document, helpers, rule } = ctx;

  function normalizeWs(s) {
    return String(s || '').replace(/\s+/g, ' ').trim();
  }

  // Delegates to the shared helpers.getLandmarkNameInfo (aria-label -> aria-labelledby, via the
  // target's own accessible name, not raw textContent -> title attribute fallback) rather than a
  // local copy -- see that function's header comment in src/core/dom-helpers.js for the real bug
  // (missing title fallback) this replaced across all 7 landmark rule files that had their own
  // copy of this logic.
  function getAccessibleLandmarkName(el) {
    try {
      if (helpers && typeof helpers.getLandmarkNameInfo === 'function') {
        const info = helpers.getLandmarkNameInfo(el, ctx);
        if (info && info.present && info.value) return normalizeWs(info.value);
      }
    } catch {}
    return '';
  }

  function getExplicitRoleToken(el) {
    const raw = normalizeWs(el.getAttribute && el.getAttribute('role'));
    if (!raw) return '';
    return raw.split(/\s+/)[0].toLowerCase();
  }

  // Delegates to the shared helpers.hasLandmarkScopingAncestor for the
  // question "does this element sit inside a sectioning-content/<main>
  // ancestor that suppresses its conditional implicit role" — role-aware
  // (an ancestor's bare TAG only counts when it carries no role attribute
  // at all; an explicit role="dialog"-style override no longer suppresses)
  // rather than a local tag-only copy. See that function's header comment
  // in src/core/aria-helpers.js for the full algorithm and the real page
  // (handsontable.com's docs-assistant side panel, an
  // <aside role="dialog"> containing its own <header>) that surfaced this
  // rule's own former tag-only copy as a false negative.
  function hasSectioningAncestor(el, includeMain) {
    return helpers && typeof helpers.hasLandmarkScopingAncestor === 'function'
      ? helpers.hasLandmarkScopingAncestor(el, { includeMain })
      : false;
  }

  function getImplicitLandmarkRole(el) {
    const tag = el.tagName ? el.tagName.toLowerCase() : '';
    if (tag === 'header') return hasSectioningAncestor(el, true) ? '' : 'banner';
    if (tag === 'footer') return hasSectioningAncestor(el, true) ? '' : 'contentinfo';
    if (tag === 'main') return 'main';
    if (tag === 'nav') return 'navigation';
    if (tag === 'aside') {
      // A named <aside> is never suppressed, even when nested — matches
      // landmark-unique's own verified-against-reference-engine precedent
      // (that engine's real `aside` implicit-role function keeps
      // "complementary" when the element has an accessible name, even
      // inside sectioning content); propagated here for consistency.
      if (!hasSectioningAncestor(el, false)) return 'complementary';
      return getAccessibleLandmarkName(el) ? 'complementary' : '';
    }
    if (tag === 'section') return getAccessibleLandmarkName(el) ? 'region' : '';
    if (tag === 'form') return getAccessibleLandmarkName(el) ? 'form' : '';
    return '';
  }

  const LANDMARK_ROLES = new Set(['banner', 'contentinfo', 'main', 'navigation', 'complementary', 'region', 'form', 'search']);

  function getLandmarkRole(el) {
    if (!el || !el.getAttribute) return '';
    const explicit = getExplicitRoleToken(el);
    if (explicit) return LANDMARK_ROLES.has(explicit) ? explicit : '';
    return getImplicitLandmarkRole(el);
  }

  function hasLandmarkAncestor(el) {
    let p = el.parentElement;
    while (p) {
      if (getLandmarkRole(p)) return true;
      p = p.parentElement;
    }
    return false;
  }

  // queryAllSmart (shadow-DOM-aware) instead of plain document.querySelectorAll -- see
  // landmark-unique-manual.js's header comment for the real page (Airtable, 2026-07-23)
  // that surfaced this gap: a third-party shadow-DOM-hosted widget's own landmark is
  // invisible to a light-DOM-only query.
  let nodes = [];
  try {
    nodes = helpers && typeof helpers.queryAllSmart === 'function'
      ? helpers.queryAllSmart('header, footer, main, nav, aside, section, form, [role]')
      : document.querySelectorAll('header, footer, main, nav, aside, section, form, [role]');
  } catch {
    nodes = [];
  }

  const mains = [];
  const seen = new Set();
  for (const el of nodes) {
    if (!el || seen.has(el)) continue;
    seen.add(el);
    if (getLandmarkRole(el) === 'main') mains.push(el);
  }

  if (mains.length === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  for (const el of mains) {
    if (!hasLandmarkAncestor(el)) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    occurrences.push({
      selector: stableSelector,
      html,
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
    });
  }

  if (occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'cantTell', severity: rule.defaultSeverity || 'minor', occurrences };
  }
  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
