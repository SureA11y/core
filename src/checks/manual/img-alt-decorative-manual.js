/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check img-alt-decorative
 * @atomic true
 * @summary Manual review: an image/canvas/svg excluded from the accessibility tree must be purely decorative
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @type manual
 * @applicability
 *   Applies to visible <img>, <canvas> or <svg> elements excluded from the
 *   accessibility tree by any of: an aria-hidden ancestor-or-self, an
 *   explicit role="none"/"presentation" not overridden by focusability, an
 *   <img alt=""> (the native decorative marker, same focusability
 *   override), an unlabeled <svg> whose implicit role is graphics-document
 *   (no img/graphics-symbol role restatement, aria-name, <title>/<desc>, or
 *   focusability), or an unlabeled <canvas> with no explicit role at all.
 *   Per ACT e88epe, an element is skipped entirely when any ancestor
 *   already has an author-supplied name (aria-label, aria-labelledby,
 *   title, or an associated <label>) — that ancestor's name is what
 *   matters, not this element's exclusion (the common real case: an
 *   icon-only button already named via aria-label).
 * @expectation
 *   Human review is required to confirm the excluded element is purely
 *   decorative and conveys no information a user would otherwise miss.
 */

const id = 'img-alt-decorative';

const meta = {
  title: 'Excluded <img>/<canvas>/<svg> must be decorative (manual review)',
  description:
    'Flags <img>, <canvas> and <svg> elements excluded from the accessibility tree (aria-hidden, role="none"/"presentation", empty alt, or an unlabeled svg/canvas) for human review that they are purely decorative.',
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

  const isIncludedInAccessibilityTree =
    helpers && typeof helpers.isIncludedInAccessibilityTree === 'function'
      ? helpers.isIncludedInAccessibilityTree
      : helpers && typeof helpers.isAccTreeEligible === 'function'
        ? helpers.isAccTreeEligible
        : null;

  const getFocusableInfo =
    helpers && typeof helpers.getFocusableInfo === 'function' ? helpers.getFocusableInfo : null;

  const getAccessibleNameInfo =
    helpers && typeof helpers.getAccessibleNameInfo === 'function'
      ? helpers.getAccessibleNameInfo
      : null;

  const ariaHelpers = helpers && helpers.aria ? helpers.aria : null;

  function trim(v) {
    try {
      return (v == null ? '' : String(v)).trim();
    } catch {
      return '';
    }
  }

  function getExplicitRole(el) {
    if (ariaHelpers && typeof ariaHelpers.getExplicitRole === 'function') {
      try {
        return ariaHelpers.getExplicitRole(el) || '';
      } catch {
        return '';
      }
    }
    try {
      const raw = trim(el.getAttribute('role'));
      return raw ? raw.split(/\s+/)[0].toLowerCase() : '';
    } catch {
      return '';
    }
  }

  function isFocusable(el) {
    if (getFocusableInfo) {
      try {
        const fi = getFocusableInfo(el, ctx);
        return !!(fi && fi.focusable);
      } catch {
        return false;
      }
    }
    try {
      const tabindex = el.getAttribute('tabindex');
      return (
        tabindex != null &&
        String(tabindex).trim() !== '' &&
        !Number.isNaN(Number(String(tabindex).trim()))
      );
    } catch {
      return false;
    }
  }

  function isDomVisible(el) {
    if (!el) return false;
    if (helpers && helpers.isDomVisibleEligible)
      return !!helpers.isDomVisibleEligible(el, ctx, { targetSet: 'dom' }).eligible;
    if (helpers && helpers.getEligibilityInfo)
      return !!helpers.getEligibilityInfo(el, ctx, { targetSet: 'dom' }).eligible;
    return true;
  }

  // Same offscreen-hint pattern as avoid-inline-spacing.js.
  function isOffscreen(el) {
    if (!helpers || typeof helpers.getVisibilityHintsInfo !== 'function') return false;
    try {
      const info = helpers.getVisibilityHintsInfo(el, ctx, {});
      return !!(info && Array.isArray(info.hints) && info.hints.indexOf('offscreen') !== -1);
    } catch {
      return false;
    }
  }

  function hasAriaNamingAttr(el) {
    try {
      return el.getAttribute('aria-label') != null || el.getAttribute('aria-labelledby') != null;
    } catch {
      return false;
    }
  }

  // Same first-child <title>/<desc> convention as svg-text-alternative-present.js.
  function hasNonEmptyFirstChildTitleOrDesc(svg) {
    try {
      const first = svg.firstElementChild;
      const tn = first ? (first.localName || first.tagName || '').toLowerCase() : '';
      if (tn === 'title' || tn === 'desc') return !!trim(first.textContent);
    } catch {
      // ignore
    }
    return false;
  }

  // General exclusion: aria-hidden, inert, or otherwise not included per the
  // shared eligibility model. Visibility is checked separately beforehand,
  // so a display:none/hidden element never reaches this path.
  function isGenerallyExcluded(el) {
    if (!isIncludedInAccessibilityTree) return false;
    try {
      const r = isIncludedInAccessibilityTree(el, ctx);
      if (typeof r === 'boolean') return !r;
      return !(r && r.eligible !== false);
    } catch {
      return false;
    }
  }

  // Presentational exclusion: explicit role="none"/"presentation", or (img
  // only) the native alt="" marker — both overridden by focusability, per
  // ARIA conflict resolution (a focusable element is never presentational).
  function isPresentationallyExcluded(el, tag) {
    const role = getExplicitRole(el);
    let presentational = role === 'presentation' || role === 'none';
    if (!presentational && tag === 'img') {
      const alt = el.getAttribute('alt');
      presentational = alt != null && trim(alt) === '';
    }
    if (!presentational) return false;
    return !isFocusable(el);
  }

  // ACT e88epe's "ignored svg": an implicit graphics-document role (no
  // explicit role, or role explicitly restated as graphics-document) with
  // no accessible name and not focusable. An svg explicitly given role="img"
  // /"graphics-symbol", an aria-name, a <title>/<desc>, or a tab stop is
  // "included" — a naming question for svg-text-alternative-present, not
  // this rule's "is it decorative" question.
  function isIgnoredSvg(el) {
    const role = getExplicitRole(el);
    if (role && role !== 'graphics-document') return false;
    if (hasAriaNamingAttr(el)) return false;
    if (hasNonEmptyFirstChildTitleOrDesc(el)) return false;
    if (isFocusable(el)) return false;
    return true;
  }

  // ACT e88epe's "ignored canvas": no explicit role at all and no
  // accessible name. Canvas fallback content as a naming mechanism is not
  // modeled here (a separate, narrower question than this rule needs to
  // settle — see docs/DESIGN_CHALLENGES.md).
  function isIgnoredCanvas(el) {
    const role = getExplicitRole(el);
    if (role) return false;
    if (hasAriaNamingAttr(el)) return false;
    return true;
  }

  const AUTHOR_NAME_MECHANISMS = new Set(['aria-label', 'aria-labelledby', 'title', 'label']);

  // ACT e88epe's own exception: never applies under an ancestor already
  // named by the author. The common real case is an icon-only button
  // (<button aria-label="Close"><svg>...</svg></button>) that already has a
  // correct name from the button itself — whether the svg "is decorative"
  // is moot, and flagging it would just be noise on ordinary icon usage.
  function hasAncestorNamedFromAuthor(el) {
    if (!getAccessibleNameInfo) return false;
    const getComposedParent =
      helpers && typeof helpers.composedParent === 'function'
        ? helpers.composedParent
        : (n) => (n && n.parentElement ? n.parentElement : null);

    let cur = getComposedParent(el);
    let guard = 0;
    while (cur && guard++ < 200) {
      if (cur.nodeType === 1) {
        try {
          const info = getAccessibleNameInfo(cur, ctx, { maxRefs: 8 });
          if (
            info &&
            info.present &&
            trim(info.value) &&
            AUTHOR_NAME_MECHANISMS.has(info.mechanism)
          )
            return true;
        } catch {
          // ignore
        }
      }
      cur = getComposedParent(cur);
    }
    return false;
  }

  const els = (() => {
    const sel = 'img, canvas, svg';
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

  if (!uniqueEls.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const el of uniqueEls) {
    if (!el || !el.tagName) continue;
    const tag = el.tagName.toLowerCase();

    if (!isDomVisible(el)) continue;
    if (isOffscreen(el)) continue;

    let excluded = isGenerallyExcluded(el);
    if (!excluded) excluded = isPresentationallyExcluded(el, tag);
    if (!excluded && tag === 'svg') excluded = isIgnoredSvg(el);
    if (!excluded && tag === 'canvas') excluded = isIgnoredCanvas(el);

    if (!excluded) continue;
    if (hasAncestorNamedFromAuthor(el)) continue;

    applicableCount += 1;

    const baseOccurrence = {
      summary: `Review whether this <${tag}> is decorative.`,
      hint: 'Confirm the element is purely decorative. If it conveys information or function, give it a real text alternative (or an accessible name) instead of excluding it.',
      i18n: {
        summaryKey: 'img_altDecorative_summary_cantTell',
        hintKey: 'img_altDecorative_hint_cantTell',
        params: { element: tag }
      },
      data: {
        visibilityFilter: { targetSet: 'acc', accEligible: null, reasons: [] },
        details: { reasonCode: 'EXCLUDED_ELEMENT_REVIEW', element: tag }
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
