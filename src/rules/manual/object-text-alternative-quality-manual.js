'use strict';

/**
 * @rule a11ycore-object-text-alternative-quality
 * @atomic true
 * @summary Manual review: text alternative appropriateness (WCAG 1.1.1)
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @type manual
 * @expectation
 *   Human review is required to confirm that the provided text alternative is accurate and appropriate.
 */

const id = "a11ycore-object-text-alternative-quality";

const meta = {
  title: "<object> text alternative must be appropriate (manual review)",
  description: "Flags <object> elements with detected fallback or name for human review of equivalence and appropriateness.",
  i18n: {
    titleKey: "a11ycore_object_textAltQuality_title",
    descriptionKey: "a11ycore_object_textAltQuality_description"
  },
  helpUrl: null,
  tags: ["wcag2a", "wcag111", "nontext", "object", "manual", "atomic"],
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
        try { return Array.from((queryAllSmart ? queryAllSmart("object") : queryAll("object")) || []); }
        catch { return queryAll("object"); }
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
        if (!((function(){
  try {
    const fb = String(el.textContent || '').trim();
    if (fb) return true;
    const ariaLabel = String(el.getAttribute('aria-label') || '').trim();
    if (ariaLabel) return true;
    const ariaLb = String(el.getAttribute('aria-labelledby') || '').trim();
    if (ariaLb && helpers && typeof helpers.getTextFromIdRefs === 'function') {
      const t = helpers.getTextFromIdRefs(ariaLb, ctx);
      if (t && t.text && String(t.text).trim()) return true;
    }
    const title = String(el.getAttribute('title') || '').trim();
    if (title) return true;
    return false;
  } catch { return false; }
})())) continue;

        applicableCount += 1;

        const selectorStr = (() => { try { return buildSelector(el); } catch { return 'html'; } })();
        const html = getOuterHtmlSnippet(el);
        const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

        occurrences.push({
            selector: selectorStr,
            html,
            summary: "Review text alternative for <object> for equivalence and appropriateness.",
            hint: "Confirm the fallback content or ARIA name provides an equivalent alternative for the embedded content.",
            i18n: {
                summaryKey: "a11ycore_object_textAltQuality_summary_cantTell",
                hintKey: "a11ycore_object_textAltQuality_hint_cantTell",
                params: { element: (el.tagName || '').toLowerCase() }
            },
            data: {
                visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
                details: (function(){ try { return { fallbackText: (String(el.textContent||'').trim()||null), ariaLabel: el.getAttribute('aria-label')||null, ariaLabelledBy: el.getAttribute('aria-labelledby')||null, title: el.getAttribute('title')||null }; } catch { return null; } })()
            }
        });
    }

    if (applicableCount === 0) {
        return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }

    return { ruleId: rule.ruleId, outcome: 'cantTell', severity: 'minor', occurrences };
}

module.exports = { id, meta, runInPage };
