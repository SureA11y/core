/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check landmark-complementary-is-top-level
 * @atomic true
 * @summary The complementary landmark must not be nested inside another landmark
 * @standard Best Practices (no formal WCAG Success Criterion)
 * @applicability
 *   Applies whenever the page contains at least one element carrying the
 *   complementary role: explicit role="complementary", or an <aside> that
 *   keeps its implicit role (see implementation notes on when it does not).
 * @expectation
 *   No complementary candidate has an ancestor that is itself a landmark
 *   region. Complementary content supports the main content of the page and
 *   sits beside it; nested inside another landmark it is a section of that
 *   landmark instead, which is not what landmark navigation announces.
 * @implementation-notes
 * - Not WCAG-normative, authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule, matching its three siblings
 *   (`landmark-banner-is-top-level`, `landmark-contentinfo-is-top-level`,
 *   `landmark-main-is-top-level`). Landmark detection and the
 *   ancestor walk are identical to theirs; only the role being looked for
 *   differs.
 * - An unnamed <aside> inside sectioning content has no complementary role
 *   per HTML-AAM, so it is not a candidate at all: reporting it would name a
 *   landmark that does not exist. A *named* one keeps the role wherever it
 *   sits, which is exactly the case worth review -- an <aside aria-label>
 *   inside <main> really is a complementary landmark nested in another
 *   landmark. `landmark-unique` and the sibling top-level rules already
 *   resolve <aside> this way, through the same shared helper.
 */

const id = 'landmark-complementary-is-top-level';

const meta = {
  title: 'Complementary landmark must be top-level',
  description:
    'Checks that the complementary landmark (role="complementary" or an <aside> that keeps its implicit role) is not nested inside another landmark region.',
  i18n: {
    titleKey: 'landmarkComplementaryIsTopLevel_title',
    descriptionKey: 'landmarkComplementaryIsTopLevel_description'
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

  // Declared inside runInPage; see scripts/build-core.js header
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
  // ancestor that suppresses its conditional implicit role": role-aware
  // (an ancestor's bare TAG only counts when it carries no role attribute
  // at all; an explicit role="dialog"-style override no longer suppresses)
  // rather than a local tag-only copy. See that function's header comment
  // in src/core/aria-helpers.js for the full algorithm.
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

  // A candidate must actually carry the complementary role. An <aside> that
  // HTML-AAM strips the role from is not a complementary landmark at all, so
  // flagging it would report a landmark that does not exist.
  function isComplementaryCandidate(el) {
    return getLandmarkRole(el) === 'complementary';
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

  const complementaries = [];
  const seen = new Set();
  for (const el of nodes) {
    if (!el || seen.has(el)) continue;
    seen.add(el);
    if (!isComplementaryCandidate(el)) continue;

    // An aria-hidden candidate is removed from the accessibility tree
    // entirely, so it is not part of the landmark structure assistive
    // technology users navigate and there is no real landmark to call
    // nested. queryAllSmart's default hidden-content policy only excludes
    // "hard" CSS-based hiding (display:none, etc.), not the softer
    // aria-hidden exclusion, so this needs its own check.
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

    complementaries.push(el);
  }

  if (complementaries.length === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  for (const el of complementaries) {
    if (!hasLandmarkAncestor(el)) continue;

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: 'This complementary landmark is nested inside another landmark region.',
        hint: 'Move the complementary landmark (<aside>/role="complementary") so it is not contained by another landmark; complementary content belongs beside the main content, not inside another region.',
        i18n: {
          summaryKey: 'landmarkComplementaryIsTopLevel_summary_cantTell',
          hintKey: 'landmarkComplementaryIsTopLevel_hint_cantTell',
          params: {}
        },
        data: {
          details: { reasonCode: 'LANDMARK_COMPLEMENTARY_NOT_TOP_LEVEL' }
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
