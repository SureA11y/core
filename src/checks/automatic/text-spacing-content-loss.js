/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check text-spacing-content-loss
 * @atomic true
 * @summary Text must stay readable when the user increases text spacing
 * @standard WCAG 2.2
 * @sc 1.4.12
 * @applicability
 *   Applies to a page with visible text. The loss of content needs a layout
 *   (a browser): without one, only the style sheets are read.
 * @expectation
 *   WCAG 1.4.12: with line height at 1.5 times the font
 *   size, spacing after paragraphs at 2 times, letter spacing at 0.12 times
 *   and word spacing at 0.16 times, no content or functionality is lost.
 *   - In a browser, the spacing is applied as a style sheet that wins over
 *     the page's own (inline `!important` aside, which avoid-inline-spacing
 *     reports), and each line of text is measured before and after against
 *     the ancestors that clip it (`overflow: hidden` or `clip`). A line that
 *     was inside and ends at least half outside (half its height, or half
 *     an em across) fails: the container cuts that text off
 *     (TEXT_CLIPPED). A line pushed out by less is asked about
 *     (TEXT_CLIPPED_PARTLY), and so is text that comes to overlap other
 *     text it did not overlap before (TEXT_OVERLAPS). Text moved by an
 *     animation that repeats for ever (a marquee) is asked about however far
 *     it goes (TEXT_CLIPPED_MOVING): it passes through the edge anyway, and
 *     one frame can't tell whether any of it is lost.
 *   - In any environment, a style sheet rule that sets line-height,
 *     letter-spacing or word-spacing below those values with `!important`
 *     is asked about (STYLESHEET_IMPORTANT): a tool that adds its own style
 *     sheet to the page cannot override it, though a user style sheet can.
 *     A value relative to the font size is read as declared, and a computed
 *     one meets the value within the rounding browsers report lengths with,
 *     so a rule setting exactly the minimum is not asked about (#108).
 *   Without a layout and with no such rule, the rule is notApplicable, with
 *   `data.reason: 'noLayout'`.
 *   - Only text inside the scan's scope (contextSelector) and not excluded
 *     (excludeSelectors) is judged. Text elsewhere on the page is still
 *     measured, since text in scope can come to overlap it. While a modal
 *     dialog is open, the page behind it is left out altogether: the
 *     browser makes it inert, and the scan judges the dialog.
 *   - Margin (`overflow-px`): of the text a clipping box keeps in full, the
 *     line that came closest to being cut off. `value` is how far it reaches
 *     past the box's edge, negative while it is still inside, against the
 *     same threshold as a finding; `context.axis` and `context.text` say
 *     which edge and which text. It is measured where text grows with more
 *     spacing, the inline end (the right, or the left in right-to-left
 *     text) and the bottom; a start edge counts only once a line is past it.
 *     An axis on which the box grew with the spacing (a block of auto
 *     height) follows its content and is left out, and vertical text gets
 *     no margin. Text a repeating animation moves (a marquee) is left out,
 *     since where it stands depends on the point the animation was held
 *     at, and so is a box that cuts off other text: it is a finding.
 *     `measuredCount` counts the pairs of text and clipping box compared;
 *     like the findings, the margin covers the first 3,000 text nodes.
 * @reports
 *   - `text`: the start of the text, up to 60 characters. Not on a style
 *     sheet rule's finding.
 *   - `metrics.overflowPx` (cut-off text): how far, in CSS pixels, the line
 *     went past the edge of the box that clips it, with the spacing applied.
 *   - `metrics.thresholdPx` (cut-off text): how far it may go before it
 *     fails: half an em across, or half the line's height down.
 *   - `metrics.axis` (cut-off text): `x` when the line went past a side, `y`
 *     past the top or bottom.
 *   - `container.widthPx`, `container.heightPx` (cut-off text): the size of
 *     the clipping box with the spacing applied.
 *   - `viewport.width`, `viewport.height` (cut-off or overlapping text): the
 *     viewport the page was laid out in, in CSS pixels. Text that fits at
 *     one width can be cut off at another.
 *   - `other` (overlapping text): the text it comes to overlap.
 *   - `selector`, `property`, `value` (a style sheet rule): the rule's
 *     selector and the declaration that forces the spacing.
 * @implementation-notes
 * - The spacing sheet is one cascade layer declared before every other
 *   style: layered `!important` declarations beat unlayered ones and later
 *   layers, as a user style sheet would. It is removed afterwards, and the
 *   scroll position put back.
 * - Text that was already outside its clipping box before (a carousel
 *   slide, text hidden off screen) is not counted. A scrolling ancestor
 *   (`overflow: auto` or `scroll`) keeps its content reachable and does not
 *   clip.
 * - Lines are read with Range.getClientRects() on each text node, up to
 *   3,000 text nodes per page.
 * - The thresholds are the ones avoid-inline-spacing uses: line-height 1.5,
 *   letter-spacing 0.12, word-spacing 0.16, as multiples of the font size.
 */

const id = 'text-spacing-content-loss';

const meta = {
  title: 'Text stays readable when the user increases text spacing',
  description:
    'Applies the WCAG 1.4.12 text spacing in the browser and checks that no text is cut off or made to overlap, and asks about style sheet rules that force spacing with !important.',
  i18n: {
    titleKey: 'textSpacingContentLoss_title',
    descriptionKey: 'textSpacingContentLoss_description'
  },
  helpUrl: null,
  tags: ['wcag21aa', 'wcag1412', 'structure', 'atomic', 'automatic'],
  wcagSc: ['1.4.12'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.4.12',
      title: 'Text Spacing',
      conformanceLevel: 'AA'
    }
  ],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'medium',
  coverage: { facetsBySc: { '1.4.12': ['text-spacing-content-loss'] } },
  // Reason codes built at runtime, which scripts/generate-finding-ids.js
  // can't read from the source.
  reasonCodes: ['TEXT_CLIPPED', 'TEXT_CLIPPED_MOVING', 'TEXT_CLIPPED_PARTLY', 'TEXT_OVERLAPS'],
  margin: { measure: 'overflow-px', unit: 'px', limit: 'max' }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;
  const view = dom.defaultView(document) || null;

  const MIN_RATIO = { 'line-height': 1.5, 'letter-spacing': 0.12, 'word-spacing': 0.16 };
  const SPACING_PROPS = Object.keys(MIN_RATIO);
  const MAX_TEXT_NODES = 3000;
  const CSS_STYLE_RULE = 1;
  const LAYER = 'surea11y-text-spacing';

  function styleOf(el, pseudo) {
    try {
      return view.getComputedStyle(el, pseudo || null);
    } catch {
      return null;
    }
  }
  function px(v) {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  // A spacing value as a multiple of the font size, or null when it cannot
  // be read. A computed value is in px; a declared one, which is all a DOM
  // emulator returns, may be in em, rem or %, or unitless for line-height.
  function ratioOf(prop, value, fontSize) {
    const v = String(value == null ? '' : value)
      .trim()
      .toLowerCase();
    if (v === 'normal') return prop === 'line-height' ? 1.2 : 0;
    const m = /^(-?\d*\.?\d+)(px|em|rem|%)?$/.exec(v);
    if (!m) return null;
    const n = parseFloat(m[1]);
    const unit = m[2] || '';
    if (unit === 'px') return n / fontSize;
    if (unit === 'em') return n;
    if (unit === 'rem') {
      const root = px(
        styleOf(dom.documentElement(document)) && styleOf(dom.documentElement(document)).fontSize
      );
      return (n * (root || 16)) / fontSize;
    }
    if (unit === '%') return prop === 'line-height' ? n / 100 : null;
    return prop === 'line-height' ? n : null;
  }
  // A value relative to the font size is the ratio itself: em for any of
  // the three, unitless or a percentage for line-height. Read as declared it
  // is exact, where a computed one comes in px, rounded (#108).
  function declaredRatio(prop, value) {
    const m = /^(\d*\.?\d+)(em|%)?$/.exec(
      String(value || '')
        .trim()
        .toLowerCase()
    );
    if (!m) return null;
    const n = parseFloat(m[1]);
    if (m[2] === 'em') return n;
    if (prop !== 'line-height') return null;
    return m[2] === '%' ? n / 100 : n;
  }
  // Browsers report computed lengths to six significant digits (11pt is
  // 14.6667px), so a ratio of two of them can fall short of the minimum by
  // a few millionths where the declared values meet it exactly.
  const meetsMinimum = (prop, ratio) => ratio >= MIN_RATIO[prop] * (1 - 1e-5);
  function round1(n) {
    return Math.round(n * 10) / 10;
  }
  function textOf(el) {
    return String(dom.textContent(el) || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 60);
  }

  // ---- Style sheet rules that force spacing with !important ----

  const importantFindings = [];
  (function readSheets() {
    const seen = new Set();
    function check(cssRule) {
      const style = cssRule.style;
      for (const prop of SPACING_PROPS) {
        let value;
        let priority;
        try {
          value = String(style.getPropertyValue(prop) || '').trim();
          priority = String(style.getPropertyPriority(prop) || '');
        } catch {
          continue;
        }
        if (!value || priority !== 'important') continue;
        if (/^(inherit|initial|unset|revert|revert-layer)$/i.test(value)) continue;
        let targets;
        try {
          targets = helpers.queryAllSmart
            ? helpers.queryAllSmart(cssRule.selectorText)
            : helpers.queryAll(cssRule.selectorText);
        } catch {
          targets = [];
        }
        for (const el of targets) {
          if (!el || seen.has(el) || !textOf(el)) continue;
          const cs = styleOf(el);
          const fontSize = px(cs && cs.fontSize) || 16;
          const declared = declaredRatio(prop, value);
          const ratio =
            declared !== null ? declared : ratioOf(prop, cs && cs.getPropertyValue(prop), fontSize);
          // A value that already meets the metric leaves nothing to override.
          if (ratio == null ? false : meetsMinimum(prop, ratio)) continue;
          seen.add(el);
          importantFindings.push({ el, prop, value, selector: String(cssRule.selectorText) });
          break;
        }
      }
    }
    function walk(rules, depth) {
      if (!rules || depth > 8) return;
      for (const r of rules) {
        if (!r) continue;
        if (r.type === CSS_STYLE_RULE && r.selectorText && r.style) check(r);
        let nested = null;
        try {
          nested = r.cssRules || null;
        } catch {}
        if (nested) walk(nested, depth + 1);
      }
    }
    try {
      for (const sheet of dom.styleSheets(document) || []) {
        let rules = null;
        try {
          rules = sheet.cssRules;
        } catch {
          continue;
        }
        walk(rules, 0);
      }
    } catch {}
  })();

  // ---- Lines of text, before and after the spacing ----

  function hasLayout() {
    const probe = dom.documentElement(document) || null;
    if (!view || !probe || typeof dom.get(probe, 'getClientRects') !== 'function') return false;
    if (typeof dom.get(document, 'createRange') !== 'function') return false;
    try {
      const rects = dom.getClientRects(probe);
      return !!(rects && rects.length > 0);
    } catch {
      return false;
    }
  }

  const clipped = [];
  const partly = [];
  const moving = [];
  const overlaps = [];
  let textCount = 0;
  // Every text line and clipping box compared, and those whose text stayed in
  // full: the margin's measuredCount and candidates (src/core/margin.js).
  let measuredPairs = 0;
  const marginCandidates = [];
  // Clipping boxes already reported as a finding.
  const reportedClip = new Set();

  if (hasLayout() && dom.body(document)) {
    const SKIP = new Set(['script', 'style', 'noscript', 'template', 'textarea', 'select']);

    // The text this scan judges: inside the scope (contextSelector), not
    // excluded (excludeSelectors), and not behind an open modal dialog. Text
    // elsewhere on the page is still measured, since in-scope text can come
    // to overlap it, but never reported, and never the margin. The page
    // behind an open modal is left out altogether: the browser makes it
    // inert, and the scan judges the dialog.
    const roots = (Array.isArray(ctx.root) ? ctx.root : [ctx.root]).filter(Boolean);
    const wholeDocument =
      !roots.length || roots.some((r) => r === document || r === dom.documentElement(document));
    function inScope(el) {
      if (wholeDocument) return true;
      return roots.some((r) => {
        try {
          return r === el || (typeof dom.get(r, 'contains') === 'function' && dom.contains(r, el));
        } catch {
          return false;
        }
      });
    }
    function isExcluded(el) {
      try {
        return typeof helpers.isExcluded === 'function' && !!helpers.isExcluded(el);
      } catch {
        return false;
      }
    }
    let modalOpen = false;
    try {
      modalOpen = typeof helpers.isModalDialogOpen === 'function' && !!helpers.isModalDialogOpen();
    } catch {
      modalOpen = false;
    }
    function isBehindModal(el) {
      if (!modalOpen || typeof helpers.isAccTreeEligible !== 'function') return false;
      try {
        const r = helpers.isAccTreeEligible(el);
        return !!(
          r &&
          r.eligible === false &&
          Array.isArray(r.reasons) &&
          r.reasons.includes('modalInert')
        );
      } catch {
        return false;
      }
    }

    const nodes = [];
    const judged = new Set();
    const walker = dom.createTreeWalker(document, dom.body(document), 4);
    for (let n = walker.nextNode(); n && nodes.length < MAX_TEXT_NODES; n = walker.nextNode()) {
      if (!/\S/.test(dom.nodeValue(n) || '')) continue;
      const parent = dom.parentElement(n);
      if (!parent || SKIP.has(String(dom.localName(parent)))) continue;
      if (isBehindModal(parent)) continue;
      // Text the page does not render (display:none, a closed <details>,
      // content-visibility:hidden) is never judged, so it does not take a
      // place in the budget either.
      try {
        if (
          typeof dom.get(parent, 'checkVisibility') === 'function' &&
          !dom.checkVisibility(parent)
        )
          continue;
      } catch {}
      nodes.push(n);
      if (inScope(parent) && !isExcluded(parent)) judged.add(n);
    }

    const clipCache = new Map();
    // Ancestors that clip on an axis: [{ el, x, y }]. Past an ancestor that
    // scrolls on an axis, outer ancestors no longer clip the text on that
    // axis: what goes past them can be scrolled to.
    function clippersOf(el) {
      if (clipCache.has(el)) return clipCache.get(el);
      const out = [];
      let scrollX = false;
      let scrollY = false;
      // Bounded as a safety net only: a walk up a real tree always ends.
      for (
        let a = el, i = 0;
        a && dom.nodeType(a) === 1 && a !== dom.documentElement(document) && i < 100000;
        a = dom.parentElement(a), i++
      ) {
        const cs = styleOf(a);
        if (!cs) continue;
        const x = !scrollX && (cs.overflowX === 'hidden' || cs.overflowX === 'clip');
        const y = !scrollY && (cs.overflowY === 'hidden' || cs.overflowY === 'clip');
        if (x || y) out.push({ el: a, x, y });
        if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') scrollX = true;
        if (cs.overflowY === 'auto' || cs.overflowY === 'scroll') scrollY = true;
        if (scrollX && scrollY) break;
      }
      clipCache.set(el, out);
      return out;
    }

    function shown(el) {
      try {
        return typeof dom.get(el, 'checkVisibility') === 'function'
          ? dom.checkVisibility(el, { opacityProperty: true, visibilityProperty: true })
          : true;
      } catch {
        return true;
      }
    }

    const sx = () => view.scrollX || 0;
    const sy = () => view.scrollY || 0;
    function linesOf(node) {
      const range = dom.createRange(document);
      try {
        range.selectNodeContents(node);
        const out = [];
        const ox = sx();
        const oy = sy();
        for (const r of dom.getClientRects(range)) {
          if (r.width < 1 || r.height < 1) continue;
          out.push({
            left: r.left + ox,
            top: r.top + oy,
            right: r.right + ox,
            bottom: r.bottom + oy
          });
        }
        return out;
      } catch {
        return [];
      } finally {
        try {
          range.detach();
        } catch {}
      }
    }
    function boxOf(el) {
      const r = dom.getBoundingClientRect(el);
      const cs = styleOf(el);
      const bl = px(cs && cs.borderLeftWidth) || 0;
      const bt = px(cs && cs.borderTopWidth) || 0;
      const ox = sx();
      const oy = sy();
      return {
        left: r.left + ox + bl,
        top: r.top + oy + bt,
        right: r.left + ox + bl + dom.get(el, 'clientWidth'),
        bottom: r.top + oy + bt + dom.get(el, 'clientHeight')
      };
    }

    function measure() {
      const lines = new Map();
      const boxes = new Map();
      for (const n of nodes) {
        lines.set(n, linesOf(n));
        for (const c of clippersOf(dom.parentElement(n))) {
          if (!boxes.has(c.el)) boxes.set(c.el, boxOf(c.el));
        }
      }
      return { lines, boxes };
    }

    const scroll = [sx(), sy()];
    const before = measure();
    const fontSizes = new Map();
    for (const n of nodes) {
      const cs = styleOf(dom.parentElement(n));
      fontSizes.set(n, px(cs && cs.fontSize) || 16);
    }

    // Text a person could see before the spacing: rendered, and wholly
    // inside every ancestor that clips it. Visually hidden text (a 1px box
    // with overflow hidden), text scrolled out of a carousel or hidden by
    // opacity or visibility is left out.
    const visibleBefore = new Set();
    for (const n of nodes) {
      const lines = before.lines.get(n) || [];
      if (!lines.length || !shown(dom.parentElement(n))) continue;
      const inside = clippersOf(dom.parentElement(n)).every((c) => {
        const b0 = before.boxes.get(c.el);
        return (
          !!b0 &&
          lines.every((l) => {
            const o = outside(l, b0, c);
            return o.dx <= 1 && o.dy <= 1;
          })
        );
      });
      if (inside) visibleBefore.add(n);
    }

    const sheet = dom.createElement(document, 'style');
    dom.setAttribute(sheet, 'data-surea11y', LAYER);
    sheet.textContent =
      `@layer ${LAYER} {` +
      '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }' +
      'p { margin-bottom: 2em !important; }' +
      '}';
    let after;
    try {
      const head = dom.head(document) || dom.documentElement(document);
      dom.insertBefore(head, sheet, dom.firstChild(head));
      after = measure();
    } finally {
      if (dom.parentNode(sheet)) dom.removeChild(dom.parentNode(sheet), sheet);
      try {
        view.scrollTo(scroll[0], scroll[1]);
      } catch {}
    }

    // Whether an element from `from` up to (not including) `stop` is moved
    // by an animation that repeats for ever: a marquee or a ticker. Its text
    // passes through the clipping box and comes back, so one frame can't
    // tell whether it is lost. The engine holds such an animation at its
    // start for the scan (see settleAnimations). An animation that only
    // fades or recolours (a blinking cursor) moves nothing and doesn't count.
    // Property names as getKeyframes() spells them (camelCase); a keyframe's
    // own `offset`, `easing` and `composite` are not properties.
    const MOVING_PROPS =
      /^(transform|translate|rotate|scale|left|right|top|bottom|inset|margin|offsetPath|offsetDistance|offsetAnchor|offsetPosition)/;
    // The elements such an animation targets, read once from the document's
    // animations: asking each ancestor of each text for its own costs an
    // animation lookup per element.
    let movedForEver = null;
    function movedForEverTargets() {
      if (movedForEver) return movedForEver;
      movedForEver = new Set();
      let animations;
      try {
        animations =
          typeof dom.get(document, 'getAnimations') === 'function'
            ? dom.getAnimations(document)
            : [];
      } catch {
        animations = [];
      }
      for (const a of animations) {
        try {
          if (a.playState !== 'running' || !a.effect || !a.effect.target) continue;
          if (a.effect.getComputedTiming().iterations !== Infinity) continue;
          const frames = a.effect.getKeyframes ? a.effect.getKeyframes() : [];
          if (frames.some((f) => Object.keys(f).some((k) => MOVING_PROPS.test(k)))) {
            movedForEver.add(a.effect.target);
          }
        } catch {}
      }
      return movedForEver;
    }
    function isMovedForEver(from, stop) {
      const targets = movedForEverTargets();
      if (!targets.size) return false;
      // Bounded as a safety net only: a walk up a real tree always ends.
      for (let el = from, i = 0; el && el !== stop && i < 100000; el = dom.parentElement(el), i++) {
        if (targets.has(el)) return true;
      }
      return false;
    }

    // How far a line sits outside a box, along the axes the box clips.
    function outside(line, box, c) {
      const dy = c.y ? Math.max(0, box.top - line.top, line.bottom - box.bottom) : 0;
      const dx = c.x ? Math.max(0, box.left - line.left, line.right - box.right) : 0;
      return { dx, dy };
    }

    // The same distance, signed: negative while the line is inside the box,
    // by how much. It is measured on the side text grows toward with more
    // spacing, the inline end (the right, or the left in right-to-left text)
    // and the bottom: text set flush against its start edge is not close to
    // being cut off there. The start side counts only once a line is past it.
    // Its closest approach to the threshold is the margin.
    const growthOf = new Map();
    function growth(el) {
      if (!growthOf.has(el)) {
        const st = styleOf(el);
        const horizontal = !st || !/^vertical|^sideways/.test(st.writingMode || '');
        growthOf.set(el, { horizontal, rtl: !!st && st.direction === 'rtl' });
      }
      return growthOf.get(el);
    }
    // A box that grew with the spacing on an axis follows its content there
    // (a height: auto block), so it can't cut text off on that axis.
    function closestApproach(lines, box, c, fontSize, textEl, boxBefore) {
      const g = growth(textEl);
      // Vertical text grows along the other axes; it gets no margin.
      if (!g.horizontal) return null;
      const grew = (sizeBefore, sizeAfter) => sizeAfter - sizeBefore > 0.5;
      const fixedX = !boxBefore || !grew(boxBefore.right - boxBefore.left, box.right - box.left);
      const fixedY = !boxBefore || !grew(boxBefore.bottom - boxBefore.top, box.bottom - box.top);
      const towards = (end, start) => (start > 0 ? Math.max(end, start) : end);
      let best = null;
      for (const l of lines) {
        const axes = [];
        if (c.x && fixedX) {
          const right = l.right - box.right;
          const left = box.left - l.left;
          axes.push({
            axis: 'x',
            value: g.rtl ? towards(left, right) : towards(right, left),
            threshold: fontSize / 2
          });
        }
        if (c.y && fixedY) {
          axes.push({
            axis: 'y',
            value: towards(l.bottom - box.bottom, box.top - l.top),
            threshold: (l.bottom - l.top) / 2
          });
        }
        for (const a of axes) {
          if (!(a.value <= a.threshold)) continue;
          if (!best || a.threshold - a.value < best.threshold - best.value) best = a;
        }
      }
      return best;
    }

    for (const n of nodes) {
      const linesAfter = (after && after.lines.get(n)) || [];
      if (!linesAfter.length || !visibleBefore.has(n) || !judged.has(n)) continue;
      textCount += 1;
      const fontSize = fontSizes.get(n);
      for (const c of clippersOf(dom.parentElement(n))) {
        if (reportedClip.has(c.el)) continue;
        const b1 = after.boxes.get(c.el);
        if (!b1) continue;
        measuredPairs += 1;
        // The line furthest out, measured on the axis that decided it: the
        // first one past the threshold, or else the one that went furthest.
        let worst = null;
        for (const l of linesAfter) {
          const o = outside(l, b1, c);
          const height = l.bottom - l.top;
          const x = { axis: 'x', overflowPx: o.dx, thresholdPx: fontSize / 2 };
          const y = { axis: 'y', overflowPx: o.dy, thresholdPx: height / 2 };
          const lost = o.dy >= y.thresholdPx || o.dx >= x.thresholdPx;
          const some = o.dy > 2 || o.dx > 2;
          if (lost) {
            worst = { lost, ...(o.dx >= x.thresholdPx ? x : y) };
            break;
          }
          if (some) {
            const m = o.dx >= o.dy ? x : y;
            if (!worst || m.overflowPx > worst.overflowPx) worst = { lost, ...m };
          }
        }
        const moved = isMovedForEver(dom.parentElement(n), c.el);
        if (worst) {
          reportedClip.add(c.el);
          const list = moved ? moving : worst.lost ? clipped : partly;
          list.push({
            el: c.el,
            text: textOf(dom.parentElement(n)),
            metrics: {
              overflowPx: round1(worst.overflowPx),
              thresholdPx: round1(worst.thresholdPx),
              axis: worst.axis
            },
            container: {
              widthPx: round1(b1.right - b1.left),
              heightPx: round1(b1.bottom - b1.top)
            }
          });
          break;
        }
        // Text this box keeps in full: how close it came to being cut off.
        // Text a repeating animation moves is left out: where it stands
        // depends on the point the animation was held at, not on the layout.
        if (moved) continue;
        const approach = closestApproach(
          linesAfter,
          b1,
          c,
          fontSize,
          dom.parentElement(n),
          before.boxes.get(c.el)
        );
        if (approach) {
          marginCandidates.push({
            el: c.el,
            value: approach.value,
            threshold: approach.threshold,
            context: { axis: approach.axis, text: textOf(dom.parentElement(n)) }
          });
        }
      }
    }

    // Text that comes to overlap text from another element.
    if (after) {
      const BAND = 40;
      const buckets = new Map();
      const entries = [];
      for (const n of nodes) {
        if (!visibleBefore.has(n)) continue;
        for (const whole of after.lines.get(n) || []) {
          // Only the part of the line its clipping ancestors still show is
          // painted; what they cut off is the clipping check's.
          const l = { ...whole };
          for (const c of clippersOf(dom.parentElement(n))) {
            const b = after.boxes.get(c.el);
            if (!b) continue;
            if (c.x) {
              l.left = Math.max(l.left, b.left);
              l.right = Math.min(l.right, b.right);
            }
            if (c.y) {
              l.top = Math.max(l.top, b.top);
              l.bottom = Math.min(l.bottom, b.bottom);
            }
          }
          if (l.right - l.left < 1 || l.bottom - l.top < 1) continue;
          const entry = { n, l };
          entries.push(entry);
          for (let b = Math.floor(l.top / BAND); b <= Math.floor(l.bottom / BAND); b++) {
            if (!buckets.has(b)) buckets.set(b, []);
            buckets.get(b).push(entry);
          }
        }
      }
      const intersects = (a, b) => {
        const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (w <= 0 || h <= 0) return false;
        const smaller = Math.min(
          (a.right - a.left) * (a.bottom - a.top),
          (b.right - b.left) * (b.bottom - b.top)
        );
        return w * h > smaller * 0.25;
      };
      const overlappedBefore = (n1, n2) =>
        (before.lines.get(n1) || []).some((a) =>
          (before.lines.get(n2) || []).some((b) => intersects(a, b))
        );
      const reported = new Set();
      for (const list of buckets.values()) {
        for (let i = 0; i < list.length; i++) {
          for (let j = i + 1; j < list.length; j++) {
            // The finding goes on text this scan judges; the other text may
            // be anywhere on the page.
            const [a, b] = judged.has(list[i].n) ? [list[i], list[j]] : [list[j], list[i]];
            if (!judged.has(a.n)) continue;
            const pa = dom.parentElement(a.n);
            const pb = dom.parentElement(b.n);
            if (pa === pb || dom.contains(pa, pb) || dom.contains(pb, pa)) continue;
            if (reported.has(pa) || reported.has(pb)) continue;
            if (!intersects(a.l, b.l) || overlappedBefore(a.n, b.n)) continue;
            reported.add(pa);
            overlaps.push({ el: pa, text: textOf(pa), other: textOf(pb) });
          }
        }
      }
    }
  }

  // ---- Findings ----

  const MESSAGES = {
    TEXT_CLIPPED: {
      summary: (p) =>
        `With the text spacing of WCAG 1.4.12 applied at a ${p.viewportWidth}px-wide viewport, this element cuts off the text "${p.text}" (${p.overflowPx}px past its edge).`,
      hint: 'Let the container grow with its text: avoid fixed heights and widths with overflow: hidden on text, or let it scroll (WCAG 1.4.12).',
      key: 'fail_clipped'
    },
    TEXT_CLIPPED_PARTLY: {
      summary: (p) =>
        `With the text spacing of WCAG 1.4.12 applied at a ${p.viewportWidth}px-wide viewport, the text "${p.text}" reaches ${p.overflowPx}px past the edge of this element, which hides what goes past it.`,
      hint: 'Check with the text spacing applied that this text can still be read in full (WCAG 1.4.12).',
      key: 'cantTell_clippedPartly',
      needed: 'Whether the text that reaches past the edge of the element can still be read.'
    },
    TEXT_CLIPPED_MOVING: {
      summary: (p) =>
        `With the text spacing of WCAG 1.4.12 applied at a ${p.viewportWidth}px-wide viewport, the text "${p.text}" reaches ${p.overflowPx}px past the edge of this element, but it moves on a repeating animation, such as a marquee, and passes through that edge anyway.`,
      hint: 'Check with the text spacing applied that this moving text can still be read in full as it passes (WCAG 1.4.12). Moving content also needs a way to pause it (WCAG 2.2.2).',
      key: 'cantTell_clippedMoving',
      needed: 'Whether the moving text can still be read in full with the spacing applied.'
    },
    TEXT_OVERLAPS: {
      summary: (p) =>
        `With the text spacing of WCAG 1.4.12 applied at a ${p.viewportWidth}px-wide viewport, the text "${p.text}" comes to overlap the text "${p.other}".`,
      hint: 'Check with the text spacing applied that both texts can still be read (WCAG 1.4.12).',
      key: 'cantTell_overlaps',
      needed: 'Whether the overlapping texts can still be read.'
    },
    STYLESHEET_IMPORTANT: {
      summary: (p) =>
        `A style sheet rule (${p.selector}) sets ${p.property}: ${p.value} with !important on this text, below the spacing WCAG 1.4.12 lets users apply.`,
      hint: 'Remove !important from the spacing declaration so users can increase it, or check that a user style sheet still overrides it (WCAG 1.4.12).',
      key: 'cantTell_stylesheetImportant',
      needed: 'Whether users can still apply their own text spacing to this text.'
    }
  };

  const fails = [];
  const questions = [];
  // `params` fill in the summary; `details` are what the rule found, with
  // the measurements behind it.
  function report(reasonCode, el, params, details, uncertaintyCode) {
    const msg = MESSAGES[reasonCode];
    const occ = helpers.reportOccurrence(el, {
      summary: msg.summary(params),
      hint: msg.hint,
      i18n: {
        summaryKey: `textSpacingContentLoss_summary_${msg.key}`,
        hintKey: `textSpacingContentLoss_hint_${msg.key}`,
        params
      },
      ...(msg.needed
        ? { uncertainty: { code: uncertaintyCode, needed: msg.needed, evidence: { reasonCode } } }
        : {}),
      data: { details: { reasonCode, ...details } }
    });
    (msg.needed ? questions : fails).push(occ);
  }

  // Whether text gets cut off or overlaps depends on the viewport it was
  // laid out in, so those findings say which one. Read on its own, in a
  // baseline or a SARIF result, such a finding can still be reproduced.
  const viewport = view ? { width: view.innerWidth, height: view.innerHeight } : null;
  const at = { viewportWidth: String(viewport && viewport.width) };
  for (const [reasonCode, list, uncertaintyCode] of [
    ['TEXT_CLIPPED', clipped],
    ['TEXT_CLIPPED_PARTLY', partly, 'judgement-required'],
    ['TEXT_CLIPPED_MOVING', moving, 'judgement-required']
  ]) {
    for (const f of list) {
      const { text, metrics, container } = f;
      const params = { text, overflowPx: String(Math.round(metrics.overflowPx)), ...at };
      report(reasonCode, f.el, params, { text, metrics, container, viewport }, uncertaintyCode);
    }
  }
  for (const f of overlaps) {
    const { text, other } = f;
    report(
      'TEXT_OVERLAPS',
      f.el,
      { text, other, ...at },
      { text, other, viewport },
      'judgement-required'
    );
  }
  for (const f of importantFindings) {
    const params = { selector: f.selector, property: f.prop, value: f.value };
    report('STYLESHEET_IMPORTANT', f.el, params, params, 'runtime-dependent');
  }

  // The text that came closest to being cut off while staying readable,
  // reported as the result's margin whatever the outcome. A box that cuts
  // off other text is a finding, so it is not the margin, even when the
  // first text measured in it fit.
  const margin = {
    marginCandidates: marginCandidates.filter((m) => !reportedClip.has(m.el)),
    measuredCount: measuredPairs
  };
  if (fails.length || questions.length) {
    return {
      ruleId: rule.ruleId,
      ...helpers.resolveTieredOutcome(fails, questions, rule.defaultSeverity || 'serious'),
      ...margin
    };
  }
  if (textCount)
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [], ...margin };
  return {
    ruleId: rule.ruleId,
    outcome: 'notApplicable',
    severity: 'minor',
    occurrences: [],
    ...(hasLayout() ? {} : { data: { reason: 'noLayout' } })
  };
}

module.exports = { id, meta, runInPage };
