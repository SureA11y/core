/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check p-as-heading
 * @atomic true
 * @summary Text styled to look like a heading should probably be a real heading
 * @standard WCAG 2.2
 * @sc 1.3.1
 * @applicability
 *   `<p>` elements, and `<div>` elements that hold only text and inline
 *   markup, whose visible text is short (<=120 char) and non-empty, and
 *   in which every visible piece of text is bold (computed `font-weight`
 *   >= 700, however it got there: on the element itself, a
 *   `<strong>`/`<b>` or a styled `<span>`), or semibold (600) and heavier
 *   than the text around it, as design systems set titles, and rendered at
 *   >=18px.
 *   Visible text is the text that is rendered (not display:none, [hidden]
 *   or visibility:hidden) and not screen-reader-only. Text that is all
 *   inside controls (a widget's or a <label>'s own text) is left out.
 *   A `<p>` whose visible text is all bold, or all heavier than the text
 *   around it (the paragraph's own, or its parent's where the paragraph
 *   itself is set heavier), at body size (smaller than 18px) applies too,
 *   when the text doesn't end as a sentence (past closing quotes and
 *   brackets, and in any script's punctuation), the next element shown
 *   holds text lighter than it, and the element before it is no bold line
 *   too: a title made by bolding a line of body text, the way authors
 *   usually make one in a content editor, and not a line of a bold run,
 *   such as an address. Heavier counts because a theme may draw body text
 *   at weight 300, which makes `<strong>` 400. Under jsdom, a size relative
 *   to the parent's (em, %, larger, smaller) or the root's (rem) is read
 *   against it, as a browser computes it.
 * @expectation
 *   Text styled to visually read as a heading (bold, larger-than-body
 *   size, short) should be marked up with a real heading element
 *   (`<h1>`-`<h6>` or `role="heading"`) so its structural role is
 *   programmatically determinable, the same 1.3.1 concern as any other
 *   "structure conveyed through presentation only" issue.
 * @reports
 *   - `reasonCode`: `HEADING_LIKE_NUMBER` when the text is only a number
 *     (digits with spacing and punctuation: "2024", "No 12" is not one),
 *     `HEADING_LIKE_LINK` when it is all inside one link, so a report can
 *     set either kind aside as a group; otherwise `BOLD_LARGE_PARAGRAPH`
 *     for a <p> and `BOLD_LARGE_DIV` for a <div>. All are asked about.
 *   - `fontSizePx`: the font size of the text as drawn, in CSS pixels (the
 *     computed size times CSS zoom, an SVG transform or what
 *     font-size-adjust scales the font by), the smallest one when the
 *     pieces differ, against the 18px threshold. `BOLD_SHORT_PARAGRAPH`
 *     has it too.
 * @reason-codes
 *   - `BOLD_LARGE_PARAGRAPH` (cantTell): a short p whose visible text is all
 *     bold and at least 18px may be a heading shown only by its style.
 *     It leans fail when the text does not end as a sentence and has a real
 *     heading's style on the page or is followed by smaller plain text.
 *     Basis: WCAG 1.3.1 (not settled); H42; F2.
 *   - `BOLD_LARGE_DIV` (cantTell): a short div of text and inline markup,
 *     all bold and at least 18px, may be a heading shown only by its style.
 *     It leans fail when the text does not end as a sentence, has a real
 *     heading's style on the page and is followed by smaller plain text.
 *     Basis: WCAG 1.3.1 (not settled); H42; F2.
 *   - `HEADING_LIKE_LINK` (cantTell): bold, large, short text that is all
 *     inside one link may be a heading shown only by its style.
 *     It leans fail when the link is followed by a description and sibling
 *     containers of the same shape repeat it, with no real heading.
 *     Basis: WCAG 1.3.1 (not settled); H42; F2.
 *   - `HEADING_LIKE_NUMBER` (cantTell): bold, large text that is only a
 *     number, such as a year, may be a heading shown only by its style. A
 *     currency or percent sign doesn't stop it being a number ("$29.99",
 *     "45%"); text with no letter or digit at all (a star rating, a scene
 *     break, an emoji) is not asked about at any size.
 *     Basis: WCAG 1.3.1 (not settled); H42; F2.
 *   - `BOLD_SHORT_PARAGRAPH` (cantTell): a short p whose visible text is
 *     all bold, or all heavier than the paragraph's own text, at body size,
 *     doesn't end as a sentence and is followed by lighter text, may be a
 *     heading shown only by its style.
 *     Text that is only a number or all one link is left out at this size.
 *     Basis: WCAG 1.3.1 (not settled); H42; F2.
 * @implementation-notes
 * - This is a stylistic heuristic (bold + large + short), not a
 *   deterministic structural check: a short bold sentence is not
 *   necessarily wrong as a `<p>`. Authored as `type: 'manual'`
 *   (cantTell-capped, never fail) to avoid false-flagging legitimate
 *   emphasis, matching this repo's other heuristic-heavy Tier 2/3
 *   rules (e.g. `scrollable-region-focusable`).
 * - Below 18px only a `<p>` is asked about, and only with both signs a
 *   title gives (no sentence ending, plain text after it), since bold body
 *   text is far more often emphasis than a title: a bold warning ends as a
 *   sentence, and a run of bold lines such as an address is followed by
 *   more bold text. A `<div>` at body size is more often a label, a badge
 *   or a price, and is left out.
 * - Uses an absolute 18px size threshold rather than comparing against
 *   surrounding text (unlike `link-in-text-block`); it's simpler on
 *   purpose, since "looks like a heading" is closer to an absolute
 *   judgment than a relative-contrast one.
 * - Weight and size are read from the element that holds each piece of
 *   text, so `<p><span style="font-weight:bold">` counts and a `<p>` with
 *   one normal-weight word does not.
 * - A `<div>` is only considered when it has no block, list, table, form
 *   control or image inside it, so only the innermost block is asked
 *   about. A `<div>` with a role (a role attribute whose tokens name a
 *   real role; the first such token wins, in any case), and text inside a
 *   heading, button,
 *   label, legend, caption, table header or `<summary>`, are left out:
 *   that text already has a role of its own.
 * - Text that is not rendered, or is screen-reader-only (clipped, at most
 *   1px with its overflow hidden, or moved off screen, on the element
 *   holding it or any ancestor), is not what a sighted reader sees: it is
 *   left out of the weight, size and length tests, and a candidate with no
 *   visible text (a social icon's screen-reader label) is not asked about.
 *   Opacity does not hide text here: content faded in on scroll is seen.
 * - A link does not stop the question, since a heading's text is often a
 *   link (`<h3><a>`). Nor does a number: a year, an issue number or a
 *   section number can title a section. Text beside a control, or inside
 *   a focusable element that is not a widget, is still asked about.
 * - A block whose style can't be read is not asked about, and the rule
 *   goes on to the next: jsdom throws reading the computed style of an
 *   element a few thousand levels deep.
 */

const id = 'p-as-heading';

const meta = {
  title: 'Text styled to look like a heading should probably be a real heading',
  description:
    'Flags short <p> and <div> elements whose text is all bold and rendered at >=18px, and short all-bold <p> elements at body size that read as a title before plain text, for manual review of whether a real heading element should be used instead.',
  i18n: {
    titleKey: 'pAsHeading_title',
    descriptionKey: 'pAsHeading_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag131', 'structure', 'atomic', 'manual'],
  wcagSc: ['1.3.1'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.3.1',
      title: 'Info and Relationships',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'minor',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'low',
  coverage: { facetsBySc: { '1.3.1': ['p-as-heading-evidence'] } }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const MAX_HEADING_LIKE_CHARS = 120;
  const MIN_FONT_SIZE_PX = 18;

  function trim(v) {
    return (v == null ? '' : String(v)).trim();
  }

  function safeComputedStyle(el) {
    try {
      if (!el || dom.nodeType(el) !== 1) return null;
      if (helpers && typeof helpers.computedStyle === 'function') {
        const cs = helpers.computedStyle(el);
        if (cs) return cs;
      }
      const view =
        dom.ownerDocument(el) && dom.defaultView(dom.ownerDocument(el))
          ? dom.defaultView(dom.ownerDocument(el))
          : null;
      if (view && typeof view.getComputedStyle === 'function') return view.getComputedStyle(el);
    } catch {}
    return null;
  }

  function isBoldWeight(cs) {
    if (!cs) return false;
    const w = trim(cs.fontWeight).toLowerCase();
    if (w === 'bold' || w === 'bolder') return true;
    const n = Number.parseInt(w, 10);
    return Number.isFinite(n) && n >= 700;
  }

  // An element's weight as a number. A browser computes it; jsdom may keep
  // `bolder` or `lighter` as written, which CSS Fonts resolves against the
  // parent's weight (bolder: under 350 gives 400, under 550 gives 700, under
  // 900 gives 900; lighter: under 550 gives 100, under 750 gives 400, else
  // 700). A child handed the same keyword as its parent inherited it, as
  // jsdom passes the specified value down: it has the parent's weight.
  const weightMemo = new Map();
  function weightOf(el) {
    if (!el) return 400;
    if (weightMemo.has(el)) return weightMemo.get(el);
    const raw = trim(safeComputedStyle(el) && safeComputedStyle(el).fontWeight).toLowerCase();
    let value;
    if (raw === 'bolder' || raw === 'lighter') {
      const parent = dom.parentElement(el);
      const parentRaw = parent
        ? trim(safeComputedStyle(parent) && safeComputedStyle(parent).fontWeight).toLowerCase()
        : '';
      const base = parent ? weightOf(parent) : 400;
      if (parentRaw === raw) value = base;
      else if (raw === 'bolder')
        value = base < 350 ? 400 : base < 550 ? 700 : base < 900 ? 900 : base;
      else value = base < 100 ? base : base < 550 ? 100 : base < 750 ? 400 : 700;
    } else {
      value = weightNumOf(safeComputedStyle(el));
    }
    weightMemo.set(el, value);
    return value;
  }

  // A computed weight as a number, from the style alone; a keyword is read
  // against a normal (400) parent. `weightOf` resolves it against the real one.
  function weightNumOf(cs) {
    const w = trim(cs && cs.fontWeight).toLowerCase();
    if (w === 'bold' || w === 'bolder') return 700;
    if (w === 'normal' || !w) return 400;
    if (w === 'lighter') return 100;
    const n = Number.parseInt(w, 10);
    return Number.isFinite(n) ? n : 400;
  }

  // Elements whose text already has a role of its own: these native tags,
  // or an element whose role attribute resolves to one of OWN_ROLES (the
  // first token naming a real role, in any case: role="foo heading" counts,
  // role="note heading" doesn't).
  const OWN_ROLE_TAGS = new Set([
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'button',
    'label',
    'legend',
    'caption',
    'th',
    'summary'
  ]);
  const OWN_ROLES = ['heading', 'button', 'columnheader', 'rowheader'];

  // Walks up the element's own tree, as closest() would, without a selector
  // per step: jsdom's selector matching over a deep chain was most of the
  // rule's time.
  function hasOwnRoleAncestor(el) {
    for (let cur = el; cur; cur = dom.parentElement(cur)) {
      if (OWN_ROLE_TAGS.has(String(dom.localName(cur) || '').toLowerCase())) return true;
      if (dom.hasAttribute(cur, 'role') && OWN_ROLES.includes(helpers.aria.getExplicitRole(cur)))
        return true;
    }
    return false;
  }

  // Anything but text and inline markup makes a <div> a container, not a
  // passage of text. Checked by walking
  // the <div>'s descendants and stopping at the first one: a querySelector
  // with this list per <div> took seconds under jsdom on deeply nested pages
  // (131 s at 800 levels).
  const NOT_INLINE = new Set([
    'address',
    'article',
    'aside',
    'blockquote',
    'details',
    'dialog',
    'div',
    'dl',
    'fieldset',
    'figure',
    'figcaption',
    'footer',
    'form',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'header',
    'hgroup',
    'hr',
    'li',
    'main',
    'nav',
    'ol',
    'p',
    'pre',
    'section',
    'table',
    'ul',
    'img',
    'svg',
    'picture',
    'video',
    'audio',
    'canvas',
    'iframe',
    'object',
    'embed',
    'input',
    'select',
    'textarea',
    'button'
  ]);

  function hasNonInlineDescendant(el) {
    const walker = dom.createTreeWalker(dom.ownerDocument(el), el, 1);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (NOT_INLINE.has(String(dom.localName(node) || '').toLowerCase())) return true;
    }
    return false;
  }

  // Not rendered: display:none, [hidden], visibility:hidden and the like.
  // Opacity is left out, as text faded in on scroll is seen.
  const RENDER_OPTS = { visibilityMode: 'styleOnly', disableGeometry: true, ignoreOpacity: true };
  function isRendered(holder) {
    if (typeof helpers.isDomVisibleEligible !== 'function') return true;
    const vis = helpers.isDomVisibleEligible(holder, null, RENDER_OPTS);
    return !vis || vis.eligible !== false;
  }

  // Screen-reader-only: clipped away, at most 1px with its overflow hidden,
  // or moved off screen, on the element or any ancestor. Not opacity.
  const srOnlyCache = new Map();
  function isScreenReaderOnly(node) {
    if (!node || dom.nodeType(node) !== 1) return false;
    if (srOnlyCache.has(node)) return srOnlyCache.get(node);
    let hidden =
      typeof helpers.isVisuallyHidden === 'function' &&
      helpers.isVisuallyHidden(node, { ignoreOpacity: true });
    if (!hidden && typeof helpers.getVisibilityHintsInfo === 'function') {
      const info = helpers.getVisibilityHintsInfo(node, ctx);
      hidden = !!(info && info.hints && info.hints.includes('offscreen'));
    }
    if (!hidden) hidden = isScreenReaderOnly(dom.parentElement(node));
    srOnlyCache.set(node, hidden);
    return hidden;
  }

  // Widget roles that make text a control's own label.
  const INTERACTIVE_ROLES = new Set([
    'button',
    'checkbox',
    'radio',
    'switch',
    'tab',
    'textbox',
    'combobox',
    'listbox',
    'menuitem',
    'menuitemcheckbox',
    'menuitemradio',
    'option',
    'slider',
    'spinbutton',
    'searchbox',
    'scrollbar',
    'treeitem'
  ]);

  function roleOf(node) {
    if (typeof helpers.getRoleInfo !== 'function') return '';
    try {
      const info = helpers.getRoleInfo(node, ctx);
      return (info && info.role) || '';
    } catch {
      return '';
    }
  }

  // Whether the holder, or an element between it and el, is a widget, a
  // <label> or an editing host. A link is not: a heading's text is often one.
  function isInsideControl(holder, el) {
    for (let cur = holder; cur; cur = dom.parentElement(cur)) {
      if (INTERACTIVE_ROLES.has(roleOf(cur))) return true;
      if (String(dom.localName(cur) || '').toLowerCase() === 'label') return true;
      const editable = dom.getAttribute(cur, 'contenteditable');
      if (editable != null && editable.toLowerCase() !== 'false') return true;
      if (cur === el) break;
    }
    return false;
  }

  // A holder's font size as drawn (zoom, an SVG transform or
  // font-size-adjust scale it: helpers.contrast.renderedTextScale) when its
  // text is bold, or heavier than the block's own text (`blockWeight`), else
  // 0. `bold` says whether it is bold outright (700 or more), which large
  // text needs; heavier-than-its-block counts only at body size, where a
  // theme may draw body text at 300 and <strong> at 400. Whether the text
  // is large enough is the caller's call.
  function boldStyleOf(holder, blockWeight) {
    const cs = safeComputedStyle(holder);
    // One read of the weight, `bolder` resolved against the parent's: 700 or
    // more is bold outright, as isBoldWeight reads it.
    const weight = weightOf(holder);
    const bold = weight >= 700;
    if (!bold && !(weight > blockWeight)) return null;
    const scale =
      helpers.contrast && typeof helpers.contrast.renderedTextScale === 'function'
        ? helpers.contrast.renderedTextScale(holder, cs)
        : 1;
    const px = Number(fontPxOf(holder, cs)) * scale;
    return Number.isFinite(px) && px > 0 ? { px, bold, weight } : null;
  }

  // An element's font size in pixels. A browser computes it; jsdom keeps it
  // as written, so a size relative to the parent's (em, %, larger, smaller)
  // is read against the parent's, and one relative to the root's (rem)
  // against the root's, as a browser would; parsePx reads a keyword or a
  // calc() at a browser's sizes.
  const sizeMemo = new Map();
  function fontPxOf(el, cs) {
    if (sizeMemo.has(el)) return sizeMemo.get(el);
    const raw = trim(cs && cs.fontSize).toLowerCase();
    const parentPx = () => {
      const parent = dom.parentElement(el);
      return parent ? fontPxOf(parent, safeComputedStyle(parent)) : 16;
    };
    let px;
    const rel = /^(\d*\.?\d+)(em|%)$/.exec(raw);
    // jsdom hands a child the size its parent specified ("150%") rather than
    // the size it resolved to: the same relative size as the parent's is the
    // parent's, inherited (a box at 150% set directly in another at 150% is
    // read so too, which a browser would grow again).
    const parent = dom.parentElement(el);
    const parentRaw = parent
      ? trim(safeComputedStyle(parent) && safeComputedStyle(parent).fontSize).toLowerCase()
      : '';
    if ((rel || raw === 'larger' || raw === 'smaller') && raw === parentRaw) px = parentPx();
    else if (rel) px = Number(rel[1]) * (rel[2] === '%' ? parentPx() / 100 : parentPx());
    else if (raw === 'larger') px = parentPx() * 1.2;
    else if (raw === 'smaller') px = parentPx() / 1.2;
    else if (/^\d*\.?\d+rem$/.test(raw)) {
      const root = dom.documentElement(dom.ownerDocument(el));
      px =
        Number.parseFloat(raw) *
        (root && root !== el ? fontPxOf(root, safeComputedStyle(root)) : 16);
    } else {
      px =
        helpers.contrast && typeof helpers.contrast.parsePx === 'function'
          ? helpers.contrast.parsePx(raw)
          : Number.parseFloat(raw);
    }
    px = Number(px);
    if (!Number.isFinite(px) || px <= 0) px = 0;
    sizeMemo.set(el, px);
    return px;
  }

  // The element shown next after el, past what is hidden or only for screen
  // readers; where el is the only element of a wrapper, the one after the
  // wrapper. Null when there is none.
  function shownSibling(el, step) {
    for (let n = step(el); n; n = step(n)) {
      if (isRendered(n) && !isScreenReaderOnly(n)) return n;
    }
    const parent = dom.parentElement(el);
    if (
      parent &&
      String(dom.localName(parent) || '').toLowerCase() === 'div' &&
      dom.childElementCount(parent) === 1
    ) {
      return shownSibling(parent, step);
    }
    return null;
  }
  const nextShown = (el) => shownSibling(el, (n) => dom.nextElementSibling(n));
  const prevShown = (el) => shownSibling(el, (n) => dom.previousElementSibling(n));

  // The text a sighted reader sees, when all of it is bold; else null. Each
  // piece carries its size, so the caller can tell large bold text from
  // bold body text. Visibility is only worked out once some text is bold,
  // as it costs far more than reading the style.
  function headingLikePieces(el) {
    const isSeen = (holder) => isRendered(holder) && !isScreenReaderOnly(holder);
    // Heavier than the text around it: the block's own weight, or its
    // parent's where the block itself is set heavier (a semibold title <p>).
    const parentEl = dom.parentElement(el);
    const blockWeight = Math.min(weightOf(el), parentEl ? weightOf(parentEl) : 400);
    const headingLike = [];
    const others = [];
    const walker = dom.createTreeWalker(dom.ownerDocument(el), el, 4);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const raw = String(dom.nodeValue(node) || '');
      const holder = dom.parentElement(node);
      if (!holder || !trim(raw)) continue;
      const style = boldStyleOf(holder, blockWeight);
      if (style) {
        headingLike.push({
          holder,
          raw,
          fontSizePx: style.px,
          bold: style.bold,
          weight: style.weight
        });
        // A heading is a few pieces of text: a long run of bold text is not
        // one, and needn't have the visibility of every piece worked out.
        if (headingLike.length > 64) return null;
      } else if (others[others.length - 1] !== holder) {
        others.push(holder);
        // A long run of plain text: one piece of it seen settles it early.
        if (others.length === 16 && isSeen(others[0])) return null;
      }
    }
    if (!headingLike.length) return null;
    // Before working out what is seen, which costs the most: when all the
    // text is bold and none of it large, only a <p> before lighter text can
    // be asked about. Both tests hold for any subset of the pieces, so they
    // never leave out text the full test would ask about. With lighter text
    // too, the test below usually settles it first, as it did before.
    if (!others.length && !headingLike.some((piece) => isLargeTitle(piece))) {
      if (String(dom.localName(el) || '').toLowerCase() !== 'p') return null;
      const heaviest = Math.max(...headingLike.map((piece) => piece.weight));
      if (!hasPlainText(nextShown(el), heaviest)) return null;
    }
    if (others.some(isSeen)) return null;
    return headingLike.filter((piece) => isSeen(piece.holder));
  }

  // Large text a title: 18px or more, and bold, or semibold (600) heavier
  // than the text around it, as design systems set their titles.
  const isLargeTitle = (piece) =>
    piece.fontSizePx >= MIN_FONT_SIZE_PX && (piece.bold || piece.weight >= 600);

  function shownTextOf(pieces) {
    return pieces
      .map((piece) => piece.raw)
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // The link every piece is in, when they are all in one, else null.
  function soleLinkOf(pieces, el) {
    let link = null;
    for (const piece of pieces) {
      let n = piece.holder;
      let found = null;
      for (let steps = 0; n && steps < 50; steps++) {
        if ((dom.tagName(n) || '').toLowerCase() === 'a' && dom.getAttribute(n, 'href') != null) {
          found = n;
          break;
        }
        if (n === el) break;
        n = dom.parentElement(n);
      }
      if (!found || (link && found !== link)) return null;
      link = found;
    }
    return link;
  }

  // Digits with only spacing, punctuation, a currency sign or a percent
  // sign around them: "2024", "12.", "1/3", "#4", "$29.99", "29,99 €", "45%".
  // Two plain tests rather than one pattern with a digit in the middle,
  // which backtracks on long text.
  const NUMBER_CHARS = /^[\s\d.,:;/#№°'’()\-–—%‰\p{Sc}]+$/u;
  const isNumberOnly = (text) => NUMBER_CHARS.test(text) && /\d/.test(text);

  function minFontSize(pieces) {
    let minPx = Infinity;
    for (const piece of pieces) minPx = Math.min(minPx, piece.fontSizePx);
    return Number.isFinite(minPx) ? minPx : 0;
  }

  // The cheap tests first: walking up for an ancestor with its own role is
  // the costly one, and most <div>s are already out by then.
  function isCandidate(el) {
    const tag = (dom.tagName(el) || '').toLowerCase();
    if (tag !== 'p') {
      if (tag !== 'div') return false;
      // A role attribute naming no real role leaves the <div> a plain <div>.
      if (helpers.aria.getExplicitRole(el)) return false;
      if (hasNonInlineDescendant(el)) return false;
    }
    return !hasOwnRoleAncestor(el);
  }

  // Whether `el` holds visible text lighter than the title's (`titleWeight`):
  // the plain text a title comes before. A run of bold lines (an address, a list of names) is
  // followed by more bold text, and is not a title over body text.
  function hasPlainText(el, titleWeight) {
    if (!el || !/\p{L}/u.test(String(dom.textContent(el) || ''))) return false;
    if (!isRendered(el)) return false;
    const walker = dom.createTreeWalker(dom.ownerDocument(el), el, 4);
    let seen = 0;
    for (let node = walker.nextNode(); node && seen < 200; node = walker.nextNode()) {
      if (!/\p{L}/u.test(String(dom.nodeValue(node) || ''))) continue;
      seen += 1;
      const holder = dom.parentElement(node);
      if (holder && weightOf(holder) < titleWeight && isRendered(holder)) return true;
    }
    return false;
  }

  // ---- Leans ----

  const pxOf = (cs) => Number.parseFloat(cs && cs.fontSize);
  const familyOf = (cs) =>
    trim(cs && cs.fontFamily)
      .toLowerCase()
      .replace(/["']/g, '');
  const styleWeightOf = (cs) => {
    const w = trim(cs && cs.fontWeight).toLowerCase();
    return w === 'bold' ? '700' : w;
  };

  // The styles of the page's real headings shown to its readers, read once.
  let headingStyles = null;
  function realHeadingStyles() {
    if (headingStyles) return headingStyles;
    headingStyles = [];
    for (const h of helpers.queryAll('h1, h2, h3, h4, h5, h6') || []) {
      if (helpers.aria.getExplicitRole(h) || !isRendered(h) || isScreenReaderOnly(h)) continue;
      const cs = safeComputedStyle(h);
      if (cs && Number.isFinite(pxOf(cs))) headingStyles.push(cs);
    }
    return headingStyles;
  }

  // The same font size, weight and family as a real heading on the page:
  // the text is styled as that heading is.
  function matchesRealHeadingStyle(holder) {
    const cs = safeComputedStyle(holder);
    if (!cs) return false;
    return realHeadingStyles().some(
      (h) =>
        Math.abs(pxOf(h) - pxOf(cs)) < 0.5 &&
        styleWeightOf(h) === styleWeightOf(cs) &&
        familyOf(h) === familyOf(cs)
    );
  }

  // The next element after el holds plain text: not bold, and smaller than
  // el's text. A title over body text.
  function followedByBodyText(el, fontSizePx) {
    const next = nextShown(el);
    if (!next || !/\p{L}/u.test(String(dom.textContent(next) || ''))) return false;
    if (!isRendered(next)) return false;
    const cs = safeComputedStyle(next);
    return !!cs && !isBoldWeight(cs) && pxOf(cs) < fontSizePx;
  }

  // Sentence punctuation at the end reads as a sentence, not a title: past
  // closing quotes and brackets ("Stay home."), and in other scripts (Arabic
  // and Urdu, Devanagari, Armenian, Ethiopic, CJK full-width).
  const SENTENCE_END = /[.!?:;…。！？：؟۔।॥։።．｡]$/u;
  const CLOSERS = /[\s"'’”»›」』)\]）】〕〉》]+$/u;
  const endsAsSentenceOf = (text) => SENTENCE_END.test(String(text).replace(CLOSERS, ''));

  function styleLean(el, pieces, fontSizePx, isParagraph) {
    const shown = shownTextOf(pieces);
    const endsAsSentence = endsAsSentenceOf(shown);
    const matches = matchesRealHeadingStyle(pieces[0].holder);
    const followed = followedByBodyText(el, fontSizePx);
    const signals = [
      { signal: 'font-size-px', value: fontSizePx },
      { signal: 'matches-real-heading-style', value: matches },
      { signal: 'followed-by-body-text', value: followed },
      { signal: 'ends-with-sentence-punctuation', value: endsAsSentence }
    ];
    // A <div> is more often a label, a badge or a price than a <p> is, so it
    // needs both signs.
    const leans = !endsAsSentence && (isParagraph ? matches || followed : matches && followed);
    if (!leans) return null;
    return {
      toward: 'fail',
      why: matches
        ? "The text has a real heading's font size, weight and family on this page, and it doesn't end as a sentence does."
        : "The text is followed by smaller, plain body text, and it doesn't end as a sentence does, as a section title is.",
      signals,
      caution:
        'A lead-in sentence or a pull quote can also come before body text, and a design system may reuse heading styles for other text.',
      i18n: {
        whyKey: matches ? 'pAsHeading_lean_why_headingStyle' : 'pAsHeading_lean_why_bodyFollows',
        cautionKey: 'pAsHeading_lean_caution_style'
      }
    };
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('p, div')
    : helpers.queryAll('p, div');

  const occurrences = [];
  // The single-link candidates, judged together once all are found: a card
  // grid repeats them.
  const linkCandidates = [];

  // One <p> or <div>: a heading-like occurrence for it, or nothing.
  function judgeBlock(el) {
    if (!isCandidate(el)) return;

    const pieces = headingLikePieces(el);
    // Not heading-like, or nothing a sighted reader sees (screen-reader-only text).
    if (!pieces || !pieces.length) return;
    if (shownTextOf(pieces).length > MAX_HEADING_LIKE_CHARS) return;
    // Text with no letter or digit (a star rating, a scene break "* * *",
    // an emoji) titles nothing.
    if (!/[\p{L}\p{N}]/u.test(shownTextOf(pieces))) return;

    const fontSizePx = minFontSize(pieces);
    // Two kinds a reader may set aside as a group: text that is only a
    // number (a year or an issue number can still title a section), and
    // text that is all one link (a card title often is a heading).
    const shown = shownTextOf(pieces);
    const kindCode = isNumberOnly(shown)
      ? 'HEADING_LIKE_NUMBER'
      : soleLinkOf(pieces, el)
        ? 'HEADING_LIKE_LINK'
        : '';

    // A control's own label is not a heading; text beside the control is.
    if (pieces.every((piece) => isInsideControl(piece.holder, el))) return;

    const isParagraph = (dom.tagName(el) || '').toLowerCase() === 'p';

    // Bold body text: only a paragraph with both signs of a title. Large
    // text is judged as before: every piece bold outright and 18px or more.
    const large = pieces.every((piece) => isLargeTitle(piece));
    if (!large) {
      // Body size only: large text not bold enough to be a title is not
      // asked about as bold body text either.
      if (fontSizePx >= MIN_FONT_SIZE_PX) return;
      if (!isParagraph || kindCode || endsAsSentenceOf(shown)) return;
      const titleWeight = Math.min(...pieces.map((piece) => piece.weight));
      if (!hasPlainText(nextShown(el), titleWeight)) return;
      // The last of a run of bold lines (an address, a list of names): the
      // line before it is bold too, and it is no title over the text after.
      const prev = prevShown(el);
      if (
        prev &&
        String(dom.localName(prev) || '').toLowerCase() === 'p' &&
        /\p{L}/u.test(String(dom.textContent(prev) || '')) &&
        trim(dom.textContent(prev)).length <= MAX_HEADING_LIKE_CHARS &&
        !hasPlainText(prev, titleWeight) &&
        !endsAsSentenceOf(trim(dom.textContent(prev)))
      ) {
        return;
      }
      const occurrence = helpers.reportOccurrence(el, {
        summary:
          'This short paragraph is entirely bold and comes before plain text, as a heading does.',
        hint: 'If this text introduces the text after it, make it a real heading (<h1>-<h6> or role="heading") instead of a bold paragraph.',
        i18n: {
          summaryKey: 'pAsHeading_summary_cantTell_bodySize',
          hintKey: 'pAsHeading_hint_cantTell_bodySize',
          params: { fontSizePx: String(fontSizePx) }
        },
        data: { details: { reasonCode: 'BOLD_SHORT_PARAGRAPH', fontSizePx } }
      });
      occurrences.push(occurrence);
      return;
    }
    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet
      ? helpers.getOuterHtmlSnippet(el)
      : dom.outerHTML(el) || '';

    const baseOccurrence = isParagraph
      ? {
          selector: stableSelector,
          html,
          summary: 'This paragraph is entirely bold and rendered at a heading-like size.',
          hint: 'If this text introduces a new section, use a real heading element (<h1>-<h6> or role="heading") instead of styling a paragraph to look like one.',
          i18n: {
            summaryKey: 'pAsHeading_summary_cantTell',
            hintKey: 'pAsHeading_hint_cantTell',
            params: { fontSizePx: String(fontSizePx) }
          },
          data: {
            details: { reasonCode: kindCode || 'BOLD_LARGE_PARAGRAPH', fontSizePx }
          }
        }
      : {
          selector: stableSelector,
          html,
          summary: 'This block of text is entirely bold and rendered at a heading-like size.',
          hint: 'If this text introduces a new section, use a real heading element (<h1>-<h6> or role="heading") instead of styling a <div> to look like one.',
          i18n: {
            summaryKey: 'pAsHeading_summary_cantTell_div',
            hintKey: 'pAsHeading_hint_cantTell_div',
            params: { fontSizePx: String(fontSizePx) }
          },
          data: {
            details: { reasonCode: kindCode || 'BOLD_LARGE_DIV', fontSizePx }
          }
        };

    if (!kindCode) {
      // A lean is advice: a failure reading it costs the lean, not the finding.
      try {
        const lean = styleLean(el, pieces, fontSizePx, isParagraph);
        if (lean) baseOccurrence.lean = lean;
      } catch {}
    }

    const occurrence =
      helpers && typeof helpers.reportOccurrence === 'function'
        ? helpers.reportOccurrence(el, baseOccurrence)
        : baseOccurrence;
    occurrences.push(occurrence);
    if (kindCode === 'HEADING_LIKE_LINK') linkCandidates.push({ el, occurrence, fontSizePx });
  }

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    try {
      judgeBlock(el);
    } catch {
      // A block whose style can't be read (jsdom runs out of stack reading
      // the computed style of an element a few thousand levels deep) is not
      // judged to look like a heading; the other blocks still are.
    }
  }

  // A bold link followed by a teaser in its own container, where sibling
  // containers of the same shape each hold one too and no real heading:
  // the card title and teaser of a grid, a title shown only by style.
  // A link alone in its container (a call to action) gets no lean.
  const shapeOf = (n) => String(dom.localName(n) || '') + '.' + trim(dom.getAttribute(n, 'class'));
  const candidateEls = new Set(linkCandidates.map((c) => c.el));
  const hasRealHeading = (n) => !!dom.querySelector(n, 'h1, h2, h3, h4, h5, h6');
  try {
    for (const c of linkCandidates) {
      const card = dom.parentElement(c.el);
      if (!card || !followedByBodyText(c.el, c.fontSizePx) || hasRealHeading(card)) continue;
      const grid = dom.parentElement(card);
      if (!grid) continue;
      let repeats = 0;
      for (const sib of [...(dom.children(grid) || [])]) {
        if (sib === card || shapeOf(sib) !== shapeOf(card) || hasRealHeading(sib)) continue;
        if ([...(dom.children(sib) || [])].some((k) => candidateEls.has(k))) repeats += 1;
      }
      if (!repeats) continue;
      c.occurrence.lean = {
        toward: 'fail',
        why: 'The link is followed by a description in its container, and sibling containers of the same shape repeat that title and description with no real heading, as a grid of cards does.',
        signals: [
          { signal: 'followed-by-body-text', value: true },
          { signal: 'repeated-card-structure', value: repeats + 1 }
        ],
        caution:
          'A bold link is often a call to action; whether each card is a section of its own is for a person to decide.',
        i18n: {
          whyKey: 'pAsHeading_lean_why_cardTitle',
          cautionKey: 'pAsHeading_lean_caution_cardTitle'
        }
      };
    }
  } catch {
    // A lean is advice: a failure reading it costs the lean, not the finding.
  }

  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'minor',
      occurrences
    };
  }

  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
