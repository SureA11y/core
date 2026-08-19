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
 *   Applies to <area> elements whose alt attribute is present and non-empty.
 *   The <area> must belong to a <map> that an <img usemap> actually
 *   references, and both that <img> and the <area> itself must be included
 *   in the accessibility tree; an <area> in an unused map is out of scope.
 *   role="presentation"/"none" takes an element out unless it is focusable.
 * @expectation
 *   Human review is required to confirm that the provided text alternative is accurate and appropriate.
 */

const id = 'area-alt-quality';

const meta = {
  title: '<area> alt text must be appropriate (manual review)',
  description: 'Flags <area> elements with non-empty alt text for human review of appropriateness.',
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

    // The referencing <img> must be eligible in the accessibility tree.
    if (isAccTreeEligible) {
      const imgElig = accEligibleCached(img);
      if (imgElig && imgElig.eligible === false) continue;
    }

    if (isAccTreeEligible) {
      const elig = accEligibleCached(el);
      if (elig && elig.eligible === false) continue;
    }

    if (isRolePresentationExcluded(el)) continue;

    // Rule-specific applicability (only elements that already have a text alternative mechanism)
    let alt;
    try {
      alt = el.getAttribute('alt');
    } catch {
      alt = null;
    }
    if (alt === null) continue;
    if (String(alt).trim() === '') continue; // only non-empty alt is applicable here

    applicableCount += 1;

    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

    let altVal;
    try {
      altVal = String(el.getAttribute('alt') || '');
    } catch {
      altVal = '';
    }

    const baseOccurrence = {
      summary: 'Review alt text on <area> for accuracy and appropriateness.',
      hint: 'Ensure the alt text identifies the destination/action of the image map area in context.',
      i18n: {
        summaryKey: 'area_altQuality_summary_cantTell',
        hintKey: 'area_altQuality_hint_cantTell',
        params: { element: (el.tagName || '').toLowerCase() }
      },
      data: {
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
        details: { alt: altVal.trim() } // optional but useful for manual review
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
