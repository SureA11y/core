'use strict';

/**
 * @check landmark-contentinfo-is-top-level
 * @atomic true
 * @summary The contentinfo landmark must not be nested inside another landmark
 * @standard Best Practices (a widely-used reference engine's classification; no formal WCAG Success Criterion — see ROADMAP.md Tier 1b)
 * @applicability
 *   Applies whenever the page contains at least one contentinfo
 *   candidate: explicit role="contentinfo", OR a <footer> with NO role
 *   attribute at all (regardless of nesting — see implementation notes'
 *   2026-08-01 fix).
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
 * - **Fixed 2026-08-01, same self-defeating applicability bug as
 *   landmark-banner-is-top-level (see that file's header comment for the
 *   full root cause and the TurboTax evidence) — candidate selection
 *   (`isContentinfoCandidate` below) now matches a widely-used reference
 *   engine's unconditional `footer:not([role]), [role=contentinfo]`
 *   selector shape instead of reusing the sectioning-ancestor
 *   suppression that the violation check itself depends on.
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
  // === 'contentinfo' — see the 2026-08-01 fix note above. A <footer> is
  // a candidate purely by tag + absence of any role attribute, independent
  // of whether sectioning-ancestor nesting would currently suppress its
  // implicit role; an explicit role="contentinfo" is always a candidate too.
  function isContentinfoCandidate(el) {
    if (!el || !el.getAttribute) return false;
    const explicit = getExplicitRoleToken(el);
    if (explicit) return explicit === 'contentinfo';
    return !!(el.tagName && el.tagName.toLowerCase() === 'footer');
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
  // landmark-unique-manual.js's header comment for the real page (Airtable, 2026-07-23)
  // that surfaced this gap: a third-party shadow-DOM-hosted widget's own landmark is
  // invisible to a light-DOM-only query.
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
    if (isContentinfoCandidate(el)) contentinfos.push(el);
  }

  if (contentinfos.length === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  for (const el of contentinfos) {
    if (!hasLandmarkAncestor(el)) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : el.outerHTML || '';

    occurrences.push({
      selector: stableSelector,
      html,
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
