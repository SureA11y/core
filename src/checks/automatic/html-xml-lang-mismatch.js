/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check html-xml-lang-mismatch
 * @atomic true
 * @summary The lang and xml:lang attributes on <html> must not disagree
 * @standard WCAG 2.2
 * @sc 3.1.1
 * @applicability
 *   Applies when the <html> element has both a non-empty lang attribute
 *   whose primary language subtag is a known one (ACT 5b7ae0) and a
 *   non-empty xml:lang attribute. A lang naming no known language is
 *   html-lang-attr-present's failure, not this rule's.
 * @expectation
 *   The primary language subtag (the part before the first "-") of lang
 *   and xml:lang match, case-insensitively. When both attributes are
 *   present but declare different languages, assistive technology and
 *   user agents may resolve the page's language inconsistently.
 * @reports
 *   - `lang`, `xmlLang`: the values of the `lang` and `xml:lang`
 *     attributes, as written.
 * @implementation-notes
 * - Distinct, atomic decision from html-lang-attr-present (that
 *   rule checks presence/syntax of lang alone; this rule checks
 *   agreement between lang and xml:lang when both exist).
 * - Compares primary subtags only (not full tag equality), since e.g.
 *   lang="en-US" and xml:lang="en-GB" both correctly declare English and
 *   should not be flagged as disagreeing on language.
 */

const id = 'html-xml-lang-mismatch';

const meta = {
  title: 'lang and xml:lang must not disagree',
  description:
    "Checks that the <html> element's lang and xml:lang attributes declare the same primary language, when both are present.",
  i18n: {
    titleKey: 'htmlXmlLangMismatch_title',
    descriptionKey: 'htmlXmlLangMismatch_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag311', 'structure', 'language', 'atomic', 'automatic'],
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
  coverage: { facetsBySc: { '3.1.1': ['html-xml-lang-mismatch'] } }
};

// This check is inherently whole-document (does the PAGE have this
// property?), not evaluable per-subtree -- notApplicable when contextSelector
// scoped this run narrower than the whole document, or when
// engineOptions.fragment:true was set (see helpers.isWholeDocumentScope).
function applicability(ctx) {
  return ctx.helpers.isWholeDocumentScope ? ctx.helpers.isWholeDocumentScope() : true;
}

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  const html = document && dom.documentElement(document);
  const tag = html && dom.tagName(html) ? String(dom.tagName(html)).toLowerCase() : '';
  if (!html || tag !== 'html') {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const lang = String(dom.getAttribute(html, 'lang') || '').trim();
  const xmlLang = String(dom.getAttribute(html, 'xml:lang') || '').trim();

  if (!lang || !xmlLang) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const primary = (s) => s.split('-')[0].toLowerCase();

  // ACT 5b7ae0 applies only when lang has a known primary language subtag.
  // An unknown one ("xx") is the language rule's failure, not a second one
  // here.
  if (
    typeof helpers.isValidLanguageTag === 'function' &&
    !helpers.isValidLanguageTag(primary(lang))
  ) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  if (primary(lang) === primary(xmlLang)) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }

  const occurrences = [
    helpers.reportOccurrence(html, {
      summary: `The lang ("${lang}") and xml:lang ("${xmlLang}") attributes declare different languages.`,
      hint: 'Make lang and xml:lang declare the same primary language, or remove the deprecated xml:lang attribute.',
      i18n: {
        summaryKey: 'htmlXmlLangMismatch_summary_fail',
        hintKey: 'htmlXmlLangMismatch_hint_fail',
        params: { lang, xmlLang }
      },
      data: {
        details: { reasonCode: 'HTML_XML_LANG_MISMATCH', lang, xmlLang }
      }
    })
  ];

  return {
    ruleId: rule.ruleId,
    outcome: 'fail',
    severity: rule.defaultSeverity || 'serious',
    occurrences
  };
}

module.exports = { id, meta, runInPage, applicability };
