/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check input-image-alt-decorative
 * @atomic true
 * @summary Manual review: text alternative appropriateness (WCAG 1.1.1)
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @type manual
 * @applicability
 *   Applies to <input type="image"> elements whose alt attribute is present
 *   but empty once trimmed, and which still carry a name from another
 *   source: an ARIA name resolving to non-empty text, or a title. Without
 *   that other name there is nothing to weigh the empty alt against, and the
 *   control is input-image-alt-present's failure instead. The element must
 *   be included in the accessibility tree, and role="presentation"/"none"
 *   takes it out of scope unless it is focusable, which restores its role.
 * @expectation
 *   Human review is required to confirm that the provided text alternative is accurate and appropriate.
 */

const id = 'input-image-alt-decorative';

const meta = {
  title: '<input type="image"> with alt="" must be appropriate (manual review)',
  description:
    'Flags <input type="image"> elements with empty alt for human review (usually not appropriate for functional controls).',
  i18n: {
    titleKey: 'inputImage_altDecorative_title',
    descriptionKey: 'inputImage_altDecorative_description'
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

  const getAriaNameInfo =
    helpers && typeof helpers.getAriaNameInfo === 'function' ? helpers.getAriaNameInfo : null;

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

  // alt="" plus a name from aria-label/aria-labelledby/title is the judgement
  // call this rule reviews. alt="" with no other source leaves the control
  // unnamed, which input-image-alt-present fails outright.
  function hasNameFromOtherSource(el) {
    if (getAriaNameInfo) {
      try {
        const aria = getAriaNameInfo(el, ctx);
        if (aria && aria.present && String(aria.value || '').trim()) return true;
      } catch {
        // fall through to title
      }
    }
    try {
      const title = el.getAttribute('title');
      return title != null && String(title).trim() !== '';
    } catch {
      return false;
    }
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

    // Rule-specific applicability (only elements that already have a text alternative mechanism)
    if (!(el.getAttribute('alt') != null && String(el.getAttribute('alt')).trim() === '')) continue;
    if (!hasNameFromOtherSource(el)) continue;

    applicableCount += 1;

    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

    const baseOccurrence = {
      summary: 'Review <input type="image"> with alt="".',
      hint: 'This control is typically functional. Confirm it has an equivalent accessible name elsewhere, or provide meaningful alt text.',
      i18n: {
        summaryKey: 'inputImage_altDecorative_summary_cantTell',
        hintKey: 'inputImage_altDecorative_hint_cantTell',
        params: { element: 'input[type=image]' }
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
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  return { ruleId: rule.ruleId, outcome: 'cantTell', severity: 'minor', occurrences };
}

module.exports = { id, meta, runInPage };
