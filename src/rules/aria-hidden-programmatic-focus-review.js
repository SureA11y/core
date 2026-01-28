'use strict';

/**
 * @rule a11ycore-aria-hidden-programmatic-focus-review
 * @atomic true
 * @summary aria-hidden elements that are only programmatically focusable should be reviewed
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to elements that are marked aria-hidden (directly or via ancestor)
 *   and are considered eligible only because they are programmatically focusable
 *   (e.g., tabindex < 0), per engine eligibility reasons.
 * @expectation
 *   Manual review: confirm the element should not be exposed to assistive tech
 *   and that focus management is intentional.
 */

const id = 'a11ycore-aria-hidden-programmatic-focus-review';

const meta = {
    title: 'Review aria-hidden programmatic focus',
    description:
        'Flags elements that are aria-hidden but programmatically focusable (tabindex < 0). Verify intended focus management and assistive technology exposure.',
    i18n: {
        titleKey: 'a11ycore_ariaHidden_programmaticFocus_review_title',
        descriptionKey: 'a11ycore_ariaHidden_programmaticFocus_review_description'
    },
    helpUrl: null,
    tags: ['wcag2a', 'wcag412', 'focus', 'aria', 'atomic', 'manual'],
    wcagSc: ['4.1.2'],
    normativeMappings: [],
    defaultSeverity: 'moderate',
    category: 'robust',
    type: 'manual',
    defaultConfidence: 'medium'
};

function runInPage(ctx) {
    const { document, root, helpers, rule } = ctx;
    const safeRoot = root || document;

    const queryAll = helpers && typeof helpers.queryAllSmart === 'function'
        ? helpers.queryAllSmart
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

    // We only need to look at nodes that *might* be in this situation.
    // Keep it deterministic and cheap.
    const candidates = queryAll('[aria-hidden="true"], [aria-hidden="true"] *') || [];
    if (!candidates.length) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }

    const occurrences = [];

    for (const el of candidates) {
        if (!el || !el.getAttribute) continue;

        const info = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;
        const reasons = info && Array.isArray(info.reasons) ? info.reasons : [];

        // We only flag the precise, “low-confidence override” case.
        if (!reasons.includes('ariaHiddenOverriddenProgrammaticFocus')) continue;

        occurrences.push({
            selector: (() => { try { return buildSelector(el); } catch { return 'html'; } })(),
            html: getOuterHtmlSnippet(el),
            summary: 'Review: aria-hidden element is programmatically focusable.',
            hint: 'Check that focus management is intentional and that the element should remain hidden from assistive technologies.',
            i18n: {
                summaryKey: 'a11ycore_ariaHidden_programmaticFocus_review_summary',
                hintKey: 'a11ycore_ariaHidden_programmaticFocus_review_hint'
            },
            data: {
                visibilityFilter: info || { targetSet: 'acc', accEligible: null, reasons: [] }
            }
        });
    }

    if (!occurrences.length) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'moderate', occurrences: [] };
    }

    // Manual rule: never fail.
    return { ruleId: rule.ruleId, outcome: 'cantTell', severity: rule.defaultSeverity || 'minor', occurrences };
}

module.exports = { id, meta, runInPage };
