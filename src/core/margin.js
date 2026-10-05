/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Margins: how close a rule's closest measurement came to its threshold while
 * still meeting it. A rule that measures against a threshold (a contrast
 * ratio, a size, an overflow) declares what it measures in `meta.margin` and
 * hands the runner the elements that met the limit as `marginCandidates`;
 * the runner picks the closest and reports it as the check result's `margin`.
 * A margin is never a finding: it does not change the outcome or the
 * occurrences. See docs/OUTPUT_SCHEMA.md and docs/RULE_AUTHORING.md.
 *
 * Inlined into generated core.js (scripts/build-core.js), so every function
 * here is self-contained: no references to anything outside its own body
 * except the constants below, which are emitted alongside.
 */

// The units a margin is reported in. Pixels keep one decimal (CSS pixels are
// fractional, and so are thresholds such as half a 15px font); a ratio stays
// as the rule compared it, since WCAG does not round contrast.
const MARGIN_UNITS = Object.freeze(['px', 'ratio']);

// 'min': the value must reach the threshold (contrast, size).
// 'max': the value must stay under it (overflow).
const MARGIN_LIMITS = Object.freeze(['min', 'max']);

// A rule's meta.margin is checked in normalizeRuleMeta (src/core/rule-meta.js),
// which must stay free of outside references and so spells these two lists
// out itself; tests/core/margin.test.js holds the two in step.

// The closest candidate as the result's `margin`, or null when there is none.
// A candidate is { el, value, threshold, context? }: an element that met the
// limit, its measurement and the threshold it was judged against. One that did
// not meet the limit, or has no finite numbers, is skipped. The closest is the
// smallest headroom; a tie goes to the element first in document order, so the
// same page always gives the same margin.
function resolveMargin(declaration, candidates, measuredCount, helpers, options) {
  if (!declaration || !Array.isArray(candidates) || !candidates.length) return null;
  const isMin = declaration.limit === 'min';

  // Collect every candidate tied at the smallest headroom first, and settle
  // the tie once at the end. Comparing each tie against the current best in
  // the loop was quadratic: on a page where most text shares a colour every
  // candidate ties, and in Blink each compareDocumentPosition walks the
  // siblings between the two elements.
  let ties = [];
  let smallest = Infinity;
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    if (!c || typeof c !== 'object') continue;
    const value = Number(c.value);
    const threshold = Number(c.threshold);
    if (!Number.isFinite(value) || !Number.isFinite(threshold)) continue;
    const headroom = isMin ? value - threshold : threshold - value;
    if (!(headroom >= 0)) continue;
    if (headroom < smallest) {
      smallest = headroom;
      ties = [];
    }
    if (headroom === smallest) {
      ties.push({ el: c.el || null, value, threshold, headroom, context: c.context });
    }
  }
  if (!ties.length) return null;

  const position = (a, b) => {
    try {
      return typeof a.compareDocumentPosition === 'function' ? a.compareDocumentPosition(b) : 0;
    } catch {
      return 0;
    }
  };
  // A tie with no element keeps its place; one after it never replaces it.
  let best = ties[0];
  const placed = best.el ? ties.filter((t) => t.el) : [];
  // Rules collect candidates in page order, so the ties are usually in
  // document order already. Checking each against the next is cheap, since
  // neighbours sit close in the tree, and then the first tie is the answer.
  // DOCUMENT_POSITION_FOLLOWING (4) without DISCONNECTED (1).
  let inOrder = true;
  for (let i = 1; i < placed.length && inOrder; i++) {
    const prev = placed[i - 1].el;
    const next = placed[i].el;
    if (prev === next) continue;
    const p = position(prev, next);
    inOrder = (p & 4) !== 0 && (p & 1) === 0;
  }
  if (!inOrder) {
    // Out of order (several scan roots, shadow trees, a custom rule):
    // keep the earliest. DOCUMENT_POSITION_PRECEDING (2): t comes before the
    // current best. Disconnected trees report no order; the earlier
    // candidate stays.
    for (let i = 1; i < placed.length; i++) {
      const t = placed[i];
      if (t.el === best.el) continue;
      const p = position(best.el, t.el);
      if ((p & 2) !== 0 && (p & 1) === 0) best = t;
    }
  }

  const round = declaration.unit === 'px' ? (n) => Math.round(n * 10) / 10 : (n) => n;
  const counted = Number(measuredCount);
  const margin = {
    measure: declaration.measure,
    unit: declaration.unit,
    limit: declaration.limit,
    threshold: round(best.threshold),
    value: round(best.value),
    headroom: round(best.headroom),
    measuredCount:
      Number.isFinite(counted) && counted >= candidates.length
        ? Math.floor(counted)
        : candidates.length
  };

  const includeSelector = !(options && options.includeSelector === false);
  if (best.el && helpers) {
    let selector = '';
    if (includeSelector && typeof helpers.buildSelector === 'function') {
      try {
        selector = String(helpers.buildSelector(best.el) || '');
      } catch {
        selector = '';
      }
      if (selector) margin.selector = selector;
    }
    if (typeof helpers.buildStructuralPath === 'function') {
      try {
        const structuralPath = helpers.buildStructuralPath(best.el, selector);
        if (Array.isArray(structuralPath)) margin.structuralPath = structuralPath;
      } catch {}
    }
  }
  if (best.context && typeof best.context === 'object' && !Array.isArray(best.context)) {
    margin.context = { ...best.context };
  }
  return margin;
}

// Every margin in a scan result, as [{ ruleId, ...margin }], sorted by ruleId.
// Reads check results only: composites carry no margin of their own.
function getMargins(result) {
  const checks = result && Array.isArray(result.checksResults) ? result.checksResults : [];
  const out = [];
  for (const r of checks) {
    if (!r || !r.margin || typeof r.margin !== 'object') continue;
    out.push({ ruleId: r.ruleId, ...r.margin });
  }
  return out.sort((a, b) => (a.ruleId < b.ruleId ? -1 : a.ruleId > b.ruleId ? 1 : 0));
}

module.exports = {
  MARGIN_UNITS,
  MARGIN_LIMITS,
  resolveMargin,
  getMargins
};
