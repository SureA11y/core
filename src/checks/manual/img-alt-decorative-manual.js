'use strict';

/**
 * @check img-alt-decorative
 * @atomic true
 * @summary Manual review: text alternative appropriateness (WCAG 1.1.1)
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @type manual
 * @expectation
 *   Human review is required to confirm that the provided text alternative is accurate and appropriate.
 */

const id = 'img-alt-decorative';

const meta = {
  title: '<img> with alt="" must be decorative (manual review)',
  description:
    'Flags <img> elements with empty alt for human review that they are purely decorative.',
  i18n: {
    titleKey: 'img_altDecorative_title',
    descriptionKey: 'img_altDecorative_description'
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

  const els = (() => {
    // Only likely candidates:
    // - alt="" (exact)
    // - alt that starts/ends with space (to catch whitespace-only like "   ")
    const sel = 'img[alt=""], img[alt^=" "], img[alt$=" "]';
    try {
      return Array.from((queryAllSmart ? queryAllSmart(sel) : queryAll(sel)) || []);
    } catch {
      return queryAll(sel);
    }
  })();
  const uniqueEls = [];
  const seen = new Set();
  for (const el of els) {
    if (!seen.has(el)) {
      seen.add(el);
      uniqueEls.push(el);
    }
  }

  if (!els.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const el of uniqueEls) {
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

    // Rule-specific applicability (only elements that already have a text alternative mechanism)
    const rawAlt = el.getAttribute('alt');
    if (rawAlt == null) continue;
    if (String(rawAlt).trim() !== '') continue;

    applicableCount += 1;

    const baseOccurrence = {
      summary: 'Review whether <img> is decorative (alt="").',
      hint: 'Confirm the image is purely decorative. If it conveys information or function, provide meaningful alt text.',
      i18n: {
        summaryKey: 'img_altDecorative_summary_cantTell',
        hintKey: 'img_altDecorative_hint_cantTell',
        params: { element: 'img' }
      },
      data: {
        visibilityFilter: { targetSet: 'acc', accEligible: null, reasons: [] },
        details: null
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
