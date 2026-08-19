/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check img-alt-quality
 * @atomic true
 * @summary Manual review: text alternative appropriateness (WCAG 1.1.1)
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @type manual
 * @applicability
 *   Applies to <img> elements whose alt attribute is present and non-empty.
 *   The element must be included in the accessibility tree, and
 *   role="presentation"/"none" takes it out of scope unless it is focusable,
 *   which restores its role. An <img> with no alt at all is
 *   img-alt-present's failure, and one with alt="" is img-alt-decorative's
 *   review.
 * @expectation
 *   Human review is required to confirm that the provided text alternative is accurate and appropriate.
 */

const id = 'img-alt-quality';

const meta = {
  title: '<img> alt text must be appropriate (manual review)',
  description: 'Flags <img> elements with non-empty alt text for human review of appropriateness.',
  i18n: {
    titleKey: 'img_altQuality_title',
    descriptionKey: 'img_altQuality_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag111', 'nontext', 'images', 'manual', 'atomic'],
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

  // Cap occurrences to keep manual “quality” checks fast on large pages.
  // Deterministic: we keep DOM order, just stop collecting after N.
  const MAX_OCCURRENCES = 50;

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

  const selector = 'img[alt]:not([alt=""])';
  const els = (() => {
    try {
      return Array.from((queryAllSmart ? queryAllSmart(selector) : queryAll(selector)) || []);
    } catch {
      return queryAll(selector);
    }
  })();

  if (!els.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'notApplicable',
      severity: 'minor',
      occurrences: [],
      data: {
        details: {
          applicableCount: 0,
          reportedCount: 0,
          maxOccurrences: MAX_OCCURRENCES,
          truncated: false
        }
      }
    };
  }

  const occurrences = [];
  let applicableCount = 0; // total applicable elements
  let collectedCount = 0; // how many occurrences we actually reported

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

    // Rule-specific applicability: non-empty alt
    const alt = (() => {
      try {
        return String(el.getAttribute('alt') || '').trim();
      } catch {
        return '';
      }
    })();
    if (!alt) continue;

    applicableCount += 1;

    // IMPORTANT: stop doing expensive occurrence building after we hit the cap
    if (collectedCount >= MAX_OCCURRENCES) continue;

    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;
    const baseOccurrence = {
      summary: 'Review alt text on <img> for accuracy and appropriateness.',
      hint: 'Ensure the alt text conveys the image’s purpose/information in context (not redundant, not filename-like).',
      i18n: {
        summaryKey: 'img_altQuality_summary_cantTell',
        hintKey: 'img_altQuality_hint_cantTell',
        params: { element: 'img' }
      },
      data: {
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
        details: null
      }
    };

    if (helpers && typeof helpers.reportOccurrence === 'function') {
      occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
    } else {
      occurrences.push({ selector: '', html: '', ...baseOccurrence });
    }

    collectedCount += 1;
  }

  if (applicableCount === 0) {
    return {
      ruleId: rule.ruleId,
      outcome: 'notApplicable',
      severity: 'minor',
      occurrences: [],
      data: {
        details: {
          applicableCount: 0,
          reportedCount: 0,
          maxOccurrences: MAX_OCCURRENCES,
          truncated: false
        }
      }
    };
  }

  const truncated = applicableCount > collectedCount;

  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: 'minor',
    occurrences,
    data: {
      details: {
        applicableCount,
        reportedCount: collectedCount,
        maxOccurrences: MAX_OCCURRENCES,
        truncated
      }
    }
  };
}

module.exports = { id, meta, runInPage };
