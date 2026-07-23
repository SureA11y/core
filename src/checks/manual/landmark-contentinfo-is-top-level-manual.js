'use strict';

/**
 * @check a11ycore-landmark-contentinfo-is-top-level
 * @atomic true
 * @summary The contentinfo landmark must not be nested inside another landmark
 * @standard the reference engine "Best Practices" (no formal WCAG Success Criterion — see ROADMAP.md Tier 1b)
 * @applicability
 *   Applies whenever the page contains at least one contentinfo landmark
 *   (explicit role="contentinfo", or an implicit <footer> that is not
 *   itself nested inside <article>/<aside>/<main>/<nav>/<section> — see
 *   implementation notes).
 * @expectation
 *   No contentinfo landmark has an ancestor that is itself any landmark
 *   region. A contentinfo nested inside another landmark is not a
 *   top-level, whole-page footer region and confuses landmark-based
 *   navigation for assistive technology users.
 * @implementation-notes
 * - Not WCAG-normative — authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see a11ycore-landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent (this rule mirrors
 *   its structure with contentinfo/footer in place of banner/header).
 */

const id = 'a11ycore-landmark-contentinfo-is-top-level';

const meta = {
  title: 'Contentinfo landmark must be top-level',
  description: 'Checks that the contentinfo landmark (role="contentinfo" or a non-nested <footer>) is not nested inside another landmark region.',
  i18n: {
    titleKey: 'a11ycore_landmarkContentinfoIsTopLevel_title',
    descriptionKey: 'a11ycore_landmarkContentinfoIsTopLevel_description'
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

  const SECTIONING_ANCESTORS = new Set(['article', 'aside', 'main', 'nav', 'section']);

  function isSuppressedBySectioningAncestor(el) {
    let p = el.parentElement;
    while (p) {
      const tag = p.tagName ? p.tagName.toLowerCase() : '';
      if (SECTIONING_ANCESTORS.has(tag)) return true;
      p = p.parentElement;
    }
    return false;
  }

  function getImplicitLandmarkRole(el) {
    const tag = el.tagName ? el.tagName.toLowerCase() : '';
    if (tag === 'header') return isSuppressedBySectioningAncestor(el) ? '' : 'banner';
    if (tag === 'footer') return isSuppressedBySectioningAncestor(el) ? '' : 'contentinfo';
    if (tag === 'main') return 'main';
    if (tag === 'nav') return 'navigation';
    if (tag === 'aside') return isSuppressedBySectioningAncestor(el) ? '' : 'complementary';
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

  const contentinfos = [];
  const seen = new Set();
  for (const el of nodes) {
    if (!el || seen.has(el)) continue;
    seen.add(el);
    if (getLandmarkRole(el) === 'contentinfo') contentinfos.push(el);
  }

  if (contentinfos.length === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  for (const el of contentinfos) {
    if (!hasLandmarkAncestor(el)) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    occurrences.push({
      selector: stableSelector,
      html,
      summary: 'This contentinfo landmark is nested inside another landmark region.',
      hint: 'Move the contentinfo landmark (footer/role="contentinfo") so it is not contained by another landmark; contentinfo should be a top-level region of the page.',
      i18n: {
        summaryKey: 'a11ycore_landmarkContentinfoIsTopLevel_summary_cantTell',
        hintKey: 'a11ycore_landmarkContentinfoIsTopLevel_hint_cantTell',
        params: {}
      },
      data: {
        details: { reasonCode: 'LANDMARK_CONTENTINFO_NOT_TOP_LEVEL' }
      }
    });
  }

  if (occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'cantTell', severity: rule.defaultSeverity || 'minor', occurrences };
  }
  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
