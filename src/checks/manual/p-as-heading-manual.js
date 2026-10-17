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
 *   markup, with short (<=120 char), non-empty trimmed text in which every
 *   visible piece of text is bold (computed `font-weight` >= 700, however
 *   it got there: on the element itself, a `<strong>`/`<b>` or a styled
 *   `<span>`) and rendered at >=18px.
 *   Text that cannot be a heading is left out: text that is only a number
 *   ("42000", "N° 2026-441"), text that is all visually hidden, text that
 *   is all inside links, and text with a control inside it.
 * @expectation
 *   Text styled to visually read as a heading (bold, larger-than-body
 *   size, short) should be marked up with a real heading element
 *   (`<h1>`-`<h6>` or `role="heading"`) so its structural role is
 *   programmatically determinable, the same 1.3.1 concern as any other
 *   "structure conveyed through presentation only" issue.
 * @reports
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
 * - Visually hidden text (`helpers.isVisuallyHidden` on the element holding
 *   it or an ancestor up to the candidate) is not what a sighted reader
 *   sees as a heading, so it is left out of the weight and size test, and
 *   a candidate whose text is all visually hidden (a social icon's
 *   screen-reader label) is not asked about.
 * - A bare number is a counter or a reference, not a section title:
 *   digits with only punctuation, symbols and spaces, or "N°", "No." or
 *   "#" followed by one token holding a digit.
 * - Text that is all inside links (role link, native or explicit) is a
 *   link, as a "See all news" call to action is; text around a control (a
 *   widget role such as button or checkbox, or any other tabbable element
 *   but a link) belongs to that control. A card title made of one link is
 *   left out too: the trade-off is accepted, since a link has a role of
 *   its own and most such paragraphs are calls to action.
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

  // Each non-blank text node, with the element that holds it.
  function textPieces(el) {
    const pieces = [];
    const doc = dom.ownerDocument(el);
    const walker = dom.createTreeWalker(doc, el, 4);
    let node = walker.nextNode();
    while (node) {
      const text = trim(dom.nodeValue(node));
      if (text && dom.parentElement(node)) pieces.push({ holder: dom.parentElement(node), text });
      node = walker.nextNode();
    }
    return pieces;
  }

  // Whether the holder, or any element between it and el, hides its box
  // from sight (helpers.isVisuallyHidden: the screen-reader-only patterns).
  function isPieceVisuallyHidden(holder, el) {
    if (typeof helpers.isVisuallyHidden !== 'function') return false;
    for (let cur = holder; cur; cur = dom.parentElement(cur)) {
      if (helpers.isVisuallyHidden(cur)) return true;
      if (cur === el) break;
    }
    return false;
  }

  // The pieces of text a sighted reader sees, or null when one of them is
  // not bold. Visually hidden pieces are left out, whatever their weight.
  function visibleBoldPieces(el) {
    const visible = [];
    for (const piece of textPieces(el)) {
      const cs = safeComputedStyle(piece.holder);
      const bold = isBoldWeight(cs) && Number.isFinite(Number.parseFloat(cs.fontSize));
      if (isPieceVisuallyHidden(piece.holder, el)) continue;
      if (!bold) return null;
      visible.push({ ...piece, fontSizePx: Number.parseFloat(cs.fontSize) });
    }
    return visible;
  }

  // Every visible piece of text is bold, and the smallest is the size
  // reported.
  function minFontSize(pieces) {
    let minPx = Infinity;
    for (const piece of pieces) minPx = Math.min(minPx, piece.fontSizePx);
    return Number.isFinite(minPx) ? minPx : 0;
  }

  // A count or a reference: digits, with only punctuation, symbols and
  // spaces around them ("42000", "12 %", "2026-441"), or a numbering sign
  // followed by one token holding a digit ("N° 2026-441", "N° 1_ODJ_2026").
  const NUMBERING_SIGN = /^(?:n\s*[°º]|no\.|#)\s*/iu;
  function isOnlyANumber(text) {
    const hasDigit = /\p{N}/u.test(text);
    if (!hasDigit) return false;
    if (/^[\p{N}\p{P}\p{S}\p{Z}\s]+$/u.test(text)) return true;
    if (!NUMBERING_SIGN.test(text)) return false;
    const rest = text.replace(NUMBERING_SIGN, '');
    return /\p{N}/u.test(rest) && !/\s/u.test(rest);
  }

  // Widget roles a control inside the text has; link is handled apart.
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

  // A control inside the element: a widget role (native or explicit), or
  // anything else in the tab order that is not a link (a contenteditable,
  // a <span tabindex="0">).
  function hasInteractiveDescendant(el) {
    const walker = dom.createTreeWalker(dom.ownerDocument(el), el, 1);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const role = roleOf(node);
      if (INTERACTIVE_ROLES.has(role)) return true;
      if (role === 'link') continue;
      if (typeof helpers.getFocusableInfo === 'function') {
        const f = helpers.getFocusableInfo(node, ctx);
        if (f && f.tabbable) return true;
      }
    }
    return false;
  }

  function isInsideLink(holder, el) {
    for (let cur = holder; cur; cur = dom.parentElement(cur)) {
      if (roleOf(cur) === 'link') return true;
      if (cur === el) break;
    }
    return false;
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
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    if (!isCandidate(el)) continue;

    const text = trim(dom.textContent(el) || '');
    if (!text || text.length > MAX_HEADING_LIKE_CHARS) continue;

    applicableCount += 1;

    const pieces = visibleBoldPieces(el);
    // Nothing a sighted reader sees: the text is for screen readers only.
    if (!pieces || !pieces.length) continue;
    const fontSizePx = minFontSize(pieces);
    if (fontSizePx < MIN_FONT_SIZE_PX) continue;

    // Text that cannot be a heading: a bare number, a link standing on its
    // own (the link is the text's role), or text around a control.
    if (isOnlyANumber(pieces.map((piece) => piece.text).join(' '))) continue;
    if (pieces.every((piece) => isInsideLink(piece.holder, el))) continue;
    if (hasInteractiveDescendant(el)) continue;

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
            details: { reasonCode: 'BOLD_LARGE_PARAGRAPH', fontSizePx }
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
            details: { reasonCode: 'BOLD_LARGE_DIV', fontSizePx }
          }
        };

    if (helpers && typeof helpers.reportOccurrence === 'function') {
      occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
    } else {
      occurrences.push(baseOccurrence);
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
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
