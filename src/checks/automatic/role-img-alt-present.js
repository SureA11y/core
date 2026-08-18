/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check role-img-text-alternative-present
 * @atomic true
 * @summary Accessible elements with role="img" must have an alternative text via aria-label or aria-labelledby
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @applicability
 *   Applies to elements with role="img" that are included in the
 *   accessibility tree (ACT 23a2a8's "programmatically hidden" exemption:
 *   display:none/visibility:hidden/aria-hidden="true" on the element or an
 *   ancestor, with no carve-out for focusable or IDREF-referenced elements —
 *   aria-hidden-focus and duplicate-id-aria own those separately).
 * @expectation
 *   Each applicable element with role="img" has an accessible text alternative:
 *    - aria-label with a non-empty value; OR
 *    - aria-labelledby referencing at least one existing element that contributes non-empty text; OR
 *    - a non-empty title attribute (last-resort accessible-name source per HTML-AAM).
 */

const id = 'role-img-text-alternative-present';

const meta = {
  title: '[role="img"] must have an accessible text alternative',
  description:
    'Checks that elements with role="img" provide an accessible text alternative via aria-label, aria-labelledby, or a title attribute.',
  i18n: {
    titleKey: 'roleImg_textAlternativePresent_title',
    descriptionKey: 'roleImg_textAlternativePresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag111', 'nontext', 'images', 'aria', 'atomic', 'automatic'],
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
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {
    facetsBySc: {
      '1.1.1': ['role-img-text-alternative-present']
    }
  }
};

function runInPage(ctx) {
  const { root, helpers, rule } = ctx;
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

  const trim = (v) => {
    try {
      return String(v == null ? '' : v)
        .replace(/\s+/g, ' ')
        .trim();
    } catch {
      return '';
    }
  };

  const imgElements = (() => {
    // do not consider element "img" because it has its own rule
    const sel = '[role="img" i]:not(img)';
    try {
      return Array.from((queryAllSmart ? queryAllSmart(sel) : queryAll(sel)) || []);
    } catch {
      return queryAll(sel);
    }
  })();

  if (!imgElements.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  let applicableCount = 0;

  // ACT 23a2a8 (same rule as native img-alt-present) exempts programmatically
  // hidden images and that glossary term has no focusability carve-out, so a
  // tabbable/IDREF-referenced role="img" inside aria-hidden stays out of
  // scope here too; aria-hidden-focus reports that markup instead.
  const isAccTreeEligible =
    helpers && typeof helpers.isIncludedInAccessibilityTree === 'function'
      ? helpers.isIncludedInAccessibilityTree
      : helpers && typeof helpers.isAccTreeEligible === 'function'
        ? helpers.isAccTreeEligible
        : null;

  const getAccessibleNameInfo =
    helpers && typeof helpers.getAccessibleNameInfo === 'function'
      ? helpers.getAccessibleNameInfo
      : null;

  for (const el of imgElements) {
    if (!el || !el.getAttribute) continue;

    // Applicability: eligible in the acc tree (with helper exceptions).
    if (isAccTreeEligible) {
      const elig = (() => {
        try {
          return isAccTreeEligible(el, ctx);
        } catch {
          return { eligible: true, reasons: [] };
        }
      })();
      if (elig && elig.eligible === false) continue;
      // isIncludedInAccessibilityTree returns a plain boolean, not an
      // {eligible, reasons} object like isAccTreeEligible's fallback shape.
      if (typeof elig === 'boolean' && elig === false) continue;
    }

    applicableCount += 1;

    // Expectation: aria-label OR aria-labelledby. We use helper name-info when available,
    // but we also validate the source to keep this rule scoped/deterministic.

    const ariaLabelRaw = (() => {
      try {
        return el.getAttribute('aria-label');
      } catch {
        return null;
      }
    })();
    const ariaLabel = trim(ariaLabelRaw);

    const ariaLabelledbyRaw = (() => {
      try {
        return el.getAttribute('aria-labelledby');
      } catch {
        return null;
      }
    })();
    const ariaLabelledby = trim(ariaLabelledbyRaw);

    const hasAriaLabelAttr = ariaLabelRaw !== null;
    const hasAriaLabelledbyAttr = ariaLabelledbyRaw !== null;

    const hasValidAriaLabel = hasAriaLabelAttr && ariaLabel.length > 0;
    const hasValidAriaLabelledbyAttr = hasAriaLabelledbyAttr && ariaLabelledby.length > 0;

    // Last-resort naming mechanism per HTML-AAM: a non-empty title attribute.
    const titleRaw = (() => {
      try {
        return el.getAttribute('title');
      } catch {
        return null;
      }
    })();
    const hasValidTitle = titleRaw !== null && trim(titleRaw).length > 0;

    let nameInfo = null;

    // Fast outcomes first (no helper needed)
    let reasonCode = '';
    let hasName = false;

    if (!hasAriaLabelAttr && !hasAriaLabelledbyAttr) {
      if (hasValidTitle) {
        hasName = true;
      } else {
        reasonCode = 'missingTextAlternative';
      }
    } else if (hasAriaLabelAttr && !hasValidAriaLabel) {
      if (hasValidTitle) {
        hasName = true;
      } else {
        reasonCode = 'emptyAriaLabel';
      }
    } else if (hasAriaLabelledbyAttr && !hasValidAriaLabelledbyAttr) {
      if (hasValidTitle) {
        hasName = true;
      } else {
        reasonCode = 'emptyAriaLabelledby';
      }
    } else {
      // Mechanism present + non-empty. Optionally validate resolution via helper.
      if (getAccessibleNameInfo) {
        nameInfo = (() => {
          try {
            return getAccessibleNameInfo(el, ctx);
          } catch {
            return null;
          }
        })();
        const helperSaysHasName = !!(nameInfo && nameInfo.present && trim(nameInfo.value));
        if (helperSaysHasName) {
          hasName = true;
        } else {
          reasonCode = 'nameNotResolved';
        }
      } else {
        // Without helper, accept non-empty aria-label/labelledby as sufficient.
        hasName = true;
      }
    }

    if (hasName) continue;

    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

    const baseOccurrence = {
      summary: 'Missing text alternative on element with role="img".',
      hint: 'Provide aria-label or aria-labelledby (referencing non-empty text) to give this image a text alternative.',
      i18n: {
        summaryKey: 'roleImg_textAlternativePresent_summary_fail',
        hintKey: 'roleImg_textAlternativePresent_hint_fail',
        params: { role: 'img' }
      },
      data: {
        details: {
          reasonCode,
          ariaLabel: ariaLabelRaw === null ? null : ariaLabel,
          ariaLabelledby: ariaLabelledbyRaw === null ? null : ariaLabelledby,
          accessibleNameInfo: nameInfo || null
        },
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
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

  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }

  return {
    ruleId: rule.ruleId,
    outcome: 'fail',
    severity: rule.defaultSeverity || 'minor',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
