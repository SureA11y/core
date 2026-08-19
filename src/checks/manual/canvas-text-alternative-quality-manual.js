/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check canvas-text-alternative-quality
 * @atomic true
 * @summary Manual review: text alternative appropriateness (WCAG 1.1.1)
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @type manual
 * @applicability
 *   Applies to <canvas> elements that already carry a text alternative:
 *   fallback content inside the element, an ARIA name, or a title. A
 *   <canvas> with none of those has no alternative whose quality could be
 *   judged — it is canvas-text-alternative-present's failure. The element
 *   must be included in the accessibility tree, and
 *   role="presentation"/"none" takes it out of scope unless it is focusable,
 *   which restores its role.
 * @expectation
 *   Human review is required to confirm that the provided text alternative is accurate and appropriate.
 */

const id = 'canvas-text-alternative-quality';

const meta = {
  title: '<canvas> text alternative must be appropriate (manual review)',
  description:
    'Flags <canvas> elements with a detected text alternative for human review of equivalence and appropriateness.',
  i18n: {
    titleKey: 'canvas_textAltQuality_title',
    descriptionKey: 'canvas_textAltQuality_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag111', 'nontext', 'canvas', 'manual', 'atomic'],
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

  const __accEligCache = new WeakMap();
  function accEligibleCached(node) {
    if (!isAccTreeEligible) return { eligible: true, reasons: [] };
    if (!node || typeof node !== 'object') return { eligible: true, reasons: [] };
    const c = __accEligCache.get(node);
    if (c) return c;
    let r;
    try {
      r = isAccTreeEligible(node, ctx);
    } catch {
      r = { eligible: true, reasons: [] };
    }
    r = r && typeof r === 'object' ? r : { eligible: !!r, reasons: [] };
    __accEligCache.set(node, r);
    return r;
  }

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
      let tabindex;
      try {
        tabindex = el.getAttribute('tabindex');
      } catch {
        tabindex = null;
      }
      const t = tabindex == null ? '' : String(tabindex).trim();
      focusable = t !== '' && !Number.isNaN(Number(t));
    }
    return !focusable;
  }

  const els = (() => {
    try {
      return Array.from((queryAllSmart ? queryAllSmart('canvas') : queryAll('canvas')) || []);
    } catch {
      return queryAll('canvas');
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
      const elig = accEligibleCached(el);
      if (elig && elig.eligible === false) continue;
    }

    if (isRolePresentationExcluded(el)) continue;

    const getTextAlternativeInfo =
      helpers && typeof helpers.getTextAlternativeInfo === 'function'
        ? helpers.getTextAlternativeInfo
        : null;

    const trim = (v) => (v == null ? '' : String(v)).trim();

    // Rule-specific applicability (only elements that already have a text alternative mechanism)
    let textAltInfo = null;
    if (getTextAlternativeInfo) {
      try {
        textAltInfo = getTextAlternativeInfo(el, ctx);
      } catch {
        textAltInfo = null;
      }
    }

    const hasTextAlt = !!(textAltInfo && textAltInfo.present);
    if (!hasTextAlt) continue;

    applicableCount += 1;

    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

    const baseOccurrence = {
      summary: 'Review text alternative for <canvas> for equivalence and appropriateness.',
      hint: 'Confirm the fallback text or accessible name conveys the same information/function as the canvas content.',
      i18n: {
        summaryKey: 'canvas_textAltQuality_summary_cantTell',
        hintKey: 'canvas_textAltQuality_hint_cantTell',
        params: { element: (el.tagName || '').toLowerCase() }
      },
      data: {
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
        details: textAltInfo || null
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
