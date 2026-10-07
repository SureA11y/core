/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check svg-text-alternative-present
 * @atomic true
 * @summary Accessible <svg> elements must provide a text alternative
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @applicability
 *   Applies to inline <svg> elements that are exposed to assistive technologies AND appear intended to be conveyed.
 *   "Intended to be conveyed" is approximated deterministically by at least one of:
 *     - role="img", role="graphics-symbol", or role="graphics-document"
 *       on the SVG root element itself (the WAI-ARIA Graphics Module
 *       roles, alongside img). Does NOT extend to arbitrary
 *       role="img"/"graphics-symbol"/"graphics-document" descendants
 *       nested inside an <svg>. This check's scope is the <svg> root
 *       only; role-img-text-alternative-present covers those same three
 *       roles on any other element, including nested SVG shapes (ACT
 *       7d6734's own failed example: a bare `<svg>` root with a nested
 *       `<circle role="graphics-symbol">`).
 *     - aria-label / aria-labelledby present
 *     - <title> or <desc> present as a direct child, wherever it is among the
 *       children (SVG-AAM); the first of each counts (desc alone is an
 *       applicability signal only, see @expectation)
 *     - focusable/tabbable (e.g., tabindex, native focusability)
 *
 *   Images with role="presentation" or role="none" are excluded only when they are not focusable.
 *   Elements otherwise hidden from the accessibility tree remain applicable
 *   if they are tabbable-focusable or referenced by IDREF relationships (per engine eligibility checks).
 * @expectation
 *   Each applicable <svg> element provides a text alternative via:
 *     - non-empty text in its first direct child <title>, wherever it is
 *       among the children (an empty first <title> names nothing), OR
 *     - an ARIA name (aria-label / aria-labelledby).
 *   A <desc> element alone does NOT satisfy this, per the SVG Accessibility
 *   API Mappings spec §7.1, <desc> only ever contributes to the accessible
 *   DESCRIPTION, never the accessible NAME. An <svg> with only a
 *   <desc> and no <title>/ARIA name is still "applicable" (desc signals
 *   authorial intent) but fails.
 */

const id = 'svg-text-alternative-present';

