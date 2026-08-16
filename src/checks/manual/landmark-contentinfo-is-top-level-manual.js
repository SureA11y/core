/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check landmark-contentinfo-is-top-level
 * @atomic true
 * @summary The contentinfo landmark must not be nested inside another landmark
 * @standard Best Practices (no formal WCAG Success Criterion — see ROADMAP.md Tier 1b)
 * @applicability
 *   Applies whenever the page contains at least one contentinfo
 *   candidate: explicit role="contentinfo", OR a <footer> with NO role
 *   attribute at all, regardless of nesting (see implementation notes on
 *   why candidate selection is deliberately unconditional).
 * @expectation
 *   No contentinfo candidate has an ancestor that is itself any landmark
 *   region. A contentinfo nested inside another landmark is not a
 *   top-level, whole-page footer region and confuses landmark-based
 *   navigation for assistive technology users.
 * @implementation-notes
 * - Not WCAG-normative — authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent (this rule mirrors
 *   its structure with contentinfo/footer in place of banner/header).
 * - Candidate selection (`isContentinfoCandidate`) requires the element to
 *   really carry the contentinfo role, via the suppression-aware
 *   `getLandmarkRole` — same reasoning as landmark-banner-is-top-level.
 */

const id = 'landmark-contentinfo-is-top-level';

const meta = {
  title: 'Contentinfo landmark must be top-level',
  description:
    'Checks that the contentinfo landmark (role="contentinfo" or a non-nested <footer>) is not nested inside another landmark region.',
  i18n: {
    titleKey: 'landmarkContentinfoIsTopLevel_title',
    descriptionKey: 'landmarkContentinfoIsTopLevel_description'
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
  // === 'contentinfo' — see the header comment above. A <footer> is
  // a candidate purely by tag + absence of any role attribute, independent
  // of whether sectioning-ancestor nesting would currently suppress its
  // implicit role; an explicit role="contentinfo" is always a candidate too.
  // A candidate must actually have the contentinfo role — a <footer> inside
  // article/aside/main/nav/section is not one, so flagging it as nested
  // would report a landmark that does not exist.
  function isContentinfoCandidate(el) {
    return getLandmarkRole(el) === 'contentinfo';
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

  const contentinfos = [];
  const seen = new Set();
  for (const el of nodes) {
    if (!el || seen.has(el)) continue;
    seen.add(el);
    if (!isContentinfoCandidate(el)) continue;

    // An aria-hidden contentinfo candidate is removed from the
    // accessibility tree entirely -- it isn't part of the landmark
    // structure assistive technology users navigate at all, so it
    // shouldn't be flagged as "nested inside another landmark" (there's
    // no real landmark there to begin with, from AT's perspective).
    // queryAllSmart's default hidden-content policy only excludes "hard"
    // CSS-based hiding (display:none, etc.), not the softer aria-hidden
    // exclusion, so this needs its own check.
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

    contentinfos.push(el);
  }

  if (contentinfos.length === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  for (const el of contentinfos) {
    if (!hasLandmarkAncestor(el)) continue;

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: 'This contentinfo landmark is nested inside another landmark region.',
        hint: 'Move the contentinfo landmark (footer/role="contentinfo") so it is not contained by another landmark; contentinfo should be a top-level region of the page.',
        i18n: {
          summaryKey: 'landmarkContentinfoIsTopLevel_summary_cantTell',
          hintKey: 'landmarkContentinfoIsTopLevel_hint_cantTell',
          params: {}
        },
        data: {
          details: { reasonCode: 'LANDMARK_CONTENTINFO_NOT_TOP_LEVEL' }
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
