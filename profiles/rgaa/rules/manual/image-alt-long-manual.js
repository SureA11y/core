/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check image-alt-long
 * @atomic true
 * @summary An image's text alternative should be short
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to images that carry a text alternative: <img>, <area>,
 *   <input type="image">, <svg>, <canvas>, <object>, <embed>, and any
 *   element whose role (first token) is img. The alternative can come from
 *   alt (on <img>, <area> and <input type="image">), aria-label,
 *   aria-labelledby (the text it resolves to), title, or an <svg>'s own
 *   <title> child, the sources RGAA's image tests list. A page with none is
 *   notApplicable. When every alternative is 80 characters or fewer, the
 *   rule passes.
 * @expectation
 *   A text alternative longer than 80 characters (spaces collapsed), from
 *   any of those sources, is flagged for a person to decide whether it is
 *   short and concise, as RGAA 1.3.9 asks, or one of the particular cases it
 *   allows. RGAA's test gives no number: 80 characters is a threshold for
 *   asking, not a limit. The occurrence lists each source over the
 *   threshold. Fallback content of <canvas> and <object> is not measured.
 * @implementation-notes
 * - Manual (cantTell): a long alternative can be right, and a detailed
 *   description belongs in a separate long description (RGAA 1.8).
 * - Opt-in (tag `rgaa`): WCAG sets no length for a text alternative.
 */

const id = 'image-alt-long';

const meta = {
  title: 'Text alternatives of images are short',
  description:
    'Flags an image whose text alternative is longer than 80 characters, for a person to decide whether it is short and concise enough.',
  i18n: {
    titleKey: 'imageAltLong_title',
    descriptionKey: 'imageAltLong_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'images', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const MAX_LENGTH = 80;
  const SELECTOR = 'img, area, input[type="image" i], svg, canvas, object, embed, [role]';
  const IMAGE_TAGS = ['img', 'area', 'input', 'svg', 'canvas', 'object', 'embed'];
  const ALT_TAGS = ['img', 'area', 'input'];

  const getAriaNameInfo =
    helpers && typeof helpers.getAriaNameInfo === 'function' ? helpers.getAriaNameInfo : null;

  function collapse(v) {
    return String(v == null ? '' : v)
      .replace(/\s+/g, ' ')
      .trim();
  }

  function firstRole(el) {
    return collapse(dom.getAttribute(el, 'role')).toLowerCase().split(' ')[0];
  }

  // Each non-empty text-alternative source, with its collapsed text.
  function alternatives(el, tag) {
    const out = [];
    const add = (source, value) => {
      const text = collapse(value);
      if (text) out.push({ source, text });
    };
    if (ALT_TAGS.includes(tag)) add('alt', dom.getAttribute(el, 'alt'));
    add('aria-label', dom.getAttribute(el, 'aria-label'));
    if (collapse(dom.getAttribute(el, 'aria-labelledby')) && getAriaNameInfo) {
      try {
        const aria = getAriaNameInfo(el, ctx);
        if (aria && aria.present && aria.mechanism === 'aria-labelledby') {
          add('aria-labelledby', aria.value);
        }
      } catch {}
    }
    add('title', dom.getAttribute(el, 'title'));
    if (tag === 'svg') {
      const titleChild = Array.from(dom.querySelectorAll(el, ':scope > *')).find(
        (c) => String(dom.localName(c) || dom.tagName(c)).toLowerCase() === 'title'
      );
      if (titleChild) add('<title>', dom.textContent(titleChild));
    }
    return out;
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(SELECTOR)
    : helpers.queryAll(SELECTOR);

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    const tag = String(dom.localName(el) || dom.tagName(el)).toLowerCase();
    const isImage =
      tag === 'input'
        ? collapse(dom.getAttribute(el, 'type')).toLowerCase() === 'image'
        : IMAGE_TAGS.includes(tag) || firstRole(el) === 'img';
    if (!isImage) continue;
    const found = alternatives(el, tag);
    if (!found.length) continue;
    applicableCount += 1;
    const long = found.filter((a) => a.text.length > MAX_LENGTH);
    if (!long.length) continue;
    const text = long.reduce((a, b) => (b.text.length > a.text.length ? b : a)).text;

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: `This image's text alternative is ${text.length} characters long.`,
        hint: 'Check that the alternative is short and concise for what the image conveys in context. A longer one can be right in the particular cases RGAA 1.3.9 allows. Put a detailed description in a long description next to the image or linked from it (RGAA 1.8).',
        i18n: {
          summaryKey: 'imageAltLong_summary_cantTell',
          hintKey: 'imageAltLong_hint_cantTell',
          params: { length: String(text.length) }
        },
        data: {
          details: {
            reasonCode: 'longAlternative',
            length: text.length,
            maxLength: MAX_LENGTH,
            sources: long.map((a) => ({ source: a.source, length: a.text.length }))
          },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'minor',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
