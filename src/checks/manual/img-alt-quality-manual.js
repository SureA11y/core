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
 *   Human review is required to confirm that the provided text alternative
 *   is accurate and appropriate. Alt text that looks like something other
 *   than a description gets its own summary and hint: a file name (or alt
 *   equal to the image's own file name), a web address, a placeholder or
 *   generic word such as "image" or "TBD", an opening that says it is an
 *   image ("image of", "photo of"), or alt longer than 150 characters. Every
 *   finding is still `cantTell`: each of these can be right in context.
 * @reports
 *   - `altSignal`: what made the alt text look suspicious, on those findings
 *     only: `file-name`, `url`, `placeholder`, `redundant-prefix` or
 *     `too-long`. Absent on a finding with ordinary alt text. When several
 *     apply, the first in that order is reported.
 *   - `length`: the alt text's length in characters, on `too-long` only.
 *   - `limit`: the length above which alt counts as too long (150), on
 *     `too-long` only.
 * @implementation-notes
 * - The signals are not reason codes. Before them, every finding of this
 *   rule had the same identity (`ruleId + reasonCode + html`) with no
 *   reason code; giving the suspicious ones a code would have changed the
 *   identity of findings that still exist, which API_STABILITY.md rules
 *   out. They change the message and `data.details` only.
 * - The detection is helpers.getTextAlternativeSignal (dom-helpers.js),
 *   shared with area-alt-quality and input-image-alt-quality, and the
 *   message helpers.describeTextAlternativeSignal; both are in
 *   RULE_HELPERS.md.
 * - Word lists exist for en, de, es, fr and ja. English is always checked;
 *   the list for the image's own language (nearest lang attribute, across
 *   shadow roots) is added on top, as link-name-quality does.
 * - Exact matches for placeholders ("Logo" is flagged, "Company logo" is
 *   not), prefixes followed by more text for the "image of" case. Alt equal to the image's file name without its
 *   extension only counts when it looks like a file name (no spaces, and an
 *   underscore, two digits in a row or two hyphens), so `alt="Search"` on
 *   `search.svg` is ordinary alt text.
 * - 150 characters is a common guideline, not a WCAG limit: alt is read in
 *   one go and can't be navigated, so a longer one usually belongs in a
 *   long description.
 */

const id = 'img-alt-quality';

const meta = {
  title: '<img> alt text must be appropriate (manual review)',
  description:
    'Flags <img> elements with non-empty alt text for human review of appropriateness, and says when the alt looks like a file name, a web address, a placeholder, an "image of" opening or is very long.',
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

  // What makes an alt look like something other than a description, shared
  // with area-alt-quality and input-image-alt-quality.
  const getTextAlternativeSignal =
    helpers && typeof helpers.getTextAlternativeSignal === 'function'
      ? helpers.getTextAlternativeSignal
      : () => null;
  const describeTextAlternativeSignal =
    helpers && typeof helpers.describeTextAlternativeSignal === 'function'
      ? helpers.describeTextAlternativeSignal
      : () => null;

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
    const signal = (() => {
      try {
        return getTextAlternativeSignal(el, el.getAttribute('alt'));
      } catch {
        return null;
      }
    })();
    // Alt that looks like something other than a description gets the
    // shared message for its signal; ordinary alt keeps this rule's own.
    const message = signal ? describeTextAlternativeSignal(signal, 'img') : null;
    const baseOccurrence = {
      summary: message
        ? message.summary
        : 'Review alt text on <img> for accuracy and appropriateness.',
      hint: message
        ? message.hint
        : 'Ensure the alt text conveys the image’s purpose/information in context (not redundant, not filename-like).',
      i18n: message
        ? message.i18n
        : {
            summaryKey: 'img_altQuality_summary_cantTell',
            hintKey: 'img_altQuality_hint_cantTell',
            params: { element: 'img' }
          },
      data: {
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
        details: signal
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