const meta = {
  title: '<svg> must provide a text alternative',
  description:
    'Checks that inline <svg> elements provide a text alternative via a <title> element or an ARIA name (a <desc> element alone does not count).',
  i18n: {
    titleKey: 'svg_textAltPresent_title',
    descriptionKey: 'svg_textAltPresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag111', 'svg', 'nontext', 'images', 'atomic', 'automatic'],
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
      '1.1.1': ['svg-text-alternative-present']
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const queryAllSmart =
    helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
  const queryAll =
    helpers && typeof helpers.queryAll === 'function'
      ? helpers.queryAll
      : (sel) => {
          try {
            return safeRoot && dom.get(safeRoot, 'querySelectorAll')
              ? Array.from(dom.querySelectorAll(safeRoot, sel))
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

  const getAriaNameInfo =
    helpers && typeof helpers.getAriaNameInfo === 'function' ? helpers.getAriaNameInfo : null;

  function trim(v) {
    try {
      return (v == null ? '' : String(v)).trim();
    } catch {
      return '';
    }
  }

  // An SVG element's first direct child <title> or <desc>, wherever it is
  // among the children (SVG-AAM: "a direct child title element", "a direct
  // child desc element"; helpers.getSvgChildText).
  function svgChildText(svg, tag) {
    try {
      return helpers && typeof helpers.getSvgChildText === 'function'
        ? helpers.getSvgChildText(svg, tag)
        : '';
    } catch {
      return '';
    }
  }

  function nonEmptyTitleText(svg) {
    return svgChildText(svg, 'title');
  }

  function nonEmptyDescText(svg) {
    return svgChildText(svg, 'desc');
  }

  function isFocusable(svg) {
    if (getFocusableInfo) {
      const fi = (() => {
        try {
          return getFocusableInfo(svg, ctx);
        } catch {
          return null;
        }
      })();
      return !!(fi && fi.focusable);
    }
    // deterministic fallback: tabindex presence/valid number
    try {
      const tabindex =
        svg && dom.get(svg, 'getAttribute') ? dom.getAttribute(svg, 'tabindex') : null;
      return (
        tabindex != null &&
        String(tabindex).trim() !== '' &&
        !Number.isNaN(Number(String(tabindex).trim()))
      );
    } catch {
      return false;
    }
  }

  const svgs = (() => {
    try {
      return Array.from((queryAllSmart ? queryAllSmart('svg') : queryAll('svg')) || []);
    } catch {
      return queryAll('svg');
    }
  })();

  if (!svgs.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const el of svgs) {
    if (!el || !dom.get(el, 'getAttribute')) continue;

    // Applicability step 1: only acc-tree eligible nodes (with helper exceptions)
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

    // Applicability step 2: role (presentation/none) exclusion only when not focusable
    // The resolved role: the attribute's first known, non-abstract token,
    // in any case (role="foo NONE" is none; role="foo" is no role at all).
    const role = (() => {
      try {
        return helpers && helpers.aria && typeof helpers.aria.getExplicitRole === 'function'
          ? helpers.aria.getExplicitRole(el)
          : '';
      } catch {
        return '';
      }
    })();

    const focusable = isFocusable(el);

    if (role === 'presentation' || role === 'none') {
      if (!focusable) continue;
    }

    // Applicability step 3: intent signal gating (computed once per element)
    let hasAriaNamingAttr = false;
    try {
      hasAriaNamingAttr =
        dom.getAttribute(el, 'aria-label') != null ||
        dom.getAttribute(el, 'aria-labelledby') != null;
    } catch {}

    const titleText = nonEmptyTitleText(el);
    const descText = titleText ? '' : nonEmptyDescText(el); // avoid second scan if title already passes
    const hasTitleOrDesc = !!(titleText || descText);

    const hasIntent =
      role === 'img' ||
      role === 'graphics-symbol' ||
      role === 'graphics-document' ||
      hasAriaNamingAttr ||
      hasTitleOrDesc ||
      focusable;

    if (!hasIntent) continue;

    applicableCount += 1;

    // Expectation: non-empty title/desc OR ARIA name (but only resolve name if attrs exist)
    let hasAriaName = false;
    if (hasAriaNamingAttr) {
      if (getAriaNameInfo) {
        const info = (() => {
          try {
            return getAriaNameInfo(el, ctx);
          } catch {
            return null;
          }
        })();
        hasAriaName = !!(info && info.present && trim(info.value));
      } else {
        // minimal deterministic fallback
        const ariaLabel = trim(
          (() => {
            try {
              return dom.getAttribute(el, 'aria-label');
            } catch {
              return '';
            }
          })()
        );
        const ariaLabelledby = trim(
          (() => {
            try {
              return dom.getAttribute(el, 'aria-labelledby');
            } catch {
              return '';
            }
          })()
        );
        hasAriaName = !!(ariaLabel || ariaLabelledby);
      }
    }

    // Per SVG-AAM §7.1: <desc> contributes only to the accessible
    // DESCRIPTION, never the accessible NAME, so descText does not
    // count here even though it does count toward applicability above.
    const ok = !!titleText || hasAriaName;
    if (ok) continue;

    let eligInfo = null;
    if (getEligibilityInfo) {
      try {
        eligInfo = getEligibilityInfo(el, ctx, { targetSet: 'acc' });
      } catch {
        eligInfo = null;
      }
    }

    const baseOccurrence = {
      summary: 'Missing text alternative for <svg>.',
      hint: 'Provide a <title> element with text, or an ARIA name (aria-label/aria-labelledby); a <desc> element alone does not provide an accessible name.',
      i18n: {
        summaryKey: 'svg_textAltPresent_summary_fail',
        hintKey: 'svg_textAltPresent_hint_fail',
        params: { element: 'svg' }
      },
      data: {
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
