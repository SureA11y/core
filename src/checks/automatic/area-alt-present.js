'use strict';

/**
 * @check area-alt-present
 * @atomic true
 * @summary Accessible <area> elements must have an alt attribute
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @applicability
 *   Applies to <area> elements that:
 *   1) are in a <map> that is referenced by an <img usemap>, AND
 *   2) the referencing <img> is eligible in the accessibility tree (best-effort), AND
 *   3) the <area> itself is eligible in the accessibility tree (with engine exceptions).
 * @expectation
 *   Each applicable <area> element has an alt attribute.
 *   The alt attribute may be empty (alt="").
 */

const id = 'area-alt-present';

const meta = {
  title: '&lt;area&gt; must have an alt attribute',
  description: 'Checks that &lt;area&gt; elements provide an alt attribute to support a text alternative mechanism.',
  i18n: {
    titleKey: 'area_altPresent_title',
    descriptionKey: 'area_altPresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag111', 'nontext', 'images', 'imagemap', 'atomic', 'automatic'],
  wcagSc: ['1.1.1'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '1.1.1', title: 'Non-text Content', conformanceLevel: 'A' }
  ],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {
    facetsBySc: {
      '1.1.1': ['area-alt-attr-present']
    }
  }
};

function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const queryAllSmart = helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
  const queryAll = helpers && typeof helpers.queryAll === 'function'
      ? helpers.queryAll
      : (sel) => {
        try { return safeRoot && safeRoot.querySelectorAll ? Array.from(safeRoot.querySelectorAll(sel)) : []; }
        catch { return []; }
      };

  const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function'
      ? helpers.getEligibilityInfo
      : null;

  const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function'
      ? helpers.isAccTreeEligible
      : null;

  const getAriaNameInfo = helpers && typeof helpers.getAriaNameInfo === 'function'
      ? helpers.getAriaNameInfo
      : null;

  // --- image-map semantics (rule-local) ---

  function normUsemap(val) {
    try {
      const s = String(val || '').trim();
      if (!s) return '';
      return (s[0] === '#') ? s.slice(1).trim().toLowerCase() : s.toLowerCase();
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

  // Cache mapName -> first referencing <img> in document order (deterministic)
  const __usemapIndex = (() => {
    const idx = new Map();
    try {
      const imgs = document && document.querySelectorAll ? document.querySelectorAll('img[usemap]') : [];
      for (const img of imgs) {
        if (!img || !img.getAttribute) continue;
        const u = normUsemap(img.getAttribute('usemap'));
        if (!u) continue;
        if (!idx.has(u)) idx.set(u, img); // first in document order wins
      }
    } catch {
      // ignore
    }
    return idx;
  })();

  function getReferencingImgForArea(areaEl) {
    try {
      if (!areaEl || !areaEl.closest) return null;
      const map = areaEl.closest('map');
      if (!map) return null;

      const mapName = getMapName(map);
      if (!mapName) return null;

      return __usemapIndex.get(mapName) || null;
    } catch {}
    return null;
  }

  const areas = (() => {
    try { return Array.from((queryAllSmart ? queryAllSmart('area') : queryAll('area')) || []); }
    catch { return queryAll('area'); }
  })();

  if (!areas.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const el of areas) {
    if (!el || !el.getAttribute) continue;

    // 0) Must belong to a *used* image map: an <img usemap> must reference its <map>.
    // If not used, <area> is not applicable (matches your observed focus behavior).
    const img = getReferencingImgForArea(el);
    if (!img) continue;

    // 1) The referencing <img> must itself be eligible in the acc tree.
    // This is the "visibility of map/area doesn't matter; the image does" policy.
    if (isAccTreeEligible) {
      const imgElig = (() => {
        try { return isAccTreeEligible(img, ctx); } catch { return { eligible: true, reasons: [] }; }
      })();
      if (imgElig && imgElig.eligible === false) continue;
    }

    // 2) The <area> itself must be eligible (aria-hidden/inert exceptions handled by helper).
    if (isAccTreeEligible) {
      const elig = (() => {
        try { return isAccTreeEligible(el, ctx); } catch { return { eligible: true, reasons: [] }; }
      })();
      if (elig && elig.eligible === false) continue;
    }

    // From here: applicable
    applicableCount += 1;

    const hasAlt = el.getAttribute('alt') !== null;
    if (hasAlt) continue;

    // aria-label / aria-labelledby is also a valid, standards-recognized
    // text-alternative mechanism for <area> (HTML-AAM accessible name
    // computation includes ARIA naming before falling back to alt).
    if (getAriaNameInfo) {
      let ariaName = null;
      try {
        ariaName = getAriaNameInfo(el, ctx);
      } catch {
        ariaName = null;
      }
      if (ariaName && ariaName.present) continue;
    }

    // A non-empty title attribute is HTML-AAM's own next fallback naming
    // source once alt is entirely absent -- also accepted by a widely-used
    // reference engine's equivalent area-alt rule (non-empty-title, same "any" list as
    // non-empty-alt/aria-label/aria-labelledby). See img-alt-present's
    // sibling fix (2026-07-23, AliExpress's title-only logo <img>) for
    // the real page this was found via -- same gap, same fix, different
    // element.
    const titleRaw = (() => { try { return el.getAttribute('title'); } catch { return null; } })();
    if (titleRaw !== null && String(titleRaw).trim()) continue;

    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

    const baseOccurrence = {
      // Leave selector/html empty so the engine can fill them from __node.
      selector: '',
      html: '',
      summary: 'Missing alt attribute on &lt;area&gt;.',
      hint: 'Add an alt attribute (use alt="" only for decorative areas).',
      i18n: {
        summaryKey: 'area_altPresent_summary_fail',
        hintKey: 'area_altPresent_hint_fail',
        params: { element: 'area' }
      },
      data: {
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
      }
    };

    if (helpers && typeof helpers.reportOccurrence === 'function') {
      occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
    } else {
      // Never compute selector/snippet in the rule.
      occurrences.push({ ...baseOccurrence });
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }

  return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'minor', occurrences };
}

module.exports = { id, meta, runInPage };
