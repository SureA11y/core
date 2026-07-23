'use strict';

/**
 * @check a11ycore-region
 * @atomic true
 * @summary Page content should be contained within a landmark region
 * @standard the reference engine "Best Practices" (no formal WCAG Success Criterion — see ROADMAP.md Tier 1b)
 * @applicability
 *   Applies to direct children of <body> that carry visible text content
 *   and are not themselves a landmark.
 * @expectation
 *   Every top-level piece of page content lives inside a landmark region
 *   (main, navigation, banner, contentinfo, complementary, region, form,
 *   search), so assistive technology users navigating by landmark do not
 *   miss content that was never placed inside one.
 * @implementation-notes
 * - Not WCAG-normative — authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see a11ycore-landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent and the landmark-
 *   detection model.
 * - Deliberately scoped to DIRECT children of <body> only (not a full
 *   recursive scan of every text node on the page) — the reference engine's own
 *   region rule is known to be noisy in practice when applied
 *   unconditionally; checking only the top level keeps false positives
 *   low while still catching the common case (a page section authored
 *   entirely outside any landmark).
 */

const id = 'a11ycore-region';

const meta = {
  title: 'Page content should be inside a landmark region',
  description: 'Checks that direct children of <body> with visible text content are contained within a landmark region.',
  i18n: {
    titleKey: 'a11ycore_region_title',
    descriptionKey: 'a11ycore_region_description'
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

  const body = document && document.body ? document.body : null;
  if (!body) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

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

  function isLandmark(el) {
    if (!el || !el.getAttribute) return false;
    const explicit = getExplicitRoleToken(el);
    if (explicit) return LANDMARK_ROLES.has(explicit);
    return !!getImplicitLandmarkRole(el);
  }

  const SKIP_TAGS = new Set(['script', 'style', 'template', 'noscript', 'link', 'meta', 'title']);

  function isIneligible(el) {
    if (el.getAttribute && el.getAttribute('aria-hidden') === 'true') return true;
    if (el.hasAttribute && el.hasAttribute('hidden')) return true;
    return false;
  }

  function getConservativeSubtreeText(container) {
    const SHOW_TEXT = 4;
    try {
      const walker = document.createTreeWalker(container, SHOW_TEXT, null);
      const parts = [];
      let n = walker.nextNode();
      while (n) {
        const raw = normalizeWs(n.nodeValue || '');
        if (raw) parts.push(raw);
        n = walker.nextNode();
      }
      return normalizeWs(parts.join(' '));
    } catch {
      return normalizeWs(container.textContent);
    }
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const el of body.children || []) {
    if (!el || !el.tagName) continue;
    const tag = el.tagName.toLowerCase();
    if (SKIP_TAGS.has(tag)) continue;
    if (isIneligible(el)) continue;
    if (isLandmark(el)) continue;

    const text = getConservativeSubtreeText(el);
    if (!text) continue;

    applicableCount += 1;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    occurrences.push({
      selector: stableSelector,
      html,
      summary: 'This content is not contained within a landmark region.',
      hint: 'Move this content inside a landmark region (main, nav, aside, a labeled section, etc.).',
      i18n: {
        summaryKey: 'a11ycore_region_summary_cantTell',
        hintKey: 'a11ycore_region_hint_cantTell',
        params: { element: tag }
      },
      data: {
        details: { reasonCode: 'CONTENT_OUTSIDE_LANDMARK', element: tag }
      }
    });
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'cantTell', severity: rule.defaultSeverity || 'minor', occurrences };
  }
  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
