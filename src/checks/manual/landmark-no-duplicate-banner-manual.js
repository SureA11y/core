'use strict';

/**
 * @check landmark-no-duplicate-banner
 * @atomic true
 * @summary A page must not have more than one banner landmark
 * @standard Best Practices (a widely-used reference engine's classification; no formal WCAG Success Criterion — see ROADMAP.md Tier 1b)
 * @applicability
 *   Applies whenever the page contains at least one banner landmark
 *   (explicit role="banner", or an implicit, non-nested <header> — see
 *   landmark-banner-is-top-level's implementation notes for the
 *   shared landmark-detection model).
 * @expectation
 *   At most one banner landmark exists on the page. Per WAI-ARIA
 *   Authoring Practices, the banner landmark represents site-oriented
 *   content that identifies the page as a whole — having more than one
 *   is ambiguous for assistive technology users navigating by landmark.
 * @implementation-notes
 * - Not WCAG-normative — authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent.
 * - Flags every banner instance (not just the "extra" ones) when more
 *   than one exists, since which instance is "correct" is ambiguous.
 * - Only landmarks actually exposed to assistive technology can collide —
 *   matches a widely-used reference engine's own `page-no-duplicate` check (confirmed by reading
 *   its source directly: `query_selector_all_filter_default(..., elm =>
 *   _isVisibleToScreenReaders(elm))`). Without this, a responsive layout
 *   rendering both a visible and a CSS-hidden duplicate `<header>` (found
 *   on a real site — Trello's homepage, a desktop/mobile header pair) was
 *   wrongly flagged as a duplicate landmark; the hidden copy is never
 *   actually reachable by AT.
 */

const id = 'landmark-no-duplicate-banner';

const meta = {
  title: 'Page must not have more than one banner landmark',
  description: 'Checks that at most one banner landmark (role="banner" or a non-nested <header>) exists on the page.',
  i18n: {
    titleKey: 'landmarkNoDuplicateBanner_title',
    descriptionKey: 'landmarkNoDuplicateBanner_description'
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

  const banners = [];
  const seen = new Set();
  for (const el of nodes) {
    if (!el || seen.has(el)) continue;
    seen.add(el);
    if (!isExposedToAt(el)) continue;
    if (getLandmarkRole(el) === 'banner') banners.push(el);
  }

  if (banners.length <= 1) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = banners.map((el) => {
    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    return {
      selector: stableSelector,
      html,
      summary: 'This page has more than one banner landmark.',
      hint: 'Keep only one banner landmark (header/role="banner") per page.',
      i18n: {
        summaryKey: 'landmarkNoDuplicateBanner_summary_cantTell',
        hintKey: 'landmarkNoDuplicateBanner_hint_cantTell',
        params: { count: String(banners.length) }
      },
      data: {
        details: { reasonCode: 'LANDMARK_DUPLICATE_BANNER', count: banners.length }
      }
    };
  });

  return { ruleId: rule.ruleId, outcome: 'cantTell', severity: rule.defaultSeverity || 'minor', occurrences };
}

module.exports = { id, meta, runInPage };
