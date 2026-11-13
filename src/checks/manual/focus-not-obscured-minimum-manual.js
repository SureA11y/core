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
 *   background, an image or a picture), such as a sticky header or footer, a
 *   cookie banner or a chat widget. Without a layout (jsdom) nothing can be
 *   measured, and the rule is notApplicable.
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
 *   containing block, where it can be. One finding per box, naming how many
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
 *   - `confirmedBy`: the element the rule scrolled under the box to check
 *     that the box is drawn on top of it, as `{ tag, text }`.
 * @reason-codes
 *   - `FOCUS_OBSCURED_ENTIRELY` (cantTell): a box the page keeps in place
 *     covers part of the window the page still counts as in view, so
 *     elements in the tab order that fit under it can take focus entirely
 *     hidden behind it. It leans fail: the box covers them whatever the user
 *     does, unless the user opened it and can close it without moving focus.
 *     A box a control marks as opened (`openedByUser`) gets no lean: whether
 *     it closes without moving focus is for a person to try.
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
 *   page is at opacity 0. A transparent box over the element hides nothing.
 * - The hit test (elementFromPoint) skips boxes with pointer-events: none,
 *   so such a box isn't confirmed and isn't reported.
 * - Scrolling is instant and undone before the rule returns. The page's
 *   scroll listeners still see it, after the rule has measured.
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
  // The nearest fixed or sticky box an element is in (itself included).
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
      if (pos === 'fixed' || pos === 'sticky') {
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
  const vh = Number(dom.get(html, 'clientHeight')) || 0;
  const maxScroll = Math.max(0, (Number(dom.get(scroller, 'scrollHeight')) || 0) - vh);
  const htmlCs = styleOf(html);
  const padTop = px(htmlCs && htmlCs.scrollPaddingTop);
  const padBottom = px(htmlCs && htmlCs.scrollPaddingBottom);

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
    if (!paints(el, cs)) return null;
    const r = dom.getBoundingClientRect(el);
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
      top,
      bottom: top + r.height,
      left: r.left,
      right: r.right,
      block,
      stuck
    };
  });
  const covers = [];
  for (const el of [...dom.querySelectorAll(document, 'body *')]) {
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
    for (const c of candidates) {
      const behindModal = modals.length > 0 && !inModal(c.el);
      const horizontallyAll = cover.left <= c.left + 0.5 && cover.right >= c.right - 0.5;
      const horizontallySome = cover.left < c.right - 0.5 && cover.right > c.left + 0.5;
      let kind = null;
      let at = null;
      if (horizontallyAll) {
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
  const scrollTo = (y) => {
    try {
      dom.call(view, 'scrollTo', { left: scrollX, top: y, behavior: 'instant' });
    } catch {
      try {
        dom.call(view, 'scrollTo', scrollX, y);
      } catch {}
    }
  };
  const FRACTIONS = [0.15, 0.5, 0.85];
  function hiddenShare(hit) {
    const { c, at, cover } = hit;
    scrollTo(Math.max(0, Math.min(maxScroll, c.docTop - at)));
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
        } catch {
          top = null;
        }
        if (!top || top === c.el || dom.contains(c.el, top) || dom.contains(top, c.el)) continue;
        if (!dom.contains(cover.root, top)) continue;
        // Drawn there: the part hit, or a box around it within the root.
        let drawn = false;
        for (let n = top, i = 0; n && i < 10000; n = dom.parentElement(n), i++) {
          if (paints(n, styleOf(n))) {
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
      for (const h of ordered.slice(0, SAMPLES)) {
        checks += 1;
        const share = hiddenShare(h);
        if (h.kind === 'entirely' ? share >= 1 : share > 0) {
          confirmed = h;
          break;
        }
      }
      if (!confirmed) continue;

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

      const baseOccurrence = {
        ...(lean ? { lean } : {}),
        summary,
        hint,
        i18n: {
          summaryKey: `focusNotObscuredMinimum_summary_cantTell_${keys}`,
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
            confirmedBy: example(confirmed.c.el)
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
    scrollTo(scrollY);
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
