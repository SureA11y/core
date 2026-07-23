'use strict';

/**
 * @check a11ycore-landmark-no-duplicate-contentinfo
 * @atomic true
 * @summary A page must not have more than one contentinfo landmark
 * @standard the reference engine "Best Practices" (no formal WCAG Success Criterion — see ROADMAP.md Tier 1b)
 * @applicability
 *   Applies whenever the page contains at least one contentinfo landmark
 *   (explicit role="contentinfo", or an implicit, non-nested <footer>).
 * @expectation
 *   At most one contentinfo landmark exists on the page — mirrors
 *   a11ycore-landmark-no-duplicate-banner's rationale for contentinfo.
 * @implementation-notes
 * - Not WCAG-normative — authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see a11ycore-landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent.
 * - Only landmarks actually exposed to assistive technology can collide —
 *   matches the reference engine's own `page-no-duplicate` check (confirmed by reading
 *   its source directly: `query_selector_all_filter_default(..., elm =>
 *   _isVisibleToScreenReaders(elm))`) — same fix applied to the sibling
 *   banner/main rules after finding real hidden-duplicate false positives
 *   on Trello and Zoom.
 */

const id = 'a11ycore-landmark-no-duplicate-contentinfo';

const meta = {
  title: 'Page must not have more than one contentinfo landmark',
  description: 'Checks that at most one contentinfo landmark (role="contentinfo" or a non-nested <footer>) exists on the page.',
  i18n: {
    titleKey: 'a11ycore_landmarkNoDuplicateContentinfo_title',
    descriptionKey: 'a11ycore_landmarkNoDuplicateContentinfo_description'
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

  const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;

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
    if (getLandmarkRole(el) === 'contentinfo') contentinfos.push(el);
  }

  if (contentinfos.length <= 1) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = contentinfos.map((el) => {
    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    return {
      selector: stableSelector,
      html,
      summary: 'This page has more than one contentinfo landmark.',
      hint: 'Keep only one contentinfo landmark (footer/role="contentinfo") per page.',
      i18n: {
        summaryKey: 'a11ycore_landmarkNoDuplicateContentinfo_summary_cantTell',
        hintKey: 'a11ycore_landmarkNoDuplicateContentinfo_hint_cantTell',
        params: { count: String(contentinfos.length) }
      },
      data: {
        details: { reasonCode: 'LANDMARK_DUPLICATE_CONTENTINFO', count: contentinfos.length }
      }
    };
  });

  return { ruleId: rule.ruleId, outcome: 'cantTell', severity: rule.defaultSeverity || 'minor', occurrences };
}

module.exports = { id, meta, runInPage };
