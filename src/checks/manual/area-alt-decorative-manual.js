'use strict';

/**
 * @check area-alt-decorative
 * @atomic true
 * @summary Manual review: text alternative appropriateness (WCAG 1.1.1)
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @type manual
 * @expectation
 *   Human review is required to confirm that the provided text alternative is accurate and appropriate.
 */

const id = "area-alt-decorative";

const meta = {
    title: "<area> with alt=\"\" must be decorative (manual review)",
    description: "Flags <area> elements with empty alt for human review that they are decorative/non-informative.",
    i18n: {
        titleKey: "area_altDecorative_title",
        descriptionKey: "area_altDecorative_description"
    },
    helpUrl: null,
    tags: ["wcag2a", "wcag111", "nontext", "images", "imagemap", "manual", "atomic"],
    wcagSc: ['1.1.1'],
    normativeMappings: [
        {standard: 'WCAG', version: '2.2', requirement: '1.1.1', title: 'Non-text Content', conformanceLevel: 'A'}
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
    const {document, root, helpers, rule} = ctx;
    const safeRoot = root || document;

    const queryAllSmart = helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
    const queryAll = helpers && typeof helpers.queryAll === 'function'
        ? helpers.queryAll
        : (sel) => {
            try {
                return safeRoot && safeRoot.querySelectorAll ? Array.from(safeRoot.querySelectorAll(sel)) : [];
            } catch {
                return [];
            }
        };

    const __accEligCache = new WeakMap();
    function accEligibleCached(node) {
        if (!isAccTreeEligible) return { eligible: true, reasons: [] };
        if (!node || typeof node !== 'object') return { eligible: true, reasons: [] };
        const cached = __accEligCache.get(node);
        if (cached) return cached;
        let res;
        try { res = isAccTreeEligible(node, ctx); }
        catch { res = { eligible: true, reasons: [] }; }
        res = res && typeof res === 'object' ? res : { eligible: !!res, reasons: [] };
        __accEligCache.set(node, res);
        return res;
    }

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

    const getFocusableInfo = helpers && typeof helpers.getFocusableInfo === 'function'
        ? helpers.getFocusableInfo
        : null;

    function isRolePresentationExcluded(el) {
        const role = (() => {
            try {
                return String(el.getAttribute('role') || '').trim().toLowerCase();
            } catch {
                return '';
            }
        })();
        if (role !== 'presentation' && role !== 'none') return false;

        // Exclude only when NOT focusable (mirrors img-alt-present policy)
        let focusable = false;
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
            focusable = tabindex != null && String(tabindex).trim() !== '' && !Number.isNaN(Number(String(tabindex).trim()));
        }
        return !focusable;
    }


    const els = (() => {
        try {
            return Array.from((queryAllSmart ? queryAllSmart("area") : queryAll("area")) || []);
        } catch {
            return queryAll("area");
        }
    })();

    const __usemapIndex = new Map(); // mapName -> img (first in document order)
    try {
        const imgs = Array.from(document.querySelectorAll('img[usemap]'));
        for (const img of imgs) {
            const u = normUsemap(img.getAttribute('usemap'));
            if (!u) continue;
            if (!__usemapIndex.has(u)) __usemapIndex.set(u, img); // keep first match only
        }
    } catch {
    }

    if (!els.length) {
        return {ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: []};
    }

    const occurrences = [];
    let applicableCount = 0;

    for (const el of els) {
        if (!el || !el.getAttribute) continue;

        // Must belong to a *used* image map (referenced by an <img usemap>). If unused, not applicable.
        let img = null;
        try {
            const map = el.closest && el.closest('map');
            const mapName = map ? getMapName(map) : '';
            img = mapName ? (__usemapIndex.get(mapName) || null) : null;
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
            const elig = (() => {
                try {
                    return isAccTreeEligible(el, ctx);
                } catch {
                    return {eligible: true, reasons: []};
                }
            })();
            if (elig && elig.eligible === false) continue;
        }

        if (isRolePresentationExcluded(el)) continue;

        // Rule-specific applicability (only elements that already have a text alternative mechanism)
        let alt = null;
        try { alt = el.getAttribute('alt'); } catch { alt = null; }
        if (alt === null) continue;
        if (String(alt).trim() !== '') continue; // only alt=""

        applicableCount += 1;

        const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, {targetSet: 'acc'}) : null;

        const baseOccurrence = {
            summary: 'Review whether <area> is decorative (alt="").',
            hint: 'Confirm the area does not convey information or function. If it is interactive or meaningful, provide meaningful alt text.',
            i18n: {
                summaryKey: 'area_altDecorative_summary_cantTell',
                hintKey: 'area_altDecorative_hint_cantTell',
                params: {element: (el.tagName || '').toLowerCase()}
            },
            data: {
                visibilityFilter: eligInfo || {targetSet: 'acc', accEligible: null, reasons: []},
                details: null
            }
        };

        if (helpers && typeof helpers.reportOccurrence === 'function') {
            occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
        } else {
            occurrences.push({selector: '', html: '', ...baseOccurrence});
        }
    }

    if (applicableCount === 0) {
        return {ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: []};
    }

    return {ruleId: rule.ruleId, outcome: 'cantTell', severity: 'minor', occurrences};
}

module.exports = {id, meta, runInPage};
