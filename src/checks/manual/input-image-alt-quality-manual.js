'use strict';

/**
 * @check a11ycore-input-image-alt-quality
 * @atomic true
 * @summary Manual review: text alternative appropriateness (WCAG 1.1.1)
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @type manual
 * @expectation
 *   Human review is required to confirm that the provided text alternative is accurate and appropriate.
 */

const id = "a11ycore-input-image-alt-quality";

const meta = {
  title: "<input type=\"image\"> alt text must be appropriate (manual review)",
  description: "Flags <input type=\"image\"> elements with non-empty alt text for human review of appropriateness.",
  i18n: {
    titleKey: "a11ycore_inputImage_altQuality_title",
    descriptionKey: "a11ycore_inputImage_altQuality_description"
  },
  helpUrl: null,
  tags: ["wcag2a", "wcag111", "forms", "images", "manual", "atomic"],
  wcagSc: ['1.1.1'],
  normativeMappings: [
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

    const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function'
        ? helpers.getEligibilityInfo
        : null;

    const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function'
        ? helpers.isAccTreeEligible
        : null;

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
        try { return Array.from((queryAllSmart ? queryAllSmart('input[type="image"]') : queryAll('input[type="image"]')) || []); }
        catch { return queryAll('input[type="image"]'); }
    })();

    if (!els.length) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }

    const occurrences = [];
    let applicableCount = 0;

    for (const el of els) {
        if (!el || !el.getAttribute) continue;

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

        const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

        const baseOccurrence = {
            summary: 'Review alt text on <input type="image"> for accuracy and appropriateness.',
            hint: 'Ensure the alt text describes the control’s action (e.g., “Search”, “Submit order”) in context.',
            i18n: {
                summaryKey: 'a11ycore_inputImage_altQuality_summary_cantTell',
                hintKey: 'a11ycore_inputImage_altQuality_hint_cantTell',
                params: { element: 'input[type=image]' }
            },
            data: {
                visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
                details: { alt: String(el.getAttribute('alt') || '') } // optional but useful
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
