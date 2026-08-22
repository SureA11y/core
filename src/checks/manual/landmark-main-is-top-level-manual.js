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
 *   it, so `getImplicitLandmarkRole`'s `main` branch is never subject to
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
  const { document, root, helpers, rule } = ctx;

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
  // ancestor that suppresses its conditional implicit role": role-aware
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
      // A named <aside> is never suppressed, even when nested. It keeps
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

  const mains = [];
  const seen = new Set();
  for (const el of nodes) {
    if (!el || seen.has(el)) continue;
    seen.add(el);
    if (getLandmarkRole(el) !== 'main') continue;

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
  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
