'use strict';

/**
 * @rule a11ycore-area-alt-quality
 * @atomic true
 * @summary Manual review: text alternative appropriateness (WCAG 1.1.1)
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @type manual
 * @expectation
 *   Human review is required to confirm that the provided text alternative is accurate and appropriate.
 */

const id = "a11ycore-area-alt-quality";

const meta = {
  title: "<area> alt text must be appropriate (manual review)",
  description: "Flags <area> elements with non-empty alt text for human review of appropriateness.",
  i18n: {
    titleKey: "a11ycore_area_altQuality_title",
    descriptionKey: "a11ycore_area_altQuality_description"
  },
  helpUrl: null,
  tags: ["wcag2a", "wcag111", "nontext", "images", "imagemap", "manual", "atomic"],
  wcagSc: ['1.1.1'],
  normativeMappings: [],
  informativeReferences: [
    { standard: 'WCAG', version: '2.2', requirement: '1.1.1', title: 'Non-text Content', conformanceLevel: 'A' }
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

    const queryAllSmart = helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
    const queryAll = helpers && typeof helpers.queryAll === 'function'
        ? helpers.queryAll
        : (sel) => {
            try { return safeRoot && safeRoot.querySelectorAll ? Array.from(safeRoot.querySelectorAll(sel)) : []; }
            catch { return []; }
        };

    const buildSelector = helpers && typeof helpers.buildSelector === 'function'
        ? helpers.buildSelector
        : (el) => {
            try {
                if (!el || !el.tagName) return 'html';
                const tag = (el.tagName || 'html').toLowerCase();
                return el.id ? `${tag}#${el.id}` : tag;
            } catch { return 'html'; }
        };

    const getOuterHtmlSnippet = helpers && typeof helpers.getOuterHtmlSnippet === 'function'
        ? helpers.getOuterHtmlSnippet
        : (el) => { try { return (el && el.outerHTML) ? String(el.outerHTML).slice(0, 2000) : ''; } catch { return ''; } };

    const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function'
        ? helpers.getEligibilityInfo
        : null;

    const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function'
        ? helpers.isAccTreeEligible
        : null;


// --- image-map semantics (rule-local; match automatic <area> applicability) ---
function normUsemap(val) {
    try {
        const t = String(val || '').trim();
        if (!t) return '';
        return (t[0] === '#') ? t.slice(1).trim().toLowerCase() : t.toLowerCase();
    } catch { return ''; }
}
function getMapName(mapEl) {
    try {
        if (!mapEl || !mapEl.getAttribute) return '';
        const n = String(mapEl.getAttribute('name') || mapEl.getAttribute('id') || '').trim();
        return n ? n.toLowerCase() : '';
    } catch { return ''; }
}
function getReferencingImgForArea(areaEl) {
    try {
        if (!areaEl || !areaEl.closest) return null;
        const map = areaEl.closest('map');
        if (!map) return null;
        const mapName = getMapName(map);
        if (!mapName) return null;

        const imgs = Array.from(document.querySelectorAll('img[usemap]'));
        for (const img of imgs) {
            const u = normUsemap(img.getAttribute('usemap'));
            if (u && u === mapName) return img; // deterministic: first match in doc order
        }
    } catch {}
    return null;
}

    const getFocusableInfo = helpers && typeof helpers.getFocusableInfo === 'function'
        ? helpers.getFocusableInfo
        : null;

    function isRolePresentationExcluded(el) {
        const role = (() => {
            try { return String(el.getAttribute('role') || '').trim().toLowerCase(); }
            catch { return ''; }
        })();
        if (role !== 'presentation' && role !== 'none') return false;

        // Exclude only when NOT focusable (mirrors img-alt-present policy)
        let focusable = false;
        if (getFocusableInfo) {
            const fi = (() => { try { return getFocusableInfo(el, ctx); } catch { return null; } })();
            focusable = !!(fi && fi.focusable);
        } else {
            const tabindex = el.getAttribute('tabindex');
            focusable = tabindex != null && String(tabindex).trim() !== '' && !Number.isNaN(Number(String(tabindex).trim()));
        }
        return !focusable;
    }


    const els = (() => {
        try { return Array.from((queryAllSmart ? queryAllSmart("area") : queryAll("area")) || []); }
        catch { return queryAll("area"); }
    })();

    if (!els.length) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }

    const occurrences = [];
    let applicableCount = 0;

    for (const el of els) {
        if (!el || !el.getAttribute) continue;

// Must belong to a *used* image map (referenced by an <img usemap>). If unused, not applicable.
const img = getReferencingImgForArea(el);
if (!img) continue;

// The referencing <img> must be eligible in the accessibility tree.
if (isAccTreeEligible) {
    const imgElig = (() => { try { return isAccTreeEligible(img, ctx); } catch { return { eligible: true, reasons: [] }; } })();
    if (imgElig && imgElig.eligible === false) continue;
}

        if (isAccTreeEligible) {
            const elig = (() => {
                try { return isAccTreeEligible(el, ctx); } catch { return { eligible: true, reasons: [] }; }
            })();
            if (elig && elig.eligible === false) continue;
        }

        if (isRolePresentationExcluded(el)) continue;

        // Rule-specific applicability (only elements that already have a text alternative mechanism)
        if (!((el.getAttribute('alt') != null && String(el.getAttribute('alt')).trim() !== ''))) continue;

        applicableCount += 1;

        const selectorStr = (() => { try { return buildSelector(el); } catch { return 'html'; } })();
        const html = getOuterHtmlSnippet(el);
        const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

        occurrences.push({
            selector: selectorStr,
            html,
            summary: "Review alt text on <area> for accuracy and appropriateness.",
            hint: "Ensure the alt text identifies the destination/action of the image map area in context.",
            i18n: {
                summaryKey: "a11ycore_area_altQuality_summary_cantTell",
                hintKey: "a11ycore_area_altQuality_hint_cantTell",
                params: { element: (el.tagName || '').toLowerCase() }
            },
            data: {
                visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
                details: null
            }
        });
    }

    if (applicableCount === 0) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }

    return { ruleId: rule.ruleId, outcome: 'cantTell', severity: 'minor', occurrences };
}

module.exports = { id, meta, runInPage };
