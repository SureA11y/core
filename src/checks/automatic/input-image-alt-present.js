'use strict';

/**
 * @check a11ycore-inputImage-alt-present
 * @atomic true
 * @summary Accessible <input type="image"> elements must have an alt attribute
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @applicability
 *   Applies to <input type="image"> elements that are exposed to assistive technologies.
 *   Elements otherwise hidden from the accessibility tree remain applicable
 *   if they are focusable or referenced by IDREF relationships (per engine eligibility checks).
 * @expectation
 *   Each applicable <input type="image"> element has an alt attribute.
 *   The alt attribute may be empty (alt="").
 */

const id = 'a11ycore-input-image-alt-present';

const meta = {
    title: '<input type="image"> must have an alt attribute',
    description:
        'Checks that <input type="image"> elements provide an alt attribute to support a text alternative mechanism.',
    i18n: {
        titleKey: 'a11ycore_inputImage_altPresent_title',
        descriptionKey: 'a11ycore_inputImage_altPresent_description'
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
            '1.1.1': ['input-image-alt-attr-present']
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

    const inputs = (() => {
        try { return Array.from((queryAllSmart ? queryAllSmart('input[type="image"]') : queryAll('input[type="image"]')) || []); }
        catch { return queryAll('input[type="image"]'); }
    })();

    if (!inputs.length) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }

    const occurrences = [];
    let applicableCount = 0;

    for (const el of inputs) {
        if (!el || !el.getAttribute) continue;

        // Applicability: eligible in the acc tree (with helper exceptions).
        if (isAccTreeEligible) {
            const elig = (() => {
                try { return isAccTreeEligible(el, ctx); } catch { return { eligible: true, reasons: [] }; }
            })();
            if (elig && elig.eligible === false) continue;
        }

        applicableCount += 1;

        const hasAlt = el.getAttribute('alt') !== null;
        if (hasAlt) continue;

        // aria-label / aria-labelledby is also a valid, standards-recognized
        // text-alternative mechanism for <input type="image"> (HTML-AAM
        // accessible name computation includes ARIA naming before falling
        // back to alt).
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
        // source once alt is entirely absent -- also accepted by the reference engine's
        // equivalent input-image-alt rule (non-empty-title, same "any" list
        // as non-empty-alt/aria-label/aria-labelledby). See img-alt-present's
        // sibling fix (2026-07-23, AliExpress's title-only logo <img>) for
        // the real page this was found via -- same gap, same fix, different
        // element.
        const titleRaw = (() => { try { return el.getAttribute('title'); } catch { return null; } })();
        if (titleRaw !== null && String(titleRaw).trim()) continue;

        const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

        const baseOccurrence = {
            summary: 'Missing alt attribute on <input type="image">.',
            hint: 'Add an alt attribute (use alt="" only when a separate accessible name is provided).',
            i18n: {
                summaryKey: 'a11ycore_inputImage_altPresent_summary_fail',
                hintKey: 'a11ycore_inputImage_altPresent_hint_fail',
                params: { element: 'input[type=image]' }
            },
            data: {
                visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
            }
        };

        if (helpers && typeof helpers.reportOccurrence === 'function') {
            occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
        } else {
            // Never compute selector/snippet in the rule.
            occurrences.push({ selector: '', html: '', ...baseOccurrence });
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
