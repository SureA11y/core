'use strict';

/**
 * @rule a11ycore-video-poster-text-alternative-present
 * @atomic true
 * @summary Accessible <video> elements with a poster must provide a text alternative
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @applicability
 *   Applies to <video> elements that:
 *   1) have a non-empty poster attribute, AND
 *   2) are exposed to assistive technologies (per engine eligibility rules).
 *   Elements otherwise hidden from the accessibility tree remain applicable
 *   if they are tabbable or referenced by IDREF relationships (per eligibility rules).
 *   Videos with role="presentation" or role="none" are excluded only when they are not focusable.
 * @expectation
 *   Each applicable <video> element provides a text alternative for the poster image, via:
 *   - an accessible name (aria-label / aria-labelledby / title), OR
 *   - meaningful fallback text inside the <video> element.
 */

const id = 'a11ycore-video-poster-text-alternative-present';

const meta = {
  title: '<video> poster must have a text alternative',
  description:
    'Checks that <video> elements with a poster image provide a text alternative (accessible name or fallback text).',
  i18n: {
    titleKey: 'a11ycore_videoPoster_textAltPresent_title',
    descriptionKey: 'a11ycore_videoPoster_textAltPresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag111', 'media', 'video', 'atomic', 'automatic'],
  wcagSc: ['1.1.1'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '1.1.1', title: 'Non-text Content', conformanceLevel: 'A' }
  ],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'medium',
  coverage: {
    facetsBySc: {
      '1.1.1': ['video-poster-text-alt-present']
    }
  }
};

function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const queryAllSmart = helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
  const queryAll = helpers && typeof helpers.queryAll === 'function'
    ? helpers.queryAll
    : (sel) => {
        try { return safeRoot && safeRoot.querySelectorAll ? Array.from(safeRoot.querySelectorAll(sel)) : []; }
        catch { return []; }
      };

  const buildSelector = helpers && typeof helpers.buildSelector === 'function'
    ? helpers.buildSelector
    : (el) => {
        try {
          if (!el || !el.tagName) return 'html';
          const tag = (el.tagName || 'html').toLowerCase();
          return el.id ? `${tag}#${el.id}` : tag;
        } catch { return 'html'; }
      };

  const getOuterHtmlSnippet = helpers && typeof helpers.getOuterHtmlSnippet === 'function'
    ? helpers.getOuterHtmlSnippet
    : (el) => { try { return (el && el.outerHTML) ? String(el.outerHTML).slice(0, 2000) : ''; } catch { return ''; } };

  const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function'
    ? helpers.getEligibilityInfo
    : null;

  const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function'
    ? helpers.isAccTreeEligible
    : null;

  const isFocusableInfo = helpers && typeof helpers.getFocusableInfo === 'function'
    ? helpers.getFocusableInfo
    : null;

  const getAccessibleNameInfo = helpers && typeof helpers.getAccessibleNameInfo === 'function'
    ? helpers.getAccessibleNameInfo
    : null;

  function trim(v) { return (v == null ? '' : String(v)).trim(); }

  function hasMeaningfulFallbackText(el) {
    try {
      // Best-effort: textContent is deterministic and usually excludes <source>/<track> anyway.
      const t = trim(el && el.textContent);
      return !!t;
    } catch {
      return false;
    }
  }

  const videos = (() => {
    try { return Array.from((queryAllSmart ? queryAllSmart('video') : queryAll('video')) || []); }
    catch { return queryAll('video'); }
  })();

  if (!videos.length) return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };

  const occurrences = [];
  let applicableCount = 0;

  for (const el of videos) {
    if (!el || !el.getAttribute) continue;

    const poster = trim(el.getAttribute('poster'));
    if (!poster) continue; // not applicable: no poster image

    // Eligibility: only elements exposed to AT (with helper exceptions)
    if (isAccTreeEligible) {
      const elig = (() => {
        try { return isAccTreeEligible(el, ctx); } catch { return { eligible: true, reasons: [] }; }
      })();
      if (elig && elig.eligible === false) continue;
    }

    // Role presentation/none excluded ONLY if not focusable (mirrors img behavior)
    const role = trim(el.getAttribute('role')).toLowerCase();
    if (role === 'presentation' || role === 'none') {
      let focusable = false;
      if (isFocusableInfo) {
        const fi = (() => { try { return isFocusableInfo(el, ctx); } catch { return null; } })();
        focusable = !!(fi && fi.focusable);
      } else {
        const tabindex = el.getAttribute('tabindex');
        focusable = tabindex != null && trim(tabindex) !== '' && !Number.isNaN(Number(trim(tabindex)));
      }
      if (!focusable) continue;
    }

    applicableCount += 1;

    const hasFallback = hasMeaningfulFallbackText(el);
    const nameInfo = getAccessibleNameInfo ? (() => { try { return getAccessibleNameInfo(el, ctx); } catch { return null; } })() : null;
    const hasName = !!(nameInfo && nameInfo.present && trim(nameInfo.value));

    if (hasFallback || hasName) continue;

    const selector = (() => { try { return buildSelector(el); } catch { return 'html'; } })();
    const html = getOuterHtmlSnippet(el);
    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

    occurrences.push({
      selector,
      html,
      summary: 'Missing text alternative for <video> poster.',
      hint: 'Provide an accessible name (e.g., aria-label/aria-labelledby) or meaningful fallback text inside <video>.',
      i18n: {
        summaryKey: 'a11ycore_videoPoster_textAltPresent_summary_fail',
        hintKey: 'a11ycore_videoPoster_textAltPresent_hint_fail',
        params: { element: 'video' }
      },
      data: {
        poster,
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
      }
    });
  }

  if (applicableCount === 0) return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  if (!occurrences.length) return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'minor', occurrences };
}

module.exports = { id, meta, runInPage };
