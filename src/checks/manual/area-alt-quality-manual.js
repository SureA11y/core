/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check area-alt-quality
 * @atomic true
 * @summary Manual review: text alternative appropriateness (WCAG 1.1.1)
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @type manual
 * @applicability
 *   Applies to <area> elements that get a non-empty text alternative from any
 *   source: aria-labelledby (resolving to text), aria-label, alt or title.
 *   The <area> must carry a non-empty href (otherwise it is not a hyperlink
 *   at all per the HTML spec) and belong to a <map> that an <img usemap>
 *   actually references; an <area> in an unused map is out of scope. The
 *   referencing <img> must actually be rendered (hidden/display:none/
 *   visibility exclude it; aria-hidden does not, since <area> is not a DOM
 *   descendant of <img>), and the <area> itself must be eligible: hidden,
 *   display:none and inert on the <area> or its <map> do not exclude it,
 *   since neither generates a box and a real browser's image-map
 *   hit-testing ignores all three there (verified against Chromium and
 *   Firefox); only those mechanisms on a genuine ancestor of the whole
 *   <img>+<map> pairing do. role="presentation"/"none" takes an element out
 *   unless it is focusable.
 * @expectation
 *   Human review is required to confirm that the provided text alternative is
 *   accurate and appropriate. Each occurrence lists every source present
 *   (data.details.sources), so the reviewer checks each one: a title or
 *   aria-label that is not the name still reaches some users.
 * @reports
 *   - `name`: the text alternative the area ends up with, taken from the
 *     first source in `sources`.
 *   - `sources`: each source of text the area has, in the order they are
 *     used for the name: `aria-labelledby`, `aria-label`, `alt`, `title`.
 *   - `alt` (an area with an alt attribute): the alt text.
 */

const id = 'area-alt-quality';

