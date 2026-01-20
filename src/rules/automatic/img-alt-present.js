'use strict';

/**
 * @rule a11ycore-img-alt-present
 * @atomic true
 * @summary Accessible <img> elements must have an alt attribute
 * @standard WCAG 2.2
 * @sc 1.1.1
 * * @applicability
 *  *   Applies to <img> elements that are exposed to assistive technologies.
 *  *   Images with role="presentation" or role="none" are excluded only when they are not focusable.
 *  *   Elements otherwise hidden from the accessibility tree remain applicable
 *  *   if they are focusable or referenced by IDREF relationships (per engine eligibility rules).
 * @expectation
 *   Each applicable <img> element has an alt attribute.
 *   The alt attribute may be empty (alt="").
 */

const id = 'a11ycore-img-alt-present';

const meta = {
    title: '<img> must have an alt attribute',
    description: 'Checks that <img> elements provide an alt attribute to support a text alternative mechanism.',
    i18n: {
        titleKey: 'a11ycore_img_altPresent_title',
        descriptionKey: 'a11ycore_img_altPresent_description'
    },
    helpUrl: null,
    tags: ['wcag2a', 'wcag111', 'nontext', 'images', 'atomic', 'automatic'],
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
            '1.1.1': ['img-alt-attr-present']
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

    const imgs = (() => {
        try { return Array.from((queryAllSmart ? queryAllSmart('img') : queryAll('img')) || []); }
        catch { return queryAll('img'); }
    })();

    if (!imgs.length) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }

    const occurrences = [];
    let applicableCount = 0;

    const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function'
        ? helpers.isAccTreeEligible
        : null;

    const isFocusableInfo = helpers && typeof helpers.getFocusableInfo === 'function'
        ? helpers.getFocusableInfo
        : null;

    for (const el of imgs) {
        if (!el || !el.getAttribute) continue;

        // Applicability: only imgs exposed to assistive tech (with focusable/IDREF exceptions handled by helper)
        let elig = null;
        if (isAccTreeEligible) {
            elig = (() => {
                try { return isAccTreeEligible(el, ctx); } catch { return { eligible: true, reasons: [] }; }
            })();

            if (elig && elig.eligible === false) {
                continue; // ineligible: does not contribute to pass/fail
            }
        }

        // Role (presentation/none)
        const role = (() => {
            try { return String(el.getAttribute('role') || '').trim().toLowerCase(); }
            catch { return ''; }
        })();

        if (role === 'presentation' || role === 'none') {
            // Exclude ONLY if not focusable
            let focusable = false;

            if (isFocusableInfo) {
                const fi = (() => { try { return isFocusableInfo(el, ctx); } catch { return null; } })();
                focusable = !!(fi && fi.focusable);
            } else {
                // deterministic fallback: tabindex presence/valid number
                const tabindex = el.getAttribute('tabindex');
                focusable = tabindex != null && String(tabindex).trim() !== '' && !Number.isNaN(Number(String(tabindex).trim()));
            }

            if (!focusable) {
                continue; // excluded and does not contribute to pass/fail
            }
        }

        // From here: applicable
        applicableCount += 1;

        const hasAlt = el.getAttribute('alt') !== null;
        if (hasAlt) continue;

        const selector = (() => { try { return buildSelector(el); } catch { return 'html'; } })();
        const html = getOuterHtmlSnippet(el);
        const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

        occurrences.push({
            selector,
            html,
            summary: 'Missing alt attribute on <img>.',
            hint: 'Add an alt attribute (use alt="" only for decorative images).',
            i18n: {
                summaryKey: 'a11ycore_img_altPresent_summary_fail',
                hintKey: 'a11ycore_img_altPresent_hint_fail',
                params: { element: 'img' }
            },
            data: {
                visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
            }
        });
    }

    // If no applicable images, rule is not applicable (even if there are imgs in DOM)
    if (applicableCount === 0) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }

    if (!occurrences.length) {
        return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
    }

    return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'minor', occurrences };

}

module.exports = { id, meta, runInPage };
