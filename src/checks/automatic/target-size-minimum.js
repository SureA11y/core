'use strict';

/**
 * @check a11ycore-target-size-minimum
 * @atomic true
 * @summary Pointer-operable targets should be at least 24×24 CSS px (or meet an exception)
 * @standard WCAG 2.2
 * @sc 2.5.8
 *
 * Notes (engine intent):
 * - This rule is DOM-based and measures pointer hit regions available to sighted pointer users.
 * - Elements can be "pointer-operable" even if excluded from the accessibility tree (e.g. aria-hidden="true").
 * - Excludes targets that are not pointer-reachable due to rendering suppression (display:none, etc.),
 *   or pointer suppression (pointer-events:none), or zero geometry (e.g. scale(0) -> zero rects).
 *
 * This is an automatic, deterministic approximation intended to be:
 * - strict on clear failures,
 * - conservative when exceptions cannot be determined reliably.
 */

const id = 'a11ycore-target-size-minimum';

const meta = {
  title: 'Pointer targets meet minimum size (AA)',
  description:
      'Checks that pointer-operable targets have an effective hit region of at least 24 by 24 CSS pixels, or meet an allowed exception (e.g. sufficient spacing).',
  i18n: {
    titleKey: 'a11ycore_targetSizeMinimum_title',
    descriptionKey: 'a11ycore_targetSizeMinimum_description'
  },
  helpUrl: null,
  tags: ['wcag2aa', 'wcag258', 'navigation', 'operable', 'pointer', 'target-size', 'atomic', 'automatic', 'dom'],
  wcagSc: ['2.5.8'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '2.5.8',
      title: 'Target Size (Minimum)',
      conformanceLevel: 'AA'
    }
  ],
  defaultSeverity: 'serious',
  category: 'operable',
  type: 'automatic',
  defaultConfidence: 'medium',
  coverage: {
    facetsBySc: {
      '2.5.8': ['target-size-minimum-pointer']
    }
  }
};

// ---- constants (deterministic, CSS pixels) ----
const MIN_SIZE = 24;
const MIN_RADIUS = 12; // spacing exception circle radius (24px diameter)

// Grid sampling configuration (kept small for perf; only used for undersized targets)
const GRID_POINTS = 25; // 5x5
const GRID_N = 5;

// Circle sampling configuration (perimeter)
const CIRCLE_SAMPLES = 16; // deterministic, fixed

