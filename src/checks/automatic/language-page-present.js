'use strict';

/**
 * @check html-lang-attr-present
 * @atomic true
 * @summary The default language of the page must be programmatically declared
 * @standard WCAG 2.2
 * @sc 3.1.1
 *
 * @applicability
 *   Applies to HTML documents with a root <html> element.
 *   The rule evaluates the document element only and does not iterate over child nodes.
 *   Non-HTML documents or documents without a document element are not applicable.
 *
 * @expectation
 *   The <html> element has a lang attribute.
 *   The lang attribute is not empty and contains a syntactically valid language tag.
 *
 * @outcomes
 *   Pass:
 *     The <html> element has a non-empty lang attribute with a valid language tag.
 *
 *   Fail:
 *     The <html> element does not have a lang attribute.
 *     The <html> element has a lang attribute that is present but empty or whitespace.
 *     The <html> element has a lang attribute with an invalid language tag.
 *
 * @notes
 *   This rule does not verify that the declared language matches the actual language
 *   of the page content. Language correctness is out of scope for SC 3.1.1.
 *   Changes of language within the page are covered by SC 3.1.2.
 */

const id = 'html-lang-attr-present';

const meta = {
    title: 'Page language is declared',
    description: 'Checks that the default language of the page is programmatically declared.',
    i18n: {
        titleKey: 'html_lang_attr_title',
        descriptionKey: 'html_lang_attr_description'
    },
    helpUrl: null,
    tags: ['wcag2a', 'wcag311', 'structure', 'language', 'automatic', 'atomic'],
    wcagSc: ['3.1.1'],
    normativeMappings: [
        {
            standard: 'WCAG',
            version: '2.2',
            requirement: '3.1.1',
            title: 'Language of Page',
            conformanceLevel: 'A'
        }
    ],
    defaultSeverity: 'serious',
    category: 'understandable',
    type: 'automatic',
    defaultConfidence: 'high',
    coverage: {
        facetsBySc: {
            '3.1.1': ['html-lang-attr-present']
        }
    }
};

// This check is inherently whole-document (does the PAGE have this
// property?), not evaluable per-subtree -- notApplicable when contextSelector
// scoped this run narrower than the whole document, or when
// engineOptions.fragment:true was set (see helpers.isWholeDocumentScope).
function applicability(ctx) {
  return ctx.helpers.isWholeDocumentScope ? ctx.helpers.isWholeDocumentScope() : true;
}

function runInPage(ctx) {
    const { document, rule, helpers } = ctx;
    const html = document && document.documentElement;

    const tag = (html && html.tagName) ? String(html.tagName).toLowerCase() : '';
    if (!html || tag !== 'html') {
        return {
            ruleId: rule.ruleId,
            outcome: 'notApplicable',
            severity: 'minor',
            occurrences: []
        };
    }

    const visibilityFilter = { targetSet: 'acc', accEligible: true, reasons: [] };

    function pushFail(summaryKey, hintKey, params, details) {
        const baseOccurrence = {
            summary: '',
            hint: '',
            i18n: {
                summaryKey,
                hintKey,
                params: params && typeof params === 'object' ? params : {}
            },
            data: {
                visibilityFilter,
                details: details && typeof details === 'object' ? details : {}
            }
        };

        if (helpers && typeof helpers.reportOccurrence === 'function') {
            return [helpers.reportOccurrence(html, baseOccurrence)];
        }

        // Never compute selector/snippet in the rule.
        return [{ selector: '', html: '', ...baseOccurrence }];
    }

    const rawLang = html.getAttribute('lang'); // null if missing
    const lang = (rawLang || '').trim();

    if (rawLang === null) {
        return {
            ruleId: rule.ruleId,
            outcome: 'fail',
            severity: rule.defaultSeverity,
            occurrences: pushFail(
                'html_lang_attr_missing_absent',
                'html_lang_attr_hint_missing_absent',
                {},
                { reasonCode: 'lang-missing', location: 'html' }
            )
        };
    }

    if (lang.length === 0) {
        return {
            ruleId: rule.ruleId,
            outcome: 'fail',
            severity: rule.defaultSeverity,
            occurrences: pushFail(
                'html_lang_attr_missing_empty',
                'html_lang_attr_hint_missing_empty',
                {},
                { reasonCode: 'lang-empty', location: 'html' }
            )
        };
    }

    // Minimal BCP47 primary subtag check
    if (!/^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/.test(lang)) {
        return {
            ruleId: rule.ruleId,
            outcome: 'fail',
            severity: rule.defaultSeverity,
            occurrences: pushFail(
                'html_lang_attr_invalid',
                'html_lang_attr_hint_invalid',
                { lang },
                { reasonCode: 'lang-invalid-bcp47', lang }
            )
        };
    }

    return {
        ruleId: rule.ruleId,
        outcome: 'pass',
        severity: 'minor',
        occurrences: []
    };
}

module.exports = { id, meta, runInPage, applicability };