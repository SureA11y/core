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
 *   `<strong>`/`<b>` or a styled `<span>`) and rendered at >=18px.
 *   Visible text is the text that is rendered (not display:none, [hidden]
 *   or visibility:hidden) and not screen-reader-only. Text that is all
 *   inside controls (a widget's or a <label>'s own text) is left out.
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
 *   - `fontSizePx`: the computed font size of the text in CSS pixels, the
 *     smallest one when the pieces differ, against the 18px threshold.
 * @implementation-notes
 * - This is a stylistic heuristic (bold + large + short), not a
 *   deterministic structural check: a short bold sentence is not
 *   necessarily wrong as a `<p>`. Authored as `type: 'manual'`
 *   (cantTell-capped, never fail) to avoid false-flagging legitimate
 *   emphasis, matching this repo's other heuristic-heavy Tier 2/3
 *   rules (e.g. `scrollable-region-focusable`).
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
 */

const id = 'p-as-heading';

const meta = {
  title: 'Text styled to look like a heading should probably be a real heading',
  description:
    'Flags short <p> and <div> elements whose text is all bold and rendered at >=18px, for manual review of whether a real heading element should be used instead.',
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

  // A holder's font size when its text is bold and at least
  // MIN_FONT_SIZE_PX, else 0.
  function headingSizeOf(holder) {
    const cs = safeComputedStyle(holder);
    if (!isBoldWeight(cs)) return 0;
    const px = Number.parseFloat(cs.fontSize);
    return Number.isFinite(px) && px >= MIN_FONT_SIZE_PX ? px : 0;
  }

  // The text a sighted reader sees, when all of it is bold and at least
  // MIN_FONT_SIZE_PX; else null. Visibility is only worked out once some
  // text has that style, as it costs far more than reading the style.
  function headingLikePieces(el) {
    const isSeen = (holder) => isRendered(holder) && !isScreenReaderOnly(holder);
    const headingLike = [];
    const others = [];
    const walker = dom.createTreeWalker(dom.ownerDocument(el), el, 4);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const raw = String(dom.nodeValue(node) || '');
      const holder = dom.parentElement(node);
      if (!holder || !trim(raw)) continue;
      const fontSizePx = headingSizeOf(holder);
      if (fontSizePx) headingLike.push({ holder, raw, fontSizePx });
      else if (others[others.length - 1] !== holder) {
        others.push(holder);
        // A long run of plain text: one piece of it seen settles it early.
        if (others.length === 16 && isSeen(others[0])) return null;
      }
    }
    if (!headingLike.length) return null;
    if (others.some(isSeen)) return null;
    return headingLike.filter((piece) => isSeen(piece.holder));
  }

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

  // Digits with only spacing and punctuation around them: "2024", "12.",
  // "1/3", "#4".
  // Two plain tests rather than one pattern with a digit in the middle,
  // which backtracks on long text.
  const NUMBER_CHARS = /^[\s\d.,:;/#№°'’()\-–—]+$/;
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

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('p, div')
    : helpers.queryAll('p, div');

  const occurrences = [];

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    if (!isCandidate(el)) continue;

    const pieces = headingLikePieces(el);
    // Not heading-like, or nothing a sighted reader sees (screen-reader-only text).
    if (!pieces || !pieces.length) continue;
    if (shownTextOf(pieces).length > MAX_HEADING_LIKE_CHARS) continue;

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
    if (pieces.every((piece) => isInsideControl(piece.holder, el))) continue;

    const isParagraph = (dom.tagName(el) || '').toLowerCase() === 'p';
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

    if (helpers && typeof helpers.reportOccurrence === 'function') {
      occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
    } else {
      occurrences.push(baseOccurrence);
    }
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
