/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check resize-text-content-loss
 * @atomic true
 * @summary At 640 CSS pixels wide (200% zoom), text must not be cut off by a box that hides its overflow
 * @standard WCAG 2.2
 * @sc 1.4.4
 * @applicability
 *   Applies to a page laid out at a viewport 640 CSS pixels wide or less,
 *   that is the page itself: the top document, or a framed one the host
 *   names as the page (`engineOptions.topLevelDocument`). A host scans the
 *   page at that width to check resize text, as a 1280 pixel window shows it
 *   at 200% zoom (ACT 59br37). The width is the layout viewport's (the
 *   root's clientWidth), as reflow-horizontal-scroll reads it. Within such a
 *   page, it applies to visible text (rendered, not hidden by opacity or
 *   visibility) in
 *   a box that hides what overflows it: `overflow: hidden` or `clip` on an
 *   axis, paint containment (`contain: paint`, `content` or `strict`,
 *   `content-visibility: auto`), a `clip-path: inset()` or a `clip: rect()`,
 *   a `-webkit-line-clamp` or `line-clamp`, or `text-overflow: ellipsis`,
 *   found along the text's containing block chain in the flat tree. A box
 *   that scrolls on an axis (`overflow: auto` or `scroll`) keeps what is in
 *   it reachable, so boxes past it don't clip on that axis; a box fixed to
 *   the viewport ends the walk. Text a box hides entirely is judged where
 *   the box shows some of its other text and the text flowed out of it (a
 *   fixed-height card whose later lines, paragraphs or `<br>` lines drop
 *   out, an inline-block pushed past a `nowrap` box). Left out: text a box
 *   hides entirely where the box shows none of its text (a collapsed panel)
 *   or where the text was placed outside it (absolutely positioned, fixed
 *   or transformed, as an off-canvas menu or a carousel's next slide),
 *   visually hidden text (a box a pixel wide or high), text inside a
 *   <marquee> or moved by an animation that repeats for ever, and the
 *   viewport's own overflow. At a wider viewport, in a
 *   document shown in a frame, and without a layout (jsdom), the rule is
 *   notApplicable, with `data.reason` `viewportWider`, `noLayout` or
 *   `frameset`; with no text in a box that can clip it, notApplicable.
 * @expectation
 *   WCAG 1.4.4: text can be resized to 200% without loss of content. The
 *   rule measures the layout at one width and asks; it never fails. Each
 *   line of the text is measured (Range.getClientRects) against the box
 *   that clips it: its padding box, or the rectangle of its clip-path or
 *   clip. Only its characters other than white space are measured: spaces
 *   that hang past the edge at the end of a line (`white-space: pre-wrap`)
 *   show nothing, so they cut no content.
 *   - Text that a box cuts short with an ellipsis (`text-overflow:
 *     ellipsis`) or a line clamp is asked about, leaning fail
 *     (TEXT_TRUNCATED_AT_640): part of it is not shown.
 *   - Text with a line that reaches more than 2 pixels past the edge of a
 *     box that clips it is asked about (TEXT_CLIPPED_AT_640). It leans
 *     fail where the text is certainly cut: a line at least half outside
 *     (half its height, or half an em across). A line cut by less gets no
 *     lean: it may still be read.
 *   - In a vertical writing mode (`writing-mode: vertical-rl` and the
 *     like), lines run down the page: the ellipsis and `nowrap` are read
 *     on the box's inline axis (y), the line clamp on its block axis (x),
 *     and a line is half outside by half an em down or half its width
 *     across.
 *   - Below 600 pixels wide, the page is laid out narrower than a 1280
 *     pixel window at 200% zoom, and a cut there may appear only at a
 *     larger zoom, which 1.4.4 doesn't ask for: both codes are asked
 *     without a lean.
 *   - Text that every box clipping it shows in full passes.
 *   Each box is reported once, for the first text it cuts most. Whether the
 *   full text is offered another way (a control that opens the box, the
 *   same text elsewhere) is for a person to confirm. At most 50 boxes are
 *   listed per reason code; the result's `data.omitted` says how many more
 *   each had.
 *   - Only text inside the scan's scope (contextSelector) and not excluded
 *     (excludeSelectors) is judged, at most 3,000 text nodes: the body's,
 *     then those of each open shadow root (none with
 *     `includeShadowDom: false`). While a modal dialog is open, the page
 *     behind it is left out.
 *   - The rule reads the page as it is and changes nothing: no style, no
 *     scroll position, no focus.
 * @reports
 *   - `text`: the start of the text, up to 60 characters.
 *   - `metrics.overflowPx`: how far, in CSS pixels, the line went past the
 *     edge of the box that clips it; `metrics.thresholdPx`, how far it may
 *     go before the text counts as cut (half an em along the line, or half
 *     the line's thickness across it); `metrics.axis`, `x` or `y`.
 *   - `edge`: the edge of the box the line went furthest past: `top`,
 *     `right`, `bottom` or `left`.
 *   - `clipCss` (where it can be read): the CSS that cuts the text off, as
 *     declarations: what fixes the box's size on that axis
 *     (`white-space: nowrap`, `width`, `height`, `max-height`, a clamp) and
 *     what hides the overflow, as `height: 48px; overflow: hidden`, or
 *     `content-visibility: auto` where that is what clips.
 *   - `container.widthPx`, `container.heightPx`: the size of the clipping
 *     box.
 *   - `viewport.width`, `viewport.height`: the viewport the page was laid
 *     out in, in CSS pixels.
 *   The message names the zoom at which a 1280 pixel window is laid out at
 *   the scanned width (`zoomPercent`): 200% at 640, 213% at 600. Below 600
 *   pixels it says the width is narrower than that window at 200% zoom
 *   (`narrower`).
 * @reason-codes
 *   - `TEXT_CLIPPED_AT_640` (cantTell): at 640 CSS pixels wide or less, a
 *     box that hides its overflow cuts off part of this text, or all of it
 *     while showing other text. It leans fail when a line is at least half
 *     outside the box; a line cut by less, or any cut below 600 pixels
 *     wide, gets no lean.
 *     Basis: WCAG 1.4.4 (not settled); ACT 59br37; F69 (not settled).
 *   - `TEXT_TRUNCATED_AT_640` (cantTell): at 640 CSS pixels wide or less, a
 *     box shortens this text with an ellipsis or a line clamp. It leans
 *     fail, from 600 pixels wide: part of the text is not shown, unless the
 *     full text is offered another way.
 *     Basis: WCAG 1.4.4 (not settled); ACT 59br37.
 * @implementation-notes
 *   The rule doesn't change the viewport or zoom the page: a script in the
 *   page can do neither, and CSS `zoom` on the root would neither match
 *   media queries as browser zoom does nor leave the page untouched. Like
 *   reflow-horizontal-scroll at 320, it applies where the host lays the page
 *   out at the width, and returns at once at a wider viewport. The walk up
 *   the containing block chain and the clip shapes follow
 *   text-spacing-content-loss.
 */

const id = 'resize-text-content-loss';

const meta = {
  title: 'Text is not cut off at 640 CSS pixels wide (200% zoom)',
  description:
    'At a viewport 640 CSS pixels wide or less, as a 1280 pixel window shows a page at 200% zoom, measures each text in a box that hides its overflow, and asks about text the box cuts off or shortens with an ellipsis or a line clamp, for manual review of whether content is lost.',
  i18n: {
    titleKey: 'resizeTextContentLoss_title',
    descriptionKey: 'resizeTextContentLoss_description'
  },
  helpUrl: null,
  tags: ['wcag2aa', 'wcag144', 'structure', 'atomic', 'manual'],
  wcagSc: ['1.4.4'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.4.4',
      title: 'Resize Text',
      conformanceLevel: 'AA'
    }
  ],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: { facetsBySc: { '1.4.4': ['text-not-clipped-640'] } },
  // Reason codes picked from a table, which scripts/generate-finding-ids.js
  // can't read from the source.
  reasonCodes: ['TEXT_CLIPPED_AT_640', 'TEXT_TRUNCATED_AT_640']
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
  const ZOOM_WIDTH = 640;
  const LEAN_MIN_WIDTH = 600;
  const MAX_TEXT_NODES = 3000;
  const MAX_PER_CODE = 50;
  // A line more than this far outside its box is cut off at all.
  const PARTLY_PX = 2;

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
  if (typeof dom.get(document, 'createRange') !== 'function') return notApplicable('noLayout');
  // A frameset shows other documents, each judged as its own page.
  if (String(dom.tagName(body) || '').toLowerCase() === 'frameset') {
    return notApplicable('frameset');
  }

  // The layout viewport's width, as reflow-horizontal-scroll reads it: the
  // root's clientWidth, which a phone browser's zooming out doesn't widen.
  const innerWidth = Number(dom.get(view, 'innerWidth')) || 0;
  const layoutWidth = Number(dom.get(html, 'clientWidth')) || 0;
  const width = layoutWidth ? Math.min(layoutWidth, innerWidth || layoutWidth) : innerWidth;
  if (!width || width > ZOOM_WIDTH) return notApplicable('viewportWider');

  const styleMemo = new Map();
  function styleOf(el) {
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
  function px(v) {
    const n = parseFloat(String(v || ''));
    return Number.isFinite(n) ? n : 0;
  }

  // ---- The text this scan judges ----

  const roots = (Array.isArray(ctx.root) ? ctx.root : [ctx.root]).filter(Boolean);
  const wholeDocument = !roots.length || roots.some((r) => r === document || r === html);
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

  // The next element up in the flat tree: a slotted node's slot, a shadow
  // root's host.
  function upOf(a) {
    let p = a;
    for (let i = 0; p && i < 100; i++) {
      p =
        typeof helpers.composedParent === 'function'
          ? helpers.composedParent(p)
          : dom.parentElement(p);
      if (p && dom.nodeType(p) === 1) return p;
      if (!p || dom.nodeType(p) !== 11) return null;
    }
    return null;
  }
  // The element a text lays out in; a <slot> has no box of its own.
  function boxParentOf(n) {
    let p = upOf(n);
    for (let i = 0; p && i < 100 && String(dom.localName(p)) === 'slot'; i++) {
      const cs = styleOf(p);
      if (cs && cs.display !== 'contents') break;
      p = upOf(p);
    }
    return p;
  }

  // Elements a <marquee> holds, or an animation that repeats for ever moves
  // (a ticker): their text passes through the edge of its box on purpose,
  // and where it stands depends on when the scan ran.
  const MOVING_PROPS =
    /^(transform|translate|rotate|scale|left|right|top|bottom|inset|margin|offset)/i;
  const movedForEver = new Set();
  try {
    const started =
      typeof helpers.animationsAtScanStart === 'function' ? helpers.animationsAtScanStart() : [];
    for (const a of started || []) {
      if (!a || !a.target || a.endTime !== null) continue;
      const changes = a.changes;
      if (changes === null || Object.keys(changes || {}).some((k) => MOVING_PROPS.test(k))) {
        movedForEver.add(a.target);
      }
    }
  } catch {}
  const movingCache = new Map();
  function isMoving(el) {
    const path = [];
    let found = false;
    for (let a = el, i = 0; a && dom.nodeType(a) === 1 && i < 100000; a = upOf(a), i++) {
      if (movingCache.has(a)) {
        found = movingCache.get(a);
        break;
      }
      path.push(a);
      if (dom.localName(a) === 'marquee' || movedForEver.has(a)) {
        found = true;
        break;
      }
    }
    for (const a of path) movingCache.set(a, found);
    return found;
  }

  const textRoots = [];
  {
    const deep = (ctx.engineOptions || {}).includeShadowDom !== false;
    const queue = [body];
    while (queue.length) {
      const root = queue.shift();
      if (!root) continue;
      textRoots.push(root);
      if (!deep) continue;
      try {
        for (const el of dom.querySelectorAll(root, '*') || []) {
          const shadow = dom.shadowRoot(el);
          if (shadow) queue.push(shadow);
        }
      } catch {}
    }
  }

  const SKIP = new Set(['script', 'style', 'noscript', 'template', 'textarea', 'select']);
  function shown(el) {
    try {
      return typeof dom.get(el, 'checkVisibility') === 'function'
        ? dom.checkVisibility(el, { opacityProperty: true, visibilityProperty: true })
        : true;
    } catch {
      return true;
    }
  }
  const texts = [];
  for (const root of textRoots) {
    if (texts.length >= MAX_TEXT_NODES) break;
    const walker = dom.createTreeWalker(document, root, 4);
    for (let n = walker.nextNode(); n && texts.length < MAX_TEXT_NODES; n = walker.nextNode()) {
      if (!/\S/.test(dom.nodeValue(n) || '')) continue;
      const box = boxParentOf(n);
      const holder = dom.parentElement(n) || box;
      if (!box || !holder || SKIP.has(String(dom.localName(holder)))) continue;
      if (!inScope(holder) || isExcluded(holder) || isBehindModal(box)) continue;
      if (!shown(box) || isMoving(box)) continue;
      texts.push({ n, box, holder });
    }
  }

  // ---- The boxes that clip a text ----

  const bodyIsViewport = (() => {
    const rs = styleOf(html);
    const bs = styleOf(body);
    if (!rs || !bs || dom.localName(body) !== 'body') return false;
    if (rs.overflowX !== 'visible' || rs.overflowY !== 'visible') return false;
    const contained = (cs) =>
      (!!cs.contain && cs.contain !== 'none') ||
      (!!cs.contentVisibility && cs.contentVisibility !== 'visible');
    return !contained(rs) && !contained(bs);
  })();
  const cvClips =
    typeof helpers.paintContainedByContentVisibility === 'function'
      ? helpers.paintContainedByContentVisibility
      : () => false;

  // How far a clip-path: inset() or a clip: rect() cuts into el's border box
  // on each side, in layout px, or null (no such clip, or another shape).
  function clipShapeOf(el, cs) {
    const w = Number(dom.get(el, 'offsetWidth')) || 0;
    const h = Number(dom.get(el, 'offsetHeight')) || 0;
    const len = (v, size) => {
      const m = /^(-?\d*\.?\d+)(px|%)$/.exec(v) || (/^0$/.test(v) ? ['0', '0', 'px'] : null);
      if (!m) return null;
      return m[2] === '%' ? (parseFloat(m[1]) * size) / 100 : parseFloat(m[1]);
    };
    let shape = null;
    const cp = String(cs.clipPath || '')
      .trim()
      .toLowerCase();
    const inset = /^inset\((.*)\)(\s+border-box)?$/.exec(cp);
    if (inset) {
      const args = inset[1]
        .split(/\s+round\s+/)[0]
        .trim()
        .split(/\s+/);
      if (args.length >= 1 && args.length <= 4) {
        const [t, r = t, b = t, l = r] = args;
        const v = [len(t, h), len(r, w), len(b, h), len(l, w)];
        if (v.every((n) => n !== null))
          shape = { top: v[0], right: v[1], bottom: v[2], left: v[3] };
      }
    }
    const clip = /^rect\((.*)\)$/.exec(
      String(cs.clip || '')
        .trim()
        .toLowerCase()
    );
    if (clip && (cs.position === 'absolute' || cs.position === 'fixed')) {
      const args = clip[1].split(/[\s,]+/).filter(Boolean);
      const at = (v, size, auto) => (v === 'auto' ? auto : len(v, size));
      if (args.length === 4) {
        const t = at(args[0], h, 0);
        const r = at(args[1], w, w);
        const b = at(args[2], h, h);
        const l = at(args[3], w, 0);
        if ([t, r, b, l].every((n) => n !== null)) {
          const fromClip = { top: t, right: w - r, bottom: h - b, left: l };
          shape = shape
            ? {
                top: Math.max(shape.top, fromClip.top),
                right: Math.max(shape.right, fromClip.right),
                bottom: Math.max(shape.bottom, fromClip.bottom),
                left: Math.max(shape.left, fromClip.left)
              }
            : fromClip;
        }
      }
    }
    return shape;
  }

  // Whether a box's writing mode is vertical: its lines run down the page,
  // so its inline axis is y, and its block axis x.
  function verticalOf(el) {
    const cs = styleOf(el);
    return !!cs && /^(vertical|sideways|tb)/.test(String(cs.writingMode || ''));
  }

  // The line count a box is clamped to, as { lines, css }, or null.
  function lineClampOf(el) {
    const cs = styleOf(el);
    if (!cs) return null;
    for (const [prop, read] of [
      ['-webkit-line-clamp', cs.webkitLineClamp],
      ['line-clamp', cs.getPropertyValue ? cs.getPropertyValue('line-clamp') : '']
    ]) {
      const v = String(read || '').trim();
      const n = Number.parseInt(v, 10);
      if (!v || v === 'none' || !(n > 0)) continue;
      if (
        prop === '-webkit-line-clamp' &&
        !/-webkit-(inline-)?box/.test(String(cs.display || '')) &&
        String(cs.webkitBoxOrient || '') !== 'vertical'
      )
        continue;
      return { lines: n, css: `${prop}: ${n}` };
    }
    return null;
  }

  // Ancestors that clip on an axis, up the containing block chain: past one
  // that scrolls on an axis, outer ones no longer clip on it, and a box fixed
  // to the viewport ends the walk (the viewport's own overflow is left out).
  // The next box up the containing block chain. From the top of a shadow
  // tree the chain goes on from its host: the host, or for an absolutely
  // positioned box the first positioned element from the host up.
  function containerOf(a) {
    const cb = helpers.containingBlockOf(a);
    if (cb) return cb;
    const parent = dom.parentNode(a);
    if (!parent || dom.nodeType(parent) !== 11) return null;
    const position = String((styleOf(a) || {}).position || 'static');
    if (position === 'fixed') return null;
    for (let h = upOf(a), i = 0; h && i < 100000; h = upOf(h), i++) {
      const cs = styleOf(h) || {};
      if (cs.display === 'contents') continue;
      if (position === 'absolute' && (cs.position || 'static') === 'static') continue;
      return h;
    }
    return null;
  }

  const clipCache = new Map();
  function clippersOf(el) {
    if (clipCache.has(el)) return clipCache.get(el);
    const out = [];
    let scrolls = 0; // 1: x scrolls below, 2: y does
    for (
      let a = el, i = 0;
      a && dom.nodeType(a) === 1 && a !== html && i < 100000;
      a = containerOf(a), i++
    ) {
      const cs = a === body && bodyIsViewport ? null : styleOf(a);
      if (!cs) continue;
      const paint = /\b(paint|strict|content)\b/.test(String(cs.contain || '')) || cvClips(a);
      const x = !(scrolls & 1) && (paint || cs.overflowX === 'hidden' || cs.overflowX === 'clip');
      const y = !(scrolls & 2) && (paint || cs.overflowY === 'hidden' || cs.overflowY === 'clip');
      let own = x || y ? { el: a, x, y, shape: null, overflowClip: { x, y } } : null;
      const shape = clipShapeOf(a, cs);
      if (shape && (!(scrolls & 1) || !(scrolls & 2))) {
        own = {
          el: a,
          x: !(scrolls & 1),
          y: !(scrolls & 2),
          shape,
          overflowClip: own ? { x: own.x, y: own.y } : null
        };
      }
      if (own) out.push(own);
      if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') scrolls |= 1;
      if (cs.overflowY === 'auto' || cs.overflowY === 'scroll') scrolls |= 2;
      if (scrolls === 3) break;
      if (cs.position === 'fixed' && !containerOf(a)) break;
    }
    clipCache.set(el, out);
    return out;
  }

  // The box a clipper keeps what it paints in, in viewport coordinates: its
  // padding box, or the rectangle of its clip-path or clip (within the
  // padding box on an axis its overflow clips too). Borders and client sizes
  // are layout sizes, scaled by how much larger el is drawn than laid out.
  const boxCache = new Map();
  function clipBoxOf(c) {
    if (boxCache.has(c)) return boxCache.get(c);
    const el = c.el;
    const r = dom.getBoundingClientRect(el);
    const cs = styleOf(el);
    const ow = Number(dom.get(el, 'offsetWidth')) || 0;
    const oh = Number(dom.get(el, 'offsetHeight')) || 0;
    const kx = ow > 0 && r.width > 0 ? r.width / ow : 1;
    const ky = oh > 0 && r.height > 0 ? r.height / oh : 1;
    const bl = px(cs && cs.borderLeftWidth) * kx;
    const bt = px(cs && cs.borderTopWidth) * ky;
    const padding = {
      left: r.left + bl,
      top: r.top + bt,
      right: r.left + bl + (Number(dom.get(el, 'clientWidth')) || 0) * kx,
      bottom: r.top + bt + (Number(dom.get(el, 'clientHeight')) || 0) * ky
    };
    let box = padding;
    if (c.shape) {
      box = {
        left: r.left + c.shape.left * kx,
        top: r.top + c.shape.top * ky,
        right: r.right - c.shape.right * kx,
        bottom: r.bottom - c.shape.bottom * ky
      };
      const o = c.overflowClip;
      if (o && o.x) {
        box.left = Math.max(box.left, padding.left);
        box.right = Math.min(box.right, padding.right);
      }
      if (o && o.y) {
        box.top = Math.max(box.top, padding.top);
        box.bottom = Math.min(box.bottom, padding.bottom);
      }
    }
    boxCache.set(c, box);
    return box;
  }

  function linesOf(node) {
    const range = dom.createRange(document);
    try {
      range.selectNodeContents(node);
      const out = [];
      for (const r of dom.getClientRects(range)) {
        if (r.width < 1 || r.height < 1) continue;
        out.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
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

  // The rects of a text's glyphs only: a range over each run of characters
  // that are not white space. Preserved spaces at the end of a line hang
  // past the box's edge (white-space: pre-wrap, CSS Text 4.1.3) and show
  // nothing, so they cut no content. Past MAX_RUNS runs, one range from the
  // first such character to the last. The runs of one line are joined into
  // one rect, as linesOf gives it. Null where it can't be measured.
  function glyphLinesOf(node, vertical) {
    const MAX_RUNS = 400;
    const data = String(dom.nodeValue(node) || '');
    const runs = [];
    const re = /[^\s\u00a0]+/g;
    for (let m = re.exec(data); m; m = re.exec(data)) {
      runs.push([m.index, m.index + m[0].length]);
      if (runs.length > MAX_RUNS) break;
    }
    if (!runs.length) return null;
    const spans =
      runs.length > MAX_RUNS ? [[runs[0][0], data.replace(/[\s\u00a0]+$/, '').length]] : runs;
    const range = dom.createRange(document);
    try {
      const out = [];
      for (const [start, end] of spans) {
        range.setStart(node, start);
        range.setEnd(node, end);
        for (const r of dom.getClientRects(range)) {
          if (r.width < 1 || r.height < 1) continue;
          const last = out[out.length - 1];
          const [a, b] = vertical ? ['left', 'right'] : ['top', 'bottom'];
          if (last && Math.abs(last[a] - r[a]) < 0.5 && Math.abs(last[b] - r[b]) < 0.5) {
            for (const side of vertical ? ['top', 'bottom'] : ['left', 'right']) {
              last[side] =
                side === 'top' || side === 'left'
                  ? Math.min(last[side], r[side])
                  : Math.max(last[side], r[side]);
            }
            continue;
          }
          out.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
        }
      }
      return out.length ? out : null;
    } catch {
      return null;
    } finally {
      try {
        range.detach();
      } catch {}
    }
  }

  // How far a line sits outside a box, along the axes the box clips.
  function outside(line, box, c) {
    const dy = c.y ? Math.max(0, box.top - line.top, line.bottom - box.bottom) : 0;
    const dx = c.x ? Math.max(0, box.left - line.left, line.right - box.right) : 0;
    return { dx, dy };
  }
  // Whether any of the line shows inside the box.
  function showsIn(line, box, c) {
    const overX = !c.x || (line.right > box.left + 0.5 && line.left < box.right - 0.5);
    const overY = !c.y || (line.bottom > box.top + 0.5 && line.top < box.bottom - 0.5);
    return overX && overY;
  }
  function edgeOf(line, box, axis) {
    return axis === 'x'
      ? line.right - box.right >= box.left - line.left
        ? 'right'
        : 'left'
      : line.bottom - box.bottom >= box.top - line.top
        ? 'bottom'
        : 'top';
  }

  // The CSS that cuts text off on an axis at box c, as declarations; '' where
  // it can't be read.
  function clipCssOf(c, textEl, axis, clamp) {
    try {
      const cs = styleOf(c.el);
      if (!cs) return '';
      const parts = [];
      // The inline axis follows the box's writing mode.
      const vertical = verticalOf(c.el);
      const inline = axis === (vertical ? 'y' : 'x');
      const [maxSize, size] = axis === 'x' ? ['maxWidth', 'width'] : ['maxHeight', 'height'];
      const cssName = {
        maxWidth: 'max-width',
        width: 'width',
        maxHeight: 'max-height',
        height: 'height'
      };
      if (clamp) parts.push(clamp.css);
      else if (inline) {
        let ws = '';
        for (let cur = textEl, i = 0; cur && i < 100; cur = upOf(cur), i++) {
          const st = styleOf(cur);
          const v = st ? String(st.whiteSpace || '') : '';
          if (/^(nowrap|pre)$/.test(v) || (st && st.textWrapMode === 'nowrap')) {
            ws = `white-space: ${v === 'pre' ? 'pre' : 'nowrap'}`;
            break;
          }
          if (cur === c.el) break;
        }
        if (ws) parts.push(ws);
        else if (cs[maxSize] && cs[maxSize] !== 'none')
          parts.push(`${cssName[maxSize]}: ${cs[maxSize]}`);
        else if (cs[size] && cs[size] !== 'auto') parts.push(`${cssName[size]}: ${cs[size]}`);
      } else if (cs[maxSize] && cs[maxSize] !== 'none')
        parts.push(`${cssName[maxSize]}: ${cs[maxSize]}`);
      else if (cs[size] && cs[size] !== 'auto') parts.push(`${cssName[size]}: ${cs[size]}`);
      const ox = String(cs.overflowX || '');
      const oy = String(cs.overflowY || '');
      const own = axis === 'x' ? ox : oy;
      if (own && own !== 'visible')
        parts.push(ox === oy ? `overflow: ${own}` : `overflow-${axis}: ${own}`);
      // A box the scan lays out in place of content-visibility: auto holds
      // paint containment instead (contain: content): name what the author
      // wrote.
      else if (cvClips(c.el)) parts.push('content-visibility: auto');
      else if (cs.contain && cs.contain !== 'none') parts.push(`contain: ${cs.contain}`);
      else if (c.shape && cs.clipPath && cs.clipPath !== 'none')
        parts.push(`clip-path: ${cs.clipPath}`);
      else if (c.shape && cs.clip && cs.clip !== 'auto') parts.push(`clip: ${cs.clip}`);
      else return '';
      if (inline && cs.textOverflow === 'ellipsis') parts.push('text-overflow: ellipsis');
      return parts.join('; ');
    } catch {
      return '';
    }
  }

  // ---- Measure ----

  // Whether a box between the text and its clipping box was placed out of
  // the flow (absolutely positioned or fixed) or moved by a transform: text
  // it holds was put outside the clipping box, not pushed out by its size.
  function placedOutside(textEl, clipEl) {
    for (let a = textEl, i = 0; a && a !== clipEl && i < 1000; a = upOf(a), i++) {
      const cs = styleOf(a);
      if (!cs) continue;
      if (cs.position === 'absolute' || cs.position === 'fixed') return true;
      if (cs.transform && cs.transform !== 'none') return true;
    }
    return false;
  }
  // Whether a clipping box shows any of the text in it: a collapsed panel
  // shows none. Kept per box; at most 200 texts are read in each.
  const showsTextOf = new Map();
  function showsSomeText(c) {
    if (showsTextOf.has(c.el)) return showsTextOf.get(c.el);
    let shows = false;
    try {
      const b = clipBoxOf(c);
      const walker = dom.createTreeWalker(document, c.el, 4);
      let read = 0;
      for (let t = walker.nextNode(); t && !shows && read < 200; t = walker.nextNode()) {
        if (!/\S/.test(dom.nodeValue(t) || '')) continue;
        read += 1;
        shows = linesOf(t).some((l) => showsIn(l, b, c));
      }
    } catch {}
    showsTextOf.set(c.el, shows);
    return shows;
  }

  // Per clipping box, the finding it gives: the first text it cuts, or a
  // text it cuts for certain over one it cuts by less.
  const byBox = new Map();
  let measured = 0;
  for (const { n, box: textEl, holder } of texts) {
    const clippers = clippersOf(textEl);
    if (!clippers.length) continue;
    let lines = linesOf(n);
    if (!lines.length) continue;
    // A text that goes past a box that clips it is measured again by its
    // glyphs, so white space alone past the edge is no cut.
    if (
      /[\s\u00a0]/.test(String(dom.nodeValue(n) || '')) &&
      clippers.some((c) => {
        const b = clipBoxOf(c);
        return lines.some((l) => {
          const o = outside(l, b, c);
          return o.dx > PARTLY_PX || o.dy > PARTLY_PX;
        });
      })
    ) {
      lines = glyphLinesOf(n, verticalOf(textEl)) || lines;
    }
    // A box a pixel wide or high is visually hidden text, not a cut. Text a
    // box hides entirely is left out where the box shows none of its text
    // (a collapsed panel), or where the text was placed out of it (an
    // off-canvas menu, a carousel's next slide): it is hidden on purpose.
    // Where the box shows other text, and the text only flowed out of it (a
    // fixed-height card whose later lines or paragraphs drop out), it is
    // cut off, and asked about as any cut text is.
    let skip = false;
    for (const c of clippers) {
      const b = clipBoxOf(c);
      if (b.right - b.left <= 1 || b.bottom - b.top <= 1) {
        skip = true;
        break;
      }
      if (lines.some((l) => showsIn(l, b, c))) continue;
      if (placedOutside(textEl, c.el) || !showsSomeText(c)) {
        skip = true;
        break;
      }
    }
    if (skip) continue;
    measured += 1;
    const fontSize = px(styleOf(textEl) && styleOf(textEl).fontSize) || 16;
    // Half an em along the line, and half the line's thickness across it:
    // in a vertical writing mode, the line runs down (y).
    const textVertical = verticalOf(textEl);
    for (const c of clippers) {
      if (isExcluded(c.el)) continue;
      const known = byBox.get(c.el);
      if (known && known.lost) continue;
      const b = clipBoxOf(c);
      let worst = null;
      for (const l of lines) {
        const o = outside(l, b, c);
        const x = {
          axis: 'x',
          overflowPx: o.dx,
          thresholdPx: textVertical ? (l.right - l.left) / 2 : fontSize / 2
        };
        const y = {
          axis: 'y',
          overflowPx: o.dy,
          thresholdPx: textVertical ? fontSize / 2 : (l.bottom - l.top) / 2
        };
        const lost = o.dx >= x.thresholdPx || o.dy >= y.thresholdPx;
        if (lost) {
          const m = o.dx >= x.thresholdPx ? x : y;
          worst = { lost, ...m, edge: edgeOf(l, b, m.axis) };
          break;
        }
        if (o.dx > PARTLY_PX || o.dy > PARTLY_PX) {
          const m = o.dx >= o.dy ? x : y;
          if (!worst || m.overflowPx > worst.overflowPx)
            worst = { lost, ...m, edge: edgeOf(l, b, m.axis) };
        }
      }
      if (!worst) continue;
      const cs = styleOf(c.el);
      // The ellipsis shortens a line on the box's inline axis, and the clamp
      // its lines on its block axis.
      const inlineAxis = verticalOf(c.el) ? 'y' : 'x';
      const clamp = worst.axis !== inlineAxis ? lineClampOf(c.el) : null;
      const ellipsis = worst.axis === inlineAxis && !!cs && cs.textOverflow === 'ellipsis';
      const truncated = !!clamp || ellipsis;
      if (known && !worst.lost && !truncated) continue;
      const text = String(dom.nodeValue(n) || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 60);
      byBox.set(c.el, {
        el: c.el,
        holder,
        code: truncated ? 'TEXT_TRUNCATED_AT_640' : 'TEXT_CLIPPED_AT_640',
        lost: worst.lost || truncated,
        text,
        metrics: {
          axis: worst.axis,
          overflowPx: Math.round(worst.overflowPx * 10) / 10,
          thresholdPx: Math.round(worst.thresholdPx * 10) / 10
        },
        edge: worst.edge,
        clipCss: clipCssOf(c, textEl, worst.axis, clamp),
        container: {
          widthPx: Math.round((b.right - b.left) * 10) / 10,
          heightPx: Math.round((b.bottom - b.top) * 10) / 10
        }
      });
    }
  }

  // ---- Report ----

  const viewport = {
    width: Math.round(width),
    height: Math.round(Number(dom.get(view, 'innerHeight')) || 0)
  };
  const LEANS = {
    clipped: {
      toward: 'fail',
      why: 'At least half a line of the text lies past the edge of the box, which hides it and does not scroll.',
      signals: [{ signal: 'text-cut-by-box', value: true }],
      caution: 'The full text may be shown another way, such as a control that opens the box.',
      i18n: {
        whyKey: 'resizeTextContentLoss_lean_why_clipped',
        cautionKey: 'resizeTextContentLoss_lean_caution_clipped'
      }
    },
    truncated: {
      toward: 'fail',
      why: 'The box shortens the text with an ellipsis or a line clamp, so part of it is not shown.',
      signals: [{ signal: 'text-truncated', value: true }],
      caution:
        'The full text may be offered another way that works with the keyboard, such as a "read more" link.',
      i18n: {
        whyKey: 'resizeTextContentLoss_lean_why_truncated',
        cautionKey: 'resizeTextContentLoss_lean_caution_truncated'
      }
    }
  };
  // Below this width the page is laid out narrower than a 1280 pixel window
  // at 200% zoom: what is cut there may be cut only at a larger zoom.
  const narrower = viewport.width < LEAN_MIN_WIDTH;
  const EDGE_WORDS = { top: 'top ', right: 'right ', bottom: 'bottom ', left: 'left ' };
  const MESSAGES = {
    TEXT_CLIPPED_AT_640: {
      key: 'clipped',
      summary: (p, edge) =>
        `At ${p.viewportWidth} pixels wide, ${p.narrower ? 'narrower than a 1280 pixel window at 200% zoom' : `as a 1280 pixel window shows the page at ${p.zoomPercent}% zoom`}, this element cuts off the text "${p.text}" (${p.overflowPx} pixels past its ${EDGE_WORDS[edge] || ''}edge).${p.clipCss ? ` The CSS that cuts it off: ${p.clipCss}.` : ''}`,
      hint: (p) =>
        p.clipCss
          ? `Let the box grow with its text when the page is zoomed: change ${p.clipCss}, or let it scroll.`
          : 'Let the box grow with its text when the page is zoomed: avoid fixed heights and widths with overflow: hidden on text, or let it scroll.'
    },
    TEXT_TRUNCATED_AT_640: {
      key: 'truncated',
      summary: (p) =>
        `At ${p.viewportWidth} pixels wide, ${p.narrower ? 'narrower than a 1280 pixel window at 200% zoom' : `as a 1280 pixel window shows the page at ${p.zoomPercent}% zoom`}, this element shortens the text "${p.text}" with an ellipsis or a line clamp, so part of it is not shown.${p.clipCss ? ` The CSS that shortens it: ${p.clipCss}.` : ''}`,
      hint: () =>
        'Let the text wrap and the box show all of it when the page is zoomed, or offer the full text another way that works with the keyboard, such as a "read more" link.'
    }
  };

  const questions = [];
  const perCode = {};
  for (const f of byBox.values()) {
    perCode[f.code] = (perCode[f.code] || 0) + 1;
    if (perCode[f.code] > MAX_PER_CODE) continue;
    const msg = MESSAGES[f.code];
    const edgeKey = f.edge ? `edge${f.edge[0].toUpperCase()}${f.edge.slice(1)}` : '';
    const params = {
      text: f.text,
      overflowPx: String(Math.round(f.metrics.overflowPx)),
      viewportWidth: String(viewport.width),
      // The zoom at which a 1280 pixel window lays the page out this wide:
      // 200% at 640, 400% at 320.
      zoomPercent: String(Math.round((1280 * 100) / (viewport.width || ZOOM_WIDTH))),
      ...(narrower ? { narrower: true } : {}),
      ...(edgeKey ? { [edgeKey]: true } : {}),
      ...(f.clipCss ? { clipCss: f.clipCss } : {})
    };
    // Narrower than 200% zoom of a 1280 pixel window gives, the cut may
    // appear only at a zoom 1.4.4 doesn't ask for: asked without a lean.
    const lean = narrower
      ? null
      : f.code === 'TEXT_TRUNCATED_AT_640'
        ? LEANS.truncated
        : f.lost
          ? LEANS.clipped
          : null;
    questions.push(
      helpers.reportOccurrence(f.el, {
        ...(lean ? { lean } : {}),
        summary: msg.summary(params, f.edge),
        hint: msg.hint(params),
        i18n: {
          summaryKey: `resizeTextContentLoss_summary_${msg.key}`,
          hintKey: `resizeTextContentLoss_hint_${msg.key}`,
          params
        },
        occurrenceOutcome: 'cantTell',
        data: {
          details: {
            reasonCode: f.code,
            text: f.text,
            metrics: f.metrics,
            edge: f.edge,
            ...(f.clipCss ? { clipCss: f.clipCss } : {}),
            container: f.container,
            viewport
          }
        }
      })
    );
  }

  const omitted = {};
  for (const [code, count] of Object.entries(perCode)) {
    if (count > MAX_PER_CODE) omitted[code] = count - MAX_PER_CODE;
  }
  if (questions.length) {
    return {
      ruleId: rule.ruleId,
      ...helpers.resolveTieredOutcome([], questions, rule.defaultSeverity || 'serious'),
      ...(Object.keys(omitted).length ? { data: { omitted } } : {})
    };
  }
  if (measured) return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  return notApplicable(null);
}

module.exports = { id, meta, runInPage, applicability };
