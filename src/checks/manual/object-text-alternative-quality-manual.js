'use strict';

/**
 * @check object-text-alternative-quality
 * @atomic true
 * @summary Manual review: text alternative appropriateness (WCAG 1.1.1)
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @type manual
 * @expectation
 *   Human review is required to confirm that the provided text alternative is accurate and appropriate.
 */

const id = 'object-text-alternative-quality';

const meta = {
  title: '<object> text alternative must be appropriate (manual review)',
  description:
    'Flags <object> elements with detected fallback or name for human review of equivalence and appropriateness.',
  i18n: {
    titleKey: 'object_textAltQuality_title',
    descriptionKey: 'object_textAltQuality_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag111', 'nontext', 'object', 'manual', 'atomic'],
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

  const els = (() => {
    try {
      return Array.from((queryAllSmart ? queryAllSmart('object') : queryAll('object')) || []);
    } catch {
      return queryAll('object');
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

    const trim = (v) => (v == null ? '' : String(v)).trim();

    let fallbackText = '';
    let ariaLabel = '';
    let ariaLabelledBy = '';
    let title = '';
    let labelledByText = '';

    try {
      fallbackText = trim(el.textContent || '');
      ariaLabel = trim(el.getAttribute('aria-label'));
      ariaLabelledBy = trim(el.getAttribute('aria-labelledby'));
      title = trim(el.getAttribute('title'));
    } catch {}

    // Only resolve idrefs if needed/present
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

    const details = {
      fallbackText: fallbackText || null,
      ariaLabel: ariaLabel || null,
      ariaLabelledBy: ariaLabelledBy || null,
      ariaLabelledByText: labelledByText || null,
      title: title || null
    };

    const hasMechanism = !!(
      details.fallbackText ||
      details.ariaLabel ||
      details.ariaLabelledByText ||
      details.title
    );
    if (!hasMechanism) continue;

    applicableCount += 1;

    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

    const baseOccurrence = {
      summary: 'Review text alternative for <object> for equivalence and appropriateness.',
      hint: 'Confirm the fallback content or ARIA name provides an equivalent alternative for the embedded content.',
      i18n: {
        summaryKey: 'object_textAltQuality_summary_cantTell',
        hintKey: 'object_textAltQuality_hint_cantTell',
        params: { element: 'object' }
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
