/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check scrollable-region-focusable
 * @atomic true
 * @summary A scrollable region with no focusable content should itself be keyboard-focusable
 * @standard WCAG 2.2
 * @sc 2.1.1, 2.1.3
 * @applicability
 *   Scoped on purpose to a fixed set of likely-to-scroll container tags
 *   (div, section, article, aside, main, nav, pre, table, blockquote, ul,
 *   ol, textarea) with computed `overflow-x`/`overflow-y` of `auto` or
 *   `scroll`, not every element on the page, to keep this deterministic
 *   and performant (same style of scope-down as `region`).
 *   Finding nothing to ask about, it reports notApplicable, not pass: it
 *   applies only to what its check flags, and finding nothing there
 *   doesn't show that all is well (RULE_TAXONOMY.md, manual rules).
 * @expectation
 *   A region whose CSS declares it may scroll (`auto`/`scroll`) should be
 *   reachable by keyboard: either it already contains a descendant in the
 *   sequential tab order (a link, button, form control, or element with a
 *   non-negative `tabindex` that a keyboard user could tab into and then
 *   use arrow keys to scroll from; one with `tabindex="-1"`, a disabled or
 *   `type="hidden"` control, or one the page hides does not count), or the
 *   region itself is reached by Tab: a non-negative `tabindex`, or
 *   natively, as a `<textarea>` or an editable region is.
 *   A disabled `<textarea>` is left out, as a disabled field need not be
 *   operable.
 * @reason-codes
 *   - `SCROLLABLE_OVERFLOW_NOT_FOCUSABLE` (cantTell): the element's CSS lets
 *     it scroll, but neither it nor anything inside it can be reached by
 *     keyboard; whether its content really overflows is for a person to
 *     check.
 *     Where the page is laid out, it leans fail when the content overflows
 *     the box by more than 2px and pass when it fits; in jsdom, no lean.
 *     Basis: WCAG 2.1.1 (not settled); WCAG 2.1.3 (not settled);
 *     ACT 0ssw9k.
 * @implementation-notes
 * - jsdom does not perform layout, so `scrollHeight`/`clientHeight` are
 *   not available to confirm the region's content actually overflows,
 *   only that the CSS declares it *may*. Many elements declare
 *   `overflow: auto` defensively without their content ever actually
 *   overflowing, which would be a false positive if treated as a hard
 *   `fail`. For that reason this is authored as `type: 'manual'`
 *   (cantTell-capped, never fail) rather than `automatic`, the same class
 *   of layout-dependent gap as `iframe-focusable-content`'s
 *   `contentDocument` limitation.
 * - "Has a focusable descendant" counts only descendants in the
 *   sequential tab order (ACT 0ssw9k): a link, button, form control,
 *   `[tabindex]`, `iframe`, `<summary>`, media with `controls` or editable
 *   region that `helpers.getFocusableInfo` reports `tabbable` (so not
 *   `tabindex="-1"`, not disabled, not `<input type="hidden">`, not inert)
 *   and the page does not hide.
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
  },
  // How a person checks each undecided finding: shown with it as
  // howToCheck (docs/OUTPUT_SCHEMA.md).
  review: {
    SCROLLABLE_OVERFLOW_NOT_FOCUSABLE: {
      steps: [
        'Find the element the report names and check, at the sizes the page is used at, whether its content overflows (a scrollbar appears or content is cut off).',
        'If it does not overflow, it passes.',
        'If it does, click just before it and press Tab until focus reaches it.',
        'With focus on it, press the arrow keys, Page Down and Space, and check that the content scrolls.'
      ],
      passWhen:
        'The element does not overflow, or it can be reached with Tab and scrolled with the keyboard.',
      failWhen:
        'Hidden content inside the element can only be scrolled with a mouse or touch, which fails WCAG 2.1.1.'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  function safeComputedStyle(el) {
    try {
      if (!el || dom.nodeType(el) !== 1) return null;
      if (helpers && typeof helpers.computedStyle === 'function') {
        const cs = helpers.computedStyle(el);
        if (cs) return cs;
      }
      const view =
        dom.ownerDocument(el) && dom.defaultView(dom.ownerDocument(el))
          ? dom.defaultView(dom.ownerDocument(el))
          : null;
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

  // Reached by Tab itself: a tabindex of 0 or more, or natively, as a
  // <textarea> or an editable region is (browsers give a textarea
  // overflow: auto).
  function isSelfFocusable(el) {
    try {
      const info = helpers.getFocusableInfo ? helpers.getFocusableInfo(el, ctx) : null;
      if (info && info.tabbable) return true;
    } catch {}
    try {
      const tabindexAttr = dom.get(el, 'getAttribute') ? dom.getAttribute(el, 'tabindex') : null;
      if (tabindexAttr != null) {
        const n = Number.parseInt(tabindexAttr, 10);
        if (Number.isFinite(n) && n >= 0) return true;
      }
    } catch {}
    return false;
  }

  const FOCUSABLE_DESCENDANT_SELECTOR =
    'a[href], button, input, select, textarea, [tabindex], iframe, summary, audio[controls], video[controls], [contenteditable]:not([contenteditable="false"])';

  // Only a descendant in the sequential tab order counts (ACT 0ssw9k): not
  // tabindex="-1", a disabled control, <input type="hidden"> or an inert
  // one. A descendant the page does not show (display:none, a closed
  // <details>, hidden="until-found") takes no focus either.
  function isTabbableDescendant(d) {
    if (!helpers.getFocusableInfo) return true;
    try {
      const info = helpers.getFocusableInfo(d, ctx);
      return !!(info && info.tabbable);
    } catch {
      return false;
    }
  }

  function hasFocusableDescendant(el) {
    try {
      if (!dom.get(el, 'querySelectorAll')) return false;
      for (const d of dom.querySelectorAll(el, FOCUSABLE_DESCENDANT_SELECTOR)) {
        if (!isTabbableDescendant(d)) continue;
        if (!(helpers.isHiddenContent && helpers.isHiddenContent(d))) return true;
      }
    } catch {}
    return false;
  }

  const CANDIDATE_SELECTOR =
    'div, section, article, aside, main, nav, pre, table, blockquote, ul, ol, textarea';
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(CANDIDATE_SELECTOR)
    : helpers.queryAll(CANDIDATE_SELECTOR);

  // Overflow can be measured only where the page is laid out (not in jsdom,
  // where every box measures 0).
  function hasReliableGeometry() {
    const probe = dom.documentElement(document) || dom.body(document) || null;
    if (!probe || !dom.get(probe, 'getBoundingClientRect')) return false;
    try {
      const r = dom.getBoundingClientRect(probe);
      return (
        !!r &&
        ((Number.isFinite(r.width) && r.width > 0) || (Number.isFinite(r.height) && r.height > 0))
      );
    } catch {
      return false;
    }
  }
  const geometry = hasReliableGeometry();

  // How far the content overflows the box on the axes the CSS lets scroll,
  // in px, or null where it can't be measured.
  function measuredOverflow(el, cs) {
    if (!geometry) return null;
    try {
      const sx = /^(auto|scroll)$/.test(String(cs.overflowX || ''));
      const sy = /^(auto|scroll)$/.test(String(cs.overflowY || ''));
      const dx = sx ? Number(dom.get(el, 'scrollWidth')) - Number(dom.get(el, 'clientWidth')) : 0;
      const dy = sy ? Number(dom.get(el, 'scrollHeight')) - Number(dom.get(el, 'clientHeight')) : 0;
      if (!Number.isFinite(dx) || !Number.isFinite(dy)) return null;
      return Math.max(dx, dy, 0);
    } catch {
      return null;
    }
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;

    const cs = safeComputedStyle(el);
    if (!isScrollableOverflow(cs)) continue;
    // A disabled field need not be operable.
    try {
      if (dom.matches(el, 'textarea:disabled')) continue;
    } catch {}

    applicableCount += 1;

    if (isSelfFocusable(el)) continue;
    if (hasFocusableDescendant(el)) continue;

    const tag = (dom.tagName(el) || '').toLowerCase();
    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet
      ? helpers.getOuterHtmlSnippet(el)
      : dom.outerHTML(el) || '';

    const baseOccurrence = {
      selector: stableSelector,
      html,
      summary:
        'This element can scroll (overflow: auto or scroll), but neither it nor anything inside it can take keyboard focus.',
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

    // Where the box is laid out, whether its content overflows now points
    // one way: a box with nothing to scroll needs no keyboard scrolling.
    const overflow = measuredOverflow(el, cs);
    if (overflow != null) {
      baseOccurrence.lean =
        overflow > 2
          ? {
              toward: 'fail',
              why: 'Its content overflows the box, and nothing in it can take keyboard focus to scroll it.',
              signals: [{ signal: 'overflow-px', value: Math.round(overflow) }],
              caution:
                'Chromium 130 and later, and Firefox, let keyboard users reach a scrolling box anyway; Safari does not.',
              i18n: {
                whyKey: 'scrollableRegionFocusable_lean_why_overflows',
                cautionKey: 'scrollableRegionFocusable_lean_caution_overflows'
              }
            }
          : {
              toward: 'pass',
              why: 'Its content fits the box, so there is nothing to scroll.',
              signals: [{ signal: 'overflow-px', value: Math.round(overflow) }],
              caution: 'Content loaded later, or a narrower window, can make it overflow.',
              i18n: {
                whyKey: 'scrollableRegionFocusable_lean_why_fits',
                cautionKey: 'scrollableRegionFocusable_lean_caution_fits'
              }
            };
    }

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

  // Every scrollable-overflow candidate is reachable by keyboard: it is in
  // the tab order, or something inside it is. Not a pass: a manual rule that
  // finds nothing to ask about says notApplicable (RULE_TAXONOMY.md), and a
  // tab stop inside the region does not show that all its content can be
  // scrolled into view from there.
  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
