/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check target-size-minimum
 * @atomic true
 * @summary Pointer-operable targets should be at least 24×24 CSS px (or meet an exception)
 * @standard WCAG 2.2
 * @sc 2.5.8
 * @applicability
 *   Applies to <button>, <summary>, <a href>, <area href>, <input>,
 *   <select>, <textarea> and elements whose role resolves to button or link
 *   (the first real role in the role attribute, in any case) that are
 *   pointer-reachable: rendered, not suppressed by pointer-events:none, and
 *   with something left for a pointer to hit (a target entirely covered by
 *   other boxes, or clipped away, is none; one with display: contents is
 *   its content). Accessibility-tree exclusion isn't a filter here: an
 *   aria-hidden control is still a target a pointer can hit.
 *   <area> is matched but never actually evaluated: it has no box of its own
 *   to measure.
 * @expectation
 *   Each target is at least 24 by 24 CSS pixels, or meets one of the SC
 *   2.5.8 exceptions this rule can establish from geometry. A target is the
 *   region a pointer can hit: its border box with its rounded corners and
 *   2D transforms, clipped by overflow, clip and clip-path: inset() on its
 *   containing-block chain, with content sticking out of it, less the boxes
 *   painted over it that take pointer events (fixed and sticky ones aside).
 *   It is large enough when a 24 by 24 square aligned to the page fits in
 *   that region, as Understanding 2.5.8 measures it. The exceptions: spacing
 *   (a 24px-diameter circle centred on the region's bounding box reaches no
 *   unrelated target's region, nor the circle of another undersized one),
 *   the inline exception for a link in a sentence (the stretch of its block
 *   container between line breaks holds text outside any target with a
 *   letter or a digit in it), or user-agent sizing (an unstyled native
 *   checkbox or radio, detected by appearance not having been reset to
 *   none). An undersized target too close to a neighbour fails. Where an
 *   exception may apply but cannot be confirmed (two inline links crowding
 *   each other between separators alone, as in "Edit | Delete", or a target
 *   inside an SVG, canvas or image map that may be essential), the result is
 *   cantTell rather than a guess.
 *   Margin (`target-size-px`): of the targets that are at least 24 by 24,
 *   the smallest, as the side of the largest square that fits in it against
 *   24 (for a rectangle, the smaller of its width and height);
 *   `context.widthPx` and `context.heightPx` give its extent. A target under
 *   24 that passes through the spacing exception is not a candidate.
 *   `measuredCount` counts every target measured.
 * @reports
 *   - `metrics.widthPx`, `metrics.heightPx`: the extent of the region a
 *     pointer can hit, in CSS pixels; `metrics.squarePx`: the side of the
 *     largest square that fits in it, against `metrics.minSizePx` (24).
 *     Rounded to a tenth, but down where that would reach the limit, so a
 *     size under 24 never reads as 24.
 *   - `metrics.decidedBy`: what found the target too close to another:
 *     `centerDistance`, the circle of another undersized target, or
 *     `regionDistance`, another target's region within the circle.
 *   - `metrics.centerDistancePx`, `metrics.minDistancePx` (`centerDistance`):
 *     the distance from the target's centre to its neighbour's, against the
 *     24px it needs.
 *   - `metrics.regionDistancePx`, `metrics.minDistancePx`
 *     (`regionDistance`): how far the neighbour's region is from the
 *     target's centre, against the circle's 12px radius.
 *   - `conflictWith`: a selector for the neighbour it is too close to.
 *   - `measured.width`, `measured.height`, `measured.square`: the region's
 *     extent and the largest square, unrounded.
 *   - `viewport.width`, `viewport.height`: the viewport the page was laid
 *     out in, in CSS pixels. A responsive page can size or place a target
 *     differently at another width.
 * @implementation-notes
 * - Under a scoped scan (contextSelector), only targets in scope are
 *   judged, but their neighbours are taken from the whole document: the
 *   spacing exception depends on what the page puts next to a target, not
 *   on where the scan's scope ends. A neighbour inside a shadow root outside
 *   the scope is not found.
 * Notes (engine intent):
 * - This rule is DOM-based and measures pointer hit regions available to sighted pointer users.
 * - Elements can be "pointer-operable" even if excluded from the accessibility tree (e.g. aria-hidden="true").
 * - Excludes targets that are not pointer-reachable due to rendering suppression (display:none, etc.),
 *   or pointer suppression (pointer-events:none), or zero geometry (e.g. scale(0) -> zero rects),
 *   or a clip that leaves nothing visible (`clip: rect(0 0 0 0)`, `clip-path: inset(50%)`, on the
 *   element or an ancestor), as visually hidden skip links and labels use, or other boxes
 *   painted over all of it.
 * - The region is worked out from the layout, so targets below the fold are measured as those
 *   in view. It ends where the page does: what lies before its start, where scrolling can't
 *   reach (a skip link at left: -9999px), or a fixed box outside the viewport, is no target. Left as their bounding box: 3D transforms, clip-path shapes other than inset(),
 *   and an ancestor's rounded clipping. A square has to fit in one piece of a region (a box, a
 *   line of an inline link, a child sticking out), not across two.
 * - A neighbour found by the centre-distance check counts only if the browser shows it somewhere
 *   near the target: one covered there by something else, such as a page link under a fixed
 *   cookie banner, cannot be hit by a pointer aiming at the target.
 *
 * WCAG 2.5.8 exceptions implemented, and how:
 * - Spacing: a 24px-diameter circle centered on an undersized target's region
 *   must not intersect another (unrelated) target's region or another
 *   undersized target's own circle. Both are tested exactly: the distance
 *   from the circle's centre to the neighbour's region (its polygons, less
 *   the boxes over them) against 12px, and between the two centres against
 *   24px; a circle that only touches passes. Ancestor/descendant relationships between
 *   the target and the "other" element are never treated as a conflict (see
 *   isRelated): a nested-interactive shape, a small control inside its own
 *   wrapping link/button, is one visual region, not two independent targets.
 *   That pattern is nested-interactive-controls-absent's concern, not a
 *   spacing one.
 * - Inline: a link in a sentence passes outright, and is no neighbour of other
 *   targets (isInlineTextExceptionTarget): its block container, found from
 *   the computed display, holds text outside any target with a letter or a
 *   digit in the stretch between line breaks around it. Pagination, lists of
 *   links and a link alone in a paragraph are judged like other targets. An
 *   inline link whose only spacing conflict is another inline link of a
 *   stretch with separators but no words is reported as cantTell
 *   (textAround), since the inline exception may cover it.
 * - User Agent Control: an unstyled native checkbox/radio, detected via
 *   `appearance` not being reset to `none` (see isUserAgentSizedControl).
 *   Scoped narrowly to checkbox/radio specifically, not every form control,
 *   since those are the only types with unambiguous native rendering.
 * - Essential/Equivalent: only a narrow, high-confidence subset is asserted
 *   (SVG/canvas/map-embedded controls, see isPlausiblyEssentialOrEquivalent);
 *   anything else defers to cantTell rather than guessing "essential" from a
 *   layout container.
 *
 * Known gap, left unimplemented on purpose: `<area>` (image-map hotspot)
 * elements are not evaluated at all. `area[href]` is in CANDIDATE_SELECTOR
 * for forward-compatibility, but it's currently a no-op. `<area>` has no
 * CSS box of its own (`display: none` by the HTML spec's default UA
 * stylesheet, confirmed against the spec rather than a jsdom quirk), so
 * `getBoundingClientRect()` always reports zero geometry and
 * `isPointerReachable`'s existing `display:none` check rejects it before any
 * size/exception logic runs. A real `<area>` hit-region is computed by the
 * browser from its `shape`/`coords` attributes against the associated
 * `<img>`'s *rendered* size, an entirely different measurement path than
 * every other candidate here. Implementing that properly (parsing `coords`,
 * resolving the owning `<img>` via its `usemap`, accounting for the image's
 * CSS-scaled render size) is a separate, larger feature, not attempted in
 * this pass.
 *
 * This is an automatic, deterministic approximation intended to be:
 * - strict on clear failures,
 * - conservative when exceptions cannot be determined reliably.
 */

const id = 'target-size-minimum';

