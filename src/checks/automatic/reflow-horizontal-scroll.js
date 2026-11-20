/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check reflow-horizontal-scroll
 * @atomic true
 * @summary At 320 CSS pixels wide, the page must not scroll sideways
 * @standard WCAG 2.2
 * @sc 1.4.10
 * @applicability
 *   Applies to a page laid out at a viewport 320 CSS pixels wide or less,
 *   in a horizontal writing mode (the body's, which the page takes), that is
 *   the page itself: the top
 *   document, or a framed one the host names as the page
 *   (`engineOptions.topLevelDocument`). A host scans the page at that width
 *   to check reflow, as a phone shows it or a 1280 pixel window at 400% zoom
 *   does. The width is the layout viewport's (the root's clientWidth): a
 *   phone browser that zooms out to show a wider page widens innerWidth,
 *   not the width the page is laid out in. At a wider viewport, in vertical text, in a document shown in a
 *   frame, and without a layout (jsdom), the rule is notApplicable.
 * @expectation
 *   WCAG 1.4.10: at that width, content is shown without scrolling in two
 *   directions, except parts that need a two-dimensional layout to be used
 *   or understood (maps, diagrams, video, games, data tables).
 *   - When the page scrolls sideways (its scrolling box is wider than the
 *     viewport, and the root lets it scroll), each element that sticks out
 *     past the viewport's end edge (the right, or the left in right-to-left
 *     text) while its parent stays inside is the cause, and fails
 *     (HORIZONTAL_SCROLL). Its children that stick out with it are not
 *     reported again.
 *   - Where that element is one the exception may cover, it is asked about
 *     instead: a table (WIDE_TABLE), which leans pass when it has header
 *     cells or a caption (a data table) and fail when it is a layout table;
 *     an image, video, canvas, SVG, embedded object or frame
 *     (WIDE_MEDIA), which leans fail for an image or a video, since those
 *     can be scaled to fit; and preformatted text (WIDE_PREFORMATTED), such
 *     as code, with no lean.
 *   - When the page scrolls sideways and no element can be named (the
 *     overflow comes from a margin, a pseudo-element, a closed shadow root,
 *     or an open one the scan leaves out with `includeShadowDom: false`),
 *     the document fails (HORIZONTAL_SCROLL_UNATTRIBUTED): that it scrolls
 *     is measured, not guessed. Open shadow roots are read like the rest of
 *     the page, and a box around a shadow host is a box around what its
 *     shadow tree shows.
 *   - Text, an image, media or a field that the start edge cuts through
 *     (the left, or the right in right-to-left text, as a negative margin
 *     or a relative offset leaves it) can't be reached, as nothing scrolls
 *     past the start, whether or not the page scrolls: it is asked about
 *     (CLIPPED_AT_VIEWPORT_EDGE, its `edge` the start's), and fails where a
 *     field is cut. A box alone is not content (a background, a negative
 *     margin its padding takes back), and what lies wholly past the edge
 *     waits there on purpose (a skip link, replaced text).
 *   - When the root keeps the page from scrolling sideways (`overflow-x:
 *     hidden` or `clip` on the root, or on the body that passes it on), an
 *     element that the viewport's end edge cuts through is asked about
 *     (CLIPPED_AT_VIEWPORT_EDGE): part of it can't be reached. It leans
 *     fail, and fails where a field in it is cut. One wholly past
 *     the edge is left out: off-canvas menus and slides wait there on
 *     purpose.
 *   - A box fixed to the viewport (`position: fixed`, with no box around it
 *     that holds what is fixed in it, through a transform, a filter or
 *     containment) doesn't widen the page and stays put as it scrolls, so
 *     what of it lies past the edge is never reached, whether or not the
 *     page scrolls: where the edge cuts through it, it is asked about, or
 *     fails, the same way (CLIPPED_AT_VIEWPORT_EDGE).
 *   - When the root's overflow isn't visible, the body's stays its own, and
 *     the body is a box like any other below. A box that scrolls on its own
 *     and fills the viewport while the page itself doesn't scroll, as an
 *     app's shell does, is the page: what sticks out of it is judged as
 *     above (HORIZONTAL_SCROLL, WIDE_TABLE, WIDE_MEDIA, WIDE_PREFORMATTED).
 *   - A box that scrolls on its own (`overflow-x: auto` or `scroll`) keeps
 *     what is in it from widening the page. A table (unless it is a layout
 *     table), preformatted text or media in it, inside the box, may scroll
 *     sideways there, as the exception allows. Where it lies is read with
 *     the box scrolled to its start, wherever it was left. Anything
 *     else that sticks out of the box (a form, text, a menu) still needs
 *     sideways scrolling, and is asked about (SCROLLS_IN_CONTAINER, leaning
 *     fail). Where a field in it is itself cut off (a text field, select,
 *     text area, editable content or a widget with a matching role, shown
 *     and not disabled, not a button), no exception covers it, and it fails
 *     instead; one whose fields show whole, its help text cut, is asked
 *     about.
 *   - An element inside a box that hides what overflows it (`overflow-x:
 *     hidden` or `clip`, or paint containment: `contain: paint`, `content`
 *     or `strict`, `content-visibility: auto` or `hidden`) keeps the page
 *     from scrolling, but what sticks out
 *     of the box is cut off with no way to reach it, whether or not the page
 *     scrolls. Where it starts, such an element is asked about
 *     (CLIPPED_BY_CONTAINER) and leans fail, or fails where a field in it is
 *     cut (a table, code or media is still asked about). Left out: an
 *     element wholly outside the box (waiting there on purpose), one above
 *     or below a box that also hides what overflows downwards (a collapsed
 *     panel), a box a pixel wide (visually
 *     hidden text), inline text truncated with an ellipsis (not a block or a
 *     field the box cuts off), and an element placed out
 *     of the box (fixed, or absolute from outside it).
 *   - A pass is given only for a scan of the whole document; a scoped scan
 *     reports what it finds in its scope, and is otherwise notApplicable.
 *   At most 50 elements are listed per reason code; the result's
 *   `data.omitted` says how many more each had.
 *   - One cause is named once: a body too wide itself (a min-width) is
 *     named, not each of its children, and a line that doesn't wrap names
 *     the block that holds it, not each inline piece of it.
 *   - What doesn't show isn't measured: text hidden by a clip or an empty
 *     clip-path (visually hidden text), content within an `overflow: clip`
 *     box's `overflow-clip-margin`, and a frameset's own document, whose
 *     frames are judged as their own pages (notApplicable).
 * @reports
 *   - `overflowPx`: how far the element reaches past the viewport's end
 *     edge, in CSS pixels.
 *   - `widthPx`: the element's width, in CSS pixels.
 *   - `edge`: the edge it reaches past or is cut at: the end edge, `right`,
 *     or `left` in right-to-left text, or the start edge for content cut
 *     there.
 *   - `viewport.width`: the width content is laid out in (the viewport less
 *     any vertical scrollbar), and `viewport.scrollWidth`: the page's.
 *   - `element`: the element's tag name.
 * @reason-codes
 *   - `HORIZONTAL_SCROLL` (fail): at 320 CSS pixels wide the page scrolls
 *     sideways, and this element sticks out past the edge of the viewport.
 *     Basis: WCAG 1.4.10.
 *   - `HORIZONTAL_SCROLL_UNATTRIBUTED` (fail): the page scrolls sideways at
 *     320 CSS pixels wide, and no element can be named as the cause.
 *     Basis: WCAG 1.4.10.
 *   - `WIDE_TABLE` (cantTell): a table, or a grid widget (role grid or
 *     treegrid), sticks out past the edge; a data table is covered by the
 *     exception for content that needs a two-dimensional layout, a layout
 *     table is not. It leans pass for a grid or a table with header cells
 *     or a caption, and fail for one marked as layout (role presentation
 *     or none) or with neither.
 *     Basis: WCAG 1.4.10 (exception: two-dimensional layout).
 *   - `WIDE_MEDIA` (cantTell): an image, video, canvas, SVG, embedded
 *     object, frame, formula (MathML) or application (role application, as
 *     a map or a game is) sticks out past the edge; it may need its size.
 *     It leans fail for an image or a video, which can usually be scaled to
 *     fit.
 *     Basis: WCAG 1.4.10 (exception: two-dimensional layout).
 *   - `WIDE_PREFORMATTED` (cantTell): preformatted text, such as code,
 *     doesn't wrap and sticks out past the edge; whether its layout is
 *     needed to understand it is for a person to judge.
 *     Basis: WCAG 1.4.10 (not settled).
 *   - `SCROLLS_IN_CONTAINER` (cantTell): this element, not a table, code block
 *     or media, reaches past the edge of the box around it, which scrolls
 *     sideways (`overflow-x: auto` or `scroll`) to show it. It leans fail,
 *     and fails where a field in it is cut off, which no exception covers.
 *     It leans pass for a row of items each of which fits the box, as a
 *     carousel is (G225): only the row scrolls.
 *     Basis: WCAG 1.4.10 (not settled).
 *   - `CLIPPED_BY_CONTAINER` (cantTell): a box around this element hides what
 *     overflows it (`overflow-x: hidden` or `clip`), and the element sticks
 *     out of the box, so part of it can't be reached. It leans fail, and fails
 *     where a field in it is cut off, which no exception
 *     covers.
 *     Basis: WCAG 1.4.10 (not settled).
 *   - `CLIPPED_AT_VIEWPORT_EDGE` (cantTell): the page doesn't scroll
 *     sideways, but the edge of the viewport cuts through this element, so
 *     part of it can't be reached. It leans fail.
 *     Basis: WCAG 1.4.10 (not settled).
 * @implementation-notes
 *   The rule reads the browser's own measures: the scrolling box's
 *   scrollWidth against its clientWidth, and each element's bounding box.
 *   At a viewport wider than 320 it returns at once, so a scan at a usual
 *   width pays nothing for it.
 */

const id = 'reflow-horizontal-scroll';

const meta = {
  title: 'Content reflows at 320 CSS pixels wide without scrolling sideways',
  description:
    'At a viewport 320 CSS pixels wide, checks that the page does not scroll sideways, and names the elements that stick out past its edge, asking about tables, media and preformatted text that may need their layout.',
  i18n: {
    titleKey: 'reflowHorizontalScroll_title',
    descriptionKey: 'reflowHorizontalScroll_description'
  },
  helpUrl: null,
  tags: ['wcag21aa', 'wcag1410', 'structure', 'atomic', 'automatic'],
  wcagSc: ['1.4.10'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.4.10',
      title: 'Reflow',
      conformanceLevel: 'AA'
    }
  ],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '1.4.10': ['reflow-320'] } },
  // Reason codes picked from a table, which scripts/generate-finding-ids.js
  // can't read from the source.
  reasonCodes: [
    'HORIZONTAL_SCROLL',
    'HORIZONTAL_SCROLL_UNATTRIBUTED',
    'WIDE_TABLE',
    'WIDE_MEDIA',
    'WIDE_PREFORMATTED',
    'CLIPPED_BY_CONTAINER',
    'SCROLLS_IN_CONTAINER',
    'CLIPPED_AT_VIEWPORT_EDGE'
  ]
};

