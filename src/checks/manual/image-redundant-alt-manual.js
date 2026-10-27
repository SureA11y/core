/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check image-redundant-alt
 * @atomic true
 * @summary An image's alt text must not duplicate adjacent visible text
 * @standard Best Practices (no formal WCAG Success Criterion)
 * @applicability
 *   Applies to <img> elements with non-empty alt text whose immediate
 *   parent element also has other visible text content (i.e. text nodes
 *   besides the image itself, commonly an <a> or <button> wrapping both
 *   an icon image and a text label).
 *   Finding nothing to ask about, it reports notApplicable, not pass: it
 *   applies only to what its check flags, and finding nothing there
 *   doesn't show that all is well.
 * @expectation
 *   The image's alt text is not the same (case-insensitive, normalized)
 *   as the other visible text already in the same parent. When both are
 *   present, assistive technology announces the same words twice for a
 *   single control (e.g. an icon-plus-text link where the icon's alt
 *   duplicates the link text).
 * @reports
 *   - `alt`: the image's alt text, with spacing collapsed. It matches the
 *     text next to it.
 * @reason-codes
 *   - `IMAGE_ALT_REDUNDANT` (cantTell): an image's alt text repeats the
 *     visible text next to it in the same parent, so the same words may be
 *     read twice.
 *     It leans fail when the image has no role="none" or "presentation":
 *     the page states the repetition, and a best practice never fails.
 *     Basis: HTML img alt (best practice); H2 (best practice).
 * @implementation-notes
 * - Not WCAG-normative, authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent.
 * - Scoped to the immediate parent only on purpose (not the whole
 *   ancestor chain or arbitrary siblings), to keep the "redundant"
 *   judgment high-confidence and avoid false positives from unrelated
 *   text elsewhere on the page that coincidentally matches.
 */

const id = 'image-redundant-alt';

const meta = {
  title: 'Image alt text must not duplicate adjacent visible text',
  description:
    'Checks that an <img> alt text is not identical to other visible text already present in its immediate parent element.',
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
  coverage: {},
  // How a person checks each undecided finding: shown with it as
  // howToCheck (docs/OUTPUT_SCHEMA.md).
  review: {
    IMAGE_ALT_REDUNDANT: {
      steps: [
        'Find the image the report names and the text next to it in the same link, button or parent.',
        'With a screen reader, move to that link or button, or read its computed name in the Accessibility pane, and listen to whether the words are said twice.',
        'If the image is already hidden from assistive technology, note that nothing is repeated.'
      ],
      passWhen:
        'The words are read once: the image is hidden or has alt="", or its alt adds something the text does not say.',
      failWhen:
        "The image's alt repeats the text beside it, so the same words are read twice, a best-practice miss (H2)."
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  function normalizeWs(s) {
    return String(s || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // The text of a parent's children, its images left out, read once per
  // parent: an <img> holds no text, so it is the same for every image in
  // the parent, and reading it again for each one made a gallery of N
  // images cost N times its parent's text.
  const otherTextByParent = new Map();
  function getOwnTextExcludingImg(parent) {
    if (!otherTextByParent.has(parent)) otherTextByParent.set(parent, readOwnText(parent));
    return otherTextByParent.get(parent);
  }

  function readOwnText(parent) {
    const isAccTreeEligible =
      helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;

    let text = '';
    for (const child of dom.childNodes(parent) || []) {
      if (dom.nodeType(child) === 3) {
        text += ' ' + (dom.nodeValue(child) || '');
      } else if (dom.nodeType(child) === 1 && String(dom.localName(child)) !== 'img') {
        // An aria-hidden sibling is never actually announced to assistive
        // technology, so its text can't cause the "same words twice"
        // double-announcement this rule exists to catch -- counting it
        // anyway flags a redundancy that doesn't exist in what AT users
        // actually hear.
        if (isAccTreeEligible) {
          const elig = (() => {
            try {
              return isAccTreeEligible(child, ctx);
            } catch {
              return { eligible: true, reasons: [] };
            }
          })();
          if (elig && elig.eligible === false) continue;
        }
        text += ' ' + (dom.textContent(child) || '');
      }
    }
    return normalizeWs(text);
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('img[alt]')
    : helpers.queryAll('img[alt]');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    const alt = normalizeWs(dom.getAttribute(el, 'alt'));
    if (!alt) continue;
    // An image assistive technology never reads (aria-hidden on it or around
    // it) can't say anything twice.
    if (helpers && typeof helpers.isAccTreeEligible === 'function') {
      let elig;
      try {
        elig = helpers.isAccTreeEligible(el, ctx);
      } catch {
        elig = true;
      }
      if ((typeof elig === 'boolean' ? elig : !!(elig && elig.eligible)) === false) continue;
    }

    const parent = dom.parentElement(el);
    if (!parent) continue;

    const otherText = getOwnTextExcludingImg(parent);
    if (!otherText) continue;

    applicableCount += 1;

    if (otherText.toLowerCase() !== alt.toLowerCase()) continue;

    // The repetition is a fact the page states; this best practice never
    // fails, so it leans fail. A presentational role may take the image's
    // alt out of what is read, so that case gets no lean.
    const explicitRole = (() => {
      try {
        return (helpers.aria && helpers.aria.getExplicitRole(el)) || '';
      } catch {
        return '';
      }
    })();
    const presentational = explicitRole === 'none' || explicitRole === 'presentation';
    occurrences.push(
      helpers.reportOccurrence(el, {
        ...(presentational
          ? {}
          : {
              lean: {
                toward: 'fail',
                why: "The image's alt text is the same as the text beside it, so the words are read twice.",
                signals: [{ signal: 'alt-equals-adjacent-text', value: true }],
                i18n: { whyKey: 'imageRedundantAlt_lean_why' }
              }
            }),
        summary: "This image's alt text duplicates other visible text right next to it.",
        hint: 'If the image adds nothing beyond that text, use alt=""; otherwise rewrite the alt text so it doesn\'t repeat it.',
        i18n: {
          summaryKey: 'imageRedundantAlt_summary_cantTell',
          hintKey: 'imageRedundantAlt_hint_cantTell',
          params: { alt }
        },
        data: {
          details: { reasonCode: 'IMAGE_ALT_REDUNDANT', alt }
        }
      })
    );
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
