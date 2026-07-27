'use strict';

/**
 * @check valid-lang
 * @atomic true
 * @summary Any element's lang attribute must be a syntactically valid language tag
 * @standard WCAG 2.2
 * @sc 3.1.2
 * @applicability
 *   Applies to any element other than the root <html> with a non-empty
 *   lang attribute.
 * @expectation
 *   The lang value matches a valid BCP47 language-tag syntax. WCAG 3.1.2
 *   (Language of Parts) requires that when a passage's language differs
 *   from the page's default, it is identified programmatically — an
 *   invalid tag fails to identify a real language at all.
 * @implementation-notes
 * - Distinct, atomic decision from html-lang-attr-present (that
 *   rule covers the root <html> element only, for SC 3.1.1); this rule
 *   covers every other element, for SC 3.1.2.
 * - Same minimal BCP47 *syntax* check as html-lang-attr-present (primary
 *   subtag + optional subtags), not IANA Language Subtag Registry
 *   validation — same documented scope limitation (syntactically
 *   well-formed but unregistered tags like "xx-ZZ" are not flagged).
 */

const id = 'valid-lang';

const meta = {
  title: 'Element lang attribute must be syntactically valid',
  description: 'Checks that any element (other than the root <html>) with a non-empty lang attribute uses a syntactically valid language tag.',
  i18n: {
    titleKey: 'validLang_title',
    descriptionKey: 'validLang_description'
  },
  helpUrl: null,
  tags: ['wcag2aa', 'wcag312', 'structure', 'language', 'atomic', 'automatic'],
  wcagSc: ['3.1.2'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '3.1.2', title: 'Language of Parts', conformanceLevel: 'AA' }
  ],
  defaultSeverity: 'moderate',
  category: 'understandable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '3.1.2': ['element-lang-valid'] } }
};

function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const BCP47_RE = /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/;

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('[lang]', safeRoot) : helpers.queryAll('[lang]', safeRoot);

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;
    if (el.tagName && el.tagName.toLowerCase() === 'html') continue;

    const raw = String(el.getAttribute('lang') || '').trim();
    if (!raw) continue;

    applicableCount += 1;

    if (BCP47_RE.test(raw)) continue;

    const tag = el.tagName.toLowerCase();
    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    occurrences.push({
      selector: stableSelector,
      html,
      summary: `This lang attribute value ("${raw}") is not a syntactically valid language tag.`,
      hint: 'Use a valid BCP47 language tag (e.g. "fr", "es-MX").',
      i18n: {
        summaryKey: 'validLang_summary_fail',
        hintKey: 'validLang_hint_fail',
        params: { element: tag, value: raw }
      },
      data: {
        details: { reasonCode: 'ELEMENT_LANG_INVALID', element: tag, value: raw }
      }
    });
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'moderate', occurrences };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
