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
 * WCAG 2.5.8 exceptions implemented, and how:
 * - Spacing: a 24px-diameter circle centered on an undersized target must not
 *   intersect another (unrelated) target's box or another undersized
 *   target's own circle. Two passes: a fast center-distance check (exact for
 *   undersized-vs-undersized; a reasonable proxy otherwise) and a 16-point
 *   perimeter sample via elementFromPoint as a more precise fallback for
 *   cases the distance check under-detects (e.g. a small target adjacent to
 *   a large, elongated neighbor). Ancestor/descendant relationships between
 *   the target and the "other" element are never treated as a conflict —
 *   see isRelated — since a nested-interactive shape (a small control inside
 *   its own wrapping link/button) is one visual region, not two independent
 *   targets; that pattern is a11ycore-nested-interactive-controls-absent's
 *   concern, not a spacing one.
 * - Inline: a link inside a run of text (isInlineTextExceptionTarget).
 * - User Agent Control: an unstyled native checkbox/radio, detected via
 *   `appearance` not being reset to `none` (see isUserAgentSizedControl) —
 *   scoped narrowly to checkbox/radio specifically, not every form control,
 *   since those are the only types with unambiguous native rendering.
 * - Essential/Equivalent: only a narrow, high-confidence subset is asserted
 *   (SVG/canvas/map-embedded controls) — see isPlausiblyEssentialOrEquivalent;
 *   anything else defers to cantTell rather than guessing "essential" from a
 *   layout container.
 *
 * Known, deliberately unimplemented gap: `<area>` (image-map hotspot)
 * elements are not evaluated at all. `area[href]` is in CANDIDATE_SELECTOR
 * for forward-compatibility, but it's currently a no-op: `<area>` has no
 * CSS box of its own (`display: none` by the HTML spec's default UA
 * stylesheet — verified, not a jsdom quirk), so `getBoundingClientRect()`
 * always reports zero geometry and `isPointerReachable`'s existing
 * `display:none` check rejects it before any size/exception logic runs. A
 * real `<area>` hit-region is computed by the browser from its `shape`/
 * `coords` attributes against the associated `<img>`'s *rendered* size —
 * an entirely different measurement path than every other candidate here.
 * Implementing that properly (parsing `coords`, resolving the owning
 * `<img>` via its `usemap`, accounting for the image's CSS-scaled render
 * size) is a separate, larger feature, not attempted in this pass.
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
  tags: ['wcag22aa', 'wcag258', 'navigation', 'operable', 'pointer', 'target-size', 'atomic', 'automatic', 'dom'],
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

  const { document, helpers, rule } = ctx;

  const RULE_ID = (rule && rule.ruleId) || 'a11ycore-target-size-minimum';
  const MIN = 24;
  const RADIUS = MIN / 2;

  // --- tiny safe helpers (never throw) ---
  // Goes through helpers.queryAllSmart/queryAll (multi-root and shadow-DOM
  // aware, cached) rather than a raw root/safeRoot DOM query -- ctx.root is
  // an array (multi-region contextSelector support), not a single element
  // with its own .querySelectorAll to call directly.
  function qsa(sel) {
    try {
      if (helpers && typeof helpers.queryAllSmart === 'function') return Array.from(helpers.queryAllSmart(sel) || []);
      if (helpers && typeof helpers.queryAll === 'function') return Array.from(helpers.queryAll(sel) || []);
      return [];
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

  // Bidirectional containment check: true when `a` and `b` are the same
  // element, or either one is an ancestor of the other. A nested-interactive
  // pattern (e.g. a small <button> inside a wrapping <a href>, or vice
  // versa) is a single visual/interactive region, not two independently
  // placed targets — the spacing exception's "does the circle intersect
  // ANOTHER target" language is about separate targets, not an element and
  // its own container. (Nested interactive controls are their own,
  // separately-flagged anti-pattern — a11ycore-nested-interactive-controls-
  // absent — not a target-size spacing concern.)
  function isRelated(a, b) {
    try {
      if (!a || !b) return false;
      if (a === b) return true;
      if (typeof a.contains === 'function' && a.contains(b)) return true;
      if (typeof b.contains === 'function' && b.contains(a)) return true;
      return false;
    } catch {
      return false;
    }
  }

  const CANDIDATE_SELECTOR = 'button, summary, a[href], area[href], input, select, textarea, [role="button"], [role="link"]';

  // --- candidate collection ---
  const candidates = qsa(CANDIDATE_SELECTOR);

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
    // 0) Pure geometry: deterministic center-distance check against ANY
    // nearby target, not just other undersized ones. Per WCAG 2.5.8, the
    // spacing exception depends on proximity to any adjacent target — an
    // undersized target sitting flush against an adequately-sized one still
    // fails the exception, which an undersized-only comparison would miss.
    for (const other of items) {
      if (!other || !other.el || isRelated(target.el, other.el)) continue;

      // Ignore inline-text exception targets when evaluating spacing conflicts.
      // (Inline links in text are exempt and should not invalidate spacing.)
      if (isInlineTextExceptionTarget(other.el)) continue;

      if (dist(target.center, other.center) < MIN) {
        return { conflict: true, confident: true, hitCount: 0, conflictEl: other.el };
      }
    }

    // 1) Perimeter sampling: reduce false positives from incidental overlaps/stacking.
    // Sample every point (no early exit) so the confidence banding below can
    // be based on the full hit count rather than stopping the instant a
    // threshold is crossed.
    const HIT_THRESHOLD = 3;
    // Comfortably above HIT_THRESHOLD: only a hit count this high is treated
    // as a confident conflict. Perimeter sampling is an approximation
    // (rounded corners, border-radius, and sub-pixel geometry can shift a
    // sample point in or out of a neighboring element), so a result that
    // merely reaches HIT_THRESHOLD is not asserted as a deterministic
    // fail — see the ambiguous band below.
    const CONFIDENT_THRESHOLD = 5;
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
        hitCandidate = hit.closest ? hit.closest(CANDIDATE_SELECTOR) : null;
      } catch {}

      if (!hitCandidate) continue;
      if (isRelated(hitCandidate, target.el)) continue;
      if (!isPointerReachable(hitCandidate)) continue;

      // If the thing we hit is an inline-text exception target, don't treat it as a spacing conflict.
      if (isInlineTextExceptionTarget(hitCandidate)) continue;

      hitCount++;
      if (!firstConflictEl) firstConflictEl = hitCandidate;
    }

    if (hitCount >= CONFIDENT_THRESHOLD) {
      return { conflict: true, confident: true, hitCount, conflictEl: firstConflictEl };
    }

    // Ambiguous band: close enough to HIT_THRESHOLD that sampling noise
    // could have tipped the result either way. Defer to manual review
    // instead of committing to pass or fail.
    if (hitCount >= HIT_THRESHOLD - 1) {
      return { conflict: false, confident: false, hitCount, conflictEl: firstConflictEl };
    }

    return { conflict: false, confident: true, hitCount, conflictEl: null };
  }

  // WCAG 2.5.8 "User Agent Control" exception: the target's size requirement
  // does not apply at all when its size is determined by the user agent and
  // not modified by the author — the canonical example being an unstyled
  // native checkbox/radio (browsers render these well under 24px by
  // default, and that's not the author's choice). Scoped narrowly to
  // input[type=checkbox]/[type=radio] specifically (the only form-control
  // types with a universally-recognized, unambiguous native rendering) —
  // deliberately not extended to select/range/color/file, whose "default"
  // sizing varies enough across browsers/OSes that a wrong exemption there
  // risks masking a real author-introduced undersized target.
  //
  // Detection signal: `appearance` (or the legacy `-webkit-appearance`)
  // computed as `none` is the near-universal first step of custom
  // checkbox/radio styling across every CSS framework/design system —
  // if the author hasn't reset it, the browser is still rendering its own
  // default control chrome, so the size is genuinely UA-determined.
  function isUserAgentSizedControl(el) {
    try {
      if (!el || el.nodeType !== 1) return false;
      const tag = (el.tagName || '').toLowerCase();
      if (tag !== 'input') return false;

      const type = (el.getAttribute && String(el.getAttribute('type') || '').trim().toLowerCase()) || '';
      if (type !== 'checkbox' && type !== 'radio') return false;

      const cs = getStyle(el);
      let appearance = '';
      try {
        if (cs && typeof cs.getPropertyValue === 'function') {
          appearance = cs.getPropertyValue('appearance') || cs.getPropertyValue('-webkit-appearance') || '';
        } else if (cs) {
          appearance = cs.appearance || cs.webkitAppearance || '';
        }
      } catch {}
      appearance = String(appearance).trim().toLowerCase();

      // Author has reset the native chrome => size is now author-controlled;
      // the exception no longer applies, evaluate normally.
      if (appearance === 'none') return false;

      return true;
    } catch {
      return false;
    }
  }

  function isPlausiblyEssentialOrEquivalent(el) {
    try {
      if (!el || el.nodeType !== 1) return false;

      const tag = (el.tagName || '').toLowerCase();

      // Image map targets are often constrained by the underlying image.
      // Currently unreachable in practice: <area> never becomes a
      // measurable candidate at all (see the file header's "Known,
      // deliberately unimplemented gap" note) — kept for forward
      // compatibility if that gap is closed later.
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

    // User Agent Control exception: size isn't the author's choice, so the
    // size requirement (and therefore any spacing conflict stemming from
    // it) doesn't apply at all — skip straight to pass, no need to even
    // evaluate spacing.
    if (isUserAgentSizedControl(it.el)) {
      continue;
    }

    const info = hasSpacingConflict(it);

    if (!info.conflict && info.confident === false) {
      // Ambiguous perimeter-sampling result near the decision threshold.
      hasUncertainConflicts = true;
      continue;
    }

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
