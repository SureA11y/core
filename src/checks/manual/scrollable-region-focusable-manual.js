'use strict';

/**
 * @check scrollable-region-focusable
 * @atomic true
 * @summary A scrollable region with no focusable content should itself be keyboard-focusable
 * @standard WCAG 2.2
 * @sc 2.1.1, 2.1.3
 * @applicability
 *   Deliberately scoped to a fixed set of likely-to-scroll container tags
 *   (div, section, article, aside, main, nav, pre, table, blockquote, ul,
 *   ol, textarea) with computed `overflow-x`/`overflow-y` of `auto` or
 *   `scroll` — not every element on the page, to keep this deterministic
 *   and performant (same style of scope-down as `region`).
 * @expectation
 *   A region whose CSS declares it may scroll (`auto`/`scroll`) should be
 *   reachable by keyboard: either it already contains a focusable
 *   descendant (a link, button, form control, or `tabindex`-bearing
 *   element a keyboard user could tab into and then use arrow keys to
 *   scroll from), or the region itself carries a non-negative `tabindex`.
 * @implementation-notes
 * - jsdom does not perform layout, so `scrollHeight`/`clientHeight` are
 *   not available to confirm the region's content actually overflows —
 *   only that the CSS declares it *may*. Many elements declare
 *   `overflow: auto` defensively without their content ever actually
 *   overflowing, which would be a false positive if treated as a hard
 *   `fail`. For that reason this is authored as `type: 'manual'`
 *   (cantTell-capped, never fail) rather than `automatic` — same class of
 *   layout-dependent gap as `iframe-focusable-content`'s
 *   `contentDocument` limitation.
 * - "Has a focusable descendant" is a presence check (link/button/form
 *   control/`[tabindex]`/`iframe`/`[contenteditable]`), not a full
 *   focusability computation (disabled state, visibility, etc.) — a
 *   deliberate simplification to keep this rule self-contained and fast.
 */

const id = 'scrollable-region-focusable';

const meta = {
  title: 'Scrollable regions with no focusable content should be keyboard-focusable',
  description:
    'Flags elements whose CSS declares overflow:auto/scroll, contain no focusable descendant, and are not themselves keyboard-focusable, for manual review of whether their content actually overflows and needs keyboard scroll access.',
  i18n: {
    titleKey: 'scrollableRegionFocusable_title',
    descriptionKey: 'scrollableRegionFocusable_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag2aaa', 'wcag211', 'wcag213', 'structure', 'atomic', 'manual'],
  wcagSc: ['2.1.1', '2.1.3'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '2.1.1',
      title: 'Keyboard',
      conformanceLevel: 'A'
    },
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '2.1.3',
      title: 'Keyboard (No Exception)',
      conformanceLevel: 'AAA'
    }
  ],
  defaultSeverity: 'moderate',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'low',
  coverage: {
    facetsBySc: {
      '2.1.1': ['scrollable-region-focusable-evidence'],
      '2.1.3': ['scrollable-region-focusable-evidence']
    }
  }
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  function safeComputedStyle(el) {
    try {
      if (!el || el.nodeType !== 1) return null;
      if (helpers && typeof helpers.computedStyle === 'function') {
        const cs = helpers.computedStyle(el);
        if (cs) return cs;
      }
      const view =
        el.ownerDocument && el.ownerDocument.defaultView ? el.ownerDocument.defaultView : null;
      if (view && typeof view.getComputedStyle === 'function') return view.getComputedStyle(el);
    } catch {}
    return null;
  }

  function isScrollableOverflow(cs) {
    if (!cs) return false;
    const x = String(cs.overflowX || '')
      .trim()
      .toLowerCase();
    const y = String(cs.overflowY || '')
      .trim()
      .toLowerCase();
    return x === 'auto' || x === 'scroll' || y === 'auto' || y === 'scroll';
  }

  function isSelfFocusable(el) {
    try {
      const tabindexAttr = el.getAttribute ? el.getAttribute('tabindex') : null;
      if (tabindexAttr != null) {
        const n = Number.parseInt(tabindexAttr, 10);
        if (Number.isFinite(n) && n >= 0) return true;
      }
    } catch {}
    return false;
  }

  const FOCUSABLE_DESCENDANT_SELECTOR =
    'a[href], button, input, select, textarea, [tabindex], iframe, [contenteditable]:not([contenteditable="false"])';

  function hasFocusableDescendant(el) {
    try {
      return !!(el.querySelector && el.querySelector(FOCUSABLE_DESCENDANT_SELECTOR));
    } catch {
      return false;
    }
  }

  const CANDIDATE_SELECTOR =
    'div, section, article, aside, main, nav, pre, table, blockquote, ul, ol, textarea';
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(CANDIDATE_SELECTOR)
    : helpers.queryAll(CANDIDATE_SELECTOR);

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;

    const cs = safeComputedStyle(el);
    if (!isScrollableOverflow(cs)) continue;

    applicableCount += 1;

    if (isSelfFocusable(el)) continue;
    if (hasFocusableDescendant(el)) continue;

    const tag = (el.tagName || '').toLowerCase();
    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : el.outerHTML || '';

    const baseOccurrence = {
      selector: stableSelector,
      html,
      summary:
        'This element declares overflow:auto/scroll, has no focusable descendant, and is not itself keyboard-focusable.',
      hint: 'If this region’s content actually overflows, add tabindex="0" (and a suitable label) so keyboard users can focus it and scroll with the arrow keys.',
      i18n: {
        summaryKey: 'scrollableRegionFocusable_summary_cantTell',
        hintKey: 'scrollableRegionFocusable_hint_cantTell',
        params: { element: tag }
      },
      data: {
        details: { reasonCode: 'SCROLLABLE_OVERFLOW_NOT_FOCUSABLE', element: tag }
      }
    };

    if (helpers && typeof helpers.reportOccurrence === 'function') {
      occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
    } else {
      occurrences.push(baseOccurrence);
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'moderate',
      occurrences
    };
  }

  // Manual rules may only emit cantTell/notApplicable (never pass/fail):
  // every scrollable-overflow candidate is already reachable by keyboard.
  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
