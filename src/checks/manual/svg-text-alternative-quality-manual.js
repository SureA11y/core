/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check svg-text-alternative-quality
 * @atomic true
 * @summary Manual review: text alternative appropriateness (WCAG 1.1.1)
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @type manual
 * @applicability
 *   Applies to inline <svg> elements that already carry a text alternative:
 *   non-empty <title> or <desc> text, a non-empty aria-label, or an
 *   aria-labelledby that resolves to non-empty text. <desc> counts here as
 *   something to review even though it never contributes to the accessible
 *   name: that distinction is svg-text-alternative-present's. The element
 *   must be included in the accessibility tree, and
 *   role="presentation"/"none" takes it out of scope unless it is focusable,
 *   which restores its role.
 * @expectation
 *   Human review is required to confirm that the provided text alternative is accurate and appropriate.
 */

const id = 'svg-text-alternative-quality';

const meta = {
  title: '<svg> text alternative must be appropriate (manual review)',
  description:
    'Flags applicable <svg> graphics with a detected text alternative for human review of appropriateness.',
  i18n: {
    titleKey: 'svg_textAltQuality_title',
    descriptionKey: 'svg_textAltQuality_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag111', 'nontext', 'svg', 'manual', 'atomic'],
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

  const buildSelector =
    helpers && typeof helpers.buildSelector === 'function'
      ? helpers.buildSelector
      : (el) => {
          try {
            if (!el || !el.tagName) return 'html';
            const tag = (el.tagName || 'html').toLowerCase();
            return el.id ? `${tag}#${el.id}` : tag;
          } catch {
            return 'html';
          }
        };

  const getOuterHtmlSnippet =
    helpers && typeof helpers.getOuterHtmlSnippet === 'function'
      ? helpers.getOuterHtmlSnippet
      : (el) => {
          try {
            return el && el.outerHTML ? String(el.outerHTML).slice(0, 2000) : '';
          } catch {
            return '';
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

  const els = (() => {
    try {
      return Array.from((queryAllSmart ? queryAllSmart('svg') : queryAll('svg')) || []);
    } catch {
      return queryAll('svg');
    }
  })();

  if (!els.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  let applicableCount = 0;

  const trim = (v) => (v == null ? '' : String(v)).trim();

  for (const el of els) {
    if (!el || !el.getAttribute) continue;

    // acc eligibility
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

    // Detect mechanisms once
    let titleText = '';
    let descText = '';
    let ariaLabel = '';
    let ariaLabelledBy = '';
    let labelledByText = '';

    try {
      const titleEl = el.querySelector ? el.querySelector('title') : null;
      const descEl = el.querySelector ? el.querySelector('desc') : null;
      titleText = trim(titleEl && titleEl.textContent);
      descText = trim(descEl && descEl.textContent);

      ariaLabel = trim(el.getAttribute('aria-label'));
      ariaLabelledBy = trim(el.getAttribute('aria-labelledby'));
    } catch {}

    if (
      !ariaLabel &&
      ariaLabelledBy &&
      helpers &&
      typeof helpers.getTextFromIdRefs === 'function'
    ) {
      try {
        const t = helpers.getTextFromIdRefs(ariaLabelledBy, ctx);
        labelledByText = trim(t && t.text);
      } catch {}
    }

    const hasNonEmptyTitle = !!titleText;
    const hasNonEmptyDesc = !!descText;
    const hasAriaLabel = !!ariaLabel;
    const hasResolvedLabelledBy = !!labelledByText;

    const hasMechanism =
      hasNonEmptyTitle || hasNonEmptyDesc || hasAriaLabel || hasResolvedLabelledBy;
    if (!hasMechanism) continue;

    applicableCount += 1;

    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

    const baseOccurrence = {
      summary: 'Review text alternative for <svg> for accuracy and appropriateness.',
      hint: 'Confirm the <title>/<desc> or ARIA name conveys the meaning/purpose of the graphic in context.',
      i18n: {
        summaryKey: 'svg_textAltQuality_summary_cantTell',
        hintKey: 'svg_textAltQuality_hint_cantTell',
        params: { element: 'svg' }
      },
      data: {
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
        details: {
          hasNonEmptyTitle,
          hasNonEmptyDesc,
          ariaLabel: ariaLabel || null,
          ariaLabelledBy: ariaLabelledBy || null,
          ariaLabelledByText: labelledByText ? labelledByText.slice(0, 120) : null // deterministic truncation
        }
      }
    };

    if (helpers && typeof helpers.reportOccurrence === 'function') {
      occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
    } else {
      const selectorStr = (() => {
        try {
          return buildSelector(el);
        } catch {
          return 'html';
        }
      })();
      const html = getOuterHtmlSnippet(el);
      occurrences.push({ selector: selectorStr, html, ...baseOccurrence });
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  return { ruleId: rule.ruleId, outcome: 'cantTell', severity: 'minor', occurrences };
}

module.exports = { id, meta, runInPage };
