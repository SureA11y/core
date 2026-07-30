'use strict';

/**
 * @check p-as-heading
 * @atomic true
 * @summary A <p> styled to look like a heading should probably be a real heading
 * @standard WCAG 2.2
 * @sc 1.3.1
 * @applicability
 *   `<p>` elements with short (<=120 char), non-empty trimmed text
 *   content that is entirely bold (the `<p>`'s own computed
 *   `font-weight` >= 700, OR its entire text is wrapped in a single
 *   `<strong>`/`<b>` child) and rendered at >=18px.
 * @expectation
 *   Text styled to visually read as a heading (bold, larger-than-body
 *   size, short) should be marked up with a real heading element
 *   (`<h1>`-`<h6>` or `role="heading"`) so its structural role is
 *   programmatically determinable — the same 1.3.1 concern as any other
 *   "structure conveyed through presentation only" issue.
 * @implementation-notes
 * - This is a stylistic heuristic (bold + large + short), not a
 *   deterministic structural check — a short bold sentence is not
 *   necessarily wrong as a `<p>`. Authored as `type: 'manual'`
 *   (cantTell-capped, never fail) to avoid false-flagging legitimate
 *   emphasis, matching this repo's other heuristic-heavy Tier 2/3
 *   rules (e.g. `scrollable-region-focusable`).
 * - Uses an absolute 18px size threshold rather than comparing against
 *   surrounding text (unlike `link-in-text-block`) — deliberately
 *   simpler, since "looks like a heading" is closer to an absolute
 *   judgment than a relative-contrast one.
 */

const id = 'p-as-heading';

const meta = {
  title: 'A <p> styled to look like a heading should probably be a real heading',
  description: 'Flags short <p> elements whose entire text is bold and rendered at >=18px, for manual review of whether a real heading element should be used instead.',
  i18n: {
    titleKey: 'pAsHeading_title',
    descriptionKey: 'pAsHeading_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag131', 'structure', 'atomic', 'manual'],
  wcagSc: ['1.3.1'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '1.3.1', title: 'Info and Relationships', conformanceLevel: 'A' }
  ],
  defaultSeverity: 'minor',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'low',
  coverage: { facetsBySc: { '1.3.1': ['p-as-heading-evidence'] } }
};

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  const MAX_HEADING_LIKE_CHARS = 120;
  const MIN_FONT_SIZE_PX = 18;

  function trim(v) { return (v == null ? '' : String(v)).trim(); }

  function safeComputedStyle(el) {
    try {
      if (!el || el.nodeType !== 1) return null;
      if (helpers && typeof helpers.computedStyle === 'function') {
        const cs = helpers.computedStyle(el);
        if (cs) return cs;
      }
      const view = (el.ownerDocument && el.ownerDocument.defaultView) ? el.ownerDocument.defaultView : null;
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

  function isEntirelyBold(p, text) {
    const cs = safeComputedStyle(p);
    if (isBoldWeight(cs)) return true;

    // A single <strong>/<b> child that wraps the whole text also counts.
    const children = Array.from(p.children || []);
    const boldWrap = children.find((c) => {
      const tag = (c.tagName || '').toLowerCase();
      return tag === 'strong' || tag === 'b';
    });
    if (boldWrap && children.length === 1) {
      const wrapText = trim(boldWrap.textContent || '');
      if (wrapText && wrapText === text) return true;
    }
    return false;
  }

  function getFontSizePx(p) {
    const cs = safeComputedStyle(p);
    if (!cs) return 0;
    const px = Number.parseFloat(cs.fontSize);
    return Number.isFinite(px) ? px : 0;
  }

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('p') : helpers.queryAll('p');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;

    const text = trim(el.textContent || '');
    if (!text || text.length > MAX_HEADING_LIKE_CHARS) continue;

    applicableCount += 1;

    if (!isEntirelyBold(el, text)) continue;

    const fontSizePx = getFontSizePx(el);
    if (fontSizePx < MIN_FONT_SIZE_PX) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    const baseOccurrence = {
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
    return { ruleId: rule.ruleId, outcome: 'cantTell', severity: rule.defaultSeverity || 'minor', occurrences };
  }

  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
