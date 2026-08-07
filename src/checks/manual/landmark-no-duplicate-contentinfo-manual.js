'use strict';

/**
 * @check landmark-no-duplicate-contentinfo
 * @atomic true
 * @summary A page must not have more than one contentinfo landmark
 * @standard Best Practices (no formal WCAG Success Criterion — see ROADMAP.md Tier 1b)
 * @applicability
 *   Applies whenever the page contains at least one contentinfo landmark
 *   (explicit role="contentinfo", or an implicit, non-nested <footer>).
 * @expectation
 *   At most one contentinfo landmark exists on the page — mirrors
 *   landmark-no-duplicate-banner's rationale for contentinfo.
 * @implementation-notes
 * - Not WCAG-normative — authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent.
 * - Only landmarks actually exposed to assistive technology can collide —
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
  const { document, helpers, rule } = ctx;

  function normalizeWs(s) {
    return String(s || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Delegates to the shared helpers.getLandmarkNameInfo (aria-label -> aria-labelledby, via the
  // target's own accessible name, not raw textContent -> title attribute fallback) rather than a
  // local copy -- see that function's header comment in src/core/dom-helpers.js. Sharing it keeps
  // the title-attribute fallback consistent across the landmark rules.
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
  // in src/core/aria-helpers.js for the full algorithm. Example: an
  // <aside role="dialog"> containing its own <header>.
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
      // A named <aside> is never suppressed, even when nested — it keeps
      // "complementary" when it has an accessible name, even inside
      // sectioning content. Matches landmark-unique's precedent.
      if (!hasSectioningAncestor(el, false)) return 'complementary';
      return getAccessibleLandmarkName(el) ? 'complementary' : '';
    }
    if (tag === 'section') return getAccessibleLandmarkName(el) ? 'region' : '';
    if (tag === 'form') return getAccessibleLandmarkName(el) ? 'form' : '';
    return '';
  }

  const LANDMARK_ROLES = new Set([
    'banner',
    'contentinfo',
    'main',
    'navigation',
    'complementary',
    'region',
    'form',
    'search'
  ]);

  function getLandmarkRole(el) {
    if (!el || !el.getAttribute) return '';
    const explicit = getExplicitRoleToken(el);
    if (explicit) return LANDMARK_ROLES.has(explicit) ? explicit : '';
    return getImplicitLandmarkRole(el);
  }

  // queryAllSmart (shadow-DOM-aware) instead of plain document.querySelectorAll -- see
  // landmark-unique-manual.js's header comment. A third-party shadow-DOM-hosted
  // widget's own landmark is invisible to a light-DOM-only query.
  let nodes;
  try {
    nodes =
      helpers && typeof helpers.queryAllSmart === 'function'
        ? helpers.queryAllSmart('header, footer, main, nav, aside, section, form, [role]')
        : document.querySelectorAll('header, footer, main, nav, aside, section, form, [role]');
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
    if (getLandmarkRole(el) === 'contentinfo') contentinfos.push(el);
  }

  if (contentinfos.length <= 1) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = contentinfos.map((el) => {
    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : el.outerHTML || '';

    return {
      selector: stableSelector,
      html,
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
