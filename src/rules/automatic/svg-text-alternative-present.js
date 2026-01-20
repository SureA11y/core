'use strict';

/**
 * @rule a11ycore-svg-text-alternative-present
 * @atomic true
 * @summary Accessible <svg> elements must provide a text alternative
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @applicability
 *   Applies to inline <svg> elements that are exposed to assistive technologies AND appear intended to be conveyed.
 *   "Intended to be conveyed" is approximated deterministically by at least one of:
 *     - role="img"
 *     - aria-label / aria-labelledby present
 *     - <title> or <desc> present
 *     - focusable/tabbable (e.g., tabindex, native focusability)
 *
 *   Images with role="presentation" or role="none" are excluded only when they are not focusable.
 *   Elements otherwise hidden from the accessibility tree remain applicable
 *   if they are tabbable-focusable or referenced by IDREF relationships (per engine eligibility rules).
 * @expectation
 *   Each applicable <svg> element provides a text alternative via:
 *     - non-empty <title> or <desc> text, OR
 *     - an ARIA name (aria-label / aria-labelledby).
 */

const id = 'a11ycore-svg-text-alternative-present';

const meta = {
  title: '<svg> must provide a text alternative',
  description: 'Checks that inline <svg> elements provide a text alternative via <title>/<desc> or an ARIA name.',
  i18n: {
    titleKey: 'a11ycore_svg_textAltPresent_title',
    descriptionKey: 'a11ycore_svg_textAltPresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag111', 'svg', 'nontext', 'images', 'atomic', 'automatic'],
  wcagSc: ['1.1.1'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '1.1.1', title: 'Non-text Content', conformanceLevel: 'A' }
  ],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {
    facetsBySc: {
      '1.1.1': ['svg-text-alternative-present']
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

  const getFocusableInfo = helpers && typeof helpers.getFocusableInfo === 'function'
    ? helpers.getFocusableInfo
    : null;

  const getAriaNameInfo = helpers && typeof helpers.getAriaNameInfo === 'function'
    ? helpers.getAriaNameInfo
    : null;

  function trim(v) {
    try { return (v == null ? '' : String(v)).trim(); } catch { return ''; }
  }

  function hasNonEmptyTitleOrDesc(svg) {
    try {
      if (!svg || !svg.querySelector) return false;
      const t = svg.querySelector('title');
      if (t) {
        const txt = trim(t.textContent);
        if (txt) return true;
      }
      const d = svg.querySelector('desc');
      if (d) {
        const txt = trim(d.textContent);
        if (txt) return true;
      }
    } catch {}
    return false;
  }

  function hasAriaName(svg) {
    if (!getAriaNameInfo) return false;
    const info = (() => { try { return getAriaNameInfo(svg, ctx); } catch { return null; } })();
    return !!(info && info.present && trim(info.value));
  }

  function isFocusable(svg) {
    if (getFocusableInfo) {
      const fi = (() => { try { return getFocusableInfo(svg, ctx); } catch { return null; } })();
      return !!(fi && fi.focusable);
    }
    // deterministic fallback: tabindex presence/valid number
    try {
      const tabindex = svg && svg.getAttribute ? svg.getAttribute('tabindex') : null;
      return tabindex != null && String(tabindex).trim() !== '' && !Number.isNaN(Number(String(tabindex).trim()));
    } catch {
      return false;
    }
  }

  function hasIntentSignal(svg) {
    // Deterministic "intended to be conveyed" approximation.
    // (Prevents flagging decorative inline SVGs that are not exposed as images.)
    const role = (() => {
      try { return String(svg.getAttribute('role') || '').trim().toLowerCase(); }
      catch { return ''; }
    })();

    if (role === 'img') return true;

    // ARIA naming attributes present (even if empty) signals intent; empty values will still fail.
    try {
      if (svg.getAttribute('aria-label') != null) return true;
      if (svg.getAttribute('aria-labelledby') != null) return true;
    } catch {}

    if (hasNonEmptyTitleOrDesc(svg)) return true;
    if (isFocusable(svg)) return true;

    return false;
  }

  const svgs = (() => {
    try { return Array.from((queryAllSmart ? queryAllSmart('svg') : queryAll('svg')) || []); }
    catch { return queryAll('svg'); }
  })();

  if (!svgs.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const el of svgs) {
    if (!el || !el.getAttribute) continue;

    // Applicability step 1: only acc-tree eligible nodes (with helper exceptions)
    if (isAccTreeEligible) {
      const elig = (() => {
        try { return isAccTreeEligible(el, ctx); } catch { return { eligible: true, reasons: [] }; }
      })();
      if (elig && elig.eligible === false) continue;
    }

    // Applicability step 2: role (presentation/none) exclusion only when not focusable
    const role = (() => {
      try { return String(el.getAttribute('role') || '').trim().toLowerCase(); }
      catch { return ''; }
    })();

    if (role === 'presentation' || role === 'none') {
      if (!isFocusable(el)) continue;
    }

    // Applicability step 3: intent signal gating
    if (!hasIntentSignal(el)) continue;

    applicableCount += 1;

    const ok = hasNonEmptyTitleOrDesc(el) || hasAriaName(el);
    if (ok) continue;

    const selector = (() => { try { return buildSelector(el); } catch { return 'html'; } })();
    const html = getOuterHtmlSnippet(el);
    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

    occurrences.push({
      selector,
      html,
      summary: 'Missing text alternative for <svg>.',
      hint: 'Provide a <title> or <desc> element with text, or an ARIA name (aria-label/aria-labelledby).',
      i18n: {
        summaryKey: 'a11ycore_svg_textAltPresent_summary_fail',
        hintKey: 'a11ycore_svg_textAltPresent_hint_fail',
        params: { element: 'svg' }
      },
      data: {
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
      }
    });
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }

  return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'minor', occurrences };
}

module.exports = { id, meta, runInPage };
