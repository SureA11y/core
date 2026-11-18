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
 *   in a horizontal writing mode, that is the page itself: the top
 *   document, or a framed one the host names as the page
 *   (`engineOptions.topLevelDocument`). A host scans the page at that width
 *   to check reflow, as a phone shows it or a 1280 pixel window at 400% zoom
 *   does. At a wider viewport, in vertical text, in a document shown in a
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
 *     overflow comes from a margin, a pseudo-element or a closed shadow
 *     root), the document fails (HORIZONTAL_SCROLL_UNATTRIBUTED): that it
 *     scrolls is measured, not guessed.
 *   - When the root keeps the page from scrolling sideways (`overflow-x:
 *     hidden` or `clip` on the root, or on the body that passes it on), an
 *     element that the viewport's end edge cuts through is asked about
 *     (CLIPPED_AT_VIEWPORT_EDGE): part of it can't be reached. It leans
 *     fail. One wholly past the edge is left out: off-canvas menus and
 *     slides wait there on purpose.
 *   - A box that scrolls on its own (`overflow-x: auto` or `scroll`) keeps
 *     what is in it from widening the page. A table, preformatted text or
 *     media in it may scroll sideways there, as the exception allows. Anything
 *     else that sticks out of the box (a form, text, a menu) still needs
 *     sideways scrolling, and is asked about (SCROLLS_IN_CONTAINER, leaning
 *     fail). Where it is, or holds, a form control (a text field, select,
 *     text area or a widget with a matching role), no exception covers it,
 *     and it fails instead.
 *   - An element inside a box that hides what overflows it (`overflow-x:
 *     hidden` or `clip`) keeps the page from scrolling, but what sticks out
 *     of the box is cut off with no way to reach it, whether or not the page
 *     scrolls. Where it starts, such an element is asked about
 *     (CLIPPED_BY_CONTAINER) and leans fail, or fails where it is, or holds, a
 *     form control (a table, code or media is still asked about). Left out: an element wholly
 *     outside the box (waiting there on purpose), a box a pixel wide (visually
 *     hidden text), text truncated with an ellipsis, and an element placed out
 *     of the box (fixed, or absolute from outside it).
 *   - A pass is given only for a scan of the whole document; a scoped scan
 *     reports what it finds in its scope, and is otherwise notApplicable.
 *   At most 50 elements are listed per reason code.
 * @reports
 *   - `overflowPx`: how far the element reaches past the viewport's end
 *     edge, in CSS pixels.
 *   - `widthPx`: the element's width, in CSS pixels.
 *   - `edge`: `right`, or `left` in right-to-left text.
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
 *   - `WIDE_TABLE` (cantTell): a table sticks out past the edge; a data
 *     table is covered by the exception for content that needs a
 *     two-dimensional layout, a layout table is not. It leans pass for a
 *     table with header cells or a caption, and fail for one marked as
 *     layout (role presentation or none) or with neither.
 *     Basis: WCAG 1.4.10 (exception: two-dimensional layout).
 *   - `WIDE_MEDIA` (cantTell): an image, video, canvas, SVG, embedded
 *     object or frame sticks out past the edge; a map, diagram or game may
 *     need its size. It leans fail for an image or a video, which can
 *     usually be scaled to fit.
 *     Basis: WCAG 1.4.10 (exception: two-dimensional layout).
 *   - `WIDE_PREFORMATTED` (cantTell): preformatted text, such as code,
 *     doesn't wrap and sticks out past the edge; whether its layout is
 *     needed to understand it is for a person to judge.
 *     Basis: WCAG 1.4.10 (not settled).
 *   - `SCROLLS_IN_CONTAINER` (cantTell, or fail when it holds a form control):
 *     this element, not a table, code block or media, is wider than the box
 *     around it, which scrolls sideways (`overflow-x: auto` or `scroll`) to
 *     show it. It leans fail.
 *     Basis: WCAG 1.4.10 (not settled).
 *   - `CLIPPED_BY_CONTAINER` (cantTell, or fail when it holds a form control): a box around this element hides what
 *     overflows it (`overflow-x: hidden` or `clip`), and the element sticks
 *     out of the box, so part of it can't be reached. It leans fail.
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

  // A layout: the root has boxes (jsdom gives none).
  try {
    const rects = dom.getClientRects(html);
    if (!rects || !rects.length) return notApplicable('noLayout');
  } catch {
    return notApplicable('noLayout');
  }

  const width = Number(dom.get(view, 'innerWidth')) || 0;
  if (!width || width > REFLOW_WIDTH) return notApplicable('viewportWider');

  function style(el) {
    try {
      return view.getComputedStyle(el);
    } catch {
      return null;
    }
  }
  const rootStyle = style(html);
  const bodyStyle = style(body);
  // Vertical text reflows at 256 CSS pixels high, which this rule doesn't
  // measure.
  if (rootStyle && /^vertical|^sideways/.test(String(rootStyle.writingMode || ''))) {
    return notApplicable('verticalWritingMode');
  }
  const rtl = rootStyle ? rootStyle.direction === 'rtl' : false;

  // Whether the viewport scrolls sideways: the root's overflow-x, or the
  // body's when the root's is visible (CSS Overflow 3, propagation).
  const clips = (s) => !!s && (s.overflowX === 'hidden' || s.overflowX === 'clip');
  const rootClips =
    clips(rootStyle) || (rootStyle && rootStyle.overflowX === 'visible' && clips(bodyStyle));

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

  // Boxes that keep their content from widening the page: they scroll or
  // clip sideways. Their own box is measured; what is inside them is not.
  const contained = new Map();
  function insideSidewaysBox(el) {
    let node = dom.parentElement(el);
    const path = [];
    let found = false;
    while (node && node !== body && node !== html) {
      if (contained.has(node)) {
        found = contained.get(node);
        break;
      }
      path.push(node);
      const s = style(node);
      if (s && s.overflowX !== 'visible') {
        found = true;
        break;
      }
      node = dom.parentElement(node);
    }
    for (const n of path) contained.set(n, found);
    return found;
  }

  // Boxes that hide what overflows them (not the root: the viewport's own
  // clipping is judged above). What sticks out of one is cut off, and the
  // page doesn't scroll to it.
  const cuts = (s) => !!s && (s.overflowX === 'hidden' || s.overflowX === 'clip');
  // The nearest box around `start` (itself included when `self`) that sets
  // overflow sideways, whether it hides what overflows or scrolls it; null
  // when there is none.
  const cutterMemo = new Map();
  function cutterOf(start, self) {
    let node = self ? start : dom.parentElement(start);
    const path = [];
    let found = null;
    while (node && node !== body && node !== html) {
      if (cutterMemo.has(node)) {
        found = cutterMemo.get(node);
        break;
      }
      path.push(node);
      const s = style(node);
      if (s && s.overflowX !== 'visible') {
        found = node;
        path.pop();
        cutterMemo.set(node, found);
        break;
      }
      node = dom.parentElement(node);
    }
    for (const n of path) cutterMemo.set(n, found);
    return found;
  }
  // Whether the element is placed out of the box: fixed, or absolute with no
  // positioned box between it and the cutter.
  function escapes(el, box) {
    let node = el;
    while (node && node !== box) {
      const s = style(node);
      const position = s ? s.position : 'static';
      if (position === 'fixed') return true;
      if (position === 'absolute') {
        let up = dom.parentElement(node);
        let positioned = false;
        while (up) {
          const us = style(up);
          if (us && (us.position !== 'static' || (us.transform && us.transform !== 'none'))) {
            positioned = true;
            break;
          }
          if (up === box) break;
          up = dom.parentElement(up);
        }
        if (!positioned) return true;
      }
      node = dom.parentElement(node);
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
    // The end edge of the visible area: the right, or the left in
    // right-to-left text.
    const edge = rtl ? left : left + cw;
    return rtl
      ? { over: edge - rect.left, inside: rect.right - edge }
      : { over: rect.right - edge, inside: edge - rect.left };
  }
  // What a box that scrolls on its own may hold at full width: a table, a
  // preformatted block, media. Anything else in it, a form, text, a menu, that
  // sticks out of the box needs sideways scrolling too.
  function exemptInScrollBox(el) {
    try {
      if (dom.closest(el, 'table, pre')) return true;
      return kindOf(el) !== 'HORIZONTAL_SCROLL';
    } catch {
      return false;
    }
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
        const scrolls = !cuts(bs);
        if (
          rects &&
          rects.length &&
          !(!scrolls && bs && bs.textOverflow === 'ellipsis') &&
          !(es && es.visibility === 'hidden') &&
          !escapes(el, box) &&
          !(scrolls && exemptInScrollBox(el))
        ) {
          const rect = dom.getBoundingClientRect(el);
          if (rect.width > 0 || rect.height > 0) {
            const hit = pastBox(rect, box);
            // Part shows inside the box and part is cut off; one wholly past
            // its edge waits there on purpose.
            if (hit && hit.over > TOLERANCE && hit.inside > TOLERANCE) {
              value = { box, over: hit.over, rect, scrolls };
            }
          }
        }
      }
    } catch {
      value = null;
    }
    clipMemo.set(el, value);
    return value;
  }

  const MEDIA = new Set(['img', 'video', 'canvas', 'svg', 'object', 'embed', 'iframe', 'picture']);
  function kindOf(el) {
    const tag = String(dom.tagName(el) || '').toLowerCase();
    if (tag === 'table') return 'WIDE_TABLE';
    if (MEDIA.has(tag)) return 'WIDE_MEDIA';
    if (tag === 'pre') return 'WIDE_PREFORMATTED';
    // Code kept on its lines by its style, as a highlighter's block is.
    const s = style(el);
    const keepsLines = !!s && (s.whiteSpace === 'pre' || s.whiteSpace === 'nowrap');
    if (keepsLines && (tag === 'code' || dom.querySelector(el, 'code'))) return 'WIDE_PREFORMATTED';
    return 'HORIZONTAL_SCROLL';
  }

  // Fields a person fills in: a form needs no two-dimensional layout to be
  // used or understood, so the exception does not cover it.
  const NATIVE_CONTROLS = 'input:not([type="hidden"]), select, textarea, [contenteditable="true"]';
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
    try {
      if (dom.matches(el, NATIVE_CONTROLS) || dom.querySelector(el, NATIVE_CONTROLS)) return true;
      if (dom.matches(el, ROLE_CONTROLS) && isRoleControl(el)) return true;
      return [...(dom.querySelectorAll(el, ROLE_CONTROLS) || [])].some(isRoleControl);
    } catch {
      return false;
    }
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
  const all = dom.querySelectorAll(body, '*');
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
    // Kept from widening the page by a box that scrolls or clips sideways:
    // one around it, or, for text, its own.
    if (insideSidewaysBox(start)) return;
    if (!own) {
      const s = style(start);
      if (s && s.overflowX !== 'visible') return;
      // Text in a box that sticks out itself: the box is reported.
      if (crossing(start)) return;
    }
    // Inside preformatted text, the block is what is reported.
    let el = start;
    const pre = dom.closest(start, 'pre');
    if (pre && pre !== start) {
      const s = style(pre);
      if (s && s.overflowX !== 'visible') return;
      el = pre;
    }
    if (taken.has(el)) return;
    // Where it starts: its parent stays inside.
    const parent = dom.parentElement(el);
    if (parent && parent !== body && parent !== html && crossing(parent)) return;
    if (!pageScrolls) {
      // The page is kept from scrolling: only what the edge cuts through
      // can't be reached; what is wholly past it waits there on purpose.
      if (!rootClips || hit.inside <= TOLERANCE) return;
    }
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
    const parent = dom.parentElement(el);
    if (parent && parent !== clip.box) {
      const up = clippedBy(parent);
      if (up && up.box === clip.box) return;
    }
    if (!inScope(el) || isExcluded(el)) {
      leftOut = true;
      return;
    }
    clippedTaken.add(el);
    clipped.push({ el, clip });
  }

  for (const el of all) {
    const tag = String(dom.tagName(el) || '').toLowerCase();
    if (SKIP.has(tag)) continue;
    // Inside an SVG, the SVG is what is measured.
    if (dom.get(el, 'ownerSVGElement')) continue;
    const hit = crossing(el);
    if (hit) consider(el, hit, true);
    considerClipped(el, clippedBy(el));
  }

  // Text that runs past the edge out of a box that fits, such as a long
  // address that can't wrap: its element is where the overflow starts.
  try {
    const walker = dom.call(document, 'createTreeWalker', body, 4 /* SHOW_TEXT */);
    const range = dom.call(document, 'createRange');
    let node = dom.call(walker, 'nextNode');
    while (node) {
      const owner = dom.parentElement(node);
      const value = String(dom.get(node, 'nodeValue') || '');
      if (owner && /\S/.test(value) && !SKIP.has(String(dom.tagName(owner) || '').toLowerCase())) {
        dom.call(range, 'selectNodeContents', node);
        const rect = dom.call(range, 'getBoundingClientRect');
        if (rect && (rect.width > 0 || rect.height > 0)) {
          const over = overflowOf(rect);
          if (over > TOLERANCE) consider(owner, { rect, over, inside: insideOf(rect) }, false);
          // Text cut by its own box, or one around it, that hides overflow.
          const box = cutterOf(owner, true);
          const bs = box ? style(box) : null;
          const scrolls = box ? !cuts(bs) : false;
          if (
            box &&
            !(!scrolls && bs && bs.textOverflow === 'ellipsis') &&
            !escapes(owner, box) &&
            !(scrolls && exemptInScrollBox(owner))
          ) {
            const hit = pastBox(rect, box);
            if (hit && hit.over > TOLERANCE && hit.inside > TOLERANCE) {
              considerClipped(owner, { box, over: hit.over, rect, scrolls });
            }
          }
        }
      }
      node = dom.call(walker, 'nextNode');
    }
  } catch {}

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
    const role = String(
      (helpers.aria && helpers.aria.getExplicitRole && helpers.aria.getExplicitRole(el)) || ''
    ).toLowerCase();
    if (role === 'presentation' || role === 'none') return LEANS.tableLayout;
    const data = !!dom.querySelector(el, 'th, caption, [scope]');
    return data ? LEANS.tableData : LEANS.tableLayout;
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
        `At ${p.viewportWidth} pixels wide, this ${p.element} element is ${p.overflowPx} pixels wider than the box around it, so that box has to scroll sideways to show it.`,
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
          edge,
          viewport
        }
      }
    });
    (msg.needed && !asFail ? questions : fails).push(occ);
  }

  for (const { el, tag, hit } of found) {
    if (!pageScrolls) {
      report('CLIPPED_AT_VIEWPORT_EDGE', el, hit, LEANS.clipped);
      continue;
    }
    const code = kindOf(el);
    const lean =
      code === 'WIDE_TABLE'
        ? tableLean(el)
        : code === 'WIDE_MEDIA' && (tag === 'img' || tag === 'video' || tag === 'picture')
          ? LEANS.media
          : null;
    report(code, el, hit, lean);
  }

  for (const { el, clip } of clipped) {
    // Fields cut off or scrolled sideways in a box: no exception covers a
    // form, so it fails. A table, code or media is left to a person.
    const asFail = kindOf(el) === 'HORIZONTAL_SCROLL' && holdsFormControls(el);
    report(
      clip.scrolls ? 'SCROLLS_IN_CONTAINER' : 'CLIPPED_BY_CONTAINER',
      el,
      { over: clip.over, rect: clip.rect },
      clip.scrolls ? LEANS.scrollBox : LEANS.clippedBox,
      asFail
    );
  }

  if (pageScrolls && !found.length && wholeDocument && !leftOut) {
    report('HORIZONTAL_SCROLL_UNATTRIBUTED', html, null, null);
  }

  if (fails.length || questions.length) {
    return {
      ruleId: rule.ruleId,
      ...helpers.resolveTieredOutcome(fails, questions, rule.defaultSeverity || 'serious')
    };
  }
  if (!wholeDocument || leftOut) return notApplicable(null);
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage, applicability };
