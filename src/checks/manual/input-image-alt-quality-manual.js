/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check input-image-alt-quality
 * @atomic true
 * @summary Manual review: text alternative appropriateness (WCAG 1.1.1)
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @type manual
 * @applicability
 *   Applies to <input type="image"> elements that get a non-empty text
 *   alternative from any source: aria-labelledby (resolving to text),
 *   aria-label, alt or title. An element whose alt is present but empty is
 *   left to input-image-alt-decorative, which asks about that case. The
 *   element must be included in the accessibility tree, and
 *   role="presentation"/"none" takes it out of scope unless it is
 *   focusable, which restores its role.
 * @expectation
 *   Human review is required to confirm that the provided text alternative is
 *   accurate and appropriate. Each occurrence lists every source present
 *   (data.details.sources), so the reviewer checks each one.
 */

const id = 'input-image-alt-quality';

const meta = {
  title: '<input type="image"> text alternative must be appropriate (manual review)',
  description:
    'Flags <input type="image"> elements with a non-empty text alternative (alt, aria-label, aria-labelledby or title) for human review of appropriateness.',
  i18n: {
    titleKey: 'inputImage_altQuality_title',
    descriptionKey: 'inputImage_altQuality_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag111', 'forms', 'images', 'manual', 'atomic'],
  wcagSc: ['1.1.1'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.1.1',
      title: 'Non-text Content',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'minor',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {
    facetsBySc: {
      '1.1.1': ['text-alternative-quality']
    }
  }
};

function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const queryAllSmart =
    helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
  const queryAll =
    helpers && typeof helpers.queryAll === 'function'
      ? helpers.queryAll
      : (sel) => {
          try {
            return safeRoot && safeRoot.querySelectorAll
              ? Array.from(safeRoot.querySelectorAll(sel))
              : [];
          } catch {
            return [];
          }
        };

  const getEligibilityInfo =
    helpers && typeof helpers.getEligibilityInfo === 'function' ? helpers.getEligibilityInfo : null;

  const isAccTreeEligible =
    helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;

  const getFocusableInfo =
    helpers && typeof helpers.getFocusableInfo === 'function' ? helpers.getFocusableInfo : null;

  function isRolePresentationExcluded(el) {
    const role = (() => {
      try {
        return String(el.getAttribute('role') || '')
          .trim()
          .toLowerCase();
      } catch {
        return '';
      }
    })();
    if (role !== 'presentation' && role !== 'none') return false;

    // Exclude only when NOT focusable (mirrors img-alt-present policy)
    let focusable;
    if (getFocusableInfo) {
      const fi = (() => {
        try {
          return getFocusableInfo(el, ctx);
        } catch {
          return null;
        }
      })();
      focusable = !!(fi && fi.focusable);
    } else {
      const tabindex = el.getAttribute('tabindex');
      focusable =
        tabindex != null &&
        String(tabindex).trim() !== '' &&
        !Number.isNaN(Number(String(tabindex).trim()));
    }
    return !focusable;
  }

  const getAriaNameInfo =
    helpers && typeof helpers.getAriaNameInfo === 'function' ? helpers.getAriaNameInfo : null;

  // Every non-empty text-alternative source on the element, in accessible-name
  // order: aria-labelledby (when it resolves to text), aria-label, alt, title.
  // aria-labelledby wins over aria-label in the name, but a present aria-label
  // is still listed, since RGAA 1.3.3 asks about each attribute present.
  function collectTextAlternativeSources(el) {
    const attr = (name) => {
      try {
        const v = el.getAttribute(name);
        return v == null ? '' : String(v).trim();
      } catch {
        return '';
      }
    };
    const sources = [];
    let name = '';
    let aria = null;
    if (getAriaNameInfo) {
      try {
        aria = getAriaNameInfo(el, ctx);
      } catch {
        aria = null;
      }
    }
    if (aria && aria.present && aria.value) {
      name = String(aria.value).trim();
      sources.push(aria.mechanism);
      if (aria.mechanism === 'aria-labelledby' && attr('aria-label')) sources.push('aria-label');
    } else if (!getAriaNameInfo && attr('aria-label')) {
      name = attr('aria-label');
      sources.push('aria-label');
    }
    const altText = attr('alt');
    if (altText) {
      sources.push('alt');
      if (!name) name = altText;
    }
    const titleText = attr('title');
    if (titleText) {
      sources.push('title');
      if (!name) name = titleText;
    }
    return { sources, name, alt: altText };
  }

  const els = (() => {
    try {
      return Array.from(
        (queryAllSmart ? queryAllSmart('input[type="image"]') : queryAll('input[type="image"]')) ||
          []
      );
    } catch {
      return queryAll('input[type="image"]');
    }
  })();

  if (!els.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const el of els) {
    if (!el || !el.getAttribute) continue;

    if (isAccTreeEligible) {
      const elig = (() => {
        try {
          return isAccTreeEligible(el, ctx);
        } catch {
          return { eligible: true, reasons: [] };
        }
      })();
      if (elig && elig.eligible === false) continue;
    }

    if (isRolePresentationExcluded(el)) continue;

    // alt="" with another name is input-image-alt-decorative's question, so
    // it is left there rather than asked twice.
    let altRaw;
    try {
      altRaw = el.getAttribute('alt');
    } catch {
      altRaw = null;
    }
    if (altRaw != null && String(altRaw).trim() === '') continue;

    // Applies when any text-alternative source gives the control a non-empty
    // name; each present source is listed so the reviewer checks all of them.
    const alt = collectTextAlternativeSources(el);
    if (!alt.sources.length) continue;

    applicableCount += 1;

    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;
    const sourcesText = alt.sources.join(', ');

    const details = { name: alt.name, sources: alt.sources.slice() };
    if (alt.alt) details.alt = alt.alt;

    const baseOccurrence = {
      summary: `Review the text alternative of this <input type="image"> (${sourcesText}) for accuracy and appropriateness.`,
      hint: 'Ensure each listed text alternative describes the control’s action (e.g., “Search”, “Submit order”) in context.',
      i18n: {
        summaryKey: 'inputImage_altQuality_summary_cantTell',
        hintKey: 'inputImage_altQuality_hint_cantTell',
        params: { element: 'input[type=image]', sources: sourcesText }
      },
      data: {
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
        details
      }
    };

    if (helpers && typeof helpers.reportOccurrence === 'function') {
      occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
    } else {
      occurrences.push({ selector: '', html: '', ...baseOccurrence });
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  return { ruleId: rule.ruleId, outcome: 'cantTell', severity: 'minor', occurrences };
}

module.exports = { id, meta, runInPage };
