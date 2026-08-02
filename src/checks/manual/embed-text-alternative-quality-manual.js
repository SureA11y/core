'use strict';

/**
 * @check embed-text-alternative-quality
 * @atomic true
 * @summary Manual review: text alternative appropriateness (WCAG 1.1.1)
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @type manual
 * @expectation
 *   Human review is required to confirm that the provided text alternative is accurate and appropriate.
 */

const id = 'embed-text-alternative-quality';

const meta = {
  title: '<embed> text alternative must be appropriate (manual review)',
  description: 'Flags <embed> elements with a detected name for human review of appropriateness.',
  i18n: {
    titleKey: 'embed_textAltQuality_title',
    descriptionKey: 'embed_textAltQuality_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag111', 'nontext', 'embed', 'manual', 'atomic'],
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

  const trim = (v) => (v == null ? '' : String(v)).trim();
  const getTextFromIdRefs =
    helpers && typeof helpers.getTextFromIdRefs === 'function' ? helpers.getTextFromIdRefs : null;

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
      return Array.from((queryAllSmart ? queryAllSmart('embed') : queryAll('embed')) || []);
    } catch {
      return queryAll('embed');
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

    let ariaLabel;
    let ariaLabelledBy;
    let title;
    try {
      ariaLabel = trim(el.getAttribute('aria-label'));
      ariaLabelledBy = trim(el.getAttribute('aria-labelledby'));
      title = trim(el.getAttribute('title'));
    } catch {
      ariaLabel = '';
      ariaLabelledBy = '';
      title = '';
    }

    // Only resolve IDREF text if aria-labelledby is present and aria-label is not already sufficient
    let labelledByText = '';

    if (!ariaLabel && ariaLabelledBy && getTextFromIdRefs) {
      try {
        const t = getTextFromIdRefs(ariaLabelledBy, ctx);
        labelledByText = trim(t && t.text);
      } catch {
        labelledByText = '';
      }
    }

    // A broken/empty-resolving aria-labelledby (e.g. pointing at a
    // nonexistent id) is not a "detected" text alternative to review the
    // QUALITY of -- there's no text here at all, and this element's
    // sibling automatic rule (embed-text-alternative-present) already
    // reports it as a fail (no accessible name). Found while extending
    // coverage of this rule family and diffing it against object-/svg-/
    // canvas-text-alternative-quality-manual, which all correctly require
    // aria-labelledby to actually resolve to non-empty text
    // (hasResolvedLabelledBy) rather than merely being present as an
    // attribute -- this rule alone treated a present-but-broken
    // aria-labelledby as "still a mechanism, worth reviewing", producing a
    // confusing cantTell ("review this text for accuracy") for an element
    // that has no text alternative whatsoever.
    const hasNameMechanism = !!(ariaLabel || title || labelledByText);
    if (!hasNameMechanism) continue;

    const details = {
      ariaLabel: ariaLabel || null,
      ariaLabelledBy: ariaLabelledBy || null,
      ariaLabelledByText: labelledByText || null,
      title: title || null
    };

    applicableCount += 1;

    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

    const baseOccurrence = {
      summary: 'Review text alternative for <embed> for accuracy and appropriateness.',
      hint: 'Confirm the ARIA name or title accurately identifies the embedded content in context.',
      i18n: {
        summaryKey: 'embed_textAltQuality_summary_cantTell',
        hintKey: 'embed_textAltQuality_hint_cantTell',
        params: { element: (el.tagName || '').toLowerCase() }
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
