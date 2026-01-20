'use strict';

/**
 * @rule a11ycore-form-control-programmatic-label-present
 * @atomic true
 * @summary Form controls must have a programmatic label
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to labelable form controls exposed to assistive technologies:
 *     - input (excluding type=hidden|submit|reset|button|image)
 *     - select
 *     - textarea
 *   role="presentation"/"none" are excluded only when not focusable.
 * @expectation
 *   Each applicable control has a programmatic label via at least one of:
 *     - associated <label> (for/id or wrapping label)
 *     - aria-label (non-empty)
 *     - aria-labelledby resolving to non-empty text
 *     - title attribute resolving to non-empty text
 *     - placeholder attribute resolving to non-empty text
 */

const id = 'a11ycore-form-control-programmatic-label-present';

const meta = {
    title: 'Form controls must have a programmatic label',
    description: 'Checks that form controls have a programmatic label via <label>, aria-label, aria-labelledby, title, or placeholder.',
    i18n: {
        titleKey: 'a11ycore_formControl_programmaticLabelPresent_title',
        descriptionKey: 'a11ycore_formControl_programmaticLabelPresent_description'
    },
    helpUrl: null,
    tags: ['wcag2a', 'wcag131', 'wcag332', 'wcag412', 'forms', 'labels', 'atomic', 'automatic'],
    wcagSc: ['4.1.2'],
    normativeMappings: [
        { standard: 'WCAG', version: '2.2', requirement: '4.1.2', title: 'Name, Role, Value', conformanceLevel: 'A' }
    ],
    defaultSeverity: 'serious',
    category: 'robust',
    type: 'automatic',
    defaultConfidence: 'medium',
    coverage: {
        facetsBySc: {
            '4.1.2': ['form-control-name-present']
        }
    }
};

