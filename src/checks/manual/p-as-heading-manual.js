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
 *   piece of text is bold (computed `font-weight` >= 700, however it got
 *   there: on the element itself, a `<strong>`/`<b>` or a styled `<span>`)
 *   and rendered at >=18px.
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
 *   about. A `<div>` with a role, and text inside a heading, button,
 *   label, legend, caption, table header or `<summary>`, are left out:
 *   that text already has a role of its own.
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

  // Elements whose text already has a role of its own.
  const OWN_ROLE_ANCESTORS =
    'h1, h2, h3, h4, h5, h6, [role="heading"], button, [role="button"], label, legend, caption, th, [role="columnheader"], [role="rowheader"], summary';

  // Anything but text and inline markup makes a <div> a container, not a
  // passage of text.
  const NOT_INLINE =
    'address, article, aside, blockquote, details, dialog, div, dl, fieldset, figure, figcaption, footer, form, h1, h2, h3, h4, h5, h6, header, hgroup, hr, li, main, nav, ol, p, pre, section, table, ul, img, svg, picture, video, audio, canvas, iframe, object, embed, input, select, textarea, button';

  function textPieces(el) {
    const pieces = [];
    const doc = dom.ownerDocument(el);
    const walker = dom.createTreeWalker(doc, el, 4);
    let node = walker.nextNode();
    while (node) {
      if (trim(dom.nodeValue(node)) && dom.parentElement(node))
        pieces.push(dom.parentElement(node));
      node = walker.nextNode();
    }
    return pieces;
  }

  // Every piece of text is bold, and the smallest is the size reported.
  function boldSize(el) {
    let minPx = Infinity;
    for (const holder of textPieces(el)) {
      const cs = safeComputedStyle(holder);
      if (!isBoldWeight(cs)) return 0;
      const px = Number.parseFloat(cs.fontSize);
      if (!Number.isFinite(px)) return 0;
      minPx = Math.min(minPx, px);
    }
    return Number.isFinite(minPx) ? minPx : 0;
  }

  function isCandidate(el) {
    const tag = (dom.tagName(el) || '').toLowerCase();
    if (dom.get(el, 'closest') && dom.closest(el, OWN_ROLE_ANCESTORS)) return false;
    if (tag === 'p') return true;
    if (tag !== 'div') return false;
    if (trim(dom.getAttribute(el, 'role'))) return false;
    return !dom.querySelector(el, NOT_INLINE);
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

    const fontSizePx = boldSize(el);
    if (fontSizePx < MIN_FONT_SIZE_PX) continue;

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
