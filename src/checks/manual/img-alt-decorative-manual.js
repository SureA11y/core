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
 *   override; only a literally empty alt, so alt=" " is not one), an
 *   unlabeled <svg> whose implicit role is graphics-document
 *   (no img/graphics-symbol role restatement, aria-name, direct child
 *   <title>/<desc> with text wherever it is among the children, or
 *   focusability), or an unlabeled <canvas> with no explicit role at all.
 *   An element is skipped when an ancestor whose name stands for its
 *   content has an author-supplied name (aria-label, aria-labelledby,
 *   title, or an associated <label>): that name replaces what the image
 *   would have said (the common case: an icon-only button named with
 *   aria-label). Such an ancestor has a role named from its content
 *   (link, button, heading, cell, option, tab, treeitem, menuitem...) or
 *   with presentational children (img, slider, progressbar...). ACT e88epe
 *   skips the element under any ancestor named from author; this rule
 *   still asks under a named landmark, figure, group, region, dialog or
 *   composite widget (listbox, menu, grid...), whose name labels a
 *   container and says nothing of what an image in it shows:
 *   `<figure aria-label="Photo: DR">` credits a photo. A link or button
 *   named by its text does not exempt an image beside the text either: a
 *   file-type, external-link or rating icon can say what the text does
 *   not, and ACT keeps it applicable. An element in an
 *   [inert] subtree, or behind an open modal dialog, is left out as other
 *   hidden content is, as img-alt-present leaves it out: it takes no
 *   interaction and no assistive technology gets it.
 * @expectation
 *   Human review is required to confirm the excluded element is purely
 *   decorative and conveys no information a user would otherwise miss.
 * @reports
 *   - `element`: `img`, `svg` or `canvas`.
 *   - `sameImageCount`: how many of this result's findings show the same
 *     image, this one included: an <img> with the same current source
 *     (`currentSrc`, else `src`), or an inline <svg> with the same root
 *     attributes that change its rendering (viewBox, width, height, class,
 *     style, fill, stroke, color) and the same markup. 1 for a canvas, an
 *     image with no source or markup to compare, or a lazy-loaded <img>
 *     whose `data:` placeholder stands in for a `data-src` or
 *     `data-srcset`.
 *   - `sameImageFirst`: true on the first of them in document order, so a
 *     reader can review one copy and count the rest.
 * @implementation-notes
 * - Every copy of a repeated image stays a finding of its own, as each
 *   element is in core's other rules: a finding's identity is its
 *   element's markup (API_STABILITY.md, Finding identity), each copy has
 *   its own location to review, and the same icon can be decorative in
 *   one place and the only content of a control in another. The two
 *   `sameImage*` details let a report fold the copies instead.
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

  // The role attribute is a fallback list: the first token naming a real
  // role wins, in any case, and none means no explicit role at all.
  function getExplicitRole(el) {
    try {
      return (ariaHelpers && ariaHelpers.getExplicitRole(el)) || '';
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
      const tabindex = dom.getAttribute(el, 'tabindex');
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
      return (
        dom.getAttribute(el, 'aria-label') != null ||
        dom.getAttribute(el, 'aria-labelledby') != null
      );
    } catch {
      return false;
    }
  }

  // A non-empty direct child <title> or <desc>, wherever it is among the
  // children (helpers.getSvgChildText), as svg-text-alternative-present.js
  // reads them.
  function hasNonEmptyTitleOrDesc(svg) {
    try {
      if (!helpers || typeof helpers.getSvgChildText !== 'function') return false;
      return !!(helpers.getSvgChildText(svg, 'title') || helpers.getSvgChildText(svg, 'desc'));
    } catch {
      return false;
    }
  }

  // General exclusion: aria-hidden, or otherwise not included per the
  // shared eligibility model. Visibility is checked separately beforehand,
  // and inert content is left out with other hidden content (queryAllSmart),
  // so a display:none/hidden/inert element never reaches this path.
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
  // only) the native alt="" marker. Both are overridden by focusability, per
  // ARIA conflict resolution (a focusable element is never presentational).
  // Only a literally empty alt is the marker: HTML-AAM maps an img to
  // presentation only for alt="", so alt=" " keeps the img role with an
  // empty name, which img-alt-present fails.
  function isPresentationallyExcluded(el, tag) {
    const role = getExplicitRole(el);
    let presentational = role === 'presentation' || role === 'none';
    if (!presentational && tag === 'img') {
      presentational = dom.getAttribute(el, 'alt') === '';
    }
    if (!presentational) return false;
    return !isFocusable(el);
  }

  // ACT e88epe's "ignored svg": an implicit graphics-document role (no
  // explicit role, or role explicitly restated as graphics-document) with
  // no accessible name and not focusable. An svg explicitly given role="img"
  // /"graphics-symbol", an aria-name, a <title>/<desc>, or a tab stop is
  // "included", a naming question for svg-text-alternative-present, not
  // this rule's "is it decorative" question.
  function isIgnoredSvg(el) {
    const role = getExplicitRole(el);
    if (role && role !== 'graphics-document') return false;
    if (hasAriaNamingAttr(el)) return false;
    if (hasNonEmptyTitleOrDesc(el)) return false;
    if (isFocusable(el)) return false;
    return true;
  }

  // ACT e88epe's "ignored canvas": no explicit role at all and no
  // accessible name. Canvas fallback content as a naming mechanism is not
  // modeled here (a separate, narrower question than this rule needs to
  // settle; see docs/DESIGN_CHALLENGES.md).
  function isIgnoredCanvas(el) {
    const role = getExplicitRole(el);
    if (role) return false;
    if (hasAriaNamingAttr(el)) return false;
    return true;
  }

  const AUTHOR_NAME_MECHANISMS = new Set(['aria-label', 'aria-labelledby', 'title', 'label']);

  // Roles named from their content (WAI-ARIA 1.2 "Name From: contents") or
  // with presentational children: an author name on one stands for what is
  // inside it, image included. Containers and composites are left out.
  const NAME_STANDS_FOR_CONTENT_ROLES = new Set([
    'button',
    'cell',
    'checkbox',
    'columnheader',
    'doc-backlink',
    'doc-biblioref',
    'doc-glossref',
    'doc-noteref',
    'doc-pagebreak',
    'graphics-symbol',
    'gridcell',
    'heading',
    'img',
    'link',
    'menuitem',
    'menuitemcheckbox',
    'menuitemradio',
    'meter',
    'option',
    'progressbar',
    'radio',
    'row',
    'rowheader',
    'scrollbar',
    'separator',
    'slider',
    'switch',
    'tab',
    'tooltip',
    'treeitem'
  ]);

  // The role an ancestor has: its explicit role, unless it is
  // none/presentation and the element is focusable or carries a global ARIA
  // attribute such as aria-label (WAI-ARIA presentational roles conflict
  // resolution), then its native or internals role.
  function resolvedRoleOf(el) {
    const explicit = getExplicitRole(el);
    if (explicit && explicit !== 'none' && explicit !== 'presentation') return explicit;
    if (explicit && !isFocusable(el) && !hasAriaNamingAttr(el)) return '';
    try {
      const info = helpers && helpers.getRoleInfo ? helpers.getRoleInfo(el, ctx) : null;
      if (info && info.role && info.source !== 'explicit') return info.role;
    } catch {
      // fall through to the native role table
    }
    try {
      return (ariaHelpers && ariaHelpers.getNativeRoleForElement(el)) || '';
    } catch {
      return '';
    }
  }

  function composedParentOf(n) {
    if (helpers && typeof helpers.composedParent === 'function') return helpers.composedParent(n);
    return n && dom.parentElement(n) ? dom.parentElement(n) : null;
  }

  // Whether an ancestor whose role is in NAME_STANDS_FOR_CONTENT_ROLES has an
  // author name, which then replaces the image's own, as in
  // <button aria-label="Close"><svg>...</svg></button>.
  function hasAncestorNamingIt(el) {
    let cur = composedParentOf(el);
    let guard = 0;
    while (cur && guard++ < 200) {
      if (dom.nodeType(cur) === 1) {
        const role = resolvedRoleOf(cur);
        if (NAME_STANDS_FOR_CONTENT_ROLES.has(role)) {
          try {
            const info = getAccessibleNameInfo
              ? getAccessibleNameInfo(cur, ctx, { maxRefs: 8 })
              : null;
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
      }
      cur = composedParentOf(cur);
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

  // What makes two reported images the same image, so a reader can review
  // the copies of an icon together: an <img>'s current source, an inline
  // <svg>'s rendering root attributes and markup. A canvas is drawn by
  // script, and a lazy-load placeholder stands for photos not loaded yet.
  const SVG_KEY_ATTRS = ['viewBox', 'width', 'height', 'class', 'style', 'fill', 'stroke', 'color'];
  const LAZY_SRC_ATTRS = ['data-src', 'data-srcset', 'data-lazy-src', 'data-lazy-srcset'];
  function sameImageKey(el, tag) {
    try {
      if (tag === 'img') {
        const src = trim(
          dom.get(el, 'currentSrc') || dom.get(el, 'src') || dom.getAttribute(el, 'src')
        );
        if (/^data:/i.test(src) && LAZY_SRC_ATTRS.some((a) => dom.getAttribute(el, a) != null))
          return '';
        return src ? 'img ' + src : '';
      }
      if (tag === 'svg') {
        const parts = [];
        for (const n of Array.from(dom.childNodes(el) || [])) {
          const t = dom.nodeType(n);
          if (t === 1) parts.push(dom.outerHTML(n) || '');
          else if (t === 3) parts.push(dom.nodeValue(n) || '');
        }
        const body = trim(parts.join('').replace(/\s+/g, ' '));
        if (!body) return '';
        const attrs = SVG_KEY_ATTRS.map((a) => trim(dom.getAttribute(el, a))).join('|');
        return 'svg ' + attrs + ' ' + body;
      }
    } catch {
      // no key: reported on its own
    }
    return '';
  }

  const reported = [];

  for (const el of uniqueEls) {
    if (!el || !dom.tagName(el)) continue;
    const tag = dom.tagName(el).toLowerCase();

    if (!isDomVisible(el)) continue;
    if (isOffscreen(el)) continue;

    let excluded = isGenerallyExcluded(el);
    if (!excluded) excluded = isPresentationallyExcluded(el, tag);
    if (!excluded && tag === 'svg') excluded = isIgnoredSvg(el);
    if (!excluded && tag === 'canvas') excluded = isIgnoredCanvas(el);

    if (!excluded) continue;
    if (hasAncestorNamingIt(el)) continue;

    reported.push({ el, tag, key: sameImageKey(el, tag) });
  }

  const applicableCount = reported.length;
  const countByKey = new Map();
  for (const r of reported) if (r.key) countByKey.set(r.key, (countByKey.get(r.key) || 0) + 1);

  const occurrences = [];
  const seenKeys = new Set();
  for (const { el, tag, key } of reported) {
    const details = {
      reasonCode: 'EXCLUDED_ELEMENT_REVIEW',
      element: tag,
      sameImageCount: key ? countByKey.get(key) : 1,
      sameImageFirst: !key || !seenKeys.has(key)
    };
    if (key) seenKeys.add(key);

    const baseOccurrence = {
      summary: `Check whether this <${tag}> is purely decorative.`,
      hint: 'If it only decorates, nothing needs to change. If it carries information or does something, give it a text alternative that says so.',
      i18n: {
        summaryKey: 'img_altDecorative_summary_cantTell',
        hintKey: 'img_altDecorative_hint_cantTell',
        params: { element: tag }
      },
      data: {
        visibilityFilter: { targetSet: 'acc', accEligible: null, reasons: [] },
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