function runInPage(ctx) {
    const { document, root, helpers, rule } = ctx;
    const safeRoot = root || document;

    const queryAllSmart = helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
    const buildSelector = helpers && typeof helpers.buildSelector === 'function' ? helpers.buildSelector : null;
    const getOuterHtmlSnippet = helpers && typeof helpers.getOuterHtmlSnippet === 'function' ? helpers.getOuterHtmlSnippet : null;

    const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;
    const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function' ? helpers.getEligibilityInfo : null;

    const getFocusableInfo = helpers && typeof helpers.getFocusableInfo === 'function' ? helpers.getFocusableInfo : null;
    const getAriaLabelInfo = helpers && typeof helpers.getAriaLabelInfo === 'function' ? helpers.getAriaLabelInfo : null;
    const getAriaLabelledByInfo = helpers && typeof helpers.getAriaLabelledByInfo === 'function' ? helpers.getAriaLabelledByInfo : null;

    const getAttributeInfo = helpers && typeof helpers.getAttributeInfo === 'function' ? helpers.getAttributeInfo : null;

    const getLabelMethod = helpers && typeof helpers.getLabelMethod === 'function' ? helpers.getLabelMethod : null;

    const trim = (v) => (v == null ? '' : String(v)).trim();

    const metrics = {
        applicableCount: 0,
        passCount: 0,
        failCount: 0,
        byMethod: { label: 0, 'aria-labelledby': 0, 'aria-label': 0, title: 0, placeholder: 0, none: 0 },
        weakPassCount: 0
    };

    function getLabelStrength(method) {
        if (method === 'label' || method === 'aria-labelledby') return 'strong';
        if (method === 'aria-label') return 'medium';
        if (method === 'title' || method === 'placeholder') return 'weak';
        return 'none';
    }

    function getNonEmptyAttr(el, name) {
        if (!getAttributeInfo) return '';
        try {
            const info = getAttributeInfo(el, name);
            return info && info.present ? trim(info.value) : '';
        } catch {
            return '';
        }
    }

    function computeLabelMethodFallback(el) {
        // Deterministic priority order
        if (hasLabelAssociation(el)) return { method: 'label', value: '' };

        if (getAriaLabelledByInfo) {
            try {
                const info = getAriaLabelledByInfo(el, ctx, { maxRefs: 8 });
                const v = info && info.present ? trim(info.value) : '';
                if (v) return { method: 'aria-labelledby', value: v };
            } catch {}
        }

        if (getAriaLabelInfo) {
            try {
                const info = getAriaLabelInfo(el, ctx);
                const v = info && info.present ? trim(info.value) : '';
                if (v) return { method: 'aria-label', value: v };
            } catch {}
        }

        const titleV = getNonEmptyAttr(el, 'title');
        if (titleV) return { method: 'title', value: titleV };

        const phV = getNonEmptyAttr(el, 'placeholder');
        if (phV) return { method: 'placeholder', value: phV };

        return { method: 'none', value: '' };
    }

    function getLabelMethodSafe(el) {
        // Prefer helper if provided, but never trust shape; never throw.
        if (getLabelMethod) {
            try {
                const r = getLabelMethod(el, ctx);
                const m = r && typeof r.method === 'string' ? r.method : 'none';
                const v = r && r.value != null ? trim(r.value) : '';
                // normalize unexpected values deterministically
                if (!Object.prototype.hasOwnProperty.call(metrics.byMethod, m)) return { method: 'none', value: '' };
                return { method: m, value: v };
            } catch {
                // fall through
            }
        }
        return computeLabelMethodFallback(el);
    }

    function safeQueryAll(sel) {
        try {
            if (queryAllSmart) return Array.from(queryAllSmart(sel) || []);
            return safeRoot && safeRoot.querySelectorAll ? Array.from(safeRoot.querySelectorAll(sel)) : [];
        } catch {
            return [];
        }
    }

    function isEligibleAcc(el) {
        if (!isAccTreeEligible) return true;
        try {
            const r = isAccTreeEligible(el, ctx); // signature-safe; helper accepts extra args
            if (typeof r === 'boolean') return r;
            return !!(r && r.eligible);
        } catch {
            return true;
        }
    }

    function isFocusable(el) {
        if (!getFocusableInfo) return false;
        try {
            const fi = getFocusableInfo(el, ctx);
            return !!(fi && fi.focusable);
        } catch {
            return false;
        }
    }

    function hasLabelAssociation(el) {
        // 1) Native labels API (fast/robust when available)
        try {
            if (el && 'labels' in el && el.labels && el.labels.length) return true;
        } catch {}

        // 2) Wrapped by <label>
        try {
            if (el && el.closest) {
                const wrap = el.closest('label');
                if (wrap) return true;
            }
        } catch {}

        // 3) <label for="id">
        try {
            const idAttr = el && el.getAttribute ? trim(el.getAttribute('id')) : '';
            if (!idAttr || !document || !document.querySelector) return false;

            // Avoid reliance on CSS.escape; do best-effort escaping deterministically.
            const esc = idAttr.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
            const sel = `label[for="${esc}"]`;
            return !!document.querySelector(sel);
        } catch {
            return false;
        }
    }

    // Only labelable-ish controls (conservative, deterministic)
    const selector =
        'input:not([type="hidden"]):not([type="submit"]):not([type="reset"]):not([type="button"]):not([type="image"]),select,textarea';

    const nodes = safeQueryAll(selector);

    if (!nodes.length) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [], data: { details: { metrics } } };
    }

    const occurrences = [];

    for (const el of nodes) {
        if (!el || !el.getAttribute) continue;

        // acc eligibility
        if (!isEligibleAcc(el)) continue;

        // role="presentation"/"none" exclusion only when NOT focusable
        const role = (() => {
            try { return trim(el.getAttribute('role')).toLowerCase(); } catch { return ''; }
        })();
        const fi = getFocusableInfo ? getFocusableInfo(el, ctx) : null;
        const tabbable = !!(fi && fi.tabbable);

        if ((role === 'presentation' || role === 'none') && !tabbable) continue;

        metrics.applicableCount += 1;

        const label = getLabelMethodSafe(el);
        metrics.byMethod[label.method] += 1;

        const strength = getLabelStrength(label.method);
        const ok = label.method !== 'none';

        if (ok) {
            metrics.passCount += 1;
            if (strength === 'weak') metrics.weakPassCount += 1;
            continue;
        }

        metrics.failCount += 1;

        const vf = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

        occurrences.push({
            selector: buildSelector ? buildSelector(el) : 'html',
            html: getOuterHtmlSnippet ? getOuterHtmlSnippet(el) : '',
            summary: 'Form control is missing a programmatic label.',
            hint: 'Provide a <label> association, aria-label, aria-labelledby, title, or placeholder.',
            i18n: {
                summaryKey: 'a11ycore_formControl_programmaticLabelPresent_summary_fail',
                hintKey: 'a11ycore_formControl_programmaticLabelPresent_hint_fail',
                params: { element: (el.tagName || '').toLowerCase() }
            },
            data: {
                visibilityFilter: vf
                    ? { targetSet: vf.targetSet, accEligible: vf.accEligible, reasons: vf.reasons }
                    : { targetSet: 'acc', accEligible: null, reasons: [] },
                details: {
                    reasonCode: 'missing_programmatic_label',
                    labelMethod: 'none',
                    labelStrength: 'none'
                }
            }
        });
    }

    if (metrics.applicableCount === 0) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [], data: { details: { metrics } } };
    }
    if (occurrences.length) {
        return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'minor', occurrences, data: { details: { metrics } } };
    }
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [], data: { details: { metrics } } };
}

module.exports = { id, meta, runInPage };