const meta = {
  title: '<area> text alternative must be appropriate (manual review)',
  description:
    'Flags <area> elements with a non-empty text alternative (alt, aria-label, aria-labelledby or title) for human review of appropriateness.',
  i18n: {
    titleKey: 'area_altQuality_title',
    descriptionKey: 'area_altQuality_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag111', 'nontext', 'images', 'imagemap', 'manual', 'atomic'],
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

  const isDomVisibleEligible =
    helpers && typeof helpers.isDomVisibleEligible === 'function'
      ? helpers.isDomVisibleEligible
      : null;

  const __accEligCache = new WeakMap();
  function accEligibleCached(node) {
    if (!isAccTreeEligible) return { eligible: true, reasons: [] };
    if (!node || typeof node !== 'object') return { eligible: true, reasons: [] };
    const c = __accEligCache.get(node);
    if (c) return c;
    let r;
    try {
      r = isAccTreeEligible(node, ctx);
    } catch {
      r = { eligible: true, reasons: [] };
    }
    r = r && typeof r === 'object' ? r : { eligible: !!r, reasons: [] };
    __accEligCache.set(node, r);
    return r;
  }

  const __domVisCache = new WeakMap();
  function domVisibleCached(node) {
    if (!isDomVisibleEligible) return { eligible: true, reasons: [] };
    if (!node || typeof node !== 'object') return { eligible: true, reasons: [] };
    const c = __domVisCache.get(node);
    if (c) return c;
    let r;
    try {
      r = isDomVisibleEligible(node, ctx, { visibilityMode: 'styleOnly', disableGeometry: true });
    } catch {
      r = { eligible: true, reasons: [] };
    }
    r = r && typeof r === 'object' ? r : { eligible: !!r, reasons: [] };
    __domVisCache.set(node, r);
    return r;
  }

  // --- image-map semantics (rule-local; match automatic <area> applicability) ---
  function normUsemap(val) {
    try {
      const t = String(val || '').trim();
      if (!t) return '';
      return t[0] === '#' ? t.slice(1).trim().toLowerCase() : t.toLowerCase();
    } catch {
      return '';
    }
  }
  function getMapName(mapEl) {
    try {
      if (!mapEl || !mapEl.getAttribute) return '';
      const n = String(mapEl.getAttribute('name') || mapEl.getAttribute('id') || '').trim();
      return n ? n.toLowerCase() : '';
    } catch {
      return '';
    }
  }

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

  const getAriaNameInfo =
    helpers && typeof helpers.getAriaNameInfo === 'function' ? helpers.getAriaNameInfo : null;

  // Every non-empty text-alternative source on the element, in accessible-name
  // order: aria-labelledby (when it resolves to text), aria-label, alt, title.
  // aria-labelledby wins over aria-label in the name, but a present aria-label
  // is still listed, so each attribute present is asked about.
  function collectTextAlternativeSources(el) {
    const attr = (name) => {
      try {
        const v = el.getAttribute(name);
        return v == null ? '' : String(v).trim();
      } catch {
        return '';
      }
    };
    const sources = [];
    let name = '';
    let aria = null;
    if (getAriaNameInfo) {
      try {
        aria = getAriaNameInfo(el, ctx);
      } catch {
        aria = null;
      }
    }
    if (aria && aria.present && aria.value) {
      name = String(aria.value).trim();
      sources.push(aria.mechanism);
      if (aria.mechanism === 'aria-labelledby' && attr('aria-label')) sources.push('aria-label');
    } else if (!getAriaNameInfo && attr('aria-label')) {
      name = attr('aria-label');
      sources.push('aria-label');
    }
    const altText = attr('alt');
    if (altText) {
      sources.push('alt');
      if (!name) name = altText;
    }
    const titleText = attr('title');
    if (titleText) {
      sources.push('title');
      if (!name) name = titleText;
    }
    return { sources, name, alt: altText };
  }

  const els = (() => {
    try {
      return Array.from((queryAllSmart ? queryAllSmart('area') : queryAll('area')) || []);
    } catch {
      return queryAll('area');
    }
  })();

  if (!els.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  let applicableCount = 0;

  const __usemapIndex = new Map(); // mapName -> img (first in document order)
  try {
    const imgs = Array.from(document.querySelectorAll('img[usemap]'));
    for (const img of imgs) {
      const u = normUsemap(img.getAttribute('usemap'));
      if (!u) continue;
      if (!__usemapIndex.has(u)) __usemapIndex.set(u, img);
    }
  } catch {}

  for (const el of els) {
    if (!el || !el.getAttribute) continue;

    // Must belong to a *used* image map (referenced by an <img usemap>). If unused, not applicable.
    let img;
    try {
      const map = el.closest && el.closest('map');
      const mapName = map ? getMapName(map) : '';
      img = mapName ? __usemapIndex.get(mapName) || null : null;
    } catch {
      img = null;
    }
    if (!img) continue;

    // Without href an <area> is not a hyperlink at all per the HTML spec,
    // so there is nothing here for this rule to review.
    const hrefRaw = el.getAttribute('href');
    if (!hrefRaw || !hrefRaw.trim()) continue;

    // The referencing <img> must actually be rendered. <area> is not a DOM
    // descendant of <img>, so aria-hidden on the img has nothing to
    // propagate along; hidden/display:none/visibility on the img still
    // excludes it, since that removes the box the hotspot depends on.
    if (isDomVisibleEligible) {
      const imgVis = domVisibleCached(img);
      if (imgVis && imgVis.eligible === false) continue;
    }

    if (isAccTreeEligible) {
      const elig = accEligibleCached(el);
      if (elig && elig.eligible === false) continue;
    }

    if (isRolePresentationExcluded(el)) continue;

    // Applies when any text-alternative source gives the area a non-empty
    // name; each present source is listed so the reviewer checks all of them.
    const alt = collectTextAlternativeSources(el);
    if (!alt.sources.length) continue;

    applicableCount += 1;

    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;
    const sourcesText = alt.sources.join(', ');

    const details = { name: alt.name, sources: alt.sources.slice() };
    if (alt.alt) details.alt = alt.alt;

    const baseOccurrence = {
      summary: `Review the text alternative of this <area> (${sourcesText}) for accuracy and appropriateness.`,
      hint: 'Ensure each listed text alternative identifies the destination/action of the image map area in context.',
      i18n: {
        summaryKey: 'area_altQuality_summary_cantTell',
        hintKey: 'area_altQuality_hint_cantTell',
        params: { element: (el.tagName || '').toLowerCase(), sources: sourcesText }
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
