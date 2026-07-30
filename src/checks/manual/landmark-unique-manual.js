'use strict';

/**
 * @check landmark-unique
 * @atomic true
 * @summary Landmarks sharing the same role must have unique accessible names
 * @standard Best Practices (a widely-used reference engine's classification; no formal WCAG Success Criterion — see ROADMAP.md Tier 1b)
 * @applicability
 *   Applies whenever two or more landmark regions on the page share the
 *   same landmark role (banner, contentinfo, main, navigation,
 *   complementary, region, form, or search — see implementation notes
 *   for the detection model).
 * @expectation
 *   Among landmarks sharing a role, each has a distinct accessible name
 *   (via aria-label/aria-labelledby — landmarks are not named from
 *   content). Two same-role landmarks with the same name (including two
 *   both left unnamed) are indistinguishable to assistive technology
 *   users navigating by landmark.
 * @implementation-notes
 * - Not WCAG-normative — authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent and the landmark-
 *   detection model (HTML-AAM implicit-role mapping + explicit role
 *   override).
 * - Flags every element within a colliding-name cluster (two or more
 *   same-role landmarks sharing one normalized name), not just the
 *   "extra" ones.
 */

const id = 'landmark-unique';

const meta = {
  title: 'Landmarks with the same role must have unique names',
  description: 'Checks that when two or more landmarks share the same role, each has a distinct accessible name.',
  i18n: {
    titleKey: 'landmarkUnique_title',
    descriptionKey: 'landmarkUnique_description'
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

  // Delegates to the shared helpers.hasLandmarkScopingAncestor (role-aware:
  // an ancestor's bare TAG only counts when it carries no role attribute at
  // all; an explicit role="dialog"-style override no longer suppresses —
  // see that function's header comment in src/core/aria-helpers.js) rather
  // than the two local tag-only Sets this file used to carry. Two distinct
  // ancestor scopes, verified 2026-07-20 against a widely-used reference
  // engine's own implicit-role functions directly rather than assumed from
  // one shared list: <header>/<footer> use "sectioning content PLUS <main>"
  // (includeMain: true) to decide banner/contentinfo suppression, but
  // <aside> uses PLAIN sectioning content only — NOT main (includeMain:
  // false) — to decide complementary suppression. The old single
  // SECTIONING_ANCESTORS set (which included 'main') was correct for
  // header/footer but wrong for aside — found via a real page: Know Your
  // Meme's two unnamed <aside class="extra-large-only"> elements are direct
  // children of <main>, which incorrectly suppressed their implicit
  // "complementary" role entirely, hiding a real duplicate-landmark
  // violation that reference engine correctly flags. The tag-only
  // (non-role-aware) half of this bug was separately found and fixed
  // 2026-07-30 via the cross-engine comparisons project, on
  // handsontable.com's docs-assistant side panel: an <aside role="dialog">
  // containing its own <header> — role="dialog" isn't one of the four
  // scoping roles, so the nested <header> keeps "banner" per spec, but a
  // tag-only check unconditionally suppressed it just because the ancestor
  // TAG was <aside>.
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
      // Per a widely-used reference engine's own `aside` implicit-role function: suppressed by a
      // sectioning-content ancestor ONLY when the <aside> also has no
      // accessible name — a named <aside> is never suppressed, even when
      // nested.
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
    if (explicit) {
      if (!LANDMARK_ROLES.has(explicit)) return '';
      // <form>/<section> only count as landmarks when they have an
      // accessible name — a property of the ELEMENT, not of how the role
      // got there. This applies whether the role is implicit (already
      // handled in getImplicitLandmarkRole below) or explicit, but an
      // explicit role bypassed the check entirely before this fix. Verified
      // against a widely-used reference engine's isLandmarkVirtual (checks
      // nodeName === 'section' || 'form' unconditionally, regardless of role source) and the W3C
      // ARIA-in-HTML spec ("a form is not exposed as a landmark region
      // unless it has been provided an accessible name"). Found via a real
      // page: europa.eu's unnamed <form role="search"> nested inside an
      // unnamed <div role="search"> was wrongly counted as a second
      // distinct "search" landmark.
      const tag = el.tagName ? el.tagName.toLowerCase() : '';
      if (tag === 'form' || tag === 'section') {
        return getAccessibleLandmarkName(el) ? explicit : '';
      }
      return explicit;
    }
    return getImplicitLandmarkRole(el);
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

  // queryAllSmart (shadow-DOM-aware, includeShadowDom defaults true) instead of a plain
  // document.querySelectorAll -- a real page (Airtable's homepage, 2026-07-23) has a
  // third-party Transcend cookie-consent widget rendering its own unnamed <nav>/<footer>
  // inside a shadow root (#transcend-shadow-root), which a widely-used reference engine's
  // own landmark-unique (a real browser DOM, shadow roots included by design) correctly sees as colliding
  // with the page's own unnamed header <nav>/page <footer> -- a real, confirmed surea11y
  // false-negative miss, invisible to plain querySelectorAll's light-DOM-only reach.
  let nodes = [];
  try {
    nodes = helpers && typeof helpers.queryAllSmart === 'function'
      ? helpers.queryAllSmart('header, footer, main, nav, aside, section, form, [role]')
      : document.querySelectorAll('header, footer, main, nav, aside, section, form, [role]');
  } catch {
    nodes = [];
  }

  // Only landmarks actually exposed to assistive technology can collide —
  // matches a widely-used reference engine's own `landmarkUniqueMatches` gate
  // (`_isVisibleToScreenReaders`), confirmed by reading its source
  // directly. Without this, responsive layouts that render both a
  // desktop and a mobile copy of the same named nav (one hidden via CSS
  // at any given viewport — found on real sites: BuzzFeed, Kraken,
  // weather.com) were wrongly flagged as duplicate landmarks, since the
  // hidden copy is never actually reachable by AT and can't really
  // collide with the visible one.
  const byRole = new Map(); // role -> [{el, name}]
  const seen = new Set();
  for (const el of nodes) {
    if (!el || seen.has(el)) continue;
    seen.add(el);
    if (!isExposedToAt(el)) continue;
    const role = getLandmarkRole(el);
    if (!role) continue;
    const list = byRole.get(role) || [];
    list.push({ el, name: getAccessibleLandmarkName(el) });
    byRole.set(role, list);
  }

  const occurrences = [];

  for (const [role, entries] of byRole) {
    if (entries.length <= 1) continue;

    const byName = new Map(); // normalized name -> entries[]
    for (const entry of entries) {
      const key = entry.name.toLowerCase();
      const list = byName.get(key) || [];
      list.push(entry);
      byName.set(key, list);
    }

    for (const [normalizedName, group] of byName) {
      if (group.length <= 1) continue;

      for (const { el } of group) {
        const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
        const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

        occurrences.push({
          selector: stableSelector,
          html,
          summary: normalizedName
              ? `This ${role} landmark shares its accessible name with another ${role} landmark.`
              : `This ${role} landmark has no accessible name, and more than one unnamed ${role} landmark exists on this page.`,
          hint: `Give each ${role} landmark a distinct name via aria-label or aria-labelledby.`,
          i18n: {
            summaryKey: normalizedName
                ? 'landmarkUnique_summary_cantTell_duplicateName'
                : 'landmarkUnique_summary_cantTell_bothUnnamed',
            hintKey: 'landmarkUnique_hint_cantTell',
            params: { role }
          },
          data: {
            details: { reasonCode: 'LANDMARK_NOT_UNIQUE', role, name: normalizedName, groupSize: group.length }
          }
        });
      }
    }
  }

  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return { ruleId: rule.ruleId, outcome: 'cantTell', severity: rule.defaultSeverity || 'minor', occurrences };
}

module.exports = { id, meta, runInPage };
