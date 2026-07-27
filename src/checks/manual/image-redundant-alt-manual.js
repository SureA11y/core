'use strict';

/**
 * @check image-redundant-alt
 * @atomic true
 * @summary An image's alt text must not duplicate adjacent visible text
 * @standard Best Practices (a widely-used reference engine's classification; no formal WCAG Success Criterion — see ROADMAP.md Tier 1b)
 * @applicability
 *   Applies to <img> elements with non-empty alt text whose immediate
 *   parent element also has other visible text content (i.e. text nodes
 *   besides the image itself — commonly an <a> or <button> wrapping both
 *   an icon image and a text label).
 * @expectation
 *   The image's alt text is not the same (case-insensitive, normalized)
 *   as the other visible text already in the same parent. When both are
 *   present, assistive technology announces the same words twice for a
 *   single control (e.g. an icon-plus-text link where the icon's alt
 *   duplicates the link text).
 * @implementation-notes
 * - Not WCAG-normative — authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent.
 * - Deliberately scoped to the immediate parent only (not the whole
 *   ancestor chain or arbitrary siblings), to keep the "redundant"
 *   judgment high-confidence and avoid false positives from unrelated
 *   text elsewhere on the page that coincidentally matches.
 */

const id = 'image-redundant-alt';

const meta = {
  title: 'Image alt text must not duplicate adjacent visible text',
  description: 'Checks that an <img> alt text is not identical to other visible text already present in its immediate parent element.',
  i18n: {
    titleKey: 'imageRedundantAlt_title',
    descriptionKey: 'imageRedundantAlt_description'
  },
  helpUrl: null,
  tags: ['best-practice', 'images', 'nontext', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  function normalizeWs(s) {
    return String(s || '').replace(/\s+/g, ' ').trim();
  }

  function getOwnTextExcludingImg(parent, imgEl) {
    let text = '';
    for (const child of parent.childNodes || []) {
      if (child === imgEl) continue;
      if (child.nodeType === 3) {
        text += ' ' + (child.nodeValue || '');
      } else if (child.nodeType === 1 && child !== imgEl) {
        text += ' ' + (child.textContent || '');
      }
    }
    return normalizeWs(text);
  }

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('img[alt]', safeRoot) : helpers.queryAll('img[alt]', safeRoot);

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;
    const alt = normalizeWs(el.getAttribute('alt'));
    if (!alt) continue;

    const parent = el.parentElement;
    if (!parent) continue;

    const otherText = getOwnTextExcludingImg(parent, el);
    if (!otherText) continue;

    applicableCount += 1;

    if (otherText.toLowerCase() !== alt.toLowerCase()) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    occurrences.push({
      selector: stableSelector,
      html,
      summary: 'This image\'s alt text duplicates other visible text right next to it.',
      hint: 'Make the alt text empty (alt="") if the image is purely decorative alongside the text, or remove the redundant duplication.',
      i18n: {
        summaryKey: 'imageRedundantAlt_summary_cantTell',
        hintKey: 'imageRedundantAlt_hint_cantTell',
        params: { alt }
      },
      data: {
        details: { reasonCode: 'IMAGE_ALT_REDUNDANT', alt }
      }
    });
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
