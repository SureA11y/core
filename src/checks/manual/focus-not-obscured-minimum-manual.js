/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check focus-not-obscured-minimum
 * @atomic true
 * @summary A focused element must not be entirely hidden behind content the page keeps in place
 * @standard WCAG 2.2
 * @sc 2.4.11
 * @applicability
 *   Applies, in a browser, to the elements in the tab order that are drawn
 *   and scroll with the page, and to the boxes the page keeps in place over
 *   it: `position: fixed` or `sticky` boxes that draw something (a
 *   background, an image or a picture, an inset box-shadow filling them, or
 *   a ::before or ::after positioned over them), such as a sticky header or
 *   footer, a cookie banner or a chat widget. A fixed box inside an
 *   ancestor that is its containing block (a transform, translate, rotate,
 *   scale, perspective, filter or backdrop-filter, transform-style:
 *   preserve-3d, layout or paint containment, a container type, or
 *   will-change of one of those) is placed against that ancestor and
 *   scrolls with it, so it is not kept in place. Without a layout (jsdom) nothing can be measured,
 *   and the rule is notApplicable.
 * @expectation
 *   No element in the tab order can take focus entirely hidden behind such a
 *   box. A browser scrolls a focused element into view only when it is not
 *   already in view, and counts as in view the whole window less the page's
 *   `scroll-padding`. So where a fixed or sticky box covers part of the
 *   window that `scroll-padding` doesn't take out, an element that fits under
 *   it and can be scrolled there takes focus there and stays hidden: as the
 *   user tabs down a page, the next link is often already in the strip a
 *   footer covers. The rule works out, for each box, which elements can end
 *   up entirely under it, then scrolls a few of them there and checks that
 *   the box is what the browser draws on top of them, and puts the page back
 *   where it was. A sticky box counts only for the elements in its
 *   containing block, where it can be. A box hides an element entirely only
 *   where it is drawn opaque: under a semi-transparent or dimming box (an
 *   `opacity` under 1 on it or a container, or a background color that
 *   isn't opaque) the element shows through, so it is not entirely hidden,
 *   as WCAG's Understanding 2.4.11 says; 2.4.12 counts it as obscured. One finding per box, naming how many
 *   elements it can hide and one of them. A page lists at most 50 boxes, in
 *   document order, and checks at most 150 elements; when boxes are left
 *   unchecked, the result's own `data.details` says how many boxes could
 *   hide an element (`boxCount`), how many are listed (`reportedCount`, at
 *   most `maxOccurrences`), how many weren't checked (`uncheckedCount`), and
 *   `truncated`. A `scroll-padding` on the page at least as large as the
 *   box (technique C43) clears it.
 *   Content the user opened and can close without moving focus, such as a
 *   chat panel closed with Escape, is allowed to cover the focused element
 *   (the criterion's second note); the rule can't tell who opened a box, so
 *   it asks.
 *   A script-made modal dialog (`aria-modal="true"`) that leaves the page
 *   behind it able to take focus is reported apart: focus can then reach
 *   elements its backdrop covers. A `<dialog>` opened with `showModal()`
 *   makes the page inert, so nothing behind it takes focus.
 *   It is the base of focus-not-obscured-enhanced (2.4.12), which asks about
 *   an element any part of which can be hidden (`obscured: 'partly'`).
 * @reports
 *   - `metrics.entirelyCount`: how many elements in the tab order can take
 *     focus entirely hidden behind the box.
 *   - `metrics.partlyCount`: with `obscured: 'partly'`, how many can take
 *     focus partly hidden, and not entirely.
 *   - `metrics.position`: `fixed` or `sticky`, the box's own or that of the
 *     box it is drawn in.
 *   - `metrics.side`: where the box sits, `top`, `bottom` or `middle`, for
 *     the `scroll-padding` that would clear it.
 *   - `metrics.coverPx`: the height of the window the box covers that the
 *     page still counts as in view, in CSS pixels.
 *   - `metrics.scrollPaddingPx`: the page's `scroll-padding` on that side.
 *   - `metrics.paddingNeededPx`: the `scroll-padding` on that side that
 *     would clear the box, from that edge of the window to the box's far
 *     side (a box stacked under another counts both).
 *   - `openedByUser`: whether a control marked expanded
 *     (`aria-expanded="true"`) names the box, or something in or around it,
 *     with `aria-controls`: content the user opened, which may cover the
 *     focused element if it closes without moving focus.
 *   - `examples`: up to 5 of the elements it can hide, each `{ tag, text }`.
 *   - `notScrolled`: `true` where the page did not scroll when the rule
 *     scrolled an element under the box (a `scrollTo` the page replaced
 *     with one that does nothing, say), so nothing was hit-tested. The box
 *     is asked about without a lean, and `confirmedBy` is `null`.
 *   - `confirmedBy`: the element the rule scrolled under the box to check
 *     that the box is drawn on top of it, as `{ tag, text }`.
 * @reason-codes
 *   - `FOCUS_OBSCURED_ENTIRELY` (cantTell): a box the page keeps in place
 *     covers part of the window the page still counts as in view, so
 *     elements in the tab order that fit under it can take focus entirely
 *     hidden behind it. It leans fail: the box covers them whatever the user
 *     does, unless the user opened it and can close it without moving focus.
 *     A box a control marks as opened (`openedByUser`) gets no lean: whether
 *     it closes without moving focus is for a person to try. Nor does a box
 *     the rule could not check because the page did not scroll
 *     (`notScrolled`).
 *     Basis: WCAG 2.4.11; F110; C43.
 *   - `FOCUS_OBSCURED_PARTLY` (cantTell): with `obscured: 'partly'`
 *     (focus-not-obscured-enhanced), elements in the tab order can take focus
 *     partly hidden behind such a box. It leans fail, with the same caution,
 *     but for a box a control marks as opened.
 *     Basis: WCAG 2.4.12; C43.
 *   - `FOCUS_OBSCURED_BEHIND_MODAL` (cantTell): a script-made modal dialog
 *     is open, but elements outside it still take focus, hidden behind the
 *     dialog or its backdrop. It leans fail: focus leaves the dialog for
 *     content no one can see.
 *     Basis: WCAG 2.4.11; WAI-ARIA 1.2 aria-modal (not settled); ARIA APG
 *     Dialog (Modal) Pattern (best practice).
 * @implementation-notes
 * - Only the document's own scrolling is modelled: an element inside a box
 *   that scrolls on its own, or inside a fixed or sticky box (it moves with
 *   the box), is left out, as is horizontal scrolling.
 * - In view is the window (documentElement.clientHeight) less the root's
 *   scroll-padding-top and -bottom, and an element's own scroll-margin
 *   counts. A sticky box is taken at the offset it sticks at; the hit test
 *   then confirms it is there.
 * - A box draws something when it, or the part of it hit, has a background
 *   color that isn't transparent or a background image, or is an image, a
 *   picture, a video, a canvas or a frame, and nothing between it and the
 *   page is at opacity 0. An inset box-shadow whose spread closes its hole
 *   (blur included) draws over all of the box, and a ::before or ::after
 *   with a background, positioned absolutely against its element or fixed,
 *   draws over the area its offsets give it (a header colored by a
 *   `::before` at `inset: 0`); one placed any other way isn't counted. A
 *   transparent box over the element hides nothing.
 * - The hit test (elementFromPoint) skips boxes with pointer-events: none,
 *   so such a box isn't confirmed and isn't reported.
 * - Scrolling is instant and undone before the rule returns. Where the
 *   page is not where it was scrolled to afterwards, the element is not
 *   measured there: a box none of whose elements could be checked is
 *   reported with `notScrolled`, not passed. The `scroll`
 *   and `scrollend` the browser fires for it afterwards are kept from the
 *   page's listeners by a capturing listener on the window, which goes once
 *   they have passed (or after half a second). A capturing listener the page
 *   put on the window itself before the scan still sees them.
 * - What appears later, such as a chat bubble after a delay, is only seen if
 *   it is there when the scan runs, at the scan's window size.
 */

const id = 'focus-not-obscured-minimum';

const meta = {
  title: 'A focused element must not be entirely hidden',
  description:
    'Checks that no element in the tab order can take focus entirely hidden behind content the page keeps in place, such as a sticky header or footer or a cookie banner.',
  i18n: {
    titleKey: 'focusNotObscuredMinimum_title',
    descriptionKey: 'focusNotObscuredMinimum_description'
  },
  helpUrl: null,
  tags: ['wcag22aa', 'wcag2411', 'navigation', 'focus', 'css', 'layout', 'atomic', 'manual'],
  wcagSc: ['2.4.11'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '2.4.11',
      title: 'Focus Not Obscured (Minimum)',
      conformanceLevel: 'AA'
    }
  ],
  defaultSeverity: 'serious',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'low',
  coverage: {
    facetsBySc: {
      '2.4.11': ['focus-not-obscured']
    }
  },
  // Reached only with a layout, which the fixture's jsdom run has not.
  reasonCodes: ['FOCUS_OBSCURED_ENTIRELY', 'FOCUS_OBSCURED_PARTLY', 'FOCUS_OBSCURED_BEHIND_MODAL']
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;
  const config = ctx.config || {};
  const partlyToo = config.obscured === 'partly';
  const view = document ? dom.defaultView(document) : null;
  const notApplicable = (data) => ({
    ruleId: rule.ruleId,
    outcome: 'notApplicable',
    severity: 'minor',
    occurrences: [],
    ...(data ? { data } : {})
  });

  const trim = (v) => (v == null ? '' : String(v)).trim();
  const lower = (v) => trim(v).toLowerCase();
  const px = (v) => {
    const m = /^(-?\d*\.?\d+)px$/.exec(lower(v));
    return m ? Number.parseFloat(m[1]) : 0;
  };
  // A length a browser may keep as written: px, a percentage of `ref`, and
  // calc(), min(), max() and clamp() of those ("calc(10% + 2px)", "max(10%,
  // 60px)"): Chromium keeps scroll-padding in that form while a percentage is
  // in it. Anything else, or anything it can't read, reads as 0.
  const lengthOf = (v, ref) => {
    const raw = lower(v);
    if (!raw || raw === 'auto') return 0;
    const tokens = raw.match(/\d*\.?\d+(?:px|%)?|[a-z-]+\(|[()+\-*/,]|\S/g) || [];
    let i = 0;
    const peek = () => tokens[i];
    const expect = (t) => {
      if (tokens[i++] !== t) throw new Error('unreadable');
    };
    // Each value is { n, len }: a number, and whether it is a length (px).
    let sum = null;
    const primary = () => {
      const t = tokens[i++];
      if (t === '(' || t === 'calc(') {
        const value = sum();
        expect(')');
        return value;
      }
      if (t === 'min(' || t === 'max(' || t === 'clamp(') {
        const args = [sum()];
        while (peek() === ',') {
          i += 1;
          args.push(sum());
        }
        expect(')');
        if (!args.every((a) => a.len || a.n === 0)) throw new Error('unreadable');
        const n = args.map((a) => a.n);
        if (t === 'min(') return { n: Math.min(...n), len: true };
        if (t === 'max(') return { n: Math.max(...n), len: true };
        if (n.length !== 3) throw new Error('unreadable');
        return { n: Math.max(n[0], Math.min(n[1], n[2])), len: true };
      }
      if (t === '-' || t === '+') {
        const value = primary();
        return { n: t === '-' ? -value.n : value.n, len: value.len };
      }
      const m = /^(\d*\.?\d+)(px|%)?$/.exec(t || '');
      if (!m) throw new Error('unreadable');
      const n = Number.parseFloat(m[1]);
      if (!m[2]) return { n, len: false };
      return { n: m[2] === '%' ? (n * ref) / 100 : n, len: true };
    };
    const product = () => {
      let value = primary();
      while (peek() === '*' || peek() === '/') {
        const op = tokens[i++];
        const other = primary();
        if (op === '*') {
          if (value.len && other.len) throw new Error('unreadable');
          value = { n: value.n * other.n, len: value.len || other.len };
        } else {
          if (other.len || other.n === 0) throw new Error('unreadable');
          value = { n: value.n / other.n, len: value.len };
        }
      }
      return value;
    };
    sum = () => {
      let value = product();
      while (peek() === '+' || peek() === '-') {
        const op = tokens[i++];
        const other = product();
        value = { n: op === '+' ? value.n + other.n : value.n - other.n, len: true };
      }
      return value;
    };
    try {
      const value = sum();
      if (i !== tokens.length || (!value.len && value.n !== 0)) return 0;
      return Number.isFinite(value.n) ? value.n : 0;
    } catch {
      return 0;
    }
  };
  const styleOf = (el) => {
    try {
      return view.getComputedStyle(el);
    } catch {
      return null;
    }
  };
  const describe = (el, opts) =>
    typeof helpers.describeElement === 'function' ? helpers.describeElement(el, opts) : '';
  const example = (el) => {
    const text = trim(dom.textContent(el)).replace(/\s+/g, ' ').slice(0, 40);
    return { tag: lower(dom.tagName(el)), text };
  };

  // ---- A layout to measure ----
  const html = document ? dom.documentElement(document) : null;
  const body = document ? dom.body(document) : null;
  if (!view || !html || !body) return notApplicable({ reason: 'noLayout' });
  let htmlRect;
  try {
    htmlRect = dom.getBoundingClientRect(html);
  } catch {
    htmlRect = null;
  }
  if (!htmlRect || (htmlRect.width <= 0 && htmlRect.height <= 0))
    return notApplicable({ reason: 'noLayout' });

  // ---- The elements in the tab order that scroll with the page ----
  const positionOf = (cs) => lower(cs && cs.position);
  // Whether a box is the containing block of the fixed boxes inside it
  // (CSS Transforms, Filter Effects, Containment, Will Change): a fixed box
  // there is placed against it and scrolls with it, not with the window.
  const NONE = (v) => !lower(v) || lower(v) === 'none';
  function holdsFixed(cs) {
    if (!cs) return false;
    if (
      !NONE(cs.transform) ||
      !NONE(cs.translate) ||
      !NONE(cs.rotate) ||
      !NONE(cs.scale) ||
      !NONE(cs.perspective) ||
      !NONE(cs.filter) ||
      !NONE(cs.backdropFilter) ||
      !NONE(cs.webkitBackdropFilter)
    )
      return true;
    if (lower(cs.transformStyle) === 'preserve-3d') return true;
    if (/\b(paint|layout|strict|content)\b/.test(lower(cs.contain))) return true;
    if (/size/.test(lower(cs.containerType))) return true;
    return /\b(transform|translate|rotate|scale|perspective|filter|backdrop-filter|contain)\b/.test(
      lower(cs.willChange)
    );
  }
  // Whether a fixed box is fixed to the window: no box it is in, up to the
  // page, is its containing block. Up the composed tree, as the browser
  // places it.
  function fixedToWindow(el) {
    for (
      let n = typeof helpers.composedParent === 'function' ? helpers.composedParent(el) : null,
        i = 0;
      n && dom.nodeType(n) === 1 && n !== html && i < 10000;
      n = helpers.composedParent(n), i++
    ) {
      if (holdsFixed(styleOf(n))) return false;
    }
    return true;
  }
  // The nearest fixed or sticky box an element is in (itself included). A
  // fixed box inside its containing block (a transformed or filtered
  // ancestor) scrolls with the page, as anything else in that block does,
  // so it counts as neither.
  const pinnedCache = new Map();
  function pinnedAncestor(el) {
    const chain = [];
    let found = null;
    for (let n = el, i = 0; n && n !== html && i < 10000; n = dom.parentElement(n), i++) {
      if (pinnedCache.has(n)) {
        found = pinnedCache.get(n);
        break;
      }
      chain.push(n);
      const pos = positionOf(styleOf(n));
      if (pos === 'sticky' || (pos === 'fixed' && fixedToWindow(n))) {
        found = n;
        break;
      }
    }
    for (const n of chain) pinnedCache.set(n, found);
    return found;
  }
  // Whether an ancestor below <body> scrolls on its own.
  function inOwnScroller(el) {
    for (
      let n = dom.parentElement(el), i = 0;
      n && n !== body && n !== html && i < 10000;
      n = dom.parentElement(n), i++
    ) {
      const cs = styleOf(n);
      const oy = lower(cs && cs.overflowY);
      if (
        (oy === 'auto' || oy === 'scroll') &&
        dom.get(n, 'scrollHeight') > dom.get(n, 'clientHeight') + 1
      )
        return true;
    }
    return false;
  }

  const SELECTOR =
    'a[href],area[href],button,input,select,textarea,summary,iframe,[tabindex],[contenteditable]';
  const all = typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart(SELECTOR) : [];
  const scrollY = Number(dom.get(view, 'scrollY')) || 0;
  const scrollX = Number(dom.get(view, 'scrollX')) || 0;
  const scroller = dom.get(document, 'scrollingElement') || html;
  // The viewport's height: the scrolling element's clientHeight, which is
  // the root's in standards mode and the body's in quirks mode, where the
  // root's is the document's height (CSSOM View).
  const vh = Number(dom.get(scroller, 'clientHeight')) || Number(dom.get(view, 'innerHeight')) || 0;
  const maxScroll = Math.max(0, (Number(dom.get(scroller, 'scrollHeight')) || 0) - vh);
  const htmlCs = styleOf(html);
  // A percentage is of the scrollport's height (CSS Scroll Snap).
  const padTop = lengthOf(htmlCs && htmlCs.scrollPaddingTop, vh);
  const padBottom = lengthOf(htmlCs && htmlCs.scrollPaddingBottom, vh);

  // What an element is, as a candidate or a box, doesn't depend on the
  // settings: it is kept for the scan, keyed by element, so the variant run
  // in the same scan (focus-not-obscured-enhanced) reads it instead of
  // working it out again. The page is scrolled back after each rule, so
  // both read it at the same scroll.
  const memoOf = (name) =>
    (typeof helpers.runMemo === 'function' &&
      helpers.runMemo('focus-not-obscured-minimum:' + name)) ||
    new WeakMap();
  const memoized = (map, fn) => (el) => {
    if (map.has(el)) return map.get(el);
    const value = fn(el);
    map.set(el, value);
    return value;
  };

  // An element in the tab order, drawn and scrolling with the page, or null.
  const candidateOf = memoized(memoOf('candidate'), (el) => {
    let info;
    try {
      info = helpers.getFocusableInfo(el, ctx);
    } catch {
      info = null;
    }
    if (!info || !info.tabbable) return null;
    if (typeof helpers.isVisuallyHidden === 'function' && helpers.isVisuallyHidden(el)) return null;
    const cs = styleOf(el);
    if (!cs || lower(cs.visibility) === 'hidden' || lower(cs.display) === 'none') return null;
    const r = dom.getBoundingClientRect(el);
    if (!r || r.width <= 0 || r.height <= 0) return null;
    if (pinnedAncestor(el)) return null;
    if (inOwnScroller(el)) return null;
    return {
      el,
      left: r.left,
      right: r.right,
      height: r.height,
      docTop: r.top + scrollY,
      marginTop: px(cs.scrollMarginTop),
      marginBottom: px(cs.scrollMarginBottom)
    };
  });
  const candidates = [];
  for (const el of all) {
    const c = candidateOf(el);
    if (c) candidates.push(c);
  }
  if (!candidates.length) return notApplicable();

  // ---- The boxes the page keeps in place, and what of them is drawn ----
  const REPLACED = new Set([
    'img',
    'picture',
    'svg',
    'video',
    'canvas',
    'iframe',
    'object',
    'embed'
  ]);
  function paints(el, cs) {
    if (REPLACED.has(lower(dom.tagName(el)))) return true;
    if (!cs) return false;
    if (trim(cs.backgroundImage) && lower(cs.backgroundImage) !== 'none') return true;
    const m = /rgba?\(([^)]*)\)/.exec(lower(cs.backgroundColor));
    if (!m) return false;
    const parts = m[1].split(/[\s,/]+/).filter(Boolean);
    const alpha = parts.length >= 4 ? Number.parseFloat(parts[3]) : 1;
    return Number.isFinite(alpha) && alpha > 0.05;
  }
  // Whether an element is drawn opaque, so nothing under it shows through:
  // a replaced element or a background image (taken as opaque), or a
  // background color at full alpha, with no opacity under 1 on it or on
  // anything up to the page. WCAG's Understanding 2.4.11 counts an element
  // under a semi-transparent or dimming overlay as not entirely hidden
  // (it passes); 2.4.12 counts it as obscured.
  const fadedMemo = new Map();
  function faded(el) {
    if (fadedMemo.has(el)) return fadedMemo.get(el);
    const cs = styleOf(el);
    const op = Number.parseFloat(cs && cs.opacity);
    const up = dom.parentElement(el);
    const value = (Number.isFinite(op) && op < 0.99) || (!!up && faded(up));
    fadedMemo.set(el, value);
    return value;
  }
  function opaque(el, cs) {
    if (!paints(el, cs) || faded(el)) return false;
    if (REPLACED.has(lower(dom.tagName(el)))) return true;
    if (trim(cs.backgroundImage) && lower(cs.backgroundImage) !== 'none') return true;
    const m = /rgba?\(([^)]*)\)/.exec(lower(cs.backgroundColor));
    const parts = m ? m[1].split(/[\s,/]+/).filter(Boolean) : [];
    const alpha = parts.length >= 4 ? Number.parseFloat(parts[3]) : 1;
    return Number.isFinite(alpha) && alpha >= 0.99;
  }
  // A color's alpha as the browser serializes it (rgb() or rgba()), null
  // for one in another form.
  function alphaOf(v) {
    const m = /^rgba?\(([^)]*)\)$/.exec(lower(v));
    if (!m) return null;
    const parts = m[1].split(/[\s,/]+/).filter(Boolean);
    const a = parts.length >= 4 ? Number.parseFloat(parts[3]) : 1;
    return Number.isFinite(a) ? a : null;
  }
  // An inset box-shadow is painted over the element's background, inside
  // its padding box: one whose spread closes the hole in the middle, blur
  // included, paints all of it (a header colored with `inset 0 0 0 100px`).
  // 'opaque', 'paints' or null.
  function insetShadowFill(el, cs) {
    const raw = trim(cs && cs.boxShadow);
    if (!raw || lower(raw) === 'none' || !/\binset\b/i.test(raw)) return null;
    let r;
    try {
      r = dom.getBoundingClientRect(el);
    } catch {
      r = null;
    }
    if (!r) return null;
    const w = r.width - px(cs.borderLeftWidth) - px(cs.borderRightWidth);
    const h = r.height - px(cs.borderTopWidth) - px(cs.borderBottomWidth);
    let best = null;
    for (const layer of raw.split(/,(?![^(]*\))/)) {
      if (!/\binset\b/i.test(layer)) continue;
      const color = /(?:rgba?|hsla?|color|lab|lch|oklab|oklch|hwb)\([^)]*\)|#[0-9a-f]+/i.exec(
        layer
      );
      const a = color ? alphaOf(color[0]) : null;
      if (a === null || a <= 0.05) continue;
      const lengths = (layer.replace(color ? color[0] : '', '').match(/-?\d*\.?\d+px/g) || []).map(
        (v) => Number.parseFloat(v)
      );
      const blur = Math.max(0, lengths[2] || 0);
      const spread = lengths[3] || 0;
      if (Math.min(w, h) - 2 * spread + blur > 0) continue;
      if (a >= 0.99) return 'opaque';
      best = 'paints';
    }
    return best;
  }
  // The ::before and ::after that paint a color or an image over an area of
  // their own: an absolutely positioned one against its positioned element,
  // or a fixed one against the window, as a header's colored ::before
  // spread over it (inset: 0) is. Each with that area, where it is now, and
  // whether it is opaque. One placed any other way can't be told where it
  // paints, and doesn't count.
  function pseudoPaint(el, cs) {
    const out = [];
    if (!cs || lower(cs.display) === 'none') return out;
    const hostPositioned = !!positionOf(cs) && positionOf(cs) !== 'static';
    for (const which of ['::before', '::after']) {
      let pcs;
      try {
        pcs = view.getComputedStyle(el, which);
      } catch {
        pcs = null;
      }
      if (!pcs) continue;
      const content = trim(pcs.content);
      if (!content || content === 'none' || content === 'normal') continue;
      if (lower(pcs.display) === 'none' || lower(pcs.visibility) !== 'visible') continue;
      const op = Number.parseFloat(pcs.opacity);
      if (Number.isFinite(op) && op <= 0.01) continue;
      const image = !!trim(pcs.backgroundImage) && lower(pcs.backgroundImage) !== 'none';
      const a = alphaOf(pcs.backgroundColor);
      if (!image && !(a !== null && a > 0.05)) continue;
      const pos = positionOf(pcs);
      let box = null;
      if (pos === 'fixed') {
        box = {
          left: px(pcs.left),
          top: px(pcs.top),
          right: (Number(dom.get(html, 'clientWidth')) || 0) - px(pcs.right),
          bottom: vh - px(pcs.bottom)
        };
      } else if (pos === 'absolute' && hostPositioned) {
        const r = dom.getBoundingClientRect(el);
        if (!r) continue;
        box = {
          left: r.left + px(cs.borderLeftWidth) + px(pcs.left),
          top: r.top + px(cs.borderTopWidth) + px(pcs.top),
          right: r.right - px(cs.borderRightWidth) - px(pcs.right),
          bottom: r.bottom - px(cs.borderBottomWidth) - px(pcs.bottom)
        };
      }
      if (!box || box.right - box.left <= 0 || box.bottom - box.top <= 0) continue;
      out.push({
        box,
        opaque: (image || a >= 0.99) && !(Number.isFinite(op) && op < 0.99)
      });
    }
    return out;
  }
  // Whether an element draws, at a point of the window, what hides an
  // element under it: anything for 2.4.12, something opaque for 2.4.11.
  // Its own background, or an inset shadow filling it, cover its box; a
  // ::before or ::after its own area.
  function drawnAt(el, cs, x, y, anything) {
    if (anything ? paints(el, cs) : opaque(el, cs)) return true;
    if (faded(el)) return false;
    const fill = insetShadowFill(el, cs);
    if (fill === 'opaque' || (anything && fill)) return true;
    return pseudoPaint(el, cs).some(
      (p) =>
        (anything || p.opaque) &&
        x >= p.box.left &&
        x <= p.box.right &&
        y >= p.box.top &&
        y <= p.box.bottom
    );
  }

  // Whether an element, and everything up to the page, is drawn at all.
  function shown(el) {
    for (let n = el, i = 0; n && i < 10000; n = dom.parentElement(n), i++) {
      const cs = styleOf(n);
      if (!cs) return false;
      const op = Number.parseFloat(cs.opacity);
      if (Number.isFinite(op) && op <= 0.01) return false;
      if (n === el && lower(cs.visibility) === 'hidden') return false;
    }
    return true;
  }

  // The script-made modal dialogs open on the page: they leave it able to
  // take focus. A <dialog> opened with showModal() makes it inert instead.
  const MODAL_ROLES = new Set(['dialog', 'alertdialog']);
  const modals = [];
  for (const m of typeof helpers.queryAllSmart === 'function'
    ? helpers.queryAllSmart('[aria-modal="true" i]')
    : []) {
    const role = helpers.aria.getExplicitRole(m);
    const isDialog = lower(dom.tagName(m)) === 'dialog';
    if (!isDialog && !MODAL_ROLES.has(role)) continue;
    const r = dom.getBoundingClientRect(m);
    if (r && r.width > 0 && r.height > 0 && shown(m)) modals.push(m);
  }
  const inModal = (el) => modals.some((m) => dom.contains(m, el));
  // The parent in the composed tree, through a shadow root to its host, and
  // whether a node is inside another there.
  const composedUp = (n) =>
    typeof helpers.composedParent === 'function' ? helpers.composedParent(n) : dom.parentElement(n);
  const inComposed = (node, container) => {
    for (let cur = node, i = 0; cur && i < 100000; cur = composedUp(cur), i++) {
      if (cur === container) return true;
    }
    return false;
  };

  // A sticky box stays inside its containing block, the nearest ancestor
  // that is no inline box, no display: contents and no table row, row group
  // or column (a table cell's is the table): the block's extent on the
  // page, from the document's top, memoized per root. Not
  // helpers.containingBlockOf, which answers what can clip an element: for a
  // sticky <th> it gives the row, but the table holds the cell.
  const TABLE_PARTS = new Set([
    'table-row',
    'table-row-group',
    'table-header-group',
    'table-footer-group',
    'table-column',
    'table-column-group'
  ]);
  const stickyBlocks = new Map();
  function stickyBlock(root) {
    if (stickyBlocks.has(root)) return stickyBlocks.get(root);
    let found = null;
    for (let n = dom.parentElement(root), i = 0; n && i < 10000; n = dom.parentElement(n), i++) {
      const d = lower((styleOf(n) || {}).display);
      if (d === 'inline' || d === 'contents' || TABLE_PARTS.has(d)) continue;
      const r = dom.getBoundingClientRect(n);
      if (r) found = { top: r.top + scrollY, bottom: r.bottom + scrollY };
      break;
    }
    stickyBlocks.set(root, found);
    return found;
  }

  // Each box: its root (the fixed or sticky element), the strip of the
  // window it covers, and its horizontal extent. A sticky one also carries
  // its containing block (block) and the edge of the window it sticks to
  // with its root's extent there (stuck), as it sits there only while the
  // block reaches past it.
  const coverOf = memoized(memoOf('cover'), (el) => {
    const cs = styleOf(el);
    if (!cs || lower(cs.display) === 'none') return null;
    const root = pinnedAncestor(el);
    if (!root) return null;
    // What it draws: its background, or an inset shadow filling it, over
    // its box; or else a ::before or ::after, over its own area.
    let r = null;
    let isOpaque = false;
    if (paints(el, cs)) {
      r = dom.getBoundingClientRect(el);
      isOpaque = opaque(el, cs);
    }
    if (!isOpaque) {
      const fill = insetShadowFill(el, cs);
      if (fill) {
        r = r || dom.getBoundingClientRect(el);
        isOpaque = fill === 'opaque' && !faded(el);
      }
    }
    if (!r || !isOpaque) {
      const pseudos = pseudoPaint(el, cs);
      const p = pseudos.find((x) => x.opaque) || (r ? null : pseudos[0]);
      if (p) {
        r = {
          left: p.box.left,
          right: p.box.right,
          top: p.box.top,
          bottom: p.box.bottom,
          width: p.box.right - p.box.left,
          height: p.box.bottom - p.box.top
        };
        isOpaque = p.opaque && !faded(el);
      }
    }
    if (!r || r.width <= 0 || r.height <= 0) return null;
    if (!shown(el)) return null;
    const rootCs = el === root ? cs : styleOf(root);
    const position = positionOf(rootCs);
    let top = r.top;
    let block = null;
    let stuck = null;
    if (position === 'sticky') {
      // Taken at the offset it sticks at, from the top or the bottom.
      const t = lower(rootCs.top);
      const b = lower(rootCs.bottom);
      const rootRect = dom.getBoundingClientRect(root);
      const offset = r.top - rootRect.top;
      if (t !== 'auto' && t) {
        top = px(t) + offset;
        stuck = { edge: 'top', top: px(t), bottom: px(t) + rootRect.height };
      } else if (b !== 'auto' && b) {
        top = vh - px(b) - rootRect.height + offset;
        stuck = { edge: 'bottom', top: vh - px(b) - rootRect.height, bottom: vh - px(b) };
      } else return null;
      block = stickyBlock(root);
    }
    return {
      el,
      root,
      position,
      opaque: isOpaque,
      top,
      bottom: top + r.height,
      left: r.left,
      right: r.right,
      block,
      stuck
    };
  });
  const covers = [];
  // Every element, inside open shadow roots too: a web component's sticky
  // header covers as any other does.
  const deepElements = [];
  const roots = [document];
  while (roots.length) {
    const root = roots.shift();
    for (const el of [...dom.querySelectorAll(root, root === document ? 'body *' : '*')]) {
      deepElements.push(el);
      const shadow = dom.shadowRoot(el);
      if (shadow) roots.push(shadow);
    }
  }
  for (const el of deepElements) {
    const cover = coverOf(el);
    if (cover) covers.push(cover);
  }
  if (!covers.length)
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };

  // ---- Which elements can take focus under each box ----
  // In view: the window less the page's scroll-padding. A browser leaves a
  // focused element where it is when it is in view, and the element can be
  // placed anywhere its scroll range allows.
  const zoneTop = padTop;
  const zoneBottom = vh - padBottom;
  // The element's top in the window, as an interval, where it is in view
  // and under the box's strip [lo, hi] (entirely: all of it; partly: some).
  function placement(c, cover, entirely) {
    const inViewLo = zoneTop + c.marginTop;
    const inViewHi = zoneBottom - c.marginBottom - c.height;
    const reachLo = c.docTop - maxScroll;
    const reachHi = c.docTop;
    let lo = entirely ? cover.top : cover.top - c.height + 1;
    let hi = entirely ? cover.bottom - c.height : cover.bottom - 1;
    if (cover.block) {
      // A sticky box covers only what lies in its containing block, and
      // sits at its offset only while the block reaches past it: with the
      // element's top at y in the window, the block's top is at
      // block.top - docTop + y.
      const { block, stuck } = cover;
      if (c.docTop + c.height <= block.top || c.docTop >= block.bottom) return null;
      if (stuck.edge === 'top') lo = Math.max(lo, stuck.bottom - block.bottom + c.docTop);
      else hi = Math.min(hi, stuck.top - block.top + c.docTop);
    }
    const a = Math.max(inViewLo, reachLo, lo);
    const b = Math.min(inViewHi, reachHi, hi);
    return a <= b ? (a + b) / 2 : null;
  }

  // Covers sharing a root are one box to the reader: the first that hides
  // an element is the one reported for it.
  const byRoot = new Map();
  for (const cover of covers) {
    // What shows through a box doesn't hide entirely (2.4.11), only in part.
    if (!partlyToo && !cover.opaque) continue;
    for (const c of candidates) {
      const behindModal = modals.length > 0 && !inModal(c.el);
      const horizontallyAll = cover.left <= c.left + 0.5 && cover.right >= c.right - 0.5;
      const horizontallySome = cover.left < c.right - 0.5 && cover.right > c.left + 0.5;
      let kind = null;
      let at = null;
      // A box that shows what is under it hides nothing entirely, only in
      // part (2.4.12 still asks about that).
      if (horizontallyAll && cover.opaque) {
        at = placement(c, cover, true);
        if (at != null) kind = 'entirely';
      }
      if (!kind && partlyToo && horizontallySome) {
        at = placement(c, cover, false);
        if (at != null) kind = 'partly';
      }
      if (!kind) continue;
      let entry = byRoot.get(cover.root);
      if (!entry) {
        entry = { root: cover.root, cover, hits: new Map(), behindModal: false };
        byRoot.set(cover.root, entry);
      }
      const prev = entry.hits.get(c.el);
      if (prev && prev.kind === 'entirely') continue;
      entry.hits.set(c.el, { c, kind, at, cover });
      if (behindModal) entry.behindModal = true;
    }
  }
  if (!byRoot.size)
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };

  // Content the user opened: a control the page marks expanded
  // (aria-expanded="true") names the box, or something in or around it, with
  // aria-controls, as a menu button does its drawer. The criterion allows
  // such content to cover the focused element when the user can close it
  // without moving focus, which only a person can try.
  const opened = [];
  for (const ctl of typeof helpers.queryAllSmart === 'function'
    ? helpers.queryAllSmart('[aria-expanded="true" i][aria-controls]')
    : []) {
    for (const idref of trim(dom.getAttribute(ctl, 'aria-controls')).split(/\s+/)) {
      if (!idref) continue;
      let target;
      try {
        target = helpers.getElementByIdInTree(ctl, idref);
      } catch {
        target = null;
      }
      if (target) opened.push(target);
    }
  }
  const userOpened = (root) =>
    opened.some((t) => t === root || dom.contains(root, t) || dom.contains(t, root));

  // ---- Confirm with the browser: scroll a few there and hit-test ----
  // Scrolling the window makes the browser fire `scroll` and `scrollend` at
  // the page once the scan is over, though the page is put back where it
  // was: a page that loads a widget on its first scroll would change under
  // the next scan. A capturing listener on the window keeps those two
  // events, for the window's own scrolling only, from the page's listeners,
  // and goes once the scrollend has passed (where the browser has none, the
  // scroll), or a moment later where no event comes. Shared with the
  // variant run in the same scan (focus-not-obscured-enhanced).
  const guards = memoOf('scrollGuard');
  function guardScrollEvents() {
    const current = guards.get(view);
    if (current && current.active) return;
    const guard = { active: true };
    guards.set(view, guard);
    const withScrollEnd = 'onscrollend' in view;
    const remove = () => {
      if (!guard.active) return;
      guard.active = false;
      try {
        dom.removeEventListener(view, 'scroll', stop, true);
        dom.removeEventListener(view, 'scrollend', stop, true);
      } catch {}
    };
    function stop(e) {
      if (!guard.active || (e.target !== document && e.target !== view)) return;
      e.stopImmediatePropagation();
      if (e.type === 'scrollend' || !withScrollEnd) remove();
    }
    try {
      dom.addEventListener(view, 'scroll', stop, true);
      dom.addEventListener(view, 'scrollend', stop, true);
      if (typeof view.setTimeout === 'function') view.setTimeout(remove, 500);
    } catch {
      remove();
    }
  }
  let moved = false;
  // Whether the page moved, where it had to: a page that replaced scrollTo
  // with one that does nothing leaves it where it was, and the hit test
  // there would measure another place.
  const currentScrollY = () => Number(dom.get(view, 'scrollY')) || 0;
  const scrollTo = (y) => {
    const from = currentScrollY();
    if (y !== scrollY && !moved) {
      moved = true;
      guardScrollEvents();
    }
    try {
      dom.call(view, 'scrollTo', { left: scrollX, top: y, behavior: 'instant' });
    } catch {
      try {
        dom.call(view, 'scrollTo', scrollX, y);
      } catch {}
    }
    return Math.abs(y - from) < 1 || Math.abs(currentScrollY() - from) >= 1;
  };
  const FRACTIONS = [0.15, 0.5, 0.85];
  function hiddenShare(hit) {
    const { c, at, cover } = hit;
    // Not scrolled there: nothing to measure (null).
    if (!scrollTo(Math.max(0, Math.min(maxScroll, c.docTop - at)))) return null;
    const r = dom.getBoundingClientRect(c.el);
    let covered = 0;
    let total = 0;
    for (const fx of FRACTIONS) {
      for (const fy of FRACTIONS) {
        const x = r.left + r.width * fx;
        const y = r.top + r.height * fy;
        total += 1;
        let top;
        try {
          top = dom.call(document, 'elementFromPoint', x, y);
          // Through open shadow roots: the document answers with the host.
          for (let depth = 0; top && depth < 32; depth++) {
            const shadow = dom.shadowRoot(top);
            if (!shadow) break;
            const inner = dom.call(shadow, 'elementFromPoint', x, y);
            if (!inner || inner === top) break;
            top = inner;
          }
        } catch {
          top = null;
        }
        // The hit is read in the composed tree: it may be inside a
        // component the cover or the focused element holds, where contains()
        // stops at the shadow boundary (round 8, NW-2).
        if (!top || top === c.el || inComposed(top, c.el) || inComposed(c.el, top)) continue;
        if (!inComposed(top, cover.root)) continue;
        // Drawn there: the part hit, or a box around it within the root,
        // and for 2.4.11 drawn opaque, as what shows through hides nothing
        // entirely.
        let drawn = false;
        for (let n = top, i = 0; n && i < 10000; n = composedUp(n), i++) {
          if (drawnAt(n, styleOf(n), x, y, partlyToo)) {
            drawn = true;
            break;
          }
          if (n === cover.root) break;
        }
        if (drawn) covered += 1;
      }
    }
    return total ? covered / total : 0;
  }

  // Each check scrolls the page and hit-tests it, which costs more the
  // larger the page: a page with hundreds of sticky boxes made the rule cost
  // their number times the page's size. So a page lists at most
  // MAX_OCCURRENCES boxes, in document order, and checks at most
  // MAX_CHECKS elements; the boxes left unchecked are counted in the
  // result's data.details (uncheckedCount, truncated).
  const SAMPLES = 3;
  const MAX_OCCURRENCES = 50;
  const MAX_CHECKS = MAX_OCCURRENCES * SAMPLES;
  let checks = 0;
  let uncheckedCount = 0;
  const occurrences = [];
  try {
    for (const entry of byRoot.values()) {
      if (occurrences.length >= MAX_OCCURRENCES || checks >= MAX_CHECKS) {
        uncheckedCount += 1;
        continue;
      }
      const hits = [...entry.hits.values()];
      const entirely = hits.filter((h) => h.kind === 'entirely');
      const partly = hits.filter((h) => h.kind === 'partly');
      const ordered = [...entirely, ...partly];
      let confirmed = null;
      // An element the page would not scroll under the box: the box can't
      // be confirmed or cleared, so it is asked about, without a lean
      // (round 9, R9-4).
      let notScrolled = null;
      for (const h of ordered.slice(0, SAMPLES)) {
        checks += 1;
        const share = hiddenShare(h);
        if (share == null) {
          notScrolled = notScrolled || h;
          continue;
        }
        if (h.kind === 'entirely' ? share >= 1 : share > 0) {
          confirmed = h;
          break;
        }
      }
      if (!confirmed && !notScrolled) continue;

      const rootCs = styleOf(entry.root);
      const position = positionOf(rootCs);
      const cover = entry.cover;
      const mid = (cover.top + cover.bottom) / 2;
      const side = mid < vh / 3 ? 'top' : mid > (vh * 2) / 3 ? 'bottom' : 'middle';
      const coverPx = Math.max(
        0,
        Math.min(cover.bottom, zoneBottom) - Math.max(cover.top, zoneTop)
      );
      const first = (entirely[0] || partly[0]).c.el;
      const firstTag = describe(first, { text: true }) || `<${lower(dom.tagName(first))}>`;
      const container = describe(entry.root) || `<${lower(dom.tagName(entry.root))}>`;
      const count = entirely.length || partly.length;
      const code = entry.behindModal
        ? 'FOCUS_OBSCURED_BEHIND_MODAL'
        : entirely.length
          ? 'FOCUS_OBSCURED_ENTIRELY'
          : 'FOCUS_OBSCURED_PARTLY';
      const scrollPaddingPx = side === 'bottom' ? padBottom : side === 'top' ? padTop : 0;
      // The scroll-padding that clears the box: from its edge of the window
      // to its far side, a box stacked under another included.
      const paddingPx = Math.ceil(side === 'bottom' ? vh - cover.top : cover.bottom);
      const openedByUser = userOpened(entry.root);

      let summary;
      let hint;
      let keys;
      let lean;
      let summaryKeys;
      const userOpenedCaution =
        'If the user opened this content and can close it without moving focus, such as with Escape, it passes.';
      if (code === 'FOCUS_OBSCURED_BEHIND_MODAL') {
        summary = `A modal dialog is open, but ${count} focusable elements outside it, such as ${firstTag}, still take focus while ${container} covers them.`;
        hint =
          'While the dialog is open, keep focus inside it: make the rest of the page inert, or open a <dialog> with showModal().';
        keys = 'behindModal';
        lean = {
          toward: 'fail',
          why: 'A modal dialog is open, yet focus can still reach elements behind it that its dialog or backdrop covers.',
          signals: [
            { signal: 'modal-open', value: true },
            { signal: 'elements-covered', value: count },
            { signal: 'hit-test-confirmed', value: true }
          ],
          i18n: { whyKey: 'focusNotObscuredMinimum_lean_why_behindModal' }
        };
      } else {
        const how = code === 'FOCUS_OBSCURED_ENTIRELY' ? 'entirely' : 'partly';
        summary = `${count} focusable elements, such as ${firstTag}, can take focus ${how} hidden behind this ${position} ${container}: it covers ${Math.round(coverPx)}px of the window that the page still counts as in view, so focus doesn't scroll them out from under it.`;
        hint =
          side === 'middle'
            ? 'Keep the box from covering the page while it is not in use, or move it to the top or bottom edge and give the page a scroll-padding on that side at least as large as the box, so focus scrolls elements clear of it.'
            : `Give the page a scroll-padding-${side} of at least ${paddingPx}px (on the html element), so focus scrolls elements clear of the box; or make the box smaller, or not ${position}.`;
        keys = code === 'FOCUS_OBSCURED_ENTIRELY' ? 'entirely' : 'partly';
        // A box a control marks as opened by the user gets no lean: whether
        // it closes without moving focus is for a person to try.
        lean = openedByUser
          ? null
          : {
              toward: 'fail',
              why:
                code === 'FOCUS_OBSCURED_ENTIRELY'
                  ? 'The box stays over part of the window the page counts as in view, and the browser draws it on top of an element placed there, so that element takes focus out of sight.'
                  : 'The box stays over part of the window the page counts as in view, and the browser draws it on top of part of an element placed there.',
              signals: [
                { signal: 'position', value: position },
                { signal: 'cover-px', value: Math.round(coverPx) },
                { signal: 'scroll-padding-px', value: scrollPaddingPx },
                { signal: 'hit-test-confirmed', value: true }
              ],
              caution: userOpenedCaution,
              i18n: {
                whyKey:
                  code === 'FOCUS_OBSCURED_ENTIRELY'
                    ? 'focusNotObscuredMinimum_lean_why_entirely'
                    : 'focusNotObscuredMinimum_lean_why_partly',
                cautionKey: 'focusNotObscuredMinimum_lean_caution_userOpened'
              }
            };
      }

      if (!confirmed) {
        summary = `${count} focusable elements, such as ${firstTag}, may take focus hidden behind this ${position} ${container}, which covers ${Math.round(coverPx)}px of the window that the page still counts as in view; the page did not scroll when asked, so whether the box is drawn over them could not be checked.`;
        summaryKeys = 'notScrolled';
        lean = null;
      }

      const baseOccurrence = {
        ...(lean ? { lean } : {}),
        summary,
        hint,
        i18n: {
          summaryKey: `focusNotObscuredMinimum_summary_cantTell_${summaryKeys || keys}`,
          hintKey:
            keys === 'behindModal'
              ? 'focusNotObscuredMinimum_hint_cantTell_behindModal'
              : side === 'middle'
                ? 'focusNotObscuredMinimum_hint_cantTell_middle'
                : 'focusNotObscuredMinimum_hint_cantTell_edge',
          params: {
            count,
            example: firstTag,
            container,
            position,
            side,
            coverPx: Math.round(coverPx),
            paddingPx
          }
        },
        data: {
          details: {
            reasonCode: code,
            metrics: {
              entirelyCount: entirely.length,
              ...(partlyToo ? { partlyCount: partly.length } : {}),
              position,
              side,
              coverPx: Math.round(coverPx),
              scrollPaddingPx,
              paddingNeededPx: paddingPx
            },
            openedByUser,
            examples: ordered.slice(0, 5).map((h) => example(h.c.el)),
            confirmedBy: confirmed ? example(confirmed.c.el) : null,
            ...(confirmed ? {} : { notScrolled: true })
          },
          visibilityFilter: { targetSet: 'acc', accEligible: null, reasons: [] }
        }
      };
      occurrences.push(
        typeof helpers.reportOccurrence === 'function'
          ? helpers.reportOccurrence(entry.root, baseOccurrence)
          : { __node: entry.root, selector: '', html: '', ...baseOccurrence }
      );
    }
  } finally {
    if (moved) scrollTo(scrollY);
  }

  // Only where boxes were left unchecked: how many boxes could hide an
  // element, how many are listed, and how many weren't checked.
  const listing = uncheckedCount
    ? {
        data: {
          details: {
            boxCount: byRoot.size,
            reportedCount: occurrences.length,
            uncheckedCount,
            maxOccurrences: MAX_OCCURRENCES,
            truncated: true
          }
        }
      }
    : {};
  if (!occurrences.length)
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [], ...listing };
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'serious',
    occurrences,
    ...listing
  };
}

const settings = {
  obscured: 'entirely'
};

// What each setting changes, for the catalog and docs/RULE_SETTINGS.md.
const settingsInfo = {
  obscured: {
    values: ['entirely', 'partly'],
    description:
      "Which focused elements are asked about: those that can be hidden entirely ('entirely'), or also those that can be hidden in part ('partly').",
    basis: 'WCAG 2.4.11: not entirely hidden (2.4.12: no part hidden)'
  }
};

module.exports = { id, meta, runInPage, settings, settingsInfo };