function runInPage(ctx) {
  'use strict';

  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const RULE_ID = (rule && rule.ruleId) || 'a11ycore-target-size-minimum';
  const MIN = 24;
  const RADIUS = MIN / 2;

  // --- tiny safe helpers (never throw) ---
  function qsa(sel) {
    try {
      return Array.from(safeRoot.querySelectorAll(sel));
    } catch {
      return [];
    }
  }

  function buildSelector(el) {
    try {
      if (helpers && typeof helpers.buildSelector === 'function') return helpers.buildSelector(el);
    } catch {}
    try {
      if (el && el.id) return `#${el.id}`;
    } catch {}
    return 'html';
  }

  function htmlSnippet(el) {
    try {
      if (helpers && typeof helpers.getOuterHtmlSnippet === 'function') return helpers.getOuterHtmlSnippet(el);
    } catch {}
    try {
      return (el && el.outerHTML) ? String(el.outerHTML) : '';
    } catch {}
    return '';
  }

  function isInlineTextExceptionTarget(el) {
    // SC 2.5.8 exception: target is in a sentence/block of text (inline)
    // Deterministic heuristic:
    // - must be a link-like target
    // - must be rendered as inline/inline-*
    // - must be inside a typical text container
    try {
      if (!el || el.nodeType !== 1) return false;

      const tag = (el.tagName || '').toLowerCase();
      const role = (el.getAttribute && String(el.getAttribute('role') || '').trim().toLowerCase()) || '';
      const isLinkLike = (tag === 'a' && el.getAttribute && el.getAttribute('href')) || role === 'link';
      if (!isLinkLike) return false;

      const cs = getStyle(el);
      const display = cs && cs.display ? String(cs.display) : '';
      if (!display) return false;

      // Inline exception is for inline text runs; many design systems use inline-block for links,
      // so treat inline-block variants as eligible for this exception.
      const isInline =
          display === 'inline' ||
          display === 'inline-block' ||
          display === 'inline-flex' ||
          display === 'inline-grid' ||
          display === 'inline-table';

      if (!isInline) return false;

      const t = (el.textContent || '').trim();
      if (!t) return false;

      // Require that it sits in a "text block" context
      const textContainer = closest(el, 'p, li, dd, dt, blockquote, figcaption, caption, td, th');
      if (textContainer) return true;

      // Fallback: sometimes links are inside spans within a paragraph-like region
      const inlineContainer = closest(el, 'span, em, strong, small, label');
      if (inlineContainer) {
        const outerTextBlock = closest(inlineContainer, 'p, li, dd, dt, blockquote, figcaption, caption, td, th');
        if (outerTextBlock) return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  function getRects(el) {
    try {
      if (!el || typeof el.getClientRects !== 'function') return [];
      const r = el.getClientRects();
      return r ? Array.from(r) : [];
    } catch {
      return [];
    }
  }

  function getBcr(el) {
    try {
      if (!el || typeof el.getBoundingClientRect !== 'function') return null;
      return el.getBoundingClientRect();
    } catch {
      return null;
    }
  }

  function hasHiddenAttr(el) {
    try {
      return !!(el && el.hasAttribute && el.hasAttribute('hidden'));
    } catch {
      return false;
    }
  }

  function closest(el, sel) {
    try {
      return el && typeof el.closest === 'function' ? el.closest(sel) : null;
    } catch {
      return null;
    }
  }

  function inClosedDetails(el) {
    const det = closest(el, 'details');
    if (!det) return false;

    try {
      if (det.hasAttribute('open')) return false;

      const tag = (el && el.tagName) ? String(el.tagName).toLowerCase() : '';
      // summary remains operable even when <details> is closed
      if (tag === 'summary') return false;

      // everything else inside closed details is suppressed
      return true;
    } catch {
      return false;
    }
  }

  function inInertSubtree(el) {
    // Any ancestor with [inert] suppresses, including self.
    try {
      return !!closest(el, '[inert]');
    } catch {
      return false;
    }
  }

  function getStyle(el) {
    try {
      return (document && document.defaultView && document.defaultView.getComputedStyle)
          ? document.defaultView.getComputedStyle(el)
          : null;
    } catch {
      return null;
    }
  }

  function isPointerReachable(el) {
    // Match test expectations:
    // - exclude display:none
    // - exclude [hidden]
    // - exclude content-visibility:hidden
    // - exclude visibility hidden/collapse
    // - exclude pointer-events:none
    // - exclude inert subtree
    // - exclude elements inside closed details (except summary)
    // - exclude elements with no client rects
    // - DO NOT exclude aria-hidden or opacity:0
    if (!el || el.nodeType !== 1) return false;

    if (hasHiddenAttr(el)) return false;
    if (inInertSubtree(el)) return false;
    if (inClosedDetails(el)) return false;

    // Not operable => exclude
    try {
      if (typeof el.matches === 'function' && el.matches(':disabled')) return false;
    } catch {}

    // aria-disabled elements are typically treated as not operable
    try {
      const ad = el.getAttribute && String(el.getAttribute('aria-disabled') || '').trim().toLowerCase();
      if (ad === 'true') return false;
    } catch {}

    const rects = getRects(el);
    if (!rects || rects.length === 0) return false;

    const cs = getStyle(el);
    const display = cs && cs.display ? String(cs.display) : 'block';
    const visibility = cs && cs.visibility ? String(cs.visibility) : 'visible';
    const contentVisibility = cs && cs.contentVisibility ? String(cs.contentVisibility) : 'visible';
    const pointerEvents = cs && cs.pointerEvents ? String(cs.pointerEvents) : 'auto';

    if (display === 'none') return false;
    if (visibility === 'hidden' || visibility === 'collapse') return false;
    if (contentVisibility === 'hidden') return false;
    if (pointerEvents === 'none') return false;

    return true;
  }

  function centerOfRect(r) {
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  }

  function dist(a, b) {
    const dx = a.cx - b.cx;
    const dy = a.cy - b.cy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function elementFromPoint(x, y) {
    try {
      if (document && typeof document.elementFromPoint === 'function') return document.elementFromPoint(x, y);
    } catch {}
    return null;
  }

  function isSameOrInside(hit, target) {
    try {
      if (!hit || !target) return false;
      return hit === target || (typeof target.contains === 'function' && target.contains(hit));
    } catch {
      return false;
    }
  }

  // --- candidate collection ---
  const candidates = qsa('button, summary, a[href], input, select, textarea, [role="button"], [role="link"]');

  const applicable = [];
  for (const el of candidates) {
    if (isPointerReachable(el)) applicable.push(el);
  }

  if (applicable.length === 0) {
    return { ruleId: RULE_ID, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  // Precompute geometry for applicable elements.
  const items = [];
  for (const el of applicable) {
    const r = getBcr(el);
    if (!r) continue;
    // Guard against nonsense
    const w = Number(r.width);
    const h = Number(r.height);
    if (!Number.isFinite(w) || !Number.isFinite(h)) continue;
    if (w <= 0 || h <= 0) continue;

    items.push({
      el,
      rect: { left: r.left, top: r.top, width: w, height: h, right: r.left + w, bottom: r.top + h },
      center: centerOfRect({ left: r.left, top: r.top, width: w, height: h })
    });
  }

  if (items.length === 0) {
    // had “applicable” but no measurable geometry
    return { ruleId: RULE_ID, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const undersized = items.filter((it) => it.rect.width < MIN || it.rect.height < MIN);

  // --- spacing/occlusion evaluation ---
  function hasSpacingConflict(target) {
    // 0) Pure geometry: if another undersized target's 24px "exception circle" overlaps ours,
    // spacing exception is not met. This is deterministic and avoids elementFromPoint quirks.
    for (const other of undersized) {
      if (!other || !other.el || other.el === target.el) continue;

      // Ignore inline-text exception targets when evaluating spacing conflicts.
      // (Inline links in text are exempt and should not invalidate spacing.)
      if (isInlineTextExceptionTarget(other.el)) continue;

      if (dist(target.center, other.center) < MIN) {
        return { conflict: true, hitCount: 0, conflictEl: other.el };
      }
    }

    // 1) Perimeter sampling: reduce false positives from incidental overlaps/stacking.
    const HIT_THRESHOLD = 3;
    let hitCount = 0;
    let firstConflictEl = null;

    const STEPS = 16;
    for (let i = 0; i < STEPS; i++) {
      const ang = (Math.PI * 2 * i) / STEPS;
      const x = target.center.cx + RADIUS * Math.cos(ang);
      const y = target.center.cy + RADIUS * Math.sin(ang);

      const hit = elementFromPoint(x, y);
      if (!hit) continue;

      let hitCandidate = null;
      try {
        hitCandidate = hit.closest
            ? hit.closest('button, summary, a[href], input, select, textarea, [role="button"], [role="link"]')
            : null;
      } catch {}

      if (!hitCandidate) continue;
      if (!isPointerReachable(hitCandidate)) continue;

      // If the thing we hit is an inline-text exception target, don't treat it as a spacing conflict.
      if (isInlineTextExceptionTarget(hitCandidate)) continue;

      if (!isSameOrInside(hitCandidate, target.el) && hitCandidate !== target.el) {
        hitCount++;
        if (!firstConflictEl) firstConflictEl = hitCandidate;
        if (hitCount >= HIT_THRESHOLD) {
          return { conflict: true, hitCount, conflictEl: firstConflictEl };
        }
      }
    }

    return { conflict: false, hitCount: 0, conflictEl: null };
  }

  function isPlausiblyEssentialOrEquivalent(el) {
    try {
      if (!el || el.nodeType !== 1) return false;

      const tag = (el.tagName || '').toLowerCase();

      // Image map targets are often constrained by the underlying image.
      if (tag === 'area') return true;

      // Graphics / spatial interaction regions are commonly essential by design.
      if (closest(el, 'svg, canvas, map')) return true;

      // Otherwise: do NOT guess "essential/equivalent" from layout containers.
      return false;
    } catch {
      return false; // conservative: don't mask failures as cantTell
    }
  }

  const occurrences = [];
  let hasUncertainConflicts = false;

  for (const it of undersized) {
    // Inline-text exception: do not fail purely on size/spacing for inline links in text.
    if (isInlineTextExceptionTarget(it.el)) {
      continue; // pass by exception (no occurrence)
    }

    const info = hasSpacingConflict(it);
    if (info.conflict) {
      if (isPlausiblyEssentialOrEquivalent(it.el)) {
        hasUncertainConflicts = true;
        continue;
      }

      occurrences.push({
        selector: buildSelector(it.el),
        html: htmlSnippet(it.el),
        summary: 'Target is too small and too close to another target.',
        hint: 'Increase target size to at least 24 by 24 CSS pixels, or add sufficient spacing.',
        i18n: {
          summaryKey: 'a11ycore_targetSizeMinimum_summary_fail',
          hintKey: 'a11ycore_targetSizeMinimum_hint_fail',
          params: {}
        },
        data: {
          details: {
            measured: { width: it.rect.width, height: it.rect.height },
            reasonCode: 'undersized-and-too-close',
            conflictHitCount: info.hitCount,
            conflictWith: info.conflictEl ? buildSelector(info.conflictEl) : null
          }
        }
      });
    }
  }

  if (occurrences.length > 0) {
    return {
      ruleId: RULE_ID,
      outcome: 'fail',
      severity: (rule && rule.defaultSeverity) || 'minor',
      occurrences
    };
  }

  if (hasUncertainConflicts) {
    return {
      ruleId: RULE_ID,
      outcome: 'cantTell',
      severity: 'minor',
      occurrences: []
    };
  }

  return { ruleId: RULE_ID, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