// The page itself: a framed document is laid out at its frame's width, not
// the window's, unless the host says it is the page.
function applicability(ctx) {
  const { helpers } = ctx;
  return !(helpers.isTopLevelDocument && !helpers.isTopLevelDocument());
}

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;
  const view = dom.defaultView(document) || null;
  const REFLOW_WIDTH = 320;
  const TOLERANCE = 1; // sub-pixel rounding
  const MAX_PER_CODE = 50;

  const notApplicable = (reason) => ({
    ruleId: rule.ruleId,
    outcome: 'notApplicable',
    severity: 'minor',
    occurrences: [],
    ...(reason ? { data: { reason } } : {})
  });

  const html = dom.documentElement(document);
  const body = dom.body(document);
  if (!view || !html || !body) return notApplicable('noLayout');
  // A frameset shows other documents, each laid out in its frame: each is
  // judged as its own page, when a host scans it.
  if (String(dom.tagName(body) || '').toLowerCase() === 'frameset') {
    return notApplicable('frameset');
  }

  // A layout: the root has boxes (jsdom gives none).
  try {
    const rects = dom.getClientRects(html);
    if (!rects || !rects.length) return notApplicable('noLayout');
  } catch {
    return notApplicable('noLayout');
  }

  // The layout viewport's width: the root's clientWidth. A phone browser
  // zooms out to show a page wider than its layout viewport, which widens
  // innerWidth exactly when the page overflows, so innerWidth alone would
  // turn the rule off on the pages it is for.
  const innerWidth = Number(dom.get(view, 'innerWidth')) || 0;
  const layoutWidth = Number(dom.get(html, 'clientWidth')) || 0;
  const width = layoutWidth ? Math.min(layoutWidth, innerWidth || layoutWidth) : innerWidth;
  if (!width || width > REFLOW_WIDTH) return notApplicable('viewportWider');

  // Each element's computed style, read once: the walks up from every
  // element read the same boxes' over and over. Live, so it stays current.
  const styleMemo = new Map();
  function style(el) {
    if (styleMemo.has(el)) return styleMemo.get(el);
    let value;
    try {
      value = view.getComputedStyle(el);
    } catch {
      value = null;
    }
    styleMemo.set(el, value);
    return value;
  }
  // An element's parent as the page renders it: through a slot, and from a
  // shadow root to its host, so a box around a shadow host is a box around
  // what its shadow tree shows.
  // A page with no open shadow root and no slot renders its light DOM: the
  // parent is the parent (set once the page's elements are listed, below).
  let plainTree = false;
  const upMemo = new Map();
  const upOf = (node) => {
    if (plainTree) return dom.parentElement(node);
    if (!upMemo.has(node)) upMemo.set(node, flatUp(node));
    return upMemo.get(node);
  };
  const flatUp = (node) => {
    // Light DOM, as most of a page is: a parent that is no shadow host and no
    // slot is the parent the page renders it in.
    const parent = dom.parentElement(node);
    if (parent && !dom.shadowRoot(parent) && String(dom.tagName(parent)).toLowerCase() !== 'slot') {
      return parent;
    }
    if (typeof helpers.flatParentElement === 'function') {
      try {
        return helpers.flatParentElement(node) || null;
      } catch {
        // Read as the light DOM below.
      }
    }
    return dom.parentElement(node);
  };
  const rootStyle = style(html);
  const bodyStyle = style(body);
  // The page's principal writing mode and direction are the body's: the
  // root takes them from it (CSS Writing Modes, "the principal writing
  // mode"), as browsers lay out and scroll the page by them.
  const principal = bodyStyle || rootStyle;
  // Vertical text reflows at 256 CSS pixels high, which this rule doesn't
  // measure.
  if (principal && /^vertical|^sideways/.test(String(principal.writingMode || ''))) {
    return notApplicable('verticalWritingMode');
  }
  const rtl = principal ? principal.direction === 'rtl' : false;

  // Whether the viewport scrolls sideways: the root's overflow-x, or the
  // body's when the root's is visible (CSS Overflow 3, propagation).
  const clips = (s) => !!s && (s.overflowX === 'hidden' || s.overflowX === 'clip');
  // The body's overflow goes to the viewport only while the root's is
  // visible on both axes; otherwise the body is a box of its own, which
  // hides or scrolls what overflows it like any other.
  const bodyPropagates =
    !!rootStyle && rootStyle.overflowX === 'visible' && rootStyle.overflowY === 'visible';
  const rootClips = clips(rootStyle) || (bodyPropagates && clips(bodyStyle));
  // Where the walks up from an element stop: at the body, unless it is a box
  // of its own.
  const top = (node) => !node || node === html || (node === body && bodyPropagates);

  const scroller = dom.get(document, 'scrollingElement') || html;
  const clientWidth = Number(dom.get(scroller, 'clientWidth')) || width;
  const scrollWidth = Number(dom.get(scroller, 'scrollWidth')) || clientWidth;
  const scrollX = Number(dom.get(view, 'scrollX')) || 0;
  const pageScrolls = !rootClips && scrollWidth > clientWidth + TOLERANCE;

  // How far an element reaches past the end edge, in page coordinates.
  function overflowOf(rect) {
    if (rtl) return -(rect.left + scrollX);
    return rect.right + scrollX - clientWidth;
  }
  // How far it starts inside the edge: positive while part of it shows.
  function insideOf(rect) {
    if (rtl) return rect.right + scrollX;
    return clientWidth - (rect.left + scrollX);
  }
  // How far it reaches past the start edge (the left, or the right in
  // right-to-left text), where the page can't scroll: nothing scrolls to
  // what lies before its start. And how much of it shows.
  function beforeStartOf(rect) {
    if (rtl) {
      return {
        over: rect.right + scrollX - clientWidth,
        inside: clientWidth - (rect.left + scrollX)
      };
    }
    return { over: -(rect.left + scrollX), inside: rect.right + scrollX };
  }
  const startEdge = rtl ? 'right' : 'left';

  const roots = (Array.isArray(ctx.root) ? ctx.root : [ctx.root]).filter(Boolean);
  const wholeDocument =
    !roots.length || roots.some((r) => r === document || r === html || r === body);
  function inScope(el) {
    if (wholeDocument) return true;
    return roots.some((r) => {
      try {
        return r === el || dom.contains(r, el);
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

  // Paint containment clips what overflows the box, as overflow: clip does,
  // though overflow-x stays visible: contain: paint (or content, strict),
  // and content-visibility: auto or hidden, which apply it.
  function containsPaint(s) {
    if (!s) return false;
    const contain = s.contain;
    if (contain && contain !== 'none' && /\b(paint|content|strict)\b/.test(contain)) return true;
    const cv = s.contentVisibility;
    return cv === 'auto' || cv === 'hidden';
  }
  // Whether a box sets overflow sideways: it scrolls or clips.
  const setsOverflow = (s) => !!s && (s.overflowX !== 'visible' || containsPaint(s));
  // The same, per element and once: every walk up reads the same boxes.
  const setsMemo = new Map();
  const boxSetsOverflow = (el) => {
    if (!setsMemo.has(el)) setsMemo.set(el, setsOverflow(style(el)));
    return setsMemo.get(el);
  };
  // Whether a box makes itself the containing block of what is fixed in it
  // (CSS Transforms, Filter Effects, Containment, Will Change).
  function holdsFixed(s) {
    if (!s) return false;
    if (s.transform && s.transform !== 'none') return true;
    if (s.perspective && s.perspective !== 'none') return true;
    if (s.filter && s.filter !== 'none') return true;
    if (s.backdropFilter && s.backdropFilter !== 'none') return true;
    if (/\b(transform|perspective|filter)\b/.test(String(s.willChange || ''))) return true;
    return /\b(paint|layout|content|strict)\b/.test(String(s.contain || ''));
  }
  // The element, or the ancestor, that is fixed to the viewport: it stays put
  // as the page scrolls, so what of it lies past the edge is never reached.
  // Null when none is, or when a box around it holds what is fixed in it.
  const fixedMemo = new Map();
  function fixedOf(el) {
    if (fixedMemo.has(el)) return fixedMemo.get(el);
    let value = null;
    let node = el;
    const path = [];
    while (node && node !== html) {
      if (fixedMemo.has(node)) {
        value = fixedMemo.get(node);
        break;
      }
      path.push(node);
      const s = style(node);
      if (s && s.position === 'fixed') {
        let up = upOf(node);
        let held = false;
        while (up && up !== html) {
          if (holdsFixed(style(up))) {
            held = true;
            break;
          }
          up = upOf(up);
        }
        if (!held) value = node;
        break;
      }
      node = upOf(node);
    }
    for (const n of path) fixedMemo.set(n, value);
    return value;
  }

  // A box that scrolls on its own and fills the viewport, as an app's shell
  // does when the root and body hide overflow: it is the page, so what it
  // holds is judged as the page's content.
  const viewportHeight =
    Number(dom.get(html, 'clientHeight')) || Number(dom.get(view, 'innerHeight')) || 0;
  const shellMemo = new Map();
  function isShell(box) {
    if (shellMemo.has(box)) return shellMemo.get(box);
    let value = false;
    try {
      const s = style(box);
      if (
        s &&
        (s.overflowX === 'auto' || s.overflowX === 'scroll') &&
        (rootClips || !bodyPropagates)
      ) {
        const b = dom.getBoundingClientRect(box);
        const pageStill =
          (Number(dom.get(scroller, 'scrollHeight')) || 0) <=
          (Number(dom.get(scroller, 'clientHeight')) || 0) + TOLERANCE;
        value =
          pageStill &&
          b.left <= TOLERANCE &&
          b.width >= width - TOLERANCE * 16 &&
          viewportHeight > 0 &&
          b.height >= viewportHeight - TOLERANCE * 16;
      }
    } catch {
      value = false;
    }
    shellMemo.set(box, value);
    return value;
  }

  // Boxes that keep their content from widening the page: they scroll or
  // clip sideways. Their own box is measured; what is inside them is not.
  const contained = new Map();
  function insideSidewaysBox(el) {
    let node = upOf(el);
    const path = [];
    let found = false;
    while (!top(node)) {
      if (contained.has(node)) {
        found = contained.get(node);
        break;
      }
      path.push(node);
      if (boxSetsOverflow(node)) {
        found = true;
        break;
      }
      node = upOf(node);
    }
    for (const n of path) contained.set(n, found);
    return found;
  }

  // Boxes that hide what overflows them (not the root: the viewport's own
  // clipping is judged above). What sticks out of one is cut off, and the
  // page doesn't scroll to it.
  const cuts = (s) =>
    !!s && (s.overflowX === 'hidden' || s.overflowX === 'clip' || containsPaint(s));
  const cutsMemo = new Map();
  const boxCuts = (box) => {
    if (!cutsMemo.has(box)) cutsMemo.set(box, cuts(style(box)));
    return cutsMemo.get(box);
  };
  // The nearest box around `start` (itself included when `self`) that sets
  // overflow sideways, whether it hides what overflows or scrolls it; null
  // when there is none.
  const cutterMemo = new Map();
  function cutterOf(start, self) {
    let node = self ? start : upOf(start);
    const path = [];
    let found = null;
    while (!top(node)) {
      if (cutterMemo.has(node)) {
        found = cutterMemo.get(node);
        break;
      }
      path.push(node);
      if (boxSetsOverflow(node)) {
        found = node;
        path.pop();
        cutterMemo.set(node, found);
        break;
      }
      node = upOf(node);
    }
    for (const n of path) cutterMemo.set(n, found);
    return found;
  }
  // Whether the element is placed out of the box: fixed, or absolute with no
  // positioned box between it and the cutter.
  // A box between them, or the cutter itself, that holds what is fixed in
  // it (a transform, a filter, containment) keeps a fixed element in.
  const escapesMemo = new Map();
  function escapes(el, box) {
    let byBox = escapesMemo.get(el);
    if (!byBox) escapesMemo.set(el, (byBox = new Map()));
    if (!byBox.has(box)) byBox.set(box, escapesFrom(el, box));
    return byBox.get(box);
  }
  function escapesFrom(el, box) {
    let node = el;
    while (node && node !== box) {
      const s = style(node);
      const position = s ? s.position : 'static';
      if (position === 'fixed' || position === 'absolute') {
        let up = upOf(node);
        let held = false;
        while (up) {
          const us = style(up);
          if (us && (holdsFixed(us) || (position === 'absolute' && us.position !== 'static'))) {
            held = true;
            break;
          }
          if (up === box) break;
          up = upOf(up);
        }
        if (!held) return true;
      }
      node = upOf(node);
    }
    return false;
  }
  // How far a rect reaches past the end edge of a box's visible area, and how
  // much of it starts inside.
  function pastBox(rect, box) {
    let b;
    try {
      b = dom.getBoundingClientRect(box);
    } catch {
      return null;
    }
    const left = b.left + (Number(dom.get(box, 'clientLeft')) || 0);
    const cw = Number(dom.get(box, 'clientWidth')) || 0;
    const ch = Number(dom.get(box, 'clientHeight')) || 0;
    // A box a pixel wide hides text on purpose (visually hidden text).
    if (cw < 2 || ch < 2) return null;
    // A box that also hides what overflows it downwards (a collapsed panel)
    // hides what lies above or below it on purpose: only what shows in its
    // height can be cut off sideways. One that scrolls downwards shows it.
    const bs = style(box);
    if (bs && (bs.overflowY === 'hidden' || bs.overflowY === 'clip' || containsPaint(bs))) {
      const topEdge = b.top + (Number(dom.get(box, 'clientTop')) || 0);
      if (rect.bottom <= topEdge + TOLERANCE || rect.top >= topEdge + ch - TOLERANCE) return null;
    }
    // Where the element lies with the box scrolled to its start, so the
    // verdict doesn't depend on where a script or a person left it: a
    // scrolled box moves its content by scrollLeft (negative in
    // right-to-left text, as browsers now agree).
    const shift = Number(dom.get(box, 'scrollLeft')) || 0;
    const l = rect.left + shift;
    const r = rect.right + shift;
    // overflow: clip paints what overflows within overflow-clip-margin.
    let margin = 0;
    if (bs && bs.overflowX === 'clip') {
      const m = /(-?\d+(?:\.\d+)?)px/.exec(String(bs.overflowClipMargin || ''));
      if (m) margin = Math.max(0, Number(m[1]));
    }
    // The end edge of the visible area: the right, or the left in
    // right-to-left text.
    const edge = rtl ? left - margin : left + cw + margin;
    return rtl ? { over: edge - l, inside: r - edge } : { over: r - edge, inside: edge - l };
  }
  // What a box that scrolls on its own may hold at full width: a table, a
  // preformatted block, media. Anything else in it, a form, text, a menu, that
  // sticks out of the box needs sideways scrolling too.
  // Only what is inside the box counts: a table around the box is not what
  // scrolls in it. A table used for layout has to fit, in a box as on the
  // page. A box that is the page (an app's shell) exempts nothing.
  const exemptMemo = new Map();
  function exemptInScrollBox(el, box) {
    let byBox = exemptMemo.get(el);
    if (!byBox) exemptMemo.set(el, (byBox = new Map()));
    if (!byBox.has(box)) byBox.set(box, exemptFrom(el, box));
    return byBox.get(box);
  }
  function exemptFrom(el, box) {
    try {
      if (isShell(box)) return false;
      const holder = dom.closest(el, 'table, pre');
      if (holder && holder !== box && dom.contains(box, holder)) {
        return !(
          String(dom.tagName(holder) || '').toLowerCase() === 'table' && isLayoutTable(holder)
        );
      }
      return kindOf(el) !== 'HORIZONTAL_SCROLL';
    } catch {
      return false;
    }
  }
  // text-overflow: ellipsis shortens a line of text on purpose: it covers
  // inline content, not a block, a row of fields or a control it cuts off.
  function ellipsisCovers(el, bs) {
    if (!bs || bs.textOverflow !== 'ellipsis') return false;
    const s = style(el);
    const display = s ? String(s.display || '') : '';
    if (display && display !== 'inline' && display !== 'contents') return false;
    return !holdsFormControls(el);
  }
  const clipMemo = new Map();
  // Where `el` is cut by its nearest hiding box: { box, over }, or null.
  function clippedBy(el) {
    if (clipMemo.has(el)) return clipMemo.get(el);
    let value = null;
    try {
      const box = cutterOf(el, false);
      if (box) {
        const bs = style(box);
        const rects = dom.getClientRects(el);
        const es = style(el);
        const scrolls = !boxCuts(box);
        // Where it lies first, which is cheap; what may leave it out after.
        const rect = rects && rects.length ? dom.getBoundingClientRect(el) : null;
        const hit = rect && (rect.width > 0 || rect.height > 0) ? pastBox(rect, box) : null;
        // Part shows inside the box and part is cut off; one wholly past
        // its edge waits there on purpose.
        if (
          hit &&
          hit.over > TOLERANCE &&
          hit.inside > TOLERANCE &&
          !(es && es.visibility === 'hidden') &&
          !(!scrolls && ellipsisCovers(el, bs)) &&
          !escapes(el, box) &&
          !(scrolls && exemptInScrollBox(el, box))
        ) {
          value = { box, over: hit.over, rect, scrolls, shell: scrolls && isShell(box) };
        }
      }
    } catch {
      value = null;
    }
    clipMemo.set(el, value);
    return value;
  }

  const roleOf = (el) =>
    String(
      (helpers.aria && helpers.aria.getExplicitRole && helpers.aria.getExplicitRole(el)) || ''
    ).toLowerCase();
  // A table marked as layout, or with no header cell or caption. A grid is
  // data. Once per table: every cell of a wide table asks it.
  const layoutMemo = new Map();
  function isLayoutTable(el) {
    if (!layoutMemo.has(el)) layoutMemo.set(el, readLayoutTable(el));
    return layoutMemo.get(el);
  }
  function readLayoutTable(el) {
    const role = roleOf(el);
    if (role === 'grid' || role === 'treegrid') return false;
    if (role === 'presentation' || role === 'none') return true;
    return !dom.querySelector(el, 'th, caption, [scope]');
  }

  const MEDIA = new Set(['img', 'video', 'canvas', 'svg', 'object', 'embed', 'iframe', 'picture']);
  // Two-dimensional content the exception may cover: a grid widget as a
  // table, an application (a map, a game) and a formula as media.
  const kindMemo = new Map();
  function kindOf(el) {
    if (!kindMemo.has(el)) kindMemo.set(el, readKind(el));
    return kindMemo.get(el);
  }
  function readKind(el) {
    const tag = String(dom.tagName(el) || '').toLowerCase();
    if (tag === 'table') return 'WIDE_TABLE';
    if (MEDIA.has(tag) || tag === 'math') return 'WIDE_MEDIA';
    const role = roleOf(el);
    if (role === 'grid' || role === 'treegrid') return 'WIDE_TABLE';
    if (role === 'application') return 'WIDE_MEDIA';
    if (tag === 'pre') return 'WIDE_PREFORMATTED';
    // Code kept on its lines by its style, as a highlighter's block is.
    const s = style(el);
    const keepsLines = !!s && (s.whiteSpace === 'pre' || s.whiteSpace === 'nowrap');
    if (keepsLines && (tag === 'code' || dom.querySelector(el, 'code'))) return 'WIDE_PREFORMATTED';
    return 'HORIZONTAL_SCROLL';
  }

  // Fields a person fills in: a form needs no two-dimensional layout to be
  // used or understood, so the exception does not cover it.
  // Buttons are not fields: a button cut off is asked about as anything
  // else is.
  const NATIVE_CONTROLS =
    'input:not([type="hidden" i]):not([type="submit" i]):not([type="button" i]):not([type="reset" i]):not([type="image" i]), select, textarea, [contenteditable]:not([contenteditable="false" i])';
  const CONTROL_ROLES = new Set([
    'textbox',
    'combobox',
    'searchbox',
    'spinbutton',
    'listbox',
    'slider',
    'checkbox',
    'radio',
    'switch'
  ]);
  const ROLE_CONTROLS = [...CONTROL_ROLES].map((r) => `[role~="${r}" i]`).join(', ');
  function isRoleControl(node) {
    const role = String(
      (helpers.aria && helpers.aria.getExplicitRole && helpers.aria.getExplicitRole(node)) || ''
    ).toLowerCase();
    return CONTROL_ROLES.has(role);
  }
  function holdsFormControls(el) {
    return fieldsIn(el).length > 0;
  }
  // The fields in an element, itself included, that a person can fill in:
  // shown (with a box, not visibility: hidden) and not disabled.
  function fieldsIn(el) {
    const out = [];
    try {
      const candidates = [
        el,
        ...(dom.querySelectorAll(el, NATIVE_CONTROLS) || []),
        ...(dom.querySelectorAll(el, ROLE_CONTROLS) || [])
      ];
      for (const c of candidates) {
        if (out.includes(c)) continue;
        const native = dom.matches(c, NATIVE_CONTROLS);
        if (!native && !(dom.matches(c, ROLE_CONTROLS) && isRoleControl(c))) continue;
        if (native && dom.matches(c, ':disabled')) continue;
        if (String(dom.getAttribute(c, 'aria-disabled') || '').toLowerCase() === 'true') continue;
        const rects = dom.getClientRects(c);
        if (!rects || !rects.length) continue;
        const cs = style(c);
        if (cs && cs.visibility === 'hidden') continue;
        out.push(c);
      }
    } catch {
      return out;
    }
    return out;
  }
  // Whether a field in the element is itself cut off: past the edge `pastOf`
  // measures (a box's, the viewport's end or start edge), in part or whole.
  // Help text cut beside a field that shows whole is asked about, not failed.
  function cutsFields(el, pastOf) {
    if (kindOf(el) !== 'HORIZONTAL_SCROLL') return false;
    return fieldsIn(el).some((c) => {
      try {
        const hit = pastOf(dom.getBoundingClientRect(c));
        return !!hit && hit.over > TOLERANCE;
      } catch {
        return false;
      }
    });
  }

  // Hidden by a clip or an empty clip-path, itself or a box around it, as
  // visually hidden text is: nothing of it shows, at any edge.
  const clipHiddenMemo = new Map();
  function clipHidden(el) {
    if (typeof helpers.isElementClipHidden !== 'function') return false;
    let node = el;
    const path = [];
    let value = false;
    while (node && node !== body && node !== html) {
      if (clipHiddenMemo.has(node)) {
        value = clipHiddenMemo.get(node);
        break;
      }
      path.push(node);
      // Only a box with a clip or a clip-path can be hidden by one: the
      // computed style says so at once (the rule runs in a browser), and the
      // helper, which also reads the declared clip, is asked only then.
      const ns = style(node);
      const clipped =
        !!ns && ((ns.clipPath && ns.clipPath !== 'none') || (ns.clip && ns.clip !== 'auto'));
      try {
        if (clipped && helpers.isElementClipHidden(node, ns)) {
          value = true;
          break;
        }
      } catch {
        // Read as shown.
      }
      node = upOf(node);
    }
    for (const n of path) clipHiddenMemo.set(n, value);
    return value;
  }

  // Each element that crosses the edge while its parent doesn't: the place
  // the overflow starts.
  const found = [];
  const SKIP = new Set([
    'script',
    'style',
    'noscript',
    'template',
    'head',
    'title',
    'meta',
    'link'
  ]);
  // Every element of the body, and of the open shadow roots in it unless
  // the scan leaves shadow DOM out (engineOptions.includeShadowDom: false).
  // Excluded and out-of-scope elements stay in: whether one of them is what
  // makes the page scroll is known here (leftOut).
  const deep = (ctx.engineOptions || {}).includeShadowDom !== false;
  const all = [];
  // Where text is walked: the body and each open shadow root.
  const textRoots = [];
  {
    const queue = [body];
    while (queue.length) {
      const root = queue.shift();
      textRoots.push(root);
      for (const el of dom.querySelectorAll(root, '*') || []) {
        all.push(el);
        const shadow = deep ? dom.shadowRoot(el) : null;
        if (shadow) queue.push(shadow);
      }
    }
    plainTree = textRoots.length === 1 && !dom.querySelector(body, 'slot');
  }
  const crosses = new Map();
  function crossing(el) {
    if (crosses.has(el)) return crosses.get(el);
    let value = null;
    try {
      const rects = dom.getClientRects(el);
      if (rects && rects.length) {
        const rect = dom.getBoundingClientRect(el);
        if (rect.width > 0 || rect.height > 0) {
          const over = overflowOf(rect);
          if (over > TOLERANCE) value = { rect, over, inside: insideOf(rect) };
        }
      }
    } catch {
      value = null;
    }
    crosses.set(el, value);
    return value;
  }

  // Whether something past the edge, with the element it is in and its own
  // box, is where the overflow starts, and is judged here.
  const taken = new Set();
  // Whether something past the edge was outside the scope or excluded: the
  // page may scroll because of it, which is not for this scan to judge.
  let leftOut = false;
  function consider(start, hit, own) {
    // Fixed to the viewport: it doesn't widen the page, and what of it lies
    // past the edge is never reached, however the page scrolls. One wholly
    // past the edge waits there on purpose (an off-canvas menu).
    const fixed = fixedOf(start);
    if (fixed) {
      // A box between them, or the fixed element itself, that scrolls or
      // clips: what is in it is judged against that box (below).
      let n = start === fixed ? null : upOf(start);
      while (n) {
        if (boxSetsOverflow(n)) return;
        if (n === fixed) break;
        n = upOf(n);
      }
      if (!own) {
        if (boxSetsOverflow(start)) return;
        if (crossing(start)) return;
      }
      if (hit.inside <= TOLERANCE || taken.has(start)) return;
      const up = start === fixed ? null : upOf(start);
      if (up && crossing(up)) return;
      if (!inScope(start) || isExcluded(start)) {
        leftOut = true;
        return;
      }
      taken.add(start);
      found.push({
        el: start,
        tag: String(dom.tagName(start) || '').toLowerCase(),
        hit,
        fixed: true
      });
      return;
    }
    // Kept from widening the page by a box that scrolls or clips sideways:
    // one around it, or, for text, its own.
    if (insideSidewaysBox(start)) return;
    if (!own) {
      if (boxSetsOverflow(start)) return;
      // Text in a box that sticks out itself: the box is reported.
      if (crossing(start)) return;
    }
    // Inside preformatted text, the block is what is reported.
    let el = start;
    const pre = dom.closest(start, 'pre');
    if (pre && pre !== start) {
      if (boxSetsOverflow(pre)) return;
      el = pre;
    }
    // A line that doesn't wrap: its inline pieces stick out, and the block
    // that holds the line is where it starts, named once.
    for (;;) {
      if (kindOf(el) !== 'HORIZONTAL_SCROLL') break;
      const s = style(el);
      if (!s || !String(s.display || '').startsWith('inline')) break;
      const up = upOf(el);
      if (!up || up === body || up === html || kindOf(up) !== 'HORIZONTAL_SCROLL') break;
      el = up;
    }
    if (taken.has(el)) return;
    // Where it starts: its parent stays inside. The body sticks out only when
    // it is itself too wide (a min-width), and is then the cause.
    const parent = upOf(el);
    if (parent && parent !== html && crossing(parent) && !fixedOf(parent)) return;
    if (!pageScrolls) {
      // The page is kept from scrolling: only what the edge cuts through
      // can't be reached; what is wholly past it waits there on purpose.
      if (!rootClips || hit.inside <= TOLERANCE) return;
    }
    // Last, as it walks up: what a clip hides shows nowhere.
    if (clipHidden(el)) return;
    if (!inScope(el) || isExcluded(el)) {
      leftOut = true;
      return;
    }
    taken.add(el);
    found.push({ el, tag: String(dom.tagName(el) || '').toLowerCase(), hit });
  }

  // Elements cut off by a box that hides what overflows it. Where it starts:
  // the parent, if it is not cut by the same box, stays inside.
  const clipped = [];
  const clippedTaken = new Set();
  function considerClipped(el, clip) {
    if (!clip || clippedTaken.has(el)) return;
    const parent = upOf(el);
    if (parent && parent !== clip.box) {
      const up = clippedBy(parent);
      if (up && up.box === clip.box) return;
    }
    if (clipHidden(el)) return;
    if (!inScope(el) || isExcluded(el)) {
      leftOut = true;
      return;
    }
    clippedTaken.add(el);
    clipped.push({ el, clip });
  }

  // Content past the start edge: the page can't scroll there, so what of
  // it lies past the edge is never reached, whether or not the page scrolls.
  // Text, media and fields are content; a box alone (a background, a
  // negative margin a padding takes back) is not. One wholly past it waits
  // there on purpose (a skip link, hidden text); one in a box that scrolls
  // or clips sideways is that box's to show.
  const START_CONTENT = new Set([
    'img',
    'video',
    'canvas',
    'svg',
    'object',
    'embed',
    'iframe',
    'input',
    'select',
    'textarea',
    'button'
  ]);
  function considerStart(el, rect) {
    // Where it lies first, which is cheap: most content is inside the edge.
    const hit = beforeStartOf(rect);
    if (!(hit.over > TOLERANCE && hit.inside > TOLERANCE)) return;
    if (taken.has(el) || clipHidden(el)) return;
    const s = style(el);
    if (s && s.visibility === 'hidden') return;
    if (!fixedOf(el) && insideSidewaysBox(el)) return;
    if (!inScope(el) || isExcluded(el)) return;
    taken.add(el);
    found.push({
      el,
      tag: String(dom.tagName(el) || '').toLowerCase(),
      hit: { rect, over: hit.over, inside: hit.inside, edge: startEdge },
      start: true
    });
  }

  // Whether the page has a formula, once: looking for one around each
  // element would walk every ancestor of every element.
  const hasMath = textRoots.some((r) => !!dom.querySelector(r, 'math'));

  // The body is too wide itself (a min-width): the cause, named once.
  {
    const bodyHit = crossing(body);
    if (bodyHit) consider(body, bodyHit, true);
  }

  for (const el of all) {
    const tag = String(dom.tagName(el) || '').toLowerCase();
    if (SKIP.has(tag)) continue;
    // Inside an SVG or a formula, the SVG or the formula is what is measured.
    if (dom.get(el, 'ownerSVGElement')) continue;
    if (hasMath && tag !== 'math' && dom.closest(el, 'math')) continue;
    const hit = crossing(el);
    if (hit) consider(el, hit, true);
    // Inside an element its box already cuts, it is reported through that
    // element: not measured again, as every cell of a wide table would be.
    const parentClip = clipMemo.get(upOf(el));
    if (parentClip && parentClip.box === cutterOf(el, false)) clipMemo.set(el, parentClip);
    else considerClipped(el, clippedBy(el));
    if (START_CONTENT.has(tag)) {
      try {
        const rects = dom.getClientRects(el);
        if (rects && rects.length) considerStart(el, dom.getBoundingClientRect(el));
      } catch {
        // No box: nothing shows.
      }
    }
  }

  // Text that runs past the edge out of a box that fits, such as a long
  // address that can't wrap: its element is where the overflow starts.
  for (const textRoot of textRoots) {
    try {
      const walker = dom.call(document, 'createTreeWalker', textRoot, 4 /* SHOW_TEXT */);
      const range = dom.call(document, 'createRange');
      let node = dom.call(walker, 'nextNode');
      while (node) {
        const parentEl = upOf(node);
        const owner = (hasMath && parentEl && dom.closest(parentEl, 'math')) || parentEl;
        const value = String(dom.get(node, 'nodeValue') || '');
        if (
          owner &&
          /\S/.test(value) &&
          !SKIP.has(String(dom.tagName(owner) || '').toLowerCase())
        ) {
          dom.call(range, 'selectNodeContents', node);
          const rect = dom.call(range, 'getBoundingClientRect');
          if (rect && (rect.width > 0 || rect.height > 0)) {
            const over = overflowOf(rect);
            if (over > TOLERANCE) consider(owner, { rect, over, inside: insideOf(rect) }, false);
            considerStart(owner, rect);
            // Text cut by its own box, or one around it, that hides overflow.
            const box = cutterOf(owner, true);
            const bs = box ? style(box) : null;
            const scrolls = box ? !boxCuts(box) : false;
            if (
              box &&
              !(!scrolls && bs && bs.textOverflow === 'ellipsis') &&
              !escapes(owner, box) &&
              !(scrolls && exemptInScrollBox(owner, box))
            ) {
              const hit = pastBox(rect, box);
              if (hit && hit.over > TOLERANCE && hit.inside > TOLERANCE) {
                considerClipped(owner, {
                  box,
                  over: hit.over,
                  rect,
                  scrolls,
                  shell: scrolls && isShell(box)
                });
              }
            }
          }
        }
        node = dom.call(walker, 'nextNode');
      }
    } catch {
      // A root the page won't let us walk: its text is not read.
    }
  }

  const fails = [];
  const questions = [];
  const perCode = {};
  const viewport = { width: clientWidth, scrollWidth };
  const edge = rtl ? 'left' : 'right';

  const LEANS = {
    tableData: {
      toward: 'pass',
      why: 'The table has header cells or a caption: a data table, which may scroll sideways.',
      signals: [{ signal: 'data-table-markup', value: true }],
      i18n: { whyKey: 'reflowHorizontalScroll_lean_why_dataTable' }
    },
    tableLayout: {
      toward: 'fail',
      why: 'The table has no header cells or caption, or is marked as layout: a layout table, which has to fit.',
      signals: [{ signal: 'data-table-markup', value: false }],
      i18n: { whyKey: 'reflowHorizontalScroll_lean_why_layoutTable' }
    },
    media: {
      toward: 'fail',
      why: 'An image or a video can usually be scaled to fit the width.',
      signals: [{ signal: 'scalable-media', value: true }],
      caution: 'A map, a diagram or a game may need its size to be understood.',
      i18n: {
        whyKey: 'reflowHorizontalScroll_lean_why_media',
        cautionKey: 'reflowHorizontalScroll_lean_caution_media'
      }
    },
    scrollBox: {
      toward: 'fail',
      why: 'The element is wider than the box around it, which has to scroll sideways to show it: text, fields and menus have to fit the width.',
      signals: [{ signal: 'scrolls-in-container', value: true }],
      caution: 'A data table, a code block or a carousel may need its layout.',
      i18n: {
        whyKey: 'reflowHorizontalScroll_lean_why_scrollBox',
        cautionKey: 'reflowHorizontalScroll_lean_caution_scrollBox'
      }
    },
    carousel: {
      toward: 'pass',
      why: 'Each item fits the box; only the row of them scrolls sideways, as a carousel does.',
      signals: [{ signal: 'items-fit-box', value: true }],
      caution:
        'Check that each item can be reached with the keyboard, and that nothing in an item is cut off.',
      i18n: {
        whyKey: 'reflowHorizontalScroll_lean_why_carousel',
        cautionKey: 'reflowHorizontalScroll_lean_caution_carousel'
      }
    },
    clippedBox: {
      toward: 'fail',
      why: 'A box around the element hides what overflows it, and nothing scrolls to the rest of it.',
      signals: [{ signal: 'cut-by-container', value: true }],
      caution: 'A carousel or a menu may show the rest another way.',
      i18n: {
        whyKey: 'reflowHorizontalScroll_lean_why_clippedBox',
        cautionKey: 'reflowHorizontalScroll_lean_caution_clipped'
      }
    },
    clipped: {
      toward: 'fail',
      why: 'The edge of the viewport cuts through the element, and the page does not scroll to the rest of it.',
      signals: [{ signal: 'cut-by-viewport-edge', value: true }],
      caution: 'A carousel or a menu may show the rest another way.',
      i18n: {
        whyKey: 'reflowHorizontalScroll_lean_why_clipped',
        cautionKey: 'reflowHorizontalScroll_lean_caution_clipped'
      }
    }
  };

  function tableLean(el) {
    return isLayoutTable(el) ? LEANS.tableLayout : LEANS.tableData;
  }

  const MESSAGES = {
    HORIZONTAL_SCROLL: {
      key: 'fail',
      summary: (p) =>
        `At ${p.viewportWidth} pixels wide, this element reaches ${p.overflowPx} pixels past the edge, so the page scrolls sideways.`,
      hint: 'Let it fit the width: no fixed width wider than the screen, max-width: 100% on images and embeds, and long words or addresses allowed to wrap (overflow-wrap: anywhere).'
    },
    HORIZONTAL_SCROLL_UNATTRIBUTED: {
      key: 'unattributed',
      summary: (p) =>
        `At ${p.viewportWidth} pixels wide, the page scrolls sideways by ${p.overflowPx} pixels.`,
      hint: 'Find what is wider than the screen, such as a margin or generated content, and let it fit the width.'
    },
    WIDE_TABLE: {
      key: 'wideTable',
      needed: 'Whether the table is a data table, whose rows and columns need its layout.',
      summary: (p) =>
        `At ${p.viewportWidth} pixels wide, this table reaches ${p.overflowPx} pixels past the edge.`,
      hint: 'A data table may scroll sideways on its own: put it in a box with overflow-x: auto. A table used for layout has to fit the width.'
    },
    WIDE_MEDIA: {
      key: 'wideMedia',
      needed:
        'Whether the image, video or embedded content needs its size to be used or understood.',
      summary: (p) =>
        `At ${p.viewportWidth} pixels wide, this ${p.element} element reaches ${p.overflowPx} pixels past the edge.`,
      hint: 'Let it shrink to fit (max-width: 100%; height: auto), unless it is a map, a diagram or a game that needs its size.'
    },
    WIDE_PREFORMATTED: {
      key: 'widePreformatted',
      needed: 'Whether the preformatted text needs its lines kept as they are to be understood.',
      summary: (p) =>
        `At ${p.viewportWidth} pixels wide, this preformatted text reaches ${p.overflowPx} pixels past the edge.`,
      hint: 'Let it wrap (white-space: pre-wrap), or, if its lines must stay as they are, let it scroll on its own in a box with overflow-x: auto.'
    },
    SCROLLS_IN_CONTAINER: {
      key: 'scrollBox',
      needed: 'Whether the element needs its width to be used or understood.',
      summary: (p) =>
        `At ${p.viewportWidth} pixels wide, this ${p.element} element reaches ${p.overflowPx} pixels past the edge of the box around it, so that box has to scroll sideways to show it.`,
      hint: 'Let it fit the width of its box, so that nothing needs sideways scrolling. Only a data table, a code block or a map may scroll sideways on its own.'
    },
    CLIPPED_BY_CONTAINER: {
      key: 'clippedBox',
      needed: 'Whether everything in the element can still be reached another way.',
      summary: (p) =>
        `At ${p.viewportWidth} pixels wide, a box around this ${p.element} element hides the ${p.overflowPx} pixels that stick out of it, and nothing scrolls to them.`,
      hint: 'Let it fit the width of its box, so that nothing in it is cut off. If it is a data table, put it in a box with overflow-x: auto.'
    },
    CLIPPED_AT_VIEWPORT_EDGE: {
      key: 'clipped',
      needed: 'Whether everything in the element can still be reached another way.',
      summary: (p) =>
        `At ${p.viewportWidth} pixels wide, the edge of the screen cuts through this element, and the page does not scroll to the rest of it.`,
      hint: 'Let it fit the width, so that nothing in it is cut off.'
    }
  };

  // asFail: the finding is settled as a failure, not asked about.
  function report(code, el, hit, lean, asFail) {
    perCode[code] = (perCode[code] || 0) + 1;
    if (perCode[code] > MAX_PER_CODE) return;
    const msg = MESSAGES[code];
    const tag = String(dom.tagName(el) || '').toLowerCase();
    const overflowPx = hit ? Math.round(hit.over) : Math.round(scrollWidth - clientWidth);
    const params = {
      viewportWidth: String(Math.round(clientWidth)),
      overflowPx: String(overflowPx),
      element: tag
    };
    const occ = helpers.reportOccurrence(el, {
      ...(lean && !asFail ? { lean } : {}),
      summary: msg.summary(params),
      hint: msg.hint,
      i18n: {
        summaryKey: `reflowHorizontalScroll_summary_${msg.key}`,
        hintKey: `reflowHorizontalScroll_hint_${msg.key}`,
        params
      },
      ...(msg.needed && !asFail
        ? {
            occurrenceOutcome: 'cantTell',
            uncertainty: {
              code: 'judgement-required',
              needed: msg.needed,
              evidence: { reasonCode: code }
            }
          }
        : { occurrenceOutcome: 'fail' }),
      data: {
        details: {
          reasonCode: code,
          element: tag,
          overflowPx,
          widthPx: hit ? Math.round(hit.rect.width) : Math.round(scrollWidth),
          edge: (hit && hit.edge) || edge,
          viewport
        }
      }
    });
    (msg.needed && !asFail ? questions : fails).push(occ);
  }

  // A row of items each of which fits the box that scrolls it: the row
  // scrolls as a carousel does (G225), each item reflowing within the width.
  function isCarousel(el, box) {
    try {
      const fit = Number(dom.get(box, 'clientWidth')) || 0;
      const items = [...(dom.get(el, 'children') || [])].filter((c) => {
        const rects = dom.getClientRects(c);
        return rects && rects.length;
      });
      return (
        fit > 0 &&
        items.length >= 2 &&
        items.every((c) => dom.getBoundingClientRect(c).width <= fit + TOLERANCE)
      );
    } catch {
      return false;
    }
  }

  // What sticks out past the edge of the page, or of a box that is the page.
  function reportOnPage(el, tag, hit) {
    const code = kindOf(el);
    const lean =
      code === 'WIDE_TABLE'
        ? tableLean(el)
        : code === 'WIDE_MEDIA' && (tag === 'img' || tag === 'video' || tag === 'picture')
          ? LEANS.media
          : null;
    report(code, el, hit, lean);
  }
  // Fields cut off: no exception covers a form, so it fails. A table, code
  // or media is left to a person.
  const pastEnd = (rect) => ({ over: overflowOf(rect) });

  for (const { el, tag, hit, fixed, start } of found) {
    if (start) {
      report('CLIPPED_AT_VIEWPORT_EDGE', el, hit, LEANS.clipped, cutsFields(el, beforeStartOf));
      continue;
    }
    if (!pageScrolls || fixed) {
      report('CLIPPED_AT_VIEWPORT_EDGE', el, hit, LEANS.clipped, cutsFields(el, pastEnd));
      continue;
    }
    reportOnPage(el, tag, hit);
  }

  for (const { el, clip } of clipped) {
    if (clip.shell) {
      reportOnPage(el, String(dom.tagName(el) || '').toLowerCase(), {
        over: clip.over,
        rect: clip.rect
      });
      continue;
    }
    report(
      clip.scrolls ? 'SCROLLS_IN_CONTAINER' : 'CLIPPED_BY_CONTAINER',
      el,
      { over: clip.over, rect: clip.rect },
      clip.scrolls
        ? isCarousel(el, clip.box)
          ? LEANS.carousel
          : LEANS.scrollBox
        : LEANS.clippedBox,
      cutsFields(el, (rect) => pastBox(rect, clip.box))
    );
  }

  // Only what reaches past the end edge explains why the page scrolls.
  if (pageScrolls && !found.some((f) => !f.fixed && !f.start) && wholeDocument && !leftOut) {
    report('HORIZONTAL_SCROLL_UNATTRIBUTED', html, null, null);
  }

  // How many more each reason code had than the 50 listed.
  const omitted = {};
  for (const [code, n] of Object.entries(perCode)) {
    if (n > MAX_PER_CODE) omitted[code] = n - MAX_PER_CODE;
  }
  if (fails.length || questions.length) {
    return {
      ruleId: rule.ruleId,
      ...helpers.resolveTieredOutcome(fails, questions, rule.defaultSeverity || 'serious'),
      ...(Object.keys(omitted).length ? { data: { omitted } } : {})
    };
  }
  if (!wholeDocument || leftOut) return notApplicable(null);
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage, applicability };