const meta = {
  title:
    'Pointer targets must be at least 24x24px large, or leave sufficient distance to other targets',
  description:
    'Checks that pointer-operable targets have an effective hit region of at least 24 by 24 CSS pixels, or meet an allowed exception (e.g. sufficient spacing).',
  i18n: {
    titleKey: 'targetSizeMinimum_title',
    descriptionKey: 'targetSizeMinimum_description'
  },
  helpUrl: null,
  tags: [
    'wcag22aa',
    'wcag258',
    'navigation',
    'operable',
    'pointer',
    'target-size',
    'atomic',
    'automatic',
    'dom'
  ],
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
  },
  margin: { measure: 'target-size-px', unit: 'px', limit: 'min' }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  ('use strict');

  const { document, helpers, rule } = ctx;

  const RULE_ID = (rule && rule.ruleId) || 'target-size-minimum';
  const MIN = 24;
  const RADIUS = MIN / 2;

  // --- tiny safe helpers (never throw) ---
  // Goes through helpers.queryAllSmart/queryAll (multi-root and shadow-DOM
  // aware, cached) rather than a raw root/safeRoot DOM query -- ctx.root is
  // an array (multi-region contextSelector support), not a single element
  // with its own .querySelectorAll to call directly.
  function qsa(sel) {
    try {
      if (helpers && typeof helpers.queryAllSmart === 'function')
        return Array.from(helpers.queryAllSmart(sel) || []);
      if (helpers && typeof helpers.queryAll === 'function')
        return Array.from(helpers.queryAll(sel) || []);
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
      if (el && dom.get(el, 'id')) return `#${dom.get(el, 'id')}`;
    } catch {}
    return 'html';
  }

  // The element's explicit role: the first token of its role attribute that
  // names a real role, in any case (role="foo link" and role="LINK" are both
  // links), or '' when none does.
  function getExplicitRole(el) {
    try {
      return helpers && helpers.aria ? helpers.aria.getExplicitRole(el) : '';
    } catch {
      return '';
    }
  }

  // A link-like target (a[href] or role="link") rendered inline/inline-* and
  // carrying visible text. This is the shape the SC 2.5.8 inline exception is
  // about, without the surrounding-container requirement.
  function isInlineLinkTarget(el) {
    try {
      if (!el || dom.nodeType(el) !== 1) return false;

      const tag = (dom.tagName(el) || '').toLowerCase();
      const role = getExplicitRole(el);
      const isLinkLike =
        (tag === 'a' && dom.get(el, 'getAttribute') && dom.getAttribute(el, 'href')) ||
        role === 'link';
      if (!isLinkLike) return false;

      const cs = getStyle(el);
      const display = cs && cs.display ? String(cs.display) : '';
      // Many design systems use inline-block for links, so treat the
      // inline-block variants as inline here too.
      const isInline =
        display === 'inline' ||
        display === 'inline-block' ||
        display === 'inline-flex' ||
        display === 'inline-grid' ||
        display === 'inline-table';
      if (!isInline) return false;

      return (dom.textContent(el) || '').trim().length > 0;
    } catch {
      return false;
    }
  }

  // SC 2.5.8's inline exception: an inline link "in a sentence" (#106). It
  // is in one when the stretch of its block container between line breaks
  // (a <br>, an <hr>, or a box that isn't inline) holds text outside any
  // target with a letter or a digit in it. Separators alone (|, ›, ·) make
  // no sentence: links between them are judged, and where they crowd only
  // each other the inline-link-run cantTell below applies.
  function isInlineTextExceptionTarget(el) {
    const around = textAround(el);
    return !!around && around.words;
  }
  // The stretch of text an inline link is in, as { words, symbols }: text
  // with a letter or digit in it, and other text that isn't white space.
  // null for a link that isn't inline.
  function textAround(el) {
    try {
      if (!isInlineLinkTarget(el)) return null;
      if (!__textAround.has(el)) {
        stretchesOf(blockContainerOf(el));
        if (!__textAround.has(el)) __textAround.set(el, null);
      }
      return __textAround.get(el);
    } catch {
      return null;
    }
  }
  // Inline boxes and boxes with display: contents lay their content out
  // in their parent's lines; an inline-block lays out lines of its own.
  const isInlineBox = (cs) => !!cs && /^inline/.test(String(cs.display || ''));
  function blockContainerOf(el) {
    let cur = helpers.composedParent(el);
    for (let i = 0; cur && dom.nodeType(cur) === 1 && i < 100000; i++) {
      const cs = getStyle(cur);
      if (!cs || (cs.display !== 'contents' && !isInlineFlow(cs))) return cur;
      cur = helpers.composedParent(cur);
    }
    return cur;
  }
  // The nodes a box lays out: its shadow root's in place of its own, and
  // a slot's assigned nodes in place of its fallback.
  function renderedChildren(node) {
    try {
      if (dom.nodeType(node) === 1) {
        const sr = dom.shadowRoot(node);
        if (sr) return Array.from(dom.childNodes(sr));
        if (String(dom.localName(node) || '').toLowerCase() === 'slot') {
          const assigned = dom.assignedNodes(node, { flatten: true });
          if (assigned && assigned.length) return Array.from(assigned);
        }
      }
      return Array.from(dom.childNodes(node));
    } catch {
      return [];
    }
  }
  // Walks a block container once and settles, for every inline link in it,
  // the text of its stretch.
  const __textAround = new WeakMap();
  const HAS_WORD = /[\p{L}\p{N}]/u;
  function stretchesOf(container) {
    if (!container) return;
    let stretch = { words: false, symbols: false };
    let links = [];
    const close = () => {
      for (const l of links) __textAround.set(l, stretch);
      stretch = { words: false, symbols: false };
      links = [];
    };
    const walk = (node) => {
      for (const child of renderedChildren(node)) {
        const type = dom.nodeType(child);
        if (type === 3) {
          const text = String(dom.nodeValue(child) || '');
          if (HAS_WORD.test(text)) stretch.words = true;
          else if (text.trim()) stretch.symbols = true;
          continue;
        }
        if (type !== 1) continue;
        const tag = String(dom.localName(child) || '').toLowerCase();
        if (tag === 'br' || tag === 'hr') {
          close();
          continue;
        }
        const cs = getStyle(child);
        if (!cs || cs.display === 'none') continue;
        if (cs.display !== 'contents' && !isInlineBox(cs)) {
          close();
          continue;
        }
        if (isCandidate(child)) {
          // A target's own text is no sentence around it.
          if (isInlineLinkTarget(child)) links.push(child);
          continue;
        }
        walk(child);
      }
    };
    walk(container);
    close();
  }

  function getRects(el) {
    try {
      if (!el || typeof dom.get(el, 'getClientRects') !== 'function') return [];
      const r = dom.getClientRects(el);
      return r ? Array.from(r) : [];
    } catch {
      return [];
    }
  }

  function getBcr(el) {
    try {
      if (!el || typeof dom.get(el, 'getBoundingClientRect') !== 'function') return null;
      return dom.getBoundingClientRect(el);
    } catch {
      return null;
    }
  }

  function hasHiddenAttr(el) {
    try {
      return !!(el && dom.get(el, 'hasAttribute') && dom.hasAttribute(el, 'hidden'));
    } catch {
      return false;
    }
  }

  function closest(el, sel) {
    try {
      return el && typeof dom.get(el, 'closest') === 'function' ? dom.closest(el, sel) : null;
    } catch {
      return null;
    }
  }

  // A closed <details> shows only its first <summary> child, which stays
  // operable as the toggle, with whatever is inside it. Everything else in
  // it is suppressed, an open <details> nested in it included. The walk
  // crosses shadow boundaries and slots.
  function inClosedDetails(el) {
    try {
      let child = el;
      let cur = helpers.composedParent(el);
      for (let guard = 0; cur && guard < 1000; guard++) {
        if (
          dom.nodeType(cur) === 1 &&
          String(dom.localName(cur) || '').toLowerCase() === 'details' &&
          !dom.hasAttribute(cur, 'open')
        ) {
          let first = dom.firstElementChild(cur);
          while (first && String(dom.localName(first) || '').toLowerCase() !== 'summary') {
            first = dom.nextElementSibling(first);
          }
          if (child !== first) return true;
        }
        child = cur;
        cur = helpers.composedParent(cur);
      }
    } catch {}
    return false;
  }

  function inInertSubtree(el) {
    // Any ancestor with [inert] suppresses, including self.
    try {
      return !!closest(el, '[inert]');
    } catch {
      return false;
    }
  }

  // Per-run memoization: getComputedStyle is a real, non-trivial cost in an
  // actual browser (unlike jsdom, which no-ops it), and hasSpacingConflict
  // below calls getStyle on the SAME candidate element repeatedly -- once
  // per undersized target it's compared against, via
  // isInlineTextExceptionTarget/isInlineLinkTarget -- so with U undersized
  // targets and N total candidates this was an uncached O(U * N)
  // getComputedStyle call count. The DOM is read-only for the rest of this
  // rule's run (no writes between reads), so caching per element here is
  // safe -- style cannot change mid-run.
  const __styleCache = new WeakMap();
  function getStyle(el) {
    if (__styleCache.has(el)) return __styleCache.get(el);
    let cs;
    try {
      cs =
        document && dom.defaultView(document) && dom.defaultView(document).getComputedStyle
          ? dom.defaultView(document).getComputedStyle(el)
          : null;
    } catch {
      cs = null;
    }
    __styleCache.set(el, cs);
    return cs;
  }

  // Visually hidden: the element, or an ancestor, is clipped to nothing, as
  // the usual screen-reader-only pattern does. A pointer cannot hit any of
  // it, so it is not a target, however small its box (helpers.isClipHidden).
  function isClippedAway(el) {
    // Bounded as a safety net only: a walk up a real tree always ends.
    for (
      let a = el, i = 0;
      a && dom.nodeType(a) === 1 && i < 100000;
      a = dom.parentElement(a), i++
    ) {
      const cs = getStyle(a);
      if (cs && helpers.isClipHidden(cs)) return true;
    }
    return false;
  }

  // --- The region a pointer can hit (#105) ---
  // A target is the "region of the display that will accept a pointer
  // action", less what another target overlaps (WCAG 2.2, target), and it is
  // large enough when a 24 by 24 square aligned to the page fits inside it
  // (Understanding 2.5.8), so rounded corners and a rotation count. The
  // region is worked out from the layout as the browser hit-tests it: the
  // border box with its rounded corners and 2D transforms, clipped by
  // overflow, clip and clip-path: inset() on its containing-block chain,
  // plus descendants that stick out of it, less the boxes painted over it
  // that take pointer events, in the painting order the contrast rules use
  // (helpers.contrast.comparePaintOrder). It is a list of convex polygons
  // (`pieces`), each with the boxes over it (`covers`), in viewport
  // coordinates. Left as their bounding box: 3D transforms, other clip-path
  // shapes, and rounded clipping by an ancestor.
  const EPS = 1e-7;
  const HTML_NS = 'http://www.w3.org/1999/xhtml';
  const px = (v) => {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };
  const NO_CLIP = { l: -Infinity, t: -Infinity, r: Infinity, b: Infinity };
  const meet = (a, b) => ({
    l: Math.max(a.l, b.l),
    t: Math.max(a.t, b.t),
    r: Math.min(a.r, b.r),
    b: Math.min(a.b, b.b)
  });
  const rectPoly = (l, t, r, b) => [
    { x: l, y: t },
    { x: r, y: t },
    { x: r, y: b },
    { x: l, y: b }
  ];
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  function area(poly) {
    let s = 0;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      s += a.x * b.y - b.x * a.y;
    }
    return s / 2;
  }
  // Polygons are kept with a positive signed area, so a point is inside
  // when it is on the left of every edge.
  const oriented = (poly) => (area(poly) < 0 ? poly.slice().reverse() : poly);
  // Polygons are never changed once made, so their bounds are kept.
  const __boundsCache = new WeakMap();
  function boundsOf(poly) {
    let bb = __boundsCache.get(poly);
    if (!bb) {
      bb = measureBounds(poly);
      __boundsCache.set(poly, bb);
    }
    return bb;
  }
  function measureBounds(poly) {
    let l = Infinity;
    let t = Infinity;
    let r = -Infinity;
    let b = -Infinity;
    for (const p of poly) {
      if (p.x < l) l = p.x;
      if (p.x > r) r = p.x;
      if (p.y < t) t = p.y;
      if (p.y > b) b = p.y;
    }
    return { l, t, r, b };
  }
  // Sutherland-Hodgman: the part of a convex polygon where keep(p) >= 0,
  // for keep linear along each edge.
  function clipBy(poly, keep) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const ka = keep(a);
      const kb = keep(b);
      if (ka >= -EPS) out.push(a);
      if (ka >= -EPS !== kb >= -EPS) {
        const t = ka / (ka - kb);
        out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      }
    }
    return out;
  }
  function clipToRect(poly, c) {
    let p = poly;
    if (c.l > -Infinity) p = clipBy(p, (q) => q.x - c.l);
    if (p.length && c.r < Infinity) p = clipBy(p, (q) => c.r - q.x);
    if (p.length && c.t > -Infinity) p = clipBy(p, (q) => q.y - c.t);
    if (p.length && c.b < Infinity) p = clipBy(p, (q) => c.b - q.y);
    return p;
  }
  function clipToPoly(poly, clip) {
    let p = poly;
    for (let i = 0; i < clip.length && p.length; i++) {
      const a = clip[i];
      const b = clip[(i + 1) % clip.length];
      p = clipBy(p, (q) => cross(a, b, q));
    }
    return p;
  }
  // Bounds first: a polygon squeezed to a segment or a point (a square that
  // just fits) has every point of its line on the left of its edges.
  function inPoly(poly, p) {
    const bb = boundsOf(poly);
    if (p.x < bb.l - 1e-6 || p.x > bb.r + 1e-6 || p.y < bb.t - 1e-6 || p.y > bb.b + 1e-6)
      return false;
    for (let i = 0; i < poly.length; i++) {
      if (cross(poly[i], poly[(i + 1) % poly.length], p) < -1e-6) return false;
    }
    return true;
  }
  // Strictly inside a box over the piece (a convex polygon): its edge still
  // belongs to the region.
  function underCover(k, p) {
    for (let i = 0; i < k.length; i++) {
      const a = k[i];
      const b = k[(i + 1) % k.length];
      if (cross(a, b, p) <= 1e-6 * Math.hypot(b.x - a.x, b.y - a.y)) return false;
    }
    return true;
  }
  const inRegionPiece = (piece, p) =>
    inPoly(piece.poly, p) && !piece.covers.some((k) => underCover(k, p));

  const edgesOf = (poly) => poly.map((a, i) => [a, poly[(i + 1) % poly.length]]);
  // Where segment ab meets segment pq, as a fraction of ab, or null.
  function meetAt(a, b, p, q) {
    const d = (b.x - a.x) * (q.y - p.y) - (b.y - a.y) * (q.x - p.x);
    if (Math.abs(d) < EPS) return null;
    const t = ((p.x - a.x) * (q.y - p.y) - (p.y - a.y) * (q.x - p.x)) / d;
    const u = ((p.x - a.x) * (b.y - a.y) - (p.y - a.y) * (b.x - a.x)) / d;
    return t >= -EPS && t <= 1 + EPS && u >= -EPS && u <= 1 + EPS ? t : null;
  }
  // The points where the outline of `poly` less the open `covers` can
  // turn: every corner, and every point where an edge of one meets an edge
  // of another. A non-empty compact set made of them has its extreme points
  // among these, so testing them decides whether anything is left, and
  // gives its bounding box.
  function outlinePoints(poly, covers) {
    const polys = [poly].concat(covers);
    const pts = [];
    for (const q of polys) for (const v of q) pts.push(v);
    for (let i = 0; i < polys.length; i++) {
      for (let j = i + 1; j < polys.length; j++) {
        for (const [a, b] of edgesOf(polys[i])) {
          for (const [p, q] of edgesOf(polys[j])) {
            const t = meetAt(a, b, p, q);
            if (t !== null) pts.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
          }
        }
      }
    }
    return pts;
  }
  // A point of the region's outline that has some of the region next to
  // it: the sides of a box over the piece belong to the region only where
  // the region goes on beyond them.
  const NEAR = 1e-4;
  const bordersRegion = (piece, p) =>
    [
      [NEAR, NEAR],
      [NEAR, -NEAR],
      [-NEAR, NEAR],
      [-NEAR, -NEAR]
    ].some(([dx, dy]) => inRegionPiece(piece, { x: p.x + dx, y: p.y + dy }));
  function pieceBounds(piece) {
    if (!piece.covers.length) return boundsOf(piece.poly);
    if (piece.bounds !== undefined) return piece.bounds;
    let l = Infinity;
    let t = Infinity;
    let r = -Infinity;
    let b = -Infinity;
    for (const p of outlinePoints(piece.poly, piece.covers)) {
      if (!inRegionPiece(piece, p) || !bordersRegion(piece, p)) continue;
      if (p.x < l) l = p.x;
      if (p.x > r) r = p.x;
      if (p.y < t) t = p.y;
      if (p.y > b) b = p.y;
    }
    piece.bounds = l <= r && t <= b ? { l, t, r, b } : null;
    return piece.bounds;
  }
  // The convex hull of a set of points, with a positive signed area.
  function hull(points) {
    const pts = points.slice().sort((p, q) => p.x - q.x || p.y - q.y);
    const half = (list) => {
      const out = [];
      for (const p of list) {
        while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], p) <= 0)
          out.pop();
        out.push(p);
      }
      out.pop();
      return out;
    };
    return half(pts).concat(half(pts.slice().reverse()));
  }
  // Whether a square of side s fits in the piece: some top-left corner p
  // has all four corners of the square in the polygon (which, being convex,
  // then holds the square), and the square clear of every box over it,
  // which holds where p is outside the box grown up and left by s.
  function squareFits(piece, s) {
    let f = piece.poly;
    for (const [dx, dy] of [
      [s, 0],
      [0, s],
      [s, s]
    ]) {
      if (!f.length) return false;
      f = clipToPoly(
        f,
        piece.poly.map((q) => ({ x: q.x - dx, y: q.y - dy }))
      );
    }
    if (!f.length) return false;
    const grown = piece.covers.map((k) =>
      hull(
        k.flatMap((v) => [
          v,
          { x: v.x - s, y: v.y },
          { x: v.x, y: v.y - s },
          { x: v.x - s, y: v.y - s }
        ])
      )
    );
    for (const p of outlinePoints(f, grown)) {
      if (inPoly(f, p) && !grown.some((k) => underCover(k, p))) return true;
    }
    return false;
  }
  // The largest square in a piece where it needs no search, else null: a
  // rectangle's smaller side, or for a whole box, rounded or turned, which
  // is symmetric about its centre as the largest square in it is, the side
  // whose corners, centred there, stay inside every edge (the centre's
  // distance from an edge over the edge's |dx| + |dy| bounds the half-side).
  function plainSquare(piece) {
    if (piece.covers.length) return null;
    const bb = boundsOf(piece.poly);
    const hi = Math.min(bb.r - bb.l, bb.b - bb.t);
    if (piece.rect) return hi;
    if (!piece.symmetric) return null;
    const c = { x: (bb.l + bb.r) / 2, y: (bb.t + bb.b) / 2 };
    let h = Infinity;
    for (const [a, b] of edgesOf(piece.poly)) {
      const run = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
      if (run > EPS) h = Math.min(h, cross(a, b, c) / run);
    }
    return Math.max(0, Math.min(hi, 2 * h));
  }
  function largestSquare(piece) {
    const plain = plainSquare(piece);
    if (plain !== null) return plain;
    const bb = boundsOf(piece.poly);
    const hi = Math.min(bb.r - bb.l, bb.b - bb.t);
    if (!(hi > 0)) return 0;
    if (squareFits(piece, hi)) return hi;
    let lo = 0;
    let top = hi;
    while (top - lo > 1e-5) {
      const mid = (lo + top) / 2;
      if (squareFits(piece, mid)) lo = mid;
      else top = mid;
    }
    return lo;
  }
  function segmentDistance(c, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = dx * dx + dy * dy;
    let t = len > 0 ? ((c.x - a.x) * dx + (c.y - a.y) * dy) / len : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(c.x - (a.x + dx * t), c.y - (a.y + dy * t));
  }
  // How far point c is from the piece: 0 inside it, else the distance to
  // the nearest part of its outline (the polygon's edges and the sides of
  // the boxes over it, where they bound what is left).
  function pieceDistance(piece, c) {
    if (inRegionPiece(piece, c)) return 0;
    if (!piece.covers.length) {
      let near = Infinity;
      for (const [a, b] of edgesOf(piece.poly)) near = Math.min(near, segmentDistance(c, a, b));
      return near;
    }
    const polys = [piece.poly].concat(piece.covers);
    let best = Infinity;
    for (let i = 0; i < polys.length; i++) {
      for (const [a, b] of edgesOf(polys[i])) {
        const ts = [0, 1];
        for (let j = 0; j < polys.length; j++) {
          if (j === i) continue;
          for (const [p, q] of edgesOf(polys[j])) {
            const t = meetAt(a, b, p, q);
            if (t !== null && t > EPS && t < 1 - EPS) ts.push(t);
          }
        }
        ts.sort((x, y) => x - y);
        const at = (t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
        for (let k = 0; k + 1 < ts.length; k++) {
          if (ts[k + 1] - ts[k] < EPS) continue;
          if (!inRegionPiece(piece, at((ts[k] + ts[k + 1]) / 2))) continue;
          const d = segmentDistance(c, at(ts[k]), at(ts[k + 1]));
          if (d < best) best = d;
        }
      }
    }
    return best;
  }

  // The 2D linear part of the transforms on el and its ancestors, as
  // { a, b, c, d } (x' = a x + c y, y' = b x + d y), or null for a 3D one.
  // The individual translate, rotate and scale properties apply before
  // transform; translations move a box without changing its shape.
  const __linearCache = new WeakMap();
  const IDENTITY = { a: 1, b: 0, c: 0, d: 1 };
  const mul = (m, n) =>
    m &&
    n && {
      a: m.a * n.a + m.c * n.b,
      b: m.b * n.a + m.d * n.b,
      c: m.a * n.c + m.c * n.d,
      d: m.b * n.c + m.d * n.d
    };
  function angleOf(token) {
    const m = /^(-?[\d.]+(?:e-?\d+)?)(deg|rad|grad|turn)$/.exec(String(token || ''));
    if (!m) return null;
    const v = Number(m[1]);
    if (m[2] === 'rad') return v;
    if (m[2] === 'grad') return (v * Math.PI) / 200;
    if (m[2] === 'turn') return v * 2 * Math.PI;
    return (v * Math.PI) / 180;
  }
  function ownLinear(cs) {
    let m = IDENTITY;
    const rotate = String((cs && cs.rotate) || 'none').trim();
    if (rotate && rotate !== 'none') {
      const parts = rotate.split(/\s+/);
      const angle = angleOf(parts[parts.length - 1]);
      const axis = parts.slice(0, -1);
      const aboutZ =
        !axis.length ||
        (axis.length === 1 && axis[0] === 'z') ||
        (axis.length === 3 && px(axis[0]) === 0 && px(axis[1]) === 0 && px(axis[2]) > 0);
      if (angle === null || !aboutZ) return null;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      m = mul(m, { a: cos, b: sin, c: -sin, d: cos });
    }
    const scale = String((cs && cs.scale) || 'none').trim();
    if (scale && scale !== 'none') {
      const f = scale.split(/\s+/).map((v) => (/%$/.test(v) ? px(v) / 100 : px(v)));
      m = mul(m, { a: f[0], b: 0, c: 0, d: f.length > 1 ? f[1] : f[0] });
    }
    const t = String((cs && cs.transform) || 'none').trim();
    if (t && t !== 'none') {
      const v = (/^matrix(3d)?\(([^)]*)\)$/.exec(t) || [])[2];
      if (!v) return null;
      const n = v.split(',').map(Number);
      if (n.length === 6) m = mul(m, { a: n[0], b: n[1], c: n[2], d: n[3] });
      else if (n.length === 16) {
        const flat = [2, 3, 6, 7, 8, 9, 11, 14].every((i) => Math.abs(n[i]) < 1e-9);
        if (!flat || Math.abs(n[10] - 1) > 1e-9 || Math.abs(n[15] - 1) > 1e-9) return null;
        m = mul(m, { a: n[0], b: n[1], c: n[4], d: n[5] });
      } else return null;
    }
    return m;
  }
  // Transforms apply to boxes, not to the fragments of an inline box.
  const isInlineFlow = (cs) => !!cs && /^inline$|^ruby/.test(String(cs.display || ''));
  function linearOf(el) {
    if (!el || dom.nodeType(el) !== 1) return IDENTITY;
    if (__linearCache.has(el)) return __linearCache.get(el);
    const cs = getStyle(el);
    const own = isInlineFlow(cs) ? IDENTITY : ownLinear(cs);
    const m = mul(linearOf(helpers.composedParent(el)), own);
    __linearCache.set(el, m || null);
    return m || null;
  }
  const isAxisAligned = (m) => !!m && Math.abs(m.b) < 1e-9 && Math.abs(m.c) < 1e-9;

  // The containing block a box is clipped through (helpers.containingBlockOf):
  // its parent box in flow, the nearest positioned ancestor when absolutely
  // positioned, and null for the viewport.
  const containingBlockOf = (el) => helpers.containingBlockOf(el);
  const __boxCache = new WeakMap();
  function boxOf(el) {
    if (__boxCache.has(el)) return __boxCache.get(el);
    const r = getBcr(el);
    __boxCache.set(el, r);
    return r;
  }
  // What a's overflow (or contain: paint) clips the boxes inside it to: its
  // padding box, on the axes it clips. The root's and the body's overflow
  // belong to the viewport.
  function overflowClip(a, cs) {
    const tag = String(dom.localName(a) || '').toLowerCase();
    if (!cs || tag === 'html' || tag === 'body') return null;
    const paint = /\b(paint|strict|content)\b/.test(String(cs.contain || ''));
    const clipX = paint || (!!cs.overflowX && cs.overflowX !== 'visible');
    const clipY = paint || (!!cs.overflowY && cs.overflowY !== 'visible');
    if (!clipX && !clipY) return null;
    const r = boxOf(a);
    if (!r) return null;
    const m = linearOf(a);
    const sx = isAxisAligned(m) ? Math.abs(m.a) : 0;
    const sy = isAxisAligned(m) ? Math.abs(m.d) : 0;
    return {
      l: clipX ? r.left + px(cs.borderLeftWidth) * sx : -Infinity,
      t: clipY ? r.top + px(cs.borderTopWidth) * sy : -Infinity,
      r: clipX ? r.left + r.width - px(cs.borderRightWidth) * sx : Infinity,
      b: clipY ? r.top + r.height - px(cs.borderBottomWidth) * sy : Infinity
    };
  }
  // What clip-path: inset() and clip: rect() clip a and everything inside
  // it to. Other shapes are left out.
  function lengthIn(v, ref) {
    const s = String(v || '').trim();
    return /%$/.test(s) ? (px(s) / 100) * ref : px(s);
  }
  function subtreeClipOf(a, cs) {
    if (!cs) return null;
    const cp = String(cs.clipPath || 'none').trim();
    const clip = String(cs.clip || 'auto').trim();
    if (cp === 'none' && clip === 'auto') return null;
    const r = boxOf(a);
    if (!r || !isAxisAligned(linearOf(a))) return null;
    let c = null;
    const inset = /^inset\(([^)]*)\)(?:\s+border-box)?$/.exec(cp);
    if (inset) {
      const v = inset[1]
        .split(/\s+round\s+/)[0]
        .trim()
        .split(/\s+/);
      const [t, rt, b, l] = [v[0], v[1] || v[0], v[2] || v[0], v[3] || v[1] || v[0]];
      c = {
        l: r.left + lengthIn(l, r.width),
        t: r.top + lengthIn(t, r.height),
        r: r.left + r.width - lengthIn(rt, r.width),
        b: r.top + r.height - lengthIn(b, r.height)
      };
    }
    const pos = String(cs.position || '');
    const rect = /^rect\(([^)]*)\)$/.exec(clip);
    if (rect && (pos === 'absolute' || pos === 'fixed')) {
      const v = rect[1].split(/\s*,\s*|\s+/);
      const side = (s, auto) => (s === 'auto' ? auto : px(s));
      const k = {
        l: r.left + side(v[3], 0),
        t: r.top + side(v[0], 0),
        r: r.left + side(v[1], r.width),
        b: r.top + side(v[2], r.height)
      };
      c = c ? meet(c, k) : k;
    }
    return c;
  }
  // Past the last containing block: the page, which scrolls to anything
  // after its start but to nothing before it (as with a skip link at
  // left: -9999px), or, for a fixed box, the viewport. A right-to-left page
  // scrolls left of its start, so only its top bounds it here.
  function outerClip(cs) {
    const view = dom.defaultView(document);
    if (!view) return NO_CLIP;
    if (cs && cs.position === 'fixed')
      return { l: 0, t: 0, r: view.innerWidth, b: view.innerHeight };
    const rootCs = getStyle(dom.documentElement(document));
    const rtl = !!rootCs && rootCs.direction === 'rtl';
    return {
      l: rtl ? -Infinity : -(Number(view.scrollX) || 0),
      t: -(Number(view.scrollY) || 0),
      r: Infinity,
      b: Infinity
    };
  }
  const __cbClipCache = new WeakMap();
  // The clip of everything whose containing block chain runs through a.
  function chainClip(a) {
    if (__cbClipCache.has(a)) return __cbClipCache.get(a);
    __cbClipCache.set(a, NO_CLIP);
    const cs = getStyle(a);
    const own = overflowClip(a, cs);
    const cb = containingBlockOf(a);
    const up = cb ? chainClip(cb) : outerClip(cs);
    const c = own ? meet(own, up) : up;
    __cbClipCache.set(a, c);
    return c;
  }
  const __subtreeClipCache = new WeakMap();
  function inheritedClip(a) {
    if (!a || dom.nodeType(a) !== 1) return NO_CLIP;
    if (__subtreeClipCache.has(a)) return __subtreeClipCache.get(a);
    const own = subtreeClipOf(a, getStyle(a));
    const up = inheritedClip(helpers.composedParent(a));
    const c = own ? meet(own, up) : up;
    __subtreeClipCache.set(a, c);
    return c;
  }
  function clipOf(el) {
    const cs = getStyle(el);
    const cb = containingBlockOf(el);
    return meet(inheritedClip(el), cb ? chainClip(cb) : outerClip(cs));
  }

  // The border box as a polygon: its rounded corners (see roundedRect)
  // under its transforms. null where the box is better left as its bounding box.
  function radiiOf(cs, w, h) {
    const corner = (v) => {
      const parts = String(v || '0')
        .trim()
        .split(/\s+/);
      return [lengthIn(parts[0], w), lengthIn(parts[1] || parts[0], h)];
    };
    const r = [
      corner(cs.borderTopLeftRadius),
      corner(cs.borderTopRightRadius),
      corner(cs.borderBottomRightRadius),
      corner(cs.borderBottomLeftRadius)
    ];
    // Radii that overlap are scaled down together (CSS Backgrounds 3).
    const f = Math.min(
      1,
      w / (r[0][0] + r[1][0] || Infinity),
      w / (r[3][0] + r[2][0] || Infinity),
      h / (r[0][1] + r[3][1] || Infinity),
      h / (r[1][1] + r[2][1] || Infinity)
    );
    return r.map(([x, y]) => [Math.max(0, x * f), Math.max(0, y * f)]);
  }
  // Each corner's arc as 8 chords, inside it by at most 0.5% of the radius.
  // A square in a round shape touches it at 45 degrees, where a chord ends
  // on the arc, so the square is exact.
  const ARC_STEPS = 8;
  function roundedRect(w, h, radii) {
    const pts = [];
    const corners = [
      [radii[0], radii[0][0], radii[0][1], Math.PI],
      [radii[1], w - radii[1][0], radii[1][1], 1.5 * Math.PI],
      [radii[2], w - radii[2][0], h - radii[2][1], 0],
      [radii[3], radii[3][0], h - radii[3][1], 0.5 * Math.PI]
    ];
    for (const [[rx, ry], cx, cy, start] of corners) {
      if (!(rx > 0 && ry > 0)) {
        pts.push({ x: cx, y: cy });
        continue;
      }
      for (let i = 0; i <= ARC_STEPS; i++) {
        const t = start + (i / ARC_STEPS) * (Math.PI / 2);
        pts.push({ x: cx + rx * Math.cos(t), y: cy + ry * Math.sin(t) });
      }
    }
    return pts;
  }
  function boxPolygon(el, cs, r) {
    const m = linearOf(el);
    if (!m) return null;
    if (isAxisAligned(m)) {
      const sx = Math.abs(m.a);
      const sy = Math.abs(m.d);
      if (!(sx > 0 && sy > 0)) return null;
      const radii = radiiOf(cs, r.width / sx, r.height / sy).map(([x, y]) => [x * sx, y * sy]);
      if (radii.every(([x, y]) => !(x > 0 && y > 0))) return null;
      return roundedRect(r.width, r.height, radii).map((p) => ({
        x: r.left + p.x,
        y: r.top + p.y
      }));
    }
    // Rotated or skewed: the untransformed border box, from the used size,
    // must agree with the bounding box the browser reports.
    const border = cs.boxSizing === 'border-box';
    const w =
      px(cs.width) +
      (border
        ? 0
        : px(cs.paddingLeft) +
          px(cs.paddingRight) +
          px(cs.borderLeftWidth) +
          px(cs.borderRightWidth));
    const h =
      px(cs.height) +
      (border
        ? 0
        : px(cs.paddingTop) +
          px(cs.paddingBottom) +
          px(cs.borderTopWidth) +
          px(cs.borderBottomWidth));
    if (!(w > 0 && h > 0)) return null;
    const local = roundedRect(w, h, radiiOf(cs, w, h));
    const poly = local.map((p) => ({ x: m.a * p.x + m.c * p.y, y: m.b * p.x + m.d * p.y }));
    const bb = boundsOf(
      rectPoly(0, 0, w, h).map((p) => ({ x: m.a * p.x + m.c * p.y, y: m.b * p.x + m.d * p.y }))
    );
    if (Math.abs(bb.r - bb.l - r.width) > 0.5 || Math.abs(bb.b - bb.t - r.height) > 0.5)
      return null;
    return poly.map((p) => ({ x: p.x - bb.l + r.left, y: p.y - bb.t + r.top }));
  }

  // Every element's border box, in cells, to find the boxes over a
  // target. Built once a scan needs it; null without a layout (jsdom).
  // A box that would fill more than WIDE_BOX cells (the root, the body, a
  // page's main column) is kept in a list of its own, which every lookup
  // checks.
  const COVER_CELL = 64;
  const WIDE_BOX = 256;
  let __boxIndex;
  function boxIndex() {
    if (__boxIndex !== undefined) return __boxIndex;
    __boxIndex = null;
    try {
      const rootRects = dom.getClientRects(dom.documentElement(document));
      if (!rootRects || !rootRects.length) return null;
    } catch {
      return null;
    }
    const boxes = [];
    const cells = new Map();
    const wide = [];
    const roots = [document];
    for (let ri = 0; ri < roots.length; ri++) {
      let all;
      try {
        all = dom.querySelectorAll(roots[ri], '*');
      } catch {
        continue;
      }
      for (const node of all) {
        const sr = dom.shadowRoot(node);
        if (sr) roots.push(sr);
        const r = boxOf(node);
        if (!r || !(r.width > 0) || !(r.height > 0)) continue;
        const i = boxes.length;
        boxes.push({ el: node, r });
        const x0 = Math.floor(r.left / COVER_CELL);
        const y0 = Math.floor(r.top / COVER_CELL);
        const x1 = Math.floor((r.left + r.width) / COVER_CELL);
        const y1 = Math.floor((r.top + r.height) / COVER_CELL);
        if ((x1 - x0 + 1) * (y1 - y0 + 1) > WIDE_BOX) {
          wide.push(i);
          continue;
        }
        for (let cx = x0; cx <= x1; cx++) {
          for (let cy = y0; cy <= y1; cy++) {
            const key = cx + ',' + cy;
            const list = cells.get(key);
            if (list) list.push(i);
            else cells.set(key, [i]);
          }
        }
      }
    }
    __boxIndex = { boxes, cells, wide };
    return __boxIndex;
  }
  // Whether a box can take the pointer from what is under it, once per
  // element: drawn, not passed through, and not fixed or sticky.
  const __takesPointerCache = new WeakMap();
  function takesPointer(o) {
    if (__takesPointerCache.has(o)) return __takesPointerCache.get(o);
    let takes = false;
    const cs = getStyle(o);
    if (
      cs &&
      cs.pointerEvents !== 'none' &&
      cs.visibility !== 'hidden' &&
      cs.visibility !== 'collapse' &&
      !helpers.contrast.isPinned(o)
    ) {
      takes = true;
      try {
        if (typeof dom.get(o, 'checkVisibility') === 'function' && !dom.checkVisibility(o))
          takes = false;
      } catch {}
    }
    __takesPointerCache.set(o, takes);
    return takes;
  }
  function isComposedInside(node, container) {
    for (let cur = node, i = 0; cur && i < 100000; cur = helpers.composedParent(cur), i++) {
      if (cur === container) return true;
    }
    return false;
  }
  // The boxes painted over el within `bb` that a pointer would hit instead:
  // not its ancestors, nor its own content unless that is a target itself;
  // not fixed or sticky boxes, which cover it at one scroll position only;
  // nothing a pointer passes through (pointer-events: none, hidden).
  function coversOf(el, bb) {
    const index = boxIndex();
    if (!index) return [];
    const seen = new Set();
    const out = [];
    const above = new Set();
    for (let a = el, i = 0; a && i < 100000; a = helpers.composedParent(a), i++) above.add(a);
    const x1 = Math.floor(bb.r / COVER_CELL);
    const y1 = Math.floor(bb.b / COVER_CELL);
    const lists = [index.wide];
    for (let cx = Math.floor(bb.l / COVER_CELL); cx <= x1; cx++) {
      for (let cy = Math.floor(bb.t / COVER_CELL); cy <= y1; cy++) {
        const list = index.cells.get(cx + ',' + cy);
        if (list) lists.push(list);
      }
    }
    for (const list of lists) {
      for (const i of list) {
        if (seen.has(i)) continue;
        seen.add(i);
        const { el: o, r } = index.boxes[i];
        if (above.has(o)) continue;
        if (
          r.left >= bb.r - EPS ||
          r.left + r.width <= bb.l + EPS ||
          r.top >= bb.b - EPS ||
          r.top + r.height <= bb.t + EPS
        )
          continue;
        if (!takesPointer(o)) continue;
        // el's own content is part of it, unless it is a target itself.
        const inside =
          dom.contains(el, o) ||
          (dom.getRootNode(o) !== dom.getRootNode(el) && isComposedInside(o, el));
        if (inside && !(isCandidate(o) && isPointerReachable(o))) continue;
        if (!(helpers.contrast.comparePaintOrder(o, el) > 0)) continue;
        const cs = getStyle(o);
        // Its own shape: a rotated or rounded box covers only that.
        const clip = clipOf(o);
        const shapes = isInlineFlow(cs)
          ? getRects(o).map((q) => rectPoly(q.left, q.top, q.left + q.width, q.top + q.height))
          : [
              (dom.namespaceURI(o) === HTML_NS && boxPolygon(o, cs, r)) ||
                rectPoly(r.left, r.top, r.left + r.width, r.top + r.height)
            ];
        for (const shape of shapes) {
          const k = clipToRect(oriented(shape), clip);
          if (k.length >= 3 && Math.abs(area(k)) > EPS) out.push(oriented(k));
        }
      }
    }
    return out;
  }

  // The rectangles of a box with display: contents: what its content
  // lays out.
  function contentsRects(el) {
    try {
      const range = dom.createRange(document);
      range.selectNodeContents(el);
      return Array.from(dom.getClientRects(range));
    } catch {
      return [];
    }
  }

  // The elements inside el that are not targets themselves, up to 500.
  const __contentCache = new WeakMap();
  function contentOf(el) {
    let list = __contentCache.get(el);
    if (!list) {
      try {
        list = Array.from(dom.querySelectorAll(el, '*'))
          .slice(0, 500)
          .filter((d) => !isCandidate(d));
      } catch {
        list = [];
      }
      __contentCache.set(el, list);
    }
    return list;
  }

  // The region of el a pointer can hit, as { pieces, bounds, square,
  // rectangle }, or null when nothing of it is left.
  function regionOf(el) {
    const cs = getStyle(el);
    const clip = clipOf(el);
    const polys = [];
    const asRect = (q) => {
      const p = clipToRect(rectPoly(q.left, q.top, q.left + q.width, q.top + q.height), clip);
      if (p.length >= 3 && Math.abs(area(p)) > EPS) polys.push({ poly: oriented(p), rect: true });
    };
    if (cs && cs.display === 'contents') {
      for (const q of contentsRects(el)) asRect(q);
    } else {
      if (isInlineFlow(cs)) {
        for (const q of getRects(el)) asRect(q);
      } else {
        const r = boxOf(el);
        if (!r) return null;
        const shaped = dom.namespaceURI(el) === HTML_NS && cs ? boxPolygon(el, cs, r) : null;
        if (shaped) {
          const bb = boundsOf(shaped);
          const whole = bb.l >= clip.l && bb.t >= clip.t && bb.r <= clip.r && bb.b <= clip.b;
          const p = whole ? shaped : clipToRect(oriented(shaped), clip);
          if (p.length >= 3 && Math.abs(area(p)) > EPS)
            polys.push({ poly: oriented(p), rect: false, symmetric: whole });
        } else asRect(r);
      }
      // Content sticking out of the box takes the pointer for el too, as an
      // image does out of the line of the link around it.
      const own = polys.slice();
      for (const d of contentOf(el)) {
        const dr = boxOf(d);
        if (!dr || !(dr.width > 0) || !(dr.height > 0)) continue;
        const corners = rectPoly(dr.left, dr.top, dr.left + dr.width, dr.top + dr.height);
        if (own.some((o) => corners.every((p) => inPoly(o.poly, p)))) continue;
        const dcs = getStyle(d);
        if (!dcs || dcs.pointerEvents === 'none' || dcs.visibility !== 'visible') continue;
        const dclip = clipOf(d);
        for (const q of isInlineFlow(dcs) ? getRects(d) : [dr]) {
          const p = clipToRect(rectPoly(q.left, q.top, q.left + q.width, q.top + q.height), dclip);
          if (p.length >= 3 && Math.abs(area(p)) > EPS)
            polys.push({ poly: oriented(p), rect: true });
        }
      }
    }
    const pieces = [];
    for (const piece of polys) {
      const bb = boundsOf(piece.poly);
      piece.covers = coversOf(el, bb);
      if (piece.covers.length && !pieceBounds(piece)) continue;
      pieces.push(piece);
    }
    if (!pieces.length) return null;
    let bounds = null;
    for (const piece of pieces) {
      const b = pieceBounds(piece);
      bounds = bounds
        ? {
            l: Math.min(bounds.l, b.l),
            t: Math.min(bounds.t, b.t),
            r: Math.max(bounds.r, b.r),
            b: Math.max(bounds.b, b.b)
          }
        : b;
    }
    if (!(bounds.r - bounds.l > 0) || !(bounds.b - bounds.t > 0)) return null;
    return {
      pieces,
      bounds,
      rectangle: pieces.length === 1 && pieces[0].rect && !pieces[0].covers.length
    };
  }
  // The side of the largest square in the region, searched for only when
  // asked: deciding whether 24 fits takes one test.
  function squareOf(region) {
    if (region.square === undefined) {
      let s = 0;
      for (const piece of region.pieces) s = Math.max(s, largestSquare(piece));
      region.square = s;
    }
    return region.square;
  }
  // At least the largest square, without a search.
  function squareBound(region) {
    let s = 0;
    for (const piece of region.pieces) {
      const plain = plainSquare(piece);
      const bb = boundsOf(piece.poly);
      s = Math.max(s, plain !== null ? plain : Math.min(bb.r - bb.l, bb.b - bb.t));
    }
    return s;
  }
  // Whether a 24 by 24 square fits in some piece: exactly in a rectangle,
  // and within a thousandth of a pixel where the region is worked out by
  // search rather than read off a box.
  function fitsMin(region) {
    if (region.fits === undefined) {
      region.fits = region.pieces.some((piece) => {
        const plain = plainSquare(piece);
        if (plain !== null) return plain >= (piece.rect ? MIN : MIN - 1e-3);
        return squareFits(piece, MIN - 1e-3);
      });
    }
    return region.fits;
  }
  function regionDistance(region, c) {
    let best = Infinity;
    for (const piece of region.pieces) best = Math.min(best, pieceDistance(piece, c));
    return best;
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
    if (!el || dom.nodeType(el) !== 1) return false;

    if (hasHiddenAttr(el)) return false;
    if (inInertSubtree(el)) return false;
    if (inClosedDetails(el)) return false;
    const cs = getStyle(el);
    // With display: contents, el has no box of its own, and its content is
    // what a pointer hits (#105).
    const contents = !!cs && cs.display === 'contents';
    // Under a hidden ancestor (display:none, hidden="until-found",
    // content-visibility:hidden): the element keeps a box in Chromium, but
    // nothing of it is drawn for a pointer to hit.
    try {
      if (
        !contents &&
        typeof dom.get(el, 'checkVisibility') === 'function' &&
        !dom.checkVisibility(el)
      )
        return false;
    } catch {}
    if (helpers.isHiddenContent && helpers.isHiddenContent(el)) return false;

    // Not operable => exclude
    try {
      if (typeof dom.get(el, 'matches') === 'function' && dom.matches(el, ':disabled'))
        return false;
    } catch {}

    // aria-disabled elements are typically treated as not operable
    try {
      const ad =
        dom.get(el, 'getAttribute') &&
        String(dom.getAttribute(el, 'aria-disabled') || '')
          .trim()
          .toLowerCase();
      if (ad === 'true') return false;
    } catch {}

    const rects = contents ? contentsRects(el) : getRects(el);
    if (!rects || rects.length === 0) return false;

    const display = cs && cs.display ? String(cs.display) : 'block';
    const visibility = cs && cs.visibility ? String(cs.visibility) : 'visible';
    const contentVisibility = cs && cs.contentVisibility ? String(cs.contentVisibility) : 'visible';
    const pointerEvents = cs && cs.pointerEvents ? String(cs.pointerEvents) : 'auto';

    if (display === 'none') return false;
    if (visibility === 'hidden' || visibility === 'collapse') return false;
    if (contentVisibility === 'hidden') return false;
    if (pointerEvents === 'none') return false;
    if (isClippedAway(el)) return false;

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
      if (document && typeof dom.get(document, 'elementFromPoint') === 'function')
        return dom.elementFromPoint(document, x, y);
    } catch {}
    return null;
  }

  // Bidirectional containment check: true when `a` and `b` are the same
  // element, or either one is an ancestor of the other. A nested-interactive
  // pattern (e.g. a small <button> inside a wrapping <a href>, or vice
  // versa) is a single visual/interactive region, not two independently
  // placed targets. The spacing exception's "does the circle intersect
  // ANOTHER target" language is about separate targets, not an element and
  // its own container. (Nested interactive controls are their own,
  // separately-flagged anti-pattern, nested-interactive-controls-absent,
  // not a target-size spacing concern.)
  function isRelated(a, b) {
    try {
      if (!a || !b) return false;
      if (a === b) return true;
      if (typeof dom.get(a, 'contains') === 'function' && dom.contains(a, b)) return true;
      if (typeof dom.get(b, 'contains') === 'function' && dom.contains(b, a)) return true;
      return false;
    } catch {
      return false;
    }
  }

  const NATIVE_CANDIDATE_SELECTOR = 'button, summary, a[href], area[href], input, select, textarea';
  // role~= matches the token anywhere in the fallback list, so the resolved
  // role is checked below (role="tab button" is a tab, not a target here).
  const CANDIDATE_SELECTOR = `${NATIVE_CANDIDATE_SELECTOR}, [role~="button" i], [role~="link" i]`;

  function isCandidate(el) {
    try {
      if (
        typeof dom.get(el, 'matches') === 'function' &&
        dom.matches(el, NATIVE_CANDIDATE_SELECTOR)
      )
        return true;
    } catch {}
    const role = getExplicitRole(el);
    return role === 'button' || role === 'link';
  }

  // --- candidate collection ---
  const candidates = qsa(CANDIDATE_SELECTOR).filter(isCandidate);

  const applicable = [];
  for (const el of candidates) {
    if (isPointerReachable(el)) applicable.push(el);
  }

  if (applicable.length === 0) {
    return { ruleId: RULE_ID, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  // A target's region, its bounding box (`rect`), on whose centre the
  // spacing circle sits, and the largest square that fits in it (`square`),
  // or null for a target with nothing left to hit, covered or clipped away.
  function measure(el) {
    let region;
    try {
      region = regionOf(el);
    } catch {
      region = null;
    }
    if (!region) return null;
    const { l, t, r, b } = region.bounds;
    const w = r - l;
    const h = b - t;
    if (!Number.isFinite(w) || !Number.isFinite(h)) return null;
    if (w <= 0 || h <= 0) return null;
    return {
      el,
      region,
      get square() {
        return squareOf(region);
      },
      rect: { left: l, top: t, width: w, height: h, right: r, bottom: b },
      center: centerOfRect({ left: l, top: t, width: w, height: h })
    };
  }

  // Where a target can be hit at most: its own boxes (with display:
  // contents, its content's) and those of the content inside it. Its region
  // lies within, since clips and the boxes over it only take away. Cheap
  // next to the region, it tells which targets need one.
  function extentOf(el) {
    const cs = getStyle(el);
    const rects =
      cs && cs.display === 'contents'
        ? contentsRects(el)
        : isInlineFlow(cs)
          ? getRects(el)
          : [boxOf(el)];
    for (const d of contentOf(el)) rects.push(boxOf(d));
    let e = null;
    for (const q of rects) {
      if (!q || !(q.width > 0) || !(q.height > 0)) continue;
      const k = { l: q.left, t: q.top, r: q.left + q.width, b: q.top + q.height };
      e = e
        ? {
            l: Math.min(e.l, k.l),
            t: Math.min(e.t, k.t),
            r: Math.max(e.r, k.r),
            b: Math.max(e.b, k.b)
          }
        : k;
    }
    return e;
  }

  // Each target in scope, with its extent. Under a scoped scan the targets
  // judged are the ones in scope, but their neighbours are whatever the page
  // puts next to them: a target crowded by a button just outside the scope
  // fails the spacing exception all the same. So the neighbours come from
  // the whole document (light DOM; a neighbour in a shadow root outside the
  // scope is not found).
  const entry = (el, inScope) => {
    const extent = extentOf(el);
    return extent && { el, extent, inScope, exempt: isInlineTextExceptionTarget(el) };
  };
  const entries = [];
  for (const el of applicable) {
    const e = entry(el, true);
    if (e) entries.push(e);
  }
  if (
    helpers &&
    typeof helpers.isWholeDocumentScope === 'function' &&
    !helpers.isWholeDocumentScope()
  ) {
    const inScope = new Set(applicable);
    let all;
    try {
      all = Array.from(dom.querySelectorAll(document, CANDIDATE_SELECTOR));
    } catch {
      all = [];
    }
    for (const el of all) {
      if (inScope.has(el) || !isCandidate(el) || !isPointerReachable(el)) continue;
      const e = entry(el, false);
      if (e) entries.push(e);
    }
  }

  // Only a target with another one within 24px of it, extent to extent, can
  // fail, or be what another one fails against: the spacing circle reaches
  // 12px from a centre inside the extent, and two undersized targets'
  // circles meet only with their centres under 24px apart. Those targets'
  // regions are worked out; any other passes whatever its size, and is
  // measured only if the margin asks. Inline links in text are left out of
  // both sides, as the spacing check leaves them.
  const GRID = 64;
  function gridOf(list, boxOfEntry) {
    const cells = new Map(); // "cx,cy" -> entry[]
    for (const it of list) {
      const q = boxOfEntry(it);
      const x1 = Math.floor(q.r / GRID);
      const y1 = Math.floor(q.b / GRID);
      for (let cx = Math.floor(q.l / GRID); cx <= x1; cx++) {
        for (let cy = Math.floor(q.t / GRID); cy <= y1; cy++) {
          const key = cx + ',' + cy;
          const bucket = cells.get(key);
          if (bucket) bucket.push(it);
          else cells.set(key, [it]);
        }
      }
    }
    return cells;
  }
  function around(cells, q, reach) {
    const out = new Set();
    const x1 = Math.floor((q.r + reach) / GRID);
    const y1 = Math.floor((q.b + reach) / GRID);
    for (let cx = Math.floor((q.l - reach) / GRID); cx <= x1; cx++) {
      for (let cy = Math.floor((q.t - reach) / GRID); cy <= y1; cy++) {
        for (const it of cells.get(cx + ',' + cy) || []) out.add(it);
      }
    }
    return out;
  }
  const gap = (p, q) =>
    Math.hypot(Math.max(0, p.l - q.r, q.l - p.r), Math.max(0, p.t - q.b, q.t - p.b));
  const spaced = entries.filter((e) => !e.exempt);
  const extentCells = gridOf(spaced, (e) => e.extent);
  for (const e of spaced) {
    for (const f of around(extentCells, e.extent, MIN)) {
      if (f === e || isRelated(e.el, f.el) || gap(e.extent, f.extent) >= MIN) continue;
      e.near = true;
      break;
    }
  }
  for (const e of entries) if (e.near) e.item = measure(e.el);

  const items = entries.filter((e) => e.inScope && (!e.near || e.item));
  if (items.length === 0) {
    // had “applicable” but no measurable geometry
    return { ruleId: RULE_ID, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  // No 24 by 24 square fits in the target.
  const isUndersized = (it) => !fitsMin(it.region);
  const undersized = items.filter((e) => e.item && isUndersized(e.item)).map((e) => e.item);

  // Spatial grid over the measured neighbours' bounding boxes, so
  // hasSpacingConflict looks only at the neighbours near a target. A
  // neighbour can conflict only if its region comes within 12px of the
  // target's centre, or, undersized, its centre within 24px; both lie in its
  // bounding box, so the cells within 24px of the centre hold every
  // neighbour that can. This changes performance only, never which targets
  // conflict.
  const neighbours = entries.filter((e) => e.item).map((e) => e.item);
  const regionCells = gridOf(neighbours, (it) => ({
    l: it.rect.left,
    t: it.rect.top,
    r: it.rect.right,
    b: it.rect.bottom
  }));
  function nearbyItems(center) {
    return around(regionCells, { l: center.cx, t: center.cy, r: center.cx, b: center.cy }, MIN);
  }

  // Whether the browser reports something else on top of `other` everywhere
  // near `target`: a link under a fixed cookie banner, say, which a pointer
  // near the banner's own button cannot reach. Points in `other`'s box within
  // 24px of the target's centre are hit-tested. A point outside the viewport
  // hits nothing, which proves nothing, so `other` counts as covered only when
  // a point did hit something and no point hit `other`.
  function isCoveredNear(other, target) {
    const r = other.rect;
    const x0 = Math.max(r.left, target.center.cx - MIN);
    const x1 = Math.min(r.right, target.center.cx + MIN);
    const y0 = Math.max(r.top, target.center.cy - MIN);
    const y1 = Math.min(r.bottom, target.center.cy + MIN);
    if (x1 <= x0 || y1 <= y0) return false;
    let answered = false;
    for (const fx of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      for (const fy of [0.1, 0.3, 0.5, 0.7, 0.9]) {
        const hit = elementFromPoint(x0 + (x1 - x0) * fx, y0 + (y1 - y0) * fy);
        if (!hit) continue;
        answered = true;
        try {
          if (hit === other.el || dom.contains(other.el, hit)) return false;
        } catch {
          return false;
        }
      }
    }
    return answered;
  }

  // --- spacing evaluation ---
  // WCAG 2.5.8's spacing exception, exactly: the 24px circle centred on the
  // target's region must not intersect another target's region, nor the
  // circle of another undersized target (their centres 24px apart or more).
  // A circle that only touches passes.
  function hasSpacingConflict(target) {
    const c = { x: target.center.cx, y: target.center.cy };
    for (const other of nearbyItems(target.center)) {
      if (!other || !other.el || isRelated(target.el, other.el)) continue;

      // Ignore inline-text exception targets when evaluating spacing conflicts.
      // (Inline links in text are exempt and should not invalidate spacing.)
      if (isInlineTextExceptionTarget(other.el)) continue;

      const d = dist(target.center, other.center);
      if (isUndersized(other) && d < MIN - EPS) {
        if (isCoveredNear(other, target)) continue;
        return { conflict: true, conflictEl: other.el, decidedBy: 'centerDistance', distancePx: d };
      }
      const reach = regionDistance(other.region, c);
      if (reach < RADIUS - EPS) {
        if (isCoveredNear(other, target)) continue;
        return {
          conflict: true,
          conflictEl: other.el,
          decidedBy: 'regionDistance',
          distancePx: reach
        };
      }
    }
    return { conflict: false, conflictEl: null };
  }

  // WCAG 2.5.8 "User Agent Control" exception: the target's size requirement
  // does not apply at all when its size is determined by the user agent and
  // not modified by the author. The canonical example is an unstyled native
  // checkbox/radio (browsers render these well under 24px by default, and
  // that's not the author's choice). Scoped narrowly to
  // input[type=checkbox]/[type=radio] specifically, the only form-control
  // types with a universally-recognized, unambiguous native rendering, and
  // not extended to select/range/color/file, whose "default" sizing varies
  // enough across browsers/OSes that a wrong exemption there risks masking a
  // real author-introduced undersized target.
  //
  // Detection signal: `appearance` (or the legacy `-webkit-appearance`)
  // computed as `none` is the near-universal first step of custom
  // checkbox/radio styling across every CSS framework/design system. If the
  // author hasn't reset it, the browser is still rendering its own default
  // control chrome, so the size is UA-determined rather than authored.
  function isUserAgentSizedControl(el) {
    try {
      if (!el || dom.nodeType(el) !== 1) return false;
      const tag = (dom.tagName(el) || '').toLowerCase();
      if (tag !== 'input') return false;

      const type =
        (dom.get(el, 'getAttribute') &&
          String(dom.getAttribute(el, 'type') || '')
            .trim()
            .toLowerCase()) ||
        '';
      if (type !== 'checkbox' && type !== 'radio') return false;

      const cs = getStyle(el);
      let appearance = '';
      try {
        if (cs && typeof cs.getPropertyValue === 'function') {
          appearance =
            cs.getPropertyValue('appearance') || cs.getPropertyValue('-webkit-appearance') || '';
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
      if (!el || dom.nodeType(el) !== 1) return false;

      const tag = (dom.tagName(el) || '').toLowerCase();

      // Image map targets are often constrained by the underlying image.
      // Currently unreachable in practice: <area> never becomes a
      // measurable candidate at all (see the file header's "Known,
      // unimplemented gap" note). Kept for forward compatibility if that
      // gap is closed later.
      if (tag === 'area') return true;

      // Graphics / spatial interaction regions are commonly essential by design.
      if (closest(el, 'svg, canvas, map')) return true;

      // Otherwise: do NOT guess "essential/equivalent" from layout containers.
      return false;
    } catch {
      return false; // conservative: don't mask failures as cantTell
    }
  }

  const failOccurrences = [];
  const cantTellOccurrences = [];

  // What decided a finding, measured against what it was held to, and the
  // viewport it was measured at: a responsive page can size or place a
  // target differently at another width. A conflict between two undersized
  // targets reports the distance between their centres against the 24px
  // their circles need; one with another target's region reports how far
  // that region comes from the target's centre, against the circle's 12px
  // radius. Values are rounded to a tenth of a pixel, but down where
  // rounding would reach what they are held to, so a target under 24 never
  // reads as 24 (#105).
  const round1 = (n, limit = MIN) => {
    const r = Math.round(n * 10) / 10;
    return n < limit && r >= limit ? Math.floor(n * 10) / 10 : r;
  };
  const view = dom.defaultView(document) || null;
  const viewport = view ? { width: view.innerWidth, height: view.innerHeight } : null;
  function measurements(it, info) {
    const metrics = {
      widthPx: round1(it.rect.width),
      heightPx: round1(it.rect.height),
      squarePx: round1(it.square),
      minSizePx: MIN,
      decidedBy: info.decidedBy || null
    };
    if (info.decidedBy === 'centerDistance') {
      metrics.centerDistancePx = round1(info.distancePx);
      metrics.minDistancePx = MIN;
    } else if (info.decidedBy === 'regionDistance') {
      metrics.regionDistancePx = round1(info.distancePx, RADIUS);
      metrics.minDistancePx = RADIUS;
    }
    return { metrics, viewport };
  }
  function measuredOf(it) {
    return { width: it.rect.width, height: it.rect.height, square: it.square };
  }
  // A target whose region isn't a plain rectangle (rounded, rotated, partly
  // covered) is described by its extent and the square that fits in it.
  function sizeParams(it) {
    return {
      widthPx: String(round1(it.rect.width)),
      heightPx: String(round1(it.rect.height)),
      squarePx: String(round1(it.square)),
      viewportWidth: String(viewport && viewport.width)
    };
  }
  function sizeText(it, size) {
    return it.region.rectangle
      ? `Target is ${size.widthPx}×${size.heightPx} CSS px`
      : `The part of this target a pointer can hit spans ${size.widthPx}×${size.heightPx} CSS px but fits only a ${size.squarePx}×${size.squarePx} square`;
  }
  const keyFor = (it, key) => (it.region.rectangle ? key : `${key}_shape`);

  for (const it of undersized) {
    // Inline-text exception: do not fail purely on size/spacing for inline links in text.
    if (isInlineTextExceptionTarget(it.el)) {
      continue; // pass by exception (no occurrence)
    }

    // User Agent Control exception: size isn't the author's choice, so the
    // size requirement (and therefore any spacing conflict stemming from
    // it) doesn't apply at all. Skip straight to pass, no need to even
    // evaluate spacing.
    if (isUserAgentSizedControl(it.el)) {
      continue;
    }

    const info = hasSpacingConflict(it);
    const size = sizeParams(it);
    const sized = sizeText(it, size);

    if (info.conflict) {
      if (isPlausiblyEssentialOrEquivalent(it.el)) {
        // Confident spacing conflict, but the target may be exempt as part
        // of an essential graphic/image-map region, so report it as
        // cantTell rather than dropping it.
        cantTellOccurrences.push(
          helpers.reportOccurrence(it.el, {
            occurrenceOutcome: 'cantTell',
            summary: `${sized} at a ${size.viewportWidth}px-wide viewport, under 24×24, and too close to another target, but may be exempt as part of an essential graphic or image-map region.`,
            hint: 'Verify whether this target’s size is essential to its function (e.g. part of an SVG/canvas/image map); if not, increase target size or spacing.',
            i18n: {
              summaryKey: keyFor(it, 'targetSizeMinimum_summary_cantTell_plausiblyEssential'),
              hintKey: 'targetSizeMinimum_hint_cantTell_plausiblyEssential',
              params: size
            },
            uncertainty: {
              code: 'judgement-required',
              needed: 'Whether this target’s size is essential, which WCAG exempts.',
              evidence: {
                measured: measuredOf(it)
              }
            },
            data: {
              details: {
                measured: measuredOf(it),
                reasonCode: 'undersized-plausibly-essential',
                conflictWith: info.conflictEl ? buildSelector(info.conflictEl) : null,
                ...measurements(it, info)
              }
            }
          })
        );
        continue;
      }

      // This target and its conflicting neighbor are both inline links in
      // one stretch of text that has separators but no words ("Edit |
      // Delete"), where the SC 2.5.8 inline exception may apply. That can't
      // be decided from the page, so defer to manual review. Links with no
      // text around them at all are in no text to be exempt in.
      const around = textAround(it.el);
      if (around && around.symbols && info.conflictEl && textAround(info.conflictEl) === around) {
        cantTellOccurrences.push(
          helpers.reportOccurrence(it.el, {
            occurrenceOutcome: 'cantTell',
            summary: `${sized} at a ${size.viewportWidth}px-wide viewport, smaller than 24×24, and close to another inline link in the same run of text, where the inline exception may apply.`,
            hint: 'Confirm whether these links form a run of inline text (which is exempt); otherwise increase the target size to at least 24×24 CSS px or add spacing.',
            i18n: {
              summaryKey: keyFor(it, 'targetSizeMinimum_summary_cantTell_inlineLinkRun'),
              hintKey: 'targetSizeMinimum_hint_cantTell_inlineLinkRun',
              params: size
            },
            uncertainty: {
              code: 'judgement-required',
              needed: 'Whether this target is a link in a sentence, which WCAG exempts.',
              evidence: {
                measured: measuredOf(it)
              }
            },
            data: {
              details: {
                measured: measuredOf(it),
                reasonCode: 'undersized-inline-link-run',
                conflictWith: info.conflictEl ? buildSelector(info.conflictEl) : null,
                ...measurements(it, info)
              }
            }
          })
        );
        continue;
      }

      failOccurrences.push(
        helpers.reportOccurrence(it.el, {
          occurrenceOutcome: 'fail',
          summary: `${sized} at a ${size.viewportWidth}px-wide viewport, under 24×24, and too close to another target.`,
          hint: 'Increase target size to at least 24 by 24 CSS pixels, or add sufficient spacing.',
          i18n: {
            summaryKey: keyFor(it, 'targetSizeMinimum_summary_fail'),
            hintKey: 'targetSizeMinimum_hint_fail',
            params: size
          },
          data: {
            details: {
              measured: measuredOf(it),
              reasonCode: 'undersized-and-too-close',
              conflictWith: info.conflictEl ? buildSelector(info.conflictEl) : null,
              ...measurements(it, info)
            }
          }
        })
      );
    }
  }

  // See helpers.resolveTieredOutcome's own header comment (src/core/dom-helpers.js):
  // a fail-tier finding never silently discards cantTell-tier findings from
  // the same run. Both are returned together when the outcome is 'fail'.
  const resolved = helpers.resolveTieredOutcome(
    failOccurrences,
    cantTellOccurrences,
    (rule && rule.defaultSeverity) || 'minor'
  );
  // The smallest target that is at least 24 by 24 on its own, reported as
  // the result's margin whatever the outcome. A target under 24 that passes
  // through the spacing exception is not a size candidate.
  // Only the smallest can be the margin, so targets are taken from the
  // smallest bound up (a target not measured yet is bounded by its extent,
  // and measured now), and the search stops at one whose bound exceeds the
  // smallest square found (a bound equal to it may tie, and is kept).
  const marginCandidates = [];
  const sized = items
    .map((e) => ({
      e,
      bound: e.item
        ? squareBound(e.item.region)
        : Math.min(e.extent.r - e.extent.l, e.extent.b - e.extent.t)
    }))
    .filter(({ bound }) => bound >= MIN - 1e-3)
    .sort((a, b) => a.bound - b.bound);
  let smallest = Infinity;
  for (const { e, bound } of sized) {
    if (bound > smallest) break;
    if (!e.near && e.item === undefined) e.item = measure(e.el);
    const it = e.item;
    if (!it || isUndersized(it)) continue;
    smallest = Math.min(smallest, it.square);
    marginCandidates.push({
      el: it.el,
      value: it.square,
      threshold: MIN,
      context: { widthPx: round1(it.rect.width), heightPx: round1(it.rect.height) }
    });
  }
  return { ruleId: RULE_ID, ...resolved, marginCandidates, measuredCount: items.length };
}

module.exports = { id, meta, runInPage };
