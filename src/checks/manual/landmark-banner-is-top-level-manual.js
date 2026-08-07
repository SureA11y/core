/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check landmark-banner-is-top-level
 * @atomic true
 * @summary The banner landmark must not be nested inside another landmark
 * @standard Best Practices (no formal WCAG Success Criterion — see ROADMAP.md Tier 1b)
 * @applicability
 *   Applies whenever the page contains at least one banner candidate:
 *   explicit role="banner", OR a <header> with NO role attribute at all,
 *   regardless of nesting (see implementation notes on why candidate
 *   selection is deliberately unconditional).
 * @expectation
 *   No banner candidate has an ancestor that is itself any landmark
 *   region. A banner nested inside another landmark is not a top-level,
 *   whole-page banner and confuses landmark-based navigation for
 *   assistive technology users.
 * @implementation-notes
 * - Not WCAG-normative — authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule per ROADMAP.md Tier 1b and the design doc's policy model
 *   ("Advisory / best-practice rules may exist, but must not produce
 *   `fail`"). Matches the existing `page-title-patterns-manual.js`
 *   precedent: deterministic DOM analysis, no human required, but
 *   capped at `cantTell`/`notApplicable` rather than `fail`/`pass`.
 * - Landmark detection here models WAI-ARIA APG landmark roles and the
 *   HTML-AAM implicit-role mapping (header→banner, footer→contentinfo,
 *   main→main, nav→navigation, aside→complementary, section/form→
 *   region/form only when accessibly named).
 * - Candidate selection (`isBannerCandidate` below) is deliberately
 *   unconditional — a `<header>`/`role="banner"` counts as a candidate
 *   regardless of nesting — rather than reusing the same HTML-AAM
 *   sectioning-ancestor suppression (`getImplicitLandmarkRole`'s
 *   `hasSectioningAncestor` gate) that the violation check itself relies
 *   on. Gating candidate selection on that suppression would be
 *   self-defeating: the moment a `<header>` is nested inside another
 *   landmark, that same nesting would make it stop counting as a banner
 *   candidate in the first place, so the rule could never flag the one
 *   case it exists to catch. The ancestor walk (`hasLandmarkAncestor`) is intentionally
 *   asymmetric: it still uses the full suppression-aware
 *   `getLandmarkRole` for each ancestor, since an ancestor genuinely
 *   needs its own real role to count as blocking.
 */

const id = 'landmark-banner-is-top-level';

const meta = {
  title: 'Banner landmark must be top-level',
  description:
    'Checks that the banner landmark (role="banner" or a non-nested <header>) is not nested inside another landmark region.',
  i18n: {
    titleKey: 'landmarkBannerIsTopLevel_title',
    descriptionKey: 'landmarkBannerIsTopLevel_description'
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
  const { document, root, helpers, rule } = ctx;

  // Declared inside runInPage — see scripts/build-core.js header
  // ("runInPage MUST be self-contained").
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

  // Candidate selection is deliberately NOT the same as getLandmarkRole()
  // === 'banner' — see the fix note above. A <header> is a
  // candidate purely by tag + absence of any role attribute, independent
  // of whether sectioning-ancestor nesting would currently suppress its
  // implicit role; an explicit role="banner" is always a candidate too.
  function isBannerCandidate(el) {
    if (!el || !el.getAttribute) return false;
    const explicit = getExplicitRoleToken(el);
    if (explicit) return explicit === 'banner';
    return !!(el.tagName && el.tagName.toLowerCase() === 'header');
  }

  function hasLandmarkAncestor(el) {
    const scopeRoots = Array.isArray(root) ? root : root ? [root] : [];
    let p = el.parentElement;
    while (p) {
      if (getLandmarkRole(p)) return true;
      // Don't climb past the scanned scope -- see aria-helpers.js's
      // hasLandmarkScopingAncestor for the same fix and rationale.
      if (scopeRoots.includes(p)) break;
      p = p.parentElement;
    }
    return false;
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

  const banners = [];
  const seen = new Set();
  for (const el of nodes) {
    if (!el || seen.has(el)) continue;
    seen.add(el);
    if (!isBannerCandidate(el)) continue;

    // An aria-hidden banner candidate is removed from the accessibility
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

    banners.push(el);
  }

  if (banners.length === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  for (const el of banners) {
    if (!hasLandmarkAncestor(el)) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : el.outerHTML || '';

    occurrences.push({
      selector: stableSelector,
      html,
      summary: 'This banner landmark is nested inside another landmark region.',
      hint: 'Move the banner landmark (header/role="banner") so it is not contained by another landmark; a banner should be a top-level region of the page.',
      i18n: {
        summaryKey: 'landmarkBannerIsTopLevel_summary_cantTell',
        hintKey: 'landmarkBannerIsTopLevel_hint_cantTell',
        params: {}
      },
      data: {
        details: { reasonCode: 'LANDMARK_BANNER_NOT_TOP_LEVEL' }
      }
    });
  }

  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'minor',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
