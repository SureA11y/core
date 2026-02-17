'use strict';

/**
 * @check a11ycore-svg-text-alternative-present
 * @atomic true
 * @summary Accessible <svg> elements must provide a text alternative
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @applicability
 *   Applies to inline <svg> elements that are exposed to assistive technologies AND appear intended to be conveyed.
 *   "Intended to be conveyed" is approximated deterministically by at least one of:
 *     - role="img"
 *     - aria-label / aria-labelledby present
 *     - <title> or <desc> present
 *     - focusable/tabbable (e.g., tabindex, native focusability)
 *
 *   Images with role="presentation" or role="none" are excluded only when they are not focusable.
 *   Elements otherwise hidden from the accessibility tree remain applicable
 *   if they are tabbable-focusable or referenced by IDREF relationships (per engine eligibility checks).
 * @expectation
 *   Each applicable <svg> element provides a text alternative via:
 *     - non-empty <title> or <desc> text, OR
 *     - an ARIA name (aria-label / aria-labelledby).
 */

const id = 'a11ycore-svg-text-alternative-present';

const meta = {
    title: '<svg> must provide a text alternative',
    description: 'Checks that inline <svg> elements provide a text alternative via <title>/<desc> or an ARIA name.',
    i18n: {
        titleKey: 'a11ycore_svg_textAltPresent_title',
        descriptionKey: 'a11ycore_svg_textAltPresent_description'
    },
    helpUrl: null,
    tags: ['wcag2a', 'wcag111', 'svg', 'nontext', 'images', 'atomic', 'automatic'],
    wcagSc: ['1.1.1'],
    normativeMappings: [
        {standard: 'WCAG', version: '2.2', requirement: '1.1.1', title: 'Non-text Content', conformanceLevel: 'A'}
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

    const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function'
        ? helpers.getEligibilityInfo
        : null;

    const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function'
        ? helpers.isAccTreeEligible
        : null;

    const getFocusableInfo = helpers && typeof helpers.getFocusableInfo === 'function'
        ? helpers.getFocusableInfo
        : null;

    const getAriaNameInfo = helpers && typeof helpers.getAriaNameInfo === 'function'
        ? helpers.getAriaNameInfo
        : null;

    function trim(v) {
        try {
            return (v == null ? '' : String(v)).trim();
        } catch {
            return '';
        }
    }

    function nonEmptyDirectChildText(svg, localName) {
        try {
            for (let n = svg.firstElementChild; n; n = n.nextElementSibling) {
                const tn = (n.localName || n.tagName || '').toLowerCase();
                if (tn === localName) {
                    const txt = trim(n.textContent);
                    if (txt) return txt;
                }
            }
        } catch {
        }
        return '';
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
            const tabindex = svg && svg.getAttribute ? svg.getAttribute('tabindex') : null;
            return tabindex != null && String(tabindex).trim() !== '' && !Number.isNaN(Number(String(tabindex).trim()));
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
        return {ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: []};
    }

    const occurrences = [];
    let applicableCount = 0;

    for (const el of svgs) {
        if (!el || !el.getAttribute) continue;

        // Applicability step 1: only acc-tree eligible nodes (with helper exceptions)
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

        // Applicability step 2: role (presentation/none) exclusion only when not focusable
        const role = (() => {
            try {
                return String(el.getAttribute('role') || '').trim().toLowerCase();
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
            hasAriaNamingAttr = (el.getAttribute('aria-label') != null) || (el.getAttribute('aria-labelledby') != null);
        } catch {
        }

        const titleText = nonEmptyDirectChildText(el, 'title');
        const descText = titleText ? '' : nonEmptyDirectChildText(el, 'desc'); // avoid second scan if title already passes
        const hasTitleOrDesc = !!(titleText || descText);

        const hasIntent =
            role === 'img' ||
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
                const ariaLabel = trim((() => {
                    try {
                        return el.getAttribute('aria-label');
                    } catch {
                        return '';
                    }
                })());
                const ariaLabelledby = trim((() => {
                    try {
                        return el.getAttribute('aria-labelledby');
                    } catch {
                        return '';
                    }
                })());
                hasAriaName = !!(ariaLabel || ariaLabelledby);
            }
        }

        const ok = hasTitleOrDesc || hasAriaName;
        if (ok) continue;

        let eligInfo = null;
        if (getEligibilityInfo) {
            try { eligInfo = getEligibilityInfo(el, ctx, { targetSet: 'acc' }); } catch { eligInfo = null; }
        }

        const baseOccurrence = {
            summary: 'Missing text alternative for <svg>.',
            hint: 'Provide a <title> or <desc> element with text, or an ARIA name (aria-label/aria-labelledby).',
            i18n: {
                summaryKey: 'a11ycore_svg_textAltPresent_summary_fail',
                hintKey: 'a11ycore_svg_textAltPresent_hint_fail',
                params: {element: 'svg'}
            },
            data: {
                visibilityFilter: eligInfo || {targetSet: 'acc', accEligible: null, reasons: []}
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

    if (!occurrences.length) {
        return {ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: []};
    }

    return {ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'minor', occurrences};
}

module.exports = {id, meta, runInPage};
