/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check role-img-text-alternative-present
 * @atomic true
 * @summary Accessible elements with role="img"/"graphics-symbol"/"graphics-document" must have a text alternative
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @applicability
 *   Applies to elements whose role attribute resolves to img,
 *   graphics-symbol or graphics-document (the first known role token of the
 *   fallback list, matched in any case) that are included in the
 *   accessibility tree
 *   (ACT 23a2a8's "programmatically hidden" exemption:
 *   display:none/visibility:hidden/aria-hidden="true" on the element or an
 *   ancestor, with no carve-out for focusable or IDREF-referenced elements,
 *   aria-hidden-focus and duplicate-id-aria own those separately). Per ACT
 *   7d6734, this reaches any element carrying one of these roles, not only
 *   the <svg> root, e.g. a <circle role="graphics-symbol"> nested inside a
 *   plain <svg>. Every <svg> element itself is left to
 *   svg-text-alternative-present's own (already ACT-clean) title/aria-name
 *   handling, so an unnamed <svg role="img"> is reported once, there; the
 *   <img> tag is excluded here since it has its own dedicated rule.
 * @expectation
 *   Each applicable element has an accessible text alternative:
 *    - aria-label with a non-empty value; OR
 *    - aria-labelledby referencing at least one existing element that contributes non-empty text; OR
 *    - a non-empty title attribute (last-resort accessible-name source per HTML-AAM); OR
 *    - for an SVG-namespace element, a non-empty direct child <title>, wherever it is among the children (SVG-AAM's own naming mechanism, not only for the <svg> root); the first one counts.
 * @reports
 *   - `ariaLabel`: the element's `aria-label` with surrounding whitespace
 *     removed, or null when it has none.
 *   - `ariaLabelledby`: the element's `aria-labelledby` id list with
 *     surrounding whitespace removed, or null when it has none.
 *   - `accessibleNameInfo` (`nameNotResolved`): the accessible name the
 *     element ends up with: `present`, `value`, `mechanism` (where the name
 *     came from, such as `aria-labelledby`) and `flags` (notes on what went
 *     wrong, such as `idref-missing` for a reference to an id that does not
 *     exist). Null on the other findings.
 */

const id = 'role-img-text-alternative-present';

const meta = {
  title:
    '[role="img"/"graphics-symbol"/"graphics-document"] must have an accessible text alternative',
  description:
    'Checks that elements with role="img", "graphics-symbol" or "graphics-document" provide an accessible text alternative using aria-label, aria-labelledby, a title attribute, or (for SVG elements) a child <title>.',
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
  const dom = ctx.helpers.dom;
  const { root, helpers, rule } = ctx;
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

  const trim = (v) => {
    try {
      return String(v == null ? '' : v)
        .replace(/\s+/g, ' ')
        .trim();
    } catch {
      return '';
    }
  };

  const IMAGE_ROLES = new Set(['img', 'graphics-symbol', 'graphics-document']);

  // The resolved explicit role: the first known role token, lower-cased, or
  // '' when the attribute names no known role.
  const explicitRole = (el) => {
    try {
      return helpers && helpers.aria && typeof helpers.aria.getExplicitRole === 'function'
        ? helpers.aria.getExplicitRole(el)
        : '';
    } catch {
      return '';
    }
  };

  const imgElements = (() => {
    // <img> and <svg> are left out: each has its own rule
    // (img-alt-present, svg-text-alternative-present), and counting an
    // unnamed <svg role="img"> here too would report it twice.
    // `~=` matches a token anywhere in the role fallback list, so a match is
    // kept only when its resolved explicit role (the first known token) is
    // one of the three: role="foo img" is an img, role="button img" is not.
    const sel =
      '[role~="img" i]:not(img):not(svg), [role~="graphics-symbol" i]:not(svg), [role~="graphics-document" i]:not(svg)';
    let found;
    try {
      found = Array.from((queryAllSmart ? queryAllSmart(sel) : queryAll(sel)) || []);
    } catch {
      found = Array.from(queryAll(sel) || []);
    }
    return found.filter((el) => IMAGE_ROLES.has(explicitRole(el)));
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
    if (!el || !dom.get(el, 'getAttribute')) continue;

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

    const matchedRole = (() => {
      try {
        return explicitRole(el) || 'img';
      } catch {
        return 'img';
      }
    })();

    // Expectation: aria-label OR aria-labelledby. We use helper name-info when available,
    // but we also validate the source to keep this rule scoped/deterministic.

    const ariaLabelRaw = (() => {
      try {
        return dom.getAttribute(el, 'aria-label');
      } catch {
        return null;
      }
    })();
    const ariaLabel = trim(ariaLabelRaw);

    const ariaLabelledbyRaw = (() => {
      try {
        return dom.getAttribute(el, 'aria-labelledby');
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
        return dom.getAttribute(el, 'title');
      } catch {
        return null;
      }
    })();
    const hasValidTitle = titleRaw !== null && trim(titleRaw).length > 0;

    // SVG-AAM's own accessible-name mechanism: a direct child <title>
    // element (not the HTML title attribute), wherever it is among the
    // children, is the standard way to name any element in the SVG
    // namespace, not only the <svg> root -- a role="graphics-symbol"
    // <circle> named only this way still has a real text alternative, same
    // as a role="img" <svg>. helpers.getSvgChildText reads it.
    const svgTitleChildText = (() => {
      try {
        return helpers && typeof helpers.getSvgChildText === 'function'
          ? helpers.getSvgChildText(el, 'title')
          : '';
      } catch {
        return '';
      }
    })();
    const hasValidTitleSource = hasValidTitle || !!svgTitleChildText;

    let nameInfo = null;

    // Fast outcomes first (no helper needed)
    let reasonCode = '';
    let hasName = false;

    if (!hasAriaLabelAttr && !hasAriaLabelledbyAttr) {
      if (hasValidTitleSource) {
        hasName = true;
      } else {
        reasonCode = 'missingTextAlternative';
      }
    } else if (hasAriaLabelAttr && !hasValidAriaLabel) {
      if (hasValidTitleSource) {
        hasName = true;
      } else {
        reasonCode = 'emptyAriaLabel';
      }
    } else if (hasAriaLabelledbyAttr && !hasValidAriaLabelledbyAttr) {
      if (hasValidTitleSource) {
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
      summary: `Missing text alternative on element with role="${matchedRole}".`,
      hint: 'Provide aria-label or aria-labelledby (referencing non-empty text) to give this element a text alternative.',
      i18n: {
        summaryKey: 'roleImg_textAlternativePresent_summary_fail',
        hintKey: 'roleImg_textAlternativePresent_hint_fail',
        params: { role: matchedRole }
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
